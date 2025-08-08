/**
 * ECS Entity Creation System Exports
 * Central export point for all ECS entity creation functions and utilities
 */

import Logger from '@/utils/Logger.js';

// Enemy entity creation and management
export {
  createEnemy,
  deactivateEntity,
  reactivateEntity,
  destroyEnemyEntity,
  getEntityFromSprite,
  isEntityActive,
  setEnemyTarget
} from './createEnemy.js';

// Enemy configuration system
export {
  getEnemyConfig,
  createEliteVariant,
  createBossVariant,
  getEnemyWeaponConfig,
  getEnemyPhysicsConfig,
  AI_PATTERNS
} from './enemyConfig.js';

// Default exports for convenience
export { default as EnemyCreator } from './createEnemy.js';
export { default as EnemyConfig } from './enemyConfig.js';

// Projectiles
export { createProjectile, deactivateProjectile } from './createProjectile.js';

const logger = Logger.scope('ECS:Entities');
logger.debug('ECS entity system exports initialized');
