import Logger from '@/utils/Logger.js';

/**
 * Unified Configuration Manager
 * Consolidates environment variables, game constants, and Phaser configuration
 * 
 * Features:
 * - Auto-initialization with comprehensive validation
 * - Logger scopeName integration for consistent error reporting
 * - Production safety with secure defaults
 * - Type-safe parsing with bounds checking
 * - Comprehensive schema validation for all parameters
 * - Phaser game configuration with scene management
 * - Game constants and physics settings
 */
export default class ConfigManager {
  // Environment configuration schema with validation rules
  static SCHEMA = {
    // Development flags
    DEBUG_MODE: { type: 'boolean', default: false, description: 'Enable debug mode features' },
    LOG_LEVEL: {
      type: 'string',
      values: ['debug', 'info', 'warn', 'error'],
      default: 'info',
      description: 'Logging level threshold',
    },
    PHYSICS_DEBUG: {
      type: 'boolean',
      default: false,
      description: 'Show physics debug visualization',
    },
    AUDIO_ENABLED: { type: 'boolean', default: true, description: 'Enable audio scopeName' },

    // Game configuration
    STARTING_LIVES: {
      type: 'number',
      min: 1,
      max: 10,
      default: 3,
      description: 'Player starting lives count',
    },
    BASE_SCORE_MULTIPLIER: {
      type: 'number',
      min: 0.1,
      max: 10.0,
      default: 1.0,
      description: 'Base score multiplier for gameplay',
    },

    // Performance settings
    MAX_PARTICLES: {
      type: 'number',
      min: 100,
      max: 10000,
      default: 1000,
      description: 'Maximum particle count for effects',
    },
    OBJECT_POOL_SIZE: {
      type: 'number',
      min: 50,
      max: 1000,
      default: 200,
      description: 'Object pool size for performance optimization',
    },

    // Development graphics
    SHOW_FPS: { type: 'boolean', default: false, description: 'Display FPS counter' },
    SHOW_DEBUG_INFO: {
      type: 'boolean',
      default: false,
      description: 'Show debug information overlay',
    },
  };

  // Track initialization state
  static isInitialized = false;
  static validationErrors = [];
  static registeredScenes = [];

  /**
   * Initialize complete configuration scopeName with comprehensive validation
   * Auto-initializes on first access if not already initialized
   */
  static init() {
    if (this.isInitialized) {
      return;
    }

    Logger.debug('[ConfigManager] Initializing unified configuration scopeName...');

    try {
      this.validationErrors = [];

      // Initialize environment configuration first
      this._initializeEnvironment();

      // Initialize game configuration
      this._initializeGameConfig();

      // Comprehensive validation
      const isValid = this.validate();

      if (isValid) {
        this.isInitialized = true;
        Logger.info('[ConfigManager] Configuration initialized successfully', {
          debugMode: this.DEBUG_MODE,
          logLevel: this.LOG_LEVEL,
          environment: this.IS_DEVELOPMENT ? 'development' : 'production',
        });
      } else {
        Logger.error(
          '[ConfigManager] Configuration validation failed with errors:',
          this.validationErrors
        );
        throw new Error(`Configuration validation failed: ${this.validationErrors.join(', ')}`);
      }
    } catch (error) {
      Logger.error('[ConfigManager] Failed to initialize configuration:', error);
      this.loadFailsafeDefaults();
      this.isInitialized = true;
    }
  }

  /**
   * Initialize environment variables and settings
   * @private
   */
  static _initializeEnvironment() {
    Logger.debug('[ConfigManager] Initializing environment configuration...');

    // Development flags
    this.DEBUG_MODE = this.parseBooleanSafe('VITE_DEBUG_MODE', false, 'DEBUG_MODE');
    this.LOG_LEVEL = this.parseStringWithValidation('VITE_LOG_LEVEL', 'info', 'LOG_LEVEL', [
      'debug',
      'info',
      'warn',
      'error',
    ]);
    this.PHYSICS_DEBUG = this.parseBooleanSafe('VITE_PHYSICS_DEBUG', false, 'PHYSICS_DEBUG');
    this.AUDIO_ENABLED = this.parseBooleanSafe('VITE_AUDIO_ENABLED', true, 'AUDIO_ENABLED');

    // Game configuration
    this.STARTING_LIVES = this.parseIntSafe('VITE_STARTING_LIVES', 3, 'STARTING_LIVES', 1, 10);
    this.BASE_SCORE_MULTIPLIER = this.parseFloatSafe(
      'VITE_BASE_SCORE_MULTIPLIER',
      1.0,
      'BASE_SCORE_MULTIPLIER',
      0.1,
      10.0
    );

    // Performance settings
    this.MAX_PARTICLES = this.parseIntSafe(
      'VITE_MAX_PARTICLES',
      1000,
      'MAX_PARTICLES',
      100,
      10000
    );
    this.OBJECT_POOL_SIZE = this.parseIntSafe(
      'VITE_OBJECT_POOL_SIZE',
      200,
      'OBJECT_POOL_SIZE',
      50,
      1000
    );

    // Development graphics
    this.SHOW_FPS = this.parseBooleanSafe('VITE_SHOW_FPS', false, 'SHOW_FPS');
    this.SHOW_DEBUG_INFO = this.parseBooleanSafe(
      'VITE_SHOW_DEBUG_INFO',
      false,
      'SHOW_DEBUG_INFO'
    );

    // Derived settings
    this.IS_DEVELOPMENT = import.meta.env.DEV;
    this.IS_PRODUCTION = import.meta.env.PROD;

    // Production safety warnings
    this.checkProductionSafety();
  }

  /**
   * Initialize game constants and configuration
   * @private
   */
  static _initializeGameConfig() {
    Logger.debug('[ConfigManager] Initializing game configuration...');

    // Game constants
    this.GAME_WIDTH = 800;
    this.GAME_HEIGHT = 600;

    // Colors (development phase)
    this.COLORS = {
      PLAYER: 0x0099ff, // Blue
      ENEMY: 0xff0000, // Red
      ENEMY_BOSS: 0xcc0000, // Dark red
      PROJECTILE_PLAYER: 0xffff00, // Yellow
      PROJECTILE_ENEMY: 0xff8800, // Orange
      POWERUP_HEALTH: 0x00ff00, // Green
      POWERUP_WEAPON: 0x8800ff, // Purple
      UI_TEXT: 0xffffff, // White
      UI_BACKGROUND: 0x333333, // Dark gray
      BACKGROUND: 0x000011, // Dark space blue
    };

    // Collision groups (enhanced for Phaser Arcade Physics migration)
    this.COLLISION_GROUPS = {
      PLAYER: 'player',
      ENEMY: 'enemy',
      PLAYER_PROJECTILE: 'playerProjectile',
      ENEMY_PROJECTILE: 'enemyProjectile',
      POWERUP: 'powerup',
      OBSTACLE: 'obstacle',
    };

    // Collision categories (bitmasks for Phaser physics)
    this.COLLISION_CATEGORIES = {
      PLAYER: 0x0001,        // 1
      ENEMY: 0x0002,         // 2
      PLAYER_PROJECTILE: 0x0004, // 4
      ENEMY_PROJECTILE: 0x0008,  // 8
      POWERUP: 0x0010,       // 16
      OBSTACLE: 0x0020,      // 32
    };

    // Collision matrix - defines what collides with what
    this.COLLISION_MATRIX = {
      [this.COLLISION_GROUPS.PLAYER]: [
        this.COLLISION_CATEGORIES.ENEMY,
        this.COLLISION_CATEGORIES.ENEMY_PROJECTILE,
        this.COLLISION_CATEGORIES.POWERUP,
        this.COLLISION_CATEGORIES.OBSTACLE
      ],
      [this.COLLISION_GROUPS.ENEMY]: [
        this.COLLISION_CATEGORIES.PLAYER,
        this.COLLISION_CATEGORIES.PLAYER_PROJECTILE,
        this.COLLISION_CATEGORIES.OBSTACLE
      ],
      [this.COLLISION_GROUPS.PLAYER_PROJECTILE]: [
        this.COLLISION_CATEGORIES.ENEMY,
        this.COLLISION_CATEGORIES.OBSTACLE
      ],
      [this.COLLISION_GROUPS.ENEMY_PROJECTILE]: [
        this.COLLISION_CATEGORIES.PLAYER,
        this.COLLISION_CATEGORIES.OBSTACLE
      ],
      [this.COLLISION_GROUPS.POWERUP]: [
        this.COLLISION_CATEGORIES.PLAYER
      ],
      [this.COLLISION_GROUPS.OBSTACLE]: [
        this.COLLISION_CATEGORIES.PLAYER,
        this.COLLISION_CATEGORIES.ENEMY,
        this.COLLISION_CATEGORIES.PLAYER_PROJECTILE,
        this.COLLISION_CATEGORIES.ENEMY_PROJECTILE
      ]
    };

    // Collision cooldown settings (in milliseconds)
    this.COLLISION_COOLDOWNS = {
      PLAYER_ENEMY: 1000,        // 1 second invulnerability after enemy contact
      PLAYER_PROJECTILE: 500,    // 0.5 second invulnerability after projectile hit
      ENEMY_PROJECTILE: 100,     // 0.1 second for enemy projectile hits (brief)
      PLAYER_OBSTACLE: 500,      // 0.5 second after obstacle collision
      ENEMY_OBSTACLE: 200,       // 0.2 second for enemies hitting obstacles
    };

    // Collision effect settings
    this.COLLISION_EFFECTS = {
      SCREEN_SHAKE: {
        PLAYER_HIT: { duration: 300, intensity: 8 },
        ENEMY_DESTROYED: { duration: 150, intensity: 4 },
        OBSTACLE_HIT: { duration: 100, intensity: 3 }
      },
      FLASH_EFFECT: {
        PLAYER_HIT: { color: 0xff0000, duration: 200 },  // Red flash
        ENEMY_HIT: { color: 0xffffff, duration: 100 },   // White flash
        POWERUP_COLLECTED: { color: 0x00ff00, duration: 150 } // Green flash
      },
      PARTICLES: {
        EXPLOSION_SMALL: { count: 15, speed: 100, life: 500 },
        EXPLOSION_LARGE: { count: 30, speed: 150, life: 800 },
        SPARK_EFFECT: { count: 8, speed: 80, life: 300 }
      }
    };

    // Legacy physics groups (for backward compatibility during migration)
    this.PHYSICS_GROUPS = {
      PLAYER: 'player',
      ENEMIES: 'enemies',
      PLAYER_PROJECTILES: 'playerProjectiles',
      ENEMY_PROJECTILES: 'enemyProjectiles',
      POWERUPS: 'powerups',
    };

    // Z-depths for layering
    this.DEPTHS = {
      BACKGROUND: -100,
      POWERUPS: 10,
      ENEMIES: 20,
      PLAYER: 30,
      PROJECTILES: 40,
      PARTICLES: 50,
      UI: 100,
      DEBUG: 1000,
    };

    // Scene keys
    this.SCENES = {
      BOOT: 'BootScene',
      PRELOADER: 'PreloaderScene',
      MAIN_MENU: 'MainMenuScene',
      GAME: 'GameScene',
      UI_SCENE: 'UIScene',
      GAME_OVER: 'GameOverScene',
      PAUSE: 'PauseScene',
    };
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
      maxParticles: this.MAX_PARTICLES,
      objectPoolSize: this.OBJECT_POOL_SIZE,
      showFps: this.SHOW_FPS,
      showDebugInfo: this.SHOW_DEBUG_INFO,
      isDevelopment: this.IS_DEVELOPMENT,
      isProduction: this.IS_PRODUCTION,

      // Metadata
      _metadata: {
        initialized: this.isInitialized,
        validationErrors: this.validationErrors.length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Get Phaser game configuration object
   * @param {Array} scenes - Optional scenes array to use instead of default
   * @returns {Object} Phaser configuration
   */
  static getPhaserConfig(scenes = null) {
    this._ensureInitialized();

    // In test environment, return a mock configuration
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
      return {
        type: 'WEBGL', // Mock value for tests
        width: 600,
        height: 800,
        parent: 'game-container',
        backgroundColor: '#000011',
        scene: scenes || this.registeredScenes,
        physics: { default: 'arcade', arcade: { gravity: { y: 0 } } },
        render: { antialias: false },
        audio: { noAudio: !this.AUDIO_ENABLED },
        input: { keyboard: true, mouse: true, touch: true },
        scale: { mode: 'NONE', autoCenter: 'NO_CENTER' },
        banner: { hidePhaser: !this.DEBUG_MODE },
        disableContextMenu: true,
      };
    }

    return {
      type: Phaser.AUTO,
      width: 600,
      height: 800,
      parent: 'game-container',
      backgroundColor: '#000011', // Dark space background

      // Scene configuration - will be provided by main.js
      scene: scenes || this.registeredScenes,

      // Physics configuration
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 }, // No gravity for space shooter
          debug: this.PHYSICS_DEBUG,
          debugShowBody: this.PHYSICS_DEBUG,
          debugShowStaticBody: this.PHYSICS_DEBUG,
          debugShowVelocity: this.PHYSICS_DEBUG,
          debugVelocityColor: 0x00ff00,
          debugBodyColor: 0xff0000,
          debugStaticBodyColor: 0x0000ff,
        },
      },

      // Rendering options
      render: {
        antialias: false, // Pixel-perfect for retro feel
        pixelArt: false, // May enable later for pixel art
        roundPixels: true, // Prevent sub-pixel rendering
        transparent: false,
        clearBeforeRender: true,
        preserveDrawingBuffer: false,
        failIfMajorPerformanceCaveat: false,
        powerPreference: 'default',
      },

      // Audio configuration
      audio: {
        disableWebAudio: false,
        context: false,
        noAudio: !this.AUDIO_ENABLED,
      },

      // Input configuration
      input: {
        keyboard: true,
        mouse: true,
        touch: true,
        gamepad: false, // May enable later
      },

      // Scale configuration - TEMPORARILY DISABLED RESCALING
      scale: {
        mode: Phaser.Scale.NONE, // Disabled rescaling temporarily
        autoCenter: Phaser.Scale.NO_CENTER, // Disabled auto-centering
        width: 600,
        height: 800,
      },

      // Banner configuration
      banner: {
        hidePhaser: !this.DEBUG_MODE,
        text: this.DEBUG_MODE ? '#FFFFFF' : 'transparent',
        background: this.DEBUG_MODE
          ? ['#FF6600', '#000000', '#FF6600', '#000000']
          : 'transparent',
      },

      // Development options
      fps: this.SHOW_FPS
        ? {
            target: 60,
            forceSetTimeOut: false,
            deltaHistory: 10,
            panicMax: 120,
            smoothStep: true,
          }
        : undefined,

      // Performance options
      disableContextMenu: true,
      transparent: false,
      antialias: false,
      desynchronized: false,

      // Callbacks
      callbacks: {
        preBoot: game => {
          // Game pre-boot setup
          if (this.DEBUG_MODE) {
            game.debug = true;
          }
        },

        postBoot: game => {
          // Game post-boot setup
          if (this.SHOW_DEBUG_INFO) {
            game.scene.scenes.forEach(scene => {
              // Ensure scene is properly initialized before accessing displayList
              if (scene.sys && scene.sys.displayList && scene.sys.displayList.on) {
                scene.sys.displayList.on('addedtoscene', gameObject => {
                  gameObject.setData('created', Date.now());
                });
              }
            });
          }
        },
      },
    };
  }

  /**
   * Register scenes for the game
   * @param {Array} sceneClasses - Array of scene classes to register
   */
  static registerScenes(sceneClasses) {
    if (!Array.isArray(sceneClasses)) {
      Logger.warn('[ConfigManager] registerScenes: scenes must be an array');
      return;
    }

    this.registeredScenes = [...sceneClasses];
    Logger.debug(`[ConfigManager] Registered ${sceneClasses.length} scenes`);
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

  /**
   * Export configuration for debugging or support purposes
   * @returns {Object} Complete configuration export with schema and validation
   */
  static exportConfig() {
    this._ensureInitialized();

    const exportData = {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      environment: this.IS_DEVELOPMENT ? 'development' : 'production',
      configuration: this.getConfig(),
      constants: this.getConstants(),
      schema: this.getSchema(),
      validation: this.getValidationStatus(),
    };

    // Only include Phaser config if not in test environment
    if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
      exportData.phaserConfig = this.getPhaserConfig();
    }

    return exportData;
  }

  // ============================================================================
  // PARSING METHODS
  // ============================================================================

  /**
   * Safely parse integer values with validation and bounds checking
   * @param {string} envKey - Environment variable key
   * @param {number} defaultValue - Default value if parsing fails
   * @param {string} name - Configuration parameter name for logging
   * @param {number} min - Minimum allowed value
   * @param {number} max - Maximum allowed value
   * @returns {number} Parsed and validated integer
   */
  static parseIntSafe(envKey, defaultValue, name, min = null, max = null) {
    const rawValue = import.meta.env[envKey];

    if (rawValue === undefined || rawValue === '') {
      Logger.debug(`[ConfigManager] ${name}: Using default value ${defaultValue}`);
      return defaultValue;
    }

    const parsed = parseInt(rawValue, 10);

    if (isNaN(parsed)) {
      Logger.warn(
        `[ConfigManager] ${name}: Invalid value '${rawValue}', using default ${defaultValue}`
      );
      return defaultValue;
    }

    if (min !== null && parsed < min) {
      Logger.warn(
        `[ConfigManager] ${name}: Value ${parsed} below minimum ${min}, using default ${defaultValue}`
      );
      return defaultValue;
    }

    if (max !== null && parsed > max) {
      Logger.warn(
        `[ConfigManager] ${name}: Value ${parsed} above maximum ${max}, using default ${defaultValue}`
      );
      return defaultValue;
    }

    Logger.debug(`[ConfigManager] ${name}: Set to ${parsed}`);
    return parsed;
  }

  /**
   * Safely parse float values with validation and bounds checking
   * @param {string} envKey - Environment variable key
   * @param {number} defaultValue - Default value if parsing fails
   * @param {string} name - Configuration parameter name for logging
   * @param {number} min - Minimum allowed value
   * @param {number} max - Maximum allowed value
   * @returns {number} Parsed and validated float
   */
  static parseFloatSafe(envKey, defaultValue, name, min = null, max = null) {
    const rawValue = import.meta.env[envKey];

    if (rawValue === undefined || rawValue === '') {
      Logger.debug(`[ConfigManager] ${name}: Using default value ${defaultValue}`);
      return defaultValue;
    }

    const parsed = parseFloat(rawValue);

    if (isNaN(parsed)) {
      Logger.warn(
        `[ConfigManager] ${name}: Invalid value '${rawValue}', using default ${defaultValue}`
      );
      return defaultValue;
    }

    if (min !== null && parsed < min) {
      Logger.warn(
        `[ConfigManager] ${name}: Value ${parsed} below minimum ${min}, using default ${defaultValue}`
      );
      return defaultValue;
    }

    if (max !== null && parsed > max) {
      Logger.warn(
        `[ConfigManager] ${name}: Value ${parsed} above maximum ${max}, using default ${defaultValue}`
      );
      return defaultValue;
    }

    Logger.debug(`[ConfigManager] ${name}: Set to ${parsed}`);
    return parsed;
  }

  /**
   * Safely parse boolean values
   * @param {string} envKey - Environment variable key
   * @param {boolean} defaultValue - Default value if parsing fails
   * @param {string} name - Configuration parameter name for logging
   * @returns {boolean} Parsed boolean value
   */
  static parseBooleanSafe(envKey, defaultValue, name) {
    const rawValue = import.meta.env[envKey];

    if (rawValue === undefined || rawValue === '') {
      Logger.debug(`[ConfigManager] ${name}: Using default value ${defaultValue}`);
      return defaultValue;
    }

    // Handle various boolean representations
    const normalizedValue = rawValue.toString().toLowerCase().trim();

    if (['true', '1', 'yes', 'on'].includes(normalizedValue)) {
      Logger.debug(`[ConfigManager] ${name}: Set to true`);
      return true;
    }

    if (['false', '0', 'no', 'off'].includes(normalizedValue)) {
      Logger.debug(`[ConfigManager] ${name}: Set to false`);
      return false;
    }

    Logger.warn(
      `[ConfigManager] ${name}: Invalid boolean value '${rawValue}', using default ${defaultValue}`
    );
    return defaultValue;
  }

  /**
   * Safely parse string values with validation
   * @param {string} envKey - Environment variable key
   * @param {string} defaultValue - Default value if parsing fails
   * @param {string} name - Configuration parameter name for logging
   * @returns {string} Parsed string value
   */
  static parseStringSafe(envKey, defaultValue, name) {
    const rawValue = import.meta.env[envKey];

    if (rawValue === undefined || rawValue === '') {
      Logger.debug(`[ConfigManager] ${name}: Using default value '${defaultValue}'`);
      return defaultValue;
    }

    const trimmedValue = rawValue.toString().trim();

    if (trimmedValue === '') {
      Logger.warn(`[ConfigManager] ${name}: Empty value provided, using default '${defaultValue}'`);
      return defaultValue;
    }

    Logger.debug(`[ConfigManager] ${name}: Set to '${trimmedValue}'`);
    return trimmedValue;
  }

  /**
   * Safely parse string values with enum validation
   * @param {string} envKey - Environment variable key
   * @param {string} defaultValue - Default value if parsing fails
   * @param {string} name - Configuration parameter name for logging
   * @param {Array<string>} allowedValues - Array of allowed values
   * @returns {string} Parsed and validated string value
   */
  static parseStringWithValidation(envKey, defaultValue, name, allowedValues) {
    const rawValue = import.meta.env[envKey];

    if (rawValue === undefined || rawValue === '') {
      Logger.debug(`[ConfigManager] ${name}: Using default value '${defaultValue}'`);
      return defaultValue;
    }

    const trimmedValue = rawValue.toString().trim();

    if (trimmedValue === '') {
      Logger.warn(`[ConfigManager] ${name}: Empty value provided, using default '${defaultValue}'`);
      return defaultValue;
    }

    if (!allowedValues.includes(trimmedValue)) {
      Logger.warn(
        `[ConfigManager] ${name}: Invalid value '${trimmedValue}', must be one of: ${allowedValues.join(', ')}. Using default '${defaultValue}'`
      );
      return defaultValue;
    }

    Logger.debug(`[ConfigManager] ${name}: Set to '${trimmedValue}'`);
    return trimmedValue;
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
        Logger.warn(
          '[ConfigManager] WARNING: DEBUG_MODE is enabled in production - this may impact performance and security'
        );
      }

      if (this.PHYSICS_DEBUG) {
        Logger.warn(
          '[ConfigManager] WARNING: PHYSICS_DEBUG is enabled in production - this will impact performance'
        );
      }

      if (this.SHOW_FPS || this.SHOW_DEBUG_INFO) {
        Logger.warn('[ConfigManager] WARNING: Debug UI elements are enabled in production');
      }

      if (this.LOG_LEVEL === 'debug') {
        Logger.warn(
          '[ConfigManager] WARNING: LOG_LEVEL is set to debug in production - this may impact performance'
        );
      }
    }
  }

  /**
   * Load failsafe defaults when initialization fails
   */
  static loadFailsafeDefaults() {
    Logger.warn('[ConfigManager] Loading failsafe defaults due to initialization failure');

    // Reset initialization state to allow values to be overridden
    this.isInitialized = false;

    // Conservative production-safe defaults
    this.DEBUG_MODE = false;
    this.LOG_LEVEL = 'error';
    this.PHYSICS_DEBUG = false;
    this.AUDIO_ENABLED = true;
    this.STARTING_LIVES = 3;
    this.BASE_SCORE_MULTIPLIER = 1.0;
    this.MAX_PARTICLES = 500; // Lower for safety
    this.OBJECT_POOL_SIZE = 100; // Lower for safety
    this.SHOW_FPS = false;
    this.SHOW_DEBUG_INFO = false;
    this.IS_DEVELOPMENT = false;
    this.IS_PRODUCTION = true;

    // Initialize game constants with safe defaults
    this._initializeGameConfig();
    
    // Mark as initialized again
    this.isInitialized = true;
  }

  /**
   * Comprehensive validation using schema rules
   * @returns {boolean} True if all validations pass, false otherwise
   */
  static validate() {
    this.validationErrors = [];
    let isValid = true;

    // Validate each parameter against schema
    for (const [key, schema] of Object.entries(this.SCHEMA)) {
      const value = this[key];
      const result = this.validateParameter(key, value, schema);

      if (!result.valid) {
        this.validationErrors.push(result.error);
        isValid = false;
      }
    }

    // Additional cross-parameter validations
    if (this.MAX_PARTICLES < this.OBJECT_POOL_SIZE) {
      const error =
        'MAX_PARTICLES should be greater than or equal to OBJECT_POOL_SIZE for optimal performance';
      Logger.warn(`[ConfigManager] ${error}`);
      // This is a warning, not a validation failure
    }

    if (this.validationErrors.length > 0) {
      Logger.error('[ConfigManager] Validation errors found:', this.validationErrors);
    }

    return isValid;
  }

  /**
   * Validate a single parameter against its schema
   * @param {string} key - Parameter key
   * @param {any} value - Parameter value
   * @param {Object} schema - Schema definition
   * @returns {Object} Validation result with valid flag and error message
   */
  static validateParameter(key, value, schema) {
    // Type validation
    if (schema.type === 'boolean' && typeof value !== 'boolean') {
      return { valid: false, error: `${key}: Expected boolean, got ${typeof value}` };
    }

    if (schema.type === 'number' && typeof value !== 'number') {
      return { valid: false, error: `${key}: Expected number, got ${typeof value}` };
    }

    if (schema.type === 'string' && typeof value !== 'string') {
      return { valid: false, error: `${key}: Expected string, got ${typeof value}` };
    }

    // Range validation for numbers
    if (schema.type === 'number') {
      if (schema.min !== undefined && value < schema.min) {
        return { valid: false, error: `${key}: Value ${value} is below minimum ${schema.min}` };
      }

      if (schema.max !== undefined && value > schema.max) {
        return { valid: false, error: `${key}: Value ${value} is above maximum ${schema.max}` };
      }
    }

    // Enum validation for strings
    if (schema.values && !schema.values.includes(value)) {
      return {
        valid: false,
        error: `${key}: Value '${value}' not in allowed values: ${schema.values.join(', ')}`,
      };
    }

    return { valid: true };
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