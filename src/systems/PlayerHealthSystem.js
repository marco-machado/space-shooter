import { getEventBus } from '@/event-bus/EventBus.js';
import { EventTypes } from '@/event-bus/EventTypes.js';
import { makeHealthDecreasedEvent, makeHealthIncreasedEvent, makePlayerDeathEvent, } from '@/event-bus/HealthEvents.js';
import Logger from '@/utils/Logger.js';

/**
 * PlayerHealthSystem manages player health events and damage processing
 * @class
 */
export default class PlayerHealthSystem {
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
   * Private player reference
   * @private
   * @type {Object}
   */
  #player;

  /**
   * Private invincibility state tracking
   * @private
   * @type {Object}
   */
  #invincibility;

  /**
   * Create a new PlayerHealthSystem instance
   * @param {Object} player - The player entity with health component
   */
  constructor(player) {
    if (!player || !player.health) {
      throw new Error('PlayerHealthSystem requires a player entity with health component');
    }

    this.#logger = Logger.scope('PlayerHealthSystem');
    this.#eventBus = getEventBus();
    this.#player = player;

    this.#invincibility = {
      active: false,
      duration: 1000, // 1 second in milliseconds
      timer: null,
    };

    this.#setupEventListeners();

    this.#logger.debug('PlayerHealthSystem initialized', {
      playerHealth: player.health.getCurrentHealth(),
      maxHealth: player.health.getMaxHealth(),
    });
  }

  /**
   * Set up event listeners for player damage events
   * @private
   * @returns {void}
   */
  #setupEventListeners() {
    this.#eventBus.on(EventTypes.PLAYER_DAMAGED, this.#handlePlayerDamage, this);
  }

  /**
   * Handle player damage events
   * @private
   * @param {Object} data - Damage event data
   * @returns {void}
   */
  #handlePlayerDamage(data) {
    // Skip damage if player is invincible
    if (this.#invincibility.active) {
      return;
    }

    const { damage, source } = data;
    const currentHealth = this.#player.health.getCurrentHealth();
    const maxHealth = this.#player.health.getMaxHealth();

    if (currentHealth <= 0) {
      this.#logger.debug('Player damage ignored - already dead');
      return;
    }

    // Apply damage
    const damageAmount = Math.max(0, damage || 1);
    const newHealth = Math.max(0, currentHealth - damageAmount);

    this.#player.health.setCurrentHealth(newHealth);

    this.#logger.debug('Player took damage', {
      damage: damageAmount,
      source,
      oldHealth: currentHealth,
      newHealth,
      maxHealth,
    });

    // Emit health decreased event
    const healthEvent = makeHealthDecreasedEvent(newHealth, maxHealth, damageAmount, source);
    this.#eventBus.emit(healthEvent.type, healthEvent.data, healthEvent.priority);

    // Activate invincibility frames
    this.#activateInvincibility();

    // Check for death
    if (newHealth <= 0) {
      this.#handlePlayerDeath(source);
    }
  }

  /**
   * Activate invincibility frames
   * @private
   * @returns {void}
   */
  #activateInvincibility() {
    if (this.#invincibility.timer) {
      clearTimeout(this.#invincibility.timer);
    }

    this.#invincibility.active = true;
    this.#logger.debug('Invincibility activated', { duration: this.#invincibility.duration });

    this.#invincibility.timer = setTimeout(() => {
      this.#invincibility.active = false;
      this.#invincibility.timer = null;
      this.#logger.debug('Invincibility deactivated');
    }, this.#invincibility.duration);
  }

  /**
   * Handle player death
   * @private
   * @param {string} cause - Cause of death
   * @returns {void}
   */
  #handlePlayerDeath(cause) {
    this.#logger.info('Player died', { cause });

    // Emit player death event
    const deathEvent = makePlayerDeathEvent(this.#player, cause);
    this.#eventBus.emit(deathEvent.type, deathEvent.data, deathEvent.priority);
  }

  /**
   * Heal the player (for future power-up integration)
   * @param {number} healAmount - Amount to heal
   * @param {string} source - Source of healing
   * @returns {void}
   */
  heal(healAmount, source = 'unknown') {
    const currentHealth = this.#player.health.getCurrentHealth();
    const maxHealth = this.#player.health.getMaxHealth();

    if (currentHealth >= maxHealth) {
      this.#logger.debug('Heal ignored - already at max health');
      return;
    }

    const actualHealAmount = Math.min(healAmount, maxHealth - currentHealth);
    const newHealth = currentHealth + actualHealAmount;

    this.#player.health.setCurrentHealth(newHealth);

    this.#logger.debug('Player healed', {
      healAmount: actualHealAmount,
      source,
      oldHealth: currentHealth,
      newHealth,
      maxHealth,
    });

    // Emit health increased event
    const healthEvent = makeHealthIncreasedEvent(newHealth, maxHealth, actualHealAmount, source);
    this.#eventBus.emit(healthEvent.type, healthEvent.data, healthEvent.priority);
  }

  /**
   * Check if player is currently invincible
   * @returns {boolean} True if player is invincible
   */
  isInvincible() {
    return this.#invincibility.active;
  }

  /**
   * Clean up the PlayerHealthSystem
   * @returns {void}
   */
  destroy() {
    // Remove event listeners
    this.#eventBus.off(EventTypes.PLAYER_DAMAGED, this.#handlePlayerDamage, this);

    // Clear invincibility timer
    if (this.#invincibility.timer) {
      clearTimeout(this.#invincibility.timer);
      this.#invincibility.timer = null;
    }

    // Clear references
    this.#player = null;
    this.#eventBus = null;
    this.#logger = null;

    this.#logger.debug('PlayerHealthSystem destroyed');
  }
}
