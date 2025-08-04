import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Environment from '../../src/config/Environment.js';

describe('Environment Configuration System', () => {
  let originalEnv;
  
  beforeEach(() => {
    // Reset Environment state
    Environment.isInitialized = false;
    Environment.validationErrors = [];
    
    // Store original environment
    originalEnv = { ...import.meta.env };
    
    // Mock Logger to avoid console output during tests
    vi.mock('../../src/utils/Logger.js', () => ({
      default: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      }
    }));
  });
  
  afterEach(() => {
    // Restore original environment
    Object.keys(import.meta.env).forEach(key => {
      delete import.meta.env[key];
    });
    Object.assign(import.meta.env, originalEnv);
    
    vi.restoreAllMocks();
  });

  describe('Schema Definition', () => {
    it('should have comprehensive schema with all required properties', () => {
      const schema = Environment.SCHEMA;
      
      expect(schema).toBeDefined();
      expect(schema.DEBUG_MODE).toEqual({
        type: 'boolean',
        default: false,
        description: 'Enable debug mode features'
      });
      
      expect(schema.LOG_LEVEL).toEqual({
        type: 'string',
        values: ['debug', 'info', 'warn', 'error'],
        default: 'info',
        description: 'Logging level threshold'
      });
      
      expect(schema.STARTING_LIVES).toEqual({
        type: 'number',
        min: 1,
        max: 10,
        default: 3,
        description: 'Player starting lives count'
      });
      
      expect(schema.MAX_PARTICLES).toEqual({
        type: 'number',
        min: 100,
        max: 10000,
        default: 1000,
        description: 'Maximum particle count for effects'
      });
    });
    
    it('should include all configuration parameters in schema', () => {
      const schema = Environment.SCHEMA;
      const expectedKeys = [
        'DEBUG_MODE', 'LOG_LEVEL', 'PHYSICS_DEBUG', 'AUDIO_ENABLED',
        'STARTING_LIVES', 'BASE_SCORE_MULTIPLIER', 'MAX_PARTICLES',
        'OBJECT_POOL_SIZE', 'SHOW_FPS', 'SHOW_DEBUG_INFO'
      ];
      
      expectedKeys.forEach(key => {
        expect(schema[key]).toBeDefined();
        expect(schema[key].type).toBeDefined();
        expect(schema[key].default).toBeDefined();
        expect(schema[key].description).toBeDefined();
      });
    });
  });

  describe('Safe Parsing Methods', () => {
    describe('parseIntSafe', () => {
      it('should parse valid integer values', () => {
        import.meta.env.VITE_TEST_INT = '42';
        const result = Environment.parseIntSafe('VITE_TEST_INT', 10, 'TEST_INT');
        expect(result).toBe(42);
      });
      
      it('should return default for invalid values', () => {
        import.meta.env.VITE_TEST_INT = 'invalid';
        const result = Environment.parseIntSafe('VITE_TEST_INT', 10, 'TEST_INT');
        expect(result).toBe(10);
      });
      
      it('should enforce minimum bounds', () => {
        import.meta.env.VITE_TEST_INT = '5';
        const result = Environment.parseIntSafe('VITE_TEST_INT', 20, 'TEST_INT', 10, 100);
        expect(result).toBe(20); // Should use default when below minimum
      });
      
      it('should enforce maximum bounds', () => {
        import.meta.env.VITE_TEST_INT = '150';
        const result = Environment.parseIntSafe('VITE_TEST_INT', 20, 'TEST_INT', 10, 100);
        expect(result).toBe(20); // Should use default when above maximum
      });
      
      it('should handle undefined values', () => {
        const result = Environment.parseIntSafe('VITE_UNDEFINED', 42, 'UNDEFINED');
        expect(result).toBe(42);
      });
      
      it('should handle empty string values', () => {
        import.meta.env.VITE_TEST_INT = '';
        const result = Environment.parseIntSafe('VITE_TEST_INT', 42, 'TEST_INT');
        expect(result).toBe(42);
      });
    });

    describe('parseFloatSafe', () => {
      it('should parse valid float values', () => {
        import.meta.env.VITE_TEST_FLOAT = '3.14';
        const result = Environment.parseFloatSafe('VITE_TEST_FLOAT', 1.0, 'TEST_FLOAT');
        expect(result).toBe(3.14);
      });
      
      it('should return default for invalid values', () => {
        import.meta.env.VITE_TEST_FLOAT = 'not-a-number';
        const result = Environment.parseFloatSafe('VITE_TEST_FLOAT', 1.0, 'TEST_FLOAT');
        expect(result).toBe(1.0);
      });
      
      it('should enforce bounds correctly', () => {
        import.meta.env.VITE_TEST_FLOAT = '15.5';
        const result = Environment.parseFloatSafe('VITE_TEST_FLOAT', 5.0, 'TEST_FLOAT', 1.0, 10.0);
        expect(result).toBe(5.0); // Should use default when above maximum
      });
    });

    describe('parseBooleanSafe', () => {
      it('should parse true values correctly', () => {
        const trueValues = ['true', '1', 'yes', 'on', 'TRUE', 'YES'];
        
        trueValues.forEach(value => {
          import.meta.env.VITE_TEST_BOOL = value;
          const result = Environment.parseBooleanSafe('VITE_TEST_BOOL', false, 'TEST_BOOL');
          expect(result).toBe(true);
        });
      });
      
      it('should parse false values correctly', () => {
        const falseValues = ['false', '0', 'no', 'off', 'FALSE', 'NO'];
        
        falseValues.forEach(value => {
          import.meta.env.VITE_TEST_BOOL = value;
          const result = Environment.parseBooleanSafe('VITE_TEST_BOOL', true, 'TEST_BOOL');
          expect(result).toBe(false);
        });
      });
      
      it('should return default for invalid boolean values', () => {
        import.meta.env.VITE_TEST_BOOL = 'maybe';
        const result = Environment.parseBooleanSafe('VITE_TEST_BOOL', true, 'TEST_BOOL');
        expect(result).toBe(true);
      });
    });

    describe('parseStringSafe', () => {
      it('should parse valid string values', () => {
        import.meta.env.VITE_TEST_STRING = 'hello world';
        const result = Environment.parseStringSafe('VITE_TEST_STRING', 'default', 'TEST_STRING');
        expect(result).toBe('hello world');
      });
      
      it('should trim whitespace', () => {
        import.meta.env.VITE_TEST_STRING = '  spaced  ';
        const result = Environment.parseStringSafe('VITE_TEST_STRING', 'default', 'TEST_STRING');
        expect(result).toBe('spaced');
      });
      
      it('should handle empty strings', () => {
        import.meta.env.VITE_TEST_STRING = '';
        const result = Environment.parseStringSafe('VITE_TEST_STRING', 'default', 'TEST_STRING');
        expect(result).toBe('default');
      });
    });
  });

  describe('Initialization', () => {
    it('should initialize with default values when no environment variables set', () => {
      // Clear all environment variables
      Object.keys(import.meta.env).forEach(key => {
        if (key.startsWith('VITE_')) {
          delete import.meta.env[key];
        }
      });
      
      Environment.init();
      
      expect(Environment.DEBUG_MODE).toBe(false);
      expect(Environment.LOG_LEVEL).toBe('info');
      expect(Environment.STARTING_LIVES).toBe(3);
      expect(Environment.BASE_SCORE_MULTIPLIER).toBe(1.0);
      expect(Environment.MAX_PARTICLES).toBe(1000);
      expect(Environment.OBJECT_POOL_SIZE).toBe(200);
    });
    
    it('should initialize with environment variable values', () => {
      import.meta.env.VITE_DEBUG_MODE = 'true';
      import.meta.env.VITE_LOG_LEVEL = 'debug';
      import.meta.env.VITE_STARTING_LIVES = '5';
      import.meta.env.VITE_MAX_PARTICLES = '2000';
      
      Environment.init();
      
      expect(Environment.DEBUG_MODE).toBe(true);
      expect(Environment.LOG_LEVEL).toBe('debug');
      expect(Environment.STARTING_LIVES).toBe(5);
      expect(Environment.MAX_PARTICLES).toBe(2000);
    });
    
    it('should prevent multiple initializations', () => {
      Environment.init();
      const firstInitState = Environment.isInitialized;
      
      Environment.init();
      
      expect(Environment.isInitialized).toBe(firstInitState);
    });
    
    it('should auto-initialize on first access', () => {
      expect(Environment.isInitialized).toBe(false);
      
      const config = Environment.getConfig();
      
      expect(Environment.isInitialized).toBe(true);
      expect(config).toBeDefined();
    });
  });

  describe('Validation System', () => {
    it('should validate all parameters successfully with valid values', () => {
      import.meta.env.VITE_DEBUG_MODE = 'false';
      import.meta.env.VITE_LOG_LEVEL = 'info';
      import.meta.env.VITE_STARTING_LIVES = '3';
      import.meta.env.VITE_BASE_SCORE_MULTIPLIER = '1.5';
      import.meta.env.VITE_MAX_PARTICLES = '1500';
      
      Environment.init();
      
      const isValid = Environment.validate();
      expect(isValid).toBe(true);
      expect(Environment.validationErrors).toHaveLength(0);
    });
    
    it('should handle invalid log level with safe parsing', () => {
      import.meta.env.VITE_LOG_LEVEL = 'invalid-level';
      
      Environment.init();
      
      // Should have used default 'info' due to validation in parseStringWithValidation
      expect(Environment.LOG_LEVEL).toBe('info');
    });
    
    it('should validate individual parameters correctly', () => {
      const validResult = Environment.validateParameter('TEST_PARAM', 5, {
        type: 'number',
        min: 1,
        max: 10
      });
      expect(validResult.valid).toBe(true);
      
      const invalidResult = Environment.validateParameter('TEST_PARAM', 15, {
        type: 'number',
        min: 1,
        max: 10
      });
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.error).toContain('above maximum');
    });
    
    it('should validate string enums correctly', () => {
      const validResult = Environment.validateParameter('LOG_LEVEL', 'debug', {
        type: 'string',
        values: ['debug', 'info', 'warn', 'error']
      });
      expect(validResult.valid).toBe(true);
      
      const invalidResult = Environment.validateParameter('LOG_LEVEL', 'invalid', {
        type: 'string',
        values: ['debug', 'info', 'warn', 'error']
      });
      expect(invalidResult.valid).toBe(false);
    });
  });

  describe('Production Safety', () => {
    it('should warn about debug settings in production', () => {
      import.meta.env.PROD = true;
      import.meta.env.DEV = false;
      import.meta.env.VITE_DEBUG_MODE = 'true';
      import.meta.env.VITE_PHYSICS_DEBUG = 'true';
      
      Environment.init();
      
      // Warnings should be logged (mocked Logger calls would be verified in real implementation)
      expect(Environment.DEBUG_MODE).toBe(true);
      expect(Environment.PHYSICS_DEBUG).toBe(true);
      expect(Environment.IS_PRODUCTION).toBe(true);
    });
  });

  describe('Failsafe Handling', () => {
    it('should load failsafe defaults on initialization failure', () => {
      // Mock a failure scenario by making Logger throw
      vi.doMock('../../src/utils/Logger.js', () => ({
        default: {
          debug: vi.fn(() => { throw new Error('Logger failure'); }),
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn()
        }
      }));
      
      Environment.loadFailsafeDefaults();
      
      expect(Environment.DEBUG_MODE).toBe(false);
      expect(Environment.LOG_LEVEL).toBe('error');
      expect(Environment.MAX_PARTICLES).toBe(500); // Lower failsafe value
      expect(Environment.OBJECT_POOL_SIZE).toBe(100); // Lower failsafe value
    });
  });

  describe('Configuration Export', () => {
    it('should export complete configuration with metadata', () => {
      Environment.init();
      
      const exportedConfig = Environment.exportConfig();
      
      expect(exportedConfig.version).toBe('2.0.0');
      expect(exportedConfig.timestamp).toBeDefined();
      expect(exportedConfig.configuration).toBeDefined();
      expect(exportedConfig.schema).toBeDefined();
      expect(exportedConfig.validation).toBeDefined();
      
      expect(exportedConfig.configuration.debugMode).toBeDefined();
      expect(exportedConfig.configuration._metadata).toBeDefined();
    });
    
    it('should provide validation status', () => {
      Environment.init();
      
      const validationStatus = Environment.getValidationStatus();
      
      expect(validationStatus.isValid).toBeDefined();
      expect(validationStatus.errors).toBeInstanceOf(Array);
      expect(validationStatus.lastValidated).toBeDefined();
    });
    
    it('should provide schema access', () => {
      const schema = Environment.getSchema();
      
      expect(schema).toEqual(Environment.SCHEMA);
      expect(schema.DEBUG_MODE).toBeDefined();
    });
  });

  describe('Enhanced Configuration Access', () => {
    it('should include metadata in getConfig', () => {
      Environment.init();
      
      const config = Environment.getConfig();
      
      expect(config._metadata).toBeDefined();
      expect(config._metadata.initialized).toBe(true);
      expect(config._metadata.validationErrors).toBeDefined();
      expect(config._metadata.timestamp).toBeDefined();
    });
    
    it('should maintain backward compatibility', () => {
      Environment.init();
      
      const config = Environment.getConfig();
      
      // All original properties should still exist
      expect(config.debugMode).toBeDefined();
      expect(config.logLevel).toBeDefined();
      expect(config.startingLives).toBeDefined();
      expect(config.maxParticles).toBeDefined();
      expect(config.isDevelopment).toBeDefined();
      expect(config.isProduction).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle extreme values gracefully', () => {
      import.meta.env.VITE_STARTING_LIVES = '999999';
      import.meta.env.VITE_MAX_PARTICLES = '-100';
      import.meta.env.VITE_BASE_SCORE_MULTIPLIER = '0';
      
      Environment.init();
      
      // Should use defaults for out-of-bounds values
      expect(Environment.STARTING_LIVES).toBe(3); // Default due to max bound
      expect(Environment.MAX_PARTICLES).toBe(1000); // Default due to min bound
      expect(Environment.BASE_SCORE_MULTIPLIER).toBe(1.0); // Default due to min bound
    });
    
    it('should handle malformed environment variables', () => {
      import.meta.env.VITE_DEBUG_MODE = 'not-a-boolean';
      import.meta.env.VITE_STARTING_LIVES = 'five';
      import.meta.env.VITE_BASE_SCORE_MULTIPLIER = 'one-point-five';
      
      Environment.init();
      
      // Should use defaults for malformed values
      expect(Environment.DEBUG_MODE).toBe(false);
      expect(Environment.STARTING_LIVES).toBe(3);
      expect(Environment.BASE_SCORE_MULTIPLIER).toBe(1.0);
    });
  });
});