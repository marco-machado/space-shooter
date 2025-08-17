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
  // Enemy Events
  ENEMY_DAMAGED: 'enemy-damage',
  ENEMY_DESTROYED: 'enemy-destroyed',

  SCORE_UPDATED: 'score-updated',

  HEALTH_MAX_INCREASED: 'health-max-increased', // Will be used with progression system later
  HEALTH_INCREASED: 'health-increased', // Will be used by power-ups later
  HEALTH_DECREASED: 'health-decreased', // When damage received

  PLAYER_DAMAGED: 'player-damaged',
  PLAYER_DESTROYED: 'player-death',

  /** UNCONFIRMED EVENTS **/

  // Input Events
  INPUT_ACTION: 'input-action',
  INPUT_ACTION_STOP: 'input-action-stop',
  INPUT_CHARACTER: 'input-character',
  INPUT_GAMEPAD_AXIS: 'input-gamepad-axis',
  INPUT_GAMEPAD_BUTTON: 'input-gamepad-button',
  INPUT_GAMEPAD_BUTTON_DOWN: 'input-gamepad-button-down',
  INPUT_GAMEPAD_BUTTON_UP: 'input-gamepad-button-up',
  INPUT_GAMEPAD_CONNECTED: 'input-gamepad-connected',
  INPUT_GAMEPAD_DISCONNECTED: 'input-gamepad-disconnected',
  INPUT_GESTURE_PINCH: 'input-gesture-pinch',
  INPUT_GESTURE_SWIPE: 'input-gesture-swipe',
  INPUT_GESTURE_TAP: 'input-gesture-tap',
  INPUT_KEY_COMBINATION: 'input-key-combination',
  INPUT_KEY_DOWN: 'input-key-down',
  INPUT_KEY_LONG_PRESS: 'input-key-long-press',
  INPUT_KEY_PRESS: 'input-key-press',
  INPUT_KEY_SEQUENCE: 'input-key-sequence',
  INPUT_KEY_UP: 'input-key-up',
  INPUT_LISTENER_MOVE: 'input-listener-move',
  INPUT_MOUSE_DOUBLE_CLICK: 'input-mouse-double-click',
  INPUT_MOUSE_DOWN: 'input-mouse-down',
  INPUT_MOUSE_DRAG: 'input-mouse-drag',
  INPUT_MOUSE_LONG_PRESS: 'input-mouse-long-press',
  INPUT_MOUSE_MOVE: 'input-mouse-move',
  INPUT_MOUSE_UP: 'input-mouse-up',
  INPUT_MOUSE_WHEEL: 'input-mouse-wheel',
  INPUT_PROCESSED: 'input-processed',
  INPUT_RECORDING_STOPPED: 'input-recording-stopped',
  INPUT_REPLAY_FINISHED: 'input-replay-finished',
  INPUT_SET_RECORDING: 'input-set-recording',
  INPUT_SIMULATE: 'input-simulate',
  INPUT_START_REPLAY: 'input-start-replay',
  INPUT_STATE_CHANGED: 'input-state-changed',
  INPUT_TOUCH_CANCEL: 'input-touch-cancel',
  INPUT_TOUCH_END: 'input-touch-end',
  INPUT_TOUCH_MOVE: 'input-touch-move',
  INPUT_TOUCH_START: 'input-touch-start',

  // BaseEntity Events
  ENTITY_ACTIVATED: 'entity-activated',
  ENTITY_COMPONENT_ADDED: 'entity-component-added',
  ENTITY_COMPONENT_CHANGED: 'entity-component-changed',
  ENTITY_COMPONENT_REMOVED: 'entity-component-removed',
  ENTITY_CREATED: 'entity-created',
  ENTITY_DEACTIVATED: 'entity-deactivated',
  ENTITY_DESTROYED: 'entity-destroyed',
  ENTITY_MOVED: 'entity-moved',
  ENTITY_DAMAGE: 'entity-damage',
  ENTITY_HEAL: 'entity-heal',

  // Game Logic Events
  POWERUP_ACTIVATED: 'powerup-activated',
  POWERUP_COLLECTED: 'powerup-collected',

  POWERUP_EXPIRED: 'powerup-expired',

  WEAPON_CHARGE_STARTED: 'weapon-charge-started',
  WEAPON_CHARGE_STOPPED: 'weapon-charge-stopped',
  WEAPON_COOLDOWN_COMPLETE: 'weapon-cooldown-complete',
  WEAPON_FIRE_REQUESTED: 'weapon-fire-requested',
  WEAPON_FIRED: 'weapon-fired',
  WEAPON_HIT: 'weapon-hit',
  WEAPON_SWITCHED: 'weapon-switched',

  // Game State Events
  GAME_CYCLE: 'game-cycle',
  GAME_ERROR: 'game-error',
  GAME_OVER: 'game-over',
  GAME_PAUSED: 'game-paused',
  GAME_PAUSE_TOGGLE: 'game-pause-toggle',
  GAME_READY: 'game-ready',
  GAME_RESTARTED: 'game-restarted',
  GAME_RESUMED: 'game-resumed',
  GAME_STARTED: 'game-started',

  WINDOW_BLUR: 'window-blur',
  WINDOW_FOCUS: 'window-focus',
  WINDOW_HIDDEN: 'window-hidden',
  WINDOW_RESIZE: 'window-resize',
  WINDOW_VISIBLE: 'window-visible',

  // Player Progress Events
  ACHIEVEMENT_UNLOCKED: 'achievement-unlocked',

  CONFIG_CHANGED: 'config-changed',

  DIFFICULTY_CHANGED: 'difficulty-changed',

  EXTRA_LIFE: 'extra-life',

  INVINCIBILITY_STARTED: 'invincibility-started',
  INVINCIBILITY_ENDED: 'invincibility-ended',

  LEVEL_CHANGED: 'level-changed',
  LEVEL_COMPLETED: 'level-completed',
  LEVEL_STARTED: 'level-started',
  LEVEL_UP: 'level-up',

  WEAPON_UNLOCKED: 'weapon-unlocked',
};

/**
 * Event categories for filtering and organization
 */
export const EventCategories = {
  INPUT: 'input',
  ENTITY: 'entity',
  GAME_LOGIC: 'game-logic',
  GAME_STATE: 'game-state',
  RENDER: 'render',
  AUDIO: 'audio',
  ASSET: 'asset',
  SCENE: 'scene',
  SYSTEM: 'scopeName',
  ADAPTER: 'adapter',
  DEBUG: 'debug',
  EVENT_SYSTEM: 'event-scopeName',
};

/**
 * Get category for event type
 * @param {string} eventType - Event type to categorize
 * @returns {string} Event category
 */
export function getEventCategory(eventType) {
  if (!eventType || typeof eventType !== 'string') {
    return 'unknown'; // Default fallback for invalid inputs
  }
  if (eventType.startsWith('input-') || eventType.startsWith('player-input')) {
    return EventCategories.INPUT;
  }
  if (eventType.startsWith('entity-')) {
    return EventCategories.ENTITY;
  }
  if (
    eventType.startsWith('weapon-') ||
    eventType.startsWith('collision-') ||
    eventType.startsWith('damage-') ||
    eventType.startsWith('health-') ||
    eventType.startsWith('score-') ||
    eventType.startsWith('pickup-') ||
    eventType.startsWith('powerup-')
  ) {
    return EventCategories.GAME_LOGIC;
  }
  if (
    eventType.startsWith('scopeName-') ||
    eventType.startsWith('frame-') ||
    eventType.startsWith('game-loop-') ||
    eventType.startsWith('world-')
  ) {
    return EventCategories.SYSTEM;
  }
  if (
    eventType.startsWith('game-') ||
    eventType.startsWith('level-') ||
    eventType.startsWith('difficulty-') ||
    eventType.startsWith('config-')
  ) {
    return EventCategories.GAME_STATE;
  }
  if (eventType.startsWith('render-')) {
    return EventCategories.RENDER;
  }
  if (eventType.startsWith('audio-')) {
    return EventCategories.AUDIO;
  }
  if (eventType.startsWith('asset-')) {
    return EventCategories.ASSET;
  }
  if (eventType.startsWith('scene-')) {
    return EventCategories.SCENE;
  }
  if (eventType.startsWith('adapter-')) {
    return EventCategories.ADAPTER;
  }
  if (
    eventType.startsWith('debug-') ||
    eventType.startsWith('performance-') ||
    eventType.startsWith('memory-')
  ) {
    return EventCategories.DEBUG;
  }
  if (eventType.startsWith('event-')) {
    return EventCategories.EVENT_SYSTEM;
  }

  return 'unknown';
}

/**
 * Get default priority for event type
 * @param {string} eventType - Event type
 * @returns {number} Default priority level
 */
export function getDefaultPriority(eventType) {
  if (!eventType || typeof eventType !== 'string') {
    return EventPriority.NORMAL; // Default fallback
  }

  // Keyword-based priorities that override category-based logic
  if (
    eventType.includes('collision') ||
    eventType.includes('damage') ||
    eventType.includes('error')
  ) {
    return EventPriority.CRITICAL;
  }

  const category = getEventCategory(eventType);

  switch (category) {
    case EventCategories.INPUT:
      return EventPriority.HIGH;
    case EventCategories.GAME_LOGIC:
      return EventPriority.HIGH;
    case EventCategories.ENTITY:
      if (eventType === EventTypes.ENTITY_DESTROYED) {
        return EventPriority.CRITICAL;
      }
      return EventPriority.NORMAL;
    case EventCategories.RENDER:
      return EventPriority.NORMAL;
    case EventCategories.AUDIO:
      return EventPriority.NORMAL;
    case EventCategories.SYSTEM:
      if (eventType.includes('error')) {
        return EventPriority.CRITICAL;
      }
      return EventPriority.LOW;
    case EventCategories.DEBUG:
      return EventPriority.BACKGROUND;
    default:
      return EventPriority.NORMAL;
  }
}
