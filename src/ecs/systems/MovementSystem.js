import { defineQuery, enterQuery, exitQuery } from 'bitecs';
import { Position, Velocity } from '@/ecs/components/index.js';
import Logger from '@/utils/Logger.js';

const logger = Logger.scope('ECS:MovementSystem');

/**
 * Query for entities that have both Position and Velocity components.
 * These entities can be moved by the MovementSystem.
 */
const movementQuery = defineQuery([Position, Velocity]);

/**
 * Query for entities that have just entered the movement system.
 * Used for initialization logic when entities first become movable.
 */
const enteredMovementQuery = enterQuery(movementQuery);

/**
 * Query for entities that have just exited the movement system.
 * Used for cleanup logic when entities are no longer movable.
 */
const exitedMovementQuery = exitQuery(movementQuery);

/**
 * Movement system that updates entity positions based on their velocity.
 * Uses delta time for frame-rate independent movement.
 * 
 * @param {Object} world - The bitECS world instance
 * @returns {Object} The world instance for pipeline chaining
 */
export const movementSystem = (world) => {
  const { time: { delta } } = world;
  
  // Handle entities that just entered the movement system
  const enteredEntities = enteredMovementQuery(world);
  for (let i = 0; i < enteredEntities.length; i++) {
    const eid = enteredEntities[i];
    logger.debug('Entity entered movement system', { eid });
  }
  
  // Apply movement logic to all movable entities
  const entities = movementQuery(world);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    
    // Update position based on velocity and delta time
    // Velocity is stored in pixels per millisecond
    Position.x[eid] += Velocity.x[eid] * delta;
    Position.y[eid] += Velocity.y[eid] * delta;
    
    // Simple boundary check - deactivate enemies that move too far off-screen
    // This prevents them from staying "active" forever and blocking wave completion
    if (Position.y[eid] > 900) { // Screen height is 800, give 100px buffer
      // Move entity to pooled position (deactivate)
      Position.x[eid] = -1000;
      Position.y[eid] = -1000;
      Velocity.x[eid] = 0;
      Velocity.y[eid] = 0;
      
      // Hide sprite if it exists
      if (world.spriteMap && world.spriteMap.get(eid)) {
        const sprite = world.spriteMap.get(eid);
        sprite.setVisible(false);
        sprite.setPosition(-1000, -1000);
      }
      
      // Log deactivation for debugging
      console.log('[DEBUG] MovementSystem - Enemy moved off-screen, deactivated', { eid });
    }
  }
  
  // Handle entities that just exited the movement system  
  const exitedEntities = exitedMovementQuery(world);
  for (let i = 0; i < exitedEntities.length; i++) {
    const eid = exitedEntities[i];
    logger.debug('Entity exited movement system', { eid });
  }
  
  // Log system execution in debug mode
  if (entities.length > 0) {
    logger.debug('Movement system updated', { 
      entityCount: entities.length, 
      deltaTime: delta 
    });
  }
  
  return world;
};

/**
 * Set velocity for an entity. Utility function for other systems.
 * 
 * @param {number} eid - Entity ID
 * @param {number} vx - X velocity in pixels per millisecond
 * @param {number} vy - Y velocity in pixels per millisecond
 * @returns {void}
 */
export const setVelocity = (eid, vx, vy) => {
  Velocity.x[eid] = vx;
  Velocity.y[eid] = vy;
};

/**
 * Get velocity for an entity. Utility function for other systems.
 * 
 * @param {number} eid - Entity ID
 * @returns {Object} Object containing x and y velocity components
 */
export const getVelocity = (eid) => ({
  x: Velocity.x[eid],
  y: Velocity.y[eid]
});

/**
 * Stop an entity by setting its velocity to zero.
 * 
 * @param {number} eid - Entity ID
 * @returns {void}
 */
export const stopEntity = (eid) => {
  Velocity.x[eid] = 0;
  Velocity.y[eid] = 0;
};

logger.debug('Movement system initialized');

export default movementSystem;