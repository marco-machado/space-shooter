import { EventPriority, EventTypes } from '@/event-bus/EventTypes.js';

/**
 * Creates an enemy damaged event object.
 * @param {Object} enemy - The enemy entity that was damaged
 * @param {number} damage - The amount of damage dealt to the enemy
 * @returns {Object} Event object with type, data, and priority
 */
export function makeEnemyDamagedEvent(enemy, damage) {
  return {
    type: EventTypes.ENEMY_DAMAGED,
    data: {
      enemy,
      damage,
    },
    priority: EventPriority.CRITICAL,
  };
}

/**
 * Creates an enemy destroyed event object.
 * @param {Object} enemy - The enemy entity that was destroyed
 * @returns {Object} Event object with type, data, and priority
 */
export function makeEnemyDestroyedEvent(enemy) {
  return {
    type: EventTypes.ENEMY_DESTROYED,
    data: {
      enemy,
    },
    priority: EventPriority.CRITICAL,
  };
}
