import ConfigManager from '@/config/ConfigManager.js';
import { getEventBus } from '@/event-bus/EventBus.js';
import { EventTypes } from '@/event-bus/EventTypes.js';
import Logger from '@/utils/Logger.js';

/**
 * UI Scene - Dedicated scene for all user interface elements
 * Runs parallel to GameScene and handles all UI display and updates
 */
export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });

    // Get EventBus instance for communication
    this.eventBus = getEventBus();

    // UI elements storage
    this.uiElements = {};

    // Store listener IDs for cleanup
    this.listenerIds = [];
  }

  create() {
    // Create all UI elements
    this.createUI();

    // Set up EventBus listeners for UI updates
    this.setupEventListeners();
  }

  createUI() {
    // Score display
    this.uiElements.scoreText = this.add.text(20, 20, 'SCORE: 0', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'monospace',
    });
    this.uiElements.scoreText.setScrollFactor(0);

    // Lives display
    this.uiElements.livesText = this.add.text(20, 50, 'LIVES: 3', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
    });
    this.uiElements.livesText.setScrollFactor(0);

    // Level display
    this.uiElements.levelText = this.add.text(20, 80, 'LEVEL: 1', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
    });
    this.uiElements.levelText.setScrollFactor(0);

    // Wave display
    this.uiElements.waveText = this.add.text(20, 110, 'WAVE: 1', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
    });
    this.uiElements.waveText.setScrollFactor(0);

    // Current weapon display
    this.uiElements.weaponText = this.add.text(20, 140, 'WEAPON: LASER', {
      fontSize: '14px',
      color: '#ffff00',
      fontFamily: 'monospace',
    });
    this.uiElements.weaponText.setScrollFactor(0);

    // Accuracy display
    this.uiElements.accuracyText = this.add.text(20, 170, 'ACCURACY: 100.0%', {
      fontSize: '12px',
      color: '#00ff88',
      fontFamily: 'monospace',
    });
    this.uiElements.accuracyText.setScrollFactor(0);

    // Health bar setup
    const healthBarX = this.scale.width - 220;
    const healthBarY = 30;
    const healthBarWidth = 200;
    const healthBarHeight = 20;

    // Health bar background
    this.uiElements.healthBarBG = this.add
      .rectangle(healthBarX, healthBarY, healthBarWidth, healthBarHeight, 0x333333)
      .setOrigin(0, 0.5)
      .setStrokeStyle(2, 0x666666);
    this.uiElements.healthBarBG.setScrollFactor(0);

    // Health bar fill
    this.uiElements.healthBar = this.add
      .rectangle(healthBarX, healthBarY, healthBarWidth, healthBarHeight - 4, 0x00ff00)
      .setOrigin(0, 0.5);
    this.uiElements.healthBar.setScrollFactor(0);

    // Health text label
    // this.uiElements.healthText = this.add
    //   .text(healthBarX + healthBarWidth + 10, healthBarY, 'HEALTH', {
    //     fontSize: '14px',
    //     color: '#ffffff',
    //     fontFamily: 'monospace',
    //   })
    //   .setOrigin(0, 0.5);
    // this.uiElements.healthText.setScrollFactor(0);

    // Debug info (if enabled)
    if (ConfigManager.getConfig().showDebugInfo) {
      this.uiElements.debugText = this.add.text(10, this.scale.height - 100, '', {
        fontSize: '12px',
        color: '#00ff00',
        fontFamily: 'monospace',
      });
      this.uiElements.debugText.setScrollFactor(0);
    }

    // Pause indicator (initially hidden)
    this.uiElements.pauseText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'PAUSED', {
        fontSize: '48px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        align: 'center',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
        shadow: {
          offsetX: 3,
          offsetY: 3,
          color: '#000000',
          blur: 5,
          stroke: true,
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setVisible(false);
    this.uiElements.pauseText.setScrollFactor(0);

    // Set UI depth for layering
    Object.values(this.uiElements).forEach(element => {
      if (element && element.setDepth) {
        element.setDepth(100);
      }
    });
  }

  /**
   * Set up EventBus listeners for UI updates
   */
  setupEventListeners() {
    // Score update listener
    const scoreListenerId = this.eventBus.on('ui:scoreUpdate', this.handleScoreUpdate, this);
    this.listenerIds.push(scoreListenerId);

    // Health update listener
    const healthListenerId = this.eventBus.on('ui:healthUpdate', this.handleHealthUpdate, this);
    this.listenerIds.push(healthListenerId);

    // Weapon update listener
    const weaponListenerId = this.eventBus.on('ui:weaponUpdate', this.handleWeaponUpdate, this);
    this.listenerIds.push(weaponListenerId);

    // Game state update listener (lives, level, wave)
    const gameStateListenerId = this.eventBus.on(
      'ui:gameStateUpdate',
      this.handleGameStateUpdate,
      this,
    );
    this.listenerIds.push(gameStateListenerId);

    // Accuracy update listener
    const accuracyListenerId = this.eventBus.on(
      'ui:accuracyUpdate',
      this.handleAccuracyUpdate,
      this,
    );
    this.listenerIds.push(accuracyListenerId);

    // Debug info update listener
    if (ConfigManager.getConfig().showDebugInfo) {
      const debugListenerId = this.eventBus.on('ui:debugUpdate', this.handleDebugUpdate, this);
      this.listenerIds.push(debugListenerId);
    }

    // Pause state listeners
    const pauseListenerId = this.eventBus.on(
      EventTypes.GAME_PAUSE_TOGGLE,
      this.handlePauseStateChanged,
      this,
    );
    this.listenerIds.push(pauseListenerId);

    Logger.scope('UIScene').debug(
      `EventBus listeners set up (${this.listenerIds.length} listeners)`,
    );
  }

  /**
   * Handle score update events
   * @param {Object} data - Event data containing score information
   */
  handleScoreUpdate(data) {
    if (this.uiElements.scoreText && data.score !== undefined) {
      this.uiElements.scoreText.setText(`SCORE: ${data.score}`);
    }
  }

  /**
   * Handle health update events
   * @param {Object} data - Event data containing health information
   */
  handleHealthUpdate(data) {
    if (!this.uiElements.healthBar || data.healthPercent === undefined) return;

    const healthPercent = Math.max(0, Math.min(1, data.healthPercent));
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

  /**
   * Handle weapon update events
   * @param {Object} data - Event data containing weapon information
   */
  handleWeaponUpdate(data) {
    if (this.uiElements.weaponText && data.weapon) {
      this.uiElements.weaponText.setText(`WEAPON: ${data.weapon.toUpperCase()}`);
    }
  }

  /**
   * Handle game state update events (lives, level, wave)
   * @param {Object} data - Event data containing game state information
   */
  handleGameStateUpdate(data) {
    if (data.lives !== undefined && this.uiElements.livesText) {
      this.uiElements.livesText.setText(`LIVES: ${data.lives}`);
    }

    if (data.level !== undefined && this.uiElements.levelText) {
      this.uiElements.levelText.setText(`LEVEL: ${data.level}`);
    }

    if (data.wave !== undefined && this.uiElements.waveText) {
      this.uiElements.waveText.setText(`WAVE: ${data.wave}`);
    }
  }

  /**
   * Handle accuracy update events
   * @param {Object} data - Event data containing accuracy information
   */
  handleAccuracyUpdate(data) {
    if (this.uiElements.accuracyText && data.accuracy !== undefined) {
      this.uiElements.accuracyText.setText(`ACCURACY: ${data.accuracy}`);
    }
  }

  /**
   * Handle debug info update events
   * @param {Object} data - Event data containing debug information
   */
  handleDebugUpdate(data) {
    if (this.uiElements.debugText && data.debugInfo) {
      this.uiElements.debugText.setText(data.debugInfo);
    }
  }

  /**
   * Handle pause state change events
   * @param {Object} data - Event data containing pause state
   */
  handlePauseStateChanged(data) {
    if (!this.uiElements.pauseText) return;

    if (data.paused) {
      this.showPauseUI();
    } else {
      this.hidePauseUI();
    }
  }

  showPauseUI() {
    // Create semi-transparent overlay background if not exists
    if (!this.uiElements.pauseOverlay) {
      this.uiElements.pauseOverlay = this.add.rectangle(
        this.scale.width / 2,
        this.scale.height / 2,
        this.scale.width,
        this.scale.height,
        0x000000,
        0.6,
      );
      this.uiElements.pauseOverlay.setScrollFactor(0);
      this.uiElements.pauseOverlay.setDepth(90); // Below pause text but above game
    }

    // Show overlay and text
    this.uiElements.pauseOverlay.setVisible(true);
    this.uiElements.pauseText.setVisible(true);

    // Animate pause text appearance
    this.uiElements.pauseText.setAlpha(0);
    this.uiElements.pauseText.setScale(0.8);

    this.tweens.add({
      targets: this.uiElements.pauseText,
      alpha: { from: 0, to: 1 },
      scaleX: { from: 0.8, to: 1 },
      scaleY: { from: 0.8, to: 1 },
      duration: 300,
      ease: 'Back.easeOut',
    });
  }

  hidePauseUI() {
    // Animate pause text disappearance
    this.tweens.add({
      targets: this.uiElements.pauseText,
      alpha: { from: 1, to: 0 },
      scaleX: { from: 1, to: 0.8 },
      scaleY: { from: 1, to: 0.8 },
      duration: 200,
      ease: 'Power2.easeIn',
      onComplete: () => {
        this.uiElements.pauseText.setVisible(false);
      },
    });

    // Hide overlay
    if (this.uiElements.pauseOverlay) {
      this.uiElements.pauseOverlay.setVisible(false);
    }
  }

  shutdown() {
    // Clean up EventBus listeners
    this.listenerIds.forEach(listenerId => {
      this.eventBus.off(listenerId);
    });
    this.listenerIds = [];

    this.tweens.killAll();
    this.uiElements = {};
  }
}
