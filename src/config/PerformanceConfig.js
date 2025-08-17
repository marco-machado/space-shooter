/**
 * Performance and optimization configuration
 * Contains settings for performance tuning, object pooling, and debug displays
 * @module PerformanceConfig
 */

/**
 * Performance optimization settings
 * @constant {Object}
 */
export const PerformanceConfig = {
  // Object pooling and memory management
  DEFAULT_MAX_PARTICLES: 1000,
  DEFAULT_OBJECT_POOL_SIZE: 200,

  // Performance bounds and validation
  BOUNDS: {
    MAX_PARTICLES: { min: 100, max: 10000 },
    OBJECT_POOL_SIZE: { min: 50, max: 1000 },
    PLAYER_FIRE_COOLDOWN: { min: 50, max: 5000 },
    STARTING_LIVES: { min: 1, max: 10 },
    BASE_SCORE_MULTIPLIER: { min: 0.1, max: 10.0 },
  },

  // Development and debug settings
  DEBUG_DEFAULTS: {
    SHOW_FPS: false,
    SHOW_DEBUG_INFO: false,
    PHYSICS_DEBUG: false,
  },
};

export default PerformanceConfig;
