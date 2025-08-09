import { defineQuery } from 'bitecs';
import { Position, Velocity, Input, Player, Weapon } from '@/ecs/components/index.js';
import { createProjectile } from '@/ecs/entities/createProjectile.js';
import ConfigManager from '@/config/ConfigManager.js';
import Logger from '@/utils/Logger.js';

const logger = Logger.scope('ECS:PlayerInputSystem');

/**
 * Query for player entities that can receive input.
 * These entities must have Position, Velocity, Input, and Player components.
 */
const playerInputQuery = defineQuery([Position, Velocity, Input, Player]);

/**
 * Player Input System that handles keyboard input and movement for player entities.
 * Processes input state and updates velocity accordingly.
 * Also handles weapon firing logic.
 * 
 * @param {Object} world - The bitECS world instance
 * @returns {Object} The world instance for pipeline chaining
 */
export const playerInputSystem = (world) => {
  const scene = world.scene;
  if (!scene || !scene.input || !scene.input.keyboard) {
    return world;
  }
  
  const { time: { delta, elapsed } } = world;
  const constants = ConfigManager.getConstants();
  
  // Get keyboard input
  const cursors = scene.input.keyboard.cursors;
  const wasdKeys = scene.input.keyboard.addKeys('W,S,A,D');
  const spaceKey = scene.input.keyboard.addKey('SPACE');
  
  // Movement speed (pixels per millisecond)
  const playerSpeed = 400 / 1000; // Default player speed in pixels per ms
  
  // Process all player entities
  const entities = playerInputQuery(world);
  
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    
    // Process movement input
    let moveX = 0;
    let moveY = 0;
    
    // Arrow keys or WASD
    if (cursors.left.isDown || wasdKeys.A.isDown) {
      moveX -= 1;
    }
    if (cursors.right.isDown || wasdKeys.D.isDown) {
      moveX += 1;
    }
    if (cursors.up.isDown || wasdKeys.W.isDown) {
      moveY -= 1;
    }
    if (cursors.down.isDown || wasdKeys.S.isDown) {
      moveY += 1;
    }
    
    // Normalize diagonal movement
    if (moveX !== 0 && moveY !== 0) {
      const length = Math.sqrt(moveX * moveX + moveY * moveY);
      moveX /= length;
      moveY /= length;
    }
    
    // Update Input component state
    Input.moveX[eid] = moveX;
    Input.moveY[eid] = moveY;
    
    // Update Velocity component based on input
    Velocity.x[eid] = moveX * playerSpeed;
    Velocity.y[eid] = moveY * playerSpeed;
    
    // Handle weapon firing
    const isFiring = spaceKey.isDown;
    const currentTime = elapsed;
    const fireCooldown = Input.fireCooldown[eid];
    const lastFireTime = Input.lastFireTime[eid];
    
    Input.firing[eid] = isFiring ? 1 : 0;
    
    // Check if we can fire
    if (isFiring && (currentTime - lastFireTime) >= fireCooldown) {
      // Fire projectile
      const playerX = Position.x[eid];
      const playerY = Position.y[eid];
      
      // Create projectile above the player
      createProjectile(
        world,
        playerX,
        playerY - 32, // Offset above player sprite
        { owner: 'player' }
      );
      
      // Update last fire time
      Input.lastFireTime[eid] = currentTime;
      
      // Also update Weapon component if present
      if (Weapon.lastFired) {
        Weapon.lastFired[eid] = currentTime;
      }
      
      logger.debug('Player fired projectile', {
        entityId: eid,
        position: { x: playerX, y: playerY - 32 }
      });
    }
  }
  
  // Log system execution in debug mode
  if (entities.length > 0) {
    logger.debug('Player input system updated', {
      entityCount: entities.length,
      deltaTime: delta
    });
  }
  
  return world;
};

/**
 * Set player input state programmatically (useful for AI or testing).
 * 
 * @param {number} eid - Entity ID
 * @param {number} moveX - X movement (-1 to 1)
 * @param {number} moveY - Y movement (-1 to 1)
 * @param {boolean} firing - Whether firing
 * @returns {void}
 */
export const setPlayerInput = (eid, moveX, moveY, firing = false) => {
  Input.moveX[eid] = Math.max(-1, Math.min(1, moveX));
  Input.moveY[eid] = Math.max(-1, Math.min(1, moveY));
  Input.firing[eid] = firing ? 1 : 0;
};

/**
 * Get current player input state.
 * 
 * @param {number} eid - Entity ID
 * @returns {Object} Input state object
 */
export const getPlayerInput = (eid) => ({
  moveX: Input.moveX[eid],
  moveY: Input.moveY[eid],
  firing: Input.firing[eid] === 1,
  lastFireTime: Input.lastFireTime[eid],
  fireCooldown: Input.fireCooldown[eid]
});

/**
 * Update player fire cooldown.
 * 
 * @param {number} eid - Entity ID
 * @param {number} cooldown - New cooldown in milliseconds
 * @returns {void}
 */
export const setPlayerFireCooldown = (eid, cooldown) => {
  Input.fireCooldown[eid] = cooldown;
  
  // Also update Weapon component if present
  if (Weapon.fireRate) {
    Weapon.fireRate[eid] = cooldown;
  }
};

logger.debug('Player input system initialized');

export default playerInputSystem;