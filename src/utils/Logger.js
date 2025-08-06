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
  levelNumbers: null
};

// Environment configuration
let _envConfig = null;

/**
 * Scoped Logger instance - isolated from other scoped instances
 */
class ScopedLogger {
  constructor(scope, deps = {}) {
    this.scope = scope;
    this.deps = {
      console: deps.console || globalThis.console,
      sanitizer: deps.sanitizer || defaultSanitizer,
      rateLimiter: deps.rateLimiter || defaultRateLimiter,
      formatter: deps.formatter || defaultFormatter
    };
  }

  debug(message, ...args) {
    this._log('debug', '🔍', message, ...args);
  }

  info(message, ...args) {
    this._log('info', 'ℹ️', message, ...args);
  }

  warn(message, ...args) {
    this._log('warn', '⚠️', message, ...args);
  }

  error(message, ...args) {
    this._log('error', '❌', message, ...args);
  }

  time(label) {
    if (!_shouldLog('debug')) return;
    this.deps.console.time(`⏱️ ${label}`);
  }

  timeEnd(label) {
    if (!_shouldLog('debug')) return;
    this.deps.console.timeEnd(`⏱️ ${label}`);
  }

  group(label) {
    if (!_shouldLog('debug')) return;
    this.deps.console.group(`📁 ${label}`);
  }

  groupEnd() {
    if (!_shouldLog('debug')) return;
    this.deps.console.groupEnd();
  }

  table(data) {
    if (!_shouldLog('debug')) return;
    this.deps.console.table(data);
  }

  _log(level, icon, message, ...args) {
    // Early return for performance - check before any processing
    if (!_shouldLog(level)) return;

    // Rate limiting check
    if (!this.deps.rateLimiter.allow(level, this.scope)) return;

    // Sanitize inputs for security
    const sanitizedMessage = this.deps.sanitizer.sanitize(message);
    const sanitizedArgs = args.map(arg => this.deps.sanitizer.sanitize(arg));

    // Format and output
    const formatted = this.deps.formatter.format(level, this.scope, sanitizedMessage, ...sanitizedArgs);
    const method = level === 'debug' ? 'log' : level;
    this.deps.console[method](icon, ...formatted);
  }
}

/**
 * Logger Factory - creates isolated scoped logger instances
 */
class LoggerFactory {
  constructor(deps = {}) {
    this.deps = {
      console: deps.console || globalThis.console,
      sanitizer: deps.sanitizer || defaultSanitizer,
      rateLimiter: deps.rateLimiter || defaultRateLimiter,
      formatter: deps.formatter || defaultFormatter
    };
    this._scopeCache = new Map();
  }

  scope(scopeName) {
    if (!this._scopeCache.has(scopeName)) {
      this._scopeCache.set(scopeName, new ScopedLogger(scopeName, this.deps));
    }
    return this._scopeCache.get(scopeName);
  }

  // Global logger methods for non-scoped usage
  debug(message, ...args) { this.scope(null).debug(message, ...args); }
  info(message, ...args) { this.scope(null).info(message, ...args); }
  warn(message, ...args) { this.scope(null).warn(message, ...args); }
  error(message, ...args) { this.scope(null).error(message, ...args); }
  time(label) { this.scope(null).time(label); }
  timeEnd(label) { this.scope(null).timeEnd(label); }
  group(label) { this.scope(null).group(label); }
  groupEnd() { this.scope(null).groupEnd(); }
  table(data) { this.scope(null).table(data); }
}

// Default dependencies
const defaultSanitizer = {
  sensitivePatterns: [
    /api[_-]?key/i,
    /secret/i,
    /password/i,
    /token/i,
    /auth/i,
    /credential/i
  ],

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

  sanitizeString(str) {
    for (const pattern of this.sensitivePatterns) {
      if (pattern.test(str)) {
        return '[SENSITIVE DATA REDACTED]';
      }
    }
    return str;
  },

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
  }
};

const defaultRateLimiter = {
  limits: new Map(), // level -> { count, resetTime }
  LIMITS_PER_MINUTE: { debug: 1000, info: 500, warn: 100, error: 50 },

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
  }
};

const defaultFormatter = {
  format(level, scope, message, ...args) {
    const timestamp = _getCachedTimestamp();
    const scopeLabel = _getCachedScopeLabel(scope);
    const prefix = `${timestamp} [${level.toUpperCase()}]${scopeLabel}`;
    return [prefix, message, ...args];
  }
};

// Internal helper functions
function _ensureEnvConfig() {
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
      levels: { debug: 0, info: 1, warn: 2, error: 3 }
    };
    _cache.levelNumbers = _envConfig.levels;
  }
}

function _shouldLog(level) {
  _ensureEnvConfig();
  if (level === 'debug' && !_envConfig.debugMode) return false;
  return _envConfig.levels[level] >= _envConfig.levels[_envConfig.logLevel];
}

function _getCachedTimestamp() {
  const now = Date.now();
  if (_cache.timestamp === null || now - _cache.lastUpdate > _cache.UPDATE_INTERVAL) {
    _cache.timestamp = new Date().toISOString().slice(11, 19); // HH:MM:SS format
    _cache.lastUpdate = now;
  }
  return _cache.timestamp;
}

function _getCachedScopeLabel(scope) {
  if (!scope) return '';
  
  if (!_cache.scopeLabels.has(scope)) {
    _cache.scopeLabels.set(scope, `[${scope.toUpperCase()}]`);
  }
  return _cache.scopeLabels.get(scope);
}

// Create factory instance
const factory = new LoggerFactory();

// Backward compatibility layer - maintains exact API
const Logger = {
  // Factory instance access for testing
  _factory: factory,

  // Internal test helper to reset state
  _resetForTesting() {
    _envConfig = null;
    _cache.timestamp = null;
    _cache.lastUpdate = 0;
    _cache.scopeLabels.clear();
    factory._scopeCache.clear();
  },

  // Static properties for compatibility
  get isInitialized() {
    _ensureEnvConfig();
    return true;
  },

  get debugMode() {
    _ensureEnvConfig();
    return _envConfig.debugMode;
  },

  get logLevel() {
    _ensureEnvConfig();
    return _envConfig.logLevel;
  },

  get levels() {
    _ensureEnvConfig();
    return _envConfig.levels;
  },

  // Scope method - returns isolated scoped logger
  scope(scopeName) {
    return factory.scope(scopeName);
  },

  // Global methods for non-scoped usage
  debug: factory.debug.bind(factory),
  info: factory.info.bind(factory),
  warn: factory.warn.bind(factory),
  error: factory.error.bind(factory),
  time: factory.time.bind(factory),
  timeEnd: factory.timeEnd.bind(factory),
  group: factory.group.bind(factory),
  groupEnd: factory.groupEnd.bind(factory),
  table: factory.table.bind(factory),

  // Legacy methods for compatibility
  shouldLog: _shouldLog,
  formatMessage: defaultFormatter.format,
  _ensureInitialized: _ensureEnvConfig
};

export default Logger;