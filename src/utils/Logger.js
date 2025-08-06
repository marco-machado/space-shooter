/**
 * Utility class for logging messages with different levels, categories, and scopes.
 * Supports dynamic configuration via environment variables and URL parameters.
 * Automatically formats log output with a timestamp, category, and context.
 */
class Logger {
  static isInitialized = false;
  static debugMode = false;
  static logLevel = 'info';
  static levels = { debug: 0, info: 1, warn: 2, error: 3 };
  static scopeName = null;

  /**
   * Private method to ensure Logger is initialized
   * Automatically called by all logging methods
   */
  static _ensureInitialized() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Get configuration directly from environment variables
      // Handle both Vite (import.meta.env) and Node.js (process.env) environments
      let env;
      try {
        env = import.meta.env || {};
      } catch {
        // eslint-disable-next-line no-undef
        env = typeof process !== 'undefined' && process.env ? process.env : {};
      }

      this.debugMode = env.VITE_DEBUG_MODE === 'true';
      this.logLevel = env.VITE_LOG_LEVEL || 'info';

      // Validate log level
      if (!this.levels.hasOwnProperty(this.logLevel)) {
        console.error(`Invalid log level: ${this.logLevel}. Defaulting to 'info'.`);
        this.logLevel = 'info';
      }

      this.isInitialized = true;

      // Log initialization in development (avoid recursive call during initialization)
      if (this.debugMode && this.levels['debug'] >= this.levels[this.logLevel]) {
        const timestamp = new Date().toISOString().slice(11, 19);
        const isDev = env.DEV || env.NODE_ENV === 'development';

        // eslint-disable-next-line no-console
        console.log('🔍', `${timestamp} [DEBUG]`, 'Logger: auto-initialized', {
          debugMode: this.debugMode,
          logLevel: this.logLevel,
          environment: isDev ? 'development' : 'production',
        });
      }
    } catch (error) {
      // Graceful fallback if environment access fails
      console.error('Logger initialization failed, using defaults:', error);
      this.debugMode = false;
      this.logLevel = 'info';
      this.isInitialized = true;
    }
  }



  /**
   * Sets the logging scope for the Logger.
   * This allows for categorizing log messages under a specific scope.
   *
   * @param {string} scope - The name of the scope to set for the logger.
   * @returns {Logger} The Logger instance, allowing for method chaining.
   */

  static scope(scope) {
    this.scopeName = scope;
    return this;
  }

  /**
   * Debug level logging - only shows in development with debug mode enabled
   * @param {string} message - Debug message
   * @param {...any} args - Additional arguments
   */
  static debug(message, ...args) {
    if (this.debugMode && this.shouldLog('debug')) {
      const formatted = this.formatMessage('debug', message, ...args);
      // eslint-disable-next-line no-console
      console.log('🔍', ...formatted);
    }
  }

  /**
   * Info level logging - general information
   * @param {string} message - Info message
   * @param {...any} args - Additional arguments
   */
  static info(message, ...args) {
    if (this.shouldLog('info')) {
      const formatted = this.formatMessage('info', message, ...args);
      // eslint-disable-next-line no-console
      console.info('ℹ️', ...formatted);
    }
  }

  /**
   * Warning level logging - potential issues
   * @param {string} message - Warning message
   * @param {...any} args - Additional arguments
   */
  static warn(message, ...args) {
    if (this.shouldLog('warn')) {
      const formatted = this.formatMessage('warn', message, ...args);
      // eslint-disable-next-line no-console
      console.warn('⚠️', ...formatted);
    }
  }

  /**
   * Error level logging - serious problems
   * @param {string} message - Error message
   * @param {...any} args - Additional arguments
   */
  static error(message, ...args) {
    if (this.shouldLog('error')) {
      const formatted = this.formatMessage('error', message, ...args);
      // eslint-disable-next-line no-console
      console.error('❌', ...formatted);
    }
  }

  /**
   * Check if a log level should be output
   * @param {string} level - Log level to check
   * @returns {boolean} True if should log, false otherwise
   */
  static shouldLog(level) {
    this._ensureInitialized();
    return this.levels[level] >= this.levels[this.logLevel];
  }

  /**
   * Format log message with timestamp and optional scope
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {...any} args - Additional arguments
   * @returns {Array} Formatted message and arguments
   */
  static formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString().slice(11, 19); // HH:MM:SS format
    const scopeLabel = this.scopeName ? `[${this.scopeName.toUpperCase()}]` : '';
    const prefix = `${timestamp} [${level.toUpperCase()}]${scopeLabel}`;
    return [prefix, message, ...args];
  }

  /**
   * Performance timing start
   * @param {string} label - Timer label
   */
  static time(label) {
    this._ensureInitialized();
    if (this.debugMode && this.shouldLog('debug')) {
      // eslint-disable-next-line no-console
      console.time(`⏱️ ${label}`);
    }
  }

  /**
   * Performance timing end
   * @param {string} label - Timer label
   */
  static timeEnd(label) {
    this._ensureInitialized();
    if (this.debugMode && this.shouldLog('debug')) {
      // eslint-disable-next-line no-console
      console.timeEnd(`⏱️ ${label}`);
    }
  }

  /**
   * Group logging for related messages
   * @param {string} label - Group label
   */
  static group(label) {
    this._ensureInitialized();
    if (this.debugMode && this.shouldLog('debug')) {
      // eslint-disable-next-line no-console
      console.group(`📁 ${label}`);
    }
  }

  /**
   * End group logging
   */
  static groupEnd() {
    this._ensureInitialized();
    if (this.debugMode && this.shouldLog('debug')) {
      // eslint-disable-next-line no-console
      console.groupEnd();
    }
  }

  /**
   * Table logging for structured data
   * @param {Object|Array} data - Data to display in table format
   */
  static table(data) {
    this._ensureInitialized();
    if (this.debugMode && this.shouldLog('debug')) {
      // eslint-disable-next-line no-console
      console.table(data);
    }
  }

}


export default Logger;
