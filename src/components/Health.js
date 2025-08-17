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
   * Private current shield value
   * @private
   * @type {number}
   */
  #currentShields;

  /**
   * Private maximum shield value
   * @private
   * @type {number}
   */
  #maxShields;

  /**
   * Private shield regeneration state
   * @private
   * @type {Object}
   */
  #shieldRegen;

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
    
    // Initialize shield system
    this.#maxShields = 0;
    this.#currentShields = 0;
    this.#shieldRegen = {
      isRegenerating: false,
      lastDamageTime: 0,
      regenDelay: 3000, // Default 3 seconds
      regenRate: 10, // Default 10 shields per second
    };

    this.#logger.debug('HealthComponent created', {
      maxHealth: this.#maxHealth,
      currentHealth: this.#currentHealth,
      maxShields: this.#maxShields,
      currentShields: this.#currentShields,
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
   * @param {boolean} [healToNew=false] - Whether to heal to new max health
   * @returns {void}
   */
  setMaxHealth(newMaxHealth, healToNew = false) {
    if (typeof newMaxHealth !== 'number' || isNaN(newMaxHealth) || newMaxHealth <= 0) {
      throw new TypeError('newMaxHealth must be a positive number');
    }

    const previousMaxHealth = this.#maxHealth;
    this.#maxHealth = newMaxHealth;

    // If healToNew is true, set current health to new maximum
    if (healToNew) {
      this.#currentHealth = this.#maxHealth;
    } else {
      // Adjust current health if it exceeds new maximum
      if (this.#currentHealth > this.#maxHealth) {
        this.#currentHealth = this.#maxHealth;
      }
    }

    this.#logger.debug('Max health changed', {
      previousMaxHealth,
      newMaxHealth: this.#maxHealth,
      currentHealth: this.#currentHealth,
      healToNew,
    });
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
   * Calculate actual damage taken after any damage reduction
   * @param {number} incomingDamage - Raw damage amount
   * @param {number} [damageReduction=0] - Damage reduction percentage (0-100)
   * @returns {number} Actual damage to be applied
   */
  calculateDamageAfterReduction(incomingDamage, damageReduction = 0) {
    if (typeof incomingDamage !== 'number' || isNaN(incomingDamage) || incomingDamage < 0) {
      throw new TypeError('incomingDamage must be a non-negative number');
    }
    if (typeof damageReduction !== 'number' || isNaN(damageReduction) || damageReduction < 0 || damageReduction > 100) {
      throw new TypeError('damageReduction must be a number between 0 and 100');
    }

    const reductionMultiplier = 1 - (damageReduction / 100);
    const actualDamage = Math.max(0, incomingDamage * reductionMultiplier);
    
    this.#logger.debug('Damage reduction calculated', {
      incomingDamage,
      damageReduction,
      actualDamage,
      reductionMultiplier,
    });

    return actualDamage;
  }

  /**
   * Apply damage with optional damage reduction
   * @param {number} damage - Damage amount to apply
   * @param {number} [damageReduction=0] - Damage reduction percentage (0-100)
   * @returns {Object} Damage application result
   */
  takeDamage(damage, damageReduction = 0) {
    const actualDamage = this.calculateDamageAfterReduction(damage, damageReduction);
    const previousHealth = this.#currentHealth;
    
    this.#currentHealth = Math.max(0, this.#currentHealth - actualDamage);
    
    const healthLost = previousHealth - this.#currentHealth;
    const wasDead = previousHealth <= 0;
    const isDead = this.#currentHealth <= 0;
    
    this.#logger.debug('Damage applied', {
      incomingDamage: damage,
      actualDamage,
      damageReduction,
      previousHealth,
      currentHealth: this.#currentHealth,
      healthLost,
      wasDead,
      isDead,
    });

    return {
      incomingDamage: damage,
      actualDamage,
      damageReduction,
      healthLost,
      previousHealth,
      currentHealth: this.#currentHealth,
      wasDead,
      isDead,
      wasKilled: !wasDead && isDead,
    };
  }

  /**
   * Heal the entity by a specified amount
   * @param {number} healAmount - Amount to heal
   * @returns {Object} Healing result
   */
  heal(healAmount) {
    if (typeof healAmount !== 'number' || isNaN(healAmount) || healAmount < 0) {
      throw new TypeError('healAmount must be a non-negative number');
    }

    const previousHealth = this.#currentHealth;
    this.#currentHealth = Math.min(this.#maxHealth, this.#currentHealth + healAmount);
    const actualHealing = this.#currentHealth - previousHealth;

    this.#logger.debug('Healing applied', {
      healAmount,
      actualHealing,
      previousHealth,
      currentHealth: this.#currentHealth,
      maxHealth: this.#maxHealth,
    });

    return {
      healAmount,
      actualHealing,
      previousHealth,
      currentHealth: this.#currentHealth,
      maxHealth: this.#maxHealth,
      wasFullyHealed: this.#currentHealth === this.#maxHealth,
    };
  }

  /**
   * Set shield configuration from upgrades
   * @param {Object} shieldConfig - Shield configuration
   * @param {number} shieldConfig.capacity - Maximum shield capacity
   * @param {number} shieldConfig.regenRate - Shields regenerated per second
   * @param {number} shieldConfig.regenDelay - Delay in milliseconds before regeneration starts
   * @returns {void}
   */
  setShieldConfig(shieldConfig) {
    const previousMaxShields = this.#maxShields;
    this.#maxShields = shieldConfig.capacity || 0;
    this.#shieldRegen.regenRate = shieldConfig.regenRate || 10;
    this.#shieldRegen.regenDelay = shieldConfig.regenDelay || 3000;
    
    // If shields increased, fill to new max
    if (this.#maxShields > previousMaxShields) {
      this.#currentShields = this.#maxShields;
    } else if (this.#currentShields > this.#maxShields) {
      this.#currentShields = this.#maxShields;
    }
    
    this.#logger.debug('Shield configuration updated', {
      previousMaxShields,
      maxShields: this.#maxShields,
      currentShields: this.#currentShields,
      regenRate: this.#shieldRegen.regenRate,
      regenDelay: this.#shieldRegen.regenDelay,
    });
  }

  /**
   * Get current shield status
   * @returns {Object} Shield status
   */
  getShieldStatus() {
    return {
      current: this.#currentShields,
      max: this.#maxShields,
      percentage: this.#maxShields > 0 ? (this.#currentShields / this.#maxShields) * 100 : 0,
      isRegenerating: this.#shieldRegen.isRegenerating,
      regenRate: this.#shieldRegen.regenRate,
      regenDelay: this.#shieldRegen.regenDelay,
    };
  }

  /**
   * Update shield regeneration system
   * @param {number} currentTime - Current time in milliseconds
   * @param {number} deltaTime - Time delta in milliseconds
   * @returns {Object|null} Regeneration result or null if not regenerating
   */
  updateShieldRegeneration(currentTime, deltaTime) {
    if (this.#maxShields <= 0 || this.#currentShields >= this.#maxShields) {
      this.#shieldRegen.isRegenerating = false;
      return null;
    }
    
    const timeSinceLastDamage = currentTime - this.#shieldRegen.lastDamageTime;
    
    if (timeSinceLastDamage >= this.#shieldRegen.regenDelay) {
      this.#shieldRegen.isRegenerating = true;
      
      const regenAmount = (this.#shieldRegen.regenRate * deltaTime) / 1000;
      const previousShields = this.#currentShields;
      this.#currentShields = Math.min(this.#maxShields, this.#currentShields + regenAmount);
      const actualRegen = this.#currentShields - previousShields;
      
      if (actualRegen > 0) {
        return {
          amount: actualRegen,
          current: this.#currentShields,
          max: this.#maxShields,
          isComplete: this.#currentShields >= this.#maxShields,
        };
      }
    } else {
      this.#shieldRegen.isRegenerating = false;
    }
    
    return null;
  }

  /**
   * Apply damage with shield absorption and optional damage reduction
   * @param {number} damage - Damage amount to apply
   * @param {number} [damageReduction=0] - Damage reduction percentage (0-100)
   * @param {number} [currentTime=Date.now()] - Current time for shield regeneration tracking
   * @returns {Object} Damage application result including shield information
   */
  takeDamage(damage, damageReduction = 0, currentTime = Date.now()) {
    const actualDamage = this.calculateDamageAfterReduction(damage, damageReduction);
    
    // Store state before damage
    const previousHealth = this.#currentHealth;
    const previousShields = this.#currentShields;
    const hadShields = this.#currentShields > 0;
    let shieldBurst = null;
    
    // Update last damage time for shield regeneration
    this.#shieldRegen.lastDamageTime = currentTime;
    this.#shieldRegen.isRegenerating = false;
    
    let remainingDamage = actualDamage;
    let shieldDamage = 0;
    let healthDamage = 0;
    
    // Apply damage to shields first
    if (this.#currentShields > 0 && remainingDamage > 0) {
      shieldDamage = Math.min(this.#currentShields, remainingDamage);
      this.#currentShields -= shieldDamage;
      remainingDamage -= shieldDamage;
      
      // Check for shield burst (when shields break)
      if (hadShields && this.#currentShields <= 0 && this.#maxShields > 0) {
        shieldBurst = {
          triggered: true,
          previousShields,
          burstDamage: 0, // Will be set by caller based on upgrades
          burstRadius: 0, // Will be set by caller based on upgrades
        };
      }
    }
    
    // Apply remaining damage to health
    if (remainingDamage > 0) {
      healthDamage = remainingDamage;
      this.#currentHealth = Math.max(0, this.#currentHealth - healthDamage);
    }
    
    const wasDead = previousHealth <= 0;
    const isDead = this.#currentHealth <= 0;
    
    this.#logger.debug('Damage applied with shields', {
      incomingDamage: damage,
      actualDamage,
      damageReduction,
      shieldDamage,
      healthDamage,
      previousHealth,
      currentHealth: this.#currentHealth,
      previousShields,
      currentShields: this.#currentShields,
      shieldBurst,
      wasDead,
      isDead,
    });

    return {
      incomingDamage: damage,
      actualDamage,
      damageReduction,
      shieldDamage,
      healthDamage,
      previousHealth,
      currentHealth: this.#currentHealth,
      previousShields,
      currentShields: this.#currentShields,
      shieldBurst,
      wasDead,
      isDead,
      wasKilled: !wasDead && isDead,
      shieldsDestroyed: hadShields && this.#currentShields <= 0,
    };
  }

  /**
   * Clean up the health component
   * @returns {void}
   */
  destroy() {
    this.#logger = null;
  }
}
