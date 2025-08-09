import { pipe } from 'bitecs';
import movementSystem from './MovementSystem.js';
import aiSystem from './AISystem.js';
import weaponSystem from './WeaponSystem.js';
import projectileSystem from './ProjectileSystem.js';
import renderSystem from './RenderSystem.js';
import timeSystem from './TimeSystem.js';
import playerInputSystem from './PlayerInputSystem.js';
import Logger from '@/utils/Logger.js';

const logger = Logger.scope('ECS:Pipeline');

/**
 * Main ECS system pipeline that executes all game systems in the correct order.
 * Systems are executed sequentially, with each system receiving the world
 * and returning it for the next system in the pipeline.
 * 
 * Execution order:
 * 1. Player Input System - Handles player input and movement
 * 2. Movement System - Updates positions based on velocity
 * 3. AI System - Handles enemy AI behavior and movement decisions
 * 4. Weapon System - Processes weapon firing and cooldowns
 * 5. Projectile System - Handles projectile logic
 * 6. Render System - Synchronizes sprites with entity positions
 * 7. Time System - Manages time state and cleanup
 */
export const systemPipeline = pipe(
  playerInputSystem,
  movementSystem,
  aiSystem,
  weaponSystem,
  projectileSystem,
  renderSystem,
  timeSystem
);

/**
 * Execute the main system pipeline on the world.
 * This is the primary function called from the game loop.
 * 
 * @param {Object} world - The bitECS world instance
 * @returns {Object} The world instance after all systems have run
 */
export const runSystemPipeline = (world) => {
  try {
    return systemPipeline(world);
  } catch (error) {
    logger.error('Error in system pipeline execution', { 
      error: error.message,
      stack: error.stack 
    });
    
    // Return world to prevent complete failure
    return world;
  }
};

/**
 * Alternative pipeline for debugging - runs systems individually with timing.
 * Useful for performance profiling and identifying bottlenecks.
 * 
 * @param {Object} world - The bitECS world instance
 * @returns {Object} The world instance with timing information
 */
export const debugSystemPipeline = (world) => {
  const systemTimes = {};
  
  try {
    // Player Input System
    const playerInputStart = performance.now();
    playerInputSystem(world);
    systemTimes.playerInput = performance.now() - playerInputStart;
    
    // Movement System
    const movementStart = performance.now();
    movementSystem(world);
    systemTimes.movement = performance.now() - movementStart;
    
    // AI System
    const aiStart = performance.now();
    aiSystem(world);
    systemTimes.ai = performance.now() - aiStart;
    
    // Weapon System
    const weaponStart = performance.now();
    weaponSystem(world);
    systemTimes.weapon = performance.now() - weaponStart;
    
    // Projectile System
    const projStart = performance.now();
    projectileSystem(world);
    systemTimes.projectile = performance.now() - projStart;
    
    // Render System
    const renderStart = performance.now();
    renderSystem(world);
    systemTimes.render = performance.now() - renderStart;
    
    // Time System
    const timeStart = performance.now();
    timeSystem(world);
    systemTimes.time = performance.now() - timeStart;
    
    // Calculate total time
    const totalTime = Object.values(systemTimes).reduce((sum, time) => sum + time, 0);
    
    // Log performance data (only occasionally to avoid spam)
    if (world.time.elapsed % 1000 < world.time.delta) { // Roughly once per second
      logger.debug('System pipeline performance', {
        total: `${totalTime.toFixed(2)}ms`,
        systems: Object.entries(systemTimes)
          .map(([name, time]) => `${name}: ${time.toFixed(2)}ms`)
          .join(', ')
      });
      
      // Warn about slow systems
      Object.entries(systemTimes).forEach(([name, time]) => {
        if (time > 5) {
          logger.warn(`Slow system detected: ${name}`, { duration: `${time.toFixed(2)}ms` });
        }
      });
    }
    
    // Store timing data on world for external monitoring
    world.systemPerformance = {
      ...systemTimes,
      total: totalTime,
      timestamp: world.time.elapsed
    };
    
  } catch (error) {
    logger.error('Error in debug system pipeline execution', {
      error: error.message,
      stack: error.stack
    });
  }
  
  return world;
};

/**
 * Minimal pipeline for testing - only essential systems.
 * Useful during development and unit testing.
 * 
 * @param {Object} world - The bitECS world instance
 * @returns {Object} The world instance
 */
export const testPipeline = pipe(
  movementSystem,
  projectileSystem,
  renderSystem,
  timeSystem
);

/**
 * Create a custom pipeline with specific systems.
 * Allows for flexible system composition during development.
 * 
 * @param {...Function} systems - System functions to include in pipeline
 * @returns {Function} Custom pipeline function
 */
export const createCustomPipeline = (...systems) => {
  logger.debug('Created custom pipeline', { 
    systemCount: systems.length,
    systems: systems.map(s => s.name).join(', ')
  });
  
  return pipe(...systems);
};

/**
 * Get pipeline statistics and system information.
 * 
 * @returns {Object} Pipeline configuration information
 */
export const getPipelineInfo = () => ({
  mainPipeline: {
    systems: ['movement', 'ai', 'weapon', 'projectile', 'render', 'time'],
    systemCount: 6
  },
  debugPipeline: {
    systems: ['movement', 'ai', 'weapon', 'projectile', 'render', 'time'],
    systemCount: 6,
    includesTiming: true
  },
  testPipeline: {
    systems: ['movement', 'projectile', 'render', 'time'],
    systemCount: 4
  }
});

/**
 * System execution modes for different contexts.
 */
export const PIPELINE_MODES = {
  PRODUCTION: 'production',
  DEBUG: 'debug',
  TEST: 'test'
};

/**
 * Get the appropriate pipeline for the given mode.
 * 
 * @param {string} mode - Pipeline mode (production, debug, test)
 * @returns {Function} Pipeline function
 */
export const getPipelineForMode = (mode) => {
  switch (mode) {
    case PIPELINE_MODES.PRODUCTION:
      return runSystemPipeline;
    case PIPELINE_MODES.DEBUG:
      return debugSystemPipeline;
    case PIPELINE_MODES.TEST:
      return testPipeline;
    default:
      logger.warn('Unknown pipeline mode, using production', { mode });
      return runSystemPipeline;
  }
};

logger.debug('System pipeline initialized', {
  mainSystems: 5,
  modesAvailable: Object.keys(PIPELINE_MODES).length
});

export default systemPipeline;
