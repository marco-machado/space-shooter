import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import BaseAdapter from '../../src/adapters/BaseAdapter.js';
import { createInvalidScene } from '../__mocks__/PhaserScene.js';
import { getEventBus, resetMockEventBus, createMockEventBus } from '../__mocks__/EventBus.js';

// Mock the EventBus module
vi.mock('@/event-bus/EventBus.js', () => ({
  getEventBus: () => getEventBus(),
}));

// Create Phaser Scene mock class that can be used with instanceof
class PhaserScene {
  constructor(config = {}) {
    this.scene = {
      key: config.key || 'TestScene',
      active: config.active || false,
      visible: config.visible || true,
    };
    
    this.game = { config: {}, events: new Map() };
    this.events = { on: vi.fn(), off: vi.fn(), emit: vi.fn(), once: vi.fn() };
    this.children = { list: [], add: vi.fn(), remove: vi.fn() };
    this.input = { keyboard: { on: vi.fn(), off: vi.fn() }, on: vi.fn(), off: vi.fn() };
    this.time = { addEvent: vi.fn(), removeEvent: vi.fn() };
    this.add = { rectangle: vi.fn(), sprite: vi.fn(), image: vi.fn(), text: vi.fn() };
    this.physics = { add: { existing: vi.fn() }, world: { gravity: { x: 0, y: 0 } } };
  }
}

// Mock Phaser globally for instanceof checks
global.Phaser = { Scene: PhaserScene };

/**
 * Test suite for BaseAdapter class
 * 
 * Tests the abstract BaseAdapter class functionality including:
 * - Abstract class instantiation prevention
 * - Constructor validation and initialization
 * - Phaser.Scene parameter validation
 * - EventBus integration
 * - Error handling for invalid inputs
 * - Inheritance patterns
 */
describe('BaseAdapter', () => {
  let mockScene;
  let mockEventBus;

  beforeEach(() => {
    // Reset mocks before each test
    resetMockEventBus();
    mockScene = new PhaserScene({ key: 'TestScene' });
    mockEventBus = getEventBus();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    resetMockEventBus();
    vi.clearAllMocks();
  });

  describe('Abstract Class Behavior', () => {
    it('should throw error when instantiated directly', () => {
      expect(() => {
        new BaseAdapter(mockScene);
      }).toThrow('BaseAdapter is abstract and cannot be instantiated directly');
    });

    it('should provide specific error message for direct instantiation', () => {
      try {
        new BaseAdapter(mockScene);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('BaseAdapter is abstract and cannot be instantiated directly');
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should allow instantiation through inheritance', () => {
      // Create a concrete subclass for testing
      class ConcreteAdapter extends BaseAdapter {
        constructor(scene) {
          super(scene);
          this.adapterType = 'concrete';
        }
      }

      expect(() => {
        const adapter = new ConcreteAdapter(mockScene);
        expect(adapter).toBeInstanceOf(BaseAdapter);
        expect(adapter).toBeInstanceOf(ConcreteAdapter);
        expect(adapter.adapterType).toBe('concrete');
      }).not.toThrow();
    });
  });

  describe('Constructor Validation', () => {
    class TestAdapter extends BaseAdapter {
      constructor(scene) {
        super(scene);
      }
    }

    describe('Valid Scene Parameter', () => {
      it('should accept valid Phaser.Scene object', () => {
        const adapter = new TestAdapter(mockScene);
        
        expect(adapter.scene).toBe(mockScene);
        expect(adapter.scene).toHaveProperty('scene');
        expect(adapter.scene).toHaveProperty('events');
        expect(adapter.scene).toHaveProperty('add');
      });

      it('should store scene reference correctly', () => {
        const customScene = new PhaserScene({ key: 'CustomScene' });
        const adapter = new TestAdapter(customScene);
        
        expect(adapter.scene).toBe(customScene);
        expect(adapter.scene.scene.key).toBe('CustomScene');
      });

      it('should work with different scene configurations', () => {
        const activeScene = new PhaserScene({ 
          key: 'ActiveScene', 
          active: true, 
          visible: true 
        });
        const adapter = new TestAdapter(activeScene);
        
        expect(adapter.scene.scene.active).toBe(true);
        expect(adapter.scene.scene.visible).toBe(true);
        expect(adapter.scene.scene.key).toBe('ActiveScene');
      });
    });

    describe('Invalid Scene Parameter - Null Values', () => {
      it('should throw error for null scene', () => {
        expect(() => {
          new TestAdapter(null);
        }).toThrow('Adapter requires a Phaser.Scene object');
      });

      it('should throw error for undefined scene', () => {
        expect(() => {
          new TestAdapter(undefined);
        }).toThrow('Adapter requires a Phaser.Scene object');
      });

      it('should provide specific error message for null scene', () => {
        try {
          new TestAdapter(null);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.message).toBe('Adapter requires a Phaser.Scene object');
          expect(error).toBeInstanceOf(Error);
        }
      });
    });

    describe('Invalid Scene Parameter - Wrong Types', () => {
      it('should throw error for plain object', () => {
        const invalidScene = createInvalidScene('plain');
        expect(() => {
          new TestAdapter(invalidScene);
        }).toThrow('Adapter requires a Phaser.Scene object');
      });

      it('should throw error for string', () => {
        const invalidScene = createInvalidScene('string');
        expect(() => {
          new TestAdapter(invalidScene);
        }).toThrow('Adapter requires a Phaser.Scene object');
      });

      it('should throw error for number', () => {
        const invalidScene = createInvalidScene('number');
        expect(() => {
          new TestAdapter(invalidScene);
        }).toThrow('Adapter requires a Phaser.Scene object');
      });

      it('should throw error for array', () => {
        const invalidScene = createInvalidScene('array');
        expect(() => {
          new TestAdapter(invalidScene);
        }).toThrow('Adapter requires a Phaser.Scene object');
      });

      it('should throw error for function', () => {
        const invalidScene = createInvalidScene('function');
        expect(() => {
          new TestAdapter(invalidScene);
        }).toThrow('Adapter requires a Phaser.Scene object');
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty object', () => {
        const emptyObject = {};
        expect(() => {
          new TestAdapter(emptyObject);
        }).toThrow('Adapter requires a Phaser.Scene object');
      });

      it('should handle object with scene-like properties but wrong constructor', () => {
        const fakeScene = {
          scene: { key: 'fake' },
          events: { on: vi.fn() },
          add: { rectangle: vi.fn() },
        };
        
        expect(() => {
          new TestAdapter(fakeScene);
        }).toThrow('Adapter requires a Phaser.Scene object');
      });

      it('should validate constructor name correctly', () => {
        // Create object that looks like a scene but isn't
        const almostScene = {
          scene: { key: 'almost' },
          events: { on: vi.fn() },
          constructor: { name: 'NotScene' },
        };
        
        expect(() => {
          new TestAdapter(almostScene);
        }).toThrow('Adapter requires a Phaser.Scene object');
      });
    });
  });

  describe('EventBus Integration', () => {
    class TestAdapter extends BaseAdapter {
      constructor(scene) {
        super(scene);
      }

      // Helper method to access eventBus for testing
      getEventBus() {
        return this.eventBus;
      }
    }

    it('should initialize eventBus from getEventBus function', () => {
      const adapter = new TestAdapter(mockScene);
      
      expect(adapter.eventBus).toBeDefined();
      expect(adapter.eventBus).toBe(mockEventBus);
    });

    it('should have eventBus with expected methods', () => {
      const adapter = new TestAdapter(mockScene);
      
      expect(adapter.eventBus).toHaveProperty('on');
      expect(adapter.eventBus).toHaveProperty('once');
      expect(adapter.eventBus).toHaveProperty('emit');
      expect(adapter.eventBus).toHaveProperty('onAny');
      expect(typeof adapter.eventBus.on).toBe('function');
      expect(typeof adapter.eventBus.emit).toBe('function');
    });

    it('should share same eventBus instance across adapters', () => {
      const adapter1 = new TestAdapter(mockScene);
      const adapter2 = new TestAdapter(new PhaserScene({ key: 'Scene2' }));
      
      expect(adapter1.eventBus).toBe(adapter2.eventBus);
      expect(adapter1.eventBus).toBe(mockEventBus);
    });

    it('should be able to use eventBus for communication', () => {
      const adapter = new TestAdapter(mockScene);
      const eventCallback = vi.fn();
      
      // Register listener
      adapter.eventBus.on('test-event', eventCallback);
      
      // Emit event
      adapter.eventBus.emit('test-event', { message: 'test data' });
      
      expect(eventCallback).toHaveBeenCalledTimes(1);
      expect(eventCallback).toHaveBeenCalledWith(
        { message: 'test data' },
        expect.objectContaining({ type: 'test-event' })
      );
    });
  });

  describe('Inheritance Patterns', () => {
    it('should support single-level inheritance', () => {
      class SingleLevelAdapter extends BaseAdapter {
        constructor(scene) {
          super(scene);
          this.level = 'single';
        }

        getLevel() {
          return this.level;
        }
      }

      const adapter = new SingleLevelAdapter(mockScene);
      
      expect(adapter).toBeInstanceOf(BaseAdapter);
      expect(adapter).toBeInstanceOf(SingleLevelAdapter);
      expect(adapter.getLevel()).toBe('single');
      expect(adapter.scene).toBe(mockScene);
      expect(adapter.eventBus).toBeDefined();
    });

    it('should support multi-level inheritance', () => {
      class MiddleAdapter extends BaseAdapter {
        constructor(scene) {
          super(scene);
          this.middleware = true;
        }
      }

      class ConcreteAdapter extends MiddleAdapter {
        constructor(scene) {
          super(scene);
          this.concrete = true;
        }

        getCombinedProperties() {
          return {
            middleware: this.middleware,
            concrete: this.concrete,
            hasScene: !!this.scene,
            hasEventBus: !!this.eventBus,
          };
        }
      }

      const adapter = new ConcreteAdapter(mockScene);
      const props = adapter.getCombinedProperties();
      
      expect(adapter).toBeInstanceOf(BaseAdapter);
      expect(adapter).toBeInstanceOf(MiddleAdapter);
      expect(adapter).toBeInstanceOf(ConcreteAdapter);
      expect(props.middleware).toBe(true);
      expect(props.concrete).toBe(true);
      expect(props.hasScene).toBe(true);
      expect(props.hasEventBus).toBe(true);
    });

    it('should preserve constructor validation in inheritance chain', () => {
      class StrictAdapter extends BaseAdapter {
        constructor(scene) {
          super(scene); // This should still validate the scene
          this.strictMode = true;
        }
      }

      // Valid construction should work
      expect(() => {
        const adapter = new StrictAdapter(mockScene);
        expect(adapter.strictMode).toBe(true);
      }).not.toThrow();

      // Invalid construction should still fail
      expect(() => {
        new StrictAdapter(null);
      }).toThrow('Adapter requires a Phaser.Scene object');

      expect(() => {
        new StrictAdapter('invalid');
      }).toThrow('Adapter requires a Phaser.Scene object');
    });
  });

  describe('Integration Tests', () => {
    class IntegrationTestAdapter extends BaseAdapter {
      constructor(scene) {
        super(scene);
        this.initialized = false;
      }

      initialize() {
        // Simulate adapter initialization
        this.sceneKey = this.scene.scene.key;
        this.eventListenerId = this.eventBus.on('adapter-test', this.handleEvent.bind(this));
        this.initialized = true;
        return this;
      }

      handleEvent(data) {
        this.lastEventData = data;
      }

      getStatus() {
        return {
          initialized: this.initialized,
          sceneKey: this.sceneKey,
          hasEventBus: !!this.eventBus,
          lastEventData: this.lastEventData,
        };
      }
    }

    it('should work with realistic adapter implementation', () => {
      const testScene = new PhaserScene({ key: 'IntegrationScene' });
      const adapter = new IntegrationTestAdapter(testScene);
      
      // Initialize adapter
      const result = adapter.initialize();
      
      expect(result).toBe(adapter); // Should return self for chaining
      expect(adapter.initialized).toBe(true);
      expect(adapter.sceneKey).toBe('IntegrationScene');
    });

    it('should handle event communication in realistic scenario', () => {
      const adapter = new IntegrationTestAdapter(mockScene);
      adapter.initialize();
      
      // Emit event that adapter is listening for
      adapter.eventBus.emit('adapter-test', { action: 'test', value: 42 });
      
      const status = adapter.getStatus();
      expect(status.lastEventData).toEqual({ action: 'test', value: 42 });
    });

    it('should handle multiple adapters with same scene', () => {
      class AdapterA extends BaseAdapter {
        constructor(scene) {
          super(scene);
          this.type = 'A';
        }
      }

      class AdapterB extends BaseAdapter {
        constructor(scene) {
          super(scene);
          this.type = 'B';
        }
      }

      const sharedScene = new PhaserScene({ key: 'SharedScene' });
      const adapterA = new AdapterA(sharedScene);
      const adapterB = new AdapterB(sharedScene);
      
      expect(adapterA.scene).toBe(sharedScene);
      expect(adapterB.scene).toBe(sharedScene);
      expect(adapterA.scene).toBe(adapterB.scene);
      expect(adapterA.eventBus).toBe(adapterB.eventBus);
      expect(adapterA.type).toBe('A');
      expect(adapterB.type).toBe('B');
    });
  });

  describe('Error Handling Edge Cases', () => {
    class TestAdapter extends BaseAdapter {
      constructor(scene) {
        super(scene);
      }
    }

    it('should handle scene with null properties gracefully', () => {
      // Create a mock scene with some null properties
      const partialScene = new PhaserScene();
      partialScene.events = null;
      
      // Should still pass validation since it's instanceof Phaser.Scene
      expect(() => {
        const adapter = new TestAdapter(partialScene);
        expect(adapter.scene).toBe(partialScene);
      }).not.toThrow();
    });

    it('should maintain error message consistency', () => {
      const errorMessage = 'Adapter requires a Phaser.Scene object';
      const invalidInputs = [
        null,
        undefined,
        'string',
        42,
        [],
        {},
        () => {},
        new Date(),
        new Map(),
        Symbol('test'),
      ];

      invalidInputs.forEach((input, index) => {
        try {
          new TestAdapter(input);
          expect.fail(`Should have thrown error for input ${index}: ${input}`);
        } catch (error) {
          expect(error.message).toBe(errorMessage);
        }
      });
    });

    it('should handle constructor called with no arguments', () => {
      expect(() => {
        new TestAdapter();
      }).toThrow('Adapter requires a Phaser.Scene object');
    });

    it('should handle constructor called with too many arguments', () => {
      // Should ignore extra arguments and only validate first one
      const adapter = new TestAdapter(mockScene, 'extra', 'arguments', 123);
      expect(adapter.scene).toBe(mockScene);
    });
  });

  describe('Property Access and State', () => {
    class PropertyTestAdapter extends BaseAdapter {
      constructor(scene) {
        super(scene);
      }

      getProperties() {
        return {
          scene: this.scene,
          eventBus: this.eventBus,
          hasScene: this.scene !== null && this.scene !== undefined,
          hasEventBus: this.eventBus !== null && this.eventBus !== undefined,
        };
      }
    }

    it('should provide access to scene property', () => {
      const adapter = new PropertyTestAdapter(mockScene);
      const props = adapter.getProperties();
      
      expect(props.scene).toBe(mockScene);
      expect(props.hasScene).toBe(true);
    });

    it('should provide access to eventBus property', () => {
      const adapter = new PropertyTestAdapter(mockScene);
      const props = adapter.getProperties();
      
      expect(props.eventBus).toBe(mockEventBus);
      expect(props.hasEventBus).toBe(true);
      expect(typeof props.eventBus.emit).toBe('function');
    });

    it('should maintain property integrity after construction', () => {
      const adapter = new PropertyTestAdapter(mockScene);
      const initialProps = adapter.getProperties();
      
      // Properties should remain stable
      setTimeout(() => {
        const laterProps = adapter.getProperties();
        expect(laterProps.scene).toBe(initialProps.scene);
        expect(laterProps.eventBus).toBe(initialProps.eventBus);
      }, 0);
    });
  });

  describe('Performance and Memory', () => {
    class PerformanceTestAdapter extends BaseAdapter {
      constructor(scene) {
        super(scene);
        this.createdAt = Date.now();
      }
    }

    it('should create adapters efficiently', () => {
      const startTime = Date.now();
      const adapters = [];
      
      // Create multiple adapters
      for (let i = 0; i < 10; i++) {
        const scene = new PhaserScene({ key: `Scene${i}` });
        adapters.push(new PerformanceTestAdapter(scene));
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      expect(adapters).toHaveLength(10);
      expect(totalTime).toBeLessThan(100); // Should be very fast
      
      // Each adapter should have correct properties
      adapters.forEach((adapter, index) => {
        expect(adapter.scene.scene.key).toBe(`Scene${index}`);
        expect(adapter.eventBus).toBe(mockEventBus);
        expect(adapter.createdAt).toBeGreaterThanOrEqual(startTime);
      });
    });

    it('should share eventBus instance to save memory', () => {
      const adapters = Array.from({ length: 5 }, (_, i) => {
        const scene = new PhaserScene({ key: `MemoryScene${i}` });
        return new PerformanceTestAdapter(scene);
      });
      
      // All adapters should share the same eventBus instance
      const firstEventBus = adapters[0].eventBus;
      adapters.forEach(adapter => {
        expect(adapter.eventBus).toBe(firstEventBus);
      });
    });
  });
});