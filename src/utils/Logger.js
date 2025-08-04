import Environment from '../config/Environment.js';

/**
 * Environment-aware logging system
 * Replaces console.log usage throughout the application
 * Respects environment configuration for log levels and debug mode
 */
class Logger {
  static isInitialized = false;
  static debugMode = false;
  static logLevel = 'info';
  static levels = { debug: 0, info: 1, warn: 2, error: 3 };

  /**
   * Initialize the logger with environment configuration
   * Must be called before using any logging methods
   */
  static init() {
    if (this.isInitialized) {
      alert('ALREADY INITED');
      return;
    }

    // Get configuration from Environment (which should be initialized first)
    this.debugMode = Environment.DEBUG_MODE || false;
    this.logLevel = Environment.LOG_LEVEL || 'info';

    // Validate log level
    if (!this.levels.hasOwnProperty(this.logLevel)) {
      console.error(`Invalid log level: ${this.logLevel}. Defaulting to 'info'.`);
      this.logLevel = 'info';
    }

    this.isInitialized = true;

    // Log initialization in development
    if (this.debugMode) {
      this.info('Logger initialized', {
        debugMode: this.debugMode,
        logLevel: this.logLevel,
        environment: Environment.IS_DEVELOPMENT ? 'development' : 'production',
      });
    }
  }

  /**
   * Check if a log level should be output
   * @param {string} level - Log level to check
   * @returns {boolean} True if should log, false otherwise
   */
  static shouldLog(level) {
    if (!this.isInitialized) {
      console.error('Logger not initialized. Call Logger.init() first.');
      return false;
    }

    return this.levels[level] >= this.levels[this.logLevel];
  }

  /**
   * Format log message with timestamp and context
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {...any} args - Additional arguments
   * @returns {Array} Formatted message and arguments
   */
  static formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString().substr(11, 8); // HH:MM:SS format
    const prefix = `${timestamp} [${level.toUpperCase()}]`;
    return [prefix, message, ...args];
  }

  /**
   * Debug level logging - only shows in development with debug mode enabled
   * @param {string} message - Debug message
   * @param {...any} args - Additional arguments
   */
  static debug(message, ...args) {
    if (this.debugMode && this.shouldLog('debug')) {
      const formatted = this.formatMessage('debug', message, ...args);
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
      console.error('❌', ...formatted);
    }
  }

  /**
   * Performance timing start
   * @param {string} label - Timer label
   */
  static time(label) {
    if (this.debugMode && this.shouldLog('debug')) {
      console.time(`⏱️ ${label}`);
    }
  }

  /**
   * Performance timing end
   * @param {string} label - Timer label
   */
  static timeEnd(label) {
    if (this.debugMode && this.shouldLog('debug')) {
      console.timeEnd(`⏱️ ${label}`);
    }
  }

  /**
   * Group logging for related messages
   * @param {string} label - Group label
   */
  static group(label) {
    if (this.debugMode && this.shouldLog('debug')) {
      console.group(`📁 ${label}`);
    }
  }

  /**
   * End group logging
   */
  static groupEnd() {
    if (this.debugMode && this.shouldLog('debug')) {
      console.groupEnd();
    }
  }

  /**
   * Table logging for structured data
   * @param {Object|Array} data - Data to display in table format
   */
  static table(data) {
    if (this.debugMode && this.shouldLog('debug')) {
      console.table(data);
    }
  }
}

export default Logger;
