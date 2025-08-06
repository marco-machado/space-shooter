/**
 * Phaser.Scene mock for testing
 * Provides a minimal implementation of Phaser.Scene interface
 */
class PhaserSceneMock {
  constructor(config = {}) {
    // Basic scene properties that might be used
    this.scene = {
      key: config.key || 'TestScene',
      active: config.active || false,
      visible: config.visible || true,
    };
    
    // Game reference
    this.game = {
      config: {},
      events: new Map(),
    };

    // Events scopeName
    this.events = {
      listeners: new Map(),
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      once: vi.fn(),
    };

    // Common Phaser scene properties
    this.children = {
      list: [],
      add: vi.fn(),
      remove: vi.fn(),
    };

    this.input = {
      keyboard: {
        on: vi.fn(),
        off: vi.fn(),
      },
      on: vi.fn(),
      off: vi.fn(),
    };

    this.time = {
      addEvent: vi.fn(),
      removeEvent: vi.fn(),
    };

    // Essential scene methods
    this.add = {
      rectangle: vi.fn(),
      sprite: vi.fn(),
      image: vi.fn(),
      text: vi.fn(),
    };

    this.physics = {
      add: {
        existing: vi.fn(),
      },
      world: {
        gravity: { x: 0, y: 0 },
      },
    };

    // Mark as Phaser.Scene for instanceof checks
    this.__phaserSceneMock = true;
  }

  // Scene lifecycle methods
  init(data) {
    this.initData = data;
  }

  preload() {
    // Mock preload
  }

  create(data) {
    this.createData = data;
  }

  update(time, delta) {
    this.lastUpdateTime = time;
    this.lastUpdateDelta = delta;
  }

  // Scene management
  start(key, data) {
    this.scene.start = { key, data };
  }

  pause() {
    this.scene.active = false;
  }

  resume() {
    this.scene.active = true;
  }

  sleep() {
    this.scene.active = false;
    this.scene.visible = false;
  }

  wake() {
    this.scene.active = true;
    this.scene.visible = true;
  }

  destroy() {
    this.events.listeners.clear();
    this.children.list = [];
  }
}

// Create a mock constructor that can be used with instanceof
const MockPhaser = {
  Scene: class Scene {
    constructor(config) {
      return new PhaserSceneMock(config);
    }
  }
};

// Make instanceof work correctly
Object.defineProperty(PhaserSceneMock.prototype, Symbol.toStringTag, {
  value: 'Scene'
});

// Export both the mock class and setup function
export default PhaserSceneMock;

export { MockPhaser };

/**
 * Create a valid Phaser.Scene mock instance
 * @param {Object} config - Scene configuration
 * @returns {PhaserSceneMock} Mock scene instance
 */
export const createMockScene = (config = {}) => {
  return new PhaserSceneMock(config);
};

/**
 * Create an invalid object that should fail Phaser.Scene validation
 * @param {string} type - Type of invalid object to create
 * @returns {Object} Invalid object for testing
 */
export const createInvalidScene = (type = 'plain') => {
  switch (type) {
    case 'plain':
      return { notAScene: true };
    case 'string':
      return 'not a scene';
    case 'number':
      return 42;
    case 'array':
      return [];
    case 'function':
      return () => {};
    case 'null':
      return null;
    case 'undefined':
      return undefined;
    default:
      return {};
  }
};