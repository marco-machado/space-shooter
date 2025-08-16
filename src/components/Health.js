import Logger from '@/utils/Logger.js';

/**
 * Health Component
 * @class
 * @classdesc Data-only health component for game entities.
 * Provides health state storage and basic validation.
 */
export default class HealthComponent {
  /**
   * Private logger instance for scoped debugging
   * @private
   * @type {Object}
   */
  #logger;

  /**
   * Private current health value
   * @private
   * @type {number}
   */
  #currentHealth;

  /**
   * Private maximum health value
   * @private
   * @type {number}
   */
  #maxHealth;

  /**
   * Create a new HealthComponent instance
   * @param {Object} entity - The entity this component belongs to
   * @param {number} [maxHealth=100] - Maximum health value
   */
  constructor(entity, maxHealth = 100) {
    if (!entity || typeof entity !== 'object') {
      throw new TypeError('Entity parameter must be a valid object');
    }
    if (typeof maxHealth !== 'number' || isNaN(maxHealth) || maxHealth <= 0) {
      throw new TypeError('maxHealth must be a positive number');
    }

    this.#logger = Logger.scope('HealthComponent');

    this.#maxHealth = maxHealth;
    this.#currentHealth = maxHealth;

    this.#logger.debug('HealthComponent created', {
      maxHealth: this.#maxHealth,
      currentHealth: this.#currentHealth,
    });
  }

  /**
   * Get maximum health value
   * @returns {number} Maximum health
   */
  getMaxHealth() {
    return this.#maxHealth;
  }

  /**
   * Set maximum health (also adjusts current health if needed)
   * @param {number} newMaxHealth - New maximum health value
   * @returns {void}
   */
  setMaxHealth(newMaxHealth) {
    if (typeof newMaxHealth !== 'number' || isNaN(newMaxHealth) || newMaxHealth <= 0) {
      throw new TypeError('newMaxHealth must be a positive number');
    }

    const _previousMaxHealth = this.#maxHealth;
    this.#maxHealth = newMaxHealth;

    // Adjust current health if it exceeds new maximum
    if (this.#currentHealth > this.#maxHealth) {
      this.#currentHealth = this.#maxHealth;
    }
  }

  /**
   * Get current health value
   * @returns {number} Current health
   */
  getCurrentHealth() {
    return this.#currentHealth;
  }

  /**
   * Set current health value (data-only update)
   * @param {number} newCurrentHealth - New current health value (must be 0 or positive, within max health)
   * @returns {void}
   */
  setCurrentHealth(newCurrentHealth) {
    if (typeof newCurrentHealth !== 'number' || isNaN(newCurrentHealth) || newCurrentHealth < 0) {
      throw new TypeError('newCurrentHealth must be a non-negative number');
    }
    if (newCurrentHealth > this.#maxHealth) {
      throw new RangeError('newCurrentHealth cannot exceed maximum health');
    }

    this.#currentHealth = newCurrentHealth;
  }

  /**
   * Get health as a percentage
   * @returns {number} Health percentage (0-100)
   */
  getHealthPercentage() {
    return (this.#currentHealth / this.#maxHealth) * 100;
  }

  /**
   * Check if entity is alive
   * @returns {boolean} True if health > 0
   */
  isAlive() {
    return this.#currentHealth > 0;
  }

  /**
   * Check if entity is dead
   * @returns {boolean} True if health <= 0
   */
  isDead() {
    return this.#currentHealth <= 0;
  }

  /**
   * Clean up the health component
   * @returns {void}
   */
  destroy() {
    this.#logger = null;
  }
}
