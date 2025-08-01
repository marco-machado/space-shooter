import Logger from '../core/Logger.js';
import Environment from '../config/Environment.js';
import Entity from '../entities/Entity.js';
// import Enemy from '../entities/Enemy.js'; // Imported but not directly used in scene
import HealthComponent from '../components/HealthComponent.js';
import MovementComponent from '../components/MovementComponent.js';
import WeaponComponent from '../components/WeaponComponent.js';
import CollisionComponent from '../components/CollisionComponent.js';

// Systems
import WeaponSystem from '../systems/WeaponSystem.js';
import CollisionSystem from '../systems/CollisionSystem.js';
import EnemySpawnSystem from '../systems/EnemySpawnSystem.js';

// Game State Management
import GameStateManager from '../utils/GameStateManager.js';

/**
 * Game Scene - Primary gameplay scene
 * Handles main game loop, entity management, and systems coordination
 */
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });

    // ECS Management
    this.entities = [];
    this.systems = {};

    // Game State Manager
    this.gameStateManager = null;

    // Player reference
    this.player = null;

    // UI elements
    this.uiElements = {};

    // Input handling
    this.cursors = null;
    this.wasdKeys = null;
    this.spaceKey = null;
  }

  /**
   * Initialize game scene
   */
  init() {
    Logger.info('GameScene: Initializing gameplay scene');

    // Clear entities and systems
    this.entities = [];
    this.systems = {};

    // GameStateManager will be initialized in create() when event system is ready
    this.gameStateManager = null;
  }

  /**
   * Create game scene elements
   */
  create() {
    Logger.info('GameScene: Creating gameplay scene');

    // Initialize game state manager (now that event system is ready)
    this.gameStateManager = new GameStateManager(this);
    this.gameStateManager.loadGame(); // Load saved progress

    // Create background
    this.createBackground();

    // Set up physics groups
    this.setupPhysicsGroups();

    // Create player
    this.createPlayer();

    // Initialize all systems
    this.initializeSystems();

    // Create UI
    this.createUI();

    // Set up input
    this.setupInput();

    // Start background music (when implemented)
    this.startBackgroundMusic();

    // Fade in from black
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // Start the game
    this.gameStateManager.startGame();

    Logger.info('GameScene: Scene setup complete');
  }

  /**
   * Create animated background
   */
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

    Logger.debug('GameScene: Background created with scrolling stars');
  }

  /**
   * Set up physics groups for collision detection
   */
  setupPhysicsGroups() {
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);

    // Create physics groups for different entity types
    this.playerGroup = this.physics.add.group();
    this.enemyGroup = this.physics.add.group();
    this.playerProjectileGroup = this.physics.add.group();
    this.enemyProjectileGroup = this.physics.add.group();
    this.powerupGroup = this.physics.add.group();

    Logger.debug('GameScene: Physics groups initialized');
  }

  /**
   * Create player entity
   */
  createPlayer() {
    const startX = this.scale.width / 2;
    const startY = this.scale.height - 100;

    // Create player entity (blue rectangle in development)
    this.player = new Entity(this, startX, startY, 64, 64, 0x0099ff);

    // Mark as player for identification
    this.player.entityType = 'player';

    // Add components
    this.player.addComponent(new HealthComponent(100));

    const movementComponent = new MovementComponent(300); // 300 pixels/second max speed
    movementComponent.init({
      boundToScreen: true,
      screenPadding: 32,
      boundaryBehavior: 'clamp',
    });
    this.player.addComponent(movementComponent);

    // Add weapon component with starting weapon
    const weaponComponent = new WeaponComponent('laser');
    weaponComponent.init({
      availableWeapons: Array.from(this.gameStateManager.weaponsUnlocked),
      currentWeapon: 'laser',
    });
    this.player.addComponent(weaponComponent);

    // Add collision component
    const collisionComponent = new CollisionComponent();
    collisionComponent.init(CollisionComponent.createPlayerConfig());
    this.player.addComponent(collisionComponent);

    // Enable physics
    this.player.enablePhysics('dynamic');
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setSize(48, 48); // Smaller collision box for better gameplay

    // Add to player group
    this.playerGroup.add(this.player);

    // Set depth for layering
    this.player.setDepth(30);

    Logger.info('GameScene: Player created at', startX, startY);
  }

  /**
   * Initialize all game systems
   */
  initializeSystems() {
    Logger.info('GameScene: Initializing systems');

    // Weapon System - handles player and enemy firing
    this.systems.weapon = new WeaponSystem(this);

    // Collision System - handles all collision detection
    this.systems.collision = new CollisionSystem(this);

    // Enemy Spawn System - handles enemy waves and spawning
    this.systems.enemySpawn = new EnemySpawnSystem(this);

    Logger.info('GameScene: All systems initialized', {
      systemCount: Object.keys(this.systems).length,
    });
  }

  /**
   * Create game UI elements
   */
  createUI() {
    const gameState = this.gameStateManager.getGameState();

    // Score display
    this.uiElements.scoreText = this.add.text(20, 20, `SCORE: ${gameState.score}`, {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'monospace',
    });

    // Lives display
    this.uiElements.livesText = this.add.text(20, 50, `LIVES: ${gameState.lives}`, {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
    });

    // Level display
    this.uiElements.levelText = this.add.text(20, 80, `LEVEL: ${gameState.level}`, {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
    });

    // Wave display
    this.uiElements.waveText = this.add.text(20, 110, `WAVE: ${gameState.currentWave}`, {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
    });

    // Current weapon display
    this.uiElements.weaponText = this.add.text(20, 140, 'WEAPON: LASER', {
      fontSize: '14px',
      color: '#ffff00',
      fontFamily: 'monospace',
    });

    // Accuracy display
    this.uiElements.accuracyText = this.add.text(
      20,
      170,
      `ACCURACY: ${gameState.accuracy.toFixed(1)}%`,
      {
        fontSize: '12px',
        color: '#00ff88',
        fontFamily: 'monospace',
      }
    );

    // Health bar background
    const healthBarX = this.scale.width - 220;
    const healthBarY = 30;
    const healthBarWidth = 200;
    const healthBarHeight = 20;

    this.uiElements.healthBarBG = this.add
      .rectangle(healthBarX, healthBarY, healthBarWidth, healthBarHeight, 0x333333)
      .setOrigin(0, 0.5)
      .setStrokeStyle(2, 0x666666);

    // Health bar fill
    this.uiElements.healthBar = this.add
      .rectangle(healthBarX, healthBarY, healthBarWidth, healthBarHeight - 4, 0x00ff00)
      .setOrigin(0, 0.5);

    // Health text
    this.uiElements.healthText = this.add
      .text(healthBarX + healthBarWidth + 10, healthBarY, 'HEALTH', {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'monospace',
      })
      .setOrigin(0, 0.5);

    // Debug info (if enabled)
    if (Environment.SHOW_DEBUG_INFO) {
      this.uiElements.debugText = this.add.text(10, this.scale.height - 100, '', {
        fontSize: '12px',
        color: '#00ff00',
        fontFamily: 'monospace',
      });
    }

    // Pause indicator (initially hidden)
    this.uiElements.pauseText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'PAUSED\nPress ESC to resume', {
        fontSize: '32px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        align: 'center',
      })
      .setOrigin(0.5)
      .setVisible(false);

    // Set UI depth
    Object.values(this.uiElements).forEach(element => {
      if (element && element.setDepth) {
        element.setDepth(100);
      }
    });

    Logger.debug('GameScene: UI elements created');
  }

  /**
   * Set up input handling
   */
  setupInput() {
    // Cursor keys
    this.cursors = this.input.keyboard.createCursorKeys();

    // WASD keys
    this.wasdKeys = this.input.keyboard.addKeys('W,S,A,D');

    // Space key for shooting
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Escape key for pause
    this.input.keyboard.on('keydown-ESC', () => {
      this.togglePause();
    });

    // Debug keys (development only)
    if (Environment.DEBUG_MODE) {
      this.input.keyboard.on('keydown-F2', () => {
        this.addScore(100);
      });

      this.input.keyboard.on('keydown-F3', () => {
        this.takeDamage(10);
      });
    }

    Logger.debug('GameScene: Input handlers configured');
  }

  /**
   * Start background music (placeholder)
   */
  startBackgroundMusic() {
    if (Environment.AUDIO_ENABLED) {
      Logger.debug('GameScene: Background music would start here (not implemented)');
    }
  }

  /**
   * Main game update loop
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

    // Handle player input and movement
    this.updatePlayerInput(delta);

    // Update all entities
    this.updateEntities(delta);

    // Update all systems
    this.updateSystems(delta);

    // Update UI
    this.updateUI();

    // Debug information
    this.updateDebugInfo(time, delta);
  }

  /**
   * Update scrolling background
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
   * Handle player input and movement
   * @param {number} delta - Time delta
   */
  updatePlayerInput(delta) {
    if (!this.player || !this.player.active) {
      return;
    }

    const movement = this.player.getComponent(MovementComponent);
    if (!movement) {
      return;
    }

    // Calculate movement direction
    let velocityX = 0;
    let velocityY = 0;

    // Horizontal movement
    if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
      velocityX = -movement.maxSpeed;
    } else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
      velocityX = movement.maxSpeed;
    }

    // Vertical movement
    if (this.cursors.up.isDown || this.wasdKeys.W.isDown) {
      velocityY = -movement.maxSpeed;
    } else if (this.cursors.down.isDown || this.wasdKeys.S.isDown) {
      velocityY = movement.maxSpeed;
    }

    // Apply movement
    movement.setVelocity(velocityX, velocityY);

    // Handle shooting
    if (this.spaceKey.isDown) {
      this.handlePlayerShooting(delta);
    }
  }

  /**
   * Handle player shooting (handled by WeaponSystem)
   * @param {number} delta - Time delta
   */
  handlePlayerShooting(_delta) {
    // Shooting is now handled by WeaponSystem in updateSystems()
    // This method is kept for potential future direct shooting logic
  }

  /**
   * Update all entities
   * @param {number} delta - Time delta in milliseconds
   */
  updateEntities(delta) {
    const deltaSeconds = delta / 1000; // Convert to seconds for components

    this.entities.forEach(entity => {
      if (entity.active) {
        // Update entity components
        entity.getAllComponents().forEach(component => {
          if (component.active && component.update) {
            component.update(deltaSeconds);
          }
        });

        // Update entity itself
        if (entity.update) {
          entity.update(deltaSeconds);
        }
      }
    });
  }

  /**
   * Update all game systems
   * @param {number} delta - Time delta
   */
  updateSystems(delta) {
    // Get all entities including projectiles
    const allEntities = [...this.entities, ...this.systems.weapon.getActiveProjectiles()];

    // Update weapon system (handles firing and projectiles)
    if (this.systems.weapon) {
      this.systems.weapon.update(allEntities, delta);
    }

    // Update collision system (handles all collisions)
    if (this.systems.collision) {
      this.systems.collision.update(allEntities, delta);
    }

    // Update enemy spawn system (handles enemy waves)
    if (this.systems.enemySpawn) {
      this.systems.enemySpawn.update(allEntities, delta);
    }
  }

  /**
   * Update UI elements
   */
  updateUI() {
    const displayStats = this.gameStateManager.getDisplayStats();

    // Update score
    this.uiElements.scoreText.setText(`SCORE: ${displayStats.score}`);

    // Update lives
    this.uiElements.livesText.setText(`LIVES: ${displayStats.lives}`);

    // Update level
    this.uiElements.levelText.setText(`LEVEL: ${displayStats.level}`);

    // Update wave
    this.uiElements.waveText.setText(`WAVE: ${displayStats.wave}`);

    // Update current weapon
    if (this.player) {
      const weapon = this.player.getComponent(WeaponComponent);
      if (weapon) {
        this.uiElements.weaponText.setText(`WEAPON: ${weapon.currentWeapon.toUpperCase()}`);
      }
    }

    // Update accuracy
    this.uiElements.accuracyText.setText(`ACCURACY: ${displayStats.accuracy}`);

    // Update health bar
    if (this.player) {
      const health = this.player.getComponent(HealthComponent);
      if (health) {
        const healthPercent = health.getHealthPercentage();
        const maxWidth = 200;
        this.uiElements.healthBar.width = maxWidth * healthPercent;

        // Change color based on health
        if (healthPercent > 0.6) {
          this.uiElements.healthBar.setFillStyle(0x00ff00); // Green
        } else if (healthPercent > 0.3) {
          this.uiElements.healthBar.setFillStyle(0xffff00); // Yellow
        } else {
          this.uiElements.healthBar.setFillStyle(0xff0000); // Red
        }
      }
    }
  }

  /**
   * Update debug information
   * @param {number} time - Current time
   * @param {number} delta - Time delta
   */
  updateDebugInfo(time, delta) {
    if (!Environment.SHOW_DEBUG_INFO || !this.uiElements.debugText) {
      return;
    }

    const gameState = this.gameStateManager.getGameState();
    const fps = Math.round(1000 / delta);
    const entityCount = this.entities.length;
    const projectileCount = this.systems.weapon
      ? this.systems.weapon.getActiveProjectiles().length
      : 0;
    const playerPos = this.player
      ? `(${Math.round(this.player.x)}, ${Math.round(this.player.y)})`
      : 'N/A';

    const debugInfo = [
      `FPS: ${fps}`,
      `Entities: ${entityCount}`,
      `Projectiles: ${projectileCount}`,
      `Player: ${playerPos}`,
      `Playing: ${gameState.isPlaying}`,
      `Wave: ${gameState.currentWave}`,
      `Enemies: ${gameState.enemiesRemaining || 0}`,
    ];

    this.uiElements.debugText.setText(debugInfo.join('\n'));
  }

  /**
   * Toggle game pause
   */
  togglePause() {
    const gameState = this.gameStateManager.getGameState();

    if (gameState.isPlaying && !gameState.isPaused) {
      this.gameStateManager.pauseGame();
      this.uiElements.pauseText.setVisible(true);
      this.physics.pause();
      Logger.info('GameScene: Game paused');
    } else if (gameState.isPlaying && gameState.isPaused) {
      this.gameStateManager.resumeGame();
      this.uiElements.pauseText.setVisible(false);
      this.physics.resume();
      Logger.info('GameScene: Game resumed');
    }
  }

  /**
   * Add score (delegated to GameStateManager)
   * @param {number} points - Points to add
   */
  addScore(points) {
    this.gameStateManager.addScore(points);
  }

  /**
   * Handle player taking damage
   * @param {number} damage - Damage amount
   */
  takeDamage(damage) {
    if (!this.player) return;

    const health = this.player.getComponent(HealthComponent);
    if (health) {
      const actualDamage = health.takeDamage(damage);

      // Emit damage event for game state tracking
      this.events.emit('playerDamage', { damage: actualDamage });

      if (!health.isAlive()) {
        this.handlePlayerDeath();
      }
    }
  }

  /**
   * Handle player death
   */
  handlePlayerDeath() {
    Logger.info('GameScene: Player died');

    // Emit player death event
    this.events.emit('playerDeath', { player: this.player });

    const gameState = this.gameStateManager.getGameState();
    if (gameState.lives <= 0) {
      this.gameOver();
    } else {
      this.respawnPlayer();
    }
  }

  /**
   * Respawn player
   */
  respawnPlayer() {
    if (this.player) {
      const health = this.player.getComponent(HealthComponent);
      if (health) {
        health.currentHealth = health.maxHealth;
      }

      // Reset position
      this.player.setPosition(this.scale.width / 2, this.scale.height - 100);

      // Add temporary invulnerability
      if (health) {
        health.setInvulnerable(3000); // 3 seconds
      }
    }
  }

  /**
   * Handle game over
   */
  gameOver() {
    const gameState = this.gameStateManager.getGameState();
    this.gameStateManager.endGame('no_lives');

    Logger.info('GameScene: Game Over - Final Score:', gameState.score);

    // Show game over screen
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.add
      .text(centerX, centerY - 50, 'GAME OVER', {
        fontSize: '48px',
        color: '#ff0000',
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5)
      .setDepth(200);

    this.add
      .text(centerX, centerY, `FINAL SCORE: ${gameState.score.toLocaleString()}`, {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5)
      .setDepth(200);

    this.add
      .text(centerX, centerY + 30, `WAVE REACHED: ${gameState.currentWave}`, {
        fontSize: '18px',
        color: '#888888',
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5)
      .setDepth(200);

    this.add
      .text(centerX, centerY + 60, `ACCURACY: ${gameState.accuracy.toFixed(1)}%`, {
        fontSize: '18px',
        color: '#00ff88',
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5)
      .setDepth(200);

    this.add
      .text(centerX, centerY + 100, 'Press SPACE to return to menu', {
        fontSize: '16px',
        color: '#666666',
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5)
      .setDepth(200);

    // Return to menu on space key
    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('MainMenuScene');
    });
  }

  /**
   * Clean up game scene
   */
  shutdown() {
    Logger.debug('GameScene: Shutting down');

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

    // Clear UI references
    this.uiElements = {};
  }
}

export default GameScene;
