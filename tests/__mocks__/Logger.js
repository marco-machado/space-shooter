/**
 * Comprehensive Logger Mock for Testing
 * Updated for new Logger architecture with factory pattern and scope isolation
 * 
 * Features:
 * - All Logger methods as Vitest spies
 * - Mock scope isolation matching new architecture
 * - Call history tracking
 * - Assertion helpers for common test patterns
 * - Backward compatibility with existing tests
 */

import { vi } from 'vitest';

/**
 * Scoped logger mock that mimics Logger behavior
 */
class MockLogger {
  constructor(scope) {
    this.scope = scope;
    this.debug = vi.fn();
    this.info = vi.fn();
    this.warn = vi.fn();
    this.error = vi.fn();
    this.time = vi.fn();
    this.timeEnd = vi.fn();
    this.group = vi.fn();
    this.groupEnd = vi.fn();
    this.table = vi.fn();
  }

  mockClear() {
    Object.keys(this).forEach(key => {
      if (typeof this[key] === 'function' && this[key].mockClear) {
        this[key].mockClear();
      }
    });
  }
}

/**
 * Mock factory that creates isolated scoped logger instances
 */
class MockLoggerFactory {
  constructor() {
    this._scopeCache = new Map();
    this.debug = vi.fn();
    this.info = vi.fn();
    this.warn = vi.fn();
    this.error = vi.fn();
    this.time = vi.fn();
    this.timeEnd = vi.fn();
    this.group = vi.fn();
    this.groupEnd = vi.fn();
    this.table = vi.fn();
  }

  scope(scopeName) {
    if (!this._scopeCache.has(scopeName)) {
      this._scopeCache.set(scopeName, new MockLogger(scopeName));
    }
    return this._scopeCache.get(scopeName);
  }

  clearAll() {
    // Clear global methods
    Object.keys(this).forEach(key => {
      if (typeof this[key] === 'function' && this[key].mockClear) {
        this[key].mockClear();
      }
    });

    // Clear all scoped loggers
    for (const scopedLogger of this._scopeCache.values()) {
      scopedLogger.mockClear();
    }
  }
}

/**
 * Main Logger mock that maintains backward compatibility
 */
const mockFactory = new MockLoggerFactory();

export const loggerMock = {
  // Factory instance for testing
  _factory: mockFactory,

  // Static properties
  isInitialized: true,
  debugMode: true,
  logLevel: 'debug',
  levels: { debug: 0, info: 1, warn: 2, error: 3 },

  // Scope method - returns isolated scoped logger
  scope: vi.fn((scopeName) => mockFactory.scope(scopeName)),

  // Global methods for non-scoped usage
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  time: vi.fn(),
  timeEnd: vi.fn(),
  group: vi.fn(),
  groupEnd: vi.fn(),
  table: vi.fn(),

  // Legacy methods for compatibility
  shouldLog: vi.fn().mockReturnValue(true),
  formatMessage: vi.fn((level, message, ...args) => [`[${level.toUpperCase()}]`, message, ...args]),
  _ensureInitialized: vi.fn()
};

/**
 * Reset all Logger mocks
 * Call this in beforeEach to ensure clean state
 */
export function resetLoggerMock() {
  // Reset global methods
  Object.keys(loggerMock).forEach(key => {
    if (typeof loggerMock[key] === 'function' && loggerMock[key].mockClear) {
      loggerMock[key].mockClear();
    }
  });

  // Reset factory
  mockFactory.clearAll();
  mockFactory._scopeCache.clear();
}

/**
 * Helper functions for common Logger test assertions
 */
export const loggerAssertions = {
  /**
   * Assert that Logger.debug was called with message containing text
   * @param {string} expectedText - Text that should be in the debug message
   */
  expectDebugContaining(expectedText) {
    return expect(loggerMock.debug).toHaveBeenCalledWith(
      expect.stringContaining(expectedText)
    );
  },

  /**
   * Assert that Logger.warn was called with message containing text
   * @param {string} expectedText - Text that should be in the warning message
   */
  expectWarnContaining(expectedText) {
    return expect(loggerMock.warn).toHaveBeenCalledWith(
      expect.stringContaining(expectedText)
    );
  },

  /**
   * Assert that Logger.error was called with message containing text
   * @param {string} expectedText - Text that should be in the error message
   */
  expectErrorContaining(expectedText) {
    return expect(loggerMock.error).toHaveBeenCalledWith(
      expect.stringContaining(expectedText)
    );
  },

  /**
   * Assert that Logger.info was called with message containing text
   * @param {string} expectedText - Text that should be in the info message
   */
  expectInfoContaining(expectedText) {
    return expect(loggerMock.info).toHaveBeenCalledWith(
      expect.stringContaining(expectedText)
    );
  },

  /**
   * Assert that a scoped logger debug was called
   * @param {string} scope - The scope name
   * @param {string} expectedText - Text that should be in the debug message
   */
  expectScopedDebugContaining(scope, expectedText) {
    const scopedLogger = mockFactory.scope(scope);
    return expect(scopedLogger.debug).toHaveBeenCalledWith(
      expect.stringContaining(expectedText)
    );
  },

  /**
   * Assert that a scoped logger info was called
   * @param {string} scope - The scope name
   * @param {string} expectedText - Text that should be in the info message
   */
  expectScopedInfoContaining(scope, expectedText) {
    const scopedLogger = mockFactory.scope(scope);
    return expect(scopedLogger.info).toHaveBeenCalledWith(
      expect.stringContaining(expectedText)
    );
  },

  /**
   * Assert that a scoped logger warn was called
   * @param {string} scope - The scope name
   * @param {string} expectedText - Text that should be in the warning message
   */
  expectScopedWarnContaining(scope, expectedText) {
    const scopedLogger = mockFactory.scope(scope);
    return expect(scopedLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining(expectedText)
    );
  },

  /**
   * Assert that a scoped logger error was called
   * @param {string} scope - The scope name
   * @param {string} expectedText - Text that should be in the error message
   */
  expectScopedErrorContaining(scope, expectedText) {
    const scopedLogger = mockFactory.scope(scope);
    return expect(scopedLogger.error).toHaveBeenCalledWith(
      expect.stringContaining(expectedText)
    );
  },

  /**
   * Assert that no Logger warnings were called
   */
  expectNoWarnings() {
    return expect(loggerMock.warn).not.toHaveBeenCalled();
  },

  /**
   * Assert that no Logger errors were called  
   */
  expectNoErrors() {
    return expect(loggerMock.error).not.toHaveBeenCalled();
  },

  /**
   * Get all debug messages that were logged globally
   * @returns {Array} Array of debug message calls
   */
  getDebugMessages() {
    return loggerMock.debug.mock.calls;
  },

  /**
   * Get all warning messages that were logged globally
   * @returns {Array} Array of warning message calls
   */
  getWarnMessages() {
    return loggerMock.warn.mock.calls;
  },

  /**
   * Get all error messages that were logged globally
   * @returns {Array} Array of error message calls
   */
  getErrorMessages() {
    return loggerMock.error.mock.calls;
  },

  /**
   * Get all info messages that were logged globally
   * @returns {Array} Array of info message calls
   */
  getInfoMessages() {
    return loggerMock.info.mock.calls;
  },

  /**
   * Get all debug messages for a specific scope
   * @param {string} scope - The scope name
   * @returns {Array} Array of debug message calls
   */
  getScopedDebugMessages(scope) {
    const scopedLogger = mockFactory.scope(scope);
    return scopedLogger.debug.mock.calls;
  },

  /**
   * Get all scoped loggers that have been created
   * @returns {Map} Map of scope names to scoped logger instances
   */
  getAllScopedLoggers() {
    return new Map(mockFactory._scopeCache);
  }
};

/**
 * Setup function to be called in test files
 * This ensures the Logger mock is properly configured
 */
export function setupLoggerMock() {
  // Mock the Logger module - this will be the default export
  vi.mock('../../../src/utils/Logger.js', () => ({
    default: loggerMock
  }));
  
  return loggerMock;
}

/**
 * Create a logger mock that can be used in individual tests
 * when you need to override the global mock
 */
export function createFreshLoggerMock() {
  const freshFactory = new MockLoggerFactory();
  return {
    _factory: freshFactory,
    isInitialized: true,
    debugMode: true,
    logLevel: 'debug',
    levels: { debug: 0, info: 1, warn: 2, error: 3 },
    scope: vi.fn((scopeName) => freshFactory.scope(scopeName)),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    time: vi.fn(),
    timeEnd: vi.fn(),
    group: vi.fn(),
    groupEnd: vi.fn(),
    table: vi.fn(),
    shouldLog: vi.fn().mockReturnValue(true),
    formatMessage: vi.fn((level, message, ...args) => [`[${level.toUpperCase()}]`, message, ...args]),
    _ensureInitialized: vi.fn()
  };
}

/**
 * Logger mock that tracks call order for complex testing scenarios
 */
export class OrderedLoggerMock {
  constructor() {
    this.calls = [];
    this._scopeCache = new Map();
    
    // Global methods with call tracking
    this.debug = vi.fn((...args) => this.calls.push({ level: 'debug', scope: null, args }));
    this.info = vi.fn((...args) => this.calls.push({ level: 'info', scope: null, args }));
    this.warn = vi.fn((...args) => this.calls.push({ level: 'warn', scope: null, args }));
    this.error = vi.fn((...args) => this.calls.push({ level: 'error', scope: null, args }));
    this.time = vi.fn((...args) => this.calls.push({ level: 'time', scope: null, args }));
    this.timeEnd = vi.fn((...args) => this.calls.push({ level: 'timeEnd', scope: null, args }));
    this.group = vi.fn((...args) => this.calls.push({ level: 'group', scope: null, args }));
    this.groupEnd = vi.fn((...args) => this.calls.push({ level: 'groupEnd', scope: null, args }));
    this.table = vi.fn((...args) => this.calls.push({ level: 'table', scope: null, args }));
    
    // Scope method
    this.scope = vi.fn((scopeName) => {
      if (!this._scopeCache.has(scopeName)) {
        this._scopeCache.set(scopeName, this._createScopedLogger(scopeName));
      }
      return this._scopeCache.get(scopeName);
    });
  }

  _createScopedLogger(scopeName) {
    return {
      scope: scopeName,
      debug: vi.fn((...args) => this.calls.push({ level: 'debug', scope: scopeName, args })),
      info: vi.fn((...args) => this.calls.push({ level: 'info', scope: scopeName, args })),
      warn: vi.fn((...args) => this.calls.push({ level: 'warn', scope: scopeName, args })),
      error: vi.fn((...args) => this.calls.push({ level: 'error', scope: scopeName, args })),
      time: vi.fn((...args) => this.calls.push({ level: 'time', scope: scopeName, args })),
      timeEnd: vi.fn((...args) => this.calls.push({ level: 'timeEnd', scope: scopeName, args })),
      group: vi.fn((...args) => this.calls.push({ level: 'group', scope: scopeName, args })),
      groupEnd: vi.fn((...args) => this.calls.push({ level: 'groupEnd', scope: scopeName, args })),
      table: vi.fn((...args) => this.calls.push({ level: 'table', scope: scopeName, args }))
    };
  }

  getCalls() {
    return [...this.calls];
  }

  getCallsForLevel(level) {
    return this.calls.filter(call => call.level === level);
  }

  getCallsForScope(scope) {
    return this.calls.filter(call => call.scope === scope);
  }

  clear() {
    this.calls = [];
    this._scopeCache.clear();
    Object.keys(this).forEach(key => {
      if (typeof this[key] === 'function' && this[key].mockClear) {
        this[key].mockClear();
      }
    });
  }
}

// Default export for common usage
export default {
  loggerMock,
  resetLoggerMock,
  loggerAssertions,
  setupLoggerMock,
  createFreshLoggerMock,
  OrderedLoggerMock
};