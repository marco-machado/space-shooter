import ConfigManager from '@/config/ConfigManager.js';
import { getEventBus } from '@/event-bus/EventBus.js';
import { EventTypes } from '@/event-bus/EventTypes.js';
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
  #playerProjectileGroup;
  #enemyProjectileGroup;
  #powerupGroup;
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

    this.createBackground();
    this.createCollisionGroups();
    this.setupCollisionDetection();

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
   * Main game update loop.
   *
   * @param {number} _time - Current time (unused)
   * @param {number} delta - Time delta in milliseconds (unused)
   */
  update(_time, delta) {
    const gameState = this.#gameStateManager.getGameState();

    if (Phaser.Input.Keyboard.JustDown(this.#pauseKey)) {
      this.#gameStateManager.togglePause();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.#debugSpawnKey)) {
      this.#logger.debug('DEBUG SPAWN KEY');
    }

    if (!gameState.isPlaying || gameState.isPaused) {
      return;
    }

    // Update game state manager
    this.#gameStateManager.update(delta);

    this.updateBackground();
  }

  /**
   * Create the scrolling star background.
   * @private
   * @returns {void}
   */
  createBackground() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Dark space background
    this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x000011);

    this.#stars = this.add.group();

    for (let i = 0; i < 100; i++) {
      const star = this.add.circle(
        Math.random() * this.scale.width,
        Math.random() * this.scale.height,
        Math.random() * 1.5 + 0.5,
        0xffffff,
        Math.random() * 0.8 + 0.2,
      );

      this.physics.add.existing(star);

      star.body.setVelocity(0, Math.random() * 50 + 25);
      star.body.setCollideWorldBounds(false);

      this.#stars.add(star);
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
    this.#playerProjectileGroup = this.physics.add.group();
    this.#enemyProjectileGroup = this.physics.add.group();
    this.#powerupGroup = this.physics.add.group();
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
   * Update the scrolling background stars.
   * @private
   * @returns {void}
   */
  updateBackground() {
    this.#stars.children.entries.forEach(star => {
      // Reset star position when it goes off screen (physics-based wrapping)
      if (star.y > this.scale.height + 10) {
        star.y = -10;
        star.x = Math.random() * this.scale.width;
      }
    });
  }

  /**
   * Handle collision between player projectile and enemy.
   * @param {Phaser.Physics.Arcade.Sprite} projectile - The player projectile
   * @param {Phaser.Physics.Arcade.Sprite} enemy - The enemy sprite
   * @returns {void}
   */
  handleProjectileEnemyCollision(projectile, enemy) {
    this.#logger.debug('handleProjectileEnemyCollision', projectile, enemy);
  }

  /**
   * Handle collision between enemy projectile and player.
   * @param {Phaser.Physics.Arcade.Sprite} projectile - The enemy projectile
   * @param {Phaser.Physics.Arcade.Sprite} player - The player sprite
   * @returns {void}
   */
  handleEnemyProjectilePlayerCollision(projectile, player) {
    this.#logger.debug('handleEnemyProjectilePlayerCollision', projectile, player);
  }

  /**
   * Handle collision between player and enemy.
   * @param {Phaser.Physics.Arcade.Sprite} player - The player sprite
   * @param {Phaser.Physics.Arcade.Sprite} enemy - The enemy sprite
   * @returns {void}
   */
  handlePlayerEnemyCollision(player, enemy) {
    this.#logger.debug('handlePlayerEnemyCollision', player, enemy);
  }

  /**
   * Handle collision between player and power-up.
   * @param {Phaser.Physics.Arcade.Sprite} player - The player sprite
   * @param {Phaser.Physics.Arcade.Sprite} powerup - The power-up sprite
   * @returns {void}
   */
  handlePlayerPowerupCollision(player, powerup) {
    this.#logger.debug('handlePlayerPowerupCollision', player, powerup);
  }
}
