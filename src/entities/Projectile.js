import GameConfig from '@/config/GameConfig.js';
import Logger from '@/utils/Logger.js';
import { getEventBus } from '@/event-bus/EventBus.js';
import { EventTypes } from '@/event-bus/EventTypes.js';

/**
 * Factory function to create projectile entities.
 * @param {Phaser.Physics.Arcade.Group} projectileGroup - The physics group to add the projectile to
 * @param {Object} config - Projectile configuration
 * @param {number} config.x - Starting X position
 * @param {number} config.y - Starting Y position
 * @param {number} config.velocityX - X velocity
 * @param {number} config.velocityY - Y velocity
 * @param {number} [config.width] - Projectile width (uses config default if not provided)
 * @param {number} [config.height] - Projectile height (uses config default if not provided)
 * @param {number} [config.color] - Projectile color (uses config default if not provided)
 * @param {number} [config.damage] - Damage value (uses config default if not provided)
 * @param {string} config.owner - Owner type ('player' or 'enemy')
 * @param {number} [config.lifespan] - Auto-destroy timer in milliseconds (optional)
 * @returns {Phaser.GameObjects.Rectangle} The created projectile
 */
export function projectileFactory(projectileGroup, config) {
  const scene = projectileGroup.scene;
  const logger = Logger.scope('ProjectileFactory');
  const eventBus = getEventBus();

  // Validate required parameters
  if (!config.owner || !['player', 'enemy'].includes(config.owner)) {
    logger.error('Invalid or missing owner type. Must be "player" or "enemy"');
    return null;
  }

  // Get default configuration based on owner
  const defaultConfig = config.owner === 'player' 
    ? GameConfig.PROJECTILES.PLAYER 
    : GameConfig.PROJECTILES.ENEMY;

  // Merge config with defaults
  const finalConfig = {
    width: defaultConfig.WIDTH,
    height: defaultConfig.HEIGHT,
    color: defaultConfig.COLOR,
    damage: defaultConfig.DAMAGE,
    ...config
  };

  logger.debug('Creating projectile', {
    owner: config.owner,
    position: { x: finalConfig.x, y: finalConfig.y },
    velocity: { x: finalConfig.velocityX, y: finalConfig.velocityY }
  });

  // Create the projectile as a rectangle
  const projectile = scene.add.rectangle(
    finalConfig.x,
    finalConfig.y,
    finalConfig.width,
    finalConfig.height,
    finalConfig.color
  );

  // Add to physics group
  projectileGroup.add(projectile);

  // Set velocity
  projectile.body.setVelocity(finalConfig.velocityX, finalConfig.velocityY);

  // Disable world bounds collision for projectiles (they should pass through)
  projectile.body.setCollideWorldBounds(false);

  // Store projectile properties
  projectile.damage = finalConfig.damage;
  projectile.owner = finalConfig.owner;

  /**
   * Update projectile state - checks for out of bounds destruction.
   * @returns {void}
   */
  projectile.update = function() {
    // Check if projectile is out of world bounds and destroy it
    const padding = 50; // Allow some padding before destruction
    if (this.x < -padding || 
        this.x > scene.scale.width + padding ||
        this.y < -padding || 
        this.y > scene.scale.height + padding) {
      this.destroy();
    }
  };

  /**
   * Enhanced destroy method that emits events.
   * @returns {void}
   */
  const originalDestroy = projectile.destroy.bind(projectile);
  projectile.destroy = function() {
    logger.debug('Destroying projectile', { owner: this.owner });
    eventBus.emit(EventTypes.PROJECTILE_DESTROYED, { 
      projectile: this,
      owner: this.owner 
    });
    originalDestroy();
  };

  // Set up automatic lifespan destruction if specified
  if (finalConfig.lifespan && finalConfig.lifespan > 0) {
    scene.time.delayedCall(finalConfig.lifespan, () => {
      if (projectile && projectile.active) {
        projectile.destroy();
      }
    });
  }

  // Emit creation event
  eventBus.emit(EventTypes.PROJECTILE_CREATED, { 
    projectile: projectile,
    owner: finalConfig.owner 
  });

  logger.debug('Projectile created successfully', { 
    owner: finalConfig.owner,
    id: projectile.name || 'unnamed'
  });

  return projectile;
}

/**
 * Helper function to create a player projectile with standard configuration.
 * @param {Phaser.Physics.Arcade.Group} projectileGroup - The physics group
 * @param {number} x - Starting X position
 * @param {number} y - Starting Y position
 * @param {number} [velocityY=-400] - Y velocity (negative for upward movement)
 * @returns {Phaser.GameObjects.Rectangle} The created projectile
 */
export function createPlayerProjectile(projectileGroup, x, y, velocityY = -GameConfig.PROJECTILES.PLAYER.SPEED) {
  return projectileFactory(projectileGroup, {
    x: x,
    y: y,
    velocityX: 0,
    velocityY: velocityY,
    owner: 'player'
  });
}

/**
 * Helper function to create an enemy projectile with standard configuration.
 * @param {Phaser.Physics.Arcade.Group} projectileGroup - The physics group
 * @param {number} x - Starting X position
 * @param {number} y - Starting Y position
 * @param {number} [velocityY=200] - Y velocity (positive for downward movement)
 * @returns {Phaser.GameObjects.Rectangle} The created projectile
 */
export function createEnemyProjectile(projectileGroup, x, y, velocityY = GameConfig.PROJECTILES.ENEMY.SPEED) {
  return projectileFactory(projectileGroup, {
    x: x,
    y: y,
    velocityX: 0,
    velocityY: velocityY,
    owner: 'enemy'
  });
}