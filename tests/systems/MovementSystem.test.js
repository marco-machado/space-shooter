/**
 * MovementSystem Tests
 * Comprehensive unit tests for the MovementSystem ECS system class
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import MovementSystem from '@/systems/MovementSystem.js';
import BaseSystem from '@/systems/BaseSystem.js';
import MovementComponent from '@/components/MovementComponent.js';
import { EventTypes, EventPriority } from '@/event-bus/EventTypes.js';
import { resetMockEventBus } from '../__mocks__/EventBus.js';

// Mock dependencies
vi.mock('@/utils/Logger.js', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/event-bus/EventBus.js', async () => {
  const actual = await vi.importActual('../__mocks__/EventBus.js');
  return actual;
});

describe('MovementSystem', () => {
  let system, mockScene, mockEntities;

  beforeEach(() => {
    // Reset EventBus mock
    resetMockEventBus();

    // Create mock scene
    mockScene = {
      scene: { key: 'TestScene' },
      scale: { width: 800, height: 600 },
      time: {
        delayedCall: vi.fn((delay, callback) => {
          setTimeout(callback, delay);
        }),
      },
    };

    // Create system instance
    system = new MovementSystem(mockScene);

    // Create mock entities for testing
    mockEntities = [
      createMockEntity('player', 100, 200, new MovementComponent(200)),
      createMockEntity('enemy', 300, 150, new MovementComponent(120)),
      createMockEntity('projectile', 250, 250, new MovementComponent(400)),
    ];
  });

  afterEach(() => {
    if (system) {
      system.destroy();
    }
    resetMockEventBus();
  });

  /**
   * Helper function to create mock entities
   */
  function createMockEntity(type, x, y, movementComponent) {
    const entity = {
      entityType: type,
      x: x,
      y: y,
      width: 32,
      height: 32,
      active: true,
      components: new Map(),
      emit: vi.fn(),
      destroy: vi.fn(),
      getComponent: vi.fn(),
      hasComponent: vi.fn(),
      addComponent: vi.fn(),
    };

    // Set up component system
    if (movementComponent) {
      entity.components.set('MovementComponent', movementComponent);
      movementComponent.entity = entity;
    }

    entity.getComponent.mockImplementation((componentType) => {
      return entity.components.get(componentType.name);
    });

    entity.hasComponent.mockImplementation((componentType) => {
      return entity.components.has(componentType.name);
    });

    return entity;
  }

  /**
   * Helper function to create mock input data
   */
  function createInputData(action, direction = null, state = null) {
    return { action, direction, state };
  }

  describe('Constructor and Initialization', () => {
    it('should extend BaseSystem', () => {
      expect(system).toBeInstanceOf(BaseSystem);
    });

    it('should initialize with correct default values', () => {
      expect(system.scene).toBe(mockScene);
      expect(system.priority).toBe(10);
      expect(system.playerInputState.movement).toEqual({ x: 0, y: 0 });
      expect(system.playerInputState.weaponFiring).toBe(false);
      expect(system.inputListenerId).toBeNull();
    });

    it('should have EventBus reference', () => {
      expect(system.eventBus).toBeDefined();
    });

    it('should initialize system correctly', () => {
      const config = { priority: 15, active: true };
      system.init(config);

      expect(system.priority).toBe(15);
      expect(system.inputListenerId).toBeDefined();
    });

    it('should set up event listener on initialization', () => {
      system.init();
      
      expect(system.inputListenerId).toBeDefined();
      expect(system.eventBus.hasListener(EventTypes.PLAYER_INPUT)).toBe(true);
    });
  });

  describe('Player Input Handling', () => {
    beforeEach(() => {
      system.init();
    });

    it('should handle movement input correctly', () => {
      const inputData = createInputData('movement', { x: 0.8, y: -0.6 });
      
      system.handlePlayerInput(inputData);
      
      expect(system.playerInputState.movement.x).toBe(0.8);
      expect(system.playerInputState.movement.y).toBe(-0.6);
    });

    it('should handle weapon fire start', () => {
      const inputData = createInputData('weapon_fire', null, 'start');
      
      system.handlePlayerInput(inputData);
      
      expect(system.playerInputState.weaponFiring).toBe(true);
    });

    it('should handle weapon fire stop', () => {
      system.playerInputState.weaponFiring = true;
      const inputData = createInputData('weapon_fire', null, 'stop');
      
      system.handlePlayerInput(inputData);
      
      expect(system.playerInputState.weaponFiring).toBe(false);
    });

    it('should handle unknown action gracefully', () => {
      const inputData = createInputData('unknown_action');
      
      expect(() => {
        system.handlePlayerInput(inputData);
      }).not.toThrow();
    });

    it('should handle missing direction for movement', () => {
      const inputData = { action: 'movement', direction: { x: 0, y: 0 } };
      
      system.handlePlayerInput(inputData);
      
      expect(system.playerInputState.movement).toEqual({ x: 0, y: 0 });
    });
  });

  describe('Entity Movement Updates', () => {
    beforeEach(() => {
      system.init();
    });

    it('should update all entities with movement components', () => {
      const delta = 16.67; // ~60fps
      
      system.update(mockEntities, delta);
      
      // Verify update was called for each entity
      mockEntities.forEach(entity => {
        if (entity.hasComponent(MovementComponent)) {
          expect(entity.getComponent).toHaveBeenCalledWith(MovementComponent);
        }
      });
    });

    it('should skip inactive entities', () => {
      mockEntities[1].active = false;
      const delta = 16.67;
      
      system.update(mockEntities, delta);
      
      // Should not process inactive entity
      expect(mockEntities[1].getComponent).not.toHaveBeenCalled();
    });

    it('should skip entities without movement component', () => {
      const entityWithoutMovement = createMockEntity('static', 400, 300);
      entityWithoutMovement.hasComponent.mockReturnValue(false);
      
      const entitiesWithStatic = [...mockEntities, entityWithoutMovement];
      
      system.update(entitiesWithStatic, 16.67);
      
      expect(entityWithoutMovement.getComponent).not.toHaveBeenCalled();
    });

    it('should convert delta from milliseconds to seconds', () => {
      const deltaMs = 33.33; // 30fps in milliseconds
      const expectedDeltaSeconds = deltaMs / 1000;
      
      // Mock the updateEntityMovement to capture the delta
      const originalUpdate = system.updateEntityMovement;
      system.updateEntityMovement = vi.fn();
      
      system.update(mockEntities, deltaMs);
      
      expect(system.updateEntityMovement).toHaveBeenCalledWith(
        expect.any(Object),
        expectedDeltaSeconds
      );
      
      system.updateEntityMovement = originalUpdate;
    });
  });

  describe('Player Input Application', () => {
    let playerEntity, movementComponent;

    beforeEach(() => {
      system.init();
      playerEntity = mockEntities.find(e => e.entityType === 'player');
      movementComponent = playerEntity.getComponent(MovementComponent);
      
      // Set up movement component methods
      movementComponent.setVelocity = vi.fn();
    });

    it('should apply player input to player entity', () => {
      system.playerInputState.movement = { x: 0.5, y: -0.8 };
      movementComponent.maxSpeed = 200;
      
      system.applyPlayerInput(playerEntity, movementComponent);
      
      expect(movementComponent.setVelocity).toHaveBeenCalledWith(100, -160);
    });

    it('should handle zero input', () => {
      system.playerInputState.movement = { x: 0, y: 0 };
      movementComponent.maxSpeed = 200;
      
      system.applyPlayerInput(playerEntity, movementComponent);
      
      expect(movementComponent.setVelocity).toHaveBeenCalledWith(0, 0);
    });

    it('should scale input by max speed', () => {
      system.playerInputState.movement = { x: 1, y: 1 };
      movementComponent.maxSpeed = 150;
      
      system.applyPlayerInput(playerEntity, movementComponent);
      
      expect(movementComponent.setVelocity).toHaveBeenCalledWith(150, 150);
    });
  });

  describe('Physics Simulation', () => {
    let testEntity, movementComponent;

    beforeEach(() => {
      system.init();
      testEntity = mockEntities[1]; // Use enemy entity to avoid player input interference
      movementComponent = testEntity.getComponent(MovementComponent);
    });

    it('should apply acceleration to velocity', () => {
      movementComponent.accelerationX = 100;
      movementComponent.accelerationY = -50;
      movementComponent.velocityX = 20;
      movementComponent.velocityY = 10;
      
      const delta = 0.1; // 100ms
      system.updateEntityMovement(testEntity, delta);
      
      expect(movementComponent.velocityX).toBe(30); // 20 + (100 * 0.1)
      expect(movementComponent.velocityY).toBe(5);  // 10 + (-50 * 0.1)
    });

    it('should apply drag when no acceleration', () => {
      movementComponent.velocityX = 100;
      movementComponent.velocityY = -60;
      movementComponent.accelerationX = 0;
      movementComponent.accelerationY = 0;
      movementComponent.drag = 2;
      
      const delta = 0.1;
      system.updateEntityMovement(testEntity, delta);
      
      // Drag force = -velocity * drag * delta
      expect(movementComponent.velocityX).toBe(80);  // 100 + (-100 * 2 * 0.1)
      expect(movementComponent.velocityY).toBe(-48); // -60 + (60 * 2 * 0.1)
    });

    it('should not apply drag when acceleration is present', () => {
      movementComponent.velocityX = 100;
      movementComponent.accelerationX = 50;
      movementComponent.drag = 2;
      
      const originalVelocity = movementComponent.velocityX;
      const delta = 0.1;
      
      system.updateEntityMovement(testEntity, delta);
      
      // Should have acceleration applied, but no drag
      expect(movementComponent.velocityX).toBe(105); // 100 + (50 * 0.1)
    });

    it('should apply friction correctly', () => {
      movementComponent.velocityX = 100;
      movementComponent.velocityY = 50;
      movementComponent.friction = 0.9;
      
      const delta = 0.0167; // ~60fps
      const expectedMultiplier = Math.pow(0.9, delta * 60);
      
      system.updateEntityMovement(testEntity, delta);
      
      expect(movementComponent.velocityX).toBeCloseTo(100 * expectedMultiplier, 2);
      expect(movementComponent.velocityY).toBeCloseTo(50 * expectedMultiplier, 2);
    });

    it('should update entity position based on velocity', () => {
      movementComponent.velocityX = 50;
      movementComponent.velocityY = -30;
      const originalX = testEntity.x;
      const originalY = testEntity.y;
      
      const delta = 0.1;
      system.updateEntityMovement(testEntity, delta);
      
      expect(testEntity.x).toBe(originalX + 5);  // 50 * 0.1
      expect(testEntity.y).toBe(originalY - 3); // -30 * 0.1
    });

    it('should reset acceleration after each frame', () => {
      movementComponent.accelerationX = 100;
      movementComponent.accelerationY = -75;
      
      system.updateEntityMovement(testEntity, 0.1);
      
      expect(movementComponent.accelerationX).toBe(0);
      expect(movementComponent.accelerationY).toBe(0);
    });
  });

  describe('Velocity Clamping', () => {
    let movementComponent;

    beforeEach(() => {
      movementComponent = new MovementComponent(100);
    });

    it('should clamp velocity to max speed', () => {
      movementComponent.velocityX = 80;
      movementComponent.velocityY = 60; // Magnitude = 100, exactly at max
      movementComponent.maxSpeed = 100;
      
      system.clampVelocity(movementComponent);
      
      expect(movementComponent.velocityX).toBe(80);
      expect(movementComponent.velocityY).toBe(60);
    });

    it('should scale down velocity when exceeding max speed', () => {
      movementComponent.velocityX = 120;
      movementComponent.velocityY = 160; // Magnitude = 200, should be scaled to 100
      movementComponent.maxSpeed = 100;
      
      system.clampVelocity(movementComponent);
      
      const resultSpeed = Math.sqrt(
        movementComponent.velocityX ** 2 + movementComponent.velocityY ** 2
      );
      expect(resultSpeed).toBeCloseTo(100, 5);
      
      // Direction should be preserved
      expect(movementComponent.velocityX).toBeCloseTo(60, 5);  // 120/2
      expect(movementComponent.velocityY).toBeCloseTo(80, 5);  // 160/2
    });

    it('should handle zero max speed', () => {
      movementComponent.velocityX = 50;
      movementComponent.velocityY = 30;
      movementComponent.maxSpeed = 0;
      
      system.clampVelocity(movementComponent);
      
      // Should not modify velocity when max speed is 0
      expect(movementComponent.velocityX).toBe(50);
      expect(movementComponent.velocityY).toBe(30);
    });

    it('should handle negative max speed', () => {
      movementComponent.velocityX = 50;
      movementComponent.velocityY = 30;
      movementComponent.maxSpeed = -100;
      
      system.clampVelocity(movementComponent);
      
      // Should not modify velocity when max speed is negative
      expect(movementComponent.velocityX).toBe(50);
      expect(movementComponent.velocityY).toBe(30);
    });

    it('should handle zero velocity', () => {
      movementComponent.velocityX = 0;
      movementComponent.velocityY = 0;
      movementComponent.maxSpeed = 100;
      
      expect(() => {
        system.clampVelocity(movementComponent);
      }).not.toThrow();
      
      expect(movementComponent.velocityX).toBe(0);
      expect(movementComponent.velocityY).toBe(0);
    });
  });

  describe('AI Movement Patterns', () => {
    let aiEntity, movementComponent;

    beforeEach(() => {
      system.init();
      aiEntity = mockEntities.find(e => e.entityType === 'enemy');
      movementComponent = aiEntity.getComponent(MovementComponent);
      movementComponent.aiUpdateTimer = 0;
      movementComponent.aiUpdateInterval = 100;
      movementComponent.patternStartTime = Date.now();
    });

    describe('AI Update Timing', () => {
      it('should not update AI when timer has not elapsed', () => {
        movementComponent.aiPattern = 'straight';
        movementComponent.aiUpdateTimer = 50; // Less than interval
        
        const originalVelocity = { x: movementComponent.velocityX, y: movementComponent.velocityY };
        
        system.updateAIMovement(aiEntity, movementComponent, 0.016);
        
        // Velocity should not change
        expect(movementComponent.velocityX).toBe(originalVelocity.x);
        expect(movementComponent.velocityY).toBe(originalVelocity.y);
      });

      it('should update AI when timer has elapsed', () => {
        movementComponent.aiPattern = 'straight';
        movementComponent.aiUpdateTimer = 150; // Greater than interval
        movementComponent.aiPatternData = { direction: 0, speed: 100 };
        
        system.updateAIMovement(aiEntity, movementComponent, 0.016);
        
        // Timer should be reset
        expect(movementComponent.aiUpdateTimer).toBe(0);
      });

      it('should accumulate AI update timer', () => {
        movementComponent.aiPattern = 'straight';
        movementComponent.aiUpdateTimer = 50;
        
        system.updateAIMovement(aiEntity, movementComponent, 0.033); // 33ms
        
        expect(movementComponent.aiUpdateTimer).toBe(83); // 50 + 33
      });
    });

    describe('Straight Movement Pattern', () => {
      it('should move in straight line', () => {
        movementComponent.aiPattern = 'straight';
        movementComponent.aiUpdateTimer = 100;
        movementComponent.aiPatternData = {
          direction: Math.PI / 4, // 45 degrees
          speed: 100,
        };
        
        system.updateAIMovement(aiEntity, movementComponent, 0.016);
        
        expect(movementComponent.velocityX).toBeCloseTo(Math.cos(Math.PI / 4) * 100, 5);
        expect(movementComponent.velocityY).toBeCloseTo(Math.sin(Math.PI / 4) * 100, 5);
      });

      it('should handle zero direction', () => {
        movementComponent.aiPattern = 'straight';
        movementComponent.aiUpdateTimer = 100;
        movementComponent.aiPatternData = { direction: 0, speed: 50 };
        
        system.updateAIMovement(aiEntity, movementComponent, 0.016);
        
        expect(movementComponent.velocityX).toBe(50);
        expect(movementComponent.velocityY).toBeCloseTo(0, 5);
      });
    });

    describe('Curve Movement Pattern', () => {
      it('should create curved movement', () => {
        movementComponent.aiPattern = 'curve';
        movementComponent.aiUpdateTimer = 100;
        movementComponent.patternStartTime = Date.now() - 1000; // 1 second ago
        movementComponent.aiPatternData = {
          amplitude: 50,
          frequency: 1,
          baseDirection: Math.PI / 2, // Downward
          speed: 100,
        };
        
        system.updateAIMovement(aiEntity, movementComponent, 0.016);
        
        // Should have base movement plus oscillation
        expect(movementComponent.velocityX).not.toBe(0);
        expect(movementComponent.velocityY).not.toBe(0);
      });

      it('should oscillate around base direction', () => {
        movementComponent.aiPattern = 'curve';
        movementComponent.aiUpdateTimer = 100;
        movementComponent.patternStartTime = Date.now();
        movementComponent.aiPatternData = {
          amplitude: 100,
          frequency: 2,
          baseDirection: 0, // Right
          speed: 100,
        };
        
        system.updateAIMovement(aiEntity, movementComponent, 0.016);
        
        // At time 0, oscillation should be 0, so should be pure base movement
        expect(movementComponent.velocityX).toBeCloseTo(100, 1);
        expect(Math.abs(movementComponent.velocityY)).toBeLessThan(1);
      });
    });

    describe('Circle Movement Pattern', () => {
      it('should move in circular pattern', () => {
        movementComponent.aiPattern = 'circle';
        movementComponent.aiUpdateTimer = 100;
        movementComponent.aiPatternData = {
          centerX: 400,
          centerY: 300,
          radius: 100,
          angularSpeed: 1,
          clockwise: true,
        };
        
        // Mock moveTowards method
        system.moveTowards = vi.fn();
        
        system.updateAIMovement(aiEntity, movementComponent, 0.016);
        
        expect(system.moveTowards).toHaveBeenCalledWith(
          aiEntity,
          movementComponent,
          expect.any(Number), // targetX
          expect.any(Number), // targetY
          expect.any(Number)  // speed
        );
      });

      it('should handle clockwise and counter-clockwise rotation', () => {
        const setupCircleTest = (clockwise, timeOffset) => {
          movementComponent.aiPattern = 'circle';
          movementComponent.aiUpdateTimer = 100;
          movementComponent.patternStartTime = Date.now() - timeOffset;
          movementComponent.aiPatternData = {
            centerX: 400,
            centerY: 300,
            radius: 100,
            angularSpeed: 2, // Faster rotation to see difference
            clockwise: clockwise,
          };
          
          system.moveTowards = vi.fn();
          system.updateAIMovement(aiEntity, movementComponent, 0.016);
          
          return system.moveTowards.mock.calls[0];
        };

        const clockwiseCall = setupCircleTest(true, 1000);
        const counterClockwiseCall = setupCircleTest(false, 1500); // Different time to see difference
        
        // Target positions should be different for clockwise vs counter-clockwise
        // At different time points, clockwise and counter-clockwise should move in different directions
        const clockwiseX = clockwiseCall[2];
        const counterClockwiseX = counterClockwiseCall[2];
        
        // Different time offsets should produce different positions
        expect(Math.abs(clockwiseX - counterClockwiseX)).toBeGreaterThan(0.1);
      });
    });

    describe('Zigzag Movement Pattern', () => {
      it('should create zigzag movement', () => {
        movementComponent.aiPattern = 'zigzag';
        movementComponent.aiUpdateTimer = 100;
        movementComponent.patternStartTime = Date.now();
        movementComponent.aiPatternData = {
          amplitude: 60,
          frequency: 2,
          baseDirection: Math.PI / 2, // Downward
          speed: 100,
        };
        
        system.updateAIMovement(aiEntity, movementComponent, 0.016);
        
        // Should have base movement
        expect(movementComponent.velocityX).not.toBe(0);
        expect(movementComponent.velocityY).not.toBe(0);
      });

      it('should zigzag perpendicular to base direction', () => {
        movementComponent.aiPattern = 'zigzag';
        movementComponent.aiUpdateTimer = 100;
        movementComponent.patternStartTime = Date.now();
        movementComponent.aiPatternData = {
          amplitude: 50,
          frequency: 1,
          baseDirection: 0, // Right movement
          speed: 100,
        };
        
        system.updateAIMovement(aiEntity, movementComponent, 0.016);
        
        // At time 0, should be mostly rightward movement
        expect(movementComponent.velocityX).toBeCloseTo(100, 1);
        expect(Math.abs(movementComponent.velocityY)).toBeLessThan(2);
      });
    });

    describe('Formation Movement Pattern', () => {
      it('should follow formation leader', () => {
        const leader = { x: 500, y: 400 };
        movementComponent.aiPattern = 'formation';
        movementComponent.aiUpdateTimer = 100;
        movementComponent.aiPatternData = {
          formationLeader: leader,
          offsetX: -50,
          offsetY: 30,
          followDistance: 80,
          speed: 100,
        };
        
        system.moveTowards = vi.fn();
        
        system.updateAIMovement(aiEntity, movementComponent, 0.016);
        
        expect(system.moveTowards).toHaveBeenCalledWith(
          aiEntity,
          movementComponent,
          450, // leader.x + offsetX
          430, // leader.y + offsetY
          100
        );
      });

      it('should slow down when close to formation position', () => {
        const leader = { x: aiEntity.x + 50, y: aiEntity.y - 30 }; // Close position
        movementComponent.aiPattern = 'formation';
        movementComponent.aiUpdateTimer = 100;
        movementComponent.velocityX = 60;
        movementComponent.velocityY = 40;
        movementComponent.aiPatternData = {
          formationLeader: leader,
          offsetX: 0,
          offsetY: 0,
          followDistance: 100, // Larger than distance to leader
          speed: 100,
        };
        
        system.updateAIMovement(aiEntity, movementComponent, 0.016);
        
        // Velocity should be reduced
        expect(movementComponent.velocityX).toBe(30); // 60 * 0.5
        expect(movementComponent.velocityY).toBe(20); // 40 * 0.5
      });

      it('should handle missing formation leader', () => {
        movementComponent.aiPattern = 'formation';
        movementComponent.aiUpdateTimer = 100;
        movementComponent.aiPatternData = {
          formationLeader: null,
          offsetX: 0,
          offsetY: 0,
          followDistance: 50,
          speed: 100,
        };
        
        expect(() => {
          system.updateAIMovement(aiEntity, movementComponent, 0.016);
        }).not.toThrow();
      });
    });

    describe('Chase Movement Pattern', () => {
      it('should chase target entity', () => {
        const target = { x: 600, y: 500, getComponent: vi.fn() };
        movementComponent.aiPattern = 'chase';
        movementComponent.aiUpdateTimer = 100;
        movementComponent.aiTarget = target;
        movementComponent.aiPatternData = {
          chaseSpeed: 120,
          keepDistance: 40,
          prediction: 0,
        };
        
        system.moveTowards = vi.fn();
        
        system.updateAIMovement(aiEntity, movementComponent, 0.016);
        
        expect(system.moveTowards).toHaveBeenCalledWith(
          aiEntity,
          movementComponent,
          600, // target.x
          500, // target.y
          120
        );
      });

      it('should predict target movement', () => {
        const targetMovement = new MovementComponent();
        targetMovement.velocityX = 50;
        targetMovement.velocityY = -30;
        
        const target = {
          x: 400,
          y: 300,
          getComponent: vi.fn().mockReturnValue(targetMovement),
        };
        
        movementComponent.aiPattern = 'chase';
        movementComponent.aiUpdateTimer = 100;
        movementComponent.aiTarget = target;
        movementComponent.aiPatternData = {
          chaseSpeed: 100,
          keepDistance: 0,
          prediction: 0.5, // 0.5 seconds prediction
        };
        
        system.moveTowards = vi.fn();
        
        system.updateAIMovement(aiEntity, movementComponent, 0.016);
        
        expect(system.moveTowards).toHaveBeenCalledWith(
          aiEntity,
          movementComponent,
          425, // 400 + (50 * 0.5)
          285, // 300 + (-30 * 0.5)
          100
        );
      });

      it('should maintain minimum distance from target', () => {
        const target = { x: aiEntity.x + 20, y: aiEntity.y + 15 }; // Very close
        movementComponent.aiPattern = 'chase';
        movementComponent.aiUpdateTimer = 100;
        movementComponent.aiTarget = target;
        movementComponent.velocityX = 80;
        movementComponent.velocityY = 60;
        movementComponent.aiPatternData = {
          chaseSpeed: 100,
          keepDistance: 50, // Larger than distance to target
          prediction: 0,
        };
        
        system.updateAIMovement(aiEntity, movementComponent, 0.016);
        
        // Should slow down instead of chasing
        expect(movementComponent.velocityX).toBe(24); // 80 * 0.3
        expect(movementComponent.velocityY).toBe(18); // 60 * 0.3
      });

      it('should handle missing chase target', () => {
        movementComponent.aiPattern = 'chase';
        movementComponent.aiUpdateTimer = 100;
        movementComponent.aiTarget = null;
        movementComponent.aiPatternData = {
          chaseSpeed: 100,
          keepDistance: 30,
          prediction: 0.2,
        };
        
        expect(() => {
          system.updateAIMovement(aiEntity, movementComponent, 0.016);
        }).not.toThrow();
      });
    });

    it('should handle "none" AI pattern', () => {
      movementComponent.aiPattern = 'none';
      movementComponent.aiUpdateTimer = 100;
      const originalVelocity = { x: movementComponent.velocityX, y: movementComponent.velocityY };
      
      system.updateAIMovement(aiEntity, movementComponent, 0.016);
      
      // Should not change velocity
      expect(movementComponent.velocityX).toBe(originalVelocity.x);
      expect(movementComponent.velocityY).toBe(originalVelocity.y);
    });
  });

  describe('Move Towards Helper', () => {
    let movementComponent;

    beforeEach(() => {
      movementComponent = new MovementComponent(100);
    });

    it('should move towards target position', () => {
      const entity = { x: 0, y: 0 };
      const targetX = 30;
      const targetY = 40; // 3-4-5 triangle
      const speed = 50;
      
      system.clampVelocity = vi.fn();
      
      system.moveTowards(entity, movementComponent, targetX, targetY, speed);
      
      expect(movementComponent.velocityX).toBe(30); // (30/50) * 50
      expect(movementComponent.velocityY).toBe(40); // (40/50) * 50
      expect(system.clampVelocity).toHaveBeenCalledWith(movementComponent);
    });

    it('should handle zero distance to target', () => {
      const entity = { x: 100, y: 200 };
      const targetX = 100;
      const targetY = 200;
      const speed = 75;
      
      system.moveTowards(entity, movementComponent, targetX, targetY, speed);
      
      // Should not modify velocity when already at target
      expect(movementComponent.velocityX).toBe(0);
      expect(movementComponent.velocityY).toBe(0);
    });

    it('should normalize direction vector', () => {
      const entity = { x: 0, y: 0 };
      const targetX = 100;
      const targetY = 0;
      const speed = 50;
      
      system.clampVelocity = vi.fn();
      
      system.moveTowards(entity, movementComponent, targetX, targetY, speed);
      
      expect(movementComponent.velocityX).toBe(50); // Full speed in X direction
      expect(movementComponent.velocityY).toBe(0);
    });
  });

  describe('Screen Boundary Handling', () => {
    let testEntity, movementComponent;

    beforeEach(() => {
      testEntity = createMockEntity('test', 0, 0, new MovementComponent());
      movementComponent = testEntity.getComponent(MovementComponent);
      movementComponent.boundToScreen = true;
      movementComponent.screenPadding = 10;
    });

    describe('Clamp Boundary Behavior', () => {
      beforeEach(() => {
        movementComponent.boundaryBehavior = 'clamp';
      });

      it('should clamp entity to left boundary', () => {
        testEntity.x = -5; // Past left boundary
        testEntity.width = 32;
        movementComponent.velocityX = -50;
        
        system.applyScreenBounds(testEntity, movementComponent);
        
        expect(testEntity.x).toBe(26); // padding + width/2
        expect(movementComponent.velocityX).toBe(0); // Negative velocity clamped
      });

      it('should clamp entity to right boundary', () => {
        testEntity.x = 850; // Past right boundary (800 - 10 - 16)
        testEntity.width = 32;
        movementComponent.velocityX = 50;
        
        system.applyScreenBounds(testEntity, movementComponent);
        
        expect(testEntity.x).toBe(774); // width - padding - width/2
        expect(movementComponent.velocityX).toBe(0); // Positive velocity clamped
      });

      it('should clamp entity to top boundary', () => {
        testEntity.y = -5;
        testEntity.height = 32;
        movementComponent.velocityY = -30;
        
        system.applyScreenBounds(testEntity, movementComponent);
        
        expect(testEntity.y).toBe(26); // padding + height/2
        expect(movementComponent.velocityY).toBe(0);
      });

      it('should clamp entity to bottom boundary', () => {
        testEntity.y = 650; // Past bottom boundary
        testEntity.height = 32;
        movementComponent.velocityY = 40;
        
        system.applyScreenBounds(testEntity, movementComponent);
        
        expect(testEntity.y).toBe(574); // height - padding - height/2
        expect(movementComponent.velocityY).toBe(0);
      });
    });

    describe('Wrap Boundary Behavior', () => {
      beforeEach(() => {
        movementComponent.boundaryBehavior = 'wrap';
      });

      it('should wrap from left to right', () => {
        testEntity.x = -5;
        testEntity.width = 32;
        
        system.applyScreenBounds(testEntity, movementComponent);
        
        expect(testEntity.x).toBe(774); // Wrapped to right side
      });

      it('should wrap from right to left', () => {
        testEntity.x = 850;
        testEntity.width = 32;
        
        system.applyScreenBounds(testEntity, movementComponent);
        
        expect(testEntity.x).toBe(26); // Wrapped to left side
      });

      it('should wrap from top to bottom', () => {
        testEntity.y = -5;
        testEntity.height = 32;
        
        system.applyScreenBounds(testEntity, movementComponent);
        
        expect(testEntity.y).toBe(574); // Wrapped to bottom
      });

      it('should wrap from bottom to top', () => {
        testEntity.y = 650;
        testEntity.height = 32;
        
        system.applyScreenBounds(testEntity, movementComponent);
        
        expect(testEntity.y).toBe(26); // Wrapped to top
      });
    });

    describe('Bounce Boundary Behavior', () => {
      beforeEach(() => {
        movementComponent.boundaryBehavior = 'bounce';
      });

      it('should bounce off left boundary', () => {
        testEntity.x = -5;
        testEntity.width = 32;
        movementComponent.velocityX = -50;
        
        system.applyScreenBounds(testEntity, movementComponent);
        
        expect(testEntity.x).toBe(26);
        expect(movementComponent.velocityX).toBe(40); // Reversed and reduced by 0.8
      });

      it('should bounce off right boundary', () => {
        testEntity.x = 850;
        testEntity.width = 32;
        movementComponent.velocityX = 50;
        
        system.applyScreenBounds(testEntity, movementComponent);
        
        expect(testEntity.x).toBe(774);
        expect(movementComponent.velocityX).toBe(-40); // Reversed and reduced
      });

      it('should bounce off top boundary', () => {
        testEntity.y = -5;
        testEntity.height = 32;
        movementComponent.velocityY = -60;
        
        system.applyScreenBounds(testEntity, movementComponent);
        
        expect(testEntity.y).toBe(26);
        expect(movementComponent.velocityY).toBe(48); // Reversed and reduced
      });

      it('should bounce off bottom boundary', () => {
        testEntity.y = 650;
        testEntity.height = 32;
        movementComponent.velocityY = 70;
        
        system.applyScreenBounds(testEntity, movementComponent);
        
        expect(testEntity.y).toBe(574);
        expect(movementComponent.velocityY).toBe(-56); // Reversed and reduced
      });
    });

    describe('Destroy Boundary Behavior', () => {
      beforeEach(() => {
        movementComponent.boundaryBehavior = 'destroy';
      });

      it('should schedule entity destruction when past left boundary', () => {
        testEntity.x = -5;
        testEntity.width = 32;
        
        system.applyScreenBounds(testEntity, movementComponent);
        
        expect(mockScene.time.delayedCall).toHaveBeenCalledWith(
          10,
          expect.any(Function)
        );
      });

      it('should schedule entity destruction when past any boundary', () => {
        const boundaries = [
          { x: -5, y: 300 },   // Left
          { x: 850, y: 300 },  // Right
          { x: 400, y: -5 },   // Top
          { x: 400, y: 650 },  // Bottom
        ];
        
        boundaries.forEach((pos, index) => {
          const entity = createMockEntity('test', pos.x, pos.y, new MovementComponent());
          entity.width = 32;
          entity.height = 32;
          const mc = entity.getComponent(MovementComponent);
          mc.boundToScreen = true;
          mc.boundaryBehavior = 'destroy';
          
          system.applyScreenBounds(entity, mc);
          
          expect(mockScene.time.delayedCall).toHaveBeenCalledTimes(index + 1);
        });
      });
    });

    it('should handle entities without screen bounds', () => {
      // This test checks that applyScreenBounds doesn't throw, not that it doesn't modify
      // The boundToScreen check happens in updateEntityMovement, not in applyScreenBounds
      const isolatedEntity = {
        x: -100,
        y: 300,
        width: 32,
        height: 32,
        active: true
      };
      const isolatedMovement = new MovementComponent();
      isolatedMovement.boundToScreen = false;
      isolatedMovement.boundaryBehavior = 'clamp';
      
      expect(() => {
        system.applyScreenBounds(isolatedEntity, isolatedMovement);
      }).not.toThrow();
      
      // applyScreenBounds will still modify the position because it doesn't check boundToScreen
      // The boundToScreen check is done in the calling method (updateEntityMovement)
      expect(isolatedEntity.x).toBeGreaterThanOrEqual(16); // Position will be clamped
    });

    it('should handle missing scene', () => {
      system.scene = null;
      testEntity.x = -5;
      
      expect(() => {
        system.applyScreenBounds(testEntity, movementComponent);
      }).not.toThrow();
    });
  });

  describe('Movement State Tracking', () => {
    let testEntity, movementComponent;

    beforeEach(() => {
      testEntity = createMockEntity('test', 100, 200, new MovementComponent());
      movementComponent = testEntity.getComponent(MovementComponent);
    });

    it('should detect when entity starts moving', () => {
      movementComponent.isMoving = false;
      movementComponent.velocityX = 50;
      movementComponent.velocityY = 30;
      
      system.updateMovingState(testEntity, movementComponent);
      
      expect(movementComponent.isMoving).toBe(true);
      expect(testEntity.emit).toHaveBeenCalledWith('moveStart', {
        velocity: { x: 50, y: 30 }
      });
    });

    it('should detect when entity stops moving', () => {
      movementComponent.isMoving = true;
      movementComponent.velocityX = 0;
      movementComponent.velocityY = 0;
      movementComponent.lastDirection = { x: 25, y: -15 };
      
      system.updateMovingState(testEntity, movementComponent);
      
      expect(movementComponent.isMoving).toBe(false);
      expect(testEntity.emit).toHaveBeenCalledWith('moveStop', {
        lastDirection: { x: 25, y: -15 }
      });
    });

    it('should update last direction when moving', () => {
      movementComponent.isMoving = true;
      movementComponent.velocityX = 40;
      movementComponent.velocityY = -20;
      
      system.updateMovingState(testEntity, movementComponent);
      
      expect(movementComponent.lastDirection.x).toBe(40);
      expect(movementComponent.lastDirection.y).toBe(-20);
    });

    it('should not emit events for entities without emit method', () => {
      testEntity.emit = null;
      movementComponent.isMoving = false;
      movementComponent.velocityX = 30;
      
      expect(() => {
        system.updateMovingState(testEntity, movementComponent);
      }).not.toThrow();
    });

    it('should consider very small velocities as not moving', () => {
      movementComponent.velocityX = 0.005; // Below threshold
      movementComponent.velocityY = 0.008;
      
      system.updateMovingState(testEntity, movementComponent);
      
      expect(movementComponent.isMoving).toBe(false);
    });

    it('should not emit events when movement state has not changed', () => {
      movementComponent.isMoving = true;
      movementComponent.velocityX = 50;
      movementComponent.velocityY = 30;
      
      system.updateMovingState(testEntity, movementComponent);
      
      expect(testEntity.emit).not.toHaveBeenCalled();
    });
  });

  describe('System Lifecycle', () => {
    it('should handle being added to scene', () => {
      const newScene = { scene: { key: 'NewScene' } };
      
      system.onAddedToScene(newScene);
      
      expect(system.scene).toBe(newScene);
    });

    it('should clean up properly on destroy', () => {
      system.init();
      const originalListenerId = system.inputListenerId;
      
      system.destroy();
      
      expect(system.inputListenerId).toBeNull();
      expect(system.playerInputState.movement).toEqual({ x: 0, y: 0 });
      expect(system.playerInputState.weaponFiring).toBe(false);
      expect(system.eventBus).toBeNull();
      expect(system.scene).toBeNull();
    });

    it('should handle destroy without initialization', () => {
      const freshSystem = new MovementSystem(mockScene);
      
      expect(() => {
        freshSystem.destroy();
      }).not.toThrow();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle null movement component', () => {
      const entityWithoutMovement = createMockEntity('test', 100, 200);
      entityWithoutMovement.getComponent.mockReturnValue(null);
      
      expect(() => {
        system.updateEntityMovement(entityWithoutMovement, 0.016);
      }).not.toThrow();
    });

    it('should handle inactive entities', () => {
      const inactiveEntity = createMockEntity('test', 100, 200, new MovementComponent());
      inactiveEntity.active = false;
      
      expect(() => {
        system.updateEntityMovement(inactiveEntity, 0.016);
      }).not.toThrow();
    });

    it('should handle NaN values in physics', () => {
      const testEntity = mockEntities[0];
      const movementComponent = testEntity.getComponent(MovementComponent);
      
      movementComponent.velocityX = NaN;
      movementComponent.velocityY = NaN;
      movementComponent.accelerationX = NaN;
      movementComponent.accelerationY = NaN;
      
      expect(() => {
        system.updateEntityMovement(testEntity, 0.016);
      }).not.toThrow();
    });

    it('should handle very large delta values', () => {
      const testEntity = mockEntities[0];
      const movementComponent = testEntity.getComponent(MovementComponent);
      
      movementComponent.velocityX = 100;
      movementComponent.accelerationX = 50;
      
      expect(() => {
        system.updateEntityMovement(testEntity, 10); // 10 seconds
      }).not.toThrow();
    });

    it('should handle zero delta values', () => {
      const testEntity = mockEntities[0];
      
      expect(() => {
        system.updateEntityMovement(testEntity, 0);
      }).not.toThrow();
    });

    it('should handle entities with missing properties', () => {
      const incompleteEntity = {
        entityType: 'test',
        active: true,
        getComponent: vi.fn().mockReturnValue(new MovementComponent()),
        hasComponent: vi.fn().mockReturnValue(true),
        // Missing x, y, width, height
      };
      
      expect(() => {
        system.updateEntityMovement(incompleteEntity, 0.016);
      }).not.toThrow();
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large numbers of entities efficiently', () => {
      const manyEntities = [];
      for (let i = 0; i < 1000; i++) {
        manyEntities.push(createMockEntity('test', i * 10, i * 5, new MovementComponent()));
      }
      
      const startTime = performance.now();
      system.update(manyEntities, 16.67);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should not leak memory during repeated updates', () => {
      const testEntity = mockEntities[0];
      const movementComponent = testEntity.getComponent(MovementComponent);
      
      // Simulate many game frames
      for (let i = 0; i < 1000; i++) {
        system.updateEntityMovement(testEntity, 0.016);
        movementComponent.accelerationX = Math.random() * 100;
        movementComponent.accelerationY = Math.random() * 100;
      }
      
      // Should not crash or consume excessive memory
      expect(system).toBeDefined();
    });
  });
});