import { describe, it, expect } from 'vitest';
import ConfigManager from '@/config/ConfigManager.js';

describe('ConfigManager', () => {
  it('provides default player fire cooldown', () => {
    const config = ConfigManager.getConfig();
    expect(config.playerFireCooldown).toBe(200);
  });
});
