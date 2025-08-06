import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Logger - define before import
vi.mock('../../src/utils/Logger.js', () => ({
  default: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import BaseSystem from '../../src/systems/BaseSystem.js';
import Logger from '@/utils/Logger.js';

// Mock performance.now()
const mockPerformanceNow = vi.fn();
Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow,
  },
  writable: true,
});

// Mock Date.now for ID generation
const mockDateNow = vi.fn();
Date.now = mockDateNow;

// Mock Math.random for ID generation  
const mockMathRandom = vi.fn();
Math.random = mockMathRandom;

// Helper: Create mock entity
function createMockEntity(active = true, components = []) {
  return {
    active,
    hasComponent: vi.fn((componentType) => components.includes(componentType)),
  };
}

// Helper: Create mock scene
function createMockScene(key = 'TestScene') {
  return {
    scene: { key },
  };
}

// Test subclass for inheritance testing
class TestSystem extends BaseSystem {
  constructor(shouldThrowInUpdate = false) {
    super();
    this.shouldThrowInUpdate = shouldThrowInUpdate;
    this.updateCalled = false;
    this.entitiesProcessed = [];
    this.deltaReceived = null;
  }

  update(entities, delta) {
    this.updateCalled = true;
    this.entitiesProcessed = entities;
    this.deltaReceived = delta;
    
    if (this.shouldThrowInUpdate) {
      throw new Error('Test error in update');
    }
  }
}

// Component classes for testing
class ComponentA {}
class ComponentB {}
class ComponentC {}

describe('BaseSystem', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    mockDateNow.mockReturnValue(1609459200000); // Fixed timestamp
    mockMathRandom.mockReturnValue(0.123456789); // Fixed random
    mockPerformanceNow.mockReturnValue(1000.0); // Fixed performance time
  });

  describe('Constructor and ID Generation', () => {
    it('should create scopeName with correct initial properties', () => {
      const system = new BaseSystem();

      expect(system.name).toBe('BaseSystem');
      expect(system.active).toBe(true);
      expect(system.priority).toBe(0);
      expect(system.systemId).toBeDefined();
      expect(system.updateCount).toBe(0);
      expect(system.totalUpdateTime).toBe(0);
      expect(system.averageUpdateTime).toBe(0);
    });

    it('should generate unique scopeName IDs', () => {
      mockDateNow.mockReturnValueOnce(1000);
      mockMathRandom.mockReturnValueOnce(0.5);
      
      const id1 = BaseSystem.generateId();
      
      mockDateNow.mockReturnValueOnce(2000);
      mockMathRandom.mockReturnValueOnce(0.7);
      
      const id2 = BaseSystem.generateId();

      expect(id1).toMatch(/^sys_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^sys_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('should generate scopeName ID with expected format', () => {
      mockDateNow.mockReturnValue(1609459200000);
      mockMathRandom.mockReturnValue(0.123456789);

      const id = BaseSystem.generateId();

      expect(id).toBe(`sys_1609459200000_${(0.123456789).toString(36).slice(2, 11)}`);
    });

    it('should log scopeName creation', () => {
      const system = new BaseSystem();

      expect(Logger.debug).toHaveBeenCalledWith(
        `[BaseSystem] System created: BaseSystem (${system.systemId})`
      );
    });

    it('should use constructor name for derived classes', () => {
      const testSystem = new TestSystem();

      expect(testSystem.name).toBe('TestSystem');
      expect(Logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('System created: TestSystem')
      );
    });
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const system = new BaseSystem();
      
      system.init();

      expect(system.active).toBe(true);
      expect(system.priority).toBe(0);
      expect(Logger.debug).toHaveBeenCalledWith(
        '[BaseSystem] System initialized: BaseSystem',
        {}
      );
    });

    it('should initialize with custom configuration', () => {
      const system = new BaseSystem();
      const config = { active: false, priority: 5 };

      system.init(config);

      expect(system.active).toBe(false);
      expect(system.priority).toBe(5);
      expect(Logger.debug).toHaveBeenCalledWith(
        '[BaseSystem] System initialized: BaseSystem',
        config
      );
    });

    it('should handle partial configuration', () => {
      const system = new BaseSystem();
      
      system.init({ active: false });

      expect(system.active).toBe(false);
      expect(system.priority).toBe(0); // Default value
    });

    it('should handle undefined and null values in config', () => {
      const system = new BaseSystem();
      
      system.init({ active: undefined, priority: null });

      expect(system.active).toBe(true); // Default when undefined
      expect(system.priority).toBe(0); // Default when falsy
    });
  });

  describe('Abstract Method Enforcement', () => {
    it('should throw error when update() is called on base class', () => {
      const system = new BaseSystem();
      const entities = [];
      const delta = 16.67;

      expect(() => {
        system.update(entities, delta);
      }).toThrow('BaseSystem must implement update() method');
    });

    it('should not throw error when update() is implemented in subclass', () => {
      const testSystem = new TestSystem();
      const entities = [];
      const delta = 16.67;

      expect(() => {
        testSystem.update(entities, delta);
      }).not.toThrow();

      expect(testSystem.updateCalled).toBe(true);
      expect(testSystem.entitiesProcessed).toBe(entities);
      expect(testSystem.deltaReceived).toBe(delta);
    });
  });

  describe('Process Method with Performance Tracking', () => {
    it('should not process when scopeName is inactive', () => {
      const testSystem = new TestSystem();
      testSystem.setActive(false);
      
      testSystem.process([], 16.67);

      expect(testSystem.updateCalled).toBe(false);
      expect(testSystem.updateCount).toBe(0);
    });

    it('should process and track performance when active', () => {
      const testSystem = new TestSystem();
      mockPerformanceNow.mockReturnValueOnce(1000.0).mockReturnValueOnce(1010.5);

      testSystem.process([], 16.67);

      expect(testSystem.updateCalled).toBe(true);
      expect(testSystem.updateCount).toBe(1);
      expect(testSystem.totalUpdateTime).toBe(10.5);
      expect(testSystem.averageUpdateTime).toBe(10.5);
    });

    it('should calculate correct average update time over multiple updates', () => {
      const testSystem = new TestSystem();
      
      // First update: 10ms
      mockPerformanceNow.mockReturnValueOnce(1000.0).mockReturnValueOnce(1010.0);
      testSystem.process([], 16.67);
      
      // Second update: 20ms
      mockPerformanceNow.mockReturnValueOnce(2000.0).mockReturnValueOnce(2020.0);
      testSystem.process([], 16.67);

      expect(testSystem.updateCount).toBe(2);
      expect(testSystem.totalUpdateTime).toBe(30.0);
      expect(testSystem.averageUpdateTime).toBe(15.0);
    });

    it('should log performance warning for slow updates', () => {
      const testSystem = new TestSystem();
      // Simulate slow update (>16.67ms)
      mockPerformanceNow.mockReturnValueOnce(1000.0).mockReturnValueOnce(1020.0);

      testSystem.process([], 16.67);

      expect(Logger.warn).toHaveBeenCalledWith(
        '[BaseSystem] Slow scopeName update: TestSystem took 20.00ms'
      );
    });

    it('should not log warning for fast updates', () => {
      const testSystem = new TestSystem();
      // Simulate fast update (<16.67ms)
      mockPerformanceNow.mockReturnValueOnce(1000.0).mockReturnValueOnce(1010.0);

      testSystem.process([], 16.67);

      expect(Logger.warn).not.toHaveBeenCalled();
    });

    it('should handle errors in update method gracefully', () => {
      const testSystem = new TestSystem(true); // Will throw in update
      mockPerformanceNow.mockReturnValueOnce(1000.0).mockReturnValueOnce(1010.0);

      testSystem.process([], 16.67);

      expect(Logger.error).toHaveBeenCalledWith(
        '[BaseSystem] Error processing scopeName TestSystem:',
        expect.any(Error)
      );
      expect(testSystem.updateCount).toBe(0); // Should not increment on error
    });

    it('should still track performance even when update throws', () => {
      const testSystem = new TestSystem(true);
      mockPerformanceNow.mockReturnValueOnce(1000.0).mockReturnValueOnce(1015.0);

      testSystem.process([], 16.67);

      expect(testSystem.totalUpdateTime).toBe(15.0);
      expect(testSystem.averageUpdateTime).toBe(Infinity); // 15/0 = Infinity
    });
  });

  describe('Entity Filtering', () => {
    describe('getEntitiesWithComponents', () => {
      it('should filter entities with all required components', () => {
        const system = new BaseSystem();
        const entity1 = createMockEntity(true, [ComponentA, ComponentB]);
        const entity2 = createMockEntity(true, [ComponentA]);
        const entity3 = createMockEntity(true, [ComponentA, ComponentB, ComponentC]);
        const entities = [entity1, entity2, entity3];

        const result = system.getEntitiesWithComponents(entities, [ComponentA, ComponentB]);

        expect(result).toEqual([entity1, entity3]);
        expect(entity1.hasComponent).toHaveBeenCalledWith(ComponentA);
        expect(entity1.hasComponent).toHaveBeenCalledWith(ComponentB);
        expect(entity2.hasComponent).toHaveBeenCalledWith(ComponentA);
        expect(entity2.hasComponent).toHaveBeenCalledWith(ComponentB);
      });

      it('should exclude inactive entities', () => {
        const system = new BaseSystem();
        const entity1 = createMockEntity(false, [ComponentA, ComponentB]); // Inactive
        const entity2 = createMockEntity(true, [ComponentA, ComponentB]);
        const entities = [entity1, entity2];

        const result = system.getEntitiesWithComponents(entities, [ComponentA]);

        expect(result).toEqual([entity2]);
      });

      it('should return empty array when no entities match', () => {
        const system = new BaseSystem();
        const entity1 = createMockEntity(true, [ComponentA]);
        const entity2 = createMockEntity(true, [ComponentB]);
        const entities = [entity1, entity2];

        const result = system.getEntitiesWithComponents(entities, [ComponentA, ComponentB]);

        expect(result).toEqual([]);
      });

      it('should handle empty entities array', () => {
        const system = new BaseSystem();

        const result = system.getEntitiesWithComponents([], [ComponentA]);

        expect(result).toEqual([]);
      });

      it('should handle empty required components array', () => {
        const system = new BaseSystem();
        const entity1 = createMockEntity(true, [ComponentA]);
        const entity2 = createMockEntity(true, [ComponentB]);
        const entities = [entity1, entity2];

        const result = system.getEntitiesWithComponents(entities, []);

        expect(result).toEqual([entity1, entity2]);
      });
    });

    describe('getEntitiesWithAnyComponent', () => {
      it('should filter entities with any of the required components', () => {
        const system = new BaseSystem();
        const entity1 = createMockEntity(true, [ComponentA]);
        const entity2 = createMockEntity(true, [ComponentB]);
        const entity3 = createMockEntity(true, [ComponentC]);
        const entities = [entity1, entity2, entity3];

        const result = system.getEntitiesWithAnyComponent(entities, [ComponentA, ComponentB]);

        expect(result).toEqual([entity1, entity2]);
      });

      it('should exclude inactive entities', () => {
        const system = new BaseSystem();
        const entity1 = createMockEntity(false, [ComponentA]); // Inactive
        const entity2 = createMockEntity(true, [ComponentA]);
        const entities = [entity1, entity2];

        const result = system.getEntitiesWithAnyComponent(entities, [ComponentA]);

        expect(result).toEqual([entity2]);
      });

      it('should return empty array when no entities match', () => {
        const system = new BaseSystem();
        const entity1 = createMockEntity(true, [ComponentC]);
        const entities = [entity1];

        const result = system.getEntitiesWithAnyComponent(entities, [ComponentA, ComponentB]);

        expect(result).toEqual([]);
      });

      it('should handle empty entities array', () => {
        const system = new BaseSystem();

        const result = system.getEntitiesWithAnyComponent([], [ComponentA]);

        expect(result).toEqual([]);
      });

      it('should handle empty component types array', () => {
        const system = new BaseSystem();
        const entity1 = createMockEntity(true, [ComponentA]);
        const entities = [entity1];

        const result = system.getEntitiesWithAnyComponent(entities, []);

        expect(result).toEqual([]);
      });
    });
  });

  describe('Lifecycle Methods', () => {
    describe('onAddedToScene', () => {
      it('should log when added to scene', () => {
        const system = new BaseSystem();
        const scene = createMockScene('GameScene');

        system.onAddedToScene(scene);

        expect(Logger.debug).toHaveBeenCalledWith(
          '[BaseSystem] System BaseSystem added to scene: GameScene'
        );
      });

      it('should work with derived classes', () => {
        const testSystem = new TestSystem();
        const scene = createMockScene('MenuScene');

        testSystem.onAddedToScene(scene);

        expect(Logger.debug).toHaveBeenCalledWith(
          '[BaseSystem] System TestSystem added to scene: MenuScene'
        );
      });
    });

    describe('onRemovedFromScene', () => {
      it('should log when removed from scene', () => {
        const system = new BaseSystem();
        const scene = createMockScene('GameScene');

        system.onRemovedFromScene(scene);

        expect(Logger.debug).toHaveBeenCalledWith(
          '[BaseSystem] System BaseSystem removed from scene: GameScene'
        );
      });

      it('should work with derived classes', () => {
        const testSystem = new TestSystem();
        const scene = createMockScene('MenuScene');

        testSystem.onRemovedFromScene(scene);

        expect(Logger.debug).toHaveBeenCalledWith(
          '[BaseSystem] System TestSystem removed from scene: MenuScene'
        );
      });
    });
  });

  describe('State Management', () => {
    describe('setActive', () => {
      it('should activate inactive scopeName and log change', () => {
        const system = new BaseSystem();
        system.active = false;

        system.setActive(true);

        expect(system.active).toBe(true);
        expect(Logger.debug).toHaveBeenCalledWith(
          '[BaseSystem] System BaseSystem enabled'
        );
      });

      it('should deactivate active scopeName and log change', () => {
        const system = new BaseSystem();
        system.active = true;

        system.setActive(false);

        expect(system.active).toBe(false);
        expect(Logger.debug).toHaveBeenCalledWith(
          '[BaseSystem] System BaseSystem disabled'
        );
      });

      it('should not log when state does not change', () => {
        const system = new BaseSystem();
        system.active = true;
        vi.clearAllMocks(); // Clear construction logs

        system.setActive(true);

        expect(system.active).toBe(true);
        expect(Logger.debug).not.toHaveBeenCalled();
      });
    });

    describe('setPriority', () => {
      it('should set priority and log change', () => {
        const system = new BaseSystem();

        system.setPriority(10);

        expect(system.priority).toBe(10);
        expect(Logger.debug).toHaveBeenCalledWith(
          '[BaseSystem] System BaseSystem priority set to 10'
        );
      });

      it('should handle negative priorities', () => {
        const system = new BaseSystem();

        system.setPriority(-5);

        expect(system.priority).toBe(-5);
        expect(Logger.debug).toHaveBeenCalledWith(
          '[BaseSystem] System BaseSystem priority set to -5'
        );
      });

      it('should handle zero priority', () => {
        const system = new BaseSystem();

        system.setPriority(0);

        expect(system.priority).toBe(0);
        expect(Logger.debug).toHaveBeenCalledWith(
          '[BaseSystem] System BaseSystem priority set to 0'
        );
      });
    });
  });

  describe('Performance Monitoring', () => {
    describe('getPerformanceStats', () => {
      it('should return complete performance statistics', () => {
        const system = new BaseSystem();
        system.updateCount = 100;
        system.totalUpdateTime = 500.5;
        system.averageUpdateTime = 5.005;
        system.active = false;
        system.priority = 3;

        const stats = system.getPerformanceStats();

        expect(stats).toEqual({
          name: 'BaseSystem',
          updateCount: 100,
          totalUpdateTime: 500.5,
          averageUpdateTime: 5.005,
          active: false,
          priority: 3,
        });
      });

      it('should return initial stats for new scopeName', () => {
        const system = new BaseSystem();

        const stats = system.getPerformanceStats();

        expect(stats).toEqual({
          name: 'BaseSystem',
          updateCount: 0,
          totalUpdateTime: 0,
          averageUpdateTime: 0,
          active: true,
          priority: 0,
        });
      });
    });

    describe('resetPerformanceStats', () => {
      it('should reset all performance counters', () => {
        const system = new BaseSystem();
        system.updateCount = 100;
        system.totalUpdateTime = 500.5;
        system.averageUpdateTime = 5.005;

        system.resetPerformanceStats();

        expect(system.updateCount).toBe(0);
        expect(system.totalUpdateTime).toBe(0);
        expect(system.averageUpdateTime).toBe(0);
        expect(Logger.debug).toHaveBeenCalledWith(
          '[BaseSystem] Performance stats reset for scopeName: BaseSystem'
        );
      });
    });
  });

  describe('Serialization', () => {
    describe('serialize', () => {
      it('should serialize scopeName state', () => {
        const system = new BaseSystem();
        system.active = false;
        system.priority = 5;

        const data = system.serialize();

        expect(data).toEqual({
          name: 'BaseSystem',
          systemId: system.systemId,
          active: false,
          priority: 5,
        });
      });

      it('should serialize derived class correctly', () => {
        const testSystem = new TestSystem();
        testSystem.active = false;
        testSystem.priority = 3;

        const data = testSystem.serialize();

        expect(data).toEqual({
          name: 'TestSystem',
          systemId: testSystem.systemId,
          active: false,
          priority: 3,
        });
      });
    });

    describe('deserialize', () => {
      it('should deserialize scopeName state', () => {
        const system = new BaseSystem();
        const data = {
          systemId: 'custom_id_123',
          active: false,
          priority: 7,
        };

        system.deserialize(data);

        expect(system.systemId).toBe('custom_id_123');
        expect(system.active).toBe(false);
        expect(system.priority).toBe(7);
        expect(Logger.debug).toHaveBeenCalledWith(
          '[BaseSystem] System deserialized: BaseSystem',
          data
        );
      });

      it('should handle partial data', () => {
        const system = new BaseSystem();
        const originalId = system.systemId;
        const data = { active: false };

        system.deserialize(data);

        expect(system.systemId).toBe(originalId); // Should keep original
        expect(system.active).toBe(false);
        expect(system.priority).toBe(0); // Default value
      });

      it('should handle empty data', () => {
        const system = new BaseSystem();
        const originalId = system.systemId;

        system.deserialize({});

        expect(system.systemId).toBe(originalId);
        expect(system.active).toBe(true); // Default value
        expect(system.priority).toBe(0); // Default value
      });

      it('should handle undefined and null values', () => {
        const system = new BaseSystem();
        const data = {
          systemId: null,
          active: undefined,
          priority: null,
        };

        system.deserialize(data);

        expect(system.active).toBe(true); // Default when undefined
        expect(system.priority).toBe(0); // Default when null/falsy
      });
    });
  });

  describe('Cleanup and Destruction', () => {
    describe('destroy', () => {
      it('should deactivate scopeName and log destruction', () => {
        const system = new BaseSystem();
        system.active = true;

        system.destroy();

        expect(system.active).toBe(false);
        expect(Logger.debug).toHaveBeenCalledWith(
          `[BaseSystem] System destroyed: BaseSystem (${system.systemId})`
        );
      });

      it('should work correctly with derived classes', () => {
        const testSystem = new TestSystem();
        testSystem.active = true;

        testSystem.destroy();

        expect(testSystem.active).toBe(false);
        expect(Logger.debug).toHaveBeenCalledWith(
          expect.stringContaining('System destroyed: TestSystem')
        );
      });
    });
  });

  describe('Inheritance Support', () => {
    it('should support method overriding in subclasses', () => {
      class CustomSystem extends BaseSystem {
        constructor() {
          super();
          this.initCalled = false;
          this.destroyCalled = false;
        }

        init(config) {
          super.init(config);
          this.initCalled = true;
        }

        update(entities, delta) {
          // Custom implementation
          this.lastEntities = entities;
          this.lastDelta = delta;
        }

        destroy() {
          super.destroy();
          this.destroyCalled = true;
        }
      }

      const customSystem = new CustomSystem();
      
      customSystem.init({ priority: 5 });
      expect(customSystem.initCalled).toBe(true);
      expect(customSystem.priority).toBe(5);

      customSystem.update(['entity1'], 16.67);
      expect(customSystem.lastEntities).toEqual(['entity1']);
      expect(customSystem.lastDelta).toBe(16.67);

      customSystem.destroy();
      expect(customSystem.destroyCalled).toBe(true);
      expect(customSystem.active).toBe(false);
    });

    it('should maintain separate state for different instances', () => {
      const system1 = new TestSystem();
      const system2 = new TestSystem();

      system1.setActive(false);
      system1.setPriority(5);

      system2.setActive(true);
      system2.setPriority(10);

      expect(system1.active).toBe(false);
      expect(system1.priority).toBe(5);
      expect(system2.active).toBe(true);
      expect(system2.priority).toBe(10);
    });

    it('should support polymorphic behavior', () => {
      const systems = [
        new TestSystem(),
        new TestSystem(),
      ];

      systems.forEach((system, index) => {
        system.setPriority(index);
        expect(system.priority).toBe(index);
        expect(system instanceof BaseSystem).toBe(true);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle very large performance times', () => {
      const testSystem = new TestSystem();
      mockPerformanceNow.mockReturnValueOnce(1000.0).mockReturnValueOnce(2000.0);

      testSystem.process([], 16.67);

      expect(testSystem.totalUpdateTime).toBe(1000.0);
      expect(testSystem.averageUpdateTime).toBe(1000.0);
      expect(Logger.warn).toHaveBeenCalledWith(
        '[BaseSystem] Slow scopeName update: TestSystem took 1000.00ms'
      );
    });

    it('should handle negative performance times gracefully', () => {
      const testSystem = new TestSystem();
      mockPerformanceNow.mockReturnValueOnce(2000.0).mockReturnValueOnce(1000.0);

      testSystem.process([], 16.67);

      expect(testSystem.totalUpdateTime).toBe(-1000.0);
      expect(testSystem.averageUpdateTime).toBe(-1000.0);
    });

    it('should handle entities without hasComponent method', () => {
      const system = new BaseSystem();
      const badEntity = { active: true }; // Missing hasComponent method

      expect(() => {
        system.getEntitiesWithComponents([badEntity], [ComponentA]);
      }).toThrow();
    });

    it('should handle very large entity arrays efficiently', () => {
      const system = new BaseSystem();
      const entities = Array.from({ length: 10000 }, (_, i) => 
        createMockEntity(true, i % 2 === 0 ? [ComponentA] : [ComponentB])
      );

      const startTime = performance.now();
      const result = system.getEntitiesWithComponents(entities, [ComponentA]);
      const endTime = performance.now();

      expect(result.length).toBe(5000);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });

    it('should handle undefined/null entities gracefully', () => {
      const system = new BaseSystem();
      const entities = [
        createMockEntity(true, [ComponentA]),
        null,
        undefined,
        createMockEntity(true, [ComponentA]),
      ];

      expect(() => {
        system.getEntitiesWithComponents(entities, [ComponentA]);
      }).toThrow(); // Should throw on null/undefined entities
    });

    it('should maintain performance tracking consistency after errors', () => {
      const testSystem = new TestSystem(true); // Will throw
      mockPerformanceNow.mockReturnValueOnce(1000.0).mockReturnValueOnce(1010.0);

      testSystem.process([], 16.67);

      expect(testSystem.updateCount).toBe(0);
      expect(testSystem.totalUpdateTime).toBe(10.0);
      
      // Now process successfully
      testSystem.shouldThrowInUpdate = false;
      mockPerformanceNow.mockReturnValueOnce(2000.0).mockReturnValueOnce(2005.0);
      
      testSystem.process([], 16.67);

      expect(testSystem.updateCount).toBe(1);
      expect(testSystem.totalUpdateTime).toBe(15.0);
      expect(testSystem.averageUpdateTime).toBe(15.0);
    });
  });

  describe('Performance Thresholds', () => {
    it('should warn at exactly 16.67ms threshold', () => {
      const testSystem = new TestSystem();
      mockPerformanceNow.mockReturnValueOnce(1000.0).mockReturnValueOnce(1016.67);

      testSystem.process([], 16.67);

      expect(Logger.warn).not.toHaveBeenCalled(); // Should not warn at exactly threshold
    });

    it('should warn just above 16.67ms threshold', () => {
      const testSystem = new TestSystem();
      mockPerformanceNow.mockReturnValueOnce(1000.0).mockReturnValueOnce(1016.68);

      testSystem.process([], 16.67);

      expect(Logger.warn).toHaveBeenCalledWith(
        '[BaseSystem] Slow scopeName update: TestSystem took 16.68ms'
      );
    });
  });
});