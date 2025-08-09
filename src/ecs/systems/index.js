// bitECS System Definitions
// Central export point for all ECS systems and pipelines

import Logger from '@/utils/Logger.js';

// Import systems for registry
import movementSystemDefault from './MovementSystem.js';
import renderSystemDefault from './RenderSystem.js';
import weaponSystemDefault from './WeaponSystem.js';
import aiSystemDefault from './AISystem.js';
import timeSystemDefault from './TimeSystem.js';
import projectileSystemDefault from './ProjectileSystem.js';
import playerInputSystemDefault from './PlayerInputSystem.js';

// Import queries for registry
import {
  movementQuery,
  renderQuery,
  playerQuery,
  enemyQuery,
  projectileQuery,
  powerUpQuery,
  weaponQuery,
  aiQuery,
  physicsQuery,
  playerInputQuery,
  playerControlQuery
} from './queries.js';

// Import pipeline constants
import { PIPELINE_MODES, getPipelineInfo } from './pipeline.js';

// Individual Systems
export { default as movementSystem, setVelocity, getVelocity, stopEntity } from './MovementSystem.js';
export { default as renderSystem, setVisibility, setLayer, hideEntity, showEntity, isVisible } from './RenderSystem.js';
export { default as weaponSystem, triggerWeaponFire, setWeaponConfig, getWeaponCooldown, canWeaponFire } from './WeaponSystem.js';
export { default as aiSystem, AI_PATTERNS, setAIPattern, setAITarget, getAIState } from './AISystem.js';
export { default as timeSystem, getCurrentFPS, getElapsedSeconds, getDeltaSeconds, hasTimeElapsed, getTimeRemaining, createTimer, performanceMonitor, interpolation } from './TimeSystem.js';
export { default as projectileSystem } from './ProjectileSystem.js';
export { default as playerInputSystem, setPlayerInput, getPlayerInput, setPlayerFireCooldown } from './PlayerInputSystem.js';

// System Pipeline
export { 
  default as systemPipeline, 
  runSystemPipeline, 
  debugSystemPipeline, 
  testPipeline, 
  createCustomPipeline,
  getPipelineInfo,
  getPipelineForMode,
  PIPELINE_MODES
} from './pipeline.js';

// Query Definitions - re-export all queries from queries.js
export {
  // Core queries
  movementQuery,
  renderQuery,
  
  // Entity type queries
  playerQuery,
  enemyQuery,
  projectileQuery,
  powerUpQuery,
  
  // Functional queries
  weaponQuery,
  healthQuery,
  damageableQuery,
  aiQuery,
  enemyAIQuery,
  physicsQuery,
  collidableQuery,
  projectilePhysicsQuery,
  
  // Complex entity queries
  playerCombatQuery,
  enemyCombatQuery,
  movingEnemiesQuery,
  renderableEnemiesQuery,
  
  // Lifecycle queries
  enteredMovementQuery,
  exitedMovementQuery,
  enteredRenderQuery,
  exitedRenderQuery,
  enteredPlayerQuery,
  exitedPlayerQuery,
  enteredEnemyQuery,
  exitedEnemyQuery,
  enteredProjectileQuery,
  exitedProjectileQuery,
  enteredPowerUpQuery,
  exitedPowerUpQuery,
  enteredAIQuery,
  exitedAIQuery,
  
  // Utility functions
  executeQuery,
  getQueryStats
} from './queries.js';

const logger = Logger.scope('ECS:Systems');

// System Registry for Dynamic Access
export const SYSTEM_REGISTRY = {
  movement: movementSystemDefault,
  render: renderSystemDefault,
  weapon: weaponSystemDefault,
  ai: aiSystemDefault,
  time: timeSystemDefault,
  playerInput: playerInputSystemDefault
};

// Query Registry for Dynamic Access
export const QUERY_REGISTRY = {
  movement: movementQuery,
  render: renderQuery,
  player: playerQuery,
  enemy: enemyQuery,
  projectile: projectileQuery,
  powerUp: powerUpQuery,
  weapon: weaponQuery,
  ai: aiQuery,
  physics: physicsQuery,
  playerInput: playerInputQuery,
  playerControl: playerControlQuery
};

/**
 * Get a system by name from the registry.
 * 
 * @param {string} systemName - Name of the system
 * @returns {Function|null} System function or null if not found
 */
export const getSystem = (systemName) => {
  const system = SYSTEM_REGISTRY[systemName];
  if (!system) {
    logger.warn('System not found in registry', { systemName });
    return null;
  }
  return system;
};

/**
 * Get a query by name from the registry.
 * 
 * @param {string} queryName - Name of the query
 * @returns {Function|null} Query function or null if not found
 */
export const getQuery = (queryName) => {
  const query = QUERY_REGISTRY[queryName];
  if (!query) {
    logger.warn('Query not found in registry', { queryName });
    return null;
  }
  return query;
};

/**
 * Get all available system names.
 * 
 * @returns {string[]} Array of system names
 */
export const getSystemNames = () => Object.keys(SYSTEM_REGISTRY);

/**
 * Get all available query names.
 * 
 * @returns {string[]} Array of query names
 */
export const getQueryNames = () => Object.keys(QUERY_REGISTRY);

/**
 * System information for debugging and monitoring.
 * 
 * @returns {Object} System information object
 */
export const getSystemInfo = () => ({
  totalSystems: Object.keys(SYSTEM_REGISTRY).length,
  totalQueries: Object.keys(QUERY_REGISTRY).length,
  systems: Object.keys(SYSTEM_REGISTRY),
  queries: Object.keys(QUERY_REGISTRY),
  pipelineInfo: getPipelineInfo()
});

/**
 * Validate that all systems are properly exported and accessible.
 * 
 * @returns {Object} Validation results
 */
export const validateSystems = () => {
  const results = {
    valid: true,
    systems: {},
    queries: {},
    errors: []
  };
  
  // Validate systems
  Object.entries(SYSTEM_REGISTRY).forEach(([name, system]) => {
    const isValid = typeof system === 'function';
    results.systems[name] = isValid;
    if (!isValid) {
      results.valid = false;
      results.errors.push(`System '${name}' is not a function`);
    }
  });
  
  // Validate queries
  Object.entries(QUERY_REGISTRY).forEach(([name, query]) => {
    const isValid = typeof query === 'function';
    results.queries[name] = isValid;
    if (!isValid) {
      results.valid = false;
      results.errors.push(`Query '${name}' is not a function`);
    }
  });
  
  return results;
};

// Validate systems on module load
const validation = validateSystems();
if (!validation.valid) {
  logger.error('System validation failed', { errors: validation.errors });
} else {
  logger.debug('All systems validated successfully', {
    systemCount: Object.keys(SYSTEM_REGISTRY).length,
    queryCount: Object.keys(QUERY_REGISTRY).length
  });
}

logger.debug('ECS systems module initialized', {
  systems: getSystemNames(),
  queries: getQueryNames(),
  pipelinesAvailable: Object.keys(PIPELINE_MODES).length
});
