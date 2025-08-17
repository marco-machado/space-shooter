import { getEventBus } from '@/event-bus/EventBus.js';
import { EventTypes } from '@/event-bus/EventTypes.js';
import Logger from '@/utils/Logger.js';

/**
 * UI Scene - Dedicated scene for all user interface elements.
 * Runs parallel to GameScene and handles all UI display and updates.
 * @class
 * @extends Phaser.Scene
 * @classdesc Manages all user interface elements including score, health, weapons, and pause overlay
 */
export default class UIScene extends Phaser.Scene {
  #eventBus;
  #logger;

  #uiElements = {};
  #listenerIds = [];

  constructor() {
    super({ key: 'UIScene' });

    this.#eventBus = getEventBus();
    this.#logger = Logger.scope('UIScene');
  }

  /**
   * Create UI scene and set up all elements.
   * @returns {void}
   */
  create() {
    // Create all UI elements
    this.createUI();

    // Set up EventBus listeners for UI updates
    this.setupEventListeners();
  }

  /**
   * Create and configure all UI elements.
   * @private
   * @returns {void}
   */
  createUI() {
    // Score display
    this.#uiElements.scoreText = this.add.text(20, 20, 'SCORE: 0', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'monospace',
    });
    this.#uiElements.scoreText.setScrollFactor(0);

    // Lives display
    this.#uiElements.livesText = this.add.text(20, 50, 'LIVES: 3', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
    });
    this.#uiElements.livesText.setScrollFactor(0);

    // Character level display (XP-based progression)
    this.#uiElements.characterLevelText = this.add.text(20, 80, 'CHAR LVL: 1', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
    });
    this.#uiElements.characterLevelText.setScrollFactor(0);

    // XP Progress Bar
    const xpBarX = 200;
    const xpBarY = 85;
    const xpBarWidth = 150;
    const xpBarHeight = 8;

    // XP bar background
    this.#uiElements.xpBarBG = this.add
      .rectangle(xpBarX, xpBarY, xpBarWidth, xpBarHeight, 0x333333)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x666666);
    this.#uiElements.xpBarBG.setScrollFactor(0);

    // XP bar fill
    this.#uiElements.xpBar = this.add
      .rectangle(xpBarX, xpBarY, 0, xpBarHeight - 2, 0x00aaff)
      .setOrigin(0, 0.5);
    this.#uiElements.xpBar.setScrollFactor(0);

    // XP text display
    this.#uiElements.xpText = this.add
      .text(xpBarX + xpBarWidth + 10, xpBarY, '0/232 XP', {
        fontSize: '12px',
        color: '#00aaff',
        fontFamily: 'monospace',
      })
      .setOrigin(0, 0.5);
    this.#uiElements.xpText.setScrollFactor(0);

    // Points display (available/spent)
    this.#uiElements.pointsText = this.add.text(20, 200, 'POINTS: 0 / 0 spent', {
      fontSize: '14px',
      color: '#ffaa00',
      fontFamily: 'monospace',
    });
    this.#uiElements.pointsText.setScrollFactor(0);

    // Game level display (progression through levels)
    this.#uiElements.levelText = this.add.text(20, 110, 'LEVEL: 1', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
    });
    this.#uiElements.levelText.setScrollFactor(0);

    // Current weapon display
    this.#uiElements.weaponText = this.add.text(20, 140, 'WEAPON: LASER', {
      fontSize: '14px',
      color: '#ffff00',
      fontFamily: 'monospace',
    });
    this.#uiElements.weaponText.setScrollFactor(0);

    // Accuracy display
    this.#uiElements.accuracyText = this.add.text(20, 170, 'ACCURACY: 100.0%', {
      fontSize: '12px',
      color: '#00ff88',
      fontFamily: 'monospace',
    });
    this.#uiElements.accuracyText.setScrollFactor(0);

    // Health bar setup
    const healthBarX = this.scale.width - 220;
    const healthBarY = 30;
    const healthBarWidth = 200;
    const healthBarHeight = 20;

    // Health bar background
    this.#uiElements.healthBarBG = this.add
      .rectangle(healthBarX, healthBarY, healthBarWidth, healthBarHeight, 0x333333)
      .setOrigin(0, 0.5)
      .setStrokeStyle(2, 0x666666);
    this.#uiElements.healthBarBG.setScrollFactor(0);

    // Health bar fill
    this.#uiElements.healthBar = this.add
      .rectangle(healthBarX, healthBarY, healthBarWidth, healthBarHeight - 4, 0x00ff00)
      .setOrigin(0, 0.5);
    this.#uiElements.healthBar.setScrollFactor(0);

    // Health numerical display
    this.#uiElements.healthText = this.add
      .text(healthBarX + healthBarWidth + 10, healthBarY, '5/5', {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'monospace',
      })
      .setOrigin(0, 0.5);
    this.#uiElements.healthText.setScrollFactor(0);

    // Shield bar setup (above health bar)
    const shieldBarX = this.scale.width - 220;
    const shieldBarY = 5;
    const shieldBarWidth = 200;
    const shieldBarHeight = 16;

    // Shield bar background
    this.#uiElements.shieldBarBG = this.add
      .rectangle(shieldBarX, shieldBarY, shieldBarWidth, shieldBarHeight, 0x333333)
      .setOrigin(0, 0.5)
      .setStrokeStyle(2, 0x444444)
      .setVisible(false); // Hidden until shields are available
    this.#uiElements.shieldBarBG.setScrollFactor(0);

    // Shield bar fill
    this.#uiElements.shieldBar = this.add
      .rectangle(shieldBarX, shieldBarY, 0, shieldBarHeight - 4, 0x00ccff)
      .setOrigin(0, 0.5)
      .setVisible(false);
    this.#uiElements.shieldBar.setScrollFactor(0);

    // Shield numerical display
    this.#uiElements.shieldText = this.add
      .text(shieldBarX + shieldBarWidth + 10, shieldBarY, '0/0', {
        fontSize: '14px',
        color: '#00ccff',
        fontFamily: 'monospace',
      })
      .setOrigin(0, 0.5)
      .setVisible(false);
    this.#uiElements.shieldText.setScrollFactor(0);

    // Weapon heat bar setup
    const heatBarX = this.scale.width - 220;
    const heatBarY = 60;
    const heatBarWidth = 200;
    const heatBarHeight = 12;

    // Heat bar background
    this.#uiElements.heatBarBG = this.add
      .rectangle(heatBarX, heatBarY, heatBarWidth, heatBarHeight, 0x333333)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x666666);
    this.#uiElements.heatBarBG.setScrollFactor(0);

    // Heat bar fill
    this.#uiElements.heatBar = this.add
      .rectangle(heatBarX, heatBarY, 0, heatBarHeight - 2, 0xff8800)
      .setOrigin(0, 0.5);
    this.#uiElements.heatBar.setScrollFactor(0);

    // Heat label
    this.#uiElements.heatLabel = this.add
      .text(heatBarX - 40, heatBarY, 'HEAT', {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: 'monospace',
      })
      .setOrigin(1, 0.5);
    this.#uiElements.heatLabel.setScrollFactor(0);

    // Heat percentage display
    this.#uiElements.heatText = this.add
      .text(heatBarX + heatBarWidth + 10, heatBarY, '0%', {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: 'monospace',
      })
      .setOrigin(0, 0.5);
    this.#uiElements.heatText.setScrollFactor(0);

    // Special ability status indicators
    const abilityY = 90;
    const abilityX = this.scale.width - 220;

    // Afterburner status
    this.#uiElements.afterburnerLabel = this.add
      .text(abilityX, abilityY, 'AFTERBURNER', {
        fontSize: '12px',
        color: '#0088ff',
        fontFamily: 'monospace',
      })
      .setOrigin(0, 0.5)
      .setAlpha(0.5);
    this.#uiElements.afterburnerLabel.setScrollFactor(0);

    this.#uiElements.afterburnerStatus = this.add
      .text(abilityX + 100, abilityY, 'READY', {
        fontSize: '12px',
        color: '#00ff00',
        fontFamily: 'monospace',
      })
      .setOrigin(0, 0.5);
    this.#uiElements.afterburnerStatus.setScrollFactor(0);

    // Barrel roll status
    this.#uiElements.barrelRollLabel = this.add
      .text(abilityX, abilityY + 20, 'BARREL ROLL', {
        fontSize: '12px',
        color: '#ff8800',
        fontFamily: 'monospace',
      })
      .setOrigin(0, 0.5)
      .setAlpha(0.5);
    this.#uiElements.barrelRollLabel.setScrollFactor(0);

    this.#uiElements.barrelRollStatus = this.add
      .text(abilityX + 100, abilityY + 20, 'READY', {
        fontSize: '12px',
        color: '#00ff00',
        fontFamily: 'monospace',
      })
      .setOrigin(0, 0.5);
    this.#uiElements.barrelRollStatus.setScrollFactor(0);

    // Speed boost indicator (appears during afterburner)
    this.#uiElements.speedBoostIndicator = this.add
      .text(this.scale.width / 2, 120, 'AFTERBURNER ACTIVE!', {
        fontSize: '20px',
        color: '#00aaff',
        fontFamily: 'monospace',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.#uiElements.speedBoostIndicator.setScrollFactor(0);

    // Invulnerability indicator (appears during barrel roll)
    this.#uiElements.invulnerabilityIndicator = this.add
      .text(this.scale.width / 2, 150, 'INVULNERABLE!', {
        fontSize: '20px',
        color: '#ffaa00',
        fontFamily: 'monospace',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.#uiElements.invulnerabilityIndicator.setScrollFactor(0);

    // Pause indicator (initially hidden)
    this.#uiElements.pauseText = this.add
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
    this.#uiElements.pauseText.setScrollFactor(0);

    // Set UI depth for layering
    Object.values(this.#uiElements).forEach(element => {
      if (element && element.setDepth) {
        element.setDepth(100);
      }
    });
  }

  /**
   * Set up EventBus listeners for UI updates.
   * @private
   * @returns {void}
   */
  setupEventListeners() {
    // Score update listener
    const scoreListenerId = this.#eventBus.on(EventTypes.SCORE_UPDATED, this.onScoreUpdated, this);
    this.#listenerIds.push(scoreListenerId);

    // Health update listeners
    const healthDecreasedListenerId = this.#eventBus.on(
      EventTypes.HEALTH_DECREASED,
      this.handleHealthUpdate,
      this,
    );
    this.#listenerIds.push(healthDecreasedListenerId);

    const healthIncreasedListenerId = this.#eventBus.on(
      EventTypes.HEALTH_INCREASED,
      this.handleHealthUpdate,
      this,
    );
    this.#listenerIds.push(healthIncreasedListenerId);

    // Health upgrade listeners
    const healthMaxIncreasedListenerId = this.#eventBus.on(
      EventTypes.HEALTH_MAX_INCREASED,
      this.handleHealthUpdate,
      this,
    );
    this.#listenerIds.push(healthMaxIncreasedListenerId);

    // Player damage listener (for shield updates)
    // const playerDamagedListenerId = this.#eventBus.on(
    //   EventTypes.PLAYER_DAMAGED,
    //   this.handlePlayerDamaged,
    //   this,
    // );
    // this.#listenerIds.push(playerDamagedListenerId);

    // Damage reduction visual feedback
    const damageReducedListenerId = this.#eventBus.on(
      EventTypes.DAMAGE_REDUCED,
      this.handleDamageReduced,
      this,
    );
    this.#listenerIds.push(damageReducedListenerId);

    // Shield regeneration listener
    const shieldRegenListenerId = this.#eventBus.on(
      EventTypes.SHIELD_REGENERATED,
      this.handleShieldUpdate,
      this,
    );
    this.#listenerIds.push(shieldRegenListenerId);

    // Weapon update listener
    const weaponListenerId = this.#eventBus.on('ui:weaponUpdate', this.handleWeaponUpdate, this);
    this.#listenerIds.push(weaponListenerId);

    // Game state update listener (lives, character level, game level)
    const gameStateListenerId = this.#eventBus.on(
      'ui:gameStateUpdate',
      this.handleGameStateUpdate,
      this,
    );
    this.#listenerIds.push(gameStateListenerId);

    // Accuracy update listener
    const accuracyListenerId = this.#eventBus.on(
      'ui:accuracyUpdate',
      this.handleAccuracyUpdate,
      this,
    );
    this.#listenerIds.push(accuracyListenerId);

    // Pause state listeners
    const pauseListenerId = this.#eventBus.on(
      EventTypes.GAME_PAUSE_TOGGLE,
      this.handlePauseStateChanged,
      this,
    );
    this.#listenerIds.push(pauseListenerId);

    // Game over listener
    const gameOverListenerId = this.#eventBus.on(EventTypes.GAME_OVER, this.handleGameOver, this);
    this.#listenerIds.push(gameOverListenerId);

    // XP gain listener
    const xpGainedListenerId = this.#eventBus.on(EventTypes.XP_GAINED, this.handleXPGained, this);
    this.#listenerIds.push(xpGainedListenerId);

    // Level up listener
    const levelUpListenerId = this.#eventBus.on(EventTypes.LEVEL_UP, this.handleLevelUp, this);
    this.#listenerIds.push(levelUpListenerId);

    // Points events listeners
    const pointsEarnedListenerId = this.#eventBus.on(
      EventTypes.POINTS_EARNED,
      this.handlePointsEarned,
      this,
    );
    this.#listenerIds.push(pointsEarnedListenerId);

    const pointsSpentListenerId = this.#eventBus.on(
      EventTypes.POINTS_SPENT,
      this.handlePointsSpent,
      this,
    );
    this.#listenerIds.push(pointsSpentListenerId);

    // Weapon heat event listeners
    const weaponOverheatedListenerId = this.#eventBus.on(
      EventTypes.WEAPON_OVERHEATED,
      this.handleWeaponOverheated,
      this,
    );
    this.#listenerIds.push(weaponOverheatedListenerId);

    const weaponCoolingCompleteListenerId = this.#eventBus.on(
      EventTypes.WEAPON_COOLING_COMPLETE,
      this.handleWeaponCoolingComplete,
      this,
    );
    this.#listenerIds.push(weaponCoolingCompleteListenerId);

    // Weapon fired listener for heat updates
    const weaponFiredListenerId = this.#eventBus.on(
      EventTypes.WEAPON_FIRED,
      this.handleWeaponFired,
      this,
    );
    this.#listenerIds.push(weaponFiredListenerId);

    // Weapon switched listener for weapon display updates
    const weaponSwitchedListenerId = this.#eventBus.on(
      EventTypes.WEAPON_SWITCHED,
      this.handleWeaponSwitched,
      this,
    );
    this.#listenerIds.push(weaponSwitchedListenerId);

    // Mobility event listeners
    const afterburnerActivatedListenerId = this.#eventBus.on(
      EventTypes.AFTERBURNER_ACTIVATED,
      this.handleAfterburnerActivated,
      this,
    );
    this.#listenerIds.push(afterburnerActivatedListenerId);

    const afterburnerDeactivatedListenerId = this.#eventBus.on(
      EventTypes.AFTERBURNER_DEACTIVATED,
      this.handleAfterburnerDeactivated,
      this,
    );
    this.#listenerIds.push(afterburnerDeactivatedListenerId);

    const barrelRollActivatedListenerId = this.#eventBus.on(
      EventTypes.BARREL_ROLL_ACTIVATED,
      this.handleBarrelRollActivated,
      this,
    );
    this.#listenerIds.push(barrelRollActivatedListenerId);

    const barrelRollDeactivatedListenerId = this.#eventBus.on(
      EventTypes.BARREL_ROLL_DEACTIVATED,
      this.handleBarrelRollDeactivated,
      this,
    );
    this.#listenerIds.push(barrelRollDeactivatedListenerId);

    const playerDodgedListenerId = this.#eventBus.on(
      EventTypes.PLAYER_DODGED,
      this.handlePlayerDodged,
      this,
    );
    this.#listenerIds.push(playerDodgedListenerId);
  }

  /**
   * Handle score update events.
   * @param {Object} data - Event data containing score information
   * @param {number} data.score - The current score value
   * @returns {void}
   */
  onScoreUpdated(data) {
    if (this.#uiElements.scoreText && data.score !== undefined) {
      this.#uiElements.scoreText.setText(`SCORE: ${data.score}`);
    }
  }

  /**
   * Handle health update events.
   * @param {Object} data - Event data containing health information
   * @param {number} data.healthPercent - Health as a percentage (0-1)
   * @returns {void}
   */
  handleHealthUpdate(data) {
    if (!this.#uiElements.healthBar || data.healthPercent === undefined) return;

    const healthPercent = Math.max(0, Math.min(1, data.healthPercent));
    const { currentHealth, maxHealth } = data;
    const maxWidth = 200;
    this.#uiElements.healthBar.width = maxWidth * healthPercent;

    // Update numerical health display
    if (this.#uiElements.healthText) {
      this.#uiElements.healthText.setText(`${currentHealth}/${maxHealth}`);
    }

    // Change color based on health
    if (healthPercent > 0.6) {
      this.#uiElements.healthBar.setFillStyle(0x00ff00); // Green
    } else if (healthPercent > 0.3) {
      this.#uiElements.healthBar.setFillStyle(0xffff00); // Yellow
    } else {
      this.#uiElements.healthBar.setFillStyle(0xff0000); // Red
    }
  }

  /**
   * Handle shield update events.
   * @param {Object} data - Event data containing shield information
   * @returns {void}
   */
  handleShieldUpdate(data) {
    if (!this.#uiElements.shieldBar) return;

    const { current, max } = data;

    // Show shield UI if shields are available
    if (max > 0) {
      this.#uiElements.shieldBarBG.setVisible(true);
      this.#uiElements.shieldBar.setVisible(true);
      this.#uiElements.shieldText.setVisible(true);

      const shieldPercent = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
      const maxWidth = 200;
      this.#uiElements.shieldBar.width = maxWidth * shieldPercent;

      // Update numerical shield display
      if (this.#uiElements.shieldText) {
        this.#uiElements.shieldText.setText(`${Math.ceil(current)}/${max}`);
      }

      // Change color based on shield level and regeneration
      if (data.isRegenerating) {
        this.#uiElements.shieldBar.setFillStyle(0x88ffff); // Bright cyan when regenerating
      } else if (shieldPercent > 0.6) {
        this.#uiElements.shieldBar.setFillStyle(0x00ccff); // Blue
      } else if (shieldPercent > 0.3) {
        this.#uiElements.shieldBar.setFillStyle(0x0088cc); // Darker blue
      } else {
        this.#uiElements.shieldBar.setFillStyle(0x004488); // Dark blue
      }
    } else {
      // Hide shield UI if no shields
      this.#uiElements.shieldBarBG.setVisible(false);
      this.#uiElements.shieldBar.setVisible(false);
      this.#uiElements.shieldText.setVisible(false);
    }
  }

  /**
   * Handle weapon update events.
   * @param {Object} data - Event data containing weapon information
   * @param {string} data.weapon - The current weapon type
   * @returns {void}
   */
  handleWeaponUpdate(data) {
    if (this.#uiElements.weaponText && data.weapon) {
      this.#uiElements.weaponText.setText(`WEAPON: ${data.weapon.toUpperCase()}`);
    }
  }

  /**
   * Handle game state update events (lives, character level, game level).
   * @param {Object} data - Event data containing game state information
   * @param {number} [data.lives] - Number of lives remaining
   * @param {number} [data.characterLevel] - Current character level (XP-based)
   * @param {number} [data.level] - Current game level (progression-based)
   * @returns {void}
   */
  handleGameStateUpdate(data) {
    if (data.lives !== undefined && this.#uiElements.livesText) {
      this.#uiElements.livesText.setText(`LIVES: ${data.lives}`);
    }

    if (data.characterLevel !== undefined && this.#uiElements.characterLevelText) {
      this.#uiElements.characterLevelText.setText(`CHAR LVL: ${data.characterLevel}`);
    }

    // Update XP progress bar when experience data is available
    if (data.experience !== undefined && data.experienceToNextLevel !== undefined) {
      if (this.#uiElements.xpBar && this.#uiElements.xpText) {
        const maxWidth = 150;
        const progress = Math.min(1, data.experience / data.experienceToNextLevel);
        this.#uiElements.xpBar.width = maxWidth * progress;
        this.#uiElements.xpText.setText(`${data.experience}/${data.experienceToNextLevel} XP`);
      }
    }

    if (data.level !== undefined && this.#uiElements.levelText) {
      this.#uiElements.levelText.setText(`LEVEL: ${data.level}`);
    }
  }

  /**
   * Handle accuracy update events.
   * @param {Object} data - Event data containing accuracy information
   * @param {string} data.accuracy - Formatted accuracy percentage string
   * @returns {void}
   */
  handleAccuracyUpdate(data) {
    if (this.#uiElements.accuracyText && data.accuracy !== undefined) {
      this.#uiElements.accuracyText.setText(`ACCURACY: ${data.accuracy}`);
    }
  }

  /**
   * Handle debug info update events.
   * @param {Object} data - Event data containing debug information
   * @param {string} data.debugInfo - Debug information text to display
   * @returns {void}
   */
  handleDebugUpdate(data) {
    if (this.#uiElements.debugText && data.debugInfo) {
      this.#uiElements.debugText.setText(data.debugInfo);
    }
  }

  /**
   * Handle pause state change events.
   * @param {Object} data - Event data containing pause state
   * @param {boolean} data.paused - Whether the game is paused
   * @returns {void}
   */
  handlePauseStateChanged(data) {
    if (!this.#uiElements.pauseText) return;

    if (data.paused) {
      this.showPauseUI();
    } else {
      this.hidePauseUI();
    }
  }

  /**
   * Show pause UI overlay and text.
   * @private
   * @returns {void}
   */
  showPauseUI() {
    // Create semi-transparent overlay background if not exists
    if (!this.#uiElements.pauseOverlay) {
      this.#uiElements.pauseOverlay = this.add.rectangle(
        this.scale.width / 2,
        this.scale.height / 2,
        this.scale.width,
        this.scale.height,
        0x000000,
        0.6,
      );
      this.#uiElements.pauseOverlay.setScrollFactor(0);
      this.#uiElements.pauseOverlay.setDepth(90); // Below pause text but above game
    }

    // Show overlay and text
    this.#uiElements.pauseOverlay.setVisible(true);
    this.#uiElements.pauseText.setVisible(true);

    // Animate pause text appearance
    this.#uiElements.pauseText.setAlpha(0);
    this.#uiElements.pauseText.setScale(0.8);

    this.tweens.add({
      targets: this.#uiElements.pauseText,
      alpha: { from: 0, to: 1 },
      scaleX: { from: 0.8, to: 1 },
      scaleY: { from: 0.8, to: 1 },
      duration: 300,
      ease: 'Back.easeOut',
    });
  }

  /**
   * Hide pause UI overlay and text with animation.
   * @private
   * @returns {void}
   */
  hidePauseUI() {
    // Animate pause text disappearance
    this.tweens.add({
      targets: this.#uiElements.pauseText,
      alpha: { from: 1, to: 0 },
      scaleX: { from: 1, to: 0.8 },
      scaleY: { from: 1, to: 0.8 },
      duration: 200,
      ease: 'Power2.easeIn',
      onComplete: () => {
        this.#uiElements.pauseText.setVisible(false);
      },
    });

    // Hide overlay
    if (this.#uiElements.pauseOverlay) {
      this.#uiElements.pauseOverlay.setVisible(false);
    }
  }

  /**
   * Handle XP gained events for real-time progress bar updates.
   * @param {Object} data - Event data containing XP information
   * @param {number} data.amount - Amount of XP gained
   * @param {number} data.currentXP - Current XP toward next level
   * @param {number} data.requiredXP - XP required for next level
   * @param {number} data.level - Current character level
   * @param {number} data.progress - Progress as percentage (0-1)
   * @returns {void}
   */
  handleXPGained(data) {
    if (!this.#uiElements.xpBar || !this.#uiElements.xpText) return;

    const maxWidth = 150;
    const newWidth = maxWidth * Math.min(1, data.progress);

    // Update XP bar with smooth animation
    this.tweens.add({
      targets: this.#uiElements.xpBar,
      width: newWidth,
      duration: 300,
      ease: 'Power2.easeOut',
    });

    // Update XP text
    this.#uiElements.xpText.setText(`${data.currentXP}/${data.requiredXP} XP`);

    // Visual feedback for XP gain
    if (data.amount > 0) {
      this.showXPGainFeedback(data.amount);
    }
  }

  /**
   * Handle points earned events with visual feedback.
   * @param {Object} data - Event data containing points information
   * @param {number} data.amount - Amount of points earned
   * @param {string} data.reason - Reason for earning points
   * @param {number} data.availablePoints - Total available points
   * @param {number} data.spentPoints - Total spent points
   * @returns {void}
   */
  handlePointsEarned(data) {
    if (!this.#uiElements.pointsText) return;

    // Update points display
    this.#uiElements.pointsText.setText(
      `POINTS: ${data.availablePoints} / ${data.spentPoints} spent`,
    );

    // Visual feedback for points earned
    if (data.amount > 0) {
      this.showPointsEarnedFeedback(data.amount, data.reason);
    }
  }

  /**
   * Handle points spent events.
   * @param {Object} data - Event data containing points information
   * @param {number} data.amount - Amount of points spent
   * @param {string} data.reason - Reason for spending points
   * @param {number} data.availablePoints - Total available points
   * @param {number} data.spentPoints - Total spent points
   * @returns {void}
   */
  handlePointsSpent(data) {
    if (!this.#uiElements.pointsText) return;

    // Update points display
    this.#uiElements.pointsText.setText(
      `POINTS: ${data.availablePoints} / ${data.spentPoints} spent`,
    );

    // Visual feedback for points spent
    this.showPointsSpentFeedback(data.amount, data.reason);
  }

  /**
   * Handle level up events with animations and visual feedback.
   * @param {Object} data - Event data containing level up information
   * @param {number} data.level - New character level
   * @param {number} data.nextLevelXP - XP required for next level
   * @param {number} data.totalXPForLevel - Total XP required for current level
   * @param {number} data.totalXPForNextLevel - Total XP required for next level
   * @param {number} data.pointsAwarded - Points awarded for leveling up
   * @param {number} data.availablePoints - Total available points after level up
   * @returns {void}
   */
  handleLevelUp(data) {
    // Update character level display
    if (this.#uiElements.characterLevelText) {
      this.#uiElements.characterLevelText.setText(`CHAR LVL: ${data.level}`);
    }

    // Reset XP bar to 0 and update text
    if (this.#uiElements.xpBar && this.#uiElements.xpText) {
      this.#uiElements.xpBar.width = 0;
      this.#uiElements.xpText.setText(`0/${data.nextLevelXP} XP`);
    }

    // Update points display if points were awarded
    if (data.pointsAwarded && this.#uiElements.pointsText) {
      this.#uiElements.pointsText.setText(`POINTS: ${data.availablePoints} / 0 spent`);
    }

    // Level up animation and visual feedback
    this.showLevelUpAnimation(data.level, data.pointsAwarded);
  }

  /**
   * Show visual feedback for XP gain.
   * @param {number} amount - Amount of XP gained
   * @returns {void}
   */
  showXPGainFeedback(amount) {
    // Create floating XP text
    const xpText = this.add.text(
      this.#uiElements.xpText.x,
      this.#uiElements.xpText.y - 20,
      `+${amount} XP`,
      {
        fontSize: '12px',
        color: '#00aaff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      },
    );
    xpText.setScrollFactor(0);
    xpText.setDepth(110);

    // Animate floating text
    this.tweens.add({
      targets: xpText,
      y: xpText.y - 30,
      alpha: { from: 1, to: 0 },
      duration: 1000,
      ease: 'Power2.easeOut',
      onComplete: () => xpText.destroy(),
    });
  }

  /**
   * Show level up animation with visual effects.
   * @param {number} newLevel - The new character level
   * @param {number} pointsAwarded - Points awarded for leveling up
   * @returns {void}
   */
  showLevelUpAnimation(newLevel, pointsAwarded = 0) {
    // Create level up text with points information
    const levelUpMessage =
      pointsAwarded > 0
        ? `LEVEL UP!\nCHARACTER LEVEL ${newLevel}\n+${pointsAwarded} POINTS`
        : `LEVEL UP!\nCHARACTER LEVEL ${newLevel}`;

    const levelUpText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2 - 50,
      levelUpMessage,
      {
        fontSize: '32px',
        color: '#ffff00',
        fontFamily: 'Arial Black',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 3,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: '#000000',
          blur: 5,
          fill: true,
        },
      },
    );
    levelUpText.setOrigin(0.5);
    levelUpText.setScrollFactor(0);
    levelUpText.setDepth(120);
    levelUpText.setAlpha(0);

    // Level up animation sequence
    this.tweens.add({
      targets: levelUpText,
      alpha: { from: 0, to: 1 },
      scaleX: { from: 1.5, to: 1 },
      scaleY: { from: 1.5, to: 1 },
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Hold for a moment, then fade out
        this.tweens.add({
          targets: levelUpText,
          alpha: { from: 1, to: 0 },
          scaleX: { from: 1, to: 0.8 },
          scaleY: { from: 1, to: 0.8 },
          duration: 500,
          delay: 1500,
          ease: 'Power2.easeIn',
          onComplete: () => levelUpText.destroy(),
        });
      },
    });

    // Character level text pulse animation
    if (this.#uiElements.characterLevelText) {
      this.tweens.add({
        targets: this.#uiElements.characterLevelText,
        scaleX: { from: 1, to: 1.2, to: 1 },
        scaleY: { from: 1, to: 1.2, to: 1 },
        duration: 600,
        ease: 'Bounce.easeOut',
      });
    }

    // XP bar glow effect
    if (this.#uiElements.xpBarBG) {
      this.tweens.add({
        targets: this.#uiElements.xpBarBG,
        alpha: { from: 1, to: 0.3, to: 1 },
        duration: 300,
        repeat: 3,
        ease: 'Power2.easeInOut',
      });
    }
  }

  /**
   * Show visual feedback for points earned.
   * @param {number} amount - Amount of points earned
   * @param {string} reason - Reason for earning points
   * @returns {void}
   */
  showPointsEarnedFeedback(amount, reason) {
    // Create floating points text
    const pointsText = this.add.text(
      this.#uiElements.pointsText.x,
      this.#uiElements.pointsText.y - 20,
      `+${amount} POINTS`,
      {
        fontSize: '14px',
        color: '#ffaa00',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      },
    );
    pointsText.setScrollFactor(0);
    pointsText.setDepth(110);

    // Animate floating text
    this.tweens.add({
      targets: pointsText,
      y: pointsText.y - 30,
      alpha: { from: 1, to: 0 },
      duration: 1500,
      ease: 'Power2.easeOut',
      onComplete: () => pointsText.destroy(),
    });

    // Pulse effect on points text
    if (this.#uiElements.pointsText) {
      this.tweens.add({
        targets: this.#uiElements.pointsText,
        scaleX: { from: 1, to: 1.1, to: 1 },
        scaleY: { from: 1, to: 1.1, to: 1 },
        duration: 400,
        ease: 'Back.easeOut',
      });
    }
  }

  /**
   * Show visual feedback for points spent.
   * @param {number} amount - Amount of points spent
   * @param {string} reason - Reason for spending points
   * @returns {void}
   */
  showPointsSpentFeedback(amount, reason) {
    // Create floating spent points text
    const pointsText = this.add.text(
      this.#uiElements.pointsText.x,
      this.#uiElements.pointsText.y - 20,
      `-${amount} POINTS`,
      {
        fontSize: '14px',
        color: '#ff6666',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      },
    );
    pointsText.setScrollFactor(0);
    pointsText.setDepth(110);

    // Animate floating text
    this.tweens.add({
      targets: pointsText,
      y: pointsText.y - 30,
      alpha: { from: 1, to: 0 },
      duration: 1200,
      ease: 'Power2.easeOut',
      onComplete: () => pointsText.destroy(),
    });
  }

  /**
   * Handle game over event - fade out UI elements
   * @param {Object} data - Game over event data
   */
  handleGameOver(data) {
    this.#logger.debug('Game over received in UIScene:', data);

    // Fade out all UI elements except pause overlay
    const elementsToFade = [
      this.#uiElements.scoreText,
      this.#uiElements.livesText,
      this.#uiElements.characterLevelText,
      this.#uiElements.levelText,
      this.#uiElements.xpBarBG,
      this.#uiElements.xpBar,
      this.#uiElements.xpText,
      this.#uiElements.pointsText,
      this.#uiElements.weaponText,
      this.#uiElements.accuracyText,
      this.#uiElements.healthBar,
      this.#uiElements.healthText,
      this.#uiElements.heatBar,
      this.#uiElements.heatBarBG,
      this.#uiElements.heatText,
      this.#uiElements.heatLabel,
    ].filter(element => element);

    elementsToFade.forEach(element => {
      this.tweens.add({
        targets: element,
        alpha: 0,
        duration: 1000,
        ease: 'Power2.easeOut',
      });
    });

    // Brief "GAME OVER" overlay before scene transition
    const gameOverText = this.add
      .text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'GAME OVER', {
        fontSize: '48px',
        color: '#ff0000',
        fontFamily: 'Arial Black',
        stroke: '#ffffff',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Animate game over text
    this.tweens.add({
      targets: gameOverText,
      alpha: 1,
      scale: { from: 1.5, to: 1 },
      duration: 800,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Fade out after brief display
        this.tweens.add({
          targets: gameOverText,
          alpha: 0,
          duration: 500,
          delay: 500,
        });
      },
    });
  }

  /**
   * Handle weapon overheated events
   * @param {Object} data - Overheated event data
   * @param {number} data.heat - Current heat level
   * @param {number} data.threshold - Heat threshold
   * @returns {void}
   */
  handleWeaponOverheated(data) {
    if (!this.#uiElements.heatBar || !this.#uiElements.heatText) return;

    // Update heat display to red when overheated
    this.#uiElements.heatBar.setFillStyle(0xff0000);
    this.#uiElements.heatText.setColor('#ff0000');

    // Flash effect for overheating
    this.tweens.add({
      targets: [this.#uiElements.heatBar, this.#uiElements.heatText, this.#uiElements.heatLabel],
      alpha: { from: 1, to: 0.3, to: 1 },
      duration: 200,
      repeat: 3,
      ease: 'Power2.easeInOut',
    });

    this.#logger.debug('Weapon overheated - UI updated', {
      heat: data.heat,
      threshold: data.threshold,
    });
  }

  /**
   * Handle weapon cooling complete events
   * @param {Object} data - Cooling complete event data
   * @param {number} data.heat - Current heat level
   * @param {number} data.threshold - Heat threshold
   * @returns {void}
   */
  handleWeaponCoolingComplete(data) {
    if (!this.#uiElements.heatBar || !this.#uiElements.heatText) return;

    // Restore normal heat colors
    this.#uiElements.heatBar.setFillStyle(0xff8800);
    this.#uiElements.heatText.setColor('#ffffff');

    // Pulse effect for cooling complete
    this.tweens.add({
      targets: this.#uiElements.heatBar,
      scaleX: { from: 1, to: 1.05, to: 1 },
      scaleY: { from: 1, to: 1.1, to: 1 },
      duration: 300,
      ease: 'Back.easeOut',
    });

    this.#logger.debug('Weapon cooling complete - UI updated', {
      heat: data.heat,
      threshold: data.threshold,
    });
  }

  /**
   * Handle weapon fired events to update heat display
   * @param {Object} data - Weapon fired event data
   * @returns {void}
   */
  handleWeaponFired(data) {
    // We'll get heat status from the GameScene through update calls
    this.updateHeatDisplay();
  }

  /**
   * Handle weapon switched events to update weapon display
   * @param {Object} data - Weapon switched event data
   * @param {string} data.currentWeapon - Current weapon type
   * @param {Object} data.weaponConfig - Weapon configuration
   * @returns {void}
   */
  handleWeaponSwitched(data) {
    if (!this.#uiElements.weaponText) return;

    const weaponName = data.weaponConfig
      ? data.weaponConfig.NAME
      : data.currentWeapon.toUpperCase();
    this.#uiElements.weaponText.setText(`WEAPON: ${weaponName}`);

    // Pulse effect for weapon switch
    this.tweens.add({
      targets: this.#uiElements.weaponText,
      scaleX: { from: 1, to: 1.2, to: 1 },
      scaleY: { from: 1, to: 1.2, to: 1 },
      duration: 300,
      ease: 'Back.easeOut',
    });

    this.#logger.debug('Weapon switched - UI updated', {
      weapon: data.currentWeapon,
      config: data.weaponConfig,
    });
  }

  /**
   * Update heat display based on current game state
   * @returns {void}
   */
  updateHeatDisplay() {
    // Get the upgrade system from the game scene
    const gameScene = this.scene.get('GameScene');
    if (!gameScene || !gameScene.upgradeSystem) return;

    const heatStatus = gameScene.upgradeSystem.getWeaponHeatStatus();

    if (!this.#uiElements.heatBar || !this.#uiElements.heatText) return;

    // Update heat bar width
    const heatBarWidth = 200;
    const heatPercentage = heatStatus.heatPercentage;
    const newWidth = (heatPercentage / 100) * heatBarWidth;

    this.#uiElements.heatBar.width = newWidth;
    this.#uiElements.heatText.setText(`${Math.round(heatPercentage)}%`);

    // Change color based on heat level
    let heatColor = 0xff8800; // Orange default
    if (heatStatus.overheated) {
      heatColor = 0xff0000; // Red when overheated
    } else if (heatPercentage > 80) {
      heatColor = 0xff4400; // Red-orange when close to overheating
    } else if (heatPercentage > 60) {
      heatColor = 0xff6600; // Orange-red when heating up
    }

    this.#uiElements.heatBar.setFillStyle(heatColor);
  }

  /**
   * Scene update loop for continuous UI updates
   * @param {number} time - Current time
   * @param {number} delta - Time delta
   * @returns {void}
   */
  update(time, delta) {
    // Update heat display continuously
    this.updateHeatDisplay();

    // Update special ability UI visibility
    this.updateSpecialAbilityUI();
  }

  /**
   * Handle damage reduction events by displaying visual feedback.
   * @param {Object} data - Event data containing damage reduction information
   * @returns {void}
   */
  handleDamageReduced(data) {
    const { incomingDamage, actualDamage, damageReduction, damageBlocked } = data;

    if (damageBlocked <= 0) return;

    // Create floating damage reduction text
    const reductionText = this.add
      .text(
        this.scale.width - 250,
        this.scale.height / 2 - 30,
        `-${damageBlocked.toFixed(1)} DMG`,
        {
          fontSize: '16px',
          color: '#00aaff',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 2,
        },
      )
      .setOrigin(0.5);

    reductionText.setScrollFactor(0);
    reductionText.setDepth(110);

    // Animate the text
    this.tweens.add({
      targets: reductionText,
      y: reductionText.y - 30,
      alpha: 0,
      duration: 1000,
      ease: 'Power2.easeOut',
      onComplete: () => {
        reductionText.destroy();
      },
    });

    this.#logger.debug('Damage reduction visual feedback', {
      incomingDamage,
      actualDamage,
      damageReduction,
      damageBlocked,
    });
  }

  /**
   * Handle afterburner activated events
   * @param {Object} data - Afterburner activation data
   * @returns {void}
   */
  handleAfterburnerActivated(data) {
    const { duration, speedMultiplier, damageTrail } = data;

    // Update status display
    if (this.#uiElements.afterburnerStatus) {
      this.#uiElements.afterburnerStatus.setText('ACTIVE').setColor('#00aaff');
    }

    // Show afterburner active indicator
    if (this.#uiElements.speedBoostIndicator) {
      this.#uiElements.speedBoostIndicator.setAlpha(1);

      // Pulsing effect
      this.tweens.add({
        targets: this.#uiElements.speedBoostIndicator,
        scaleX: { from: 1, to: 1.2, to: 1 },
        scaleY: { from: 1, to: 1.2, to: 1 },
        duration: 500,
        repeat: -1,
        yoyo: true,
        ease: 'Power2.easeInOut',
      });
    }

    // Brighten afterburner label
    if (this.#uiElements.afterburnerLabel) {
      this.#uiElements.afterburnerLabel.setAlpha(1);
    }

    this.#logger.debug('Afterburner UI activated', { duration, speedMultiplier, damageTrail });
  }

  /**
   * Handle afterburner deactivated events
   * @param {Object} data - Afterburner deactivation data
   * @returns {void}
   */
  handleAfterburnerDeactivated(data) {
    const { cooldownDuration } = data;

    // Update status to cooldown
    if (this.#uiElements.afterburnerStatus) {
      this.#uiElements.afterburnerStatus.setText('COOLDOWN').setColor('#ff4400');
    }

    // Hide afterburner active indicator
    if (this.#uiElements.speedBoostIndicator) {
      this.tweens.killTweensOf(this.#uiElements.speedBoostIndicator);
      this.#uiElements.speedBoostIndicator.setAlpha(0).setScale(1);
    }

    // Dim afterburner label
    if (this.#uiElements.afterburnerLabel) {
      this.#uiElements.afterburnerLabel.setAlpha(0.5);
    }

    // Start cooldown countdown
    this.startAbilityCooldownCountdown('afterburner', cooldownDuration);

    this.#logger.debug('Afterburner UI deactivated', { cooldownDuration });
  }

  /**
   * Handle barrel roll activated events
   * @param {Object} data - Barrel roll activation data
   * @returns {void}
   */
  handleBarrelRollActivated(data) {
    const { duration, invulnerable } = data;

    // Update status display
    if (this.#uiElements.barrelRollStatus) {
      this.#uiElements.barrelRollStatus.setText('ACTIVE').setColor('#ffaa00');
    }

    // Show invulnerability indicator if applicable
    if (invulnerable && this.#uiElements.invulnerabilityIndicator) {
      this.#uiElements.invulnerabilityIndicator.setAlpha(1);

      // Flashing effect for invulnerability
      this.tweens.add({
        targets: this.#uiElements.invulnerabilityIndicator,
        alpha: { from: 1, to: 0.3, to: 1 },
        duration: 200,
        repeat: -1,
        ease: 'Power2.easeInOut',
      });
    }

    // Brighten barrel roll label
    if (this.#uiElements.barrelRollLabel) {
      this.#uiElements.barrelRollLabel.setAlpha(1);
    }

    this.#logger.debug('Barrel roll UI activated', { duration, invulnerable });
  }

  /**
   * Handle barrel roll deactivated events
   * @param {Object} data - Barrel roll deactivation data
   * @returns {void}
   */
  handleBarrelRollDeactivated(data) {
    const { cooldownDuration } = data;

    // Update status to cooldown
    if (this.#uiElements.barrelRollStatus) {
      this.#uiElements.barrelRollStatus.setText('COOLDOWN').setColor('#ff4400');
    }

    // Hide invulnerability indicator
    if (this.#uiElements.invulnerabilityIndicator) {
      this.tweens.killTweensOf(this.#uiElements.invulnerabilityIndicator);
      this.#uiElements.invulnerabilityIndicator.setAlpha(0);
    }

    // Dim barrel roll label
    if (this.#uiElements.barrelRollLabel) {
      this.#uiElements.barrelRollLabel.setAlpha(0.5);
    }

    // Start cooldown countdown
    this.startAbilityCooldownCountdown('barrelRoll', cooldownDuration);

    this.#logger.debug('Barrel roll UI deactivated', { cooldownDuration });
  }

  /**
   * Handle player dodged events
   * @param {Object} data - Dodge event data
   * @returns {void}
   */
  handlePlayerDodged(data) {
    const { dodgeChance, roll } = data;

    // Create floating "DODGED!" text
    const dodgeText = this.add
      .text(
        this.scale.width / 2 + (Math.random() - 0.5) * 100,
        this.scale.height / 2 + (Math.random() - 0.5) * 100,
        'DODGED!',
        {
          fontSize: '24px',
          color: '#00ff88',
          fontFamily: 'monospace',
          stroke: '#000000',
          strokeThickness: 2,
        },
      )
      .setOrigin(0.5);

    // Animate dodge text
    this.tweens.add({
      targets: dodgeText,
      y: dodgeText.y - 60,
      alpha: { from: 1, to: 0 },
      scaleX: { from: 1, to: 1.5 },
      scaleY: { from: 1, to: 1.5 },
      duration: 1500,
      ease: 'Power2.easeOut',
      onComplete: () => {
        dodgeText.destroy();
      },
    });

    this.#logger.debug('Player dodge UI feedback', { dodgeChance, roll });
  }

  /**
   * Start ability cooldown countdown display
   * @private
   * @param {string} abilityName - Name of ability ('afterburner' or 'barrelRoll')
   * @param {number} cooldownMs - Cooldown duration in milliseconds
   * @returns {void}
   */
  startAbilityCooldownCountdown(abilityName, cooldownMs) {
    const statusElement =
      abilityName === 'afterburner'
        ? this.#uiElements.afterburnerStatus
        : this.#uiElements.barrelRollStatus;

    if (!statusElement) return;

    const startTime = Date.now();
    const updateCooldown = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, cooldownMs - elapsed);

      if (remaining > 0) {
        const secondsLeft = Math.ceil(remaining / 1000);
        statusElement.setText(`${secondsLeft}s`);

        // Continue countdown
        this.time.delayedCall(100, updateCooldown);
      } else {
        // Cooldown complete
        statusElement.setText('READY').setColor('#00ff00');
      }
    };

    updateCooldown();
  }

  /**
   * Update special ability UI visibility based on available upgrades
   * @returns {void}
   */
  updateSpecialAbilityUI() {
    const gameScene = this.scene.get('GameScene');
    if (!gameScene || !gameScene.upgradeSystem) return;

    const effects = gameScene.upgradeSystem.getUpgradeEffects();

    // Show/hide afterburner UI based on upgrade
    const hasAfterburner = effects.afterburnerDuration > 0;
    if (this.#uiElements.afterburnerLabel && this.#uiElements.afterburnerStatus) {
      this.#uiElements.afterburnerLabel.setVisible(hasAfterburner);
      this.#uiElements.afterburnerStatus.setVisible(hasAfterburner);
    }

    // Show/hide barrel roll UI based on upgrade
    const hasBarrelRoll = effects.barrelRollDuration > 0;
    if (this.#uiElements.barrelRollLabel && this.#uiElements.barrelRollStatus) {
      this.#uiElements.barrelRollLabel.setVisible(hasBarrelRoll);
      this.#uiElements.barrelRollStatus.setVisible(hasBarrelRoll);
    }
  }

  /**
   * Clean up resources when scene shuts down.
   * @returns {void}
   */
  shutdown() {
    // Clean up EventBus listeners
    this.#listenerIds.forEach(listenerId => {
      this.#eventBus.off(listenerId);
    });
    this.#listenerIds = [];

    this.tweens.killAll();
    this.#uiElements = {};
  }
}
