import { Position, AI } from '@/ecs/components/index.js';
import { aiQuery, playerQuery, enteredAIQuery, exitedAIQuery } from './queries.js';
import { setVelocity } from './MovementSystem.js';
import Logger from '@/utils/Logger.js';

const logger = Logger.scope('ECS:AISystem');

// AI Pattern Constants
export const AI_PATTERNS = {
  IDLE: 0,
  CHASE_PLAYER: 1,
  PATROL: 2,
  FLEE: 3,
  CIRCLE: 4,
  ZIGZAG: 5
};

/**
 * AI system that controls enemy behavior and movement patterns.
 * Handles different AI patterns, player targeting, and autonomous movement.
 * 
 * @param {Object} world - The bitECS world instance
 * @returns {Object} The world instance for pipeline chaining
 */
export const aiSystem = (world) => {
  const { time: { elapsed } } = world;
  
  // Handle entities that just entered the AI system
  const enteredEntities = enteredAIQuery(world);
  for (let i = 0; i < enteredEntities.length; i++) {
    const eid = enteredEntities[i];
    
    // Initialize AI state if needed
    if (AI.pattern[eid] === 0 && AI.targetEntity[eid] === 0) {
      // Set default AI pattern
      AI.pattern[eid] = AI_PATTERNS.CHASE_PLAYER;
      
      // Find player entity as default target
      const players = playerQuery(world);
      if (players.length > 0) {
        AI.targetEntity[eid] = players[0];
        logger.debug(`Set player target for enemy ${eid}`);
      } else {
        logger.warn(`No player found for enemy targeting ${eid}`);
      }
    }
    
    logger.debug('Entity entered AI system', { 
      eid,
      pattern: AI.pattern[eid],
      targetEntity: AI.targetEntity[eid]
    });
  }
  
  // Process all AI entities
  const aiEntities = aiQuery(world);
  let aiUpdates = 0;
  
  
  for (let i = 0; i < aiEntities.length; i++) {
    const eid = aiEntities[i];
    
    // Get AI configuration
    const pattern = AI.pattern[eid];
    const targetEid = AI.targetEntity[eid];
    
    
    // Execute AI behavior based on pattern
    switch (pattern) {
      case AI_PATTERNS.IDLE:
        handleIdleAI(eid);
        break;
        
      case AI_PATTERNS.CHASE_PLAYER:
        handleChasePlayerAI(eid, targetEid);
        break;
        
      case AI_PATTERNS.PATROL:
        handlePatrolAI(eid, elapsed);
        break;
        
      case AI_PATTERNS.FLEE:
        handleFleeAI(eid, targetEid);
        break;
        
      case AI_PATTERNS.CIRCLE:
        handleCircleAI(eid, targetEid, elapsed);
        break;
        
      case AI_PATTERNS.ZIGZAG:
        handleZigzagAI(eid, elapsed);
        break;
        
      default:
        logger.warn('Unknown AI pattern', { eid, pattern });
        break;
    }
    
    aiUpdates++;
  }
  
  // Handle entities that just exited the AI system
  const exitedEntities = exitedAIQuery(world);
  for (let i = 0; i < exitedEntities.length; i++) {
    const eid = exitedEntities[i];
    logger.debug('Entity exited AI system', { eid });
    
    // Stop movement when AI is removed
    setVelocity(eid, 0, 0);
  }
  
  // Log system execution
  if (aiUpdates > 0) {
    logger.debug('AI system updated', { 
      totalAIEntities: aiEntities.length,
      aiUpdates
    });
  }
  
  return world;
};

/**
 * Handle idle AI behavior - entity stays stationary.
 * 
 * @param {number} eid - Entity ID
 * @param {Object} world - World instance
 * @returns {void}
 */
function handleIdleAI(eid) {
  // TEMP: Move enemies downward for testing
  setVelocity(eid, 0, 0.05); // 0.05 pixels per millisecond = 50 pixels per second downward
}

/**
 * Handle chase player AI behavior - entity moves toward target player.
 * 
 * @param {number} eid - Entity ID
 * @param {number} targetEid - Target entity ID (usually player)
 * @param {Object} world - World instance
 * @returns {void}
 */
function handleChasePlayerAI(eid, targetEid) {
  if (!targetEid || Position.x[targetEid] === undefined) {
    // Target doesn't exist or has no position, stop moving
    setVelocity(eid, 0, 0);
    return;
  }
  
  // Calculate direction to target
  const dx = Position.x[targetEid] - Position.x[eid];
  const dy = Position.y[targetEid] - Position.y[eid];
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance > 0) {
    // Normalize and apply base speed
    const baseSpeed = 0.1; // pixels per millisecond
    const vx = (dx / distance) * baseSpeed;
    const vy = (dy / distance) * baseSpeed;
    
    setVelocity(eid, vx, vy);
  } else {
    setVelocity(eid, 0, 0);
  }
}

/**
 * Handle patrol AI behavior - entity moves in a pattern using stored data.
 * 
 * @param {number} eid - Entity ID
 * @param {Object} world - World instance
 * @param {number} elapsed - Elapsed time
 * @returns {void}
 */
function handlePatrolAI(eid, elapsed) {
  // Use pattern data to store patrol waypoints and current target
  const patrolSpeed = 0.05;
  const downwardSpeed = 0.03; // Enemies move down into screen
  
  // Simple back-and-forth patrol with downward movement
  const patrolPhase = (elapsed * 0.001) % 4; // 4 second cycle
  let vx = 0;
  const vy = downwardSpeed; // Always move downward
  
  if (patrolPhase < 2) {
    vx = patrolSpeed; // Move right
  } else {
    vx = -patrolSpeed; // Move left
  }
  
  setVelocity(eid, vx, vy);
}

/**
 * Handle flee AI behavior - entity moves away from target.
 * 
 * @param {number} eid - Entity ID
 * @param {number} targetEid - Target entity ID to flee from
 * @param {Object} world - World instance
 * @returns {void}
 */
function handleFleeAI(eid, targetEid) {
  if (!targetEid || Position.x[targetEid] === undefined) {
    setVelocity(eid, 0, 0);
    return;
  }
  
  // Calculate direction away from target
  const dx = Position.x[eid] - Position.x[targetEid];
  const dy = Position.y[eid] - Position.y[targetEid];
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance > 0) {
    // Normalize and apply flee speed
    const fleeSpeed = 0.08;
    const vx = (dx / distance) * fleeSpeed;
    const vy = (dy / distance) * fleeSpeed;
    
    setVelocity(eid, vx, vy);
  } else {
    // If on top of target, move in random direction
    const randomAngle = Math.random() * Math.PI * 2;
    const fleeSpeed = 0.08;
    setVelocity(eid, Math.cos(randomAngle) * fleeSpeed, Math.sin(randomAngle) * fleeSpeed);
  }
}

/**
 * Handle circle AI behavior - entity circles around target.
 * 
 * @param {number} eid - Entity ID
 * @param {number} targetEid - Target entity ID to circle
 * @param {Object} world - World instance
 * @param {number} elapsed - Elapsed time
 * @returns {void}
 */
function handleCircleAI(eid, targetEid, elapsed) {
  if (!targetEid || Position.x[targetEid] === undefined) {
    setVelocity(eid, 0, 0);
    return;
  }
  
  // Calculate circular motion around target
  const circleRadius = 100;
  const circleSpeed = 0.002; // radians per millisecond
  
  const angle = elapsed * circleSpeed;
  const targetX = Position.x[targetEid] + Math.cos(angle) * circleRadius;
  const targetY = Position.y[targetEid] + Math.sin(angle) * circleRadius;
  
  // Move toward calculated circle position
  const dx = targetX - Position.x[eid];
  const dy = targetY - Position.y[eid];
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance > 0) {
    const moveSpeed = 0.06;
    const vx = (dx / distance) * moveSpeed;
    const vy = (dy / distance) * moveSpeed;
    
    setVelocity(eid, vx, vy);
  }
}

/**
 * Handle zigzag AI behavior - entity moves in a zigzag pattern.
 * 
 * @param {number} eid - Entity ID
 * @param {Object} world - World instance
 * @param {number} elapsed - Elapsed time
 * @returns {void}
 */
function handleZigzagAI(eid, elapsed) {
  const zigzagSpeed = 0.05;
  const zigzagFreq = 0.003; // Frequency of zigzag
  
  // Basic zigzag: sine wave for Y, constant for X
  const vx = zigzagSpeed;
  const vy = Math.sin(elapsed * zigzagFreq) * zigzagSpeed * 0.5;
  
  setVelocity(eid, vx, vy);
}

/**
 * Set AI pattern for an entity.
 * 
 * @param {number} eid - Entity ID
 * @param {number} pattern - AI pattern constant
 * @param {number} targetEid - Optional target entity ID
 * @returns {void}
 */
export const setAIPattern = (eid, pattern, targetEid = 0) => {
  AI.pattern[eid] = pattern;
  AI.targetEntity[eid] = targetEid;
};

/**
 * Set AI target for an entity.
 * 
 * @param {number} eid - Entity ID
 * @param {number} targetEid - Target entity ID
 * @returns {void}
 */
export const setAITarget = (eid, targetEid) => {
  AI.targetEntity[eid] = targetEid;
};

/**
 * Get AI state for an entity.
 * 
 * @param {number} eid - Entity ID
 * @returns {Object} AI state object
 */
export const getAIState = (eid) => ({
  pattern: AI.pattern[eid],
  targetEntity: AI.targetEntity[eid],
  patternData: Array.from(AI.patternData[eid])
});

logger.debug('AI system initialized');

export default aiSystem;