import { defineQuery, enterQuery, exitQuery, Not } from 'bitecs';
import {
  Position,
  Velocity,
  Health,
  Weapon,
  Render,
  Physics,
  AI,
  Input,
  Player,
  Enemy,
  Projectile,
  PowerUp
} from '@/ecs/components/index.js';
import Logger from '@/utils/Logger.js';

const logger = Logger.scope('ECS:Queries');

// Core movement and rendering queries
export const movementQuery = defineQuery([Position, Velocity]);
export const renderQuery = defineQuery([Position, Render]);

// Entity type queries
export const playerQuery = defineQuery([Player, Position]);
export const enemyQuery = defineQuery([Enemy, Position]);
export const projectileQuery = defineQuery([Projectile, Position]);
export const powerUpQuery = defineQuery([PowerUp, Position]);

// Player input queries
export const playerInputQuery = defineQuery([Player, Position, Velocity, Input]);
export const playerControlQuery = defineQuery([Player, Input]);

// Combat-related queries
export const weaponQuery = defineQuery([Position, Weapon]);
export const healthQuery = defineQuery([Health]);
export const damageableQuery = defineQuery([Health, Position]);

// AI-related queries
export const aiQuery = defineQuery([AI, Position]);
export const enemyAIQuery = defineQuery([Enemy, AI, Position]);

// Physics queries
export const physicsQuery = defineQuery([Physics, Position]);
export const collidableQuery = defineQuery([Physics, Position, Not(Projectile)]);
export const projectilePhysicsQuery = defineQuery([Projectile, Physics, Position]);

// Complex entity queries
export const playerCombatQuery = defineQuery([Player, Position, Weapon]);
export const enemyCombatQuery = defineQuery([Enemy, Position, Weapon]);
export const movingEnemiesQuery = defineQuery([Enemy, Position, Velocity]);
export const renderableEnemiesQuery = defineQuery([Enemy, Position, Render]);

// Lifecycle queries (enter/exit)
export const enteredMovementQuery = enterQuery(movementQuery);
export const exitedMovementQuery = exitQuery(movementQuery);

export const enteredRenderQuery = enterQuery(renderQuery);
export const exitedRenderQuery = exitQuery(renderQuery);

export const enteredPlayerQuery = enterQuery(playerQuery);
export const exitedPlayerQuery = exitQuery(playerQuery);

export const enteredEnemyQuery = enterQuery(enemyQuery);
export const exitedEnemyQuery = exitQuery(enemyQuery);

export const enteredProjectileQuery = enterQuery(projectileQuery);
export const exitedProjectileQuery = exitQuery(projectileQuery);

export const enteredPowerUpQuery = enterQuery(powerUpQuery);
export const exitedPowerUpQuery = exitQuery(powerUpQuery);

export const enteredAIQuery = enterQuery(aiQuery);
export const exitedAIQuery = exitQuery(aiQuery);

export const enteredPlayerInputQuery = enterQuery(playerInputQuery);
export const exitedPlayerInputQuery = exitQuery(playerInputQuery);

// Utility function to get query results with debug logging
export const executeQuery = (query, world, queryName = 'unknown') => {
  const entities = query(world);
  if (entities.length > 0) {
    logger.debug(`Query executed`, { 
      queryName, 
      entityCount: entities.length,
      entities: entities.slice(0, 5) // Log first 5 entities for debugging
    });
  }
  return entities;
};

// Query statistics for debugging and performance monitoring
export const getQueryStats = (world) => {
  return {
    movement: movementQuery(world).length,
    render: renderQuery(world).length,
    players: playerQuery(world).length,
    enemies: enemyQuery(world).length,
    projectiles: projectileQuery(world).length,
    powerUps: powerUpQuery(world).length,
    weapons: weaponQuery(world).length,
    ai: aiQuery(world).length,
    physics: physicsQuery(world).length,
    playerInput: playerInputQuery(world).length,
    playerControl: playerControlQuery(world).length
  };
};

logger.debug('ECS queries initialized');

export default {
  movementQuery,
  renderQuery,
  playerQuery,
  enemyQuery,
  projectileQuery,
  powerUpQuery,
  weaponQuery,
  aiQuery,
  physicsQuery,
  executeQuery,
  getQueryStats
};