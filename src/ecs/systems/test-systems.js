// Test file for ECS systems - basic functionality verification
// This is a development/debugging tool, not part of the production codebase

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
  debugSystemPipeline,
  testPipeline,
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
import Logger from '@/utils/Logger.js';

const logger = Logger.scope('ECS:SystemTest');

/**
 * Basic system functionality test.
 * Creates entities, runs systems, and validates behavior.
 */
export const runBasicSystemTest = () => {
  logger.info('Starting basic ECS systems test');
  
  try {
    // Create and initialize world
    const world = initializeWorld();
    logger.debug('World created', { name: world.name });
    
    // Validate all systems are properly loaded
    const validation = validateSystems();
    if (!validation.valid) {
      logger.error('System validation failed', { errors: validation.errors });
      return false;
    }
    logger.debug('System validation passed');
    
    // Create test entities
    const testResults = createTestEntities(world);
    if (!testResults.success) {
      logger.error('Failed to create test entities', { error: testResults.error });
      return false;
    }
    
    const { playerEid, enemyEid } = testResults;
    logger.debug('Test entities created', { playerEid, enemyEid });
    
    // Create mock sprites for testing render system
    const mockPlayerSprite = createMockSprite('player');
    const mockEnemySprite = createMockSprite('enemy');
    
    addSpriteMapping(world, playerEid, mockPlayerSprite);
    addSpriteMapping(world, enemyEid, mockEnemySprite);
    
    // Run systems for several frames to test behavior
    const frameCount = 5;
    for (let frame = 0; frame < frameCount; frame++) {
      // Update world time (simulate 16ms per frame for 60 FPS)
      updateWorldTime(world, 16);
      
      // Run system pipeline
      runSystemPipeline(world);
      
      // Validate entity states after each frame
      const frameResults = validateFrameResults(world, playerEid, enemyEid, frame);
      if (!frameResults.success) {
        logger.error(`Frame ${frame} validation failed`, { 
          error: frameResults.error,
          frame 
        });
        return false;
      }
      
      logger.debug(`Frame ${frame} completed successfully`, {
        playerPos: { x: Position.x[playerEid], y: Position.y[playerEid] },
        enemyPos: { x: Position.x[enemyEid], y: Position.y[enemyEid] }
      });
    }
    
    // Test system queries
    const queryResults = testSystemQueries(world);
    if (!queryResults.success) {
      logger.error('Query tests failed', { error: queryResults.error });
      return false;
    }
    
    logger.info('Basic ECS systems test completed successfully');
    return true;
    
  } catch (error) {
    logger.error('System test failed with exception', { 
      error: error.message, 
      stack: error.stack 
    });
    return false;
  }
};

/**
 * Create test entities for system testing.
 */
function createTestEntities(world) {
  try {
    // Create player entity
    const playerEid = addEntity(world);
    addComponent(world, Position, playerEid);
    addComponent(world, Velocity, playerEid);
    addComponent(world, Health, playerEid);
    addComponent(world, Weapon, playerEid);
    addComponent(world, Render, playerEid);
    addComponent(world, Player, playerEid);
    
    // Set initial player values
    Position.x[playerEid] = 100;
    Position.y[playerEid] = 100;
    setVelocity(playerEid, 0.1, 0); // Move right slowly
    Health.current[playerEid] = 100;
    Health.max[playerEid] = 100;
    Weapon.fireRate[playerEid] = 500; // 500ms between shots
    Weapon.damage[playerEid] = 10;
    Weapon.projectileSpeed[playerEid] = 0.3;
    Weapon.weaponType[playerEid] = 1;
    setVisibility(playerEid, true);
    Render.layer[playerEid] = 1;
    
    // Create enemy entity
    const enemyEid = addEntity(world);
    addComponent(world, Position, enemyEid);
    addComponent(world, Velocity, enemyEid);
    addComponent(world, Health, enemyEid);
    addComponent(world, Weapon, enemyEid);
    addComponent(world, Render, enemyEid);
    addComponent(world, AI, enemyEid);
    addComponent(world, Enemy, enemyEid);
    
    // Set initial enemy values
    Position.x[enemyEid] = 200;
    Position.y[enemyEid] = 150;
    setVelocity(enemyEid, -0.05, 0); // Move left slowly initially
    Health.current[enemyEid] = 50;
    Health.max[enemyEid] = 50;
    Weapon.fireRate[enemyEid] = 1000; // 1 second between shots
    Weapon.damage[enemyEid] = 5;
    Weapon.projectileSpeed[enemyEid] = 0.2;
    Weapon.weaponType[enemyEid] = 2;
    setVisibility(enemyEid, true);
    Render.layer[enemyEid] = 1;
    setAIPattern(enemyEid, AI_PATTERNS.CHASE_PLAYER, playerEid);
    
    return { success: true, playerEid, enemyEid };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Create a mock sprite object for testing.
 */
function createMockSprite(type) {
  return {
    x: 0,
    y: 0,
    visible: true,
    depth: 0,
    type,
    constructor: { name: 'MockSprite' }
  };
}

/**
 * Validate results after each frame.
 */
function validateFrameResults(world, playerEid, enemyEid, frame) {
  try {
    // Validate player position has updated (should be moving right)
    const expectedPlayerX = 100 + (0.1 * 16 * (frame + 1));
    const actualPlayerX = Position.x[playerEid];
    
    if (Math.abs(actualPlayerX - expectedPlayerX) > 0.01) {
      return {
        success: false,
        error: `Player X position incorrect. Expected: ${expectedPlayerX}, Got: ${actualPlayerX}`
      };
    }
    
    // Validate enemy has AI behavior (position should change due to chase AI)
    if (frame > 0) {
      // Enemy should be moving (velocity should be non-zero due to AI)
      const enemyVx = Velocity.x[enemyEid];
      const enemyVy = Velocity.y[enemyEid];
      
      if (enemyVx === 0 && enemyVy === 0) {
        return {
          success: false,
          error: 'Enemy should have non-zero velocity due to AI chase behavior'
        };
      }
    }
    
    // Validate sprites are synchronized
    const playerSprite = world.spriteMap.get(playerEid);
    const enemySprite = world.spriteMap.get(enemyEid);
    
    if (!playerSprite || !enemySprite) {
      return {
        success: false,
        error: 'Sprite mappings missing'
      };
    }
    
    if (Math.abs(playerSprite.x - Position.x[playerEid]) > 0.01) {
      return {
        success: false,
        error: 'Player sprite position not synchronized with ECS position'
      };
    }
    
    return { success: true };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Test system queries to ensure they return correct results.
 */
function testSystemQueries(world) {
  try {
    // Test player query
    const players = playerQuery(world);
    if (players.length !== 1) {
      return {
        success: false,
        error: `Expected 1 player entity, found ${players.length}`
      };
    }
    
    // Test enemy query
    const enemies = enemyQuery(world);
    if (enemies.length !== 1) {
      return {
        success: false,
        error: `Expected 1 enemy entity, found ${enemies.length}`
      };
    }
    
    // Test movement query
    const movingEntities = movementQuery(world);
    if (movingEntities.length !== 2) {
      return {
        success: false,
        error: `Expected 2 moving entities, found ${movingEntities.length}`
      };
    }
    
    // Test render query
    const renderableEntities = renderQuery(world);
    if (renderableEntities.length !== 2) {
      return {
        success: false,
        error: `Expected 2 renderable entities, found ${renderableEntities.length}`
      };
    }
    
    return { success: true };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Run performance test of the system pipeline.
 */
export const runPerformanceTest = () => {
  logger.info('Starting system performance test');
  
  const world = initializeWorld();
  
  // Create multiple entities for performance testing
  const entityCount = 100;
  for (let i = 0; i < entityCount; i++) {
    const eid = addEntity(world);
    addComponent(world, Position, eid);
    addComponent(world, Velocity, eid);
    addComponent(world, Render, eid);
    
    Position.x[eid] = Math.random() * 800;
    Position.y[eid] = Math.random() * 600;
    setVelocity(eid, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2);
    setVisibility(eid, true);
    
    // Add mock sprite
    addSpriteMapping(world, eid, createMockSprite(`entity${i}`));
  }
  
  // Run performance test
  const testFrames = 60; // Test for 1 second at 60 FPS
  const startTime = performance.now();
  
  for (let frame = 0; frame < testFrames; frame++) {
    updateWorldTime(world, 16);
    debugSystemPipeline(world); // Use debug pipeline for timing info
  }
  
  const endTime = performance.now();
  const totalTime = endTime - startTime;
  const avgFrameTime = totalTime / testFrames;
  const avgFPS = 1000 / avgFrameTime;
  
  logger.info('Performance test completed', {
    entityCount,
    testFrames,
    totalTime: `${totalTime.toFixed(2)}ms`,
    avgFrameTime: `${avgFrameTime.toFixed(2)}ms`,
    avgFPS: `${avgFPS.toFixed(1)}`,
    performanceGrade: avgFPS >= 60 ? 'EXCELLENT' : avgFPS >= 30 ? 'GOOD' : 'NEEDS IMPROVEMENT'
  });
  
  return { avgFPS, avgFrameTime, entityCount };
};

/**
 * Run all system tests.
 */
export const runAllSystemTests = () => {
  logger.info('Running comprehensive ECS system tests');
  
  const systemInfo = getSystemInfo();
  logger.info('System information', systemInfo);
  
  const results = {
    basicTest: false,
    performanceTest: null
  };
  
  // Run basic functionality test
  results.basicTest = runBasicSystemTest();
  
  // Run performance test if basic test passed
  if (results.basicTest) {
    results.performanceTest = runPerformanceTest();
  }
  
  const success = results.basicTest && results.performanceTest !== null;
  logger.info('System tests completed', { success, results });
  
  return { success, results };
};

// Export test runner for external use
export default runAllSystemTests;