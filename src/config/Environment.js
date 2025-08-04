import Logger from '@/utils/Logger.js';

/**
 * Environment Configuration Manager
 * Handles environment variables and provides defaults for development/production
 *
 * Features:
 * - Auto-initialization with comprehensive validation
 * - Logger system integration for consistent error reporting
 * - Production safety with secure defaults
 * - Type-safe parsing with bounds checking
 * - Comprehensive schema validation for all parameters
 */
export default class Environment {
  // Configuration schema with validation rules
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
    AUDIO_ENABLED: { type: 'boolean', default: true, description: 'Enable audio system' },

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

  /**
   * Initialize environment configuration with comprehensive validation
   * Auto-initializes on first access if not already initialized
   */
  static init() {
    if (this.isInitialized) {
      return;
    }

    Logger.debug('[Environment] Initializing configuration system...');

    try {
      this.validationErrors = [];

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

      // Comprehensive validation
      const isValid = this.validate();

      if (isValid) {
        this.isInitialized = true;
        Logger.info('[Environment] Configuration initialized successfully', {
          debugMode: this.DEBUG_MODE,
          logLevel: this.LOG_LEVEL,
          environment: this.IS_DEVELOPMENT ? 'development' : 'production',
        });
      } else {
        Logger.error(
          '[Environment] Configuration validation failed with errors:',
          this.validationErrors
        );
        throw new Error(`Environment validation failed: ${this.validationErrors.join(', ')}`);
      }
    } catch (error) {
      Logger.error('[Environment] Failed to initialize configuration:', error);
      this.loadFailsafeDefaults();
      this.isInitialized = true;
    }
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

    return {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      environment: this.IS_DEVELOPMENT ? 'development' : 'production',
      configuration: this.getConfig(),
      schema: this.getSchema(),
      validation: this.getValidationStatus(),
    };
  }

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
      Logger.debug(`[Environment] ${name}: Using default value ${defaultValue}`);
      return defaultValue;
    }

    const parsed = parseInt(rawValue, 10);

    if (isNaN(parsed)) {
      Logger.warn(
        `[Environment] ${name}: Invalid value '${rawValue}', using default ${defaultValue}`
      );
      return defaultValue;
    }

    if (min !== null && parsed < min) {
      Logger.warn(
        `[Environment] ${name}: Value ${parsed} below minimum ${min}, using default ${defaultValue}`
      );
      return defaultValue;
    }

    if (max !== null && parsed > max) {
      Logger.warn(
        `[Environment] ${name}: Value ${parsed} above maximum ${max}, using default ${defaultValue}`
      );
      return defaultValue;
    }

    Logger.debug(`[Environment] ${name}: Set to ${parsed}`);
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
      Logger.debug(`[Environment] ${name}: Using default value ${defaultValue}`);
      return defaultValue;
    }

    const parsed = parseFloat(rawValue);

    if (isNaN(parsed)) {
      Logger.warn(
        `[Environment] ${name}: Invalid value '${rawValue}', using default ${defaultValue}`
      );
      return defaultValue;
    }

    if (min !== null && parsed < min) {
      Logger.warn(
        `[Environment] ${name}: Value ${parsed} below minimum ${min}, using default ${defaultValue}`
      );
      return defaultValue;
    }

    if (max !== null && parsed > max) {
      Logger.warn(
        `[Environment] ${name}: Value ${parsed} above maximum ${max}, using default ${defaultValue}`
      );
      return defaultValue;
    }

    Logger.debug(`[Environment] ${name}: Set to ${parsed}`);
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
      Logger.debug(`[Environment] ${name}: Using default value ${defaultValue}`);
      return defaultValue;
    }

    // Handle various boolean representations
    const normalizedValue = rawValue.toString().toLowerCase().trim();

    if (['true', '1', 'yes', 'on'].includes(normalizedValue)) {
      Logger.debug(`[Environment] ${name}: Set to true`);
      return true;
    }

    if (['false', '0', 'no', 'off'].includes(normalizedValue)) {
      Logger.debug(`[Environment] ${name}: Set to false`);
      return false;
    }

    Logger.warn(
      `[Environment] ${name}: Invalid boolean value '${rawValue}', using default ${defaultValue}`
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
      Logger.debug(`[Environment] ${name}: Using default value '${defaultValue}'`);
      return defaultValue;
    }

    const trimmedValue = rawValue.toString().trim();

    if (trimmedValue === '') {
      Logger.warn(`[Environment] ${name}: Empty value provided, using default '${defaultValue}'`);
      return defaultValue;
    }

    Logger.debug(`[Environment] ${name}: Set to '${trimmedValue}'`);
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
      Logger.debug(`[Environment] ${name}: Using default value '${defaultValue}'`);
      return defaultValue;
    }

    const trimmedValue = rawValue.toString().trim();

    if (trimmedValue === '') {
      Logger.warn(`[Environment] ${name}: Empty value provided, using default '${defaultValue}'`);
      return defaultValue;
    }

    if (!allowedValues.includes(trimmedValue)) {
      Logger.warn(
        `[Environment] ${name}: Invalid value '${trimmedValue}', must be one of: ${allowedValues.join(', ')}. Using default '${defaultValue}'`
      );
      return defaultValue;
    }

    Logger.debug(`[Environment] ${name}: Set to '${trimmedValue}'`);
    return trimmedValue;
  }

  /**
   * Check for production safety issues and warn about dangerous configurations
   */
  static checkProductionSafety() {
    if (this.IS_PRODUCTION) {
      if (this.DEBUG_MODE) {
        Logger.warn(
          '[Environment] WARNING: DEBUG_MODE is enabled in production - this may impact performance and security'
        );
      }

      if (this.PHYSICS_DEBUG) {
        Logger.warn(
          '[Environment] WARNING: PHYSICS_DEBUG is enabled in production - this will impact performance'
        );
      }

      if (this.SHOW_FPS || this.SHOW_DEBUG_INFO) {
        Logger.warn('[Environment] WARNING: Debug UI elements are enabled in production');
      }

      if (this.LOG_LEVEL === 'debug') {
        Logger.warn(
          '[Environment] WARNING: LOG_LEVEL is set to debug in production - this may impact performance'
        );
      }
    }
  }

  /**
   * Load failsafe defaults when initialization fails
   */
  static loadFailsafeDefaults() {
    Logger.warn('[Environment] Loading failsafe defaults due to initialization failure');

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
      Logger.warn(`[Environment] ${error}`);
      // This is a warning, not a validation failure
    }

    if (this.validationErrors.length > 0) {
      Logger.error('[Environment] Validation errors found:', this.validationErrors);
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
