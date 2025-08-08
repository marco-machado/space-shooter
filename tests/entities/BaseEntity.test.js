import { describe, it, expect, beforeEach, vi } from 'vitest';
import BaseEntity from '../../src/entities/BaseEntity.js';
import Logger from '../../src/utils/Logger.js';

// Mock Logger completely to avoid Environment dependencies
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

describe('BaseEntity', () => {
  let mockScene;
  let mockGameObject;
  let mockPhysicsBody;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock physics body
    mockPhysicsBody = {
      setImmovable: vi.fn(),
      moves: true,
      setSize: vi.fn(),
      setOffset: vi.fn(),
    };

    // Mock GameObject with all required properties and methods
    mockGameObject = {
      x: 100,
      y: 200,
      width: 64,
      height: 64,
      active: true,
      visible: true,
      body: mockPhysicsBody,
      scene: null, // Will be set later
      destroy: vi.fn(),
      setPosition: vi.fn(),
      setSize: vi.fn(),
      setDepth: vi.fn(),
      setScale: vi.fn(),
      setRotation: vi.fn(),
      setAlpha: vi.fn(),
      setTint: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn(),
      emit: vi.fn(),
      removeAllListeners: vi.fn(),
    };

    // Mock Scene with all add methods
    mockScene = {
      entities: [],
      physics: {
        world: {},
        add: {
          existing: vi.fn(),
        },
      },
      sys: {
        isDestroyed: false,
      },
      add: {
        rectangle: vi.fn(() => ({ ...mockGameObject })),
        sprite: vi.fn(() => ({ ...mockGameObject })),
        image: vi.fn(() => ({ ...mockGameObject })),
        circle: vi.fn(() => ({ ...mockGameObject })),
        polygon: vi.fn(() => ({ ...mockGameObject })),
        text: vi.fn(() => ({ ...mockGameObject })),
        existing: vi.fn(),
      },
    };

    // Set scene reference in mockGameObject
    mockGameObject.scene = mockScene;
  });

  describe('Constructor Tests', () => {
    describe('Legacy Constructor (Numeric Parameters)', () => {
      it('should create entity with legacy numeric parameters', () => {
        const entity = new BaseEntity(mockScene, 50, 75, 32, 48, 0xff0000, 'testEntity');

        expect(entity.scene).toBe(mockScene);
        expect(entity.name).toBe('testEntity');
        expect(entity.config.type).toBe('rectangle');
        expect(entity.config.x).toBe(50);
        expect(entity.config.y).toBe(75);
        expect(entity.config.width).toBe(32);
        expect(entity.config.height).toBe(48);
        expect(entity.config.color).toBe(0xff0000);
        expect(entity.components).toBeInstanceOf(Map);
        expect(entity.entityId).toContain('entity_');
        expect(mockScene.entities).toContain(entity);
      });

      it('should use default name when not provided in legacy constructor', () => {
        const entity = new BaseEntity(mockScene, 0, 0, 32, 32, 0xffffff);

        expect(entity.name).toBe('noname');
      });

      it('should call rectangle creation method with legacy parameters', () => {
        new BaseEntity(mockScene, 10, 20, 40, 60, 0x00ff00);

        expect(mockScene.add.rectangle).toHaveBeenCalledWith(10, 20, 40, 60, 0x00ff00);
      });
    });

    describe('Config Constructor (Object Parameters)', () => {
      it('should create entity with configuration object', () => {
        const config = {
          type: 'sprite',
          x: 100,
          y: 150,
          texture: 'player',
          frame: 0,
          name: 'playerEntity',
        };

        const entity = new BaseEntity(mockScene, config);

        expect(entity.scene).toBe(mockScene);
        expect(entity.name).toBe('playerEntity');
        expect(entity.config.type).toBe('sprite');
        expect(entity.config.x).toBe(100);
        expect(entity.config.y).toBe(150);
        expect(entity.config.texture).toBe('player');
        expect(entity.config.frame).toBe(0);
      });

      it('should use default values when config is empty', () => {
        const entity = new BaseEntity(mockScene, {});

        expect(entity.name).toBe('noname');
        expect(entity.config.type).toBe('rectangle');
        expect(entity.config.x).toBe(0);
        expect(entity.config.y).toBe(0);
      });

      it('should use default values when config is null/undefined', () => {
        const entity1 = new BaseEntity(mockScene, null);
        const entity2 = new BaseEntity(mockScene, undefined);

        expect(entity1.config.type).toBe('rectangle');
        expect(entity2.config.type).toBe('rectangle');
      });

      it('should merge config with defaults correctly', () => {
        const config = {
          type: 'circle',
          x: 50,
          customProperty: 'test',
        };

        const entity = new BaseEntity(mockScene, config);

        expect(entity.config.type).toBe('circle');
        expect(entity.config.x).toBe(50);
        expect(entity.config.y).toBe(0); // Default
        expect(entity.config.customProperty).toBe('test');
      });
    });

    describe('GameObject Creation', () => {
      it('should generate unique entity IDs', () => {
        const entity1 = new BaseEntity(mockScene, { type: 'rectangle' });
        const entity2 = new BaseEntity(mockScene, { type: 'rectangle' });

        expect(entity1.entityId).not.toBe(entity2.entityId);
        expect(entity1.entityId).toContain('entity_');
        expect(entity2.entityId).toContain('entity_');
      });

      it('should register entity with scene', () => {
        const entity = new BaseEntity(mockScene, { type: 'rectangle' });

        expect(mockScene.entities).toContain(entity);
        expect(mockScene.entities.length).toBe(1);
      });

      it('should initialize scene.entities array if not exists', () => {
        const sceneWithoutEntities = { ...mockScene };
        delete sceneWithoutEntities.entities;

        const entity = new BaseEntity(sceneWithoutEntities, { type: 'rectangle' });

        expect(sceneWithoutEntities.entities).toBeDefined();
        expect(sceneWithoutEntities.entities).toContain(entity);
      });
    });
  });

  describe('GameObject Factory Tests', () => {
    describe('Rectangle GameObject', () => {
      it('should create rectangle with correct parameters', () => {
        new BaseEntity(mockScene, { type: 'rectangle', x: 10, y: 20, width: 30, height: 40, color: 0xff0000 });

        expect(mockScene.add.rectangle).toHaveBeenCalledWith(10, 20, 30, 40, 0xff0000);
      });

      it('should use default values for missing rectangle parameters', () => {
        new BaseEntity(mockScene, { type: 'rectangle', x: 10, y: 20 });

        expect(mockScene.add.rectangle).toHaveBeenCalledWith(10, 20, 32, 32, 0xffffff);
      });
    });

    describe('Sprite GameObject', () => {
      it('should create sprite with texture and frame', () => {
        new BaseEntity(mockScene, { type: 'sprite', x: 10, y: 20, texture: 'player', frame: 1 });

        expect(mockScene.add.sprite).toHaveBeenCalledWith(10, 20, 'player', 1);
      });

      it('should fallback to rectangle when sprite texture is missing', () => {
        new BaseEntity(mockScene, { type: 'sprite', x: 10, y: 20 });

        // Should fallback to rectangle creation
        expect(mockScene.add.rectangle).toHaveBeenCalled();
        expect(Logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to create GameObject of type sprite'),
          expect.any(Error)
        );
      });

      it('should fallback to rectangle when sprite creation fails', () => {
        mockScene.add.sprite.mockImplementation(() => {
          throw new Error('Sprite creation failed');
        });

        new BaseEntity(mockScene, { type: 'sprite', texture: 'missing' });

        expect(mockScene.add.rectangle).toHaveBeenCalled();
      });
    });

    describe('Image GameObject', () => {
      it('should create image with texture', () => {
        new BaseEntity(mockScene, { type: 'image', x: 10, y: 20, texture: 'background' });

        expect(mockScene.add.image).toHaveBeenCalledWith(10, 20, 'background');
      });

      it('should fallback to rectangle when image texture is missing', () => {
        new BaseEntity(mockScene, { type: 'image', x: 10, y: 20 });

        // Should fallback to rectangle creation
        expect(mockScene.add.rectangle).toHaveBeenCalled();
        expect(Logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to create GameObject of type image'),
          expect.any(Error)
        );
      });
    });

    describe('Circle GameObject', () => {
      it('should create circle with radius and color', () => {
        new BaseEntity(mockScene, { type: 'circle', x: 10, y: 20, radius: 25, color: 0x00ff00 });

        expect(mockScene.add.circle).toHaveBeenCalledWith(10, 20, 25, 0x00ff00);
        expect(mockScene.add.existing).toHaveBeenCalled();
      });

      it('should use default values for circle parameters', () => {
        new BaseEntity(mockScene, { type: 'circle', x: 10, y: 20 });

        expect(mockScene.add.circle).toHaveBeenCalledWith(10, 20, 16, 0xffffff);
      });
    });

    describe('Polygon GameObject', () => {
      it('should create polygon with custom points', () => {
        const points = [0, -20, 15, 15, -15, 15];
        new BaseEntity(mockScene, { type: 'polygon', x: 10, y: 20, points, color: 0xff00ff });

        expect(mockScene.add.polygon).toHaveBeenCalledWith(10, 20, points, 0xff00ff);
        expect(mockScene.add.existing).toHaveBeenCalled();
      });

      it('should use default diamond points when not provided', () => {
        new BaseEntity(mockScene, { type: 'polygon', x: 10, y: 20 });

        expect(mockScene.add.polygon).toHaveBeenCalledWith(10, 20, [0, -16, 14, 14, -14, 14], 0x00ff00);
      });
    });

    describe('Text GameObject', () => {
      it('should create text with content and style', () => {
        const style = { fontSize: '20px', color: '#ff0000' };
        new BaseEntity(mockScene, { type: 'text', x: 10, y: 20, text: 'Hello', style });

        expect(mockScene.add.text).toHaveBeenCalledWith(10, 20, 'Hello', style);
      });

      it('should use default text and style when not provided', () => {
        new BaseEntity(mockScene, { type: 'text', x: 10, y: 20 });

        expect(mockScene.add.text).toHaveBeenCalledWith(10, 20, 'Entity', { fontSize: '16px', color: '#ffffff' });
      });
    });

    describe('Null GameObject', () => {
      it('should create entity without GameObject when type is null', () => {
        const entity = new BaseEntity(mockScene, { type: null });

        expect(entity.gameObject).toBeNull();
        expect(mockScene.add.rectangle).not.toHaveBeenCalled();
      });

      it('should create entity without GameObject when type is "null"', () => {
        const entity = new BaseEntity(mockScene, { type: 'null' });

        expect(entity.gameObject).toBeNull();
      });
    });

    describe('Unknown GameObject Type', () => {
      it('should fallback to rectangle for unknown type', () => {
        new BaseEntity(mockScene, { type: 'unknown-type', x: 10, y: 20 });

        expect(mockScene.add.rectangle).toHaveBeenCalledWith(10, 20, 32, 32, 0xffffff);
      });

      it('should log warning for unknown type', () => {
        new BaseEntity(mockScene, { type: 'unknown-type' });

        expect(Logger.warn).toHaveBeenCalledWith(
          expect.stringContaining('Unknown GameObject type: unknown-type'),
        );
      });
    });
  });

  describe('Property Delegation Tests', () => {
    let entity;

    beforeEach(() => {
      entity = new BaseEntity(mockScene, { type: 'rectangle', x: 100, y: 200 });
      entity.gameObject = mockGameObject;
    });

    describe('Position Properties', () => {
      it('should get x from gameObject when available', () => {
        mockGameObject.x = 150;
        expect(entity.x).toBe(150);
      });

      it('should get x from config when gameObject is null', () => {
        entity.gameObject = null;
        entity.config.x = 250;
        expect(entity.x).toBe(250);
      });

      it('should set x on both config and gameObject', () => {
        entity.x = 300;
        expect(entity.config.x).toBe(300);
        expect(mockGameObject.x).toBe(300);
      });

      it('should set x on config when gameObject is null', () => {
        entity.gameObject = null;
        entity.x = 350;
        expect(entity.config.x).toBe(350);
      });

      it('should get y from gameObject when available', () => {
        mockGameObject.y = 175;
        expect(entity.y).toBe(175);
      });

      it('should get y from config when gameObject is null', () => {
        entity.gameObject = null;
        entity.config.y = 275;
        expect(entity.y).toBe(275);
      });

      it('should set y on both config and gameObject', () => {
        entity.y = 325;
        expect(entity.config.y).toBe(325);
        expect(mockGameObject.y).toBe(325);
      });
    });

    describe('Size Properties', () => {
      it('should get width from gameObject when available', () => {
        mockGameObject.width = 80;
        expect(entity.width).toBe(80);
      });

      it('should get width from config when gameObject is null', () => {
        entity.gameObject = null;
        entity.config.width = 120;
        expect(entity.width).toBe(120);
      });

      it('should use default width when gameObject and config width are null', () => {
        entity.gameObject = null;
        entity.config.width = undefined;
        expect(entity.width).toBe(32);
      });

      it('should set width on both config and gameObject', () => {
        entity.width = 90;
        expect(entity.config.width).toBe(90);
        expect(mockGameObject.width).toBe(90);
      });

      it('should handle gameObject without width property', () => {
        const gameObjectWithoutWidth = { ...mockGameObject };
        delete gameObjectWithoutWidth.width;
        entity.gameObject = gameObjectWithoutWidth;
        entity.config.width = 45;

        expect(entity.width).toBe(45);
      });

      it('should get height from gameObject when available', () => {
        mockGameObject.height = 85;
        expect(entity.height).toBe(85);
      });

      it('should get height from config when gameObject is null', () => {
        entity.gameObject = null;
        entity.config.height = 125;
        expect(entity.height).toBe(125);
      });

      it('should use default height when gameObject and config height are null', () => {
        entity.gameObject = null;
        entity.config.height = undefined;
        expect(entity.height).toBe(32);
      });
    });

    describe('Scene Property', () => {
      it('should get scene from _scene when set', () => {
        entity._scene = mockScene;
        expect(entity.scene).toBe(mockScene);
      });

      it('should get scene from gameObject when _scene is not set', () => {
        entity._scene = null;
        expect(entity.scene).toBe(mockScene);
      });

      it('should return null when no scene available', () => {
        entity._scene = null;
        entity.gameObject = null;
        expect(entity.scene).toBeNull();
      });

      it('should set scene property', () => {
        const newScene = { entities: [] };
        entity.scene = newScene;
        expect(entity._scene).toBe(newScene);
      });
    });

    describe('State Properties', () => {
      it('should get active state from gameObject', () => {
        mockGameObject.active = false;
        expect(entity.active).toBe(false);
      });

      it('should default to true when gameObject is null', () => {
        entity.gameObject = null;
        expect(entity.active).toBe(true);
      });

      it('should set active state on gameObject', () => {
        entity.active = false;
        expect(mockGameObject.active).toBe(false);
      });

      it('should not error when setting active with null gameObject', () => {
        entity.gameObject = null;
        expect(() => {
          entity.active = false;
        }).not.toThrow();
      });

      it('should get visible state from gameObject', () => {
        mockGameObject.visible = false;
        expect(entity.visible).toBe(false);
      });

      it('should default visible to true when gameObject is null', () => {
        entity.gameObject = null;
        expect(entity.visible).toBe(true);
      });

      it('should set visible state on gameObject', () => {
        entity.visible = false;
        expect(mockGameObject.visible).toBe(false);
      });
    });

    describe('Physics Body Property', () => {
      it('should get body from gameObject', () => {
        expect(entity.body).toBe(mockPhysicsBody);
      });

      it('should return null when gameObject is null', () => {
        entity.gameObject = null;
        expect(entity.body).toBeNull();
      });

      it('should return null when gameObject has no body', () => {
        mockGameObject.body = null;
        expect(entity.body).toBeNull();
      });
    });
  });

  describe('Component Management Tests', () => {
    let entity;
    let mockComponent1;
    let mockComponent2;

    beforeEach(() => {
      entity = new BaseEntity(mockScene, { type: 'rectangle' });
      
      // Mock components
      mockComponent1 = { 
        entity: null,
        constructor: { name: 'TestComponent1' }
      };
      mockComponent2 = { 
        entity: null,
        constructor: { name: 'TestComponent2' }
      };
    });

    describe('addComponent', () => {
      it('should add component and set entity reference', () => {
        const result = entity.addComponent(mockComponent1);

        expect(entity.components.has('TestComponent1')).toBe(true);
        expect(entity.components.get('TestComponent1')).toBe(mockComponent1);
        expect(mockComponent1.entity).toBe(entity);
        expect(result).toBe(entity); // Method chaining
      });

      it('should replace existing component of same type', () => {
        entity.addComponent(mockComponent1);
        const newComponent = { 
          entity: null,
          constructor: { name: 'TestComponent1' }
        };
        
        entity.addComponent(newComponent);

        expect(entity.components.get('TestComponent1')).toBe(newComponent);
        expect(newComponent.entity).toBe(entity);
      });

      it('should add multiple different components', () => {
        entity.addComponent(mockComponent1);
        entity.addComponent(mockComponent2);

        expect(entity.components.size).toBe(2);
        expect(entity.components.has('TestComponent1')).toBe(true);
        expect(entity.components.has('TestComponent2')).toBe(true);
      });
    });

    describe('removeComponent', () => {
      beforeEach(() => {
        entity.addComponent(mockComponent1);
        entity.addComponent(mockComponent2);
      });

      it('should remove component and clear entity reference', () => {
        const result = entity.removeComponent(mockComponent1.constructor);

        expect(entity.components.has('TestComponent1')).toBe(false);
        expect(mockComponent1.entity).toBeNull();
        expect(result).toBe(entity); // Method chaining
      });

      it('should not error when removing non-existent component', () => {
        const NonExistentComponent = function NonExistent() {};

        expect(() => {
          entity.removeComponent(NonExistentComponent);
        }).not.toThrow();
      });

      it('should keep other components when removing one', () => {
        entity.removeComponent(mockComponent1.constructor);

        expect(entity.components.has('TestComponent2')).toBe(true);
        expect(entity.components.size).toBe(1);
      });
    });

    describe('getComponent', () => {
      beforeEach(() => {
        entity.addComponent(mockComponent1);
      });

      it('should return component when exists', () => {
        const result = entity.getComponent(mockComponent1.constructor);
        expect(result).toBe(mockComponent1);
      });

      it('should return null when component does not exist', () => {
        const NonExistentComponent = function NonExistent() {};
        
        const result = entity.getComponent(NonExistentComponent);
        expect(result).toBeNull();
      });
    });

    describe('hasComponent', () => {
      beforeEach(() => {
        entity.addComponent(mockComponent1);
      });

      it('should return true when component exists', () => {
        expect(entity.hasComponent(mockComponent1.constructor)).toBe(true);
      });

      it('should return false when component does not exist', () => {
        const NonExistentComponent = function NonExistent() {};
        
        expect(entity.hasComponent(NonExistentComponent)).toBe(false);
      });
    });

    describe('getAllComponents', () => {
      it('should return empty array when no components', () => {
        const result = entity.getAllComponents();
        expect(result).toEqual([]);
      });

      it('should return all components as array', () => {
        entity.addComponent(mockComponent1);
        entity.addComponent(mockComponent2);

        const result = entity.getAllComponents();
        expect(result).toHaveLength(2);
        expect(result).toContain(mockComponent1);
        expect(result).toContain(mockComponent2);
      });
    });
  });

  describe('Event System Tests', () => {
    let entity;
    let mockCallback;

    beforeEach(() => {
      entity = new BaseEntity(mockScene, { type: 'rectangle' });
      entity.gameObject = mockGameObject;
      mockCallback = vi.fn();
    });

    describe('Event Delegation to GameObject', () => {
      it('should delegate on() to gameObject when available', () => {
        const result = entity.on('test-event', mockCallback);

        expect(mockGameObject.on).toHaveBeenCalledWith('test-event', mockCallback);
        expect(result).toBe(entity); // Method chaining
      });

      it('should delegate off() to gameObject when available', () => {
        const result = entity.off('test-event', mockCallback);

        expect(mockGameObject.off).toHaveBeenCalledWith('test-event', mockCallback);
        expect(result).toBe(entity);
      });

      it('should delegate once() to gameObject when available', () => {
        const result = entity.once('test-event', mockCallback);

        expect(mockGameObject.once).toHaveBeenCalledWith('test-event', mockCallback);
        expect(result).toBe(entity);
      });

      it('should delegate emit() to gameObject when available', () => {
        const result = entity.emit('test-event', 'arg1', 'arg2');

        expect(mockGameObject.emit).toHaveBeenCalledWith('test-event', 'arg1', 'arg2');
        expect(result).toBe(entity);
      });

      it('should delegate removeAllListeners() to gameObject when available', () => {
        const result = entity.removeAllListeners('test-event');

        expect(mockGameObject.removeAllListeners).toHaveBeenCalledWith('test-event');
        expect(result).toBe(entity);
      });
    });

    describe('Internal Event System (When GameObject is Null)', () => {
      beforeEach(() => {
        entity.gameObject = null;
      });

      it('should use internal event scopeName for on() when no gameObject', () => {
        entity.on('test-event', mockCallback);

        expect(entity._eventListeners.has('test-event')).toBe(true);
        expect(entity._eventListeners.get('test-event')).toContain(mockCallback);
      });

      it('should emit events using internal scopeName', () => {
        entity.on('test-event', mockCallback);
        entity.emit('test-event', 'arg1', 'arg2');

        expect(mockCallback).toHaveBeenCalledWith('arg1', 'arg2');
      });

      it('should handle multiple listeners for same event', () => {
        const callback2 = vi.fn();
        entity.on('test-event', mockCallback);
        entity.on('test-event', callback2);

        entity.emit('test-event', 'data');

        expect(mockCallback).toHaveBeenCalledWith('data');
        expect(callback2).toHaveBeenCalledWith('data');
      });

      it('should remove specific listener with off()', () => {
        const callback2 = vi.fn();
        entity.on('test-event', mockCallback);
        entity.on('test-event', callback2);

        entity.off('test-event', mockCallback);

        entity.emit('test-event', 'data');
        expect(mockCallback).not.toHaveBeenCalled();
        expect(callback2).toHaveBeenCalledWith('data');
      });

      it('should clean up event when no listeners remain', () => {
        entity.on('test-event', mockCallback);
        entity.off('test-event', mockCallback);

        expect(entity._eventListeners.has('test-event')).toBe(false);
      });

      it('should implement once() with internal scopeName', () => {
        entity.once('test-event', mockCallback);
        
        entity.emit('test-event', 'data1');
        entity.emit('test-event', 'data2');

        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith('data1');
      });

      it('should remove all listeners for specific event', () => {
        const callback2 = vi.fn();
        entity.on('test-event', mockCallback);
        entity.on('test-event', callback2);

        entity.removeAllListeners('test-event');

        expect(entity._eventListeners.has('test-event')).toBe(false);
      });

      it('should remove all listeners when no event specified', () => {
        entity.on('event1', mockCallback);
        entity.on('event2', mockCallback);

        entity.removeAllListeners();

        expect(entity._eventListeners.size).toBe(0);
      });

      it('should handle errors in event callbacks gracefully', () => {
        const errorCallback = vi.fn(() => {
          throw new Error('Callback error');
        });

        entity.on('test-event', errorCallback);
        entity.on('test-event', mockCallback);

        entity.emit('test-event', 'data');

        expect(Logger.error).toHaveBeenCalledWith(
          expect.stringContaining("Event handler error for event 'test-event'"),
          expect.any(Error)
        );
        expect(mockCallback).toHaveBeenCalledWith('data'); // Other callbacks still execute
      });
    });
  });

  describe('Method Delegation Tests', () => {
    let entity;

    beforeEach(() => {
      entity = new BaseEntity(mockScene, { type: 'rectangle' });
      entity.gameObject = mockGameObject;
    });

    it('should delegate setPosition() and return entity for chaining', () => {
      const result = entity.setPosition(150, 250);

      expect(entity.config.x).toBe(150);
      expect(entity.config.y).toBe(250);
      expect(mockGameObject.setPosition).toHaveBeenCalledWith(150, 250);
      expect(result).toBe(entity);
    });

    it('should handle setPosition() when gameObject is null', () => {
      entity.gameObject = null;
      const result = entity.setPosition(100, 200);

      expect(entity.config.x).toBe(100);
      expect(entity.config.y).toBe(200);
      expect(result).toBe(entity);
    });

    it('should delegate setDepth() when gameObject supports it', () => {
      const result = entity.setDepth(10);

      expect(mockGameObject.setDepth).toHaveBeenCalledWith(10);
      expect(result).toBe(entity);
    });

    it('should handle setDepth() when gameObject is null', () => {
      entity.gameObject = null;
      const result = entity.setDepth(10);

      expect(result).toBe(entity);
    });

    it('should delegate setScale() with x and y parameters', () => {
      const result = entity.setScale(2, 3);

      expect(mockGameObject.setScale).toHaveBeenCalledWith(2, 3);
      expect(result).toBe(entity);
    });

    it('should delegate setScale() with only x parameter', () => {
      const result = entity.setScale(1.5);

      expect(mockGameObject.setScale).toHaveBeenCalledWith(1.5, undefined);
      expect(result).toBe(entity);
    });

    it('should delegate setRotation()', () => {
      const result = entity.setRotation(Math.PI / 4);

      expect(mockGameObject.setRotation).toHaveBeenCalledWith(Math.PI / 4);
      expect(result).toBe(entity);
    });

    it('should delegate setAlpha()', () => {
      const result = entity.setAlpha(0.5);

      expect(mockGameObject.setAlpha).toHaveBeenCalledWith(0.5);
      expect(result).toBe(entity);
    });

    it('should delegate setTint()', () => {
      const result = entity.setTint(0xff0000);

      expect(mockGameObject.setTint).toHaveBeenCalledWith(0xff0000);
      expect(result).toBe(entity);
    });

    it('should handle delegated methods when gameObject lacks the method', () => {
      delete mockGameObject.setTint;
      
      const result = entity.setTint(0xff0000);
      expect(result).toBe(entity); // Should not error and still return entity for chaining
    });
  });

  describe('Lifecycle Methods Tests', () => {
    let entity;

    beforeEach(() => {
      entity = new BaseEntity(mockScene, { type: 'rectangle' });
      entity.gameObject = mockGameObject;
    });

    describe('changeGameObjectType', () => {
      it('should change GameObject type and preserve position', () => {
        mockGameObject.x = 150;
        mockGameObject.y = 250;

        const result = entity.changeGameObjectType('circle', { radius: 20 });

        expect(mockGameObject.destroy).toHaveBeenCalled();
        expect(entity.config.type).toBe('circle');
        expect(entity.config.x).toBe(150);
        expect(entity.config.y).toBe(250);
        expect(entity.config.radius).toBe(20);
        expect(mockScene.add.circle).toHaveBeenCalled();
        expect(result).toBe(entity);
      });

      it('should use new position when specified in config', () => {
        const result = entity.changeGameObjectType('rectangle', { x: 300, y: 400 });

        expect(entity.config.x).toBe(300);
        expect(entity.config.y).toBe(400);
        expect(result).toBe(entity);
      });

      it('should handle changing to null type', () => {
        const result = entity.changeGameObjectType(null);

        expect(mockGameObject.destroy).toHaveBeenCalled();
        expect(entity.gameObject).toBeNull();
        expect(result).toBe(entity);
      });

      it('should handle changing when current gameObject is null', () => {
        entity.gameObject = null;
        entity.config.x = 100;
        entity.config.y = 200;

        const result = entity.changeGameObjectType('rectangle');

        expect(entity.config.type).toBe('rectangle');
        expect(mockScene.add.rectangle).toHaveBeenCalled();
        expect(result).toBe(entity);
      });
    });

    describe('enablePhysics', () => {
      it('should enable physics with dynamic body type', () => {
        const result = entity.enablePhysics('dynamic');

        expect(mockScene.physics.add.existing).toHaveBeenCalledWith(mockGameObject, false);
        expect(mockPhysicsBody.setImmovable).toHaveBeenCalledWith(false);
        expect(result).toBe(entity);
      });

      it('should enable physics with static body type', () => {
        const result = entity.enablePhysics('static');

        expect(mockScene.physics.add.existing).toHaveBeenCalledWith(mockGameObject, true);
        expect(mockPhysicsBody.setImmovable).toHaveBeenCalledWith(true);
        expect(result).toBe(entity);
      });

      it('should enable physics with kinematic body type', () => {
        const result = entity.enablePhysics('kinematic');

        expect(mockScene.physics.add.existing).toHaveBeenCalledWith(mockGameObject, false);
        expect(mockPhysicsBody.setImmovable).toHaveBeenCalledWith(true);
        expect(mockPhysicsBody.moves).toBe(true);
        expect(result).toBe(entity);
      });

      it('should default to dynamic when no type specified', () => {
        const result = entity.enablePhysics();

        expect(mockPhysicsBody.setImmovable).toHaveBeenCalledWith(false);
        expect(result).toBe(entity);
      });

      it('should warn and return entity when no gameObject', () => {
        entity.gameObject = null;

        const result = entity.enablePhysics();

        expect(Logger.warn).toHaveBeenCalledWith(
          expect.stringContaining('Cannot enable physics - no GameObject')
        );
        expect(result).toBe(entity);
      });

      it('should handle missing physics scopeName gracefully', () => {
        mockScene.physics = null;

        const result = entity.enablePhysics();

        expect(result).toBe(entity);
      });

      it('should handle missing physics body gracefully', () => {
        mockGameObject.body = null;

        const result = entity.enablePhysics();

        expect(result).toBe(entity);
      });
    });

    describe('setSize', () => {
      it('should set size on config and gameObject', () => {
        const result = entity.setSize(80, 60);

        expect(entity.config.width).toBe(80);
        expect(entity.config.height).toBe(60);
        expect(mockGameObject.setSize).toHaveBeenCalledWith(80, 60);
        expect(result).toBe(entity);
      });

      it('should update physics body size when available', () => {
        const result = entity.setSize(100, 80);

        expect(mockPhysicsBody.setSize).toHaveBeenCalledWith(80, 64); // 80% of original
        expect(mockPhysicsBody.setOffset).toHaveBeenCalledWith(10, 8); // 10% offset
        expect(result).toBe(entity);
      });

      it('should handle invalid size parameters', () => {
        const result = entity.setSize(-10, 0);

        expect(Logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Invalid size parameters'),
          expect.objectContaining({ width: -10, height: 0 })
        );
        expect(result).toBe(entity);
      });

      it('should handle destroyed scene gracefully', () => {
        mockScene.sys.isDestroyed = true;

        const result = entity.setSize(50, 50);

        expect(Logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Cannot setSize - scene is destroyed')
        );
        expect(result).toBe(entity);
      });

      it('should handle inactive gameObject gracefully', () => {
        mockGameObject.active = false;

        const result = entity.setSize(50, 50);

        expect(Logger.error).toHaveBeenCalledWith(
          expect.stringContaining('GameObject appears to be corrupted')
        );
        expect(result).toBe(entity);
      });

      it('should handle setSize errors gracefully', () => {
        mockGameObject.setSize.mockImplementation(() => {
          throw new Error('setSize failed');
        });

        const result = entity.setSize(50, 50);

        expect(Logger.error).toHaveBeenCalledWith(
          expect.stringContaining('setSize failed'),
          expect.objectContaining({
            error: 'setSize failed',
            width: 50,
            height: 50,
          })
        );
        expect(result).toBe(entity);
      });

      it('should handle missing setSize method gracefully', () => {
        delete mockGameObject.setSize;

        const result = entity.setSize(50, 50);

        expect(entity.config.width).toBe(50);
        expect(entity.config.height).toBe(50);
        expect(result).toBe(entity);
      });

      it('should handle null gameObject gracefully', () => {
        entity.gameObject = null;

        const result = entity.setSize(50, 50);

        expect(entity.config.width).toBe(50);
        expect(entity.config.height).toBe(50);
        expect(result).toBe(entity);
      });
    });

    describe('update', () => {
      it('should have default update method that does nothing', () => {
        expect(() => {
          entity.update(16.67);
        }).not.toThrow();
      });
    });

    describe('destroy', () => {
      let mockComponent1;
      let mockComponent2;

      beforeEach(() => {
        mockComponent1 = { entity: entity };
        mockComponent2 = { entity: entity };
        entity.components.set('Component1', mockComponent1);
        entity.components.set('Component2', mockComponent2);

        // Add event listeners
        entity._eventListeners.set('test-event', [vi.fn(), vi.fn()]);
      });

      it('should clean up all components', () => {
        entity.destroy();

        expect(mockComponent1.entity).toBeNull();
        expect(mockComponent2.entity).toBeNull();
        expect(entity.components.size).toBe(0);
      });

      it('should clear internal event listeners', () => {
        entity.destroy();

        expect(entity._eventListeners.size).toBe(0);
      });

      it('should remove entity from scene registry', () => {
        expect(mockScene.entities).toContain(entity);

        entity.destroy();

        expect(mockScene.entities).not.toContain(entity);
      });

      it('should call gameObject destroy method', () => {
        entity.destroy();

        expect(mockGameObject.destroy).toHaveBeenCalled();
      });

      it('should handle destroy when gameObject is null', () => {
        entity.gameObject = null;

        expect(() => {
          entity.destroy();
        }).not.toThrow();
      });

      it('should handle destroy when scene is null', () => {
        entity.scene = null;

        expect(() => {
          entity.destroy();
        }).not.toThrow();
      });

      it('should handle destroy when scene.entities is null', () => {
        mockScene.entities = null;

        expect(() => {
          entity.destroy();
        }).not.toThrow();
      });

      it('should handle component without entity reference', () => {
        mockComponent1.entity = null;

        expect(() => {
          entity.destroy();
        }).not.toThrow();
      });
    });
  });

  describe('Integration and Edge Cases', () => {
    describe('Entity ID Generation', () => {
      it('should generate unique IDs for multiple entities', () => {
        const ids = new Set();
        
        for (let i = 0; i < 100; i++) {
          const id = BaseEntity.generateId();
          expect(ids.has(id)).toBe(false);
          ids.add(id);
        }

        expect(ids.size).toBe(100);
      });

      it('should generate IDs with correct format', () => {
        const id = BaseEntity.generateId();
        expect(id).toMatch(/^entity_\d+_[a-z0-9]+$/);
      });
    });

    describe('Error Handling and Null Safety', () => {
      it('should handle null scene gracefully', () => {
        expect(() => {
          new BaseEntity(null, { type: 'rectangle' });
        }).toThrow(); // Expected to throw when scene.add is null
      });

      it('should handle scene without add methods', () => {
        const brokenScene = { entities: [] };

        expect(() => {
          new BaseEntity(brokenScene, { type: 'rectangle' });
        }).toThrow(); // Expected to fail when trying to create GameObject
      });

      it('should handle malformed components gracefully', () => {
        const entity = new BaseEntity(mockScene, { type: 'rectangle' });
        const brokenComponent = {}; // No constructor.name

        expect(() => {
          entity.addComponent(brokenComponent);
        }).not.toThrow();
      });
    });

    describe('Memory Leak Prevention', () => {
      it('should clear all references on destroy', () => {
        const entity = new BaseEntity(mockScene, { type: 'rectangle' });
        const mockComponent = { entity: entity };
        entity.addComponent(mockComponent);
        entity.on('test', vi.fn());

        entity.destroy();

        expect(entity.components.size).toBe(0);
        expect(entity._eventListeners.size).toBe(0);
        expect(mockComponent.entity).toBeNull();
      });

      it('should not hold references to destroyed gameObjects', () => {
        const entity = new BaseEntity(mockScene, { type: 'rectangle' });
        entity.gameObject = mockGameObject;

        entity.destroy();

        expect(mockGameObject.destroy).toHaveBeenCalled();
      });
    });

    describe('Method Chaining', () => {
      it('should support method chaining for all configuration methods', () => {
        const entity = new BaseEntity(mockScene, { type: 'rectangle' });
        entity.gameObject = mockGameObject;

        const result = entity
          .setPosition(100, 200)
          .setSize(50, 60)
          .setDepth(10)
          .setScale(2)
          .setRotation(Math.PI)
          .setAlpha(0.5)
          .setTint(0xff0000)
          .enablePhysics('dynamic');

        expect(result).toBe(entity);
      });

      it('should support method chaining for component operations', () => {
        const entity = new BaseEntity(mockScene, { type: 'rectangle' });
        const component = { constructor: { name: 'TestComponent' } };

        const result = entity
          .addComponent(component)
          .removeComponent(component.constructor);

        expect(result).toBe(entity);
      });

      it('should support method chaining for event operations', () => {
        const entity = new BaseEntity(mockScene, { type: null });
        const callback = vi.fn();

        const result = entity
          .on('test1', callback)
          .once('test2', callback)
          .off('test1', callback)
          .emit('test2')
          .removeAllListeners();

        expect(result).toBe(entity);
      });
    });

    describe('Backward Compatibility', () => {
      it('should work with legacy Entity usage patterns', () => {
        // Test old-style constructor
        const entity = new BaseEntity(mockScene, 100, 200, 64, 64, 0x0099ff, 'player');

        expect(entity.x).toBe(100);
        expect(entity.y).toBe(200);
        expect(entity.width).toBe(64);
        expect(entity.height).toBe(64);
        expect(entity.name).toBe('player');
        expect(entity.config.color).toBe(0x0099ff);
      });

      it('should maintain same API surface as original Entity class', () => {
        const entity = new BaseEntity(mockScene, { type: 'rectangle' });

        // Check that all expected methods exist
        expect(typeof entity.addComponent).toBe('function');
        expect(typeof entity.removeComponent).toBe('function');
        expect(typeof entity.getComponent).toBe('function');
        expect(typeof entity.hasComponent).toBe('function');
        expect(typeof entity.getAllComponents).toBe('function');
        expect(typeof entity.update).toBe('function');
        expect(typeof entity.destroy).toBe('function');
        expect(typeof entity.setPosition).toBe('function');
        expect(typeof entity.setSize).toBe('function');
        expect(typeof entity.enablePhysics).toBe('function');
      });
    });
  });

  describe('Logging Integration', () => {
    it('should log entity creation', () => {
      new BaseEntity(mockScene, { type: 'rectangle', name: 'testEntity' });

      expect(Logger.scope('BaseEntity').debug).toHaveBeenCalledWith(
        expect.stringContaining('[BaseEntity] Entity created:'),
        expect.objectContaining({
          type: 'rectangle',
          position: { x: 0, y: 0 },
          hasGameObject: true,
          name: 'testEntity',
        })
      );
    });

    it('should log component operations', () => {
      const entity = new BaseEntity(mockScene, { type: 'rectangle' });
      const component = { constructor: { name: 'TestComponent' } };

      entity.addComponent(component);

      expect(Logger.scope('BaseEntity').debug).toHaveBeenCalledWith(
        expect.stringContaining('[BaseEntity] Component added: TestComponent')
      );

      entity.removeComponent(component.constructor);

      expect(Logger.scope('BaseEntity').debug).toHaveBeenCalledWith(
        expect.stringContaining('[BaseEntity] Component removed: TestComponent')
      );
    });

    it('should log lifecycle operations', () => {
      vi.clearAllMocks(); // Clear creation logs
      const entity = new BaseEntity(mockScene, { type: 'rectangle' });
      vi.clearAllMocks(); // Clear creation logs again

      entity.setPosition(100, 200);
      expect(Logger.scope('BaseEntity').debug).toHaveBeenCalledWith(
        expect.stringContaining('moved to (100, 200)')
      );

      entity.setSize(50, 60);
      expect(Logger.scope('BaseEntity').debug).toHaveBeenCalledWith(
        expect.stringContaining('resized to 50x60')
      );

      entity.destroy();
      expect(Logger.scope('BaseEntity').debug).toHaveBeenCalledWith(
        expect.stringContaining('[BaseEntity] Entity destroyed:')
      );
    });
  });
});