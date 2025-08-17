import { EventPriority, EventTypes } from '@/event-bus/EventTypes.js';

/**
 * Creates a health decreased event object.
 * @param {number} currentHealth - Current health value
 * @param {number} maxHealth - Maximum health value
 * @param {number} damageAmount - Amount of damage taken
 * @param {string} damageSource - Source of damage ('collision', 'projectile', etc.)
 * @returns {Object} Event object with type, data, and priority
 */
export function makeHealthDecreasedEvent(currentHealth, maxHealth, damageAmount, damageSource) {
  return {
    type: EventTypes.HEALTH_DECREASED,
    data: {
      healthPercent: currentHealth / maxHealth,
      currentHealth,
      maxHealth,
      damageAmount,
      damageSource,
    },
    priority: EventPriority.HIGH,
  };
}

/**
 * Creates a health increased event object.
 * @param {number} currentHealth - Current health value
 * @param {number} maxHealth - Maximum health value
 * @param {number} healAmount - Amount healed
 * @param {string} healSource - Source of healing ('powerup', 'regeneration', etc.)
 * @returns {Object} Event object with type, data, and priority
 */
export function makeHealthIncreasedEvent(currentHealth, maxHealth, healAmount, healSource) {
  return {
    type: EventTypes.HEALTH_INCREASED,
    data: {
      healthPercent: currentHealth / maxHealth,
      currentHealth,
      maxHealth,
      healAmount,
      healSource,
    },
    priority: EventPriority.HIGH,
  };
}

/**
 * Creates a player death event object.
 * @param {Object} player - The player entity
 * @param {string} cause - Cause of death ('damage', 'collision', etc.)
 * @returns {Object} Event object with type, data, and priority
 */
export function makePlayerDeathEvent(player, cause) {
  return {
    type: EventTypes.PLAYER_DESTROYED,
    data: {
      player,
      cause,
    },
    priority: EventPriority.CRITICAL,
  };
}
