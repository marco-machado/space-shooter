/**
 * Production-ready Logger with factory pattern and instance isolation.
 * Eliminates race conditions, improves performance, and adds comprehensive features.
 * Maintains full backward compatibility with existing Logger.scope().method() API.
 */

// Internal cache for performance optimization
const _cache = {
  timestamp: null,
  lastUpdate: 0,
  UPDATE_INTERVAL: 1000, // Update timestamp every second
  scopeLabels: new Map(), // Memoized scope labels
  levelNumbers: null,
};

// Environment configuration
let _envConfig = null;

/**
 * Scoped Logger instance - isolated from other scoped instances.
 * @class
 * @classdesc Provides isolated logging functionality with security, rate limiting, and formatting features.
 */
class Logger {
  /**
   * Create a new Logger instance.
   * @param {string|null} scope - The scope name for this logger instance
   * @param {Object} deps - Dependency injection object
   * @param {Object} deps.console - Console interface to use
   * @param {Object} deps.sanitizer - Sanitizer for security
   * @param {Object} deps.rateLimiter - Rate limiter for log throttling
   * @param {Object} deps.formatter - Message formatter
   */
  constructor(scope, deps = {}) {
    this.scope = scope;
    this.deps = {
      console: deps.console || globalThis.console,
      sanitizer: deps.sanitizer || defaultSanitizer,
      rateLimiter: deps.rateLimiter || defaultRateLimiter,
      formatter: deps.formatter || defaultFormatter,
    };
  }

  /**
   * Log a debug message.
   * @param {string} message - The debug message to log
   * @param {...*} args - Additional arguments to log
   * @returns {void}
   */
  debug(message, ...args) {
    this.#log('debug', '🔍', message, ...args);
  }

  /**
   * Log an info message.
   * @param {string} message - The info message to log
   * @param {...*} args - Additional arguments to log
   * @returns {void}
   */
  info(message, ...args) {
    this.#log('info', 'ℹ️', message, ...args);
  }

  /**
   * Log a warning message.
   * @param {string} message - The warning message to log
   * @param {...*} args - Additional arguments to log
   * @returns {void}
   */
  warn(message, ...args) {
    this.#log('warn', '⚠️', message, ...args);
  }

  /**
   * Log an error message.
   * @param {string} message - The error message to log
   * @param {...*} args - Additional arguments to log
   * @returns {void}
   */
  error(message, ...args) {
    this.#log('error', '❌', message, ...args);
  }

  /**
   * Start a timing operation (debug mode only).
   * @param {string} label - The label for the timing operation
   * @returns {void}
   */
  time(label) {
    if (!shouldLog('debug')) return;
    this.deps.console.time(`⏱️ ${label}`);
  }

  /**
   * End a timing operation (debug mode only).
   * @param {string} label - The label for the timing operation
   * @returns {void}
   */
  timeEnd(label) {
    if (!shouldLog('debug')) return;
    this.deps.console.timeEnd(`⏱️ ${label}`);
  }

  /**
   * Start a console group (debug mode only).
   * @param {string} label - The label for the console group
   * @returns {void}
   */
  group(label) {
    if (!shouldLog('debug')) return;
    this.deps.console.group(`📁 ${label}`);
  }

  /**
   * End the current console group (debug mode only).
   * @returns {void}
   */
  groupEnd() {
    if (!shouldLog('debug')) return;
    this.deps.console.groupEnd();
  }

  /**
   * Display data in a table format (debug mode only).
   * @param {*} data - The data to display in table format
   * @returns {void}
   */
  table(data) {
    if (!shouldLog('debug')) return;
    this.deps.console.table(data);
  }

  /**
   * Internal logging method with security, rate limiting, and formatting.
   * @private
   * @param {string} level - The log level (debug, info, warn, error)
   * @param {string} icon - The emoji icon for the log message
   * @param {string} message - The message to log
   * @param {...*} args - Additional arguments to log
   * @returns {void}
   */
  #log(level, icon, message, ...args) {
    // Early return for performance - check before any processing
    if (!shouldLog(level)) return;

    // Rate limiting check
    if (!this.deps.rateLimiter.allow(level, this.scope)) return;

    // Sanitize inputs for security
    const sanitizedMessage = this.deps.sanitizer.sanitize(message);
    const sanitizedArgs = args.map(arg => this.deps.sanitizer.sanitize(arg));

    // Format and output
    const formatted = this.deps.formatter.format(
      level,
      this.scope,
      sanitizedMessage,
      ...sanitizedArgs,
    );
    const method = level === 'debug' ? 'log' : level;
    this.deps.console[method](icon, ...formatted);
  }
}

/**
 * Logger Factory - creates isolated scoped logger instances.
 * @class
 * @classdesc Factory for creating and managing Logger instances with dependency injection and caching.
 */
class LoggerFactory {
  /**
   * Private cache for scoped logger instances.
   * @private
   * @type {Map<string, Logger>}
   */
  #scopeCache;

  /**
   * Create a new LoggerFactory instance.
   * @param {Object} deps - Dependency injection object
   * @param {Object} deps.console - Console interface to use
   * @param {Object} deps.sanitizer - Sanitizer for security
   * @param {Object} deps.rateLimiter - Rate limiter for log throttling
   * @param {Object} deps.formatter - Message formatter
   */
  constructor(deps = {}) {
    this.deps = {
      console: deps.console || globalThis.console,
      sanitizer: deps.sanitizer || defaultSanitizer,
      rateLimiter: deps.rateLimiter || defaultRateLimiter,
      formatter: deps.formatter || defaultFormatter,
    };
    this.#scopeCache = new Map();
  }

  /**
   * Get or create a scoped logger instance.
   * @param {string|null} scopeName - The scope name for the logger
   * @returns {Logger} A Logger instance for the specified scope
   */
  scope(scopeName) {
    if (!this.#scopeCache.has(scopeName)) {
      this.#scopeCache.set(scopeName, new Logger(scopeName, this.deps));
    }
    return this.#scopeCache.get(scopeName);
  }

  /**
   * Log a debug message (global scope).
   * @param {string} message - The debug message to log
   * @param {...*} args - Additional arguments to log
   * @returns {void}
   */
  debug(message, ...args) {
    this.scope(null).debug(message, ...args);
  }

  /**
   * Log an info message (global scope).
   * @param {string} message - The info message to log
   * @param {...*} args - Additional arguments to log
   * @returns {void}
   */
  info(message, ...args) {
    this.scope(null).info(message, ...args);
  }

  /**
   * Log a warning message (global scope).
   * @param {string} message - The warning message to log
   * @param {...*} args - Additional arguments to log
   * @returns {void}
   */
  warn(message, ...args) {
    this.scope(null).warn(message, ...args);
  }

  /**
   * Log an error message (global scope).
   * @param {string} message - The error message to log
   * @param {...*} args - Additional arguments to log
   * @returns {void}
   */
  error(message, ...args) {
    this.scope(null).error(message, ...args);
  }

  /**
   * Start a timing operation (global scope, debug mode only).
   * @param {string} label - The label for the timing operation
   * @returns {void}
   */
  time(label) {
    this.scope(null).time(label);
  }

  /**
   * End a timing operation (global scope, debug mode only).
   * @param {string} label - The label for the timing operation
   * @returns {void}
   */
  timeEnd(label) {
    this.scope(null).timeEnd(label);
  }

  /**
   * Start a console group (global scope, debug mode only).
   * @param {string} label - The label for the console group
   * @returns {void}
   */
  group(label) {
    this.scope(null).group(label);
  }

  /**
   * End the current console group (global scope, debug mode only).
   * @returns {void}
   */
  groupEnd() {
    this.scope(null).groupEnd();
  }

  /**
   * Display data in a table format (global scope, debug mode only).
   * @param {*} data - The data to display in table format
   * @returns {void}
   */
  table(data) {
    this.scope(null).table(data);
  }

  /**
   * Reset internal state for testing purposes.
   * @private
   * @returns {void}
   */
  _clearCacheForTesting() {
    this.#scopeCache.clear();
  }
}

/**
 * Default sanitizer for security - removes sensitive data from logs.
 * @private
 */
const defaultSanitizer = {
  sensitivePatterns: [/api[_-]?key/i, /secret/i, /password/i, /token/i, /auth/i, /credential/i],

  /**
   * Sanitize a value by removing sensitive data.
   * @private
   * @param {*} value - The value to sanitize
   * @returns {*} The sanitized value
   */
  sanitize(value) {
    if (value === null || value === undefined) return value;

    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }

    if (typeof value === 'object') {
      return this.sanitizeObject(value);
    }

    return value;
  },

  /**
   * Sanitize a string value.
   * @private
   * @param {string} str - The string to sanitize
   * @returns {string} The sanitized string
   */
  sanitizeString(str) {
    for (const pattern of this.sensitivePatterns) {
      if (pattern.test(str)) {
        return '[SENSITIVE DATA REDACTED]';
      }
    }
    return str;
  },

  /**
   * Sanitize an object value recursively.
   * @private
   * @param {Object} obj - The object to sanitize
   * @returns {Object} The sanitized object
   */
  sanitizeObject(obj) {
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitize(item));
    }

    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (this.sensitivePatterns.some(pattern => pattern.test(key))) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = this.sanitize(value);
      }
    }
    return result;
  },
};

/**
 * Default rate limiter to prevent log spam.
 * @private
 */
const defaultRateLimiter = {
  limits: new Map(), // level -> { count, resetTime }
  LIMITS_PER_MINUTE: { debug: 1000, info: 500, warn: 100, error: 50 },

  /**
   * Check if a log message should be allowed based on rate limits.
   * @private
   * @param {string} level - The log level
   * @param {string|null} scope - The scope name
   * @returns {boolean} True if the message should be allowed
   */
  allow(level, scope) {
    const key = `${level}:${scope || 'global'}`;
    const now = Date.now();
    const limit = this.LIMITS_PER_MINUTE[level] || 100;

    if (!this.limits.has(key)) {
      this.limits.set(key, { count: 0, resetTime: now + 60000 });
    }

    const entry = this.limits.get(key);

    // Reset counter if minute has passed
    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + 60000;
    }

    entry.count++;
    return entry.count <= limit;
  },
};

/**
 * Default message formatter for log output.
 * @private
 */
const defaultFormatter = {
  /**
   * Format a log message with timestamp and scope.
   * @private
   * @param {string} level - The log level
   * @param {string|null} scope - The scope name
   * @param {string} message - The message to format
   * @param {...*} args - Additional arguments to format
   * @returns {Array} Formatted message components
   */
  format(level, scope, message, ...args) {
    const timestamp = getCachedTimestamp();
    const scopeLabel = getCachedScopeLabel(scope);
    const prefix = `${timestamp} [${level.toUpperCase()}]${scopeLabel}`;
    return [prefix, message, ...args];
  },
};

/**
 * Internal helper functions for Logger functionality.
 * @private
 */

/**
 * Ensure environment configuration is initialized.
 * @private
 * @returns {void}
 */
function ensureEnvConfig() {
  if (_envConfig !== null) return;

  try {
    let env;
    try {
      env = import.meta.env || {};
    } catch {
      // eslint-disable-next-line no-undef
      env = typeof process !== 'undefined' && process.env ? process.env : {};
    }

    const debugMode = env.VITE_DEBUG_MODE === 'true';
    let logLevel = env.VITE_LOG_LEVEL || 'info';

    // Validate log level
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    if (!levels.hasOwnProperty(logLevel)) {
      globalThis.console?.error(`Invalid log level: ${logLevel}. Defaulting to 'info'.`);
      logLevel = 'info';
    }

    _envConfig = { debugMode, logLevel, levels };
    _cache.levelNumbers = levels;

    // Log initialization in development
    if (debugMode && levels['debug'] >= levels[logLevel]) {
      const timestamp = new Date().toISOString().slice(11, 19);
      const isDev = env.DEV || env.NODE_ENV === 'development';

      globalThis.console?.log('🔍', `${timestamp} [DEBUG]`, 'Logger: auto-initialized', {
        debugMode,
        logLevel,
        environment: isDev ? 'development' : 'production',
      });
    }
  } catch (error) {
    globalThis.console?.error('Logger initialization failed, using defaults:', error);
    _envConfig = {
      debugMode: false,
      logLevel: 'info',
      levels: { debug: 0, info: 1, warn: 2, error: 3 },
    };
    _cache.levelNumbers = _envConfig.levels;
  }
}

/**
 * Check if a log level should be output based on configuration.
 * @private
 * @param {string} level - The log level to check
 * @returns {boolean} True if the level should be logged
 */
function shouldLog(level) {
  ensureEnvConfig();
  if (level === 'debug' && !_envConfig.debugMode) return false;
  return _envConfig.levels[level] >= _envConfig.levels[_envConfig.logLevel];
}

/**
 * Get cached timestamp for performance optimization.
 * @private
 * @returns {string} Cached timestamp in HH:MM:SS format
 */
function getCachedTimestamp() {
  const now = Date.now();
  if (_cache.timestamp === null || now - _cache.lastUpdate > _cache.UPDATE_INTERVAL) {
    _cache.timestamp = new Date().toISOString().slice(11, 19); // HH:MM:SS format
    _cache.lastUpdate = now;
  }
  return _cache.timestamp;
}

/**
 * Get cached scope label for performance optimization.
 * @private
 * @param {string|null} scope - The scope name
 * @returns {string} Cached scope label or empty string
 */
function getCachedScopeLabel(scope) {
  if (!scope) return '';

  if (!_cache.scopeLabels.has(scope)) {
    _cache.scopeLabels.set(scope, `[${scope}]`);
  }
  return _cache.scopeLabels.get(scope);
}

// Create factory instance
const factory = new LoggerFactory();

// Add static properties to factory for compatibility
factory.isInitialized = true;

// Define properties using Object.defineProperty for backward compatibility
Object.defineProperty(factory, 'debugMode', {
  get() {
    ensureEnvConfig();
    return _envConfig.debugMode;
  },
  configurable: true,
});

Object.defineProperty(factory, 'logLevel', {
  get() {
    ensureEnvConfig();
    return _envConfig.logLevel;
  },
  configurable: true,
});

Object.defineProperty(factory, 'levels', {
  get() {
    ensureEnvConfig();
    return _envConfig.levels;
  },
  configurable: true,
});

// Add legacy methods for compatibility
factory.shouldLog = shouldLog;
factory.formatMessage = defaultFormatter.format;
factory._ensureInitialized = ensureEnvConfig;

// Add internal test helper
factory._resetForTesting = function () {
  _envConfig = null;
  _cache.timestamp = null;
  _cache.lastUpdate = 0;
  _cache.scopeLabels.clear();
  factory._clearCacheForTesting();
};

// Factory instance access for testing
factory._factory = factory;

export default factory;
