import BaseSystem from './BaseSystem.js';
import Projectile from '@/entities/Projectile.js';
import WeaponComponent from '@/components/WeaponComponent.js';
import Logger from '@/utils/Logger.js';
import { getEventBus } from '@/event-bus/EventBus.js';
import { EventTypes } from '@/event-bus/EventTypes.js';

export default class WeaponSystem extends BaseSystem {
  constructor(scene) {
    super();
    this.scene = scene;
    this.eventBus = getEventBus();

    // Input handling
    this.inputKeys = null;
    this.lastInputCheck = 0;
    this.inputCheckInterval = 16; // Check input every 16ms (60fps)

    // Projectile pools for performance
    this.playerProjectilePool = [];
    this.enemyProjectilePool = [];
    this.poolSize = 100;

    // Active projectile arrays for optimized iteration (Critical Performance Fix)
    this.activePlayerProjectiles = [];
    this.activeEnemyProjectiles = [];

    // Statistics
    this.stats = {
      projectilesFired: 0,
      projectilesActive: 0,
      poolMisses: 0,
    };

    this.initializePools();
    this.setupEventListeners();
  }

  initializePools() {
    this.playerProjectilePool = Projectile.createPool(this.scene, this.poolSize);
    this.enemyProjectilePool = Projectile.createPool(this.scene, this.poolSize);
  }

  setupEventListeners() {
    this.eventBus.on(EventTypes.WEAPON_FIRED, this.onWeaponFired, this);
  }

  update(entities, delta) {
    // Update input handling
    // this.updateInput(entities, delta);
    // Update active projectiles (optimized iteration)
    // this.updateProjectiles(delta);
    // Handle entity weapon events
    // this.handleWeaponEvents(entities);
  }

  /**
   * Helper method to get entities with specific components (fixes entity discovery fragility)
   * @param {Array} entities - All entities to filter
   * @param {Array<Function>} componentTypes - Array of component constructor functions
   * @returns {Array} Entities that have ALL specified components
   */
  getEntitiesWithComponents(entities, componentTypes) {
    if (!Array.isArray(entities) || !Array.isArray(componentTypes)) {
      Logger.scope('WeaponSystem').warn('WeaponSystem: Invalid parameters for getEntitiesWithComponents', {
        hasEntities: Array.isArray(entities),
        hasComponentTypes: Array.isArray(componentTypes),
      });
      return [];
    }

    return entities.filter(entity => {
      if (!entity || typeof entity.hasComponent !== 'function') {
        return false;
      }

      // Check if entity has all required components
      return componentTypes.every(componentType => entity.hasComponent(componentType));
    });
  }

  onWeaponFired(eventData) {
    Logger.scope('WeaponSystem').debug('Weapon fired', eventData);

    // Get the entities with weapons
    const entitiesWithWeapons = this.getEntitiesWithComponents(this.scene.entities, [
      WeaponComponent,
    ]);
    const player = entitiesWithWeapons.find(
      entity => entity.constructor.name === 'Player' || entity.entityType === 'player'
    );

    if (!player) return;

    const weapon = player.getComponent(WeaponComponent);
    if (!weapon) return;

    if (eventData.state === 'start') {
      this.firePlayerWeapon(player);
    } else {
      weapon.stopFiring();
    }
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

    // Find player entity using component-based filtering (fixes entity discovery fragility)
    const playersWithWeapons = this.getEntitiesWithComponents(entities, [WeaponComponent]);
    const player = playersWithWeapons.find(
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

  firePlayerWeapon(player) {
    try {
      // Validate player entity
      if (!player || !player.getComponent) {
        Logger.scope('WeaponSystem').error('Invalid player entity for firing');
        return;
      }

      const weapon = player.getComponent(WeaponComponent);
      if (!weapon) {
        Logger.scope('WeaponSystem').debug('Player has no weapon component');
        return;
      }

      const projectileConfig = weapon.fire();
      if (!projectileConfig) {
        // Weapon might be on cooldown or out of ammo - this is normal
        return;
      }

      // Validate projectile config
      if (!projectileConfig.weaponType || !projectileConfig.damage || !projectileConfig.speed) {
        Logger.scope('WeaponSystem').error(
          'Invalid projectile config from weapon',
          projectileConfig
        );
        return;
      }

      // Calculate fire position
      const fireX = player.x;
      const fireY = player.y - player.height / 2; // Fire from top of player

      // Create projectile
      const projectile = this.createPlayerProjectile(fireX, fireY, projectileConfig);

      if (projectile) {
        try {
          // Fire straight up
          projectile.fire(-Math.PI / 2); // -90 degrees (upward)

          // Add to active projectiles array for optimized iteration
          this.activePlayerProjectiles.push(projectile);

          // Update statistics event-driven (instead of every frame)
          this.stats.projectilesFired++;
          this.stats.projectilesActive++;

          Logger.scope('WeaponSystem').debug(`Player fired: ${projectileConfig.weaponType}`, {
            position: { x: fireX, y: fireY },
            damage: projectileConfig.damage,
            speed: projectileConfig.speed,
            activeCount: this.activePlayerProjectiles.length,
          });
        } catch (fireError) {
          Logger.scope('WeaponSystem').error('Failed to fire projectile', {
            error: fireError.message,
            weaponType: projectileConfig.weaponType,
          });

          // Return failed projectile to pool if possible
          if (this.playerProjectilePool.includes(projectile)) {
            Projectile.returnToPool(this.playerProjectilePool, projectile);
          }
        }
      } else {
        Logger.scope('WeaponSystem').warn('Failed to create projectile for player weapon', {
          weaponType: projectileConfig.weaponType,
          playerPosition: { x: player.x, y: player.y },
        });
      }
    } catch (error) {
      Logger.scope('WeaponSystem').error('WeaponSystem: Critical error in firePlayerWeapon', {
        error: error.message,
        hasPlayer: !!player,
      });
    }
  }

  createPlayerProjectile(x, y, config) {
    try {
      // Validate input parameters
      if (typeof x !== 'number' || typeof y !== 'number' || !config) {
        Logger.scope('WeaponSystem').error('Invalid parameters for createPlayerProjectile', {
          x,
          y,
          config,
        });
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
          Logger.scope('WeaponSystem').warn(
            'Player projectile pool exhausted, created new projectile',
            {
              poolSize: this.playerProjectilePool.length,
              activeCount: this.playerProjectilePool.filter(p => p && p.active).length,
            }
          );
        } catch (creationError) {
          Logger.scope('WeaponSystem').error('Failed to create new projectile', {
            error: creationError.message,
            position: { x, y },
            config: projectileConfig,
          });
          return null;
        }
      }

      // Validate created/retrieved projectile
      if (!projectile || !projectile.setPosition || !projectile.fire) {
        Logger.scope('WeaponSystem').error('Invalid projectile created/retrieved', {
          hasProjectile: !!projectile,
          hasSetPosition: !!(projectile && projectile.setPosition),
          hasFire: !!(projectile && projectile.fire),
        });
        return null;
      }

      // Add projectile to player projectile physics group
      // if (this.scene.playerProjectileGroup && projectile.gameObject) {
      //   this.scene.playerProjectileGroup.add(projectile.gameObject);
      // }

      return projectile;
    } catch (error) {
      Logger.scope('WeaponSystem').error('Failed to create player projectile', {
        error: error.message,
        position: { x, y },
        config,
      });
      return null;
    }
  }

  /**
   * Create enemy projectile
   * @param {BaseEntity} enemy - Enemy entity
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
      Logger.scope('WeaponSystem').warn('Enemy projectile pool exhausted, creating new projectile');
    }

    if (projectile) {
      projectile.fire(angle);

      // Add to active projectiles array for optimized iteration
      this.activeEnemyProjectiles.push(projectile);

      // Add projectile to enemy projectile physics group
      if (this.scene.enemyProjectileGroup && projectile.gameObject) {
        this.scene.enemyProjectileGroup.add(projectile.gameObject);
      }

      // Update statistics event-driven (instead of every frame)
      this.stats.projectilesFired++;
      this.stats.projectilesActive++;
    }

    return projectile;
  }

  /**
   * Update all active projectiles (OPTIMIZED - uses active arrays instead of pool iteration)
   * @param {number} delta - Time delta in milliseconds
   */
  updateProjectiles(delta) {
    // Update player projectiles using optimized active array
    for (let i = this.activePlayerProjectiles.length - 1; i >= 0; i--) {
      const projectile = this.activePlayerProjectiles[i];

      // Validate projectile state
      if (!projectile || !projectile.update) {
        Logger.scope('WeaponSystem').warn('WeaponSystem: Corrupted projectile in active array, removing', { index: i });
        this.activePlayerProjectiles.splice(i, 1);
        this.stats.projectilesActive--;
        continue;
      }

      projectile.update(delta);

      // Check if projectile should be returned to pool
      if (!projectile.active || this.isProjectileOffScreen(projectile)) {
        // Remove from active array
        this.activePlayerProjectiles.splice(i, 1);

        // Return to pool and update statistics
        Projectile.returnToPool(this.playerProjectilePool, projectile);
        this.stats.projectilesActive--;
      }
    }

    // Update enemy projectiles using optimized active array
    for (let i = this.activeEnemyProjectiles.length - 1; i >= 0; i--) {
      const projectile = this.activeEnemyProjectiles[i];

      // Validate projectile state
      if (!projectile || !projectile.update) {
        Logger.scope('WeaponSystem').warn('WeaponSystem: Corrupted enemy projectile in active array, removing', {
          index: i,
        });
        this.activeEnemyProjectiles.splice(i, 1);
        this.stats.projectilesActive--;
        continue;
      }

      projectile.update(delta);

      // Check if projectile should be returned to pool
      if (!projectile.active || this.isProjectileOffScreen(projectile)) {
        // Remove from active array
        this.activeEnemyProjectiles.splice(i, 1);

        // Return to pool and update statistics
        Projectile.returnToPool(this.enemyProjectilePool, projectile);
        this.stats.projectilesActive--;
      }
    }
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
      Logger.scope('WeaponSystem').debug(`Enemy fired: ${enemy.enemyType}`);
    }
  }

  /**
   * Update scopeName statistics
   */
  updateStats() {
    // Count active projectiles
    const activePlayerProjectiles = this.playerProjectilePool.filter(p => p.active).length;
    const activeEnemyProjectiles = this.enemyProjectilePool.filter(p => p.active).length;

    this.stats.projectilesActive = activePlayerProjectiles + activeEnemyProjectiles;
  }

  /**
   * Get all active projectiles (for collision scopeName) - OPTIMIZED
   * @returns {Array} All active projectiles
   */
  getActiveProjectiles() {
    // Use optimized active arrays instead of filtering entire pools
    return [...this.activePlayerProjectiles, ...this.activeEnemyProjectiles];
  }

  /**
   * Get player projectiles only - OPTIMIZED
   * @returns {Array} Active player projectiles
   */
  getPlayerProjectiles() {
    // Use optimized active array instead of filtering entire pool
    return this.activePlayerProjectiles;
  }

  /**
   * Get enemy projectiles only - OPTIMIZED
   * @returns {Array} Active enemy projectiles
   */
  getEnemyProjectiles() {
    // Use optimized active array instead of filtering entire pool
    return this.activeEnemyProjectiles;
  }

  /**
   * Clear all projectiles (for scene transitions) - OPTIMIZED
   */
  clearAllProjectiles() {
    // Clear using optimized active arrays instead of iterating entire pools
    [...this.activePlayerProjectiles].forEach(projectile => {
      Projectile.returnToPool(this.playerProjectilePool, projectile);
    });

    [...this.activeEnemyProjectiles].forEach(projectile => {
      Projectile.returnToPool(this.enemyProjectilePool, projectile);
    });

    // Clear active arrays and update statistics
    this.activePlayerProjectiles = [];
    this.activeEnemyProjectiles = [];
    this.stats.projectilesActive = 0;

    Logger.scope('WeaponSystem').debug('All projectiles cleared');
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

    Logger.scope('WeaponSystem').info(`Projectile pools resized: ${oldSize} -> ${newSize}`);
  }

  /**
   * Get scopeName performance statistics - OPTIMIZED
   * @returns {Object} Performance stats
   */
  getStats() {
    return {
      ...this.stats,
      playerPoolSize: this.playerProjectilePool.length,
      enemyPoolSize: this.enemyProjectilePool.length,
      // Use optimized active arrays instead of filtering pools
      playerPoolActive: this.activePlayerProjectiles.length,
      enemyPoolActive: this.activeEnemyProjectiles.length,
      poolEfficiency:
        this.stats.poolMisses === 0
          ? 100
          : ((this.stats.projectilesFired - this.stats.poolMisses) / this.stats.projectilesFired) *
            100,
    };
  }

  /**
   * Clean up scopeName resources
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

    // Clear all arrays and reset statistics
    this.playerProjectilePool = [];
    this.enemyProjectilePool = [];
    this.activePlayerProjectiles = [];
    this.activeEnemyProjectiles = [];
    this.stats.projectilesActive = 0;

    Logger.scope('WeaponSystem').info('WeaponSystem destroyed');
  }
}
