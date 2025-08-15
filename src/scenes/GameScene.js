import ConfigManager from '@/config/ConfigManager.js';
import { createBackground, updateBackground } from '@/entities/Background.js';
import { playerFactory } from '@/entities/Player.js';
import { getEventBus } from '@/event-bus/EventBus.js';
import { EventTypes } from '@/event-bus/EventTypes.js';
import EnemySpawner from '@/systems/EnemySpawner.js';
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
  #pauseKey;
  #debugSpawnKey;

  /**
   * Create a new GameScene instance.
   */
  constructor() {
    super({ key: 'GameScene' });

    this.#eventBus = getEventBus();
    this.#logger = Logger.scope('GameScene');
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

    // Setup Enemy Spawner
    this.#enemySpawner = new EnemySpawner(this, this.#enemyGroup);

    this.#eventBus.on(EventTypes.GAME_PAUSE_TOGGLE, this.onPauseToggle, this);

    this.scene.launch('UIScene');

    // Create cursor keys for player input system
    this.input.keyboard.cursors = this.input.keyboard.createCursorKeys();

    this.#pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.#debugSpawnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E); // DEBUG: E to force spawn enemy

    this.startBackgroundMusic();

    this.cameras.main.fadeIn(500, 0, 0, 0);

    // Start the game
    this.#gameStateManager.startGame();
  }

  /**
   * Main game update loop.
   *
   * @param {number} _time - Current time (unused)
   * @param {number} delta - Time delta in milliseconds (unused)
   */
  update(_time, delta) {
    if (Phaser.Input.Keyboard.JustDown(this.#pauseKey)) {
      this.#gameStateManager.togglePause();
      return;
    }

    updateBackground(this.#stars);

    // Update player movement
    if (this.player && this.player.update) {
      this.player.update(this.input.keyboard.cursors, delta);
    }

    // Update game state manager
    // There shouldn't be anything after this line as it also deals with pause system

    this.#gameStateManager.update(delta);
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
    // Destroy projectile
    if (projectile && projectile.destroy) {
      projectile.destroy();
    }

    // Damage enemy
    if (enemy && enemy.takeDamage && typeof enemy.takeDamage === 'function') {
      const destroyed = enemy.takeDamage(1, projectile);

      if (destroyed) {
        this.#logger.debug('Enemy destroyed by projectile');
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
    // this.#logger.debug('handleEnemyProjectilePlayerCollision', projectile, player);
  }

  /**
   * Handle collision between player and enemy.
   * @param {Phaser.Physics.Arcade.Sprite} player - The player sprite
   * @param {Phaser.Physics.Arcade.Sprite} enemy - The enemy sprite
   * @returns {void}
   */
  handlePlayerEnemyCollision(player, enemy) {
    // this.#logger.debug('handlePlayerEnemyCollision', player, enemy);

    // Damage both player and enemy on collision
    if (enemy && enemy.takeDamage && typeof enemy.takeDamage === 'function') {
      enemy.takeDamage(1, player);
    }

    // TODO: Implement player damage when player system is ready
    // if (player && player.takeDamage && typeof player.takeDamage === 'function') {
    //   player.takeDamage(enemy.getEnemyComponent ? enemy.getEnemyComponent().damage : 1, enemy);
    // }
  }

  /**
   * Handle collision between player and power-up.
   * @param {Phaser.Physics.Arcade.Sprite} player - The player sprite
   * @param {Phaser.Physics.Arcade.Sprite} powerup - The power-up sprite
   * @returns {void}
   */
  handlePlayerPowerupCollision(player, powerup) {
    // this.#logger.debug('handlePlayerPowerupCollision', player, powerup);
  }
}
