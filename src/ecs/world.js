import { createWorld } from 'bitecs';
import Logger from '@/utils/Logger.js';

const logger = Logger.scope('ECSWorld');

/**
 * Initialize a new bitECS world with time management and sprite mapping.
 * 
 * @param {Phaser.Scene} scene - The Phaser scene instance
 * @returns {Object} Initialized bitECS world instance
 */
export const initializeWorld = (scene) => {
  logger.debug('Creating bitECS world');
  
  const world = createWorld();
  
  // Store scene reference for sprite creation
  world.scene = scene;
  
  // Initialize time management
  world.time = {
    delta: 0,
    elapsed: 0,
    then: performance.now()
  };
  
  // Entity-sprite mapping system
  world.spriteMap = new Map();
  
  // World metadata
  world.name = 'SpaceShooterWorld';
  
  logger.debug('bitECS world initialized', { name: world.name, hasScene: !!scene });
  
  return world;
};

/**
 * Update world time with delta from Phaser's update loop.
 * 
 * @param {Object} world - The bitECS world instance
 * @param {number} deltaTime - Time delta in milliseconds from Phaser
 * @returns {void}
 */
export const updateWorldTime = (world, deltaTime) => {
  const { time } = world;
  time.delta = deltaTime;
  time.elapsed += deltaTime;
  // Note: We don't update 'then' since Phaser provides the delta directly
};

/**
 * Map an entity ID to a Phaser sprite for rendering synchronization.
 * 
 * @param {Object} world - The bitECS world instance
 * @param {number} entityId - The entity ID
 * @param {Phaser.GameObject} sprite - The Phaser sprite object
 * @returns {void}
 */
export const addSpriteMapping = (world, entityId, sprite) => {
  world.spriteMap.set(entityId, sprite);
  logger.debug('Added sprite mapping', { entityId, spriteType: sprite.constructor.name });
};

/**
 * Remove sprite mapping for an entity.
 * 
 * @param {Object} world - The bitECS world instance  
 * @param {number} entityId - The entity ID
 * @returns {Phaser.GameObject|null} The removed sprite or null if not found
 */
export const removeSpriteMapping = (world, entityId) => {
  const sprite = world.spriteMap.get(entityId);
  if (sprite) {
    world.spriteMap.delete(entityId);
    logger.debug('Removed sprite mapping', { entityId });
    return sprite;
  }
  return null;
};

/**
 * Get the sprite associated with an entity.
 * 
 * @param {Object} world - The bitECS world instance
 * @param {number} entityId - The entity ID
 * @returns {Phaser.GameObject|undefined} The sprite or undefined if not found
 */
export const getSpriteForEntity = (world, entityId) => {
  return world.spriteMap.get(entityId);
};

/**
 * Clean up world resources and reset state.
 * 
 * @param {Object} world - The bitECS world instance
 * @returns {void}
 */
export const cleanupWorld = (world) => {
  logger.debug('Cleaning up world resources');
  
  // Clear sprite mappings
  world.spriteMap.clear();
  
  // Reset time
  world.time = {
    delta: 0,
    elapsed: 0,
    then: performance.now()
  };
  
  logger.debug('World cleanup completed');
};