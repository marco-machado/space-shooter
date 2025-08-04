import BaseEntity from './BaseEntity.js';
import MovementComponent from '@/components/MovementComponent.js';
import CollisionComponent from '@/components/CollisionComponent.js';
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

    // Visual effects (for future enhancement)
    this.trailEnabled = config.trailEnabled || false;
    this.glowEnabled = config.glowEnabled || false;

    // Initialize components
    this.initializeComponents();

    // Enable physics
    this.enablePhysics('dynamic');

    // Configure physics body
    if (this.body) {
      this.body.setSize(size.width * 0.8, size.height * 0.8); // Slightly smaller hitbox
      this.body.setOffset(size.width * 0.1, size.height * 0.1);
    }

    Logger.debug(
      `[Projectile] Created: ${this.weaponType} (${this.isPlayerProjectile ? 'player' : 'enemy'})`,
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

    Logger.debug(`[Projectile] Pool created with ${size} projectiles`);
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
      Logger.error('[Projectile] Invalid or empty projectile pool');
      return null;
    }

    // Find valid inactive projectile
    let projectile = null;
    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[i];

      // Validate projectile object
      if (!candidate) {
        Logger.warn(`[Projectile] Pool contains null projectile at index ${i}, removing`);
        pool.splice(i, 1);
        i--; // Adjust index after removal
        continue;
      }

      // Check if projectile is in valid state
      if (!candidate.scene || candidate.scene.sys.isDestroyed) {
        Logger.warn(
          `[Projectile] Pool contains projectile with destroyed scene at index ${i}, removing`
        );
        pool.splice(i, 1);
        i--; // Adjust index after removal
        continue;
      }

      // Check for destroyed or corrupted projectiles
      if (!candidate.setPosition || !candidate.getComponent) {
        Logger.warn(`[Projectile] Pool contains corrupted projectile at index ${i}, removing`);
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
          Logger.debug('[Projectile] Recreating GameObject for pooled projectile');
          projectile.recreateGameObject();

          // Verify GameObject was successfully recreated
          if (!projectile.gameObject) {
            Logger.error(
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

        const collision = projectile.getComponent(CollisionComponent);
        if (collision) {
          const collisionConfig = CollisionComponent.createProjectileConfig(
            projectile.isPlayerProjectile
          );
          collisionConfig.damageAmount = projectile.damage;
          collision.init(collisionConfig);
        }

        Logger.debug(`[Projectile] Projectile retrieved from pool: ${config.weaponType}`, {
          position: { x, y },
          damage: projectile.damage,
          speed: projectile.speed,
          hasBody: !!projectile.body,
          hasGameObject: !!projectile.gameObject,
        });
        return projectile;
      } catch (error) {
        Logger.error('[Projectile] Failed to initialize projectile from pool', {
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

    Logger.warn('[Projectile] Projectile pool exhausted - no valid projectiles available', {
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
        Logger.warn('Invalid parameters for returnToPool', {
          hasPool: Array.isArray(pool),
          hasProjectile: !!projectile,
        });
        return;
      }

      // Check if projectile is in this pool
      if (!pool.includes(projectile)) {
        Logger.warn('Projectile not found in pool, cannot return');
        return;
      }

      // Validate projectile state before returning
      if (!projectile.setPosition) {
        Logger.warn('Projectile appears corrupted, removing from pool instead of returning');
        const index = pool.indexOf(projectile);
        if (index > -1) {
          pool.splice(index, 1);
        }
        return;
      }

      // Reset projectile to inactive state
      projectile.active = false;
      projectile.visible = false;
      projectile.setPosition(-100, -100);

      // Reset physics velocity if body exists
      if (projectile.body && projectile.body.setVelocity) {
        projectile.body.setVelocity(0, 0);
      }

      // Stop movement
      const movement = projectile.getComponent(MovementComponent);
      if (movement) {
        movement.stop();
      }

      // Reset collision state
      const collision = projectile.getComponent(CollisionComponent);
      if (collision && collision.reset) {
        collision.reset();
      }

      // Reset visual properties
      projectile.setAlpha(1);
      projectile.setRotation(0);

      Logger.debug(`Projectile returned to pool: ${projectile.weaponType || 'unknown'}`, {
        poolSize: pool.length,
        activeCount: pool.filter(p => p && p.active).length,
      });
    } catch (error) {
      Logger.error('Failed to return projectile to pool', {
        error: error.message,
        weaponType: projectile ? projectile.weaponType : 'unknown',
      });

      // Remove problematic projectile from pool
      const index = pool.indexOf(projectile);
      if (index > -1) {
        pool.splice(index, 1);
        Logger.warn('Removed corrupted projectile from pool');
      }
    }
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

    // Collision component
    const collisionConfig = CollisionComponent.createProjectileConfig(this.isPlayerProjectile);
    collisionConfig.damageAmount = this.damage;
    collisionConfig.width = this.width * 0.8;
    collisionConfig.height = this.height * 0.8;

    // Configure collision response based on piercing
    if (this.piercing) {
      collisionConfig.collisionResponse.destroy = false;
      collisionConfig.collisionCooldown = 100; // Brief cooldown between hits
    }

    const collisionComponent = new CollisionComponent();
    collisionComponent.init(collisionConfig);
    this.addComponent(collisionComponent);
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
      Logger.debug(`Projectile fired: angle ${angle.toFixed(2)}, speed ${projectileSpeed}`);
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
      Logger.debug(
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
      Logger.debug(`Projectile expired after ${this.maxLifetime}ms`);
      this.destroy();
      return;
    }

    // Update collision component (if it has an update method)
    const collision = this.getComponent(CollisionComponent);
    if (collision && collision.update) {
      collision.update(delta);
    }

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
   * Called by CollisionSystem
   * @param {BaseEntity} otherEntity - BaseEntity that was hit
   * @param {Object} collisionResult - Result from collision component
   */
  onCollision(otherEntity, collisionResult) {
    Logger.debug(`Projectile hit: ${otherEntity.constructor.name}`, {
      damage: collisionResult.damageDealt,
      piercing: this.piercing,
    });

    // Emit hit event for sound/visual effects
    this.emit('projectileHit', {
      target: otherEntity,
      damage: collisionResult.damageDealt,
      weaponType: this.weaponType,
      position: { x: this.x, y: this.y },
    });

    // Destroy projectile unless it's piercing
    if (!this.piercing && collisionResult.handled) {
      // Small delay to ensure collision is fully processed
      this.scene.time.delayedCall(10, () => {
        if (this.active) {
          this.destroy();
        }
      });
    }
  }
}
