import Logger from '@/utils/Logger.js';
import EnvironmentSchema from './EnvironmentSchema.js';
import { GameConfig } from './GameConfig.js';
import { VisualConfig } from './VisualConfig.js';
import { CollisionConfig } from './CollisionConfig.js';
import { PhaserConfig } from './PhaserConfig.js';
import { PerformanceConfig } from './PerformanceConfig.js';

/**
 * Configuration Manager
 * Consolidates environment variables, game constants, and Phaser configuration
 */
export default class ConfigManager {
  static isInitialized = false;
  static validationErrors = [];
  static registeredScenes = [];

  static init() {
    if (this.isInitialized) {
      return;
    }

    try {
      this.validationErrors = [];

      this.initializeEnvironment();
      this.initializeGameConfig();
      this.checkProductionSafety();
    } catch (error) {
      this.loadFailsafeDefaults();

      Logger.scope('ConfigManager').error('Configuration initialization failed:', error.message);
    } finally {
      this.isInitialized = true;
    }
  }

  static initializeEnvironment() {
    const parsed = EnvironmentSchema.parse(import.meta.env);

    this.DEBUG_MODE = parsed.VITE_DEBUG_MODE;
    this.LOG_LEVEL = parsed.VITE_LOG_LEVEL;
    this.PHYSICS_DEBUG = parsed.VITE_PHYSICS_DEBUG;
    this.AUDIO_ENABLED = parsed.VITE_AUDIO_ENABLED;
    this.STARTING_LIVES = parsed.VITE_STARTING_LIVES;
    this.BASE_SCORE_MULTIPLIER = parsed.VITE_BASE_SCORE_MULTIPLIER;
    this.PLAYER_FIRE_COOLDOWN = parsed.VITE_PLAYER_FIRE_COOLDOWN;
    this.MAX_PARTICLES = parsed.VITE_MAX_PARTICLES;
    this.OBJECT_POOL_SIZE = parsed.VITE_OBJECT_POOL_SIZE;
    this.SHOW_FPS = parsed.VITE_SHOW_FPS;
    this.SHOW_DEBUG_INFO = parsed.VITE_SHOW_DEBUG_INFO;
    this.FAST_PROGRESSION = parsed.VITE_FAST_PROGRESSION;
    this.DEV_STARTING_POINTS = parsed.VITE_DEV_STARTING_POINTS;

    this.IS_DEVELOPMENT = import.meta.env.DEV;
    this.IS_PRODUCTION = import.meta.env.PROD;
  }

  static initializeGameConfig() {
    // Import configurations from separate files
    this.GAME_WIDTH = GameConfig.GAME_WIDTH;
    this.GAME_HEIGHT = GameConfig.GAME_HEIGHT;
    this.SCENES = GameConfig.SCENES;
    this.PLAYER = GameConfig.PLAYER;
    this.PROJECTILES = GameConfig.PROJECTILES;
    this.ENEMIES = GameConfig.ENEMIES;

    // Visual configuration
    this.COLORS = VisualConfig.COLORS;
    this.DEPTHS = VisualConfig.DEPTHS;
    this.COLLISION_EFFECTS = VisualConfig.EFFECTS;

    // Collision configuration
    this.COLLISION_GROUPS = CollisionConfig.GROUPS;
    this.COLLISION_CATEGORIES = CollisionConfig.CATEGORIES;
    this.COLLISION_MATRIX = CollisionConfig.MATRIX;
    this.COLLISION_COOLDOWNS = CollisionConfig.COOLDOWNS;
  }

  /**
   * Get all environment configuration as an object
   * @returns {Object} Configuration object with metadata
   */
  static getConfig() {
    this._ensureInitialized();

    return {
      // Configuration values
      debugMode: this.DEBUG_MODE,
      logLevel: this.LOG_LEVEL,
      physicsDebug: this.PHYSICS_DEBUG,
      audioEnabled: this.AUDIO_ENABLED,
      startingLives: this.STARTING_LIVES,
      baseScoreMultiplier: this.BASE_SCORE_MULTIPLIER,
      playerFireCooldown: this.PLAYER_FIRE_COOLDOWN,
      maxParticles: this.MAX_PARTICLES,
      objectPoolSize: this.OBJECT_POOL_SIZE,
      showFps: this.SHOW_FPS,
      showDebugInfo: this.SHOW_DEBUG_INFO,
      fastProgression: this.FAST_PROGRESSION,
      devStartingPoints: this.DEV_STARTING_POINTS,
      isDevelopment: this.IS_DEVELOPMENT,
      isProduction: this.IS_PRODUCTION,
    };
  }

  /**
   * Get Phaser game configuration object
   * @param {Array} scenes - Optional scenes array to use instead of default
   * @returns {Object} Phaser configuration
   */
  static getPhaserConfig(scenes = null) {
    this._ensureInitialized();

    const envConfig = this.getConfig();
    return PhaserConfig.create(envConfig, scenes || this.registeredScenes);
  }

  /**
   * Register scenes for the game
   * @param {Array} sceneClasses - Array of scene classes to register
   */
  static registerScenes(sceneClasses) {
    if (!Array.isArray(sceneClasses)) {
      Logger.scope('ConfigManager').error('RegisterScenes: scenes must be an array');
      return;
    }

    this.registeredScenes = [...sceneClasses];
  }

  /**
   * Get game constants and settings
   * @returns {Object} Game constants
   */
  static getConstants() {
    this._ensureInitialized();

    return {
      GAME_WIDTH: this.GAME_WIDTH,
      GAME_HEIGHT: this.GAME_HEIGHT,
      PLAYER: { ...this.PLAYER },
      PROJECTILES: { ...this.PROJECTILES },
      ENEMIES: { ...this.ENEMIES },
      COLORS: { ...this.COLORS },
      COLLISION_GROUPS: { ...this.COLLISION_GROUPS },
      COLLISION_CATEGORIES: { ...this.COLLISION_CATEGORIES },
      COLLISION_MATRIX: { ...this.COLLISION_MATRIX },
      COLLISION_COOLDOWNS: { ...this.COLLISION_COOLDOWNS },
      COLLISION_EFFECTS: { ...this.COLLISION_EFFECTS },
      PHYSICS_GROUPS: { ...this.PHYSICS_GROUPS }, // Legacy support
      DEPTHS: { ...this.DEPTHS },
      SCENES: { ...this.SCENES },
    };
  }

  /**
   * Get configuration schema for documentation or validation purposes
   * @returns {Object} Configuration schema
   */
  static getSchema() {
    return { ...this.SCHEMA };
  }

  /**
   * Get validation status and errors
   * @returns {Object} Validation status with details
   */
  static getValidationStatus() {
    this._ensureInitialized();

    return {
      isValid: this.validationErrors.length === 0,
      errors: [...this.validationErrors],
      warningsCount: 0, // Could be enhanced to track warnings separately
      lastValidated: new Date().toISOString(),
    };
  }

  // ============================================================================
  // VALIDATION AND SAFETY METHODS
  // ============================================================================

  /**
   * Check for production safety issues and warn about dangerous configurations
   */
  static checkProductionSafety() {
    if (this.IS_PRODUCTION) {
      if (this.DEBUG_MODE) {
        Logger.scope('ConfigManager').warn(
          'WARNING: DEBUG_MODE is enabled in production - this may impact performance and security',
        );
      }

      if (this.PHYSICS_DEBUG) {
        Logger.scope('ConfigManager').warn(
          'WARNING: PHYSICS_DEBUG is enabled in production - this will impact performance',
        );
      }

      if (this.SHOW_FPS || this.SHOW_DEBUG_INFO) {
        Logger.scope('ConfigManager').warn('WARNING: Debug UI elements are enabled in production');
      }

      if (this.LOG_LEVEL === 'debug') {
        Logger.scope('ConfigManager').warn(
          'WARNING: LOG_LEVEL is set to debug in production - this may impact performance',
        );
      }
    }
  }

  /**
   * Load failsafe defaults when initialization fails
   */
  static loadFailsafeDefaults() {
    Logger.scope('ConfigManager').warn('Loading failsafe defaults due to initialization failure');

    // Reset initialization state to allow values to be overridden
    this.isInitialized = false;

    // Conservative production-safe defaults from PerformanceConfig
    this.DEBUG_MODE = false;
    this.LOG_LEVEL = 'error';
    this.PHYSICS_DEBUG = PerformanceConfig.DEBUG_DEFAULTS.PHYSICS_DEBUG;
    this.AUDIO_ENABLED = true;
    this.STARTING_LIVES = 3;
    this.BASE_SCORE_MULTIPLIER = 1.0;
    this.MAX_PARTICLES = 500; // Lower for safety
    this.OBJECT_POOL_SIZE = 100; // Lower for safety
    this.SHOW_FPS = PerformanceConfig.DEBUG_DEFAULTS.SHOW_FPS;
    this.SHOW_DEBUG_INFO = PerformanceConfig.DEBUG_DEFAULTS.SHOW_DEBUG_INFO;
    this.IS_DEVELOPMENT = false;
    this.IS_PRODUCTION = true;

    // Initialize game constants with safe defaults
    this.initializeGameConfig();

    // Mark as initialized again
    this.isInitialized = true;
  }

  /**
   * Validate current configuration (mainly for cross-parameter checks)
   * Environment variable validation is now handled by Zod schema
   * @returns {boolean} True if all validations pass, false otherwise
   */
  static validate() {
    this.validationErrors = [];

    // Cross-parameter validations that go beyond individual environment variables
    if (this.MAX_PARTICLES < this.OBJECT_POOL_SIZE) {
      Logger.scope('ConfigManager').warn(
        'MAX_PARTICLES should be greater than or equal to OBJECT_POOL_SIZE for optimal performance',
      );
    }

    // Validate against performance bounds
    const bounds = PerformanceConfig.BOUNDS;
    if (
      this.MAX_PARTICLES < bounds.MAX_PARTICLES.min ||
      this.MAX_PARTICLES > bounds.MAX_PARTICLES.max
    ) {
      Logger.scope('ConfigManager').warn(
        `MAX_PARTICLES (${this.MAX_PARTICLES}) is outside recommended bounds (${bounds.MAX_PARTICLES.min}-${bounds.MAX_PARTICLES.max})`,
      );
    }

    if (
      this.OBJECT_POOL_SIZE < bounds.OBJECT_POOL_SIZE.min ||
      this.OBJECT_POOL_SIZE > bounds.OBJECT_POOL_SIZE.max
    ) {
      Logger.scope('ConfigManager').warn(
        `OBJECT_POOL_SIZE (${this.OBJECT_POOL_SIZE}) is outside recommended bounds (${bounds.OBJECT_POOL_SIZE.min}-${bounds.OBJECT_POOL_SIZE.max})`,
      );
    }

    // For now, this always returns true since Zod handles the validation
    // This method is kept for potential future cross-parameter validation needs
    return true;
  }

  /**
   * Auto-initialize if not already initialized
   * Called by getConfig and other methods that need initialized state
   */
  static _ensureInitialized() {
    if (!this.isInitialized) {
      this.init();
    }
  }
}
