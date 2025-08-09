import { describe, it, expect, beforeEach, vi } from 'vitest';
import BaseComponent from '../../src/components/BaseComponent.js';

// Mock Logger to avoid Environment dependencies
vi.mock('../../src/utils/Logger.js', () => {
  const scopeCache = new Map();
  const mockLogger = {
    scope: vi.fn((scopeName) => {
      if (!scopeCache.has(scopeName)) {
        scopeCache.set(scopeName, {
          debug: vi.fn(),
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
          time: vi.fn(),
          timeEnd: vi.fn(),
          group: vi.fn(),
          groupEnd: vi.fn(),
          table: vi.fn(),
        });
      }
      return scopeCache.get(scopeName);
    }),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    time: vi.fn(),
    timeEnd: vi.fn(),
    group: vi.fn(),
    groupEnd: vi.fn(),
    table: vi.fn(),
  };
  return { default: mockLogger };
});

import Logger from '../../src/utils/Logger.js';

describe('BaseComponent', () => {
  let component;

  beforeEach(() => {
    // Clear all mock calls before each test
    vi.clearAllMocks();
    component = new BaseComponent();
  });

  describe('constructor', () => {
    it('should create component with default properties', () => {
      expect(component.entity).toBe(null);
      expect(component.active).toBe(true);
      expect(component.componentId).toBeDefined();
      expect(typeof component.componentId).toBe('string');
    });

    it('should generate unique component ID', () => {
      const component1 = new BaseComponent();
      const component2 = new BaseComponent();
      
      expect(component1.componentId).not.toBe(component2.componentId);
      expect(component1.componentId).toMatch(/^comp_\d+_[a-z0-9]{9}$/);
      expect(component2.componentId).toMatch(/^comp_\d+_[a-z0-9]{9}$/);
    });

    it('should log component creation', () => {
      expect(Logger.scope('BaseComponent').debug).toHaveBeenCalledWith(
        `[BaseComponent] Component created: BaseComponent (${component.componentId})`
      );
    });
  });

  describe('generateId static method', () => {
    it('should generate unique IDs each time', () => {
      const id1 = BaseComponent.generateId();
      const id2 = BaseComponent.generateId();
      const id3 = BaseComponent.generateId();

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('should generate IDs with correct format', () => {
      const id = BaseComponent.generateId();
      expect(id).toMatch(/^comp_\d+_[a-z0-9]{9}$/);
    });

    it('should generate IDs with timestamp component', () => {
      const beforeTime = Date.now();
      const id = BaseComponent.generateId();
      const afterTime = Date.now();

      const timestampPart = parseInt(id.split('_')[1]);
      expect(timestampPart).toBeGreaterThanOrEqual(beforeTime);
      expect(timestampPart).toBeLessThanOrEqual(afterTime);
    });

    it('should generate multiple unique IDs in rapid succession', () => {
      const ids = new Set();
      const count = 100;

      for (let i = 0; i < count; i++) {
        ids.add(BaseComponent.generateId());
      }

      expect(ids.size).toBe(count);
    });
  });

  describe('init method', () => {
    it('should accept initialization data and log', () => {
      const initData = { test: 'value', number: 42 };
      
      component.init(initData);
      
      expect(Logger.scope('BaseComponent').debug).toHaveBeenCalledWith(
        `[BaseComponent] Component initialized: BaseComponent`,
        initData
      );
    });

    it('should handle empty initialization data', () => {
      component.init();
      
      expect(Logger.scope('BaseComponent').debug).toHaveBeenCalledWith(
        `[BaseComponent] Component initialized: BaseComponent`,
        {}
      );
    });

    it('should handle null/undefined initialization data', () => {
      // Clear previous mock calls from constructor
      vi.clearAllMocks();
      
      component.init(null);
      
      expect(Logger.scope('BaseComponent').debug).toHaveBeenCalledWith(
        `[BaseComponent] Component initialized: BaseComponent`,
        null
      );

      // When undefined is passed, the default parameter makes it {}
      component.init(undefined);
      
      expect(Logger.scope('BaseComponent').debug).toHaveBeenCalledWith(
        `[BaseComponent] Component initialized: BaseComponent`,
        {}
      );
    });

    it('should handle complex initialization data', () => {
      const complexData = {
        nested: { object: { value: 'test' } },
        array: [1, 2, 3],
        boolean: true,
        null: null,
        undefined: undefined,
      };
      
      component.init(complexData);
      
      expect(Logger.scope('BaseComponent').debug).toHaveBeenCalledWith(
        `[BaseComponent] Component initialized: BaseComponent`,
        complexData
      );
    });
  });

  describe('validate method', () => {
    it('should return true by default', () => {
      expect(component.validate()).toBe(true);
    });

    it('should be overridable in subclasses', () => {
      class TestComponent extends BaseComponent {
        validate() {
          return false;
        }
      }

      const testComponent = new TestComponent();
      expect(testComponent.validate()).toBe(false);
    });
  });

  describe('serialize method', () => {
    it('should serialize basic component data', () => {
      const serialized = component.serialize();
      
      expect(serialized).toEqual({
        type: 'BaseComponent',
        componentId: component.componentId,
        active: true,
      });
    });

    it('should serialize with inactive state', () => {
      component.active = false;
      const serialized = component.serialize();
      
      expect(serialized).toEqual({
        type: 'BaseComponent',
        componentId: component.componentId,
        active: false,
      });
    });

    it('should be overridable in subclasses', () => {
      class TestComponent extends BaseComponent {
        constructor() {
          super();
          this.customProperty = 'test value';
        }

        serialize() {
          return {
            ...super.serialize(),
            customProperty: this.customProperty,
          };
        }
      }

      const testComponent = new TestComponent();
      const serialized = testComponent.serialize();
      
      expect(serialized).toEqual({
        type: 'TestComponent',
        componentId: testComponent.componentId,
        active: true,
        customProperty: 'test value',
      });
    });

    it('should handle subclass with different constructor name', () => {
      class CustomNamedComponent extends BaseComponent {}
      const customComponent = new CustomNamedComponent();
      const serialized = customComponent.serialize();
      
      expect(serialized.type).toBe('CustomNamedComponent');
    });
  });

  describe('deserialize method', () => {
    it('should deserialize basic component data', () => {
      const testId = 'comp_123456789_abcdefghi';
      const data = {
        componentId: testId,
        active: false,
      };

      component.deserialize(data);

      expect(component.componentId).toBe(testId);
      expect(component.active).toBe(false);
      expect(Logger.scope('BaseComponent').debug).toHaveBeenCalledWith(
        `[BaseComponent] Component deserialized: BaseComponent`,
        data
      );
    });

    it('should handle partial deserialization data', () => {
      const originalId = component.componentId;
      const data = { active: false };

      component.deserialize(data);

      expect(component.componentId).toBe(originalId); // Should keep original ID
      expect(component.active).toBe(false);
    });

    it('should handle missing componentId', () => {
      const originalId = component.componentId;
      const data = { active: false };

      component.deserialize(data);

      expect(component.componentId).toBe(originalId);
    });

    it('should handle missing active property', () => {
      const testId = 'comp_987654321_zyxwvutsr';
      const data = { componentId: testId };

      component.deserialize(data);

      expect(component.componentId).toBe(testId);
      expect(component.active).toBe(true); // Should default to true
    });

    it('should handle empty data object', () => {
      const originalId = component.componentId;
      const originalActive = component.active;

      component.deserialize({});

      expect(component.componentId).toBe(originalId);
      expect(component.active).toBe(originalActive);
    });

    it('should handle null/undefined data', () => {
      const originalId = component.componentId;

      // The actual implementation will throw for null data since it tries to access data.componentId
      expect(() => component.deserialize(null)).toThrow();
      
      // Undefined should also throw because it tries to access properties
      expect(() => component.deserialize(undefined)).toThrow();

      // The component ID should remain unchanged after failed attempts
      expect(component.componentId).toBe(originalId);
    });

    it('should handle explicit false active value', () => {
      const data = { active: false };
      component.deserialize(data);
      expect(component.active).toBe(false);
    });

    it('should handle explicit true active value', () => {
      component.active = false; // Set to false first
      const data = { active: true };
      component.deserialize(data);
      expect(component.active).toBe(true);
    });

    it('should be overridable in subclasses', () => {
      class TestComponent extends BaseComponent {
        constructor() {
          super();
          this.customProperty = 'default';
        }

        deserialize(data) {
          super.deserialize(data);
          if (data.customProperty !== undefined) {
            this.customProperty = data.customProperty;
          }
        }
      }

      const testComponent = new TestComponent();
      const data = {
        componentId: 'comp_111111111_testtest1',
        active: false,
        customProperty: 'deserialized value',
      };

      testComponent.deserialize(data);

      expect(testComponent.componentId).toBe('comp_111111111_testtest1');
      expect(testComponent.active).toBe(false);
      expect(testComponent.customProperty).toBe('deserialized value');
    });
  });

  describe('destroy method', () => {
    it('should clean up component resources', () => {
      const mockEntity = { id: 'test-entity' };
      component.entity = mockEntity;
      component.active = true;

      component.destroy();

      expect(component.entity).toBe(null);
      expect(component.active).toBe(false);
      expect(Logger.scope('BaseComponent').debug).toHaveBeenCalledWith(
        `[BaseComponent] Component destroyed: BaseComponent (${component.componentId})`
      );
    });

    it('should handle destroy when entity is already null', () => {
      component.entity = null;
      component.active = true;

      expect(() => component.destroy()).not.toThrow();
      
      expect(component.entity).toBe(null);
      expect(component.active).toBe(false);
    });

    it('should be overridable in subclasses', () => {
      let customCleanupCalled = false;

      class TestComponent extends BaseComponent {
        constructor() {
          super();
          this.resources = ['resource1', 'resource2'];
        }

        destroy() {
          this.resources = [];
          customCleanupCalled = true;
          super.destroy();
        }
      }

      const testComponent = new TestComponent();
      testComponent.destroy();

      expect(customCleanupCalled).toBe(true);
      expect(testComponent.resources).toEqual([]);
      expect(testComponent.entity).toBe(null);
      expect(testComponent.active).toBe(false);
    });
  });

  describe('entity reference', () => {
    it('should allow setting entity reference', () => {
      const mockEntity = { id: 'test-entity', type: 'player' };
      component.entity = mockEntity;
      
      expect(component.entity).toBe(mockEntity);
    });

    it('should allow clearing entity reference', () => {
      const mockEntity = { id: 'test-entity' };
      component.entity = mockEntity;
      component.entity = null;
      
      expect(component.entity).toBe(null);
    });

    it('should handle different entity types', () => {
      const entities = [
        { id: 'player', type: 'player' },
        { id: 'enemy', type: 'enemy' },
        { id: 'projectile', type: 'projectile' },
        null,
        undefined,
      ];

      entities.forEach(entity => {
        component.entity = entity;
        expect(component.entity).toBe(entity);
      });
    });
  });

  describe('active state', () => {
    it('should start active by default', () => {
      expect(component.active).toBe(true);
    });

    it('should allow toggling active state', () => {
      component.active = false;
      expect(component.active).toBe(false);

      component.active = true;
      expect(component.active).toBe(true);
    });

    it('should handle truthy/falsy values', () => {
      const truthyValues = [true, 1, 'true', {}, []];
      const falsyValues = [false, 0, '', null, undefined];

      truthyValues.forEach(value => {
        component.active = value;
        expect(component.active).toBeTruthy();
      });

      falsyValues.forEach(value => {
        component.active = value;
        expect(component.active).toBeFalsy();
      });
    });
  });

  describe('inheritance support', () => {
    it('should support extending BaseComponent', () => {
      class TestComponent extends BaseComponent {
        constructor(customValue = 'default') {
          super();
          this.customValue = customValue;
        }

        init(data = {}) {
          super.init(data);
          if (data.customValue !== undefined) {
            this.customValue = data.customValue;
          }
        }
      }

      const testComponent = new TestComponent('initial');
      expect(testComponent).toBeInstanceOf(BaseComponent);
      expect(testComponent).toBeInstanceOf(TestComponent);
      expect(testComponent.customValue).toBe('initial');
      expect(testComponent.componentId).toBeDefined();
      expect(testComponent.active).toBe(true);
    });

    it('should preserve subclass constructor names in serialization', () => {
      class HealthComponent extends BaseComponent {}
      class WeaponComponent extends BaseComponent {}

      const health = new HealthComponent();
      const weapon = new WeaponComponent();

      expect(health.serialize().type).toBe('HealthComponent');
      expect(weapon.serialize().type).toBe('WeaponComponent');
    });

    it('should allow method overriding', () => {
      class ValidatingComponent extends BaseComponent {
        constructor(value) {
          super();
          this.value = value;
        }

        validate() {
          return this.value != null && this.value !== '';
        }

        serialize() {
          return {
            ...super.serialize(),
            value: this.value,
          };
        }

        deserialize(data) {
          super.deserialize(data);
          if (data.value !== undefined) {
            this.value = data.value;
          }
        }
      }

      const validComponent = new ValidatingComponent('test');
      const invalidComponent = new ValidatingComponent(null);

      expect(validComponent.validate()).toBe(true);
      expect(invalidComponent.validate()).toBe(false);

      const serialized = validComponent.serialize();
      expect(serialized.value).toBe('test');
      expect(serialized.type).toBe('ValidatingComponent');
    });

    it('should support multiple inheritance levels', () => {
      class MiddleComponent extends BaseComponent {
        constructor() {
          super();
          this.middleProperty = 'middle';
        }
      }

      class LeafComponent extends MiddleComponent {
        constructor() {
          super();
          this.leafProperty = 'leaf';
        }
      }

      const leaf = new LeafComponent();
      expect(leaf).toBeInstanceOf(BaseComponent);
      expect(leaf).toBeInstanceOf(MiddleComponent);
      expect(leaf).toBeInstanceOf(LeafComponent);
      expect(leaf.middleProperty).toBe('middle');
      expect(leaf.leafProperty).toBe('leaf');
      expect(leaf.componentId).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle rapid creation and destruction', () => {
      const components = [];
      
      // Create many components rapidly
      for (let i = 0; i < 100; i++) {
        components.push(new BaseComponent());
      }

      // All should have unique IDs
      const ids = components.map(c => c.componentId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(100);

      // Destroy all
      components.forEach(c => c.destroy());
      components.forEach(c => {
        expect(c.entity).toBe(null);
        expect(c.active).toBe(false);
      });
    });

    it('should validate deserialization input types strictly', () => {
      // Valid objects: either omit fields or provide correct types
      const validObjects = [
        {},
        { componentId: 'id-123' },
        { active: true },
        { componentId: 'id-123', active: false },
      ];

      validObjects.forEach(data => {
        const testComponent = new BaseComponent();
        expect(() => testComponent.deserialize(data)).not.toThrow();
      });

      // Invalid data types should throw
      const invalidData = [
        null,
        undefined,
        'not-an-object',
        42,
        true,
        { componentId: 123 },
        { active: 'not-boolean' },
        { componentId: '', active: [] },
      ];

      invalidData.forEach(data => {
        const testComponent = new BaseComponent();
        expect(() => testComponent.deserialize(data)).toThrow();
      });
    });

    it('should maintain object integrity after multiple operations', () => {
      const originalId = component.componentId;
      const entity = { id: 'test' };

      // Multiple state changes
      component.entity = entity;
      component.active = false;

      const serialized = component.serialize();
      expect(serialized.componentId).toBe(originalId);
      expect(serialized.active).toBe(false);

      // Deserialize different data
      component.deserialize({
        componentId: 'new-id',
        active: true,
      });

      expect(component.componentId).toBe('new-id');
      expect(component.active).toBe(true);
      expect(component.entity).toBe(entity); // Should remain unchanged

      // Validate still works
      expect(component.validate()).toBe(true);

      // Destroy cleans up
      component.destroy();
      expect(component.entity).toBe(null);
      expect(component.active).toBe(false);
    });

    it('should handle concurrent access patterns', () => {
      const components = [];
      
      // Create components with different states
      for (let i = 0; i < 10; i++) {
        const comp = new BaseComponent();
        comp.active = i % 2 === 0;
        comp.entity = { id: `entity-${i}` };
        components.push(comp);
      }

      // Serialize all
      const serializedData = components.map(c => c.serialize());
      
      // Verify serialization
      serializedData.forEach((data, index) => {
        expect(data.active).toBe(index % 2 === 0);
        expect(data.type).toBe('BaseComponent');
      });

      // Cross-deserialize (each component gets different data)
      components.forEach((comp, index) => {
        const dataIndex = (index + 1) % serializedData.length;
        comp.deserialize(serializedData[dataIndex]);
      });

      // Verify cross-deserialization worked
      components.forEach((comp, index) => {
        const expectedDataIndex = (index + 1) % serializedData.length;
        expect(comp.active).toBe(expectedDataIndex % 2 === 0);
      });
    });
  });

  describe('logging integration', () => {
    it('should log creation with correct parameters', () => {
      const newComponent = new BaseComponent();
      
      expect(Logger.scope('BaseComponent').debug).toHaveBeenCalledWith(
        `[BaseComponent] Component created: BaseComponent (${newComponent.componentId})`
      );
    });

    it('should log initialization with data', () => {
      const initData = { test: 'data' };
      component.init(initData);
      
      expect(Logger.scope('BaseComponent').debug).toHaveBeenCalledWith(
        `[BaseComponent] Component initialized: BaseComponent`,
        initData
      );
    });

    it('should log deserialization with data', () => {
      const deserializeData = { componentId: 'test-id', active: false };
      component.deserialize(deserializeData);
      
      expect(Logger.scope('BaseComponent').debug).toHaveBeenCalledWith(
        `[BaseComponent] Component deserialized: BaseComponent`,
        deserializeData
      );
    });

    it('should log destruction with component ID', () => {
      const componentId = component.componentId;
      component.destroy();
      
      expect(Logger.scope('BaseComponent').debug).toHaveBeenCalledWith(
        `[BaseComponent] Component destroyed: BaseComponent (${componentId})`
      );
    });

    it('should handle logging in subclasses correctly', () => {
      class CustomComponent extends BaseComponent {}
      
      const customComponent = new CustomComponent();
      customComponent.init({ custom: 'data' });
      customComponent.deserialize({ active: false });
      customComponent.destroy();

      // Check that logs use the correct class name
      expect(Logger.scope('BaseComponent').debug).toHaveBeenCalledWith(
        `[BaseComponent] Component created: CustomComponent (${customComponent.componentId})`
      );
      expect(Logger.scope('BaseComponent').debug).toHaveBeenCalledWith(
        `[BaseComponent] Component initialized: CustomComponent`,
        { custom: 'data' }
      );
      expect(Logger.scope('BaseComponent').debug).toHaveBeenCalledWith(
        `[BaseComponent] Component deserialized: CustomComponent`,
        { active: false }
      );
      expect(Logger.scope('BaseComponent').debug).toHaveBeenCalledWith(
        `[BaseComponent] Component destroyed: CustomComponent (${customComponent.componentId})`
      );
    });
  });
});
