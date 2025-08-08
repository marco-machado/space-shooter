/**
 * ECS Enemy Entity Creation System
 * Creates enemy entities using bitECS with all required components
 * Integrates with Phaser sprites via sprite mapping system
 */

import { addEntity, addComponent, hasComponent } from 'bitecs';
import Logger from '@/utils/Logger.js';
import DevShapes from '@/graphics/DevShapes.js';
import { addSpriteMapping, removeSpriteMapping } from '../world.js';

// Import all required ECS components
import {
  Position,
  Velocity, 
  Health,
  AI,
  Render,
  Physics,
  Weapon,
  Enemy
} from '../components/index.js';

// Import enemy configurations
import { getEnemyConfig, getEnemyWeaponConfig, getEnemyPhysicsConfig } from './enemyConfig.js';

const logger = Logger.scope('ECS:CreateEnemy');

/**
 * Create an ECS enemy entity with all required components and Phaser sprite.
 * 
 * @param {Object} world - The bitECS world instance
 * @param {Phaser.Scene} scene - The Phaser scene 
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {string} enemyType - Enemy type (scout, fighter, bomber)
 * @returns {number} The created entity ID
 */
export const createEnemy = (world, scene, x, y, enemyType = 'scout') => {
  // Get enemy configuration
  const config = getEnemyConfig(enemyType);
  
  // Create entity
  const eid = addEntity(world);
  
  // Add all required components for enemies
  addComponent(world, Position, eid);
  addComponent(world, Velocity, eid); 
  addComponent(world, Health, eid);
  addComponent(world, AI, eid);
  addComponent(world, Render, eid);
  addComponent(world, Physics, eid);
  addComponent(world, Enemy, eid); // Tag component
  
  // Set Position component values
  Position.x[eid] = x;
  Position.y[eid] = y;
  
  // Set Velocity component values (initially at rest)
  Velocity.x[eid] = 0;
  Velocity.y[eid] = 0;
  
  // Set Health component values
  Health.current[eid] = config.health;
  Health.max[eid] = config.health;
  
  // Set AI component values
  AI.pattern[eid] = config.aiPattern;
  AI.targetEntity[eid] = 0; // Will be set to player entity later
  // Initialize pattern data array with zeros
  for (let i = 0; i < 8; i++) {
    AI.patternData[eid][i] = 0;
  }
  
  // Set Render component values
  Render.spriteId[eid] = 0; // Will be set after sprite creation
  Render.visible[eid] = 1; // Visible
  Render.layer[eid] = config.layer;
  
  // Set Physics component values
  const physicsConfig = getEnemyPhysicsConfig(config);
  Physics.bodyType[eid] = physicsConfig.bodyType;
  Physics.collisionGroup[eid] = physicsConfig.collisionGroup;
  
  // Add Weapon component if enemy can fire
  if (config.canFire) {
    addComponent(world, Weapon, eid);
    const weaponConfig = getEnemyWeaponConfig(config);
    
    Weapon.fireRate[eid] = weaponConfig.fireRate;
    Weapon.lastFired[eid] = 0;
    Weapon.damage[eid] = weaponConfig.damage;
    Weapon.projectileSpeed[eid] = weaponConfig.projectileSpeed;
    Weapon.weaponType[eid] = weaponConfig.weaponType;
  }
  
  // Create Phaser sprite using DevShapes
  const sprite = DevShapes.createEnemy(scene, x, y, config.devShapeType);
  
  // Store entity reference on sprite for collision detection bridge
  sprite.entityId = eid;
  sprite.entityType = 'enemy';
  sprite.enemyType = enemyType; // Store enemy type for score calculation
  
  // Add sprite to entity mapping
  addSpriteMapping(world, eid, sprite);
  
  // Add to scene's enemy group for collision detection  
  if (scene.enemyGroup) {
    scene.enemyGroup.add(sprite);
  } else {
    logger.warn('createEnemy - No enemyGroup found on scene!');
  }
  
  // Set sprite render depth
  sprite.setDepth(config.layer);
  
  logger.debug(`ECS enemy created: ${enemyType} entity ${eid} at (${x}, ${y})`);
  
  return eid;
};

/**
 * Deactivate an ECS enemy entity for pooling.
 * Moves entity off-screen and makes sprite invisible without destroying components.
 * 
 * @param {Object} world - The bitECS world instance  
 * @param {number} eid - Entity ID to deactivate
 * @returns {void}
 */
export const deactivateEntity = (world, eid) => {
  // Move entity off-screen
  Position.x[eid] = -1000;
  Position.y[eid] = -1000;
  
  // Reset velocity
  Velocity.x[eid] = 0;
  Velocity.y[eid] = 0;
  
  // Make invisible 
  if (hasComponent(world, Render, eid)) {
    Render.visible[eid] = 0;
  }
  
  // Get and hide sprite
  const sprite = world.spriteMap.get(eid);
  if (sprite) {
    sprite.setVisible(false);
    sprite.setPosition(-1000, -1000);
  }
  
  logger.debug(`Entity ${eid} deactivated`);
};

/**
 * Reactivate an ECS enemy entity from pool.
 * Restores entity to specified position and makes sprite visible.
 * 
 * @param {Object} world - The bitECS world instance
 * @param {number} eid - Entity ID to reactivate  
 * @param {number} x - New X position
 * @param {number} y - New Y position  
 * @param {string} enemyType - Enemy type for resetting configuration
 * @returns {void}
 */
export const reactivateEntity = (world, eid, x, y, enemyType = 'scout') => {
  // Get fresh config for reactivation (in case enemy type changed)
  const config = getEnemyConfig(enemyType);
  
  // Set new position
  Position.x[eid] = x;
  Position.y[eid] = y;
  
  // Reset velocity - TEMP: Give enemies downward velocity for testing
  Velocity.x[eid] = 0;
  Velocity.y[eid] = 0.05; // 0.05 pixels per millisecond = 50 pixels per second downward
  
  
  // Reset health to full
  Health.current[eid] = config.health;
  Health.max[eid] = config.health;
  
  // Reset AI - TEMP: Use a simple downward movement pattern
  AI.pattern[eid] = 0; // Use IDLE for now, but we'll modify IDLE to move downward
  AI.targetEntity[eid] = 0;
  for (let i = 0; i < 8; i++) {
    AI.patternData[eid][i] = 0;
  }
  
  // Make visible
  if (hasComponent(world, Render, eid)) {
    Render.visible[eid] = 1;
  }
  
  // Reset weapon if applicable
  if (config.canFire && hasComponent(world, Weapon, eid)) {
    Weapon.lastFired[eid] = 0;
    const weaponConfig = getEnemyWeaponConfig(config);
    Weapon.damage[eid] = weaponConfig.damage;
    Weapon.fireRate[eid] = weaponConfig.fireRate;
    Weapon.projectileSpeed[eid] = weaponConfig.projectileSpeed;
  }
  
  // Show and reposition sprite
  const sprite = world.spriteMap.get(eid);
  if (sprite) {
    sprite.setVisible(true);
    sprite.setPosition(x, y);
  }
  
  logger.debug(`Entity ${eid} reactivated as ${enemyType} at (${x}, ${y})`);
};

/**
 * Destroy an ECS enemy entity completely.
 * Removes all components, sprite mapping, and Phaser sprite.
 * 
 * @param {Object} world - The bitECS world instance
 * @param {number} eid - Entity ID to destroy
 * @param {Phaser.Scene} scene - The Phaser scene (for removing from groups)
 * @returns {void}
 */
export const destroyEnemyEntity = (world, eid, scene) => {
  logger.debug(`Destroying ECS enemy entity ${eid}`);
  
  // Get sprite before removing mapping
  const sprite = world.spriteMap.get(eid);
  
  // Remove sprite mapping
  removeSpriteMapping(world, eid);
  
  // Remove sprite from scene groups and destroy
  if (sprite) {
    if (scene.enemyGroup) {
      scene.enemyGroup.remove(sprite);
    }
    sprite.destroy();
  }
  
  // Note: Entity and components will be handled by bitECS removeEntity if needed
  // For pooling systems, we typically just deactivate rather than fully destroy
  
  logger.debug(`ECS enemy entity ${eid} destroyed`);
};

/**
 * Get entity ID from a Phaser sprite (for collision detection bridge).
 * 
 * @param {Phaser.GameObject} sprite - Phaser sprite object  
 * @returns {number|null} Entity ID or null if not found
 */
export const getEntityFromSprite = (sprite) => {
  return sprite.entityId || null;
};

/**
 * Check if an entity is currently active (not pooled/deactivated).
 * 
 * @param {Object} world - The bitECS world instance
 * @param {number} eid - Entity ID to check
 * @returns {boolean} True if entity is active
 */
export const isEntityActive = (world, eid) => {
  if (!hasComponent(world, Position, eid)) {
    return false;
  }
  
  // Check if entity is off-screen (pooled)
  const x = Position.x[eid];
  const y = Position.y[eid];
  
  return x > -999 && y > -999; // Not in pooled position
};

/**
 * Set the target entity for AI system (typically the player).
 * 
 * @param {Object} world - The bitECS world instance
 * @param {number} enemyEid - Enemy entity ID
 * @param {number} targetEid - Target entity ID (player)
 * @returns {void}
 */
export const setEnemyTarget = (world, enemyEid, targetEid) => {
  if (hasComponent(world, AI, enemyEid)) {
    AI.targetEntity[enemyEid] = targetEid;
    logger.debug(`Set enemy ${enemyEid} target to entity ${targetEid}`);
  }
};

logger.debug('ECS Enemy creation system initialized');

export default {
  createEnemy,
  deactivateEntity,
  reactivateEntity, 
  destroyEnemyEntity,
  getEntityFromSprite,
  isEntityActive,
  setEnemyTarget
};