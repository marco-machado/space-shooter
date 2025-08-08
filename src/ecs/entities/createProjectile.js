/**
 * ECS Projectile Entity Creation System
 * Creates projectile entities using bitECS and maps to Phaser sprites
 */
import { addEntity, addComponent, hasComponent } from 'bitecs';
import Logger from '@/utils/Logger.js';
import DevShapes from '@/graphics/DevShapes.js';
import { addSpriteMapping } from '../world.js';

import {
  Position,
  Velocity,
  Physics,
  Render,
  Projectile,
  ProjectileData
} from '../components/index.js';

const logger = Logger.scope('ECS:CreateProjectile');

/**
 * Ensure projectile pools exist on the world object.
 *
 * @param {Object} world - bitECS world instance
 */
const ensurePools = (world) => {
  if (!world.projectilePools) {
    world.projectilePools = {
      player: [],
      enemy: []
    };
  }
};

/**
 * Internal helper to configure projectile state and sprite.
 */
const configureProjectile = (world, eid, x, y, opts) => {
  const owner = opts.owner === 'enemy' ? 1 : 0;
  const speed = opts.speed ?? 450;
  const damage = opts.damage ?? 20;
  const dir = opts.direction || { x: 0, y: owner === 1 ? 1 : -1 };
  const size = opts.size || 'small';
  const visualType = owner === 1 ? 'enemy' : 'player';

  // Set state
  Position.x[eid] = x;
  Position.y[eid] = y;
  const mag = Math.hypot(dir.x, dir.y) || 1;
  Velocity.x[eid] = (dir.x / mag) * (speed / 1000);
  Velocity.y[eid] = (dir.y / mag) * (speed / 1000);
  Physics.bodyType[eid] = 1;
  Physics.collisionGroup[eid] = owner === 1 ? 3 : 2;
  Render.visible[eid] = 1;
  Render.layer[eid] = 100;
  ProjectileData.damage[eid] = damage;
  ProjectileData.owner[eid] = owner;
  ProjectileData.life[eid] = 0;
  ProjectileData.maxLife[eid] = opts.maxLife ?? 3000;

  // Create or update sprite
  const scene = world.scene;
  let sprite = world.spriteMap.get(eid);
  if (!sprite) {
    sprite = DevShapes.createProjectile(scene, x, y, visualType, size);
    sprite.entityId = eid;
    sprite.entityType = 'projectile';
    addSpriteMapping(world, eid, sprite);
    // Add to physics groups
    if (scene) {
      if (owner === 1 && scene.enemyProjectileGroup) {
        scene.enemyProjectileGroup.add(sprite);
      } else if (owner === 0 && scene.playerProjectileGroup) {
        scene.playerProjectileGroup.add(sprite);
      }
    }
  } else {
    sprite.setPosition(x, y);
  }
  sprite.owner = owner === 1 ? 'enemy' : 'player';
  sprite.damage = damage;
  sprite.setDepth(Render.layer[eid]);
  sprite.setVisible(true);
};

/**
 * Create an ECS projectile entity.
 *
 * @param {Object} world - bitECS world (expects world.scene reference)
 * @param {number} x - Spawn X
 * @param {number} y - Spawn Y
 * @param {Object} opts - Options { owner: 'player'|'enemy', speed, damage, direction: {x,y}, size, type }
 * @returns {number} eid
 */
export const createProjectile = (world, x, y, opts = {}) => {
  ensurePools(world);
  const owner = opts.owner === 'enemy' ? 1 : 0;
  const pool = owner === 1 ? world.projectilePools.enemy : world.projectilePools.player;
  let eid;
  if (pool.length > 0) {
    eid = pool.pop();
    configureProjectile(world, eid, x, y, opts);
  } else {
    eid = addEntity(world);
    addComponent(world, Position, eid);
    addComponent(world, Velocity, eid);
    addComponent(world, Physics, eid);
    addComponent(world, Render, eid);
    addComponent(world, Projectile, eid);
    addComponent(world, ProjectileData, eid);
    configureProjectile(world, eid, x, y, opts);
  }

  logger.debug('ECS projectile created', { eid, owner });
  return eid;
};

export const deactivateProjectile = (world, eid) => {
  ensurePools(world);
  // Move off-screen and hide
  Position.x[eid] = -1000;
  Position.y[eid] = -1000;
  Velocity.x[eid] = 0;
  Velocity.y[eid] = 0;
  if (hasComponent(world, Render, eid)) Render.visible[eid] = 0;

  const sprite = world.spriteMap.get(eid);
  if (sprite) {
    sprite.setVisible(false);
    sprite.setPosition(-1000, -1000);
  }

  const owner = ProjectileData.owner[eid];
  const pool = owner === 1 ? world.projectilePools.enemy : world.projectilePools.player;
  pool.push(eid);
};

/**
 * Preallocate projectile pools for player and enemy projectiles.
 *
 * @param {Object} world - bitECS world instance
 * @param {Object} [counts] - { player: number, enemy: number }
 */
export const initializeProjectilePool = (world, counts = { player: 20, enemy: 20 }) => {
  ensurePools(world);
  const createInactive = (owner, count) => {
    for (let i = 0; i < count; i++) {
      const eid = addEntity(world);
      addComponent(world, Position, eid);
      addComponent(world, Velocity, eid);
      addComponent(world, Physics, eid);
      addComponent(world, Render, eid);
      addComponent(world, Projectile, eid);
      addComponent(world, ProjectileData, eid);
      configureProjectile(world, eid, -1000, -1000, { owner });
      const sprite = world.spriteMap.get(eid);
      if (sprite) sprite.setVisible(false);
      deactivateProjectile(world, eid);
    }
  };
  createInactive('player', counts.player);
  createInactive('enemy', counts.enemy);
  logger.debug('Projectile pools initialized', counts);
};

export default {
  createProjectile,
  deactivateProjectile,
  initializeProjectilePool
};

