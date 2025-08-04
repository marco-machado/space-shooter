/**
 * Event priority levels for the event system
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
  INPUT_KEY_DOWN: 'input-key-down',
  INPUT_KEY_UP: 'input-key-up',
  INPUT_KEY_PRESS: 'input-key-press',
  INPUT_KEY_LONG_PRESS: 'input-key-long-press',
  INPUT_KEY_COMBINATION: 'input-key-combination',
  INPUT_KEY_SEQUENCE: 'input-key-sequence',
  INPUT_MOUSE_DOWN: 'input-mouse-down',
  INPUT_MOUSE_UP: 'input-mouse-up',
  INPUT_MOUSE_MOVE: 'input-mouse-move',
  INPUT_MOUSE_WHEEL: 'input-mouse-wheel',
  INPUT_MOUSE_DOUBLE_CLICK: 'input-mouse-double-click',
  INPUT_MOUSE_LONG_PRESS: 'input-mouse-long-press',
  INPUT_MOUSE_DRAG: 'input-mouse-drag',
  INPUT_TOUCH_START: 'input-touch-start',
  INPUT_TOUCH_END: 'input-touch-end',
  INPUT_TOUCH_MOVE: 'input-touch-move',
  INPUT_TOUCH_CANCEL: 'input-touch-cancel',
  INPUT_GAMEPAD_CONNECTED: 'input-gamepad-connected',
  INPUT_GAMEPAD_DISCONNECTED: 'input-gamepad-disconnected',
  INPUT_GAMEPAD_BUTTON: 'input-gamepad-button',
  INPUT_GAMEPAD_BUTTON_DOWN: 'input-gamepad-button-down',
  INPUT_GAMEPAD_BUTTON_UP: 'input-gamepad-button-up',
  INPUT_GAMEPAD_AXIS: 'input-gamepad-axis',
  INPUT_STATE_CHANGED: 'input-state-changed',
  INPUT_PROCESSED: 'input-processed',
  INPUT_CHARACTER: 'input-character',
  INPUT_SIMULATE: 'input-simulate',
  INPUT_SET_RECORDING: 'input-set-recording',
  INPUT_START_REPLAY: 'input-start-replay',
  INPUT_RECORDING_STOPPED: 'input-recording-stopped',
  INPUT_REPLAY_FINISHED: 'input-replay-finished',
  INPUT_GESTURE_SWIPE: 'input-gesture-swipe',
  INPUT_GESTURE_TAP: 'input-gesture-tap',
  INPUT_GESTURE_PINCH: 'input-gesture-pinch',
  INPUT_LISTENER_MOVE: 'input-listener-move',
  PLAYER_INPUT: 'player-input',
  INPUT_ACTION: 'input-action',
  INPUT_ACTION_STOP: 'input-action-stop',

  // BaseEntity Events
  ENTITY_CREATED: 'entity-created',
  ENTITY_DESTROYED: 'entity-destroyed',
  ENTITY_MOVED: 'entity-moved',
  ENTITY_COMPONENT_ADDED: 'entity-component-added',
  ENTITY_COMPONENT_REMOVED: 'entity-component-removed',
  ENTITY_COMPONENT_CHANGED: 'entity-component-changed',
  ENTITY_ACTIVATED: 'entity-activated',
  ENTITY_DEACTIVATED: 'entity-deactivated',

  // Game Logic Events
  WEAPON_FIRED: 'weapon-fired',
  WEAPON_FIRE_REQUESTED: 'weapon-fire-requested',
  WEAPON_CHARGE_STARTED: 'weapon-charge-started',
  WEAPON_CHARGE_STOPPED: 'weapon-charge-stopped',
  WEAPON_SWITCHED: 'weapon-switched',
  WEAPON_COOLDOWN_COMPLETE: 'weapon-cooldown-complete',

  COLLISION_DETECTED: 'collision-detected',
  COLLISION_STARTED: 'collision-started',
  COLLISION_CONTINUED: 'collision-continued',
  COLLISION_ENDED: 'collision-ended',

  DAMAGE_DEALT: 'damage-dealt',
  DAMAGE_RECEIVED: 'damage-received',
  HEALTH_CHANGED: 'health-changed',
  HEALTH_DEPLETED: 'health-depleted',

  SCORE_CHANGED: 'score-changed',
  SCORE_MULTIPLIER_CHANGED: 'score-multiplier-changed',
  PICKUP_COLLECTED: 'pickup-collected',
  POWERUP_ACTIVATED: 'powerup-activated',
  POWERUP_EXPIRED: 'powerup-expired',

  // Game State Events
  GAME_STARTED: 'game-started',
  GAME_PAUSED: 'game-paused',
  GAME_RESUMED: 'game-resumed',
  GAME_OVER: 'game-over',
  GAME_RESTARTED: 'game-restarted',
  LEVEL_STARTED: 'level-started',
  LEVEL_COMPLETED: 'level-completed',
  LEVEL_CHANGED: 'level-changed',
  DIFFICULTY_CHANGED: 'difficulty-changed',
  CONFIG_CHANGED: 'config-changed',

  // Render Events
  RENDER_SPRITE_CREATE: 'render-sprite-create',
  RENDER_SPRITE_UPDATE: 'render-sprite-update',
  RENDER_SPRITE_DESTROY: 'render-sprite-destroy',
  RENDER_SPRITE_BATCH_UPDATE: 'render-sprite-batch-update',
  RENDER_EFFECT_CREATE: 'render-effect-create',
  RENDER_EFFECT_DESTROY: 'render-effect-destroy',
  RENDER_ANIMATION_START: 'render-animation-start',
  RENDER_ANIMATION_STOP: 'render-animation-stop',
  RENDER_ANIMATION_COMPLETE: 'render-animation-complete',
  RENDER_LAYER_CHANGED: 'render-layer-changed',
  RENDER_CAMERA_MOVED: 'render-camera-moved',
  RENDER_SCREEN_SHAKE: 'render-screen-shake',

  // Audio Events
  AUDIO_SOUND_PLAY: 'audio-sound-play',
  AUDIO_SOUND_STOP: 'audio-sound-stop',
  AUDIO_SOUND_PAUSE: 'audio-sound-pause',
  AUDIO_SOUND_RESUME: 'audio-sound-resume',
  AUDIO_SOUND_STARTED: 'audio-sound-started',
  AUDIO_SOUND_STOPPED: 'audio-sound-stopped',
  AUDIO_MUSIC_PLAY: 'audio-music-play',
  AUDIO_MUSIC_STOP: 'audio-music-stop',
  AUDIO_MUSIC_FADE: 'audio-music-fade',
  AUDIO_MUSIC_STARTED: 'audio-music-started',
  AUDIO_MUSIC_STOPPED: 'audio-music-stopped',
  AUDIO_VOLUME_CHANGE: 'audio-volume-change',
  AUDIO_MUTE_TOGGLE: 'audio-mute-toggle',
  AUDIO_LISTENER_MOVE: 'audio-listener-move',
  AUDIO_PRELOAD: 'audio-preload',
  AUDIO_LOADED: 'audio-loaded',
  AUDIO_LOAD_ERROR: 'audio-load-error',
  AUDIO_PLAY_SOUND: 'audio-play-sound',
  AUDIO_PLAY_MUSIC: 'audio-play-music',
  AUDIO_STOP_SOUND: 'audio-stop-sound',
  AUDIO_STOP_MUSIC: 'audio-stop-music',
  AUDIO_PAUSE_SOUND: 'audio-pause-sound',
  AUDIO_PAUSE_MUSIC: 'audio-pause-music',
  AUDIO_RESUME_SOUND: 'audio-resume-sound',
  AUDIO_RESUME_MUSIC: 'audio-resume-music',
  AUDIO_VOLUME_CHANGED: 'audio-volume-changed',
  AUDIO_FADE_IN: 'audio-fade-in',
  AUDIO_FADE_OUT: 'audio-fade-out',
  AUDIO_CROSSFADE: 'audio-crossfade',

  // Asset Events
  ASSET_LOAD_REQUEST: 'asset-load-request',
  ASSET_LOADED: 'asset-loaded',
  ASSET_LOAD_FAILED: 'asset-load-failed',
  ASSET_UNLOAD_REQUEST: 'asset-unload-request',
  ASSET_UNLOADED: 'asset-unloaded',
  ASSET_PRELOAD_REQUEST: 'asset-preload-request',
  ASSET_PROGRESS: 'asset-progress',
  ASSET_BATCH_START: 'asset-batch-start',
  ASSET_BATCH_PROGRESS: 'asset-batch-progress',
  ASSET_BATCH_COMPLETE: 'asset-batch-complete',

  // Scene Events
  SCENE_START: 'scene-start',
  SCENE_SHUTDOWN: 'scene-shutdown',
  SCENE_PAUSE: 'scene-pause',
  SCENE_RESUME: 'scene-resume',
  SCENE_TRANSITION_START: 'scene-transition-start',
  SCENE_TRANSITION_COMPLETE: 'scene-transition-complete',

  // BaseSystem Events
  SYSTEM_ERROR: 'system-error',
  SYSTEM_WARNING: 'system-warning',
  SYSTEM_INITIALIZED: 'system-initialized',
  SYSTEM_DESTROYED: 'system-destroyed',
  FRAME_START: 'frame-start',
  FRAME_END: 'frame-end',
  GAME_LOOP_STARTED: 'game-loop-started',
  GAME_LOOP_STOPPED: 'game-loop-stopped',
  WORLD_BOUNDS_CHANGED: 'world-bounds-changed',

  // Adapter Events
  ADAPTER_ERROR: 'adapter-error',
  ADAPTER_WARNING: 'adapter-warning',
  ADAPTER_INITIALIZED: 'adapter-initialized',
  ADAPTER_DESTROYED: 'adapter-destroyed',

  // Debug Events
  DEBUG_MODE_CHANGED: 'debug-mode-changed',
  DEBUG_INFO_UPDATED: 'debug-info-updated',
  PERFORMANCE_WARNING: 'performance-warning',
  MEMORY_WARNING: 'memory-warning',

  // Event BaseSystem Events
  EVENT_LISTENER_ERROR: 'event-listener-error',
  EVENT_PROCESSING_ERROR: 'event-processing-error',
  EVENT_QUEUE_OVERFLOW: 'event-queue-overflow',
  EVENT_BATCH_PROCESSED: 'event-batch-processed',
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
  SYSTEM: 'system',
  ADAPTER: 'adapter',
  DEBUG: 'debug',
  EVENT_SYSTEM: 'event-system',
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
    eventType.startsWith('system-') ||
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
