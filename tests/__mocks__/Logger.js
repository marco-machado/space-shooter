/**
 * Comprehensive Logger Mock for Testing
 * Provides consistent Logger mocking across all test files with proper spy functionality
 * 
 * Features:
 * - All Logger methods as Vitest spies
 * - Mock reset functionality
 * - Call history tracking
 * - Assertion helpers for common test patterns
 */

import { vi } from 'vitest';

/**
 * Logger mock with all methods as spies
 * This ensures consistent behavior across all test files
 */
export const loggerMock = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  time: vi.fn(),
  timeEnd: vi.fn(),
  group: vi.fn(),
  groupEnd: vi.fn(),
  table: vi.fn(),
  
  // Additional properties that might be accessed
  isInitialized: true,
  debugMode: true,
  logLevel: 'debug'
};

/**
 * Reset all Logger mocks
 * Call this in beforeEach to ensure clean state
 */
export function resetLoggerMock() {
  Object.keys(loggerMock).forEach(key => {
    if (typeof loggerMock[key] === 'function') {
      loggerMock[key].mockClear();
    }
  });
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
   * Get all debug messages that were logged
   * @returns {Array} Array of debug message calls
   */
  getDebugMessages() {
    return loggerMock.debug.mock.calls;
  },

  /**
   * Get all warning messages that were logged
   * @returns {Array} Array of warning message calls
   */
  getWarnMessages() {
    return loggerMock.warn.mock.calls;
  },

  /**
   * Get all error messages that were logged
   * @returns {Array} Array of error message calls
   */
  getErrorMessages() {
    return loggerMock.error.mock.calls;
  },

  /**
   * Get all info messages that were logged
   * @returns {Array} Array of info message calls
   */
  getInfoMessages() {
    return loggerMock.info.mock.calls;
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
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    time: vi.fn(),
    timeEnd: vi.fn(),
    group: vi.fn(),
    groupEnd: vi.fn(),
    table: vi.fn(),
    isInitialized: true,
    debugMode: true,
    logLevel: 'debug'
  };
}

/**
 * Logger mock that tracks call order for complex testing scenarios
 */
export class OrderedLoggerMock {
  constructor() {
    this.calls = [];
    this.debug = vi.fn((...args) => this.calls.push({ level: 'debug', args }));
    this.info = vi.fn((...args) => this.calls.push({ level: 'info', args }));
    this.warn = vi.fn((...args) => this.calls.push({ level: 'warn', args }));
    this.error = vi.fn((...args) => this.calls.push({ level: 'error', args }));
    this.time = vi.fn((...args) => this.calls.push({ level: 'time', args }));
    this.timeEnd = vi.fn((...args) => this.calls.push({ level: 'timeEnd', args }));
    this.group = vi.fn((...args) => this.calls.push({ level: 'group', args }));
    this.groupEnd = vi.fn((...args) => this.calls.push({ level: 'groupEnd', args }));
    this.table = vi.fn((...args) => this.calls.push({ level: 'table', args }));
  }

  getCalls() {
    return [...this.calls];
  }

  getCallsForLevel(level) {
    return this.calls.filter(call => call.level === level);
  }

  clear() {
    this.calls = [];
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