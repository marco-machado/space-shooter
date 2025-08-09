import ConfigManager from '@/config/ConfigManager.js';
import { getEventBus } from '@/event-bus/EventBus.js';
import { EventTypes } from '@/event-bus/EventTypes.js';
import GameStateManager from '@/utils/GameStateManager.js';
import Logger from '@/utils/Logger.js';
import { initializeWorld, updateWorldTime } from '@/ecs/index.js';

// ECS Systems Pipeline
import { runSystemPipeline, debugSystemPipeline, PIPELINE_MODES } from '@/ecs/systems/pipeline.js';

// BaseEntity Systems (manage ECS entities)
import EnemySpawnSystem from '@/systems/EnemySpawnSystem.js';

// ECS collision bridge utilities
import { getEntityFromSprite, deactivateEntity, getEnemyConfig, createPlayer, getPlayerFromSprite } from '@/ecs/entities/index.js';
import { Health, Position } from '@/ecs/components/index.js';
import { hasComponent } from 'bitecs';
import { initializeProjectilePool } from '@/ecs/entities/createProjectile.js';

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

    // Initialize bitECS world with scene reference
    this.world = initializeWorld(this);

    // Initialize game state manager (now that event scopeName is ready)
    this.gameStateManager = new GameStateManager(this);
    // this.gameStateManager.loadGame();

    this.createBackground();
    this.createCollisionGroups();
    this.setupCollisionDetection();

    // Initialize projectile pool after scene setup is complete
    initializeProjectilePool(this.world);

    this.eventBus.on(EventTypes.GAME_PAUSE_TOGGLE, this.onPauseToggle, this);

    // Create ECS player entity
    const playerResult = createPlayer(this.world, this);
    this.player = playerResult.sprite;
    this.playerEntityId = playerResult.entityId;

    // Initialize ECS enemy spawn system (manages ECS entities)
    this.enemySpawnSystem = new EnemySpawnSystem(this, this.world);
    this.systems.enemySpawn = this.enemySpawnSystem;

    // Determine ECS pipeline mode
    const config = ConfigManager.getConfig();
    this.pipelineMode = config.debugMode ? PIPELINE_MODES.DEBUG : PIPELINE_MODES.PRODUCTION;
    this.systemsPipeline = this.pipelineMode === PIPELINE_MODES.DEBUG ? debugSystemPipeline : runSystemPipeline;

    this.scene.launch('UIScene');

    // Create cursor keys for player input system
    this.input.keyboard.cursors = this.input.keyboard.createCursorKeys();
    
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.debugSpawnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E); // DEBUG: E to force spawn enemy

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

    // DEBUG: Force spawn enemy with E key
    if (Phaser.Input.Keyboard.JustDown(this.debugSpawnKey)) {
      if (this.enemySpawnSystem) {
        this.enemySpawnSystem.spawnIndividualEnemy('scout');
      }
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

    // Run ECS systems pipeline for enemy entities (Movement, AI, Weapon, Render, Time systems)
    this.systemsPipeline(this.world);

    // Run BaseEntity systems that manage ECS entities
    if (this.enemySpawnSystem) {
      this.enemySpawnSystem.update(this.entities, delta);
    }
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

  // Collision callback functions
  handleProjectileEnemyCollision(projectile, enemySprite) {
    // Get ECS enemy entity ID from sprite
    const enemyEid = getEntityFromSprite(enemySprite);

    if (enemyEid === null) {
      this.logger.warn('Enemy sprite has no associated ECS entity', { sprite: enemySprite });
      return;
    }

    // Get projectile damage (supports ECS projectile sprites)
    const projectileDamage = projectile?.damage || 25; // Default damage

    // Apply damage to ECS enemy via Health component
    if (hasComponent(this.world, Health, enemyEid)) {
      const currentHealth = Health.current[enemyEid];
      const newHealth = Math.max(0, currentHealth - projectileDamage);
      Health.current[enemyEid] = newHealth;

      this.logger.debug('ECS Enemy hit by BaseEntity projectile', {
        enemyEid,
        damage: projectileDamage,
        healthBefore: currentHealth,
        healthAfter: newHealth
      });

      // Handle enemy death
      if (newHealth <= 0) {
        this.handleEnemyDeath(enemyEid, enemySprite);
      }
    }

    // Deactivate ECS projectile if applicable; else destroy legacy projectile
    if (projectile && projectile.entityType === 'projectile' && projectile.entityId != null) {
      // dynamic import to avoid cyclic deps in tests
      import('@/ecs/entities/createProjectile.js').then(({ deactivateProjectile }) => {
        deactivateProjectile(this.world, projectile.entityId);
        if (this.playerProjectileGroup) this.playerProjectileGroup.remove(projectile);
      });
    } else if (projectile?.destroy) {
      projectile.destroy();
    } else if (projectile?.setActive) {
      projectile.setActive(false);
      projectile.setVisible(false);
    }
  }

  /**
   * Handle ECS enemy death - deactivate entity and emit events
   */
  handleEnemyDeath(enemyEid, enemySprite) {
    this.logger.debug('ECS Enemy death', { enemyEid });

    // Get enemy type and score value
    const enemyType = enemySprite?.enemyType || 'scout';
    const enemyConfig = getEnemyConfig(enemyType);

    // Deactivate the ECS entity (returns to pool)
    deactivateEntity(this.world, enemyEid);

    // Remove sprite from enemy group
    if (enemySprite && this.enemyGroup) {
      this.enemyGroup.remove(enemySprite);
    }

    // Emit enemy death event for score/effects
    this.eventBus.emit('enemyDestroyed', {
      enemyId: enemyEid,
      enemyType,
      position: { x: enemySprite?.x || 0, y: enemySprite?.y || 0 },
      scoreValue: enemyConfig.scoreValue
    });

    this.logger.debug('ECS Enemy destroyed', {
      enemyEid,
      enemyType,
      scoreValue: enemyConfig.scoreValue
    });
  }

  handleEnemyProjectilePlayerCollision(projectile, player) {
    const damage = projectile?.damage || 15;

    // Get player entity ID from sprite
    const playerEid = getPlayerFromSprite(player);
    
    if (playerEid && hasComponent(this.world, Health, playerEid)) {
      // Apply damage to ECS player via Health component
      const currentHealth = Health.current[playerEid];
      const newHealth = Math.max(0, currentHealth - damage);
      Health.current[playerEid] = newHealth;
      
      this.logger.debug('ECS Player hit by projectile', {
        playerEid,
        damage,
        healthBefore: currentHealth,
        healthAfter: newHealth
      });
      
      // Handle player death if needed
      if (newHealth <= 0) {
        this.handlePlayerDeath(playerEid);
      }
    } else {
      // Fallback for legacy player damage handling
      if (player.takeDamage) {
        player.takeDamage(damage);
      }
    }

    // Deactivate ECS projectile if applicable; else destroy legacy projectile
    if (projectile && projectile.entityType === 'projectile' && projectile.entityId != null) {
      import('@/ecs/entities/createProjectile.js').then(({ deactivateProjectile }) => {
        deactivateProjectile(this.world, projectile.entityId);
        if (this.enemyProjectileGroup) this.enemyProjectileGroup.remove(projectile);
      });
    } else if (projectile?.destroy) {
      projectile.destroy();
    } else if (projectile?.setActive) {
      projectile.setActive(false);
      projectile.setVisible(false);
    }

    this.logger.debug('Enemy Projectile-Player collision handled', {
      projectileId: projectile.entityId || 'unknown',
      damage
    });
  }

  handlePlayerEnemyCollision(player, enemySprite) {
    // Get ECS enemy entity ID from sprite
    const enemyEid = getEntityFromSprite(enemySprite);
    const playerEid = getPlayerFromSprite(player);

    if (enemyEid === null) {
      this.logger.warn('Enemy sprite has no associated ECS entity in player collision', { sprite: enemySprite });
      return;
    }

    if (playerEid === null) {
      this.logger.warn('Player sprite has no associated ECS entity in enemy collision', { sprite: player });
      return;
    }

    this.logger.debug('ECS Player-ECS Enemy collision detected', {
      playerEid,
      enemyEid
    });

    // Apply collision damage to ECS player
    const enemyCollisionDamage = 15; // Default collision damage

    if (hasComponent(this.world, Health, playerEid)) {
      const currentHealth = Health.current[playerEid];
      const newHealth = Math.max(0, currentHealth - enemyCollisionDamage);
      Health.current[playerEid] = newHealth;
      
      this.logger.debug('ECS Player took collision damage from ECS enemy', {
        playerEid,
        enemyEid,
        damage: enemyCollisionDamage,
        healthBefore: currentHealth,
        healthAfter: newHealth
      });
      
      // Handle player death if needed
      if (newHealth <= 0) {
        this.handlePlayerDeath(playerEid);
      }
    }
  }

  /**
   * Handle ECS player death - emit events and trigger game over
   */
  handlePlayerDeath(playerEid) {
    this.logger.debug('ECS Player death', { playerEid });

    // Emit player death event
    this.eventBus.emit('playerDestroyed', {
      playerId: playerEid,
      position: { 
        x: Position.x[playerEid] || 0, 
        y: Position.y[playerEid] || 0 
      }
    });

    // Trigger game over
    this.gameStateManager.gameOver();
    
    this.logger.debug('ECS Player died, game over triggered', { playerEid });
  }

  handlePlayerPowerupCollision(player, powerup) {
    this.logger.debug('Player-Powerup collision detected', {
      playerId: player.entityId || 'unknown',
      powerupId: powerup.entityId || 'unknown',
    });
  }
}
