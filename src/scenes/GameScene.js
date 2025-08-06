import Logger from '@/utils/Logger.js';
import ConfigManager from '@/config/ConfigManager.js';
import BaseEntity from '@/entities/BaseEntity.js';
import HealthComponent from '@/components/HealthComponent.js';
import MovementComponent from '@/components/MovementComponent.js';
import WeaponComponent from '@/components/WeaponComponent.js';
import MovementSystem from '@/systems/MovementSystem.js';
import KeyboardInputAdapter from '@/adapters/KeyboardInputAdapter.js';
import GameStateManager from '@/utils/GameStateManager.js';
import WeaponSystem from '@/systems/WeaponSystem.js';
import EnemySpawnSystem from '@/systems/EnemySpawnSystem.js';
import { EventTypes } from '@/event-bus/EventTypes.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });

    // ECS Management
    this.entities = [];
    this.systems = {};

    this.adapters = new Map();
  }

  /**
   * Initializes the game scene.
   *
   * @return {void} No return value.
   */
  init() {
    Logger.scope('GameScene').info('Initializing game scene');
  }

  /**
   * Creates the game scene.
   *
   * @return {void} Does not return a value.
   */
  create() {
    Logger.scope('GameScene').info('Creating game scene');

    // Initialize game state manager (now that event scopeName is ready)
    this.gameStateManager = new GameStateManager(this);
    // this.gameStateManager.loadGame(); // Load saved progress

    // Create background
    this.createBackground();

    // Set up physics groups
    this.setupPhysicsGroups();

    // Create player
    this.createPlayer();

    // Initialize all systems
    this.initializeSystems();

    // Launch UI scene to handle all UI elements
    this.scene.launch('UIScene');

    // Initialize all adapters
    this.initializeAdapters();

    // Start background music (when implemented)
    this.startBackgroundMusic();

    // Fade in from black
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // Start the game
    this.gameStateManager.startGame();
  }

  /**
   * Main game update loop.
   *
   * @param {number} time - Current time
   * @param {number} delta - Time delta in milliseconds
   */
  update(time, delta) {
    const gameState = this.gameStateManager.getGameState();

    if (!gameState.isPlaying || gameState.isPaused) {
      return;
    }

    // Update game state manager
    this.gameStateManager.update(delta);

    // Update background stars
    this.updateBackground(delta);

    // Update all systems
    this.updateSystems(delta);
  }

  createBackground() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Dark space background
    this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x000011);

    // Add scrolling stars for space feel
    this.stars = this.add.group();

    for (let i = 0; i < 100; i++) {
      const star = this.add.circle(
        Math.random() * this.scale.width,
        Math.random() * this.scale.height,
        Math.random() * 1.5 + 0.5,
        0xffffff,
        Math.random() * 0.8 + 0.2
      );

      star.setData('speed', Math.random() * 50 + 25);
      this.stars.add(star);
    }
  }

  setupPhysicsGroups() {
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);

    this.playerGroup = this.physics.add.group();
    this.enemyGroup = this.physics.add.group();
    this.playerProjectileGroup = this.physics.add.group();
    this.enemyProjectileGroup = this.physics.add.group();
    this.powerupGroup = this.physics.add.group();
  }

  createPlayer() {
    // TODO: Create a player entity
    const startX = this.scale.width / 2;
    const startY = this.scale.height - 100;

    // Create player entity (blue rectangle in development)
    this.player = new BaseEntity(this, startX, startY, 64, 64, 0x0099ff, 'player');

    // Mark as player for identification by MovementSystem
    this.player.entityType = 'player';

    // Add components
    this.player.addComponent(new HealthComponent(100));

    const movementComponent = new MovementComponent(300); // 300 pixels/second max speed
    movementComponent.init({
      boundToScreen: true,
      screenPadding: 32,
      boundaryBehavior: 'clamp',
      aiPattern: 'none', // Player uses input, not AI
    });
    this.player.addComponent(movementComponent);

    // Add weapon component with starting weapon
    const weaponComponent = new WeaponComponent('laser');
    weaponComponent.init({
      availableWeapons: Array.from(this.gameStateManager.weaponsUnlocked),
      currentWeapon: 'laser',
    });
    this.player.addComponent(weaponComponent);

    // Enable physics with collision configuration
    this.player.enablePhysics('dynamic');

    this.player.body.setSize(this.player.width * 0.8, this.player.height * 0.8);
    this.player.body.setOffset(this.player.width * 0.1, this.player.height * 0.1);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setImmovable(false);
    this.player.body.setBounce(0);
    this.player.body.setDrag(0);
    this.player.body.setMaxVelocity(300, 300);

    // Manually add to player group if PhysicsHelper failed
    this.playerGroup.add(this.player.gameObject);

    // Set depth for layering
    this.player.setDepth(30);

    // Add to entities array for scopeName processing
    this.entities.push(this.player);
  }

  initializeSystems() {
    // Movement System - handles all entity movement and AI patterns
    this.systems.movement = new MovementSystem(this);
    this.systems.movement.init({ priority: 10 });

    // Weapon BaseSystem - handles player and enemy firing
    this.systems.weapon = new WeaponSystem(this);

    // Enemy Spawn BaseSystem - handles enemy waves and spawning
    this.systems.enemySpawn = new EnemySpawnSystem(this);

    Logger.scope('GameScene').debug('All systems initialized', {
      systemCount: Object.keys(this.systems).length,
    });
  }

  initializeAdapters() {
    // Initialize keyboard input adapter
    const keyboardInputAdapter = new KeyboardInputAdapter(this);
    keyboardInputAdapter.activate();

    this.adapters.set('input', keyboardInputAdapter);
  }

  startBackgroundMusic() {
    if (ConfigManager.getConfig().audioEnabled) {
      Logger.scope('GameScene').debug('Background music would start here (not implemented)');
    }
  }

  /**
   * Update scrolling background.
   *
   * @param {number} delta - Time delta
   */
  updateBackground(delta) {
    this.stars.children.entries.forEach(star => {
      const speed = star.getData('speed');
      star.y += speed * (delta / 1000);

      // Reset star position when it goes off screen
      if (star.y > this.scale.height + 10) {
        star.y = -10;
        star.x = Math.random() * this.scale.width;
      }
    });
  }

  /**
   * Update all game systems
   * @param {number} delta - Time delta
   */
  updateSystems(delta) {
    // TODO: I feel like there's a better way to do this
    // Sort systems by priority (lower numbers run first)
    const sortedSystems = Object.values(this.systems).sort((a, b) => a.priority - b.priority);

    sortedSystems.forEach(system => {
      if (system.active) {
        system.process(this.entities, delta);
      }
    });
  }

  shutdown() {
    // Clean up game state manager
    if (this.gameStateManager) {
      this.gameStateManager.destroy();
      this.gameStateManager = null;
    }

    // Clean up entities
    this.entities.forEach(entity => {
      if (entity.destroy) {
        entity.destroy();
      }
    });
    this.entities = [];

    // Clean up systems
    Object.values(this.systems).forEach(system => {
      if (system.destroy) {
        system.destroy();
      }
    });
    this.systems = {};

    // Clean up timers and tweens
    this.time.removeAllEvents();
    this.tweens.killAll();

    // Remove event listeners
    this.input.keyboard.removeAllListeners();
    this.input.removeAllListeners();

    // Clean up pause event listeners
    this.events.off(EventTypes.GAME_PAUSE_TOGGLE, this.handlePauseToggle, this);
    this.events.off('gamePause', this.onGamePaused, this);
    this.events.off('gameResume', this.onGameResumed, this);
  }
}
