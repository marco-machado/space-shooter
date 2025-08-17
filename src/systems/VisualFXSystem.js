import VisualConfig from '@/config/VisualConfig.js';
import { getEventBus } from '@/event-bus/EventBus.js';
import { EventTypes } from '@/event-bus/EventTypes.js';
import Logger from '@/utils/Logger.js';

/**
 * VisualFXSystem manages centralized visual effects with event-driven architecture
 * Handles screen flashes, player flickering, and effect conflict prevention
 * @class
 * @classdesc Provides a centralized system for managing visual effects across the game
 */
export default class VisualFXSystem {
  /**
   * Private logger instance for scoped debugging
   * @private
   * @type {Object}
   */
  #logger;

  /**
   * Private event bus instance
   * @private
   * @type {Object}
   */
  #eventBus;

  /**
   * Private scene reference for camera and graphics access
   * @private
   * @type {Phaser.Scene}
   */
  #scene;

  /**
   * Private graphics object for screen flash effects
   * @private
   * @type {Phaser.GameObjects.Graphics}
   */
  #flashGraphics;

  /**
   * Private active effects tracking to prevent conflicts
   * @private
   * @type {Object}
   */
  #activeEffects;

  /**
   * Private player reference for flickering effects
   * @private
   * @type {Object}
   */
  #player;

  /**
   * Private event listener IDs for cleanup
   * @private
   * @type {Array<string>}
   */
  #listenerIds;

  /**
   * Create a new VisualFXSystem instance
   * @param {Phaser.Scene} scene - The Phaser scene instance
   * @param {Object} player - The player entity for flickering effects
   */
  constructor(scene, player) {
    if (!scene) {
      throw new Error('VisualFXSystem requires a valid Phaser scene');
    }

    this.#logger = Logger.scope('VisualFXSystem');
    this.#eventBus = getEventBus();
    this.#scene = scene;
    this.#player = player;
    this.#listenerIds = [];

    // Initialize active effects tracking
    this.#activeEffects = {
      screenFlash: false,
      playerFlicker: false,
    };

    this.#createFlashGraphics();
    this.#setupEventListeners();

    this.#logger.debug('VisualFXSystem initialized', {
      sceneKey: scene.scene.key,
      hasPlayer: !!player,
    });
  }

  /**
   * Create graphics object for screen flash effects
   * @private
   * @returns {void}
   */
  #createFlashGraphics() {
    this.#flashGraphics = this.#scene.add.graphics();
    this.#flashGraphics.setDepth(VisualConfig.DEPTHS.UI - 1); // Just below UI
    this.#flashGraphics.setVisible(false);
  }

  /**
   * Set up event listeners for visual effects
   * @private
   * @returns {void}
   */
  #setupEventListeners() {
    // Health and damage events
    this.#listenerIds.push(
      this.#eventBus.on(EventTypes.HEALTH_DECREASED, this.#handleHealthDecreased, this),
    );
    this.#listenerIds.push(
      this.#eventBus.on(EventTypes.ENEMY_DAMAGED, this.#handleEnemyDamaged, this),
    );
    this.#listenerIds.push(
      this.#eventBus.on(EventTypes.POWERUP_COLLECTED, this.#handlePowerupCollected, this),
    );

    // Invincibility events
    this.#listenerIds.push(
      this.#eventBus.on(EventTypes.INVINCIBILITY_STARTED, this.#handleInvincibilityStarted, this),
    );
    this.#listenerIds.push(
      this.#eventBus.on(EventTypes.INVINCIBILITY_ENDED, this.#handleInvincibilityEnded, this),
    );

    this.#logger.debug('Event listeners registered', {
      listenerCount: this.#listenerIds.length,
    });
  }

  /**
   * Handle health decreased events (player damage)
   * @private
   * @param {Object} data - Health decreased event data
   * @returns {void}
   */
  #handleHealthDecreased(data) {
    this.#logger.debug('Player health decreased, applying visual effects', {
      currentHealth: data.currentHealth,
      damageAmount: data.damageAmount,
      damageSource: data.damageSource,
    });

    // Apply screen flash for player hit
    this.#applyScreenFlash(
      VisualConfig.EFFECTS.FLASH_EFFECT.PLAYER_HIT.color,
      VisualConfig.EFFECTS.FLASH_EFFECT.PLAYER_HIT.duration,
    );
  }

  /**
   * Handle enemy damaged events
   * @private
   * @param {Object} data - Enemy damaged event data
   * @returns {void}
   */
  #handleEnemyDamaged(data) {
    this.#logger.debug('Enemy damaged, applying visual effects', {
      enemyId: data.enemy?.id,
      damage: data.damage,
    });

    // Apply screen flash for enemy hit
    this.#applyScreenFlash(
      VisualConfig.EFFECTS.FLASH_EFFECT.ENEMY_HIT.color,
      VisualConfig.EFFECTS.FLASH_EFFECT.ENEMY_HIT.duration,
    );
  }

  /**
   * Handle power-up collected events
   * @private
   * @param {Object} _data - Power-up collected event data
   * @returns {void}
   */
  #handlePowerupCollected(_data) {
    this.#logger.debug('Power-up collected, applying visual effects', {
      powerupType: _data.type,
    });

    // Apply screen flash for power-up collection
    this.#applyScreenFlash(
      VisualConfig.EFFECTS.FLASH_EFFECT.POWERUP_COLLECTED.color,
      VisualConfig.EFFECTS.FLASH_EFFECT.POWERUP_COLLECTED.duration,
    );
  }

  /**
   * Handle invincibility started events
   * @private
   * @param {Object} data - Invincibility started event data
   * @returns {void}
   */
  #handleInvincibilityStarted(data) {
    this.#logger.debug('Invincibility started, beginning player flicker effect', {
      duration: data.duration,
    });

    this.#startPlayerFlicker();
  }

  /**
   * Handle invincibility ended events
   * @private
   * @param {Object} _data - Invincibility ended event data
   * @returns {void}
   */
  #handleInvincibilityEnded(_data) {
    this.#logger.debug('Invincibility ended, stopping player flicker effect');

    this.#stopPlayerFlicker();
  }

  /**
   * Apply screen flash effect
   * @private
   * @param {number} color - Flash color as hex value
   * @param {number} duration - Flash duration in milliseconds
   * @returns {void}
   */
  #applyScreenFlash(color, duration) {
    // Prevent overlapping flash effects
    if (this.#activeEffects.screenFlash) {
      this.#logger.debug('Screen flash already active, skipping');
      return;
    }

    this.#activeEffects.screenFlash = true;

    // Clear previous flash graphics
    this.#flashGraphics.clear();

    // Create full-screen flash
    this.#flashGraphics.fillStyle(color, 0.3); // 30% opacity
    this.#flashGraphics.fillRect(
      0,
      0,
      this.#scene.cameras.main.width,
      this.#scene.cameras.main.height,
    );
    this.#flashGraphics.setVisible(true);

    this.#logger.debug('Screen flash applied', {
      color: color.toString(16),
      duration,
    });

    // Fade out the flash
    this.#scene.tweens.add({
      targets: this.#flashGraphics,
      alpha: 0,
      duration,
      ease: 'Power2',
      onComplete: () => {
        this.#flashGraphics.setVisible(false);
        this.#flashGraphics.clear();
        this.#flashGraphics.alpha = 1; // Reset alpha for next use
        this.#activeEffects.screenFlash = false;
        this.#logger.debug('Screen flash completed');
      },
    });
  }

  /**
   * Start player flickering effect during invincibility
   * @private
   * @returns {void}
   */
  #startPlayerFlicker() {
    if (!this.#player) {
      this.#logger.warn('Cannot start player flicker - player not available');
      return;
    }

    // Prevent overlapping flicker effects
    if (this.#activeEffects.playerFlicker) {
      this.#logger.debug('Player flicker already active, skipping');
      return;
    }

    this.#activeEffects.playerFlicker = true;

    this.#logger.debug('Player flicker started');

    // Create a repeating tween for flickering effect
    this.#scene.tweens.add({
      targets: this.#player,
      alpha: 0.3, // Fade to 30% opacity
      duration: 100, // Fast flicker
      ease: 'Power2',
      yoyo: true, // Return to original opacity
      repeat: -1, // Repeat indefinitely until stopped
    });
  }

  /**
   * Stop player flickering effect
   * @private
   * @returns {void}
   */
  #stopPlayerFlicker() {
    if (!this.#player) {
      this.#logger.warn('Cannot stop player flicker - player not available');
      return;
    }

    if (!this.#activeEffects.playerFlicker) {
      this.#logger.debug('Player flicker not active, nothing to stop');
      return;
    }

    this.#activeEffects.playerFlicker = false;

    // Kill all tweens on the player
    this.#scene.tweens.killTweensOf(this.#player);

    // Ensure player is fully visible
    this.#player.alpha = 1;

    this.#logger.debug('Player flicker stopped');
  }

  /**
   * Update the VisualFXSystem (called from scene update)
   * @param {number} _deltaTime - Time elapsed since last frame
   * @returns {void}
   */
  update(_deltaTime) {
    // Update flash graphics position if camera moves
    if (this.#flashGraphics && this.#flashGraphics.visible) {
      this.#flashGraphics.x = this.#scene.cameras.main.scrollX;
      this.#flashGraphics.y = this.#scene.cameras.main.scrollY;
    }
  }

  /**
   * Get current status of active effects
   * @returns {Object} Status of all active effects
   */
  getActiveEffectsStatus() {
    return { ...this.#activeEffects };
  }

  /**
   * Force stop all active effects (useful for scene transitions)
   * @returns {void}
   */
  stopAllEffects() {
    this.#logger.debug('Stopping all active effects');

    // Stop screen flash
    if (this.#activeEffects.screenFlash) {
      this.#scene.tweens.killTweensOf(this.#flashGraphics);
      this.#flashGraphics.setVisible(false);
      this.#flashGraphics.clear();
      this.#flashGraphics.alpha = 1;
      this.#activeEffects.screenFlash = false;
    }

    // Stop player flicker
    this.#stopPlayerFlicker();

    this.#logger.debug('All effects stopped');
  }

  /**
   * Clean up the VisualFXSystem
   * @returns {void}
   */
  destroy() {
    this.#logger.debug('Destroying VisualFXSystem');

    // Stop all active effects
    this.stopAllEffects();

    // Remove all event listeners
    for (const listenerId of this.#listenerIds) {
      this.#eventBus.off(listenerId);
    }
    this.#listenerIds.length = 0;

    // Destroy flash graphics
    if (this.#flashGraphics) {
      this.#flashGraphics.destroy();
      this.#flashGraphics = null;
    }

    // Clear references
    this.#scene = null;
    this.#player = null;
    this.#eventBus = null;
    this.#logger = null;

    this.#logger.debug('VisualFXSystem destroyed');
  }
}
