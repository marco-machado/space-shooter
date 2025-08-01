/**
 * Test setup file
 * Configures the testing environment for Space Shooter game
 */

// Mock localStorage for Node.js environment
const localStorageMock = {
  storage: {},
  getItem(key) {
    return this.storage[key] || null;
  },
  setItem(key, value) {
    this.storage[key] = value.toString();
  },
  removeItem(key) {
    delete this.storage[key];
  },
  clear() {
    this.storage = {};
  },
  get length() {
    return Object.keys(this.storage).length;
  },
  key(index) {
    const keys = Object.keys(this.storage);
    return keys[index] || null;
  },
};

// Set up global mocks
global.localStorage = localStorageMock;

// Mock performance for Node.js
if (typeof performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
    memory: {
      usedJSHeapSize: 1024 * 1024 * 10, // 10MB mock
    },
  };
}

// Mock console methods for testing (prevent spam)
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: process.env.NODE_ENV === 'test' ? () => {} : originalConsole.log,
  debug: process.env.NODE_ENV === 'test' ? () => {} : originalConsole.debug,
  info: process.env.NODE_ENV === 'test' ? () => {} : originalConsole.info,
  warn: originalConsole.warn,
  error: originalConsole.error,
};

// Set test environment variables
process.env.VITE_DEBUG_MODE = 'false';
process.env.VITE_LOG_LEVEL = 'error';
process.env.VITE_AUDIO_ENABLED = 'false';
process.env.NODE_ENV = 'test';