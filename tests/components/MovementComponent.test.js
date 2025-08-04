/**
 * MovementComponent Tests
 * Comprehensive unit tests for the MovementComponent data container class
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import MovementComponent from '@/components/MovementComponent.js';
import BaseComponent from '@/components/BaseComponent.js';

// Mock Logger to prevent console output during tests
vi.mock('@/utils/Logger.js', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('MovementComponent', () => {
  let component, mockEntity;

  beforeEach(() => {
    // Create fresh component instance for each test
    component = new MovementComponent();
    
    // Mock entity for testing
    mockEntity = {
      x: 100,
      y: 200,
      width: 64,
      height: 64,
      active: true,
    };
  });

  describe('Constructor and Initialization', () => {
    it('should extend BaseComponent', () => {
      expect(component).toBeInstanceOf(BaseComponent);
    });

    it('should initialize with default values', () => {
      expect(component.velocityX).toBe(0);
      expect(component.velocityY).toBe(0);
      expect(component.maxSpeed).toBe(200);
      expect(component.accelerationX).toBe(0);
      expect(component.accelerationY).toBe(0);
      expect(component.drag).toBe(0);
      expect(component.friction).toBe(1);
      expect(component.boundToScreen).toBe(true);
      expect(component.screenPadding).toBe(0);
      expect(component.boundaryBehavior).toBe('clamp');
      expect(component.isMoving).toBe(false);
      expect(component.lastDirection).toEqual({ x: 0, y: 0 });
      expect(component.aiPattern).toBe('none');
      expect(component.aiTarget).toBeNull();
      expect(component.aiPatternData).toEqual({});
      expect(component.aiUpdateTimer).toBe(0);
      expect(component.aiUpdateInterval).toBe(100);
    });

    it('should initialize with custom max speed', () => {
      const customComponent = new MovementComponent(500);
      expect(customComponent.maxSpeed).toBe(500);
    });

    it('should have valid pattern start time', () => {
      const before = Date.now();
      const testComponent = new MovementComponent();
      const after = Date.now();
      
      expect(testComponent.patternStartTime).toBeGreaterThanOrEqual(before);
      expect(testComponent.patternStartTime).toBeLessThanOrEqual(after);
    });
  });

  describe('Initialization with Data', () => {
    it('should initialize with configuration data', () => {
      const data = {
        maxSpeed: 300,
        velocityX: 50,
        velocityY: -25,
        accelerationX: 10,
        accelerationY: -5,
        drag: 0.5,
        friction: 0.8,
        boundToScreen: false,
        screenPadding: 20,
        boundaryBehavior: 'bounce',
        aiPattern: 'straight',
        aiUpdateInterval: 150,
        aiPatternData: { speed: 100 },
      };

      component.init(data);

      expect(component.maxSpeed).toBe(300);
      expect(component.velocityX).toBe(50);
      expect(component.velocityY).toBe(-25);
      expect(component.accelerationX).toBe(10);
      expect(component.accelerationY).toBe(-5);
      expect(component.drag).toBe(0.5);
      expect(component.friction).toBe(0.8);
      expect(component.boundToScreen).toBe(false);
      expect(component.screenPadding).toBe(20);
      expect(component.boundaryBehavior).toBe('bounce');
      expect(component.aiPattern).toBe('straight');
      expect(component.aiUpdateInterval).toBe(150);
    });

    it('should clamp values to valid ranges', () => {
      const data = {
        maxSpeed: -100, // Should be clamped to 0
        drag: -50, // Should be clamped to 0
        friction: 1.5, // Should be clamped to 1
        screenPadding: -10, // Should be clamped to 0
        aiUpdateInterval: 25, // Should be clamped to 50
      };

      component.init(data);

      expect(component.maxSpeed).toBe(0);
      expect(component.drag).toBe(0);
      expect(component.friction).toBe(1);
      expect(component.screenPadding).toBe(0);
      expect(component.aiUpdateInterval).toBe(50);
    });

    it('should handle undefined friction correctly', () => {
      const data = { friction: undefined };
      component.init(data);
      expect(component.friction).toBe(1);
    });
  });

  describe('Velocity Manipulation', () => {
    it('should set velocity correctly', () => {
      component.setVelocity(100, -50);
      expect(component.velocityX).toBe(100);
      expect(component.velocityY).toBe(-50);
    });

    it('should add to velocity correctly', () => {
      component.setVelocity(50, 25);
      component.addVelocity(30, -10);
      expect(component.velocityX).toBe(80);
      expect(component.velocityY).toBe(15);
    });

    it('should set acceleration correctly', () => {
      component.setAcceleration(200, -100);
      expect(component.accelerationX).toBe(200);
      expect(component.accelerationY).toBe(-100);
    });

    it('should apply force by adding to acceleration', () => {
      component.setAcceleration(50, 25);
      component.applyForce(30, -15);
      expect(component.accelerationX).toBe(80);
      expect(component.accelerationY).toBe(10);
    });

    it('should move in direction correctly', () => {
      const angle = Math.PI / 4; // 45 degrees
      const speed = 100;
      const expectedX = Math.cos(angle) * speed;
      const expectedY = Math.sin(angle) * speed;

      component.moveInDirection(angle, speed);
      
      expect(component.velocityX).toBeCloseTo(expectedX, 5);
      expect(component.velocityY).toBeCloseTo(expectedY, 5);
    });

    it('should stop movement correctly', () => {
      component.setVelocity(100, -50);
      component.setAcceleration(25, 10);
      
      component.stop();
      
      expect(component.velocityX).toBe(0);
      expect(component.velocityY).toBe(0);
      expect(component.accelerationX).toBe(0);
      expect(component.accelerationY).toBe(0);
    });
  });

  describe('Mathematical Helper Methods', () => {
    it('should calculate current speed correctly', () => {
      component.setVelocity(3, 4); // 3-4-5 triangle
      expect(component.getCurrentSpeed()).toBe(5);
    });

    it('should calculate current speed for zero velocity', () => {
      component.setVelocity(0, 0);
      expect(component.getCurrentSpeed()).toBe(0);
    });

    it('should calculate direction correctly', () => {
      component.setVelocity(1, 0); // Right
      expect(component.getDirection()).toBe(0);

      component.setVelocity(0, 1); // Down
      expect(component.getDirection()).toBeCloseTo(Math.PI / 2, 5);

      component.setVelocity(-1, 0); // Left
      expect(component.getDirection()).toBeCloseTo(Math.PI, 5);

      component.setVelocity(0, -1); // Up
      expect(component.getDirection()).toBeCloseTo(-Math.PI / 2, 5);
    });

    it('should handle zero velocity direction calculation', () => {
      component.setVelocity(0, 0);
      expect(component.getDirection()).toBe(0);
    });
  });

  describe('AI Pattern Management', () => {
    it('should set AI pattern correctly', () => {
      const patternData = { speed: 150, direction: Math.PI };
      const target = { x: 300, y: 400 };

      component.setAIPattern('chase', patternData, target);

      expect(component.aiPattern).toBe('chase');
      expect(component.aiPatternData).toEqual(expect.objectContaining(patternData));
      expect(component.aiTarget).toBe(target);
    });

    it('should reset pattern start time when setting new pattern', () => {
      const before = Date.now();
      component.setAIPattern('zigzag');
      const after = Date.now();

      expect(component.patternStartTime).toBeGreaterThanOrEqual(before);
      expect(component.patternStartTime).toBeLessThanOrEqual(after);
    });

    it('should reset pattern phase when setting new pattern', () => {
      component.patternPhase = 5;
      component.setAIPattern('circle');
      expect(component.patternPhase).toBe(0);
    });
  });

  describe('AI Pattern Initialization', () => {
    beforeEach(() => {
      component.entity = mockEntity; // Some patterns need entity reference
    });

    it('should initialize straight pattern correctly', () => {
      component.aiPattern = 'straight';
      component.aiPatternData = { direction: Math.PI / 6, speed: 120 };
      component.initializeAIPattern();

      expect(component.aiPatternData.direction).toBe(Math.PI / 6);
      expect(component.aiPatternData.speed).toBe(120);
    });

    it('should initialize straight pattern with defaults', () => {
      component.aiPattern = 'straight';
      component.maxSpeed = 200;
      component.initializeAIPattern();

      expect(component.aiPatternData.direction).toBe(0);
      expect(component.aiPatternData.speed).toBe(100); // maxSpeed * 0.5
    });

    it('should initialize curve pattern correctly', () => {
      component.aiPattern = 'curve';
      component.aiPatternData = { amplitude: 150, frequency: 1.5 };
      component.initializeAIPattern();

      expect(component.aiPatternData.amplitude).toBe(150);
      expect(component.aiPatternData.frequency).toBe(1.5);
      expect(component.aiPatternData.baseDirection).toBe(Math.PI / 2);
    });

    it('should initialize circle pattern correctly', () => {
      component.aiPattern = 'circle';
      component.aiPatternData = { radius: 120, angularSpeed: 3, clockwise: false };
      component.initializeAIPattern();

      expect(component.aiPatternData.radius).toBe(120);
      expect(component.aiPatternData.angularSpeed).toBe(3);
      expect(component.aiPatternData.clockwise).toBe(false);
    });

    it('should initialize circle pattern with entity position', () => {
      component.entity = mockEntity;
      component.aiPattern = 'circle';
      component.initializeAIPattern();

      expect(component.aiPatternData.centerX).toBe(mockEntity.x);
      expect(component.aiPatternData.centerY).toBe(mockEntity.y);
    });

    it('should initialize zigzag pattern correctly', () => {
      component.aiPattern = 'zigzag';
      component.maxSpeed = 200;
      component.initializeAIPattern();

      expect(component.aiPatternData.amplitude).toBe(60);
      expect(component.aiPatternData.frequency).toBe(3);
      expect(component.aiPatternData.baseDirection).toBe(Math.PI / 2);
      expect(component.aiPatternData.speed).toBe(140); // maxSpeed * 0.7
    });

    it('should initialize formation pattern correctly', () => {
      const leader = { x: 500, y: 600 };
      component.aiPattern = 'formation';
      component.aiPatternData = {
        formationLeader: leader,
        offsetX: -50,
        offsetY: 30,
        followDistance: 80,
      };
      component.initializeAIPattern();

      expect(component.aiPatternData.formationLeader).toBe(leader);
      expect(component.aiPatternData.offsetX).toBe(-50);
      expect(component.aiPatternData.offsetY).toBe(30);
      expect(component.aiPatternData.followDistance).toBe(80);
    });

    it('should initialize chase pattern correctly', () => {
      component.aiPattern = 'chase';
      component.maxSpeed = 180;
      component.aiPatternData = { keepDistance: 40, prediction: 0.8 };
      component.initializeAIPattern();

      expect(component.aiPatternData.chaseSpeed).toBe(162); // maxSpeed * 0.9
      expect(component.aiPatternData.keepDistance).toBe(40);
      expect(component.aiPatternData.prediction).toBe(0.8);
    });
  });

  describe('Static Pattern Creators', () => {
    it('should create scout pattern correctly', () => {
      const pattern = MovementComponent.createScoutPattern();

      expect(pattern.aiPattern).toBe('straight');
      expect(pattern.aiPatternData.direction).toBe(Math.PI / 2);
      expect(pattern.aiPatternData.speed).toBe(150);
      expect(pattern.boundaryBehavior).toBe('destroy');
      expect(pattern.maxSpeed).toBe(180);
    });

    it('should create fighter pattern correctly', () => {
      const pattern = MovementComponent.createFighterPattern();

      expect(pattern.aiPattern).toBe('zigzag');
      expect(pattern.aiPatternData.amplitude).toBe(40);
      expect(pattern.aiPatternData.frequency).toBe(2);
      expect(pattern.aiPatternData.baseDirection).toBe(Math.PI / 2);
      expect(pattern.aiPatternData.speed).toBe(120);
      expect(pattern.boundaryBehavior).toBe('destroy');
      expect(pattern.maxSpeed).toBe(150);
    });

    it('should create bomber pattern correctly', () => {
      const pattern = MovementComponent.createBomberPattern();

      expect(pattern.aiPattern).toBe('curve');
      expect(pattern.aiPatternData.amplitude).toBe(80);
      expect(pattern.aiPatternData.frequency).toBe(1);
      expect(pattern.aiPatternData.baseDirection).toBe(Math.PI / 2);
      expect(pattern.aiPatternData.speed).toBe(80);
      expect(pattern.boundaryBehavior).toBe('destroy');
      expect(pattern.maxSpeed).toBe(100);
    });

    it('should create chase pattern correctly', () => {
      const target = { x: 400, y: 300 };
      const pattern = MovementComponent.createChasePattern(target);

      expect(pattern.aiPattern).toBe('chase');
      expect(pattern.aiPatternData.chaseSpeed).toBe(140);
      expect(pattern.aiPatternData.keepDistance).toBe(50);
      expect(pattern.aiPatternData.prediction).toBe(0.3);
      expect(pattern.aiTarget).toBe(target);
      expect(pattern.boundaryBehavior).toBe('bounce');
      expect(pattern.maxSpeed).toBe(160);
    });
  });

  describe('Serialization', () => {
    it('should serialize component data correctly', () => {
      component.velocityX = 50;
      component.velocityY = -25;
      component.maxSpeed = 300;
      component.drag = 0.2;
      component.friction = 0.9;
      component.boundToScreen = false;
      component.screenPadding = 15;
      component.boundaryBehavior = 'wrap';
      component.aiPattern = 'zigzag';
      component.aiPatternData = { amplitude: 50 };
      component.aiUpdateInterval = 120;

      const serialized = component.serialize();

      expect(serialized.velocityX).toBe(50);
      expect(serialized.velocityY).toBe(-25);
      expect(serialized.maxSpeed).toBe(300);
      expect(serialized.drag).toBe(0.2);
      expect(serialized.friction).toBe(0.9);
      expect(serialized.boundToScreen).toBe(false);
      expect(serialized.screenPadding).toBe(15);
      expect(serialized.boundaryBehavior).toBe('wrap');
      expect(serialized.aiPattern).toBe('zigzag');
      expect(serialized.aiPatternData).toEqual({ amplitude: 50 });
      expect(serialized.aiUpdateInterval).toBe(120);
    });

    it('should include base component serialization', () => {
      const serialized = component.serialize();
      expect(serialized).toHaveProperty('type');
      expect(serialized).toHaveProperty('componentId');
      expect(serialized).toHaveProperty('active');
    });
  });

  describe('Deserialization', () => {
    it('should deserialize component data correctly', () => {
      const data = {
        velocityX: 75,
        velocityY: -40,
        maxSpeed: 250,
        drag: 0.3,
        friction: 0.85,
        boundToScreen: false,
        screenPadding: 25,
        boundaryBehavior: 'bounce',
        aiPattern: 'circle',
        aiPatternData: { radius: 100 },
        aiUpdateInterval: 80,
      };

      component.deserialize(data);

      expect(component.velocityX).toBe(75);
      expect(component.velocityY).toBe(-40);
      expect(component.maxSpeed).toBe(250);
      expect(component.drag).toBe(0.3);
      expect(component.friction).toBe(0.85);
      expect(component.boundToScreen).toBe(false);
      expect(component.screenPadding).toBe(25);
      expect(component.boundaryBehavior).toBe('bounce');
      expect(component.aiPattern).toBe('circle');
      expect(component.aiUpdateInterval).toBe(80);
    });
  });

  describe('Validation', () => {
    it('should validate correct component data', () => {
      expect(component.validate()).toBe(true);
    });

    it('should reject negative max speed', () => {
      component.maxSpeed = -50;
      expect(component.validate()).toBe(false);
    });

    it('should reject negative drag', () => {
      component.drag = -0.5;
      expect(component.validate()).toBe(false);
    });

    it('should reject negative friction', () => {
      component.friction = -0.1;
      expect(component.validate()).toBe(false);
    });

    it('should reject friction greater than 1', () => {
      component.friction = 1.5;
      expect(component.validate()).toBe(false);
    });

    it('should reject negative screen padding', () => {
      component.screenPadding = -10;
      expect(component.validate()).toBe(false);
    });

    it('should reject invalid AI pattern', () => {
      component.aiPattern = 'invalid_pattern';
      expect(component.validate()).toBe(false);
    });

    it('should reject invalid boundary behavior', () => {
      component.boundaryBehavior = 'invalid_behavior';
      expect(component.validate()).toBe(false);
    });

    it('should accept all valid AI patterns', () => {
      const validPatterns = ['none', 'straight', 'curve', 'formation', 'chase', 'circle', 'zigzag'];
      
      for (const pattern of validPatterns) {
        component.aiPattern = pattern;
        expect(component.validate()).toBe(true);
      }
    });

    it('should accept all valid boundary behaviors', () => {
      const validBehaviors = ['clamp', 'wrap', 'bounce', 'destroy'];
      
      for (const behavior of validBehaviors) {
        component.boundaryBehavior = behavior;
        expect(component.validate()).toBe(true);
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle zero max speed', () => {
      component.maxSpeed = 0;
      expect(component.getCurrentSpeed()).toBe(0);
      expect(component.validate()).toBe(true);
    });

    it('should handle very large velocities', () => {
      component.setVelocity(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
      expect(component.velocityX).toBe(Number.MAX_SAFE_INTEGER);
      expect(component.velocityY).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle NaN values gracefully', () => {
      component.setVelocity(NaN, NaN);
      expect(isNaN(component.velocityX)).toBe(true);
      expect(isNaN(component.velocityY)).toBe(true);
    });

    it('should initialize with missing entity reference', () => {
      component.entity = null;
      component.aiPattern = 'circle';
      component.initializeAIPattern();
      
      expect(component.aiPatternData.centerX).toBe(0);
      expect(component.aiPatternData.centerY).toBe(0);
    });

    it('should handle pattern data merging correctly', () => {
      component.aiPattern = 'straight';
      component.aiPatternData = { direction: Math.PI, customProperty: 'test' };
      component.initializeAIPattern();

      expect(component.aiPatternData.direction).toBe(Math.PI);
      expect(component.aiPatternData.customProperty).toBe('test');
      expect(component.aiPatternData.speed).toBe(100); // Default value
    });
  });

  describe('Performance Considerations', () => {
    it('should not modify pattern start time unnecessarily', () => {
      const originalTime = component.patternStartTime;
      
      // Small delay to ensure time difference would be detectable
      const startTest = Date.now();
      while (Date.now() - startTest < 2) {
        // Wait
      }
      
      component.initializeAIPattern();
      expect(component.patternStartTime).toBeGreaterThan(originalTime);
    });

    it('should handle rapid velocity changes efficiently', () => {
      const iterations = 1000;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        component.setVelocity(Math.random() * 200, Math.random() * 200);
        component.getCurrentSpeed();
        component.getDirection();
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });
  });
});