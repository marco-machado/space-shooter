import ConfigManager from '@/config/ConfigManager.js';
import GameConfig from '@/config/GameConfig.js';
import { createBackground, updateBackground } from '@/entities/Background.js';
import { playerFactory } from '@/entities/Player.js';
import { createEnemyProjectile } from '@/entities/Projectile.js';
import { makeEnemyDamagedEvent } from '@/event-bus/EnemyEvents.js';
import { getEventBus } from '@/event-bus/EventBus.js';
import { EventTypes } from '@/event-bus/EventTypes.js';
import EnemySystem from '@/systems/EnemySystem.js';
import PlayerHealthSystem from '@/systems/PlayerHealthSystem.js';
import UpgradeSystem from '@/systems/UpgradeSystem.js';
import VisualFXSystem from '@/systems/VisualFXSystem.js';
import GameStateManager from '@/utils/GameStateManager.js';
import Logger from '@/utils/Logger.js';

/**
 * Main game scene handling gameplay, entities, and game state.
 * @class
 * @classdesc Manages the core game loop, collision detection, and entity interactions.
 * @extends Phaser.Scene
 */
export default class GameScene extends Phaser.Scene {
  // Private fields
  #eventBus;
  #logger;
  #gameStateManager;

  #stars;

  #playerGroup;
  #enemyGroup;
  #enemyBoundsGroup;
  #playerProjectileGroup;
  #enemyProjectileGroup;
  #powerupGroup;

  #enemySpawner;
  #playerHealthSystem;
  #upgradeSystem;
  #visualFXSystem;
  #pauseKey;
  #debugSpawnKey;
  #fireKey;

  // Firing state
  #lastFireTime;
  #isFiring;

  // Weapon system state
  #currentWeapon;
  #weaponSwitchKeys;

  /**
   * Create a new GameScene instance.
   */
  constructor() {
    super({ key: 'GameScene' });

    this.#eventBus = getEventBus();
    this.#logger = Logger.scope('GameScene');

    // Initialize firing state
    this.#lastFireTime = 0;
    this.#isFiring = false;

    // Initialize weapon system
    this.#currentWeapon = GameConfig.PLAYER.CURRENT_WEAPON;
  }

  /**
   * Initialize the game scene and set up all systems.
   * @returns {void}
   */
  create() {
    // Initialize game state manager (now that event scopeName is ready)
    this.#gameStateManager = new GameStateManager(this);

    // this.createBackground();
    this.#stars = createBackground(this);

    this.createCollisionGroups();
    this.setupCollisionDetection();

    // Setup Upgrade System
    this.#upgradeSystem = new UpgradeSystem(this.#gameStateManager);

    // Create player with upgrade system integration
    this.player = playerFactory(this.#playerGroup, this.#upgradeSystem);

    // Setup Player Health System with upgrade system integration
    this.#playerHealthSystem = new PlayerHealthSystem(this.player, this.#upgradeSystem);
    
    // Make upgrade system accessible for other scenes (like UIScene)
    this.upgradeSystem = this.#upgradeSystem;

    // Setup Visual Effects System
    this.#visualFXSystem = new VisualFXSystem(this, this.player);

    // Setup Enemy Spawner
    this.#enemySpawner = new EnemySystem(this, this.#enemyGroup);

    this.#eventBus.on(EventTypes.GAME_PAUSE_TOGGLE, this.onPauseToggle, this);
    this.#eventBus.on(EventTypes.GAME_OVER, this.onGameOver, this);

    this.scene.launch('UIScene');

    // Create cursor keys for player input system
    this.input.keyboard.cursors = this.input.keyboard.createCursorKeys();

    this.#pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.#debugSpawnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E); // DEBUG: E to force spawn enemy

    this.#fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Weapon switching keys
    this.#weaponSwitchKeys = {
      laser: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      plasma: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      missile: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
    };

    this.startBackgroundMusic();

    this.cameras.main.fadeIn(500, 0, 0, 0);

    // Start the game
    this.#gameStateManager.startGame();
  }

  /**
   * Main game update loop.
   *
   * @param {number} time - Current time in milliseconds
   * @param {number} delta - Time delta in milliseconds
   */
  update(time, delta) {
    if (Phaser.Input.Keyboard.JustDown(this.#pauseKey)) {
      this.#gameStateManager.togglePause();
      return;
    }

    // Handle weapon switching
    this.#handleWeaponSwitching();

    // Handle continuous firing with space key
    this.#handleWeaponFiring(time);

    updateBackground(this.#stars);

    // Update player movement
    if (this.player && this.player.update) {
      this.player.update(this.input.keyboard.cursors, delta);
    }

    // Update projectiles
    this.#updateProjectiles();

    // Update visual effects system
    if (this.#visualFXSystem) {
      this.#visualFXSystem.update(delta);
    }

    // Update player health system (for shield regeneration)
    if (this.#playerHealthSystem) {
      this.#playerHealthSystem.update(delta);
    }

    // Update game state manager
    // There shouldn't be anything after this line as it also deals with pause system

    this.#gameStateManager.update(delta);
  }

  /**
   * Handle weapon switching input
   * @private
   * @returns {void}
   */
  #handleWeaponSwitching() {
    for (const [weaponType, key] of Object.entries(this.#weaponSwitchKeys)) {
      if (Phaser.Input.Keyboard.JustDown(key)) {
        this.switchWeapon(weaponType);
        break;
      }
    }
  }

  /**
   * Switch to a different weapon type
   * @param {string} weaponType - The weapon type to switch to ('laser', 'plasma', 'missile')
   * @returns {boolean} True if weapon switch was successful
   */
  switchWeapon(weaponType) {
    const weaponConfig = GameConfig.WEAPONS[weaponType.toUpperCase()];
    if (!weaponConfig) {
      this.#logger.warn(`Unknown weapon type: ${weaponType}`);
      return false;
    }

    // TODO: Add upgrade validation - check if weapon is unlocked
    // For now, allow all weapons

    const previousWeapon = this.#currentWeapon;
    this.#currentWeapon = weaponType;

    this.#logger.info(`Weapon switched: ${previousWeapon} -> ${weaponType}`);

    // Emit weapon switched event
    this.#eventBus.emit(EventTypes.WEAPON_SWITCHED, {
      previousWeapon,
      currentWeapon: weaponType,
      weaponConfig: weaponConfig,
    });

    return true;
  }

  /**
   * Get current weapon configuration
   * @returns {Object} Current weapon configuration
   */
  getCurrentWeaponConfig() {
    return GameConfig.WEAPONS[this.#currentWeapon.toUpperCase()];
  }

  /**
   * Handle weapon firing input with rate limiting and heat management.
   * @private
   * @param {number} time - Current time in milliseconds
   * @returns {void}
   */
  #handleWeaponFiring(time) {
    const fireKey = this.#fireKey;
    const weaponConfig = this.getCurrentWeaponConfig();
    const baseFireRate = weaponConfig ? weaponConfig.FIRE_RATE : GameConfig.PLAYER.FIRE_RATE;

    // Update weapon cooling system
    if (this.#upgradeSystem) {
      this.#upgradeSystem.updateWeaponCooling(time, this.game.loop.delta);
    }

    if (fireKey.isDown) {
      // Check if weapon can fire (considering heat and fire rate)
      const firePermission = this.#upgradeSystem ? 
        this.#upgradeSystem.canWeaponFire(time, this.#lastFireTime, baseFireRate) :
        { canFire: time - this.#lastFireTime >= baseFireRate, reason: 'READY' };

      if (firePermission.canFire) {
        this.createPlayerProjectile();
        this.#lastFireTime = time;
        
        // Add heat to weapon based on weapon type
        if (this.#upgradeSystem && weaponConfig) {
          this.#upgradeSystem.addWeaponHeat(weaponConfig.HEAT_PER_SHOT);
        }
      } else if (firePermission.reason === 'OVERHEATED') {
        // Visual feedback for overheating could be added here
        this.#logger.debug('Weapon overheated, cannot fire', {
          weaponType: this.#currentWeapon,
          heatLevel: firePermission.heatLevel,
          threshold: firePermission.heatThreshold,
        });
      }
    }
  }

  /**
   * Handle pause toggle events from the event bus.
   * @param {Object} data - Pause event data
   * @param {boolean} data.paused - Whether the game should be paused
   * @returns {void}
   */
  onPauseToggle(data) {
    if (data && data.paused) {
      // Pause physics and time
      this.physics.pause();
      this.time.paused = true;
    } else {
      // Resume physics and time
      this.physics.resume();
      this.time.paused = false;
    }
  }

  /**
   * Handle game over event
   * @param {Object} data - Game over event data
   */
  onGameOver(data) {
    this.#logger.debug('Game over event received:', data);

    // Stop all game systems
    if (this.player) {
      this.player.setActive(false);
      this.player.setVisible(false);
    }

    // Pause physics to stop all movement
    this.physics.pause();

    // Disable input
    this.input.keyboard.enabled = false;

    // Note: EnemySystem automatically handles GAME_OVER events

    // Create transition effect and switch scenes
    this.cameras.main.fadeOut(1000);

    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      // Stop UIScene before starting GameOverScene
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene', data);
    });
  }

  /**
   * Create a projectile from the player with upgrade effects applied.
   * @param {number} [velocityY] - Y velocity override (negative for upward)
   * @returns {Array<Phaser.GameObjects.Rectangle>} Array of created projectiles (empty if failed)
   */
  createPlayerProjectile(velocityY) {
    if (!this.player || !this.player.x || !this.player.y) {
      this.#logger.warn('Cannot create player projectile - player not found or invalid position');
      return [];
    }

    const projectiles = [];
    const upgradeEffects = this.#upgradeSystem.getUpgradeEffects();
    const weaponConfig = this.getCurrentWeaponConfig();
    
    // Use weapon-specific configuration or fallback to legacy settings
    const projectileConfig = weaponConfig ? weaponConfig.PROJECTILE : GameConfig.PROJECTILES.PLAYER;
    
    // Calculate base velocity with upgrade effects
    const baseVelocity = velocityY || -projectileConfig.SPEED;
    const enhancedVelocity = baseVelocity * upgradeEffects.weaponSpeedMultiplier;
    
    // Calculate damage with upgrade effects
    const baseDamage = projectileConfig.DAMAGE;
    const enhancedDamage = Math.floor(baseDamage * upgradeEffects.weaponDamageMultiplier);
    
    // Determine projectile count and positions
    const shotCount = upgradeEffects.weaponMultishot;
    const useSpread = upgradeEffects.weaponSpreadPattern && shotCount > 1;
    
    for (let i = 0; i < shotCount; i++) {
      let offsetX = 0;
      let velocityX = 0;
      
      if (shotCount > 1) {
        if (useSpread) {
          // Spread pattern for triple threat
          const spreadAngle = 20; // degrees
          const angleStep = (shotCount > 1) ? (spreadAngle * 2) / (shotCount - 1) : 0;
          const angle = (-spreadAngle + i * angleStep) * (Math.PI / 180);
          
          velocityX = enhancedVelocity * Math.sin(angle) * 0.5; // Reduced horizontal component
          offsetX = 0; // All start from center
        } else {
          // Parallel shots for twin lasers
          const spacing = 20;
          offsetX = (i - (shotCount - 1) / 2) * spacing;
        }
      }
      
      const projectile = this.createEnhancedProjectile(
        this.player.x + offsetX,
        this.player.y,
        velocityX,
        enhancedVelocity,
        enhancedDamage,
        upgradeEffects.weaponPiercing,
        projectileConfig,
        this.#currentWeapon,
        upgradeEffects
      );
      
      if (projectile) {
        projectiles.push(projectile);
      }
    }

    // Emit weapon fired event for statistics
    this.#eventBus.emit(EventTypes.WEAPON_FIRED, {
      weaponType: this.#currentWeapon,
      projectileCount: projectiles.length,
      damage: enhancedDamage,
      piercing: upgradeEffects.weaponPiercing,
      weaponConfig: weaponConfig,
    });

    this.#logger.debug('Player projectiles created', {
      count: projectiles.length,
      damage: enhancedDamage,
      velocity: enhancedVelocity,
      piercing: upgradeEffects.weaponPiercing,
      spread: useSpread,
    });

    return projectiles;
  }

  /**
   * Create an enhanced projectile with upgrade effects
   * @private
   * @param {number} x - X position
   * @param {number} y - Y position  
   * @param {number} velocityX - X velocity
   * @param {number} velocityY - Y velocity
   * @param {number} damage - Damage value
   * @param {number} piercing - Number of enemies this projectile can pierce
   * @param {Object} projectileConfig - Weapon-specific projectile configuration
   * @param {string} weaponType - Current weapon type
   * @param {Object} upgradeEffects - Full upgrade effects object
   * @returns {Phaser.GameObjects.Rectangle|null} The created projectile
   */
  createEnhancedProjectile(x, y, velocityX, velocityY, damage, piercing, projectileConfig, weaponType, upgradeEffects) {
    const config = projectileConfig || GameConfig.PROJECTILES.PLAYER;
    
    // Apply critical hit chance for plasma weapons
    let finalDamage = damage;
    if (weaponType === 'plasma' && upgradeEffects.plasmaOverchargeChance > 0) {
      if (Math.random() < upgradeEffects.plasmaOverchargeChance) {
        finalDamage = damage * 2; // Critical hit doubles damage
        this.#logger.debug('Plasma critical hit!', { originalDamage: damage, criticalDamage: finalDamage });
      }
    }
    
    const projectile = this.add.rectangle(
      x, y,
      config.WIDTH,
      config.HEIGHT,
      config.COLOR
    );

    // Add to physics group
    this.#playerProjectileGroup.add(projectile);

    // Set velocity
    projectile.body.setVelocity(velocityX, velocityY);

    // Disable world bounds collision
    projectile.body.setCollideWorldBounds(false);

    // Store enhanced properties
    projectile.damage = finalDamage;
    projectile.owner = 'player';
    projectile.weaponType = weaponType;
    projectile.upgradeEffects = upgradeEffects;
    projectile.piercing = piercing;
    projectile.piercedEnemies = 0; // Track how many enemies this has pierced
    projectile.isTracking = false; // For missile tracking
    projectile.trackingTarget = null; // Current tracking target

    /**
     * Enhanced update method with weapon-specific behavior
     * @returns {void}
     */
    projectile.update = function () {
      // Handle missile tracking behavior
      if (this.weaponType === 'missile' && this.upgradeEffects.missileTrackingEnabled) {
        const enemies = this.scene.#enemyGroup ? this.scene.#enemyGroup.children.entries : [];
        this.updateMissileTracking(enemies);
      }
      
      // Check bounds
      const padding = 50;
      if (
        this.x < -padding ||
        this.x > this.scene.scale.width + padding ||
        this.y < -padding ||
        this.y > this.scene.scale.height + padding
      ) {
        this.destroy();
      }
    };

    // Add missile tracking methods (same as in Projectile.js)
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

    // Add explosion method for plasma weapons
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
      
      return damagedTargets;
    };

    return projectile;
  }

  /**
   * Create a projectile from an enemy.
   * @param {Phaser.GameObjects.GameObject} enemy - The enemy that fires the projectile
   * @param {number} [velocityY] - Y velocity override (positive for downward)
   * @returns {Phaser.GameObjects.Rectangle|null} The created projectile or null if invalid enemy
   */
  createEnemyProjectile(enemy, velocityY) {
    if (!enemy || !enemy.x || !enemy.y) {
      this.#logger.warn('Cannot create enemy projectile - enemy not found or invalid position');
      return null;
    }

    const projectile = createEnemyProjectile(
      this.#enemyProjectileGroup,
      enemy.x,
      enemy.y + enemy.displayHeight / 2 + 5, // Spawn just below enemy
      velocityY,
    );

    this.#logger.debug('Enemy projectile created', {
      x: projectile.x,
      y: projectile.y,
      velocityY: projectile.body.velocity.y,
    });

    return projectile;
  }

  /**
   * Update all projectiles (call their update methods for cleanup).
   * @private
   * @returns {void}
   */
  #updateProjectiles() {
    // Update player projectiles
    this.#playerProjectileGroup.children.entries.forEach(projectile => {
      if (projectile.update && typeof projectile.update === 'function') {
        projectile.update();
      }
    });

    // Update enemy projectiles
    this.#enemyProjectileGroup.children.entries.forEach(projectile => {
      if (projectile.update && typeof projectile.update === 'function') {
        projectile.update();
      }
    });
  }

  /**
   * Create physics groups for collision detection.
   * @private
   * @returns {void}
   */
  createCollisionGroups() {
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);

    this.#playerGroup = this.physics.add.group();
    this.#enemyGroup = this.physics.add.group();
    this.#enemyBoundsGroup = this.physics.add.group();
    this.#playerProjectileGroup = this.physics.add.group();
    this.#enemyProjectileGroup = this.physics.add.group();
    this.#powerupGroup = this.physics.add.group();

    const lowerBounds = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height + 50,
      this.scale.width,
      10,
      0x00ff00,
    );
    this.#enemyBoundsGroup.add(lowerBounds);
  }

  /**
   * Set up collision detection between game object groups.
   * @private
   * @returns {void}
   */
  setupCollisionDetection() {
    // Player projectiles vs enemies
    this.physics.add.overlap(
      this.#playerProjectileGroup,
      this.#enemyGroup,
      this.handleProjectileEnemyCollision,
      null,
      this,
    );

    // Enemy projectiles vs player
    this.physics.add.overlap(
      this.#enemyProjectileGroup,
      this.#playerGroup,
      this.handleEnemyProjectilePlayerCollision,
      null,
      this,
    );

    // Player vs enemies (collision damage)
    this.physics.add.overlap(
      this.#playerGroup,
      this.#enemyGroup,
      this.handlePlayerEnemyCollision,
      null,
      this,
    );

    // Player vs powerups (collection)
    this.physics.add.overlap(
      this.#playerGroup,
      this.#powerupGroup,
      this.handlePlayerPowerupCollision,
      null,
      this,
    );

    // Enemies vs bounds
    this.physics.add.overlap(
      this.#enemyGroup,
      this.#enemyBoundsGroup,
      o1 => {
        o1.destroy();
      },
      null,
      this,
    );
  }

  /**
   * Start background music if audio is enabled.
   * @private
   * @returns {void}
   */
  startBackgroundMusic() {
    if (ConfigManager.getConfig().audioEnabled) {
      // Background music implementation will be added when audio assets are ready
    }
  }

  /**
   * Handle collision between player projectile and enemy with piercing support.
   * @param {Phaser.Physics.Arcade.Sprite} projectile - The player projectile
   * @param {Phaser.Physics.Arcade.Sprite} enemy - The enemy sprite
   * @returns {void}
   */
  handleProjectileEnemyCollision(projectile, enemy) {
    this.#logger.debug('Player projectile hit enemy', {
      projectileOwner: projectile?.owner,
      projectileDamage: projectile?.damage,
      projectilePiercing: projectile?.piercing,
      piercedCount: projectile?.piercedEnemies,
      weaponType: projectile?.weaponType,
    });

    // Apply damage to enemy
    const event = makeEnemyDamagedEvent(enemy, projectile?.damage || 1);
    this.#eventBus.emit(event.type, event.data, event.priority);

    // Handle plasma explosion damage
    if (projectile && projectile.weaponType === 'plasma' && projectile.explode) {
      const enemies = this.#enemyGroup ? this.#enemyGroup.children.entries : [];
      const explosionTargets = projectile.explode(enemies);
      
      this.#logger.debug('Plasma explosion hit targets', {
        explosionTargets: explosionTargets.length,
        radius: projectile.upgradeEffects?.plasmaExplosionRadius,
      });
      
      // Apply explosion damage to additional targets
      for (const explosionTarget of explosionTargets) {
        if (explosionTarget.target !== enemy) { // Don't double-damage the direct hit target
          const explosionEvent = makeEnemyDamagedEvent(explosionTarget.target, explosionTarget.damage);
          this.#eventBus.emit(explosionEvent.type, explosionEvent.data, explosionEvent.priority);
        }
      }
    }

    // Emit weapon hit event for statistics
    this.#eventBus.emit(EventTypes.WEAPON_HIT, {
      weaponType: projectile?.weaponType || 'laser',
      damage: projectile?.damage || 1,
      target: 'enemy',
    });

    // Handle piercing mechanics
    if (projectile && projectile.piercing > 0) {
      projectile.piercedEnemies = (projectile.piercedEnemies || 0) + 1;
      
      // Only destroy projectile if it has pierced through its limit
      if (projectile.piercedEnemies >= projectile.piercing) {
        this.#logger.debug('Projectile pierced maximum enemies, destroying', {
          piercedEnemies: projectile.piercedEnemies,
          maxPiercing: projectile.piercing,
        });
        
        if (projectile.destroy) {
          projectile.destroy();
        }
      } else {
        this.#logger.debug('Projectile continues after piercing', {
          piercedEnemies: projectile.piercedEnemies,
          maxPiercing: projectile.piercing,
        });
      }
    } else {
      // Non-piercing projectile, destroy immediately
      if (projectile && projectile.destroy) {
        projectile.destroy();
      }
    }
  }

  /**
   * Handle collision between enemy projectile and player.
   * @param {Phaser.Physics.Arcade.Sprite} projectile - The enemy projectile
   * @param {Phaser.Physics.Arcade.Sprite} player - The player sprite
   * @returns {void}
   */
  handleEnemyProjectilePlayerCollision(projectile, player) {
    this.#logger.debug('Enemy projectile hit player', {
      projectileOwner: projectile?.owner,
      projectileDamage: projectile?.damage,
    });

    // Destroy projectile
    if (projectile && projectile.destroy) {
      projectile.destroy();
    }

    // Damage player
    const damage = projectile?.damage || 1;
    this.#logger.debug('Player takes damage', { damage });

    // Emit player damage event
    this.#eventBus.emit(EventTypes.PLAYER_DAMAGED, {
      player,
      damage,
      cause: 'enemy-projectile',
    });

    // Handle player death if necessary (this would typically be handled by a player health system)
    // For now, we just log it since the player entity doesn't have health implemented yet
    this.#logger.warn('Player hit by enemy projectile - health system not yet implemented');
  }

  /**
   * Handle collision between player and enemy.
   * @param {Phaser.Physics.Arcade.Sprite} player - The player sprite
   * @param {Phaser.Physics.Arcade.Sprite} enemy - The enemy sprite
   * @returns {void}
   */
  handlePlayerEnemyCollision(player, enemy) {
    // Apply collision damage to player
    const damage = enemy.getEnemyComponent ? enemy.getEnemyComponent().damage : 1;

    const event = makeEnemyDamagedEvent(enemy, 5);
    this.#eventBus.emit(event.type, event.data, event.priority);

    // Emit player damage event
    this.#eventBus.emit(EventTypes.PLAYER_DAMAGED, {
      damage,
      source: 'collision',
      enemy,
    });
  }

  /**
   * Handle collision between player and power-up.
   * @param {Phaser.Physics.Arcade.Sprite} player - The player sprite
   * @param {Phaser.Physics.Arcade.Sprite} powerup - The power-up sprite
   * @returns {void}
   */
  handlePlayerPowerupCollision(_player, _powerup) {
    // this.#logger.debug('handlePlayerPowerupCollision', _player, _powerup);
  }

  /**
   * Clean up scene resources when shutting down
   * @returns {void}
   */
  shutdown() {
    // Clean up PlayerHealthSystem
    if (this.#playerHealthSystem) {
      this.#playerHealthSystem.destroy();
      this.#playerHealthSystem = null;
    }

    // Clean up VisualFXSystem
    if (this.#visualFXSystem) {
      this.#visualFXSystem.destroy();
      this.#visualFXSystem = null;
    }

    // Clean up UpgradeSystem
    if (this.#upgradeSystem) {
      this.#upgradeSystem.destroy();
      this.#upgradeSystem = null;
    }

    // Remove event listeners
    this.#eventBus.off(EventTypes.GAME_PAUSE_TOGGLE, this.onPauseToggle, this);
    this.#eventBus.off(EventTypes.GAME_OVER, this.onGameOver, this);

    // Clean up other systems
    if (this.#gameStateManager) {
      this.#gameStateManager.destroy();
    }

    this.#logger.debug('GameScene shutdown complete');
  }
}
