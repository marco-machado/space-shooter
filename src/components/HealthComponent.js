import Component from './Component.js';
import Logger from '../core/Logger.js';

/**
 * Health Component
 * Manages entity health, damage, and invulnerability
 */
class HealthComponent extends Component {
  constructor(maxHealth = 100, currentHealth = null) {
    super();

    this.maxHealth = Math.max(1, maxHealth);
    this.currentHealth = currentHealth !== null ? currentHealth : this.maxHealth;
    this.invulnerable = false;
    this.invulnerabilityDuration = 0;
    this.lastDamageTime = 0;

    // Damage mitigation
    this.armor = 0; // Flat damage reduction
    this.resistance = 0; // Percentage damage reduction (0-1)

    // Regeneration
    this.regeneration = 0; // Health per second
    this.lastRegenTime = 0;

    Logger.debug(`HealthComponent created: ${this.maxHealth} max health`);
  }

  /**
   * Initialize health component with specific values
   * @param {Object} data - Health configuration
   */
  init(data = {}) {
    super.init(data);

    this.maxHealth = Math.max(1, data.maxHealth || this.maxHealth);
    this.currentHealth = data.currentHealth !== undefined ? data.currentHealth : this.maxHealth;
    this.armor = Math.max(0, data.armor || 0);
    this.resistance = Math.max(0, Math.min(1, data.resistance || 0));
    this.regeneration = Math.max(0, data.regeneration || 0);
    this.invulnerable = data.invulnerable || false;

    // Clamp current health to valid range
    this.currentHealth = Math.max(0, Math.min(this.currentHealth, this.maxHealth));
  }

  /**
   * Apply damage to the entity
   * @param {number} amount - Damage amount
   * @param {string} damageType - Type of damage (for future use)
   * @returns {number} Actual damage dealt
   */
  takeDamage(amount, damageType = 'generic') {
    if (this.invulnerable || this.currentHealth <= 0 || amount <= 0) {
      return 0;
    }

    // Calculate actual damage after mitigation
    let actualDamage = Math.max(0, amount - this.armor);
    actualDamage = actualDamage * (1 - this.resistance);
    actualDamage = Math.floor(actualDamage);

    // Apply damage
    const previousHealth = this.currentHealth;
    this.currentHealth = Math.max(0, this.currentHealth - actualDamage);
    this.lastDamageTime = Date.now();

    Logger.debug(
      `HealthComponent damage: ${amount} -> ${actualDamage} (${previousHealth} -> ${this.currentHealth})`
    );

    // Emit damage event if entity has event system
    if (this.entity && this.entity.emit) {
      this.entity.emit('damage', {
        rawDamage: amount,
        actualDamage,
        damageType,
        remainingHealth: this.currentHealth,
        isDead: this.currentHealth <= 0,
      });
    }

    return actualDamage;
  }

  /**
   * Heal the entity
   * @param {number} amount - Heal amount
   * @returns {number} Actual healing done
   */
  heal(amount) {
    if (this.currentHealth >= this.maxHealth || amount <= 0) {
      return 0;
    }

    const previousHealth = this.currentHealth;
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    const actualHealing = this.currentHealth - previousHealth;

    Logger.debug(
      `HealthComponent heal: ${amount} -> ${actualHealing} (${previousHealth} -> ${this.currentHealth})`
    );

    // Emit heal event if entity has event system
    if (this.entity && this.entity.emit) {
      this.entity.emit('heal', {
        healAmount: actualHealing,
        currentHealth: this.currentHealth,
        maxHealth: this.maxHealth,
      });
    }

    return actualHealing;
  }

  /**
   * Set invulnerability for a duration
   * @param {number} duration - Duration in milliseconds
   */
  setInvulnerable(duration = 0) {
    this.invulnerable = true;
    this.invulnerabilityDuration = duration;

    if (duration > 0) {
      setTimeout(() => {
        this.invulnerable = false;
        this.invulnerabilityDuration = 0;
      }, duration);
    }

    Logger.debug(`HealthComponent invulnerability: ${duration}ms`);
  }

  /**
   * Remove invulnerability
   */
  clearInvulnerability() {
    this.invulnerable = false;
    this.invulnerabilityDuration = 0;
  }

  /**
   * Update health component (handle regeneration)
   * @param {number} delta - Time delta in milliseconds
   */
  update(_delta) {
    // Handle regeneration
    if (this.regeneration > 0 && this.currentHealth < this.maxHealth) {
      const now = Date.now();
      const timeSinceLastRegen = now - this.lastRegenTime;

      if (timeSinceLastRegen >= 1000) {
        // Regenerate every second
        const regenAmount = this.regeneration * (timeSinceLastRegen / 1000);
        this.heal(regenAmount);
        this.lastRegenTime = now;
      }
    }
  }

  /**
   * Check if the entity is alive
   * @returns {boolean} True if alive
   */
  isAlive() {
    return this.currentHealth > 0;
  }

  /**
   * Check if the entity is at full health
   * @returns {boolean} True if at full health
   */
  isFullHealth() {
    return this.currentHealth >= this.maxHealth;
  }

  /**
   * Get health as a percentage
   * @returns {number} Health percentage (0-1)
   */
  getHealthPercentage() {
    return this.maxHealth > 0 ? this.currentHealth / this.maxHealth : 0;
  }

  /**
   * Serialize health component data
   * @returns {Object} Serializable data
   */
  serialize() {
    return {
      ...super.serialize(),
      maxHealth: this.maxHealth,
      currentHealth: this.currentHealth,
      armor: this.armor,
      resistance: this.resistance,
      regeneration: this.regeneration,
      invulnerable: this.invulnerable,
    };
  }

  /**
   * Deserialize health component data
   * @param {Object} data - Saved data
   */
  deserialize(data) {
    super.deserialize(data);
    this.init(data);
  }

  /**
   * Validate health component data
   * @returns {boolean} True if valid
   */
  validate() {
    return (
      this.maxHealth > 0 &&
      this.currentHealth >= 0 &&
      this.currentHealth <= this.maxHealth &&
      this.armor >= 0 &&
      this.resistance >= 0 &&
      this.resistance <= 1 &&
      this.regeneration >= 0
    );
  }
}

export default HealthComponent;
