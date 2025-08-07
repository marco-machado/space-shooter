import ConfigManager from '@/config/ConfigManager.js';
import Player from '@/entities/Player.js';
import { getEventBus } from '@/event-bus/EventBus.js';
import { EventTypes } from '@/event-bus/EventTypes.js';
import GameStateManager from '@/utils/GameStateManager.js';
import Logger from '@/utils/Logger.js';
import { initializeWorld, updateWorldTime } from '@/ecs/index.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });

    // ECS Management
    this.entities = [];
    this.systems = {};

    this.eventBus = getEventBus();
    this.logger = Logger.scope('GameScene');
  }

  /**
   * Initializes the game scene.
   *
   * @return {void} No return value.
   */
  init() {
    this.logger.debug('Initializing game scene');
  }

  /**
   * Creates the game scene.
   *
   * @return {void} Does not return a value.
   */
  create() {
    this.logger.debug('Creating game scene');

    // Initialize bitECS world
    this.world = initializeWorld();

    // Initialize game state manager (now that event scopeName is ready)
    this.gameStateManager = new GameStateManager(this);
    // this.gameStateManager.loadGame();

    this.createBackground();
    this.createCollisionGroups();
    this.setupCollisionDetection();

    this.eventBus.on(EventTypes.GAME_PAUSE_TOGGLE, this.onPauseToggle, this);

    this.player = new Player(this);

    this.scene.launch('UIScene');

    this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.startBackgroundMusic();

    this.cameras.main.fadeIn(500, 0, 0, 0);

    // Start the game
    this.gameStateManager.startGame();
  }

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
    if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
      this.gameStateManager.togglePause();
      return;
    }

    const gameState = this.gameStateManager.getGameState();

    if (!gameState.isPlaying || gameState.isPaused) {
      return;
    }

    // Update bitECS world time
    updateWorldTime(this.world, delta);

    // Update game state manager
    this.gameStateManager.update(delta);

    this.updateBackground();

    // Future: ECS systems pipeline will run here
    // this.runSystemsPipeline(this.world);
  }

  createBackground() {
    this.logger.debug('Creating background');

    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Dark space background
    this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x000011);

    this.stars = this.add.group();

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

      this.stars.add(star);
    }
  }

  createCollisionGroups() {
    this.logger.debug('Creating collision groups');

    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);

    this.playerGroup = this.physics.add.group();
    this.enemyGroup = this.physics.add.group();
    this.playerProjectileGroup = this.physics.add.group();
    this.enemyProjectileGroup = this.physics.add.group();
    this.powerupGroup = this.physics.add.group();
  }

  setupCollisionDetection() {
    this.logger.debug('Creating collision detection');

    // Player projectiles vs enemies
    this.physics.add.overlap(
      this.playerProjectileGroup,
      this.enemyGroup,
      this.handleProjectileEnemyCollision,
      null,
      this,
    );

    // Enemy projectiles vs player
    this.physics.add.overlap(
      this.enemyProjectileGroup,
      this.playerGroup,
      this.handleEnemyProjectilePlayerCollision,
      null,
      this,
    );

    // Player vs enemies (collision damage)
    this.physics.add.overlap(
      this.playerGroup,
      this.enemyGroup,
      this.handlePlayerEnemyCollision,
      null,
      this,
    );

    // Player vs powerups (collection)
    this.physics.add.overlap(
      this.playerGroup,
      this.powerupGroup,
      this.handlePlayerPowerupCollision,
      null,
      this,
    );
  }

  startBackgroundMusic() {
    if (ConfigManager.getConfig().audioEnabled) {
      this.logger.debug('Starting background music');
    }
  }

  updateBackground() {
    this.stars.children.entries.forEach(star => {
      // Reset star position when it goes off screen (physics-based wrapping)
      if (star.y > this.scale.height + 10) {
        star.y = -10;
        star.x = Math.random() * this.scale.width;
      }
    });
  }

  // Collision callback functions (placeholders)
  handleProjectileEnemyCollision(projectile, enemy) {
    this.logger.debug('Projectile-Enemy collision detected', {
      projectileId: projectile.entityId || 'unknown',
      enemyId: enemy.entityId || 'unknown',
    });
  }

  handleEnemyProjectilePlayerCollision(projectile, player) {
    this.logger.debug('Enemy Projectile-Player collision detected', {
      projectileId: projectile.entityId || 'unknown',
      playerId: player.entityId || 'unknown',
    });
  }

  handlePlayerEnemyCollision(player, enemy) {
    this.logger.debug('Player-Enemy collision detected', {
      playerId: player.entityId || 'unknown',
      enemyId: enemy.entityId || 'unknown',
    });
  }

  handlePlayerPowerupCollision(player, powerup) {
    this.logger.debug('Player-Powerup collision detected', {
      playerId: player.entityId || 'unknown',
      powerupId: powerup.entityId || 'unknown',
    });
  }
}
