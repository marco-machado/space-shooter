/**
 * Mock for import.meta.env to facilitate testing of environment variable handling
 * This mock provides utilities for testing different environment configurations
 */

export class ImportMetaMock {
  constructor() {
    this.env = {
      // Default Vite environment variables
      DEV: false,
      PROD: true,
      MODE: 'test',
      BASE_URL: '/',
      SSR: false,
      // Test defaults
      NODE_ENV: 'test'
    };
  }

  /**
   * Set a single environment variable
   * @param {string} key - Environment variable key
   * @param {any} value - Environment variable value
   */
  setEnv(key, value) {
    this.env[key] = value;
  }

  /**
   * Set multiple environment variables
   * @param {Object} envVars - Object with key-value pairs
   */
  setEnvVars(envVars) {
    Object.assign(this.env, envVars);
  }

  /**
   * Clear all VITE_ prefixed environment variables
   */
  clearViteEnv() {
    Object.keys(this.env).forEach(key => {
      if (key.startsWith('VITE_')) {
        delete this.env[key];
      }
    });
  }

  /**
   * Reset to default test environment
   */
  resetToDefaults() {
    this.env = {
      DEV: false,
      PROD: true,
      MODE: 'test',
      BASE_URL: '/',
      SSR: false,
      NODE_ENV: 'test'
    };
  }

  /**
   * Set up development environment
   */
  setDevelopmentEnv() {
    this.env.DEV = true;
    this.env.PROD = false;
    this.env.MODE = 'development';
  }

  /**
   * Set up production environment
   */
  setProductionEnv() {
    this.env.DEV = false;
    this.env.PROD = true;
    this.env.MODE = 'production';
  }

  /**
   * Set up common debug configuration
   */
  setDebugConfig() {
    this.setEnvVars({
      VITE_DEBUG_MODE: 'true',
      VITE_LOG_LEVEL: 'debug',
      VITE_PHYSICS_DEBUG: 'true',
      VITE_SHOW_FPS: 'true',
      VITE_SHOW_DEBUG_INFO: 'true'
    });
  }

  /**
   * Set up common production configuration
   */
  setProductionConfig() {
    this.setEnvVars({
      VITE_DEBUG_MODE: 'false',
      VITE_LOG_LEVEL: 'error',
      VITE_PHYSICS_DEBUG: 'false',
      VITE_SHOW_FPS: 'false',
      VITE_SHOW_DEBUG_INFO: 'false'
    });
  }

  /**
   * Set up game configuration with custom values
   * @param {Object} config - Configuration object
   */
  setGameConfig(config = {}) {
    const defaults = {
      VITE_STARTING_LIVES: '3',
      VITE_BASE_SCORE_MULTIPLIER: '1.0',
      VITE_MAX_PARTICLES: '1000',
      VITE_OBJECT_POOL_SIZE: '200',
      VITE_AUDIO_ENABLED: 'true'
    };
    
    this.setEnvVars({ ...defaults, ...config });
  }

  /**
   * Set up invalid configuration for testing error handling
   */
  setInvalidConfig() {
    this.setEnvVars({
      VITE_DEBUG_MODE: 'maybe',
      VITE_LOG_LEVEL: 'invalid',
      VITE_STARTING_LIVES: 'not-a-number',
      VITE_BASE_SCORE_MULTIPLIER: 'invalid-float',
      VITE_MAX_PARTICLES: '-100',
      VITE_OBJECT_POOL_SIZE: '99999'
    });
  }

  /**
   * Set up edge case values for testing bounds
   */
  setEdgeCaseConfig() {
    this.setEnvVars({
      VITE_STARTING_LIVES: '10', // Maximum
      VITE_BASE_SCORE_MULTIPLIER: '10.0', // Maximum
      VITE_MAX_PARTICLES: '10000', // Maximum
      VITE_OBJECT_POOL_SIZE: '1000' // Maximum
    });
  }

  /**
   * Get current environment object
   * @returns {Object} Current environment variables
   */
  getEnv() {
    return { ...this.env };
  }
}

// Create a global instance for use in tests
export const importMetaMock = new ImportMetaMock();

/**
 * Helper function to setup import.meta.env mock in tests
 * @param {Object} envVars - Environment variables to set
 * @returns {Function} Cleanup function to restore original import.meta.env
 */
export function mockImportMeta(envVars = {}) {
  const originalImportMeta = import.meta.env;
  
  importMetaMock.resetToDefaults();
  importMetaMock.setEnvVars(envVars);
  
  // Replace import.meta.env with our mock
  import.meta.env = importMetaMock.env;
  
  // Return cleanup function
  return () => {
    import.meta.env = originalImportMeta;
  };
}

/**
 * Helper function for common test environment setups
 */
export const testEnvironments = {
  development: () => ({
    DEV: true,
    PROD: false,
    MODE: 'development',
    VITE_DEBUG_MODE: 'true',
    VITE_LOG_LEVEL: 'debug'
  }),
  
  production: () => ({
    DEV: false,
    PROD: true,
    MODE: 'production',
    VITE_DEBUG_MODE: 'false',
    VITE_LOG_LEVEL: 'error'
  }),
  
  test: () => ({
    DEV: false,
    PROD: true,
    MODE: 'test',
    NODE_ENV: 'test'
  }),
  
  debugEnabled: () => ({
    VITE_DEBUG_MODE: 'true',
    VITE_LOG_LEVEL: 'debug',
    VITE_PHYSICS_DEBUG: 'true',
    VITE_SHOW_FPS: 'true',
    VITE_SHOW_DEBUG_INFO: 'true'
  }),
  
  productionSafe: () => ({
    VITE_DEBUG_MODE: 'false',
    VITE_LOG_LEVEL: 'error',
    VITE_PHYSICS_DEBUG: 'false',
    VITE_SHOW_FPS: 'false',
    VITE_SHOW_DEBUG_INFO: 'false'
  }),
  
  gameDefaults: () => ({
    VITE_STARTING_LIVES: '3',
    VITE_BASE_SCORE_MULTIPLIER: '1.0',
    VITE_MAX_PARTICLES: '1000',
    VITE_OBJECT_POOL_SIZE: '200',
    VITE_AUDIO_ENABLED: 'true'
  }),
  
  invalidValues: () => ({
    VITE_DEBUG_MODE: 'not-boolean',
    VITE_LOG_LEVEL: 'invalid-level',
    VITE_STARTING_LIVES: 'not-number',
    VITE_BASE_SCORE_MULTIPLIER: 'invalid-float',
    VITE_MAX_PARTICLES: '-100'
  }),
  
  extremeValues: () => ({
    VITE_STARTING_LIVES: '999999',
    VITE_BASE_SCORE_MULTIPLIER: '0',
    VITE_MAX_PARTICLES: '99999999',
    VITE_OBJECT_POOL_SIZE: '-50'
  })
};

export default {
  ImportMetaMock,
  importMetaMock,
  mockImportMeta,
  testEnvironments
};