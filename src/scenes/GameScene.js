import ConfigManager from '@/config/ConfigManager.js';
import GameConfig from '@/config/GameConfig.js';
import { createBackground, updateBackground } from '@/entities/Background.js';
import { playerFactory } from '@/entities/Player.js';
import { createEnemyProjectile, createPlayerProjectile } from '@/entities/Projectile.js';
import { makeEnemyDamagedEvent } from '@/event-bus/EnemyEvents.js';
import { getEventBus } from '@/event-bus/EventBus.js';
import { EventTypes } from '@/event-bus/EventTypes.js';
import EnemySystem from '@/systems/EnemySystem.js';
import PlayerHealthSystem from '@/systems/PlayerHealthSystem.js';
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
  #pauseKey;
  #debugSpawnKey;
  #fireKey;

  // Firing state
  #lastFireTime;
  #isFiring;

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

    this.player = playerFactory(this.#playerGroup);

    // Setup Player Health System
    this.#playerHealthSystem = new PlayerHealthSystem(this.player);

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

    // Handle continuous firing with space key
    this.#handleWeaponFiring(time);

    updateBackground(this.#stars);

    // Update player movement
    if (this.player && this.player.update) {
      this.player.update(this.input.keyboard.cursors, delta);
    }

    // Update projectiles
    this.#updateProjectiles();

    // Update game state manager
    // There shouldn't be anything after this line as it also deals with pause system

    this.#gameStateManager.update(delta);
  }

  /**
   * Handle weapon firing input with rate limiting.
   * @private
   * @param {number} time - Current time in milliseconds
   * @returns {void}
   */
  #handleWeaponFiring(time) {
    const fireKey = this.#fireKey;
    const fireRate = GameConfig.PLAYER.FIRE_RATE;

    if (fireKey.isDown) {
      // Check if enough time has passed since last shot
      if (time - this.#lastFireTime >= fireRate) {
        this.createPlayerProjectile();
        this.#lastFireTime = time;
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
   * Create a projectile from the player.
   * @param {number} [velocityY] - Y velocity override (negative for upward)
   * @returns {Phaser.GameObjects.Rectangle|null} The created projectile or null if no player
   */
  createPlayerProjectile(velocityY) {
    if (!this.player || !this.player.x || !this.player.y) {
      this.#logger.warn('Cannot create player projectile - player not found or invalid position');
      return null;
    }

    const projectile = createPlayerProjectile(
      this.#playerProjectileGroup,
      this.player.x,
      this.player.y,
      velocityY,
    );

    this.#logger.debug('Player projectile created', {
      playerX: this.player.x,
      playerY: this.player.y,
      playerWidth: this.player.displayWidth,
      playerHeight: this.player.displayHeight,
      projectileX: projectile.x,
      projectileY: projectile.y,
      velocityY: projectile.body.velocity.y,
    });

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
   * Handle collision between player projectile and enemy.
   * @param {Phaser.Physics.Arcade.Sprite} projectile - The player projectile
   * @param {Phaser.Physics.Arcade.Sprite} enemy - The enemy sprite
   * @returns {void}
   */
  handleProjectileEnemyCollision(projectile, enemy) {
    this.#logger.debug('Player projectile hit enemy', {
      projectileOwner: projectile?.owner,
      projectileDamage: projectile?.damage,
    });

    const event = makeEnemyDamagedEvent(enemy, projectile?.damage || 1);
    this.#eventBus.emit(event.type, event.data, event.priority);

    // Destroy projectile
    if (projectile && projectile.destroy) {
      projectile.destroy();
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
