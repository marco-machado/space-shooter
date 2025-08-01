/**
 * Environment Configuration Manager
 * Handles environment variables and provides defaults for development/production
 */
class Environment {
  static init() {
    // Development flags
    this.DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';
    this.LOG_LEVEL = import.meta.env.VITE_LOG_LEVEL || 'info';
    this.PHYSICS_DEBUG = import.meta.env.VITE_PHYSICS_DEBUG === 'true';
    this.AUDIO_ENABLED = import.meta.env.VITE_AUDIO_ENABLED !== 'false';

    // Game configuration
    this.STARTING_LIVES = parseInt(import.meta.env.VITE_STARTING_LIVES) || 3;
    this.BASE_SCORE_MULTIPLIER = parseFloat(import.meta.env.VITE_BASE_SCORE_MULTIPLIER) || 1.0;

    // Performance settings
    this.MAX_PARTICLES = parseInt(import.meta.env.VITE_MAX_PARTICLES) || 1000;
    this.OBJECT_POOL_SIZE = parseInt(import.meta.env.VITE_OBJECT_POOL_SIZE) || 200;

    // Development graphics
    this.SHOW_FPS = import.meta.env.VITE_SHOW_FPS === 'true';
    this.SHOW_DEBUG_INFO = import.meta.env.VITE_SHOW_DEBUG_INFO === 'true';

    // Derived settings
    this.IS_DEVELOPMENT = import.meta.env.DEV;
    this.IS_PRODUCTION = import.meta.env.PROD;
  }

  /**
   * Get all environment configuration as an object
   * @returns {Object} Configuration object
   */
  static getConfig() {
    return {
      debugMode: this.DEBUG_MODE,
      logLevel: this.LOG_LEVEL,
      physicsDebug: this.PHYSICS_DEBUG,
      audioEnabled: this.AUDIO_ENABLED,
      startingLives: this.STARTING_LIVES,
      baseScoreMultiplier: this.BASE_SCORE_MULTIPLIER,
      maxParticles: this.MAX_PARTICLES,
      objectPoolSize: this.OBJECT_POOL_SIZE,
      showFps: this.SHOW_FPS,
      showDebugInfo: this.SHOW_DEBUG_INFO,
      isDevelopment: this.IS_DEVELOPMENT,
      isProduction: this.IS_PRODUCTION,
    };
  }

  /**
   * Validate environment configuration
   * @returns {boolean} True if valid, false otherwise
   */
  static validate() {
    const validLogLevels = ['debug', 'info', 'warn', 'error'];
    if (!validLogLevels.includes(this.LOG_LEVEL)) {
      console.error(
        `Invalid LOG_LEVEL: ${this.LOG_LEVEL}. Must be one of: ${validLogLevels.join(', ')}`
      );
      return false;
    }

    if (this.STARTING_LIVES < 1 || this.STARTING_LIVES > 10) {
      console.error(`Invalid STARTING_LIVES: ${this.STARTING_LIVES}. Must be between 1 and 10.`);
      return false;
    }

    if (this.BASE_SCORE_MULTIPLIER <= 0) {
      console.error(
        `Invalid BASE_SCORE_MULTIPLIER: ${this.BASE_SCORE_MULTIPLIER}. Must be greater than 0.`
      );
      return false;
    }

    return true;
  }
}

export default Environment;
