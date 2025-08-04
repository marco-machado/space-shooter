import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Logger from '../../src/utils/Logger.js';

// Mock console methods to test logging output
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  time: console.time,
  timeEnd: console.timeEnd,
  group: console.group,
  groupEnd: console.groupEnd,
  table: console.table,
};

const mockConsole = {
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  time: vi.fn(),
  timeEnd: vi.fn(),
  group: vi.fn(),
  groupEnd: vi.fn(),
  table: vi.fn(),
};

describe('Logger', () => {
  beforeEach(() => {
    // Reset console mocks
    Object.keys(mockConsole).forEach(method => mockConsole[method].mockClear());
    
    // Replace console methods with mocks
    Object.keys(mockConsole).forEach(method => {
      console[method] = mockConsole[method];
    });

    // Reset Logger state for fresh testing
    Logger.isInitialized = false;
    Logger.debugMode = false;
    Logger.logLevel = 'info';
  });

  afterEach(() => {
    // Restore original console methods
    Object.keys(originalConsole).forEach(method => {
      console[method] = originalConsole[method];
    });
  });

  describe('Auto-Initialization', () => {
    it('should auto-initialize on first logging call', () => {
      expect(Logger.isInitialized).toBe(false);
      
      Logger.error('test error'); // Use error as it should always log
      
      expect(Logger.isInitialized).toBe(true);
    });

    it('should not re-initialize on subsequent calls', () => {
      Logger.error('first call');
      const firstInit = Logger.isInitialized;
      
      Logger.error('second call');
      
      expect(Logger.isInitialized).toBe(firstInit);
    });

    it('should initialize when shouldLog is called', () => {
      expect(Logger.isInitialized).toBe(false);
      
      Logger.shouldLog('info');
      
      expect(Logger.isInitialized).toBe(true);
    });
  });

  describe('Logging Methods Structure', () => {
    beforeEach(() => {
      // Force initialization with known state
      Logger.isInitialized = true;
      Logger.debugMode = true;
      Logger.logLevel = 'debug';
    });

    it('should call console.log for debug messages when enabled', () => {
      Logger.debug('debug message', 'extra', 'args');
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        '🔍',
        expect.stringMatching(/^\d{2}:\d{2}:\d{2} \[DEBUG\]$/),
        'debug message',
        'extra',
        'args'
      );
    });

    it('should call console.info for info messages', () => {
      Logger.info('info message', 'extra', 'args');
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        'ℹ️',
        expect.stringMatching(/^\d{2}:\d{2}:\d{2} \[INFO\]$/),
        'info message',
        'extra',
        'args'
      );
    });

    it('should call console.warn for warning messages', () => {
      Logger.warn('warning message', 'extra', 'args');
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        '⚠️',
        expect.stringMatching(/^\d{2}:\d{2}:\d{2} \[WARN\]$/),
        'warning message',
        'extra',
        'args'
      );
    });

    it('should call console.error for error messages', () => {
      Logger.error('error message', 'extra', 'args');
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        '❌',
        expect.stringMatching(/^\d{2}:\d{2}:\d{2} \[ERROR\]$/),
        'error message',
        'extra',
        'args'
      );
    });
  });

  describe('Log Level Filtering', () => {
    it('should respect error log level (only error messages)', () => {
      // Force specific log level
      Logger.isInitialized = true;
      Logger.debugMode = true;
      Logger.logLevel = 'error';
      
      Logger.debug('debug message'); // should not log
      Logger.info('info message');   // should not log
      Logger.warn('warn message');   // should not log
      Logger.error('error message'); // should log
      
      expect(mockConsole.log).not.toHaveBeenCalled();  // debug
      expect(mockConsole.info).not.toHaveBeenCalled(); // info
      expect(mockConsole.warn).not.toHaveBeenCalled(); // warn
      expect(mockConsole.error).toHaveBeenCalled();    // error
    });

    it('should respect warn log level (warn and error)', () => {
      // Force specific log level
      Logger.isInitialized = true;
      Logger.debugMode = true;
      Logger.logLevel = 'warn';
      
      Logger.debug('debug message'); // should not log
      Logger.info('info message');   // should not log
      Logger.warn('warn message');   // should log
      Logger.error('error message'); // should log
      
      expect(mockConsole.log).not.toHaveBeenCalled();  // debug
      expect(mockConsole.info).not.toHaveBeenCalled(); // info
      expect(mockConsole.warn).toHaveBeenCalled();     // warn
      expect(mockConsole.error).toHaveBeenCalled();    // error
    });

    it('should respect info log level (info, warn, error)', () => {
      // Force specific log level
      Logger.isInitialized = true;
      Logger.debugMode = true;
      Logger.logLevel = 'info';
      
      Logger.debug('debug message'); // should not log
      Logger.info('info message');   // should log
      Logger.warn('warn message');   // should log
      Logger.error('error message'); // should log
      
      expect(mockConsole.log).not.toHaveBeenCalled(); // debug
      expect(mockConsole.info).toHaveBeenCalled();    // info
      expect(mockConsole.warn).toHaveBeenCalled();    // warn
      expect(mockConsole.error).toHaveBeenCalled();   // error
    });

    it('should not log debug when debugMode is false', () => {
      // Force specific state
      Logger.isInitialized = true;
      Logger.debugMode = false;
      Logger.logLevel = 'debug';
      
      Logger.debug('debug message');
      
      expect(mockConsole.log).not.toHaveBeenCalled();
    });
  });

  describe('Performance Methods', () => {
    beforeEach(() => {
      // Force debug mode enabled
      Logger.isInitialized = true;
      Logger.debugMode = true;
      Logger.logLevel = 'debug';
    });

    it('should call console.time and timeEnd when debug enabled', () => {
      Logger.time('test-timer');
      Logger.timeEnd('test-timer');
      
      expect(mockConsole.time).toHaveBeenCalledWith('⏱️ test-timer');
      expect(mockConsole.timeEnd).toHaveBeenCalledWith('⏱️ test-timer');
    });

    it('should not call time methods when debug disabled', () => {
      Logger.debugMode = false;
      
      Logger.time('test-timer');
      Logger.timeEnd('test-timer');
      
      expect(mockConsole.time).not.toHaveBeenCalled();
      expect(mockConsole.timeEnd).not.toHaveBeenCalled();
    });

    it('should call console.group and groupEnd when debug enabled', () => {
      Logger.group('test-group');
      Logger.groupEnd();
      
      expect(mockConsole.group).toHaveBeenCalledWith('📁 test-group');
      expect(mockConsole.groupEnd).toHaveBeenCalled();
    });

    it('should not call group methods when debug disabled', () => {
      Logger.debugMode = false;
      
      Logger.group('test-group');
      Logger.groupEnd();
      
      expect(mockConsole.group).not.toHaveBeenCalled();
      expect(mockConsole.groupEnd).not.toHaveBeenCalled();
    });

    it('should call console.table when debug enabled', () => {
      const testData = [{ name: 'test', value: 123 }];
      
      Logger.table(testData);
      
      expect(mockConsole.table).toHaveBeenCalledWith(testData);
    });

    it('should not call table when debug disabled', () => {
      Logger.debugMode = false;
      
      const testData = [{ name: 'test', value: 123 }];
      Logger.table(testData);
      
      expect(mockConsole.table).not.toHaveBeenCalled();
    });
  });

  describe('shouldLog Method', () => {
    beforeEach(() => {
      Logger.isInitialized = true;
      Logger.logLevel = 'warn';
    });

    it('should return correct boolean for different log levels', () => {
      expect(Logger.shouldLog('debug')).toBe(false);
      expect(Logger.shouldLog('info')).toBe(false);
      expect(Logger.shouldLog('warn')).toBe(true);
      expect(Logger.shouldLog('error')).toBe(true);
    });

    it('should handle invalid log levels gracefully', () => {
      expect(Logger.shouldLog('invalid')).toBe(false);
    });
  });

  describe('Backward Compatibility', () => {
    it('should support explicit init() method', () => {
      expect(Logger.isInitialized).toBe(false);
      
      Logger.init();
      
      expect(Logger.isInitialized).toBe(true);
    });

    it('should handle multiple init() calls safely', () => {
      Logger.init();
      const firstState = Logger.isInitialized;
      
      Logger.init(); // Should not cause issues
      
      expect(Logger.isInitialized).toBe(firstState);
    });
  });

  describe('Message Formatting', () => {
    it('should format messages with timestamps', () => {
      const result = Logger.formatMessage('info', 'test message', 'arg1', 'arg2');
      
      expect(result).toHaveLength(4);
      expect(result[0]).toMatch(/^\d{2}:\d{2}:\d{2} \[INFO\]$/);
      expect(result[1]).toBe('test message');
      expect(result[2]).toBe('arg1');
      expect(result[3]).toBe('arg2');
    });

    it('should handle different log levels in formatting', () => {
      const debugResult = Logger.formatMessage('debug', 'debug msg');
      const warnResult = Logger.formatMessage('warn', 'warn msg');
      const errorResult = Logger.formatMessage('error', 'error msg');
      
      expect(debugResult[0]).toMatch(/\[DEBUG\]$/);
      expect(warnResult[0]).toMatch(/\[WARN\]$/);
      expect(errorResult[0]).toMatch(/\[ERROR\]$/);
    });

    it('should format messages without additional arguments', () => {
      const result = Logger.formatMessage('warn', 'simple message');
      
      expect(result).toHaveLength(2);
      expect(result[0]).toMatch(/^\d{2}:\d{2}:\d{2} \[WARN\]$/);
      expect(result[1]).toBe('simple message');
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      Logger.isInitialized = true;
      Logger.debugMode = true;
      Logger.logLevel = 'debug';
    });

    it('should handle empty messages', () => {
      Logger.debug('');
      Logger.info('');
      Logger.warn('');
      Logger.error('');
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        '🔍',
        expect.stringMatching(/^\d{2}:\d{2}:\d{2} \[DEBUG\]$/),
        ''
      );
    });

    it('should handle objects and arrays as arguments', () => {
      const testObject = { key: 'value' };
      const testArray = [1, 2, 3];
      
      Logger.info('test', testObject, testArray);
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        'ℹ️',
        expect.stringMatching(/^\d{2}:\d{2}:\d{2} \[INFO\]$/),
        'test',
        testObject,
        testArray
      );
    });

    it('should handle null and undefined arguments', () => {
      Logger.warn('test', null, undefined);
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        '⚠️',
        expect.stringMatching(/^\d{2}:\d{2}:\d{2} \[WARN\]$/),
        'test',
        null,
        undefined
      );
    });

    it('should handle very long messages', () => {
      const longMessage = 'a'.repeat(1000);
      
      Logger.error(longMessage);
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        '❌',
        expect.stringMatching(/^\d{2}:\d{2}:\d{2} \[ERROR\]$/),
        longMessage
      );
    });
  });

  describe('Environment Initialization (Integration)', () => {
    it('should initialize with default values', () => {
      // Allow natural initialization
      Logger.isInitialized = false;
      
      Logger.error('test'); // Force initialization
      
      expect(Logger.isInitialized).toBe(true);
      expect(Logger.logLevel).toBeTruthy(); // Should have some value
      expect(typeof Logger.debugMode).toBe('boolean');
    });

    it('should handle initialization errors gracefully', () => {
      // Reset state
      Logger.isInitialized = false;
      
      // Mock import.meta to throw (test error handling)
      const originalImportMeta = globalThis.import?.meta;
      if (globalThis.import) {
        Object.defineProperty(globalThis.import, 'meta', {
          get() { throw new Error('Mock import.meta error'); },
          configurable: true
        });
      }
      
      try {
        Logger.error('test'); // Should still work due to error handling
        
        expect(Logger.isInitialized).toBe(true);
        expect(mockConsole.error).toHaveBeenCalled(); // Should log the test message
      } finally {
        // Restore original import.meta if it existed
        if (originalImportMeta && globalThis.import) {
          Object.defineProperty(globalThis.import, 'meta', {
            value: originalImportMeta,
            configurable: true
          });
        }
      }
    });
  });

  describe('Logger State Management', () => {
    it('should maintain consistent state across calls', () => {
      Logger.isInitialized = true;
      Logger.debugMode = true;
      Logger.logLevel = 'debug';
      
      const initialDebugMode = Logger.debugMode;
      const initialLogLevel = Logger.logLevel;
      
      // Multiple calls shouldn't change state
      Logger.debug('test1');
      Logger.info('test2');
      Logger.warn('test3');
      
      expect(Logger.debugMode).toBe(initialDebugMode);
      expect(Logger.logLevel).toBe(initialLogLevel);
    });

    it('should have correct level hierarchy values', () => {
      expect(Logger.levels.debug).toBe(0);
      expect(Logger.levels.info).toBe(1);
      expect(Logger.levels.warn).toBe(2);
      expect(Logger.levels.error).toBe(3);
    });
  });
});