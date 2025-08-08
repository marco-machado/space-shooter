import Logger from '@/utils/Logger.js';

const logger = Logger.scope('ECS:TimeSystem');

/**
 * Time system that manages world time state and provides timing utilities.
 * Should be run at the end of the system pipeline to finalize time calculations.
 * 
 * @param {Object} world - The bitECS world instance
 * @returns {Object} The world instance for pipeline chaining
 */
export const timeSystem = (world) => {
  const { time } = world;
  
  // Phaser provides delta directly, so we mainly just track elapsed time
  // The delta is already set by updateWorldTime() in world.js
  
  // Track previous frame time for debugging
  const previousElapsed = time.elapsed - time.delta;
  
  // Log timing information for debugging (only occasionally to avoid spam)
  if (world.time.elapsed % 1000 < world.time.delta) { // Log roughly once per second
    logger.debug('Time system update', {
      delta: time.delta,
      elapsed: time.elapsed,
      fps: time.delta > 0 ? Math.round(1000 / time.delta) : 0
    });
  }
  
  // Clean up old weapon events (prevent memory leaks)
  if (world.weaponEvents && world.weaponEvents.length > 0) {
    // Remove events older than 100ms
    const cutoffTime = time.elapsed - 100;
    world.weaponEvents = world.weaponEvents.filter(event => event.timestamp > cutoffTime);
  }
  
  // Clean up old collision events
  if (world.collisionEvents && world.collisionEvents.length > 0) {
    const cutoffTime = time.elapsed - 100;
    world.collisionEvents = world.collisionEvents.filter(event => event.timestamp > cutoffTime);
  }
  
  // Store frame time for next frame comparisons
  time.then = performance.now();
  
  return world;
};

/**
 * Calculate frames per second based on current delta time.
 * 
 * @param {Object} world - The bitECS world instance
 * @returns {number} Current FPS
 */
export const getCurrentFPS = (world) => {
  const { time: { delta } } = world;
  return delta > 0 ? Math.round(1000 / delta) : 0;
};

/**
 * Get elapsed time in seconds (for easier usage in some contexts).
 * 
 * @param {Object} world - The bitECS world instance
 * @returns {number} Elapsed time in seconds
 */
export const getElapsedSeconds = (world) => {
  return world.time.elapsed / 1000;
};

/**
 * Get delta time in seconds (for easier usage in some contexts).
 * 
 * @param {Object} world - The bitECS world instance
 * @returns {number} Delta time in seconds
 */
export const getDeltaSeconds = (world) => {
  return world.time.delta / 1000;
};

/**
 * Check if a certain amount of time has passed since a timestamp.
 * 
 * @param {Object} world - The bitECS world instance
 * @param {number} timestamp - Previous timestamp in milliseconds
 * @param {number} duration - Duration to check in milliseconds
 * @returns {boolean} True if duration has passed
 */
export const hasTimeElapsed = (world, timestamp, duration) => {
  return (world.time.elapsed - timestamp) >= duration;
};

/**
 * Get time remaining until a duration is complete.
 * 
 * @param {Object} world - The bitECS world instance
 * @param {number} timestamp - Start timestamp in milliseconds
 * @param {number} duration - Total duration in milliseconds
 * @returns {number} Time remaining in milliseconds (0 if completed)
 */
export const getTimeRemaining = (world, timestamp, duration) => {
  const elapsed = world.time.elapsed - timestamp;
  return Math.max(0, duration - elapsed);
};

/**
 * Create a timer that tracks elapsed time from now.
 * 
 * @param {Object} world - The bitECS world instance
 * @returns {Object} Timer object with utility methods
 */
export const createTimer = (world) => {
  const startTime = world.time.elapsed;
  
  return {
    startTime,
    getElapsed: () => world.time.elapsed - startTime,
    hasElapsed: (duration) => hasTimeElapsed(world, startTime, duration),
    getRemaining: (duration) => getTimeRemaining(world, startTime, duration),
    reset: () => { startTime = world.time.elapsed; }
  };
};

/**
 * Performance monitoring utilities for system execution times.
 */
export const performanceMonitor = {
  timers: new Map(),
  
  start(name) {
    this.timers.set(name, performance.now());
  },
  
  end(name) {
    const startTime = this.timers.get(name);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.timers.delete(name);
      return duration;
    }
    return 0;
  },
  
  measure(name, fn) {
    this.start(name);
    const result = fn();
    const duration = this.end(name);
    
    if (duration > 5) { // Log slow operations (>5ms)
      logger.warn('Slow system execution', { name, duration: `${duration.toFixed(2)}ms` });
    }
    
    return result;
  }
};

/**
 * Interpolation utilities for smooth animations and transitions.
 */
export const interpolation = {
  /**
   * Linear interpolation between two values.
   * 
   * @param {number} from - Start value
   * @param {number} to - End value
   * @param {number} t - Interpolation factor (0-1)
   * @returns {number} Interpolated value
   */
  lerp(from, to, t) {
    return from + (to - from) * Math.max(0, Math.min(1, t));
  },
  
  /**
   * Smooth step interpolation (ease in/out).
   * 
   * @param {number} from - Start value
   * @param {number} to - End value
   * @param {number} t - Interpolation factor (0-1)
   * @returns {number} Interpolated value with smooth easing
   */
  smoothStep(from, to, t) {
    t = Math.max(0, Math.min(1, t));
    t = t * t * (3 - 2 * t); // Smooth step function
    return from + (to - from) * t;
  },
  
  /**
   * Create a time-based interpolation from current elapsed time.
   * 
   * @param {Object} world - World instance
   * @param {number} startTime - Start timestamp
   * @param {number} duration - Duration of interpolation
   * @param {number} from - Start value
   * @param {number} to - End value
   * @param {Function} easingFn - Optional easing function
   * @returns {number} Current interpolated value
   */
  timeBasedLerp(world, startTime, duration, from, to, easingFn = this.lerp) {
    const elapsed = world.time.elapsed - startTime;
    const t = duration > 0 ? elapsed / duration : 1;
    return easingFn(from, to, t);
  }
};

logger.debug('Time system initialized');

export default timeSystem;