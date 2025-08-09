/**
 * ECS Player Entity Creation System
 * Creates player entities using bitECS with all required components
 * Integrates with Phaser sprites via sprite mapping system
 */

import { addEntity, addComponent } from 'bitecs';
import Logger from '@/utils/Logger.js';
import ConfigManager from '@/config/ConfigManager.js';
import { addSpriteMapping, removeSpriteMapping } from '../world.js';

// Import all required ECS components
import {
  Position,
  Velocity,
  Health,
  Input,
  Render,
  Physics,
  Weapon,
  Player
} from '../components/index.js';

const logger = Logger.scope('ECS:CreatePlayer');

/**
 * Create an ECS player entity with all required components and Phaser sprite.
 * 
 * @param {Object} world - The bitECS world instance
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {number} x - X position (defaults to center of screen)
 * @param {number} y - Y position (defaults to bottom of screen)
 * @param {Object} config - Player configuration options
 * @returns {Object} Object containing entity ID and sprite reference
 */
export const createPlayer = (world, scene, x = null, y = null, config = {}) => {
  // Default positions
  const playerX = x ?? scene.scale.width / 2;
  const playerY = y ?? scene.scale.height - 100;
  
  // Get game config
  const gameConfig = ConfigManager.getConfig();
  const constants = ConfigManager.getConstants();
  
  // Create entity
  const eid = addEntity(world);
  
  // Add all required components for player
  addComponent(world, Position, eid);
  addComponent(world, Velocity, eid);
  addComponent(world, Health, eid);
  addComponent(world, Input, eid);
  addComponent(world, Render, eid);
  addComponent(world, Physics, eid);
  addComponent(world, Weapon, eid);
  addComponent(world, Player, eid); // Tag component
  
  // Set Position component values
  Position.x[eid] = playerX;
  Position.y[eid] = playerY;
  
  // Set Velocity component values (initially at rest)
  Velocity.x[eid] = 0;
  Velocity.y[eid] = 0;
  
  // Set Health component values
  const playerHealth = config.health || 100; // Default player health
  Health.current[eid] = playerHealth;
  Health.max[eid] = playerHealth;
  
  // Set Input component values
  Input.moveX[eid] = 0;
  Input.moveY[eid] = 0;
  Input.firing[eid] = 0;
  Input.lastFireTime[eid] = 0;
  Input.fireCooldown[eid] = gameConfig.playerFireCooldown || 200;
  
  // Set Render component values
  Render.spriteId[eid] = 0; // Will be set after sprite creation
  Render.visible[eid] = 1; // Visible
  Render.layer[eid] = 1; // Player layer
  
  // Set Physics component values
  Physics.bodyType[eid] = 1; // Player body type
  Physics.collisionGroup[eid] = 1; // Player collision group
  
  // Set Weapon component values
  const playerSpeed = config.projectileSpeed || 600; // Default projectile speed
  const playerDamage = config.damage || 25; // Default player damage
  
  Weapon.fireRate[eid] = gameConfig.playerFireCooldown || 200;
  Weapon.lastFired[eid] = 0;
  Weapon.damage[eid] = playerDamage;
  Weapon.projectileSpeed[eid] = playerSpeed;
  Weapon.weaponType[eid] = 0; // Player weapon type
  
  // Create Phaser sprite (blue rectangle for development)
  const sprite = scene.add.rectangle(playerX, playerY, 64, 64, constants.COLORS?.PLAYER || 0x0099ff, 1);
  
  // Add to scene and physics
  scene.add.existing(sprite);
  scene.physics.add.existing(sprite);
  
  // Configure physics body
  sprite.body.setCollideWorldBounds(true);
  
  // Add to player group for collision detection
  if (scene.playerGroup) {
    scene.playerGroup.add(sprite);
  }
  
  // Set entity type and ID on sprite for reverse lookup
  sprite.entityType = 'player';
  sprite.entityId = eid;
  
  // Add sprite mapping for ECS-Phaser integration
  addSpriteMapping(world, eid, sprite);
  
  // Update render component with sprite reference
  Render.spriteId[eid] = sprite.id || 0;
  
  logger.debug('Player ECS entity created', {
    entityId: eid,
    position: { x: playerX, y: playerY },
    health: playerHealth,
    spriteId: sprite.id
  });
  
  return {
    entityId: eid,
    sprite
  };
};

/**
 * Deactivate a player entity (for game over scenarios).
 * 
 * @param {Object} world - The bitECS world instance
 * @param {number} eid - Entity ID to deactivate
 * @returns {void}
 */
export const deactivatePlayer = (world, eid) => {
  // Remove sprite mapping
  removeSpriteMapping(world, eid);
  
  // Note: In most cases, we won't remove the player entity completely
  // but rather reset it for respawn or game restart
  
  logger.debug('Player entity deactivated', { entityId: eid });
};

/**
 * Reset player entity to initial state (for respawn scenarios).
 * 
 * @param {Object} world - The bitECS world instance
 * @param {number} eid - Entity ID to reset
 * @param {Phaser.Scene} scene - The Phaser scene
 * @returns {void}
 */
export const resetPlayer = (world, eid, scene) => {
  if (!eid) return;
  
  // Reset position to spawn point
  Position.x[eid] = scene.scale.width / 2;
  Position.y[eid] = scene.scale.height - 100;
  
  // Reset velocity
  Velocity.x[eid] = 0;
  Velocity.y[eid] = 0;
  
  // Reset health to maximum
  const maxHealth = Health.max[eid];
  Health.current[eid] = maxHealth;
  
  // Reset input state
  Input.moveX[eid] = 0;
  Input.moveY[eid] = 0;
  Input.firing[eid] = 0;
  Input.lastFireTime[eid] = 0;
  
  // Reset weapon state
  Weapon.lastFired[eid] = 0;
  
  logger.debug('Player entity reset', { entityId: eid });
};

/**
 * Get player entity from sprite reference.
 * 
 * @param {Phaser.GameObjects.GameObject} sprite - Player sprite
 * @returns {number|null} Entity ID or null if not found
 */
export const getPlayerFromSprite = (sprite) => {
  return sprite?.entityId || null;
};

logger.debug('Player entity creation system initialized');

export default createPlayer;