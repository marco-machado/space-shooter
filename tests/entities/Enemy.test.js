import { describe, it, expect, beforeEach, vi } from 'vitest';
import Enemy from '../../src/entities/Enemy.js';
import HealthComponent from '../../src/components/HealthComponent.js';

vi.mock('../../src/utils/Logger.js', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Enemy', () => {
  let mockScene;

  beforeEach(() => {
    const body = {
      setImmovable: vi.fn(),
      setSize: vi.fn(),
      setOffset: vi.fn(),
      moves: true,
    };
    const gameObject = {
      x: 0,
      y: 0,
      width: 32,
      height: 32,
      active: true,
      visible: true,
      body,
      destroy: vi.fn(),
      setPosition: vi.fn(),
      setSize: vi.fn(),
      setDepth: vi.fn(),
      setActive: vi.fn(),
      setVisible: vi.fn(),
    };

    mockScene = {
      entities: [],
      physics: {
        world: {},
        add: { existing: vi.fn() },
      },
      sys: { isDestroyed: false },
      add: {
        rectangle: vi.fn(() => ({ ...gameObject, body })),
      },
    };
  });

  it('update keeps a scout alive when movement is data only', () => {
    const enemy = new Enemy(mockScene, 10, 20, 'scout');

    enemy.update(16);

    expect(enemy.getComponent(HealthComponent).currentHealth).toBe(50);
  });
});
