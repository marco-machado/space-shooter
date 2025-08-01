import System from './System.js';
import Projectile from '../entities/Projectile.js';
import WeaponComponent from '../components/WeaponComponent.js';
// import MovementComponent from '../components/MovementComponent.js'; // Imported but not directly used
import Logger from '../core/Logger.js';

/**
 * Weapon System
 * Handles weapon firing, projectile creation, and weapon switching
 * Manages object pooling for projectiles for performance
 */
class WeaponSystem extends System {
  constructor(scene) {
    super();
    this.scene = scene;

    // Input handling
    this.inputKeys = null;
    this.lastInputCheck = 0;
    this.inputCheckInterval = 16; // Check input every 16ms (60fps)

    // Projectile pools for performance
    this.playerProjectilePool = [];
    this.enemyProjectilePool = [];
    this.poolSize = 100;

    // Statistics
    this.stats = {
      projectilesFired: 0,
      projectilesActive: 0,
      poolMisses: 0,
    };

    this.initializePools();
    this.setupInput();

    Logger.info('WeaponSystem initialized', {
      poolSize: this.poolSize,
      inputCheckInterval: this.inputCheckInterval,
    });
  }

  /**
   * Initialize projectile object pools
   */
  initializePools() {
    // Create player projectile pool
    this.playerProjectilePool = Projectile.createPool(this.scene, this.poolSize);

    // Create enemy projectile pool
    this.enemyProjectilePool = Projectile.createPool(this.scene, this.poolSize);

    Logger.debug(`Projectile pools created: ${this.poolSize} each for player and enemy`);
  }

  /**
   * Setup input handling for weapon controls
   */
  setupInput() {
    if (!this.scene.input || !this.scene.input.keyboard) {
      Logger.warn('WeaponSystem: Keyboard input not available');
      return;
    }

    // Create cursor keys and WASD keys
    this.inputKeys = this.scene.input.keyboard.addKeys({
      fire: Phaser.Input.Keyboard.KeyCodes.SPACE,
      weapon1: Phaser.Input.Keyboard.KeyCodes.ONE,
      weapon2: Phaser.Input.Keyboard.KeyCodes.TWO,
      weapon3: Phaser.Input.Keyboard.KeyCodes.THREE,
    });

    Logger.debug('WeaponSystem input configured');
  }

  /**
   * Update weapon system - handles input and firing logic
   * @param {Array} entities - All entities in the scene
   * @param {number} delta - Time delta in milliseconds
   */
  update(entities, delta) {
    // Update input handling
    this.updateInput(entities, delta);

    // Update active projectiles
    this.updateProjectiles(delta);

    // Handle entity weapon events
    this.handleWeaponEvents(entities);

    // Update statistics
    this.updateStats();
  }

  /**
   * Update input handling for weapon controls
   * @param {Array} entities - All entities in the scene
   * @param {number} delta - Time delta in milliseconds
   */
  updateInput(entities, delta) {
    if (!this.inputKeys) return;

    this.lastInputCheck += delta;
    if (this.lastInputCheck < this.inputCheckInterval) return;

    this.lastInputCheck = 0;

    // Find player entity
    const player = entities.find(
      entity => entity.constructor.name === 'Player' || entity.entityType === 'player'
    );

    if (!player) return;

    const weapon = player.getComponent(WeaponComponent);
    if (!weapon) return;

    // Handle weapon switching
    if (this.inputKeys.weapon1.isDown) {
      weapon.switchWeapon('laser');
    } else if (this.inputKeys.weapon2.isDown) {
      weapon.switchWeapon('plasma');
    } else if (this.inputKeys.weapon3.isDown) {
      weapon.switchWeapon('missile');
    }

    // Handle firing
    if (this.inputKeys.fire.isDown) {
      this.firePlayerWeapon(player);
    } else {
      weapon.stopFiring();
    }
  }

  /**
   * Fire player weapon
   * @param {Entity} player - Player entity
   */
  firePlayerWeapon(player) {
    try {
      // Validate player entity
      if (!player || !player.getComponent) {
        Logger.error('WeaponSystem: Invalid player entity for firing');
        return;
      }

      const weapon = player.getComponent(WeaponComponent);
      if (!weapon) {
        Logger.debug('WeaponSystem: Player has no weapon component');
        return;
      }

      const projectileConfig = weapon.fire();
      if (!projectileConfig) {
        // Weapon might be on cooldown or out of ammo - this is normal
        return;
      }

      // Validate projectile config
      if (!projectileConfig.weaponType || !projectileConfig.damage || !projectileConfig.speed) {
        Logger.error('WeaponSystem: Invalid projectile config from weapon', projectileConfig);
        return;
      }

      // Calculate fire position
      const fireX = player.x;
      const fireY = player.y - (player.height / 2); // Fire from top of player

      // Create projectile
      const projectile = this.createPlayerProjectile(fireX, fireY, projectileConfig);

      if (projectile) {
        try {
          // Fire straight up
          projectile.fire(-Math.PI / 2); // -90 degrees (upward)

          Logger.debug(`Player fired: ${projectileConfig.weaponType}`, {
            position: { x: fireX, y: fireY },
            damage: projectileConfig.damage,
            speed: projectileConfig.speed
          });
          this.stats.projectilesFired++;

        } catch (fireError) {
          Logger.error('Failed to fire projectile', {
            error: fireError.message,
            weaponType: projectileConfig.weaponType
          });
          
          // Return failed projectile to pool if possible
          if (this.playerProjectilePool.includes(projectile)) {
            Projectile.returnToPool(this.playerProjectilePool, projectile);
          }
        }
      } else {
        Logger.warn('Failed to create projectile for player weapon', {
          weaponType: projectileConfig.weaponType,
          playerPosition: { x: player.x, y: player.y }
        });
      }

    } catch (error) {
      Logger.error('WeaponSystem: Critical error in firePlayerWeapon', {
        error: error.message,
        hasPlayer: !!player
      });
    }
  }

  /**
   * Create player projectile from pool
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} config - Projectile configuration
   * @returns {Projectile|null} Created projectile or null
   */
  createPlayerProjectile(x, y, config) {
    try {
      // Validate input parameters
      if (typeof x !== 'number' || typeof y !== 'number' || !config) {
        Logger.error('WeaponSystem: Invalid parameters for createPlayerProjectile', { x, y, config });
        return null;
      }

      // Get appropriate config based on weapon type
      let projectileConfig;
      switch (config.weaponType) {
        case 'laser':
          projectileConfig = Projectile.createLaserConfig(true);
          break;
        case 'plasma':
          projectileConfig = Projectile.createPlasmaConfig(true);
          break;
        case 'missile':
          projectileConfig = Projectile.createMissileConfig(true);
          break;
        default:
          projectileConfig = Projectile.createLaserConfig(true);
      }

      // Override with weapon-specific values
      projectileConfig.damage = config.damage;
      projectileConfig.speed = config.speed;
      projectileConfig.color = config.color;
      projectileConfig.size = config.size;

      // Try to get from pool first
      let projectile = Projectile.getFromPool(this.playerProjectilePool, x, y, projectileConfig);

      // Create new if pool fails or is exhausted
      if (!projectile) {
        try {
          projectile = new Projectile(this.scene, x, y, projectileConfig);
          this.stats.poolMisses++;
          Logger.warn('Player projectile pool exhausted, created new projectile', {
            poolSize: this.playerProjectilePool.length,
            activeCount: this.playerProjectilePool.filter(p => p && p.active).length
          });
        } catch (creationError) {
          Logger.error('Failed to create new projectile', {
            error: creationError.message,
            position: { x, y },
            config: projectileConfig
          });
          return null;
        }
      }

      // Validate created/retrieved projectile
      if (!projectile || !projectile.setPosition || !projectile.fire) {
        Logger.error('Invalid projectile created/retrieved', {
          hasProjectile: !!projectile,
          hasSetPosition: !!(projectile && projectile.setPosition),
          hasFire: !!(projectile && projectile.fire)
        });
        return null;
      }

      return projectile;

    } catch (error) {
      Logger.error('WeaponSystem: Failed to create player projectile', {
        error: error.message,
        position: { x, y },
        config
      });
      return null;
    }
  }

  /**
   * Create enemy projectile
   * @param {Entity} enemy - Enemy entity
   * @param {Object} config - Projectile configuration
   * @param {number} angle - Fire angle in radians
   * @returns {Projectile|null} Created projectile or null
   */
  createEnemyProjectile(enemy, config, angle) {
    const projectileConfig = Projectile.createEnemyBasicConfig();

    // Override with enemy weapon values
    projectileConfig.damage = config.damage;
    projectileConfig.speed = config.speed;
    projectileConfig.color = config.color || 0xff0000;

    const fireX = enemy.x;
    const fireY = enemy.y + enemy.height / 2; // Fire from bottom of enemy

    // Try to get from pool first
    let projectile = Projectile.getFromPool(
      this.enemyProjectilePool,
      fireX,
      fireY,
      projectileConfig
    );

    // Create new if pool exhausted
    if (!projectile) {
      projectile = new Projectile(this.scene, fireX, fireY, projectileConfig);
      this.stats.poolMisses++;
      Logger.warn('Enemy projectile pool exhausted, creating new projectile');
    }

    if (projectile) {
      projectile.fire(angle);
      this.stats.projectilesFired++;
    }

    return projectile;
  }

  /**
   * Update all active projectiles
   * @param {number} delta - Time delta in milliseconds
   */
  updateProjectiles(delta) {
    // Update player projectiles
    this.playerProjectilePool.forEach(projectile => {
      if (projectile.active) {
        projectile.update(delta);

        // Return to pool if destroyed or off-screen
        if (!projectile.active || this.isProjectileOffScreen(projectile)) {
          Projectile.returnToPool(this.playerProjectilePool, projectile);
        }
      }
    });

    // Update enemy projectiles
    this.enemyProjectilePool.forEach(projectile => {
      if (projectile.active) {
        projectile.update(delta);

        // Return to pool if destroyed or off-screen
        if (!projectile.active || this.isProjectileOffScreen(projectile)) {
          Projectile.returnToPool(this.enemyProjectilePool, projectile);
        }
      }
    });
  }

  /**
   * Check if projectile is off-screen
   * @param {Projectile} projectile - Projectile to check
   * @returns {boolean} True if off-screen
   */
  isProjectileOffScreen(projectile) {
    const padding = 50;
    const { width, height } = this.scene.scale;

    return (
      projectile.x < -padding ||
      projectile.x > width + padding ||
      projectile.y < -padding ||
      projectile.y > height + padding
    );
  }

  /**
   * Handle weapon-related events from entities
   * @param {Array} entities - All entities in the scene
   */
  handleWeaponEvents(_entities) {
    // This method is reserved for future weapon event handling
    // Enemy fire events are handled directly in the EnemySpawnSystem
    // to avoid repeated event listener registration/removal
  }

  /**
   * Handle enemy fire event
   * @param {Object} eventData - Event data from enemy
   */
  onEnemyFire(eventData) {
    const { enemy, config, angle } = eventData;

    const projectile = this.createEnemyProjectile(enemy, config, angle);
    if (projectile) {
      Logger.debug(`Enemy fired: ${enemy.enemyType}`);
    }
  }

  /**
   * Update system statistics
   */
  updateStats() {
    // Count active projectiles
    const activePlayerProjectiles = this.playerProjectilePool.filter(p => p.active).length;
    const activeEnemyProjectiles = this.enemyProjectilePool.filter(p => p.active).length;

    this.stats.projectilesActive = activePlayerProjectiles + activeEnemyProjectiles;
  }

  /**
   * Get all active projectiles (for collision system)
   * @returns {Array} All active projectiles
   */
  getActiveProjectiles() {
    const activeProjectiles = [];

    this.playerProjectilePool.forEach(projectile => {
      if (projectile.active) {
        activeProjectiles.push(projectile);
      }
    });

    this.enemyProjectilePool.forEach(projectile => {
      if (projectile.active) {
        activeProjectiles.push(projectile);
      }
    });

    return activeProjectiles;
  }

  /**
   * Get player projectiles only
   * @returns {Array} Active player projectiles
   */
  getPlayerProjectiles() {
    return this.playerProjectilePool.filter(projectile => projectile.active);
  }

  /**
   * Get enemy projectiles only
   * @returns {Array} Active enemy projectiles
   */
  getEnemyProjectiles() {
    return this.enemyProjectilePool.filter(projectile => projectile.active);
  }

  /**
   * Clear all projectiles (for scene transitions)
   */
  clearAllProjectiles() {
    this.playerProjectilePool.forEach(projectile => {
      if (projectile.active) {
        Projectile.returnToPool(this.playerProjectilePool, projectile);
      }
    });

    this.enemyProjectilePool.forEach(projectile => {
      if (projectile.active) {
        Projectile.returnToPool(this.enemyProjectilePool, projectile);
      }
    });

    Logger.debug('All projectiles cleared');
  }

  /**
   * Resize pools if needed (performance optimization)
   * @param {number} newSize - New pool size
   */
  resizePools(newSize) {
    const oldSize = this.poolSize;
    this.poolSize = newSize;

    // Add more projectiles if increasing size
    if (newSize > oldSize) {
      const additionalProjectiles = newSize - oldSize;

      for (let i = 0; i < additionalProjectiles; i++) {
        const playerProjectile = new Projectile(this.scene, -100, -100, { damage: 0, speed: 0 });
        playerProjectile.setActive(false);
        playerProjectile.setVisible(false);
        this.playerProjectilePool.push(playerProjectile);

        const enemyProjectile = new Projectile(this.scene, -100, -100, {
          damage: 0,
          speed: 0,
          isPlayerProjectile: false,
        });
        enemyProjectile.setActive(false);
        enemyProjectile.setVisible(false);
        this.enemyProjectilePool.push(enemyProjectile);
      }
    }

    Logger.info(`Projectile pools resized: ${oldSize} -> ${newSize}`);
  }

  /**
   * Get system performance statistics
   * @returns {Object} Performance stats
   */
  getStats() {
    return {
      ...this.stats,
      playerPoolSize: this.playerProjectilePool.length,
      enemyPoolSize: this.enemyProjectilePool.length,
      playerPoolActive: this.playerProjectilePool.filter(p => p.active).length,
      enemyPoolActive: this.enemyProjectilePool.filter(p => p.active).length,
      poolEfficiency:
        this.stats.poolMisses === 0
          ? 100
          : ((this.stats.projectilesFired - this.stats.poolMisses) / this.stats.projectilesFired) *
            100,
    };
  }

  /**
   * Clean up system resources
   */
  destroy() {
    // Clear all projectiles
    this.clearAllProjectiles();

    // Remove input listeners
    if (this.inputKeys) {
      Object.values(this.inputKeys).forEach(key => {
        if (key.removeAllListeners) {
          key.removeAllListeners();
        }
      });
    }

    // Destroy projectile pools
    this.playerProjectilePool.forEach(projectile => {
      if (projectile.destroy) {
        projectile.destroy();
      }
    });

    this.enemyProjectilePool.forEach(projectile => {
      if (projectile.destroy) {
        projectile.destroy();
      }
    });

    this.playerProjectilePool = [];
    this.enemyProjectilePool = [];

    Logger.info('WeaponSystem destroyed');
  }
}

export default WeaponSystem;
