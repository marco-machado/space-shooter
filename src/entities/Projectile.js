import BaseEntity from './BaseEntity.js';
import MovementComponent from '@/components/MovementComponent.js';
import Logger from '@/utils/Logger.js';

/**
 * Projectile Entity
 * Represents bullets fired by players and enemies
 * Uses colored rectangles for development graphics
 */
export default class Projectile extends BaseEntity {
  constructor(scene, x, y, config = {}) {
    // Determine size and color based on projectile type
    const size = config.size || { width: 8, height: 16 };
    const color = config.color || 0xffff00; // Default yellow

    super(scene, { type: 'rectangle', x, y, width: size.width, height: size.height, color });

    // Projectile properties
    this.damage = config.damage || 25;
    this.speed = config.speed || 400;
    this.weaponType = config.weaponType || 'laser';
    this.isPlayerProjectile =
      config.isPlayerProjectile !== undefined ? config.isPlayerProjectile : true;
    this.piercing = config.piercing || false; // Can pass through enemies
    this.maxLifetime = config.maxLifetime || 5000; // 5 seconds max lifetime
    this.creationTime = Date.now();

    // Set entity type for pooling identification
    this.entityType = 'projectile';

    // Visual effects (for future enhancement)
    this.trailEnabled = config.trailEnabled || false;
    this.glowEnabled = config.glowEnabled || false;

    // Initialize components
    this.initializeComponents();

    // Enable physics with collision group
    this.enablePhysics('dynamic');

    // Apply physics configuration
    if (this.body) {
      this._fallbackProjectilePhysicsConfiguration();
    }

    Logger.scope('Projectile').debug(` Created: ${this.weaponType} (${this.isPlayerProjectile ? 'player' : 'enemy'})`,
      {
        damage: this.damage,
        speed: this.speed,
        position: { x, y },
      }
    );
  }

  /**
   * Create projectile configurations for different weapon types
   */
  static createLaserConfig(isPlayerProjectile = true) {
    return {
      weaponType: 'laser',
      damage: 25,
      speed: 600,
      color: isPlayerProjectile ? 0xffff00 : 0xff4400, // Yellow for player, orange-red for enemy
      size: { width: 6, height: 14 },
      isPlayerProjectile,
      piercing: false,
      maxLifetime: 3000,
      glowEnabled: true,
    };
  }

  static createPlasmaConfig(isPlayerProjectile = true) {
    return {
      weaponType: 'plasma',
      damage: 40,
      speed: 500,
      color: isPlayerProjectile ? 0x00ff88 : 0xff2266, // Green-blue for player, red-pink for enemy
      size: { width: 10, height: 16 },
      isPlayerProjectile,
      piercing: false,
      maxLifetime: 4000,
      glowEnabled: true,
    };
  }

  static createMissileConfig(isPlayerProjectile = true) {
    return {
      weaponType: 'missile',
      damage: 100,
      speed: 300,
      color: isPlayerProjectile ? 0xff8800 : 0x884400, // Orange for player, dark orange for enemy
      size: { width: 8, height: 20 },
      isPlayerProjectile,
      piercing: false,
      maxLifetime: 6000,
      trailEnabled: true,
    };
  }

  static createEnemyBasicConfig() {
    return {
      weaponType: 'basic',
      damage: 15,
      speed: 400,
      color: 0xff0000, // Red
      size: { width: 6, height: 12 },
      isPlayerProjectile: false,
      piercing: false,
      maxLifetime: 4000,
    };
  }

  /**
   * Object pool management for performance
   */
  static createPool(scene, size = 50) {
    const pool = [];

    for (let i = 0; i < size; i++) {
      const projectile = new Projectile(scene, -100, -100, { damage: 0, speed: 0 });
      projectile.active = false;
      projectile.visible = false;
      pool.push(projectile);
    }

    Logger.scope('Projectile').debug(` Pool created with ${size} projectiles`);
    return pool;
  }

  /**
   * Get projectile from pool
   * @param {Array} pool - Projectile pool
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} config - Projectile configuration
   * @returns {Projectile|null} Available projectile or null
   */
  static getFromPool(pool, x, y, config) {
    // Validate pool
    if (!Array.isArray(pool) || pool.length === 0) {
      Logger.scope('Projectile').error('Invalid or empty projectile pool');
      return null;
    }

    // Find valid inactive projectile
    let projectile = null;
    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[i];

      // Validate projectile object
      if (!candidate) {
        Logger.scope('Projectile').warn(`Pool contains null projectile at index ${i}, removing`);
        pool.splice(i, 1);
        i--; // Adjust index after removal
        continue;
      }

      // Check if projectile is in valid state
      if (!candidate.scene || candidate.scene.sys.isDestroyed) {
        Logger.scope('Projectile').warn(
          `Pool contains projectile with destroyed scene at index ${i}, removing`
        );
        pool.splice(i, 1);
        i--; // Adjust index after removal
        continue;
      }

      // Check for destroyed or corrupted projectiles
      if (!candidate.setPosition || !candidate.getComponent) {
        Logger.scope('Projectile').warn(` Pool contains corrupted projectile at index ${i}, removing`);
        pool.splice(i, 1);
        i--; // Adjust index after removal
        continue;
      }

      // Found valid inactive projectile
      if (!candidate.active) {
        projectile = candidate;
        break;
      }
    }

    if (projectile) {
      try {
        // CRITICAL FIX: Recreate GameObject if it's null (destroyed during pooling)
        if (!projectile.gameObject) {
          Logger.scope('Projectile').debug('[Projectile] Recreating GameObject for pooled projectile');
          projectile.recreateGameObject();

          // Verify GameObject was successfully recreated
          if (!projectile.gameObject) {
            Logger.scope('Projectile').error(
              '[Projectile] Failed to recreate GameObject for pooled projectile, removing from pool'
            );
            const index = pool.indexOf(projectile);
            if (index > -1) {
              pool.splice(index, 1);
            }
            return null;
          }
        }

        // Ensure physics is properly configured
        if (!projectile.body && projectile.scene.physics) {
          projectile.enablePhysics('dynamic');
        }

        // Reset projectile properties
        projectile.setPosition(x, y);
        projectile.active = true;
        projectile.visible = true;
        projectile.damage = config.damage || 25;
        projectile.speed = config.speed || 400;
        projectile.weaponType = config.weaponType || 'laser';
        projectile.isPlayerProjectile =
          config.isPlayerProjectile !== undefined ? config.isPlayerProjectile : true;
        projectile.creationTime = Date.now();

        // Safely set fill style through gameObject (now guaranteed to exist)
        if (projectile.gameObject && projectile.gameObject.setFillStyle) {
          projectile.gameObject.setFillStyle(config.color || 0xffff00);
        }

        // Update size if needed - with validation (this was the original error location)
        if (config.size && config.size.width > 0 && config.size.height > 0) {
          // This call was failing with "Cannot read properties of null (reading 'setSize')"
          // Now it's safe because we've ensured gameObject exists
          projectile.setSize(config.size.width, config.size.height);
        }

        // Reinitialize components with new config
        const movement = projectile.getComponent(MovementComponent);
        if (movement) {
          movement.init({
            maxSpeed: projectile.speed,
            boundaryBehavior: 'destroy',
            boundToScreen: true,
            screenPadding: -50,
          });
        }

        // Update physics configuration for pooled projectile
        if (projectile.body) {
          projectile._fallbackProjectilePhysicsConfiguration();
        }

        Logger.scope('Projectile').debug(` Projectile retrieved from pool: ${config.weaponType}`, {
          position: { x, y },
          damage: projectile.damage,
          speed: projectile.speed,
          hasBody: !!projectile.body,
          hasGameObject: !!projectile.gameObject,
        });
        return projectile;
      } catch (error) {
        Logger.scope('Projectile').error('[Projectile] Failed to initialize projectile from pool', {
          error: error.message,
          weaponType: config.weaponType,
          projectileState: {
            active: projectile.active,
            visible: projectile.visible,
            hasScene: !!projectile.scene,
            hasBody: !!projectile.body,
            hasGameObject: !!projectile.gameObject,
          },
        });

        // Remove corrupted projectile from pool
        const index = pool.indexOf(projectile);
        if (index > -1) {
          pool.splice(index, 1);
        }

        return null;
      }
    }

    Logger.scope('Projectile').warn('[Projectile] Projectile pool exhausted - no valid projectiles available', {
      poolSize: pool.length,
      activeCount: pool.filter(p => p && p.active).length,
    });
    return null;
  }

  /**
   * Return projectile to pool
   * @param {Array} pool - Projectile pool
   * @param {Projectile} projectile - Projectile to return
   */
  static returnToPool(pool, projectile) {
    try {
      // Validate inputs
      if (!Array.isArray(pool) || !projectile) {
        Logger.scope('Projectile').warn('Invalid parameters for returnToPool', {
          hasPool: Array.isArray(pool),
          hasProjectile: !!projectile,
        });
        return;
      }

      // Check if projectile is in this pool
      if (!pool.includes(projectile)) {
        Logger.scope('Projectile').warn('Projectile not found in pool, cannot return');
        return;
      }

      // Validate projectile state before returning
      if (!projectile.setPosition) {
        Logger.scope('Projectile').warn('Projectile appears corrupted, removing from pool instead of returning');
        const index = pool.indexOf(projectile);
        if (index > -1) {
          pool.splice(index, 1);
        }
        return;
      }

      // Use the BaseEntity deactivate method for proper pooling
      projectile.deactivate();

      // Reset projectile-specific properties
      projectile.setAlpha(1);
      projectile.setRotation(0);

      Logger.scope('Projectile').debug(`Projectile returned to pool: ${projectile.weaponType || 'unknown'}`, {
        poolSize: pool.length,
        activeCount: pool.filter(p => p && p.active).length,
      });
    } catch (error) {
      Logger.scope('Projectile').error('Failed to return projectile to pool', {
        error: error.message,
        weaponType: projectile ? projectile.weaponType : 'unknown',
      });

      // Remove problematic projectile from pool
      const index = pool.indexOf(projectile);
      if (index > -1) {
        pool.splice(index, 1);
        Logger.scope('Projectile').warn('Removed corrupted projectile from pool');
      }
    }
  }

  /**
   * Fallback projectile physics configuration when PhysicsHelper is unavailable
   * @private
   */
  _fallbackProjectilePhysicsConfiguration() {
    if (!this.body) return;

    // Manual physics configuration for projectile
    this.body.setSize(this.width * 0.8, this.height * 0.8);
    this.body.setOffset(this.width * 0.1, this.height * 0.1);
    this.body.setImmovable(false);
    this.body.setBounce(0);
    this.body.setDrag(0);
    this.body.setMaxVelocity(600, 600);

    Logger.scope('Projectile').debug(` Fallback physics configuration applied for ${this.entityId}`);
  }

  /**
   * Initialize projectile components
   */
  initializeComponents() {
    // Movement component - projectiles fly in straight lines
    const movementComponent = new MovementComponent(this.speed);
    movementComponent.init({
      maxSpeed: this.speed,
      boundToScreen: true,
      boundaryBehavior: 'destroy', // Destroy when leaving screen
      screenPadding: -50, // Allow slight off-screen before destruction
    });
    this.addComponent(movementComponent);

    // Note: Collision handling now uses Phaser physics in GameScene
  }

  /**
   * Fire projectile in a specific direction
   * @param {number} angle - Angle in radians
   * @param {number} speed - Optional speed override
   */
  fire(angle, speed = null) {
    const projectileSpeed = speed || this.speed;
    const movement = this.getComponent(MovementComponent);

    if (movement) {
      movement.moveInDirection(angle, projectileSpeed);
      Logger.scope('Projectile').debug(`Projectile fired: angle ${angle.toFixed(2)}, speed ${projectileSpeed}`);
    }
  }

  /**
   * Fire towards a target position
   * @param {number} targetX - Target X coordinate
   * @param {number} targetY - Target Y coordinate
   * @param {number} speed - Optional speed override
   */
  fireTowards(targetX, targetY, speed = null) {
    const projectileSpeed = speed || this.speed;
    const movement = this.getComponent(MovementComponent);

    if (movement) {
      // Calculate angle from current position to target
      const deltaX = targetX - this.x;
      const deltaY = targetY - this.y;
      const angle = Math.atan2(deltaY, deltaX);

      // Use moveInDirection which exists in MovementComponent
      movement.moveInDirection(angle, projectileSpeed);
      Logger.scope('Projectile').debug(
        `Projectile fired towards: (${targetX}, ${targetY}) at angle ${angle.toFixed(2)}`
      );
    }
  }

  /**
   * Update projectile - handles lifetime and special effects
   * @param {number} delta - Time delta in milliseconds
   */
  update(delta) {
    super.update(delta);

    // Check lifetime expiration
    const currentTime = Date.now();
    if (currentTime - this.creationTime > this.maxLifetime) {
      Logger.scope('Projectile').debug(`Projectile expired after ${this.maxLifetime}ms`);
      this.destroy();
      return;
    }

    // Note: Collision detection now handled by Phaser physics in GameScene

    // Handle visual effects (placeholder for future enhancement)
    this.updateVisualEffects(delta);
  }

  /**
   * Deactivates the current instance by setting its active state to false.
   * @return {void} Does not return a value.
   */
  destroy() {
    this.active = false;
  }

  /**
   * Update visual effects (placeholder for future sprites/particles)
   * @param {number} delta - Time delta in milliseconds
   */
  updateVisualEffects(_delta) {
    // Future: Add particle trails, glow effects, rotation, etc.

    // Simple pulsing effect for now (development)
    if (this.glowEnabled) {
      const pulse = Math.sin(Date.now() * 0.01) * 0.1 + 0.9;
      this.setAlpha(pulse);
    }

    // Simple rotation based on movement direction
    const movement = this.getComponent(MovementComponent);
    if (movement && (movement.velocityX !== 0 || movement.velocityY !== 0)) {
      const angle = Math.atan2(movement.velocityY, movement.velocityX);
      this.setRotation(angle + Math.PI / 2); // Add 90 degrees for proper orientation
    }
  }

  /**
   * Handle collision with another entity
   * Called by Phaser physics collision handlers in GameScene
   * @param {BaseEntity} otherEntity - BaseEntity that was hit
   */
  onCollision(otherEntity) {
    Logger.scope('Projectile').debug(`Projectile hit: ${otherEntity.constructor.name}`, {
      damage: this.damage,
      piercing: this.piercing,
      weaponType: this.weaponType,
    });

    // Apply damage to the hit entity if it has a health component
    if (otherEntity.getComponent && typeof otherEntity.getComponent === 'function') {
      const healthComponent = otherEntity.getComponent('HealthComponent');
      if (healthComponent && healthComponent.takeDamage) {
        healthComponent.takeDamage(this.damage);
      }
    }

    // Emit hit event for sound/visual effects
    this.emit('projectileHit', {
      target: otherEntity,
      damage: this.damage,
      weaponType: this.weaponType,
      position: { x: this.x, y: this.y },
    });

    // Destroy projectile unless it's piercing
    if (!this.piercing) {
      // Small delay to ensure collision is fully processed
      this.scene.time.delayedCall(10, () => {
        if (this.active) {
          this.destroy();
        }
      });
    }
  }
}
