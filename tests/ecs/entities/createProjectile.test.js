import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initializeWorld } from '@/ecs/world.js';
import {
  createProjectile,
  deactivateProjectile,
  initializeProjectilePool
} from '@/ecs/entities/createProjectile.js';

vi.mock('@/graphics/DevShapes.js', () => ({
  default: {
    createProjectile: vi.fn(() => ({
      setVisible: vi.fn(),
      setPosition: vi.fn(),
      setDepth: vi.fn()
    }))
  }
}));

describe('ECS projectile pooling', () => {
  let world;
  beforeEach(() => {
    world = initializeWorld();
    world.scene = {
      enemyProjectileGroup: { add: vi.fn() },
      playerProjectileGroup: { add: vi.fn() },
      scale: { width: 800, height: 600 }
    };
  });

  it('reuses projectiles from the pool', () => {
    const eid1 = createProjectile(world, 0, 0, { owner: 'player' });
    deactivateProjectile(world, eid1);
    const eid2 = createProjectile(world, 10, 10, { owner: 'player' });
    expect(eid2).toBe(eid1);
  });

  it('initializes projectile pools', () => {
    initializeProjectilePool(world, { player: 2, enemy: 1 });
    expect(world.projectilePools.player.length).toBe(2);
    expect(world.projectilePools.enemy.length).toBe(1);
  });
});

