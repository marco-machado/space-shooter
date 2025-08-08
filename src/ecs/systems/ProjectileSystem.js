import { defineQuery, hasComponent } from 'bitecs';
import Logger from '@/utils/Logger.js';
import { Position, Render, Projectile, ProjectileData, Enemy } from '@/ecs/components/index.js';
import { createProjectile, deactivateProjectile } from '@/ecs/entities/createProjectile.js';

const logger = Logger.scope('ECS:ProjectileSystem');

// Query for all projectiles
const projectileQuery = defineQuery([Projectile, Position, ProjectileData, Render]);

/**
 * Process weapon events to create projectiles and update projectile lifetimes.
 */
export const projectileSystem = (world) => {
  const { time: { delta }, scene } = world;

  // Consume weapon events to spawn projectiles
  if (world.weaponEvents && world.weaponEvents.length > 0) {
    const events = world.weaponEvents.slice();
    world.weaponEvents.length = 0; // clear queue

    for (let i = 0; i < events.length; i++) {
      const evt = events[i];
      // Determine owner by component presence if possible (default enemy)
      let owner = 'enemy';
      if (evt.shooterEid !== undefined && hasComponent(world, Enemy, evt.shooterEid)) {
        owner = 'enemy';
      }

      createProjectile(world, evt.x, evt.y, {
        owner,
        speed: evt.projectileSpeed || 450,
        damage: evt.damage || 20,
        // Allow events to specify direction; fallback based on owner
        direction: evt.direction || (owner === 'enemy' ? { x: 0, y: 1 } : { x: 0, y: -1 })
      });
    }
  }

  // Update projectile lifetimes and cull off-screen
  const eids = projectileQuery(world);
  for (let i = 0; i < eids.length; i++) {
    const eid = eids[i];

    // Lifetime
    ProjectileData.life[eid] += delta;
    if (ProjectileData.life[eid] >= ProjectileData.maxLife[eid]) {
      deactivateProjectile(world, eid);
      continue;
    }

    // Off-screen culling based on sprite position if available
    const sprite = world.spriteMap.get(eid);
    if (sprite && scene) {
      const offY = sprite.y < -50 || sprite.y > scene.scale.height + 50;
      const offX = sprite.x < -50 || sprite.x > scene.scale.width + 50;
      if (offX || offY) {
        deactivateProjectile(world, eid);
      }
    }
  }

  if (eids.length) {
    logger.debug('Projectile system updated', { count: eids.length });
  }

  return world;
};

export default projectileSystem;
