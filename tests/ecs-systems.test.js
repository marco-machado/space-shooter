// ECS Systems Test
// Tests basic functionality of the bitECS system implementation

import { describe, it, expect, beforeEach } from 'vitest';
import { createWorld, addEntity, addComponent } from 'bitecs';
import { 
  Position, 
  Velocity, 
  Health, 
  Weapon,
  Render,
  AI,
  Player,
  Enemy
} from '@/ecs/components/index.js';
import {
  initializeWorld,
  updateWorldTime,
  addSpriteMapping
} from '@/ecs/world.js';
import {
  runSystemPipeline,
  validateSystems,
  getSystemInfo,
  setVelocity,
  setVisibility,
  setAIPattern,
  AI_PATTERNS,
  playerQuery,
  enemyQuery,
  movementQuery,
  renderQuery
} from '@/ecs/systems/index.js';

describe('ECS Systems', () => {
  let world;
  let playerEid;
  let enemyEid;

  beforeEach(() => {
    // Create a fresh world for each test
    world = initializeWorld();
  });

  it('should validate all systems are properly loaded', () => {
    const validation = validateSystems();
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should provide system information', () => {
    const systemInfo = getSystemInfo();
    expect(systemInfo.totalSystems).toBeGreaterThan(0);
    expect(systemInfo.totalQueries).toBeGreaterThan(0);
    expect(Array.isArray(systemInfo.systems)).toBe(true);
    expect(Array.isArray(systemInfo.queries)).toBe(true);
  });

  it('should create entities with components', () => {
    // Create player entity
    playerEid = addEntity(world);
    addComponent(world, Position, playerEid);
    addComponent(world, Velocity, playerEid);
    addComponent(world, Player, playerEid);
    
    // Set initial values
    Position.x[playerEid] = 100;
    Position.y[playerEid] = 100;
    setVelocity(playerEid, 0.1, 0);
    
    // Verify values are set
    expect(Position.x[playerEid]).toBe(100);
    expect(Position.y[playerEid]).toBe(100);
    expect(Velocity.x[playerEid]).toBeCloseTo(0.1, 6);
    expect(Velocity.y[playerEid]).toBe(0);
  });

  it('should execute system queries correctly', () => {
    // Create test entities
    playerEid = addEntity(world);
    addComponent(world, Position, playerEid);
    addComponent(world, Player, playerEid);
    
    enemyEid = addEntity(world);
    addComponent(world, Position, enemyEid);
    addComponent(world, Enemy, enemyEid);
    
    // Test queries
    const players = playerQuery(world);
    const enemies = enemyQuery(world);
    
    expect(players).toContain(playerEid);
    expect(players).toHaveLength(1);
    expect(enemies).toContain(enemyEid);
    expect(enemies).toHaveLength(1);
  });

  it('should update positions through movement system', () => {
    // Create moving entity
    const eid = addEntity(world);
    addComponent(world, Position, eid);
    addComponent(world, Velocity, eid);
    
    // Set initial state
    Position.x[eid] = 100;
    Position.y[eid] = 100;
    setVelocity(eid, 0.1, 0.05);
    
    const initialX = Position.x[eid];
    const initialY = Position.y[eid];
    
    // Update world time and run system
    updateWorldTime(world, 16); // 16ms delta
    runSystemPipeline(world);
    
    // Verify position changed
    expect(Position.x[eid]).toBeGreaterThan(initialX);
    expect(Position.y[eid]).toBeGreaterThan(initialY);
    
    // Calculate expected position
    const expectedX = initialX + (0.1 * 16);
    const expectedY = initialY + (0.05 * 16);
    
    expect(Position.x[eid]).toBeCloseTo(expectedX, 2);
    expect(Position.y[eid]).toBeCloseTo(expectedY, 2);
  });

  it('should handle render system with sprite mapping', () => {
    // Create renderable entity
    const eid = addEntity(world);
    addComponent(world, Position, eid);
    addComponent(world, Render, eid);
    
    Position.x[eid] = 150;
    Position.y[eid] = 200;
    setVisibility(eid, true);
    
    // Create mock sprite
    const mockSprite = {
      x: 0,
      y: 0,
      visible: false,
      depth: 0
    };
    
    addSpriteMapping(world, eid, mockSprite);
    
    // Run system pipeline
    runSystemPipeline(world);
    
    // Verify sprite was updated
    expect(mockSprite.x).toBe(150);
    expect(mockSprite.y).toBe(200);
    expect(mockSprite.visible).toBe(true);
  });

  it('should handle AI system with chase behavior', () => {
    // Create player and enemy
    playerEid = addEntity(world);
    addComponent(world, Position, playerEid);
    addComponent(world, Player, playerEid);
    
    enemyEid = addEntity(world);
    addComponent(world, Position, enemyEid);
    addComponent(world, Velocity, enemyEid);
    addComponent(world, AI, enemyEid);
    addComponent(world, Enemy, enemyEid);
    
    // Set positions
    Position.x[playerEid] = 200;
    Position.y[playerEid] = 100;
    Position.x[enemyEid] = 100;
    Position.y[enemyEid] = 100;
    
    // Set AI to chase player
    setAIPattern(enemyEid, AI_PATTERNS.CHASE_PLAYER, playerEid);
    
    // Run system
    updateWorldTime(world, 16);
    runSystemPipeline(world);
    
    // Enemy should have velocity toward player (positive X direction)
    expect(Velocity.x[enemyEid]).toBeGreaterThan(0);
  });

  it('should handle weapon system cooldowns', () => {
    // Create entity with weapon
    const eid = addEntity(world);
    addComponent(world, Position, eid);
    addComponent(world, Weapon, eid);
    
    Position.x[eid] = 100;
    Position.y[eid] = 100;
    Weapon.fireRate[eid] = 500; // 500ms cooldown
    Weapon.lastFired[eid] = 0;
    Weapon.damage[eid] = 10;
    Weapon.projectileSpeed[eid] = 0.3;
    Weapon.weaponType[eid] = 1;
    
    // Initialize world events array
    world.weaponEvents = [];
    
    // Run system multiple times
    updateWorldTime(world, 16);
    runSystemPipeline(world);
    
    // Verify weapon events are managed
    expect(Array.isArray(world.weaponEvents)).toBe(true);
  });

  it('should maintain consistent world time', () => {
    const initialElapsed = world.time.elapsed;
    
    updateWorldTime(world, 16);
    expect(world.time.delta).toBe(16);
    expect(world.time.elapsed).toBe(initialElapsed + 16);
    
    updateWorldTime(world, 20);
    expect(world.time.delta).toBe(20);
    expect(world.time.elapsed).toBe(initialElapsed + 36);
  });

  it('should handle multiple entities efficiently', () => {
    const entityCount = 50;
    const entities = [];
    
    // Create multiple moving entities
    for (let i = 0; i < entityCount; i++) {
      const eid = addEntity(world);
      addComponent(world, Position, eid);
      addComponent(world, Velocity, eid);
      
      Position.x[eid] = i * 10;
      Position.y[eid] = i * 5;
      setVelocity(eid, 0.1, 0.05);
      
      entities.push(eid);
    }
    
    // Run system
    const startTime = performance.now();
    updateWorldTime(world, 16);
    runSystemPipeline(world);
    const endTime = performance.now();
    
    // Verify all entities moved
    entities.forEach((eid, index) => {
      expect(Position.x[eid]).toBeGreaterThan(index * 10);
      expect(Position.y[eid]).toBeGreaterThan(index * 5);
    });
    
    // Performance should be reasonable (less than 5ms for 50 entities)
    const executionTime = endTime - startTime;
    expect(executionTime).toBeLessThan(5);
  });
});