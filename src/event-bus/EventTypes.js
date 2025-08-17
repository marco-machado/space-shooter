/**
 * Event priority levels for the event scopeName
 * Lower numbers indicate higher priority (0 = highest)
 */
export const EventPriority = Object.freeze({
  CRITICAL: 0, // Immediate processing (collision, destruction)
  HIGH: 25, // High priority (input, weapon firing)
  NORMAL: 50, // Standard priority (movement, state changes)
  LOW: 75, // Low priority (effects, UI updates)
  BACKGROUND: 100, // Background tasks (logging, analytics)
});

/**
 * Core game event definitions with type contracts
 * Comprehensive event taxonomy for the Space Shooter game
 */
export const EventTypes = {
  ACHIEVEMENT_UNLOCKED: 'achievement-unlocked',
  AFTERBURNER_ACTIVATED: 'afterburner-activated',
  AFTERBURNER_DEACTIVATED: 'afterburner-deactivated',
  BARREL_ROLL_ACTIVATED: 'barrel-roll-activated',
  BARREL_ROLL_DEACTIVATED: 'barrel-roll-deactivated',
  DAMAGE_REDUCED: 'damage-reduced',
  ENEMY_DAMAGED: 'enemy-damage',
  ENEMY_DESTROYED: 'enemy-destroyed',
  EXTRA_LIFE: 'extra-life', // Remove
  GAME_CYCLE: 'game-cycle',
  GAME_ERROR: 'game-error',
  GAME_OVER: 'game-over',
  GAME_PAUSED: 'game-paused',
  GAME_PAUSE_TOGGLE: 'game-pause-toggle',
  GAME_READY: 'game-ready',
  GAME_RESTARTED: 'game-restarted',
  GAME_RESUMED: 'game-resumed',
  GAME_STARTED: 'game-started',
  HEALTH_DECREASED: 'health-decreased',
  HEALTH_INCREASED: 'health-increased',
  HEALTH_MAX_INCREASED: 'health-max-increased',
  HEALTH_UPGRADE_APPLIED: 'health-upgrade-applied',
  INVINCIBILITY_ENDED: 'invincibility-ended',
  INVINCIBILITY_STARTED: 'invincibility-started',
  LEVEL_CHANGED: 'level-changed',
  LEVEL_COMPLETED: 'level-completed',
  LEVEL_STARTED: 'level-started',
  LEVEL_UP: 'level-up',
  PLAYER_DAMAGED: 'player-damaged',
  PLAYER_DESTROYED: 'player-death',
  PLAYER_DODGED: 'player-dodged',
  POINTS_EARNED: 'points-earned',
  POINTS_SPENT: 'points-spent',
  POWERUP_ACTIVATED: 'powerup-activated',
  POWERUP_COLLECTED: 'powerup-collected',
  POWERUP_EXPIRED: 'powerup-expired',
  SCORE_UPDATED: 'score-updated',
  SHIELD_BURST: 'shield-burst',
  SHIELD_REGENERATED: 'shield-regenerated',
  UPGRADE_PURCHASED: 'upgrade-purchased',
  UPGRADE_REFUNDED: 'upgrade-refunded',
  UPGRADE_TREE_CLOSED: 'upgrade-tree-closed',
  UPGRADE_TREE_OPENED: 'upgrade-tree-opened',
  WEAPON_COOLING_COMPLETE: 'weapon-cooling-complete',
  WEAPON_FIRED: 'weapon-fired',
  WEAPON_HIT: 'weapon-hit',
  WEAPON_OVERHEATED: 'weapon-overheated',
  WEAPON_SWITCHED: 'weapon-switched',
  WEAPON_UNLOCKED: 'weapon-unlocked',
  WINDOW_BLUR: 'window-blur',
  WINDOW_FOCUS: 'window-focus',
  WINDOW_HIDDEN: 'window-hidden',
  WINDOW_RESIZE: 'window-resize',
  WINDOW_VISIBLE: 'window-visible',
  XP_GAINED: 'xp-gained',
};

/**
 * Get category for event type
 * @param {string} eventType - Event type to categorize
 * @returns {string} Event category
 */
export function getEventCategory(eventType) {
  if (!eventType || typeof eventType !== 'string') {
    return 'unknown';
  }

  // Removed for simplicity
  return 'unknown';
}

/**
 * Get default priority for event type
 * @param {string} eventType - Event type
 * @returns {number} Default priority level
 */
export function getDefaultPriority(eventType) {
  if (!eventType || typeof eventType !== 'string') {
    return EventPriority.NORMAL;
  }

  // Removed for simplicity
  return EventPriority.NORMAL;
}
