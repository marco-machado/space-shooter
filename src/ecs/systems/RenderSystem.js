import { defineQuery, enterQuery, exitQuery } from 'bitecs';
import { Position, Render } from '@/ecs/components/index.js';
import { getSpriteForEntity, removeSpriteMapping } from '@/ecs/world.js';
import Logger from '@/utils/Logger.js';

const logger = Logger.scope('ECS:RenderSystem');

/**
 * Query for entities that have both Position and Render components.
 * These entities can be rendered by synchronizing with Phaser sprites.
 */
const renderQuery = defineQuery([Position, Render]);

/**
 * Query for entities that have just entered the render system.
 * Used for sprite initialization and setup.
 */
const enteredRenderQuery = enterQuery(renderQuery);

/**
 * Query for entities that have just exited the render system.
 * Used for sprite cleanup and disposal.
 */
const exitedRenderQuery = exitQuery(renderQuery);

/**
 * Render system that synchronizes bitECS entity positions with Phaser sprites.
 * Handles sprite visibility and position updates based on ECS component data.
 * 
 * @param {Object} world - The bitECS world instance
 * @returns {Object} The world instance for pipeline chaining
 */
export const renderSystem = (world) => {
  // Handle entities that just entered the render system
  const enteredEntities = enteredRenderQuery(world);
  for (let i = 0; i < enteredEntities.length; i++) {
    const eid = enteredEntities[i];
    const sprite = getSpriteForEntity(world, eid);
    
    if (sprite) {
      // Initialize sprite properties based on Render component
      sprite.visible = Render.visible[eid] === 1;
      sprite.depth = Render.layer[eid];
      logger.debug('Entity entered render system', { 
        eid, 
        visible: sprite.visible,
        layer: Render.layer[eid]
      });
    } else {
      logger.warn('Entity entered render system but has no sprite mapping', { eid });
    }
  }
  
  // Synchronize all renderable entities with their sprites
  const entities = renderQuery(world);
  let renderedCount = 0;
  
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const sprite = getSpriteForEntity(world, eid);
    
    if (sprite) {
      // Update sprite position from ECS Position component
      sprite.x = Position.x[eid];
      sprite.y = Position.y[eid];
      
      // Update sprite visibility from ECS Render component
      const shouldBeVisible = Render.visible[eid] === 1;
      if (sprite.visible !== shouldBeVisible) {
        sprite.visible = shouldBeVisible;
      }
      
      // Update sprite layer/depth if needed
      if (sprite.depth !== Render.layer[eid]) {
        sprite.depth = Render.layer[eid];
      }
      
      if (shouldBeVisible) {
        renderedCount++;
      }
    } else {
      logger.warn('Renderable entity has no sprite mapping', { eid });
    }
  }
  
  // Handle entities that just exited the render system
  const exitedEntities = exitedRenderQuery(world);
  for (let i = 0; i < exitedEntities.length; i++) {
    const eid = exitedEntities[i];
    const sprite = getSpriteForEntity(world, eid);
    
    if (sprite) {
      // Hide sprite when entity exits render system
      sprite.visible = false;
      logger.debug('Entity exited render system, sprite hidden', { eid });
    }
    
    // Note: We don't remove sprite mapping here since the entity might re-enter
    // Mapping cleanup should be handled by entity destruction
  }
  
  // Log system execution in debug mode
  if (renderedCount > 0) {
    logger.debug('Render system updated', { 
      totalEntities: entities.length,
      renderedCount,
      hiddenCount: entities.length - renderedCount
    });
  }
  
  return world;
};

/**
 * Set render visibility for an entity.
 * 
 * @param {number} eid - Entity ID
 * @param {boolean} visible - Whether the entity should be visible
 * @returns {void}
 */
export const setVisibility = (eid, visible) => {
  Render.visible[eid] = visible ? 1 : 0;
};

/**
 * Set render layer for an entity.
 * 
 * @param {number} eid - Entity ID  
 * @param {number} layer - Layer depth (0-255)
 * @returns {void}
 */
export const setLayer = (eid, layer) => {
  Render.layer[eid] = Math.max(0, Math.min(255, layer));
};

/**
 * Hide an entity by setting its visibility to false.
 * 
 * @param {number} eid - Entity ID
 * @returns {void}
 */
export const hideEntity = (eid) => {
  setVisibility(eid, false);
};

/**
 * Show an entity by setting its visibility to true.
 * 
 * @param {number} eid - Entity ID
 * @returns {void}
 */
export const showEntity = (eid) => {
  setVisibility(eid, true);
};

/**
 * Check if an entity is currently visible.
 * 
 * @param {number} eid - Entity ID
 * @returns {boolean} True if entity is visible
 */
export const isVisible = (eid) => {
  return Render.visible[eid] === 1;
};

logger.debug('Render system initialized');

export default renderSystem;