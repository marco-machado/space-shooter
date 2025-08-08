import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Logger from '../../src/utils/Logger.js';

describe('Logger', () => {
  let mockConsole;

  beforeEach(() => {
    // Create fresh mock console for each test
    mockConsole = {
      log: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      time: vi.fn(),
      timeEnd: vi.fn(),
      group: vi.fn(),
      groupEnd: vi.fn(),
      table: vi.fn()
    };

    // Reset environment and cache
    vi.unstubAllEnvs();
    Logger._resetForTesting();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  describe('Initialization', () => {
    it('should auto-initialize when first accessed', () => {
      const debugMode = Logger.debugMode;
      expect(typeof debugMode).toBe('boolean');
      expect(Logger.isInitialized).toBe(true);
    });

    it('should handle missing environment variables', () => {
      Logger._resetForTesting();
      // Test with no environment variable set (override the test setup)
      vi.stubEnv('VITE_LOG_LEVEL', undefined);
      const logLevel = Logger.logLevel;
      expect(logLevel).toBe('info'); // default
    });

    it('should validate invalid log level', () => {
      Logger._resetForTesting();
      vi.stubEnv('VITE_LOG_LEVEL', 'invalid');
      
      const logLevel = Logger.logLevel;
      expect(logLevel).toBe('info'); // fallback to default
    });

    it('should use environment configuration', () => {
      // Reset and set environment before accessing Logger
      Logger._resetForTesting();
      vi.stubEnv('VITE_DEBUG_MODE', 'true');
      vi.stubEnv('VITE_LOG_LEVEL', 'debug');

      // Force re-initialization by accessing properties
      const debugMode = Logger.debugMode;
      const logLevel = Logger.logLevel;

      expect(debugMode).toBe(true);
      expect(logLevel).toBe('debug');
    });
  });

  describe('Scope isolation', () => {
    it('should return isolated scoped logger instances', () => {
      const logger1 = Logger.scope('Test1');
      const logger2 = Logger.scope('Test2');
      const logger1Again = Logger.scope('Test1');

      expect(logger1).not.toBe(logger2);
      expect(logger1).toBe(logger1Again); // cached
      expect(logger1.scope).toBe('Test1');
      expect(logger2.scope).toBe('Test2');
    });

    it('should maintain scope isolation across concurrent calls', () => {
      const results = [];
      
      // Simulate concurrent scope creation
      for (let i = 0; i < 10; i++) {
        const logger = Logger.scope(`Concurrent${i}`);
        results.push(logger.scope);
      }

      // Verify no race conditions
      results.forEach((scope, index) => {
        expect(scope).toBe(`Concurrent${index}`);
      });
    });
  });

  describe('Logging levels', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_DEBUG_MODE', 'true');
      vi.stubEnv('VITE_LOG_LEVEL', 'debug');
    });

    it('should respect log level filtering', () => {
      Logger._resetForTesting();
      vi.stubEnv('VITE_DEBUG_MODE', 'true');
      vi.stubEnv('VITE_LOG_LEVEL', 'warn');
      
      // Create logger with mock console
      const testLogger = new Logger._factory.constructor({ console: mockConsole });
      const scopedLogger = testLogger.scope('Test');

      scopedLogger.debug('debug message');
      scopedLogger.info('info message');
      scopedLogger.warn('warn message');
      scopedLogger.error('error message');

      expect(mockConsole.log).not.toHaveBeenCalled(); // debug filtered
      expect(mockConsole.info).not.toHaveBeenCalled(); // info filtered
      expect(mockConsole.warn).toHaveBeenCalledWith('⚠️', expect.any(String), 'warn message');
      expect(mockConsole.error).toHaveBeenCalledWith('❌', expect.any(String), 'error message');
    });

    it('should handle debug mode filtering', () => {
      Logger._resetForTesting();
      vi.stubEnv('VITE_DEBUG_MODE', 'false');
      vi.stubEnv('VITE_LOG_LEVEL', 'debug');
      
      const testLogger = new Logger._factory.constructor({ console: mockConsole });
      const scopedLogger = testLogger.scope('Test');

      scopedLogger.debug('debug message');
      
      expect(mockConsole.log).not.toHaveBeenCalled(); // debug mode disabled
    });
  });

  describe('Message formatting', () => {
    beforeEach(() => {
      Logger._resetForTesting();
      vi.stubEnv('VITE_DEBUG_MODE', 'true');
      vi.stubEnv('VITE_LOG_LEVEL', 'debug');
    });

    it('should format messages with timestamp and scope', () => {
      const testLogger = new Logger._factory.constructor({ console: mockConsole });
      const scopedLogger = testLogger.scope('TestScope');

      scopedLogger.info('test message', 'extra arg');

      expect(mockConsole.info).toHaveBeenCalledWith(
        'ℹ️',
        expect.stringMatching(/\d{2}:\d{2}:\d{2} \[INFO\]\[TestScope\]/),
        'test message',
        'extra arg'
      );
    });

    it('should handle null scope', () => {
      const testLogger = new Logger._factory.constructor({ console: mockConsole });
      const scopedLogger = testLogger.scope(null);

      scopedLogger.info('test message');

      expect(mockConsole.info).toHaveBeenCalledWith(
        'ℹ️',
        expect.stringMatching(/\d{2}:\d{2}:\d{2} \[INFO\]/),
        'test message'
      );
    });
  });

  describe('Performance optimizations', () => {
    beforeEach(() => {
      Logger._resetForTesting();
    });

    it('should cache timestamp for performance', () => {
      vi.stubEnv('VITE_DEBUG_MODE', 'true');
      vi.stubEnv('VITE_LOG_LEVEL', 'debug');

      const testLogger = new Logger._factory.constructor({ console: mockConsole });
      const scopedLogger = testLogger.scope('Test');

      // Log multiple messages quickly
      scopedLogger.debug('message 1');
      scopedLogger.debug('message 2');

      const calls = mockConsole.log.mock.calls;
      const timestamp1 = calls[0][1].split(' ')[0];
      const timestamp2 = calls[1][1].split(' ')[0];
      
      // Should use cached timestamp
      expect(timestamp1).toBe(timestamp2);
    });

    it('should cache scope labels', () => {
      vi.stubEnv('VITE_DEBUG_MODE', 'true');
      vi.stubEnv('VITE_LOG_LEVEL', 'debug');

      const testLogger = new Logger._factory.constructor({ console: mockConsole });

      // Create multiple loggers with same scope
      const logger1 = testLogger.scope('CachedScope');
      const logger2 = testLogger.scope('CachedScope');

      logger1.debug('message 1');
      logger2.debug('message 2');

      // Both should use same cached scope label
      expect(mockConsole.log).toHaveBeenCalledTimes(2);
      expect(mockConsole.log.mock.calls[0][1]).toContain('[CachedScope]');
      expect(mockConsole.log.mock.calls[1][1]).toContain('[CachedScope]');
    });

    it('should early return when logging disabled', () => {
      vi.stubEnv('VITE_LOG_LEVEL', 'error');
      
      const mockSanitizer = { sanitize: vi.fn() };
      const testLogger = new Logger._factory.constructor({ 
        console: mockConsole,
        sanitizer: mockSanitizer
      });
      const scopedLogger = testLogger.scope('Test');

      scopedLogger.debug('filtered message');

      // Should not call expensive operations
      expect(mockSanitizer.sanitize).not.toHaveBeenCalled();
      expect(mockConsole.log).not.toHaveBeenCalled();
    });
  });

  describe('Security features', () => {
    beforeEach(() => {
      Logger._resetForTesting();
      vi.stubEnv('VITE_DEBUG_MODE', 'true');
      vi.stubEnv('VITE_LOG_LEVEL', 'debug');
    });

    it('should sanitize sensitive strings', () => {
      const testLogger = new Logger._factory.constructor({ console: mockConsole });
      const scopedLogger = testLogger.scope('Test');

      scopedLogger.info('api_key: secret123');

      expect(mockConsole.info).toHaveBeenCalledWith(
        'ℹ️',
        expect.any(String),
        '[SENSITIVE DATA REDACTED]'
      );
    });

    it('should sanitize sensitive object properties', () => {
      const testLogger = new Logger._factory.constructor({ console: mockConsole });
      const scopedLogger = testLogger.scope('Test');

      const sensitiveData = {
        username: 'user',
        password: 'secret123',
        data: 'safe'
      };

      scopedLogger.info('User data:', sensitiveData);

      // Arguments: icon, timestamp+level+scope, message, sanitized object
      expect(mockConsole.info.mock.calls[0]).toHaveLength(4);
      const sanitizedObject = mockConsole.info.mock.calls[0][3];
      expect(sanitizedObject.username).toBe('user');
      expect(sanitizedObject.password).toBe('[REDACTED]');
      expect(sanitizedObject.data).toBe('safe');
    });

    it('should handle arrays in sanitization', () => {
      const testLogger = new Logger._factory.constructor({ console: mockConsole });
      const scopedLogger = testLogger.scope('Test');

      scopedLogger.info('Array data:', ['safe', 'api_key: secret']);

      // Arguments: icon, timestamp+level+scope, message, sanitized array
      expect(mockConsole.info.mock.calls[0]).toHaveLength(4);
      const sanitizedArray = mockConsole.info.mock.calls[0][3];
      expect(sanitizedArray[0]).toBe('safe');
      expect(sanitizedArray[1]).toBe('[SENSITIVE DATA REDACTED]');
    });
  });

  describe('Rate limiting', () => {
    beforeEach(() => {
      Logger._resetForTesting();
      vi.stubEnv('VITE_DEBUG_MODE', 'true');
      vi.stubEnv('VITE_LOG_LEVEL', 'debug');
    });

    it('should allow logging within rate limits', () => {
      const mockRateLimiter = {
        allow: vi.fn().mockReturnValue(true)
      };

      const testLogger = new Logger._factory.constructor({ 
        console: mockConsole,
        rateLimiter: mockRateLimiter
      });
      const scopedLogger = testLogger.scope('Test');

      scopedLogger.info('test message');

      expect(mockRateLimiter.allow).toHaveBeenCalledWith('info', 'Test');
      expect(mockConsole.info).toHaveBeenCalled();
    });

    it('should block logging when rate limited', () => {
      const mockRateLimiter = {
        allow: vi.fn().mockReturnValue(false)
      };

      const testLogger = new Logger._factory.constructor({ 
        console: mockConsole,
        rateLimiter: mockRateLimiter
      });
      const scopedLogger = testLogger.scope('Test');

      scopedLogger.info('test message');

      expect(mockRateLimiter.allow).toHaveBeenCalledWith('info', 'Test');
      expect(mockConsole.info).not.toHaveBeenCalled();
    });
  });

  describe('Utility methods', () => {
    beforeEach(() => {
      Logger._resetForTesting();
      vi.stubEnv('VITE_DEBUG_MODE', 'true');
      vi.stubEnv('VITE_LOG_LEVEL', 'debug');
    });

    it('should support time/timeEnd methods', () => {
      const testLogger = new Logger._factory.constructor({ console: mockConsole });
      const scopedLogger = testLogger.scope('Test');

      scopedLogger.time('operation');
      scopedLogger.timeEnd('operation');

      expect(mockConsole.time).toHaveBeenCalledWith('⏱️ operation');
      expect(mockConsole.timeEnd).toHaveBeenCalledWith('⏱️ operation');
    });

    it('should support group/groupEnd methods', () => {
      const testLogger = new Logger._factory.constructor({ console: mockConsole });
      const scopedLogger = testLogger.scope('Test');

      scopedLogger.group('test group');
      scopedLogger.groupEnd();

      expect(mockConsole.group).toHaveBeenCalledWith('📁 test group');
      expect(mockConsole.groupEnd).toHaveBeenCalled();
    });

    it('should support table method', () => {
      const testLogger = new Logger._factory.constructor({ console: mockConsole });
      const scopedLogger = testLogger.scope('Test');

      const data = [{ name: 'test', value: 123 }];
      scopedLogger.table(data);

      expect(mockConsole.table).toHaveBeenCalledWith(data);
    });
  });

  describe('Backward compatibility', () => {
    it('should maintain static property access', () => {
      expect(typeof Logger.isInitialized).toBe('boolean');
      expect(typeof Logger.debugMode).toBe('boolean');
      expect(typeof Logger.logLevel).toBe('string');
      expect(typeof Logger.levels).toBe('object');
    });

    it('should support legacy methods', () => {
      expect(typeof Logger.shouldLog).toBe('function');
      expect(typeof Logger.formatMessage).toBe('function');
      expect(typeof Logger._ensureInitialized).toBe('function');
    });

    it('should support global logging methods', () => {
      expect(typeof Logger.debug).toBe('function');
      expect(typeof Logger.info).toBe('function');
      expect(typeof Logger.warn).toBe('function');
      expect(typeof Logger.error).toBe('function');
    });

    it('should maintain Logger.scope().method() API', () => {
      const scopedLogger = Logger.scope('TestScope');
      expect(typeof scopedLogger.debug).toBe('function');
      expect(typeof scopedLogger.info).toBe('function');
      expect(typeof scopedLogger.warn).toBe('function');
      expect(typeof scopedLogger.error).toBe('function');
    });
  });

  describe('Dependency injection', () => {
    beforeEach(() => {
      Logger._resetForTesting();
    });

    it('should allow custom console injection', () => {
      vi.stubEnv('VITE_DEBUG_MODE', 'true');
      vi.stubEnv('VITE_LOG_LEVEL', 'debug');

      const customConsole = { log: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
      const testLogger = new Logger._factory.constructor({ console: customConsole });

      testLogger.debug('test');
      expect(customConsole.log).toHaveBeenCalled();
    });

    it('should allow custom sanitizer injection', () => {
      vi.stubEnv('VITE_DEBUG_MODE', 'true');
      vi.stubEnv('VITE_LOG_LEVEL', 'debug');

      const customSanitizer = {
        sanitize: vi.fn(val => `CUSTOM_${val}`)
      };
      const testLogger = new Logger._factory.constructor({ 
        console: mockConsole,
        sanitizer: customSanitizer
      });

      testLogger.debug('test');
      expect(customSanitizer.sanitize).toHaveBeenCalledWith('test');
      expect(mockConsole.log).toHaveBeenCalledWith(
        '🔍',
        expect.any(String),
        'CUSTOM_test'
      );
    });

    it('should allow custom rate limiter injection', () => {
      vi.stubEnv('VITE_DEBUG_MODE', 'true');
      vi.stubEnv('VITE_LOG_LEVEL', 'debug');

      const customRateLimiter = {
        allow: vi.fn().mockReturnValue(true)
      };
      const testLogger = new Logger._factory.constructor({ 
        console: mockConsole,
        rateLimiter: customRateLimiter
      });

      testLogger.scope('Test').debug('test');
      expect(customRateLimiter.allow).toHaveBeenCalledWith('debug', 'Test');
    });

    it('should allow custom formatter injection', () => {
      vi.stubEnv('VITE_DEBUG_MODE', 'true');
      vi.stubEnv('VITE_LOG_LEVEL', 'debug');

      const customFormatter = {
        format: vi.fn((level, scope, message, ...args) => [`CUSTOM_${level}`, message, ...args])
      };
      const testLogger = new Logger._factory.constructor({ 
        console: mockConsole,
        formatter: customFormatter
      });

      testLogger.debug('test');
      expect(customFormatter.format).toHaveBeenCalledWith('debug', null, 'test');
      expect(mockConsole.log).toHaveBeenCalledWith('🔍', 'CUSTOM_debug', 'test');
    });
  });

  describe('Rate limiter implementation', () => {
    it('should implement per-minute rate limits correctly', () => {
      const rateLimiter = Logger._factory.deps.rateLimiter;
      
      // Test within limits
      for (let i = 0; i < 50; i++) {
        expect(rateLimiter.allow('error', 'test')).toBe(true);
      }
      
      // Test exceeding limits
      expect(rateLimiter.allow('error', 'test')).toBe(false);
    });

    it('should reset limits after time window', () => {
      const rateLimiter = Logger._factory.deps.rateLimiter;
      
      // Fill up the limit
      for (let i = 0; i < 50; i++) {
        rateLimiter.allow('error', 'test');
      }
      expect(rateLimiter.allow('error', 'test')).toBe(false);

      // Mock time advancement
      const originalLimits = rateLimiter.limits;
      const testEntry = originalLimits.get('error:test');
      testEntry.resetTime = Date.now() - 1; // Force reset
      
      expect(rateLimiter.allow('error', 'test')).toBe(true);
    });

    it('should handle different scopes independently', () => {
      const rateLimiter = Logger._factory.deps.rateLimiter;
      
      // Fill up one scope
      for (let i = 0; i < 50; i++) {
        rateLimiter.allow('error', 'scope1');
      }
      expect(rateLimiter.allow('error', 'scope1')).toBe(false);
      
      // Other scope should still work
      expect(rateLimiter.allow('error', 'scope2')).toBe(true);
    });
  });
});
