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
   * Private upgrade system reference
   * @private
   * @type {Object}
   */
  #upgradeSystem;

  /**
   * Private invincibility state tracking
   * @private
   * @type {Object}
   */
  #invincibility;

  /**
   * Private listener IDs for cleanup
   * @private
   * @type {Array}
   */
  #listenerIds;

  /**
   * Base health value (before upgrades)
   * @private
   * @type {number}
   */
  #baseHealth;

  /**
   * Create a new PlayerHealthSystem instance
   * @param {Object} player - The player entity with health component
   * @param {Object} [upgradeSystem] - The upgrade system for defense effects
   */
  constructor(player, upgradeSystem = null) {
    if (!player || !player.health) {
      throw new Error('PlayerHealthSystem requires a player entity with health component');
    }

    this.#logger = Logger.scope('PlayerHealthSystem');
    this.#eventBus = getEventBus();
    this.#player = player;
    this.#upgradeSystem = upgradeSystem;
    this.#listenerIds = [];

    // Store base health (before any upgrades)
    this.#baseHealth = player.health.getMaxHealth();

    this.#invincibility = {
      active: false,
      duration: 1000, // 1 second in milliseconds
      timer: null,
    };

    this.#setupEventListeners();

    // Apply initial health and shield upgrades if upgrade system is available
    if (this.#upgradeSystem) {
      this.#applyHealthUpgrades();
      this.#applyShieldUpgrades();
    }

    this.#logger.debug('PlayerHealthSystem initialized', {
      baseHealth: this.#baseHealth,
      playerHealth: player.health.getCurrentHealth(),
      maxHealth: player.health.getMaxHealth(),
      upgradeSystemAvailable: !!upgradeSystem,
    });
  }

  /**
   * Set up event listeners for player damage events
   * @private
   * @returns {void}
   */
  #setupEventListeners() {
    // Player damage events
    const damageListenerId = this.#eventBus.on(EventTypes.PLAYER_DAMAGED, this.#handlePlayerDamage, this);
    this.#listenerIds.push(damageListenerId);

    // Health upgrade events
    if (this.#upgradeSystem) {
      const upgradeListenerId = this.#eventBus.on(EventTypes.UPGRADE_PURCHASED, this.#handleUpgradePurchased, this);
      this.#listenerIds.push(upgradeListenerId);
    }
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

    // Check for mobility upgrade invulnerability frames (barrel roll)
    if (this.#player.isInvulnerable && this.#player.isInvulnerable()) {
      this.#logger.debug('Player damage blocked by invulnerability frames');
      return;
    }

    // Check for evasive maneuvers dodge chance
    if (this.#player.shouldDodgeDamage && this.#player.shouldDodgeDamage()) {
      this.#logger.debug('Player dodged damage with evasive maneuvers');
      return;
    }

    const { damage, source } = data;
    const currentHealth = this.#player.health.getCurrentHealth();

    if (currentHealth <= 0) {
      this.#logger.debug('Player damage ignored - already dead');
      return;
    }

    // Get damage reduction from upgrades
    const damageReduction = this.#upgradeSystem ? this.#upgradeSystem.getDamageReduction() : 0;

    // Apply damage with reduction and shield absorption
    const damageAmount = Math.max(0, damage || 1);
    const currentTime = Date.now();
    const damageResult = this.#player.health.takeDamage(damageAmount, damageReduction, currentTime);

    this.#logger.debug('Player took damage', {
      incomingDamage: damageAmount,
      actualDamage: damageResult.actualDamage,
      shieldDamage: damageResult.shieldDamage,
      healthDamage: damageResult.healthDamage,
      damageReduction,
      source,
      oldHealth: damageResult.previousHealth,
      newHealth: damageResult.currentHealth,
      oldShields: damageResult.previousShields,
      newShields: damageResult.currentShields,
      maxHealth: this.#player.health.getMaxHealth(),
      shieldBurst: damageResult.shieldBurst,
    });

    // Handle shield burst damage if shields were destroyed
    if (damageResult.shieldBurst && damageResult.shieldBurst.triggered) {
      this.#handleShieldBurst(damageResult.shieldBurst, source);
    }

    // Emit damage reduction event if applicable
    if (damageReduction > 0) {
      this.#eventBus.emit(EventTypes.DAMAGE_REDUCED, {
        incomingDamage: damageAmount,
        actualDamage: damageResult.actualDamage,
        damageReduction,
        damageBlocked: damageAmount - damageResult.actualDamage,
        source,
      });
    }

    // Emit health decreased event
    const healthEvent = makeHealthDecreasedEvent(
      damageResult.currentHealth, 
      this.#player.health.getMaxHealth(), 
      damageResult.actualDamage, 
      source
    );
    this.#eventBus.emit(healthEvent.type, healthEvent.data, healthEvent.priority);

    // Activate invincibility frames
    this.#activateInvincibility();

    // Check for death
    if (damageResult.wasKilled) {
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

    // Emit invincibility started event
    this.#eventBus.emit(EventTypes.INVINCIBILITY_STARTED, {
      duration: this.#invincibility.duration,
      player: this.#player,
    });

    this.#invincibility.timer = setTimeout(() => {
      this.#invincibility.active = false;
      this.#invincibility.timer = null;
      this.#logger.debug('Invincibility deactivated');

      // Emit invincibility ended event
      this.#eventBus.emit(EventTypes.INVINCIBILITY_ENDED, {
        player: this.#player,
      });
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
   * Handle upgrade purchase events
   * @private
   * @param {Object} data - Upgrade purchase event data
   * @returns {void}
   */
  #handleUpgradePurchased(data) {
    const { upgradeId, upgrade } = data;
    
    // Check if this is a defense-related upgrade
    if (upgrade.tree === 'defense') {
      if (upgrade.branch === 'hull' || upgrade.branch === 'armor') {
        this.#logger.info(`Health-related upgrade purchased: ${upgrade.name}`);
        this.#applyHealthUpgrades();
      } else if (upgrade.branch === 'shields') {
        this.#logger.info(`Shield-related upgrade purchased: ${upgrade.name}`);
        this.#applyShieldUpgrades();
      }
    }
  }

  /**
   * Apply current health upgrades from the upgrade system
   * @private
   * @returns {void}
   */
  #applyHealthUpgrades() {
    if (!this.#upgradeSystem) {
      return;
    }

    const currentHealth = this.#player.health.getCurrentHealth();
    const oldMaxHealth = this.#player.health.getMaxHealth();
    const newMaxHealth = this.#upgradeSystem.getTotalMaxHealth(this.#baseHealth);

    if (newMaxHealth !== oldMaxHealth) {
      // Update max health and heal to new maximum if this is an upgrade
      const isUpgrade = newMaxHealth > oldMaxHealth;
      this.#player.health.setMaxHealth(newMaxHealth, isUpgrade);

      this.#logger.debug('Health upgrades applied', {
        baseHealth: this.#baseHealth,
        oldMaxHealth,
        newMaxHealth,
        currentHealth: this.#player.health.getCurrentHealth(),
        healthBonus: this.#upgradeSystem.upgradeEffects.healthBonus,
        healedToMax: isUpgrade,
      });

      // Emit health upgrade event
      this.#eventBus.emit(EventTypes.HEALTH_UPGRADE_APPLIED, {
        baseHealth: this.#baseHealth,
        oldMaxHealth,
        newMaxHealth,
        currentHealth: this.#player.health.getCurrentHealth(),
        healthBonus: this.#upgradeSystem.upgradeEffects.healthBonus,
        damageReduction: this.#upgradeSystem.getDamageReduction(),
      });

      // Emit max health increased event
      this.#eventBus.emit(EventTypes.HEALTH_MAX_INCREASED, {
        oldMaxHealth,
        newMaxHealth,
        currentHealth: this.#player.health.getCurrentHealth(),
        healthPercent: this.#player.health.getHealthPercentage() / 100,
      });
    }
  }

  /**
   * Apply current shield upgrades from the upgrade system
   * @private
   * @returns {void}
   */
  #applyShieldUpgrades() {
    if (!this.#upgradeSystem) {
      return;
    }

    const upgradeEffects = this.#upgradeSystem.getUpgradeEffects();
    const shieldConfig = {
      capacity: upgradeEffects.shieldCapacity,
      regenRate: upgradeEffects.shieldRegenRate,
      regenDelay: upgradeEffects.shieldRegenDelay,
    };

    this.#player.health.setShieldConfig(shieldConfig);

    this.#logger.debug('Shield upgrades applied', {
      shieldCapacity: shieldConfig.capacity,
      regenRate: shieldConfig.regenRate,
      regenDelay: shieldConfig.regenDelay,
    });
  }

  /**
   * Handle shield burst when shields are destroyed
   * @private
   * @param {Object} shieldBurst - Shield burst data
   * @param {string} source - Damage source
   * @returns {void}
   */
  #handleShieldBurst(shieldBurst, source) {
    if (!this.#upgradeSystem) {
      return;
    }

    const upgradeEffects = this.#upgradeSystem.getUpgradeEffects();
    const burstDamage = upgradeEffects.shieldBurstDamage;
    const burstRadius = upgradeEffects.shieldBurstRadius;

    if (burstDamage > 0 && burstRadius > 0) {
      this.#logger.debug('Shield burst triggered', {
        damage: burstDamage,
        radius: burstRadius,
        playerPosition: { x: this.#player.x, y: this.#player.y },
      });

      // Emit shield burst event for other systems to handle damage
      this.#eventBus.emit(EventTypes.SHIELD_BURST, {
        x: this.#player.x,
        y: this.#player.y,
        damage: burstDamage,
        radius: burstRadius,
        source: 'shield_burst',
      });
    }
  }

  /**
   * Update shield regeneration (should be called regularly)
   * @param {number} deltaTime - Time delta in milliseconds
   * @returns {void}
   */
  update(deltaTime) {
    if (!this.#player.health.updateShieldRegeneration) {
      return;
    }

    const currentTime = Date.now();
    const regenResult = this.#player.health.updateShieldRegeneration(currentTime, deltaTime);

    if (regenResult && regenResult.amount > 0) {
      this.#logger.debug('Shields regenerating', {
        amount: regenResult.amount,
        current: regenResult.current,
        max: regenResult.max,
        isComplete: regenResult.isComplete,
      });

      // Emit shield regeneration event
      this.#eventBus.emit(EventTypes.SHIELD_REGENERATED, {
        amount: regenResult.amount,
        current: regenResult.current,
        max: regenResult.max,
        isComplete: regenResult.isComplete,
      });
    }
  }

  /**
   * Heal the player (for future power-up integration)
   * @param {number} healAmount - Amount to heal
   * @param {string} source - Source of healing
   * @returns {void}
   */
  heal(healAmount, source = 'unknown') {
    const healResult = this.#player.health.heal(healAmount);

    this.#logger.debug('Player healed', {
      healAmount,
      actualHealing: healResult.actualHealing,
      source,
      oldHealth: healResult.previousHealth,
      newHealth: healResult.currentHealth,
      maxHealth: healResult.maxHealth,
      wasFullyHealed: healResult.wasFullyHealed,
    });

    if (healResult.actualHealing > 0) {
      // Emit health increased event
      const healthEvent = makeHealthIncreasedEvent(
        healResult.currentHealth, 
        healResult.maxHealth, 
        healResult.actualHealing, 
        source
      );
      this.#eventBus.emit(healthEvent.type, healthEvent.data, healthEvent.priority);
    }
  }

  /**
   * Set the upgrade system reference (for delayed initialization)
   * @param {Object} upgradeSystem - The upgrade system instance
   * @returns {void}
   */
  setUpgradeSystem(upgradeSystem) {
    this.#upgradeSystem = upgradeSystem;
    
    // Set up upgrade event listener if not already done
    if (upgradeSystem) {
      const upgradeListenerId = this.#eventBus.on(EventTypes.UPGRADE_PURCHASED, this.#handleUpgradePurchased, this);
      this.#listenerIds.push(upgradeListenerId);
      
      // Apply existing upgrades
      this.#applyHealthUpgrades();
    }
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
    // Prevent multiple calls
    if (!this.#logger) {
      return;
    }

    // Remove event listeners
    if (this.#listenerIds && this.#eventBus) {
      this.#listenerIds.forEach(listenerId => {
        this.#eventBus.off(listenerId);
      });
    }

    // Clear invincibility timer
    if (this.#invincibility.timer) {
      clearTimeout(this.#invincibility.timer);
      this.#invincibility.timer = null;
    }

    this.#logger.debug('PlayerHealthSystem destroyed');

    // Clear references
    this.#player = null;
    this.#eventBus = null;
    this.#upgradeSystem = null;
    this.#logger = null;
    this.#listenerIds = null;
  }
}
