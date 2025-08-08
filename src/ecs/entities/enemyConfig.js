/**
 * ECS Enemy Configuration System
 * Extracted from BaseEntity Enemy.js for ECS enemy creation
 * Centralizes all enemy type configurations, variants, and patterns
 */

import Logger from '@/utils/Logger.js';

const logger = Logger.scope('ECS:EnemyConfig');

// AI Patterns for ECS AI component (matches AISystem patterns)
export const AI_PATTERNS = {
  IDLE: 0,
  CHASE_PLAYER: 1,
  PATROL: 2,
  FLEE: 3,
  CIRCLE: 4,
  ZIGZAG: 5,
  FORMATION: 6
};

/**
 * Get enemy configurations for different types.
 * Extracted from Enemy.getEnemyConfig() static method.
 * 
 * @param {string} enemyType - Enemy type (scout, fighter, bomber)
 * @returns {Object} Enemy configuration object
 */
export const getEnemyConfig = (enemyType) => {
  const configs = {
    scout: {
      size: { width: 32, height: 32 },
      devShapeType: 'small', // Maps to DevShapes.createEnemy() types
      color: 0xff4444, // Light red
      health: 50,
      armor: 0,
      resistance: 0,
      scoreValue: 100,
      canFire: false,
      fireRate: 0,
      fireRange: 0,
      weaponDamage: 0,
      projectileSpeed: 0,
      collisionDamage: 15,
      aggressionLevel: 0.3,
      aiPattern: AI_PATTERNS.PATROL,
      maxSpeed: 120,
      layer: 1, // Render layer
    },

    fighter: {
      size: { width: 48, height: 48 },
      devShapeType: 'medium',
      color: 0xcc2222, // Medium red
      health: 100,
      armor: 5,
      resistance: 0.1,
      scoreValue: 250,
      canFire: true,
      fireRate: 800, // Slower than player
      fireRange: 300,
      weaponDamage: 20,
      projectileSpeed: 400,
      collisionDamage: 25,
      aggressionLevel: 0.6,
      aiPattern: AI_PATTERNS.CHASE_PLAYER,
      maxSpeed: 100,
      layer: 1,
    },

    bomber: {
      size: { width: 64, height: 64 },
      devShapeType: 'large',
      color: 0x881111, // Dark red
      health: 200,
      armor: 15,
      resistance: 0.2,
      scoreValue: 500,
      canFire: true,
      fireRate: 1500, // Very slow
      fireRange: 250,
      weaponDamage: 50,
      projectileSpeed: 300,
      collisionDamage: 40,
      aggressionLevel: 0.4,
      aiPattern: AI_PATTERNS.PATROL,
      maxSpeed: 80,
      layer: 1,
    },
  };

  const config = configs[enemyType] || configs.scout;
  logger.debug(`Retrieved enemy config for type: ${enemyType}`, { 
    health: config.health, 
    canFire: config.canFire,
    aiPattern: config.aiPattern 
  });
  
  return config;
};

/**
 * Create enemy variants for wave progression.
 * Extracted from Enemy.createEliteVariant() static method.
 * 
 * @param {string} baseType - Base enemy type
 * @param {number} level - Elite level (1+)
 * @returns {Object} Elite variant configuration
 */
export const createEliteVariant = (baseType, level = 1) => {
  const config = getEnemyConfig(baseType);
  const multiplier = 1 + level * 0.3; // 30% increase per level

  const eliteConfig = {
    ...config,
    health: Math.floor(config.health * multiplier),
    armor: Math.floor(config.armor * multiplier),
    scoreValue: Math.floor(config.scoreValue * multiplier),
    weaponDamage: Math.floor(config.weaponDamage * multiplier),
    aggressionLevel: Math.min(1, config.aggressionLevel + level * 0.1),
    color: config.color - 0x222222, // Darker color for elite
    maxSpeed: config.maxSpeed * 1.2,
  };

  logger.debug(`Created elite variant: ${baseType} level ${level}`, { 
    healthBonus: eliteConfig.health - config.health,
    speedBonus: eliteConfig.maxSpeed - config.maxSpeed 
  });

  return eliteConfig;
};

/**
 * Create boss variant.
 * Extracted from Enemy.createBossVariant() static method.
 * 
 * @param {string} baseType - Base enemy type
 * @returns {Object} Boss variant configuration
 */
export const createBossVariant = (baseType) => {
  const config = getEnemyConfig(baseType);

  const bossConfig = {
    ...config,
    size: {
      width: config.size.width * 2,
      height: config.size.height * 2,
    },
    devShapeType: 'boss',
    health: config.health * 5,
    armor: config.armor * 3,
    scoreValue: config.scoreValue * 10,
    weaponDamage: config.weaponDamage * 2,
    fireRate: config.fireRate * 0.6, // Faster firing
    aggressionLevel: 0.9,
    color: config.color - 0x440000, // Much darker
    aiPattern: AI_PATTERNS.CIRCLE, // Bosses use circle patterns
    maxSpeed: config.maxSpeed * 0.7, // Slower but more health
    layer: 2, // Higher render layer for bosses
  };

  logger.info(`Created boss variant: ${baseType}`, { 
    healthMultiplier: 5,
    sizeMultiplier: 2,
    scoreMultiplier: 10 
  });

  return bossConfig;
};

/**
 * Get weapon configuration for enemy type.
 * Used by ECS WeaponSystem for enemies with canFire=true.
 * 
 * @param {Object} enemyConfig - Enemy configuration
 * @returns {Object} Weapon configuration for ECS Weapon component
 */
export const getEnemyWeaponConfig = (enemyConfig) => {
  if (!enemyConfig.canFire) {
    return null;
  }

  return {
    damage: enemyConfig.weaponDamage,
    fireRate: enemyConfig.fireRate, // milliseconds
    projectileSpeed: enemyConfig.projectileSpeed,
    range: enemyConfig.fireRange,
    projectileColor: 0xff0000, // Red enemy projectiles
    projectileSize: { width: 6, height: 12 },
    weaponType: 0, // Basic weapon type for ECS
  };
};

/**
 * Get physics configuration for enemy type.
 * Used by ECS Physics component setup.
 * 
 * @param {Object} enemyConfig - Enemy configuration  
 * @returns {Object} Physics configuration
 */
export const getEnemyPhysicsConfig = (enemyConfig) => {
  return {
    bodyType: 1, // Dynamic body
    collisionGroup: 2, // Enemy collision group (different from player=1)
    collisionMask: 0b0101, // Collide with player (1) and projectiles (4) 
    size: {
      width: enemyConfig.size.width * 0.9,  // Slightly smaller collision box
      height: enemyConfig.size.height * 0.9
    },
    offset: {
      x: enemyConfig.size.width * 0.05,
      y: enemyConfig.size.height * 0.05
    }
  };
};

logger.debug('Enemy configuration system initialized');

export default {
  getEnemyConfig,
  createEliteVariant, 
  createBossVariant,
  getEnemyWeaponConfig,
  getEnemyPhysicsConfig,
  AI_PATTERNS
};