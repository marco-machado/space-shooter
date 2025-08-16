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
  PLAYER_INPUT: 'player-input',

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
  ENTITY_DEATH: 'entity-death',

  // Game Logic Events
  COLLISION_CONTINUED: 'collision-continued',
  COLLISION_DETECTED: 'collision-detected',
  COLLISION_ENDED: 'collision-ended',
  COLLISION_STARTED: 'collision-started',

  DAMAGE_DEALT: 'damage-dealt',
  DAMAGE_RECEIVED: 'damage-received',

  // Enemy Events
  ENEMY_DAMAGED: 'enemy-damage',
  ENEMY_DESTROYED: 'enemy-destroyed',

  HEALTH_CHANGED: 'health-changed',
  HEALTH_DEPLETED: 'health-depleted',

  PICKUP_COLLECTED: 'pickup-collected',

  PLAYER_DAMAGE: 'player-damage',
  PLAYER_DEATH: 'player-death',

  POWERUP_ACTIVATED: 'powerup-activated',
  POWERUP_COLLECTED: 'powerup-collected',
  POWERUP_EXPIRED: 'powerup-expired',

  PROJECTILE_CREATED: 'projectile-created',
  PROJECTILE_DESTROYED: 'projectile-destroyed',

  SCORE_CHANGED: 'score-changed',
  SCORE_MULTIPLIER_CHANGED: 'score-multiplier-changed',

  WAVE_COMPLETE: 'wave-complete',
  WAVE_START: 'wave-start',

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

  LEVEL_CHANGED: 'level-changed',
  LEVEL_COMPLETED: 'level-completed',
  LEVEL_STARTED: 'level-started',
  LEVEL_UP: 'level-up',

  WEAPON_UNLOCKED: 'weapon-unlocked',

  // Render Events
  RENDER_ANIMATION_COMPLETE: 'render-animation-complete',
  RENDER_ANIMATION_START: 'render-animation-start',
  RENDER_ANIMATION_STOP: 'render-animation-stop',
  RENDER_CAMERA_MOVED: 'render-camera-moved',
  RENDER_EFFECT_CREATE: 'render-effect-create',
  RENDER_EFFECT_DESTROY: 'render-effect-destroy',
  RENDER_LAYER_CHANGED: 'render-layer-changed',
  RENDER_SCREEN_SHAKE: 'render-screen-shake',
  RENDER_SPRITE_BATCH_UPDATE: 'render-sprite-batch-update',
  RENDER_SPRITE_CREATE: 'render-sprite-create',
  RENDER_SPRITE_DESTROY: 'render-sprite-destroy',
  RENDER_SPRITE_UPDATE: 'render-sprite-update',

  // Audio Events
  AUDIO_CROSSFADE: 'audio-crossfade',
  AUDIO_FADE_IN: 'audio-fade-in',
  AUDIO_FADE_OUT: 'audio-fade-out',
  AUDIO_LISTENER_MOVE: 'audio-listener-move',
  AUDIO_LOAD_ERROR: 'audio-load-error',
  AUDIO_LOADED: 'audio-loaded',
  AUDIO_MUSIC_FADE: 'audio-music-fade',
  AUDIO_MUSIC_PLAY: 'audio-music-play',
  AUDIO_MUSIC_STARTED: 'audio-music-started',
  AUDIO_MUSIC_STOP: 'audio-music-stop',
  AUDIO_MUSIC_STOPPED: 'audio-music-stopped',
  AUDIO_MUTE_TOGGLE: 'audio-mute-toggle',
  AUDIO_PAUSE_MUSIC: 'audio-pause-music',
  AUDIO_PAUSE_SOUND: 'audio-pause-sound',
  AUDIO_PLAY_MUSIC: 'audio-play-music',
  AUDIO_PLAY_SOUND: 'audio-play-sound',
  AUDIO_PRELOAD: 'audio-preload',
  AUDIO_RESUME_MUSIC: 'audio-resume-music',
  AUDIO_RESUME_SOUND: 'audio-resume-sound',
  AUDIO_SOUND_PAUSE: 'audio-sound-pause',
  AUDIO_SOUND_PLAY: 'audio-sound-play',
  AUDIO_SOUND_RESUME: 'audio-sound-resume',
  AUDIO_SOUND_STARTED: 'audio-sound-started',
  AUDIO_SOUND_STOP: 'audio-sound-stop',
  AUDIO_SOUND_STOPPED: 'audio-sound-stopped',
  AUDIO_STOP_MUSIC: 'audio-stop-music',
  AUDIO_STOP_SOUND: 'audio-stop-sound',
  AUDIO_VOLUME_CHANGE: 'audio-volume-change',
  AUDIO_VOLUME_CHANGED: 'audio-volume-changed',

  // Asset Events
  ASSET_BATCH_COMPLETE: 'asset-batch-complete',
  ASSET_BATCH_PROGRESS: 'asset-batch-progress',
  ASSET_BATCH_START: 'asset-batch-start',
  ASSET_LOADED: 'asset-loaded',
  ASSET_LOAD_FAILED: 'asset-load-failed',
  ASSET_LOAD_REQUEST: 'asset-load-request',
  ASSET_PRELOAD_REQUEST: 'asset-preload-request',
  ASSET_PROGRESS: 'asset-progress',
  ASSET_UNLOADED: 'asset-unloaded',
  ASSET_UNLOAD_REQUEST: 'asset-unload-request',

  // Scene Events
  SCENE_PAUSE: 'scene-pause',
  SCENE_RESUME: 'scene-resume',
  SCENE_SHUTDOWN: 'scene-shutdown',
  SCENE_START: 'scene-start',
  SCENE_TRANSITION_COMPLETE: 'scene-transition-complete',
  SCENE_TRANSITION_START: 'scene-transition-start',

  // Debug Events
  DEBUG_INFO_UPDATED: 'debug-info-updated',
  DEBUG_MODE_CHANGED: 'debug-mode-changed',

  MEMORY_WARNING: 'memory-warning',

  PERFORMANCE_WARNING: 'performance-warning',

  // Event System Events
  EVENT_BATCH_PROCESSED: 'event-batch-processed',
  EVENT_LISTENER_ERROR: 'event-listener-error',
  EVENT_PROCESSING_ERROR: 'event-processing-error',
  EVENT_QUEUE_OVERFLOW: 'event-queue-overflow',
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
