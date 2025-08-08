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

const logger = Logger.scope('ECS:ProjectilePool');

// Internal pool of inactive projectile entity IDs
const pool = [];

// Create a new projectile entity and add to world
const createEntity = (world) => {
  const eid = addEntity(world);
  addComponent(world, Position, eid);
  addComponent(world, Velocity, eid);
  addComponent(world, Physics, eid);
  addComponent(world, Render, eid);
  addComponent(world, Projectile, eid);
  addComponent(world, ProjectileData, eid);

  // Create sprite off-screen
  const scene = world.scene;
  const sprite = DevShapes.createProjectile(scene, -1000, -1000, 'player', 'small');
  sprite.entityId = eid;
  sprite.entityType = 'projectile';
  sprite.setVisible(false);
  addSpriteMapping(world, eid, sprite);

  return eid;
};

/**
 * Activate a projectile from the pool or create a new one.
 */
export const activateProjectile = (world, x, y, opts = {}) => {
  const owner = opts.owner === 'enemy' ? 1 : 0;
  const speed = opts.speed ?? 450;
  const damage = opts.damage ?? 20;
  const dir = opts.direction || { x: 0, y: owner === 1 ? 1 : -1 };
  const eid = pool.length ? pool.pop() : createEntity(world);

  // Reset state
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

  // Update sprite
  const sprite = world.spriteMap.get(eid);
  if (sprite) {
    sprite.setPosition(x, y);
    sprite.setVisible(true);
    sprite.owner = owner === 1 ? 'enemy' : 'player';
    sprite.damage = damage;
    sprite.setDepth(Render.layer[eid]);
    if (world.scene) {
      if (owner === 1 && world.scene.enemyProjectileGroup) {
        world.scene.enemyProjectileGroup.add(sprite);
      } else if (owner === 0 && world.scene.playerProjectileGroup) {
        world.scene.playerProjectileGroup.add(sprite);
      }
    }
  }

  logger.debug('Projectile activated', { eid, owner: sprite?.owner, damage, speed });
  return eid;
};

/**
 * Deactivate a projectile and return it to the pool.
 */
export const deactivateProjectile = (world, eid) => {
  Position.x[eid] = -1000;
  Position.y[eid] = -1000;
  Velocity.x[eid] = 0;
  Velocity.y[eid] = 0;
  if (hasComponent(world, Render, eid)) Render.visible[eid] = 0;
  ProjectileData.life[eid] = 0;

  const sprite = world.spriteMap.get(eid);
  if (sprite) {
    sprite.setVisible(false);
    sprite.setPosition(-1000, -1000);
  }

  pool.push(eid);
};

export default {
  activateProjectile,
  deactivateProjectile
};
