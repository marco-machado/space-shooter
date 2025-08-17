/**
 * Simplified PlayerHealthSystem Validation Test
 * Focus on core functionality validation
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import PlayerHealthSystem from '@/systems/PlayerHealthSystem.js';
import { getEventBus } from '@/event-bus/EventBus.js';
import { EventTypes } from '@/event-bus/EventTypes.js';

// Mock health component
class MockHealthComponent {
  constructor(maxHealth = 3, currentHealth = 3) {
    this.maxHealth = maxHealth;
    this.currentHealth = currentHealth;
  }

  getCurrentHealth() {
    return this.currentHealth;
  }

  getMaxHealth() {
    return this.maxHealth;
  }

  setCurrentHealth(value) {
    this.currentHealth = Math.max(0, Math.min(value, this.maxHealth));
  }
}

// Mock player entity
function createMockPlayer(maxHealth = 3, currentHealth = 3) {
  return {
    health: new MockHealthComponent(maxHealth, currentHealth),
    id: 'test-player',
  };
}

describe('PlayerHealthSystem - Core Invincibility Event Validation', () => {
  let eventBus;
  let player;
  let healthSystem;
  let capturedEvents;

  beforeEach(() => {
    eventBus = getEventBus();
    eventBus.clear();
    
    player = createMockPlayer(3, 3);
    healthSystem = new PlayerHealthSystem(player);
    
    capturedEvents = [];

    // Setup event capture
    eventBus.on(EventTypes.INVINCIBILITY_STARTED, (data) => {
      capturedEvents.push({ type: 'INVINCIBILITY_STARTED', data });
    });

    eventBus.on(EventTypes.INVINCIBILITY_ENDED, (data) => {
      capturedEvents.push({ type: 'INVINCIBILITY_ENDED', data });
    });

    eventBus.on(EventTypes.HEALTH_DECREASED, (data) => {
      capturedEvents.push({ type: 'HEALTH_DECREASED', data });
    });

    eventBus.on(EventTypes.HEALTH_INCREASED, (data) => {
      capturedEvents.push({ type: 'HEALTH_INCREASED', data });
    });
  });

  afterEach(() => {
    if (healthSystem) {
      healthSystem.destroy();
    }
    eventBus.clear();
    capturedEvents = [];
  });

  describe('Core Event Emission', () => {
    it('should emit INVINCIBILITY_STARTED when player takes damage', () => {
      // Apply damage
      eventBus.emit(EventTypes.PLAYER_DAMAGED, { damage: 1, source: 'test-enemy' });

      // Find the invincibility started event
      const invincibilityEvent = capturedEvents.find(e => e.type === 'INVINCIBILITY_STARTED');
      
      expect(invincibilityEvent).toBeDefined();
      expect(invincibilityEvent.data).toHaveProperty('duration');
      expect(invincibilityEvent.data).toHaveProperty('player');
      expect(invincibilityEvent.data.duration).toBe(1000);
      expect(invincibilityEvent.data.player).toBe(player);
    });

    it('should emit INVINCIBILITY_ENDED after timer expires', async () => {
      // Apply damage to start invincibility
      eventBus.emit(EventTypes.PLAYER_DAMAGED, { damage: 1, source: 'test-enemy' });

      // Wait for invincibility to end
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Find the invincibility ended event
      const endedEvent = capturedEvents.find(e => e.type === 'INVINCIBILITY_ENDED');
      
      expect(endedEvent).toBeDefined();
      expect(endedEvent.data).toHaveProperty('player');
      expect(endedEvent.data.player).toBe(player);
    });

    it('should have correct event sequence: damage → health decreased → invincibility started', () => {
      eventBus.emit(EventTypes.PLAYER_DAMAGED, { damage: 1, source: 'test' });

      const eventTypes = capturedEvents.map(e => e.type);
      
      expect(eventTypes).toContain('HEALTH_DECREASED');
      expect(eventTypes).toContain('INVINCIBILITY_STARTED');
      
      const healthIndex = eventTypes.indexOf('HEALTH_DECREASED');
      const invincibilityIndex = eventTypes.indexOf('INVINCIBILITY_STARTED');
      
      expect(invincibilityIndex).toBeGreaterThan(healthIndex);
    });
  });

  describe('Invincibility Logic', () => {
    it('should prevent damage during invincibility period', () => {
      // Apply initial damage
      eventBus.emit(EventTypes.PLAYER_DAMAGED, { damage: 1, source: 'enemy1' });
      expect(player.health.getCurrentHealth()).toBe(2);
      expect(healthSystem.isInvincible()).toBe(true);

      // Clear captured events
      capturedEvents.length = 0;

      // Try to apply damage during invincibility
      eventBus.emit(EventTypes.PLAYER_DAMAGED, { damage: 1, source: 'enemy2' });

      // Health should not decrease further
      expect(player.health.getCurrentHealth()).toBe(2);
      
      // No new health decrease event should be captured
      const healthEvents = capturedEvents.filter(e => e.type === 'HEALTH_DECREASED');
      expect(healthEvents).toHaveLength(0);

      // Still invincible
      expect(healthSystem.isInvincible()).toBe(true);
    });

    it('should track invincibility state correctly', () => {
      // Initially not invincible
      expect(healthSystem.isInvincible()).toBe(false);

      // Apply damage
      eventBus.emit(EventTypes.PLAYER_DAMAGED, { damage: 1, source: 'test' });
      
      // Should be invincible after damage
      expect(healthSystem.isInvincible()).toBe(true);
    });

    it('should emit events with correct data structures', () => {
      eventBus.emit(EventTypes.PLAYER_DAMAGED, { damage: 1, source: 'projectile' });

      const startedEvent = capturedEvents.find(e => e.type === 'INVINCIBILITY_STARTED');
      
      // Validate data structure
      expect(startedEvent.data).toEqual({
        duration: 1000,
        player: player,
      });
    });
  });

  describe('Performance and Timing', () => {
    it('should emit events within acceptable time', () => {
      const start = performance.now();
      eventBus.emit(EventTypes.PLAYER_DAMAGED, { damage: 1, source: 'test' });
      const end = performance.now();

      const duration = end - start;
      expect(duration).toBeLessThan(10); // Should complete in less than 10ms
    });

    it('should handle rapid damage attempts efficiently', () => {
      const start = performance.now();

      // Apply rapid damage attempts (most should be blocked)
      for (let i = 0; i < 20; i++) {
        eventBus.emit(EventTypes.PLAYER_DAMAGED, { damage: 1, source: `rapid-${i}` });
      }

      const end = performance.now();
      const duration = end - start;

      expect(duration).toBeLessThan(50); // Should handle 20 attempts in less than 50ms
      
      // Only first damage should succeed
      expect(player.health.getCurrentHealth()).toBe(2);
      expect(healthSystem.isInvincible()).toBe(true);

      // Only one set of events should be emitted
      const healthEvents = capturedEvents.filter(e => e.type === 'HEALTH_DECREASED');
      const invincibilityEvents = capturedEvents.filter(e => e.type === 'INVINCIBILITY_STARTED');
      expect(healthEvents).toHaveLength(1);
      expect(invincibilityEvents).toHaveLength(1);
    });
  });

  describe('Integration with Health System', () => {
    it('should maintain existing health system functionality', () => {
      const initialHealth = player.health.getCurrentHealth();
      
      // Apply damage
      eventBus.emit(EventTypes.PLAYER_DAMAGED, { damage: 1, source: 'enemy' });
      
      // Health should decrease
      expect(player.health.getCurrentHealth()).toBe(initialHealth - 1);

      // Health decreased event should be emitted
      const healthEvent = capturedEvents.find(e => e.type === 'HEALTH_DECREASED');
      expect(healthEvent).toBeDefined();
      expect(healthEvent.data.currentHealth).toBe(initialHealth - 1);
      expect(healthEvent.data.damageAmount).toBe(1);
      expect(healthEvent.data.damageSource).toBe('enemy');
    });

    it('should work with heal functionality', () => {
      // Damage player first
      eventBus.emit(EventTypes.PLAYER_DAMAGED, { damage: 2, source: 'enemy' });
      expect(player.health.getCurrentHealth()).toBe(1);

      // Clear events
      capturedEvents.length = 0;

      // Heal player
      healthSystem.heal(1, 'powerup');
      expect(player.health.getCurrentHealth()).toBe(2);

      // Should emit health increased event
      const healEvent = capturedEvents.find(e => e.type === 'HEALTH_INCREASED');
      expect(healEvent).toBeDefined();
      expect(healEvent.data.healAmount).toBe(1);
      expect(healEvent.data.healSource).toBe('powerup');
    });
  });

  describe('Error Handling', () => {
    it('should handle cleanup correctly', () => {
      // Start invincibility
      eventBus.emit(EventTypes.PLAYER_DAMAGED, { damage: 1, source: 'test' });
      expect(healthSystem.isInvincible()).toBe(true);

      // Destroy system should not throw
      expect(() => {
        healthSystem.destroy();
      }).not.toThrow();
    });

    it('should handle invalid damage data gracefully', () => {
      // Test with missing damage (should use default)
      eventBus.emit(EventTypes.PLAYER_DAMAGED, { source: 'test' });
      expect(player.health.getCurrentHealth()).toBe(2); // Default damage of 1

      // Test with zero damage
      expect(() => {
        eventBus.emit(EventTypes.PLAYER_DAMAGED, { damage: 0, source: 'test' });
      }).not.toThrow();
    });
  });
});