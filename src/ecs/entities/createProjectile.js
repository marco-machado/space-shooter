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
  Enemy,
  ProjectileData
} from '../components/index.js';

const logger = Logger.scope('ECS:CreateProjectile');

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
  const owner = opts.owner === 'enemy' ? 1 : 0;
  const speed = opts.speed ?? 450;
  const damage = opts.damage ?? 20;
  const dir = opts.direction || { x: 0, y: owner === 1 ? 1 : -1 }; // enemies down, player up
  const size = opts.size || 'small';
  const visualType = owner === 1 ? 'enemy' : 'player';

  const eid = addEntity(world);
  addComponent(world, Position, eid);
  addComponent(world, Velocity, eid);
  addComponent(world, Physics, eid);
  addComponent(world, Render, eid);
  addComponent(world, Projectile, eid);
  addComponent(world, ProjectileData, eid);

  // Set state
  Position.x[eid] = x;
  Position.y[eid] = y;
  const mag = Math.hypot(dir.x, dir.y) || 1;
  Velocity.x[eid] = (dir.x / mag) * (speed / 1000); // pixels/ms
  Velocity.y[eid] = (dir.y / mag) * (speed / 1000);
  Physics.bodyType[eid] = 1;
  Physics.collisionGroup[eid] = owner === 1 ? 3 : 2; // arbitrary grouping
  Render.visible[eid] = 1;
  Render.layer[eid] = 100; // above ships
  ProjectileData.damage[eid] = damage;
  ProjectileData.owner[eid] = owner;
  ProjectileData.life[eid] = 0;
  ProjectileData.maxLife[eid] = opts.maxLife ?? 3000;

  // Create sprite
  const scene = world.scene;
  const sprite = DevShapes.createProjectile(scene, x, y, visualType, size);
  sprite.entityId = eid;
  sprite.entityType = 'projectile';
  sprite.owner = owner === 1 ? 'enemy' : 'player';
  sprite.damage = damage;
  sprite.setDepth(Render.layer[eid]);
  addSpriteMapping(world, eid, sprite);

  // Add to physics groups
  if (scene) {
    if (owner === 1 && scene.enemyProjectileGroup) {
      scene.enemyProjectileGroup.add(sprite);
    } else if (owner === 0 && scene.playerProjectileGroup) {
      scene.playerProjectileGroup.add(sprite);
    }
  }

  logger.debug('ECS projectile created', { eid, owner: sprite.owner, damage, speed });
  return eid;
};

export const deactivateProjectile = (world, eid) => {
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
};

export default {
  createProjectile,
  deactivateProjectile
};

