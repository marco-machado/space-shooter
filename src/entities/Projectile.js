import GameConfig from '@/config/GameConfig.js';
import Logger from '@/utils/Logger.js';

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
 * @param {string} [config.weaponType] - Weapon type ('laser', 'plasma', 'missile')
 * @param {Object} [config.upgradeEffects] - Upgrade effects to apply
 * @param {number} [config.lifespan] - Auto-destroy timer in milliseconds (optional)
 * @param {number} [config.piercing] - Number of enemies this projectile can pierce through
 * @returns {Phaser.GameObjects.Rectangle} The created projectile
 */
export function projectileFactory(projectileGroup, config) {
  const scene = projectileGroup.scene;
  const logger = Logger.scope('ProjectileFactory');

  // Validate required parameters
  if (!config.owner || !['player', 'enemy'].includes(config.owner)) {
    logger.error('Invalid or missing owner type. Must be "player" or "enemy"');
    return null;
  }

  // Get default configuration based on owner
  const defaultConfig =
    config.owner === 'player' ? GameConfig.PROJECTILES.PLAYER : GameConfig.PROJECTILES.ENEMY;

  // Merge config with defaults
  const finalConfig = {
    width: defaultConfig.WIDTH,
    height: defaultConfig.HEIGHT,
    color: defaultConfig.COLOR,
    damage: defaultConfig.DAMAGE,
    ...config,
  };

  logger.debug('Creating projectile', {
    owner: config.owner,
    position: { x: finalConfig.x, y: finalConfig.y },
    velocity: { x: finalConfig.velocityX, y: finalConfig.velocityY },
  });

  // Create the projectile as a rectangle
  const projectile = scene.add.rectangle(
    finalConfig.x,
    finalConfig.y,
    finalConfig.width,
    finalConfig.height,
    finalConfig.color,
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
  projectile.weaponType = finalConfig.weaponType || 'laser';
  projectile.upgradeEffects = finalConfig.upgradeEffects || {};
  projectile.piercing = finalConfig.piercing || 0;
  projectile.piercedEnemies = 0; // Track how many enemies have been pierced
  projectile.isTracking = false; // For missile tracking
  projectile.trackingTarget = null; // Current tracking target
  projectile.initialVelocityX = finalConfig.velocityX;
  projectile.initialVelocityY = finalConfig.velocityY;

  /**
   * Update projectile state - handles tracking, bounds checking, and weapon-specific behavior.
   * @param {Array} [enemyTargets] - Array of enemy targets for missile tracking
   * @returns {void}
   */
  projectile.update = function (enemyTargets = []) {
    // Handle missile tracking behavior
    if (this.weaponType === 'missile' && this.upgradeEffects.missileTrackingEnabled) {
      this.updateMissileTracking(enemyTargets);
    }
    
    // Check if projectile is out of world bounds and destroy it
    const padding = 50; // Allow some padding before destruction
    if (
      this.x < -padding ||
      this.x > scene.scale.width + padding ||
      this.y < -padding ||
      this.y > scene.scale.height + padding
    ) {
      this.destroy();
    }
  };

  /**
   * Update missile tracking behavior
   * @param {Array} enemyTargets - Array of enemy targets
   * @returns {void}
   */
  projectile.updateMissileTracking = function(enemyTargets) {
    const trackingRange = this.upgradeEffects.missileTrackingRange || 200;
    
    // If no current target or target is destroyed, find new target
    if (!this.trackingTarget || !this.trackingTarget.active) {
      this.trackingTarget = this.findNearestEnemy(enemyTargets, trackingRange);
    }
    
    if (this.trackingTarget) {
      // Calculate direction to target
      const dx = this.trackingTarget.x - this.x;
      const dy = this.trackingTarget.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Only track if within range
      if (distance <= trackingRange) {
        // Calculate desired velocity direction
        const speed = Math.sqrt(this.body.velocity.x ** 2 + this.body.velocity.y ** 2);
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;
        
        // Apply tracking with some turning rate limit for realism
        const trackingStrength = 0.1; // How aggressive the tracking is
        const currentVx = this.body.velocity.x;
        const currentVy = this.body.velocity.y;
        const targetVx = normalizedDx * speed;
        const targetVy = normalizedDy * speed;
        
        // Interpolate towards target velocity
        const newVx = currentVx + (targetVx - currentVx) * trackingStrength;
        const newVy = currentVy + (targetVy - currentVy) * trackingStrength;
        
        this.body.setVelocity(newVx, newVy);
      } else {
        // Target out of range, clear it
        this.trackingTarget = null;
      }
    }
  };

  /**
   * Find the nearest enemy within tracking range
   * @param {Array} enemyTargets - Array of enemy targets
   * @param {number} maxRange - Maximum tracking range
   * @returns {Object|null} Nearest enemy or null if none found
   */
  projectile.findNearestEnemy = function(enemyTargets, maxRange) {
    let nearestEnemy = null;
    let nearestDistance = maxRange;
    
    for (const enemy of enemyTargets) {
      if (!enemy.active) continue;
      
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestEnemy = enemy;
      }
    }
    
    return nearestEnemy;
  };

  /**
   * Handle projectile explosion for plasma weapons
   * @param {Array} targets - Array of potential targets for explosion damage
   * @returns {Array} Array of damaged targets
   */
  projectile.explode = function(targets = []) {
    if (this.weaponType !== 'plasma' || !this.upgradeEffects.plasmaExplosionRadius) {
      return [];
    }
    
    const explosionRadius = this.upgradeEffects.plasmaExplosionRadius;
    const damagedTargets = [];
    
    // Find all targets within explosion radius
    for (const target of targets) {
      if (!target.active) continue;
      
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= explosionRadius) {
        // Apply explosion damage (could be reduced based on distance)
        const distanceRatio = 1 - (distance / explosionRadius);
        const explosionDamage = Math.ceil(this.damage * distanceRatio);
        
        damagedTargets.push({
          target: target,
          damage: explosionDamage,
          distance: distance
        });
      }
    }
    
    // Chain reaction effect
    if (this.upgradeEffects.plasmaChainReaction && damagedTargets.length > 0) {
      // Trigger secondary explosions from damaged targets
      const chainExplosions = [];
      for (const damaged of damagedTargets) {
        const secondaryTargets = this.findChainTargets(targets, damaged.target, explosionRadius * 0.7);
        chainExplosions.push(...secondaryTargets);
      }
      damagedTargets.push(...chainExplosions);
    }
    
    return damagedTargets;
  };

  /**
   * Find targets for chain reaction explosions
   * @param {Array} allTargets - All potential targets
   * @param {Object} centerTarget - Center of the chain explosion
   * @param {number} chainRadius - Radius of chain explosion
   * @returns {Array} Array of chain explosion targets
   */
  projectile.findChainTargets = function(allTargets, centerTarget, chainRadius) {
    const chainTargets = [];
    
    for (const target of allTargets) {
      if (!target.active || target === centerTarget) continue;
      
      const dx = target.x - centerTarget.x;
      const dy = target.y - centerTarget.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= chainRadius) {
        const distanceRatio = 1 - (distance / chainRadius);
        const chainDamage = Math.ceil(this.damage * 0.5 * distanceRatio); // Reduced damage for chain
        
        chainTargets.push({
          target: target,
          damage: chainDamage,
          distance: distance,
          isChain: true
        });
      }
    }
    
    return chainTargets;
  };

  /**
   * Check if this projectile should critical hit (for plasma overcharge)
   * @returns {boolean} True if critical hit should occur
   */
  projectile.shouldCriticalHit = function() {
    if (this.weaponType !== 'plasma' || !this.upgradeEffects.plasmaOverchargeChance) {
      return false;
    }
    
    return Math.random() < this.upgradeEffects.plasmaOverchargeChance;
  };

  // Set up automatic lifespan destruction if specified
  if (finalConfig.lifespan && finalConfig.lifespan > 0) {
    scene.time.delayedCall(finalConfig.lifespan, () => {
      if (projectile && projectile.active) {
        projectile.destroy();
      }
    });
  }

  return projectile;
}

/**
 * Helper function to create a player projectile with standard configuration.
 * @param {Phaser.Physics.Arcade.Group} projectileGroup - The physics group
 * @param {number} x - Starting X position
 * @param {number} y - Starting Y position
 * @param {number} [velocityY=-400] - Y velocity (negative for upward movement)
 * @param {string} [weaponType='laser'] - Weapon type
 * @param {Object} [upgradeEffects={}] - Upgrade effects
 * @param {number} [piercing=0] - Piercing capability
 * @returns {Phaser.GameObjects.Rectangle} The created projectile
 */
export function createPlayerProjectile(
  projectileGroup,
  x,
  y,
  velocityY = -GameConfig.PROJECTILES.PLAYER.SPEED,
  weaponType = 'laser',
  upgradeEffects = {},
  piercing = 0
) {
  return projectileFactory(projectileGroup, {
    x,
    y,
    velocityX: 0,
    velocityY,
    owner: 'player',
    weaponType,
    upgradeEffects,
    piercing,
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
export function createEnemyProjectile(
  projectileGroup,
  x,
  y,
  velocityY = GameConfig.PROJECTILES.ENEMY.SPEED,
) {
  return projectileFactory(projectileGroup, {
    x,
    y,
    velocityX: 0,
    velocityY,
    owner: 'enemy',
  });
}
