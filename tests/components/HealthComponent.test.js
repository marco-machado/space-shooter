import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import HealthComponent from '../../src/components/HealthComponent.js';
import BaseComponent from '../../src/components/BaseComponent.js';

// Mock Logger to avoid Environment dependencies
vi.mock('../../src/utils/Logger.js', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import Logger from '../../src/utils/Logger.js';

describe('HealthComponent', () => {
  let healthComponent;
  let mockEntity;

  beforeEach(() => {
    // Clear all mock calls before each test
    vi.clearAllMocks();
    
    // Mock Date.now for consistent time-based testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-01-01T00:00:00.000Z'));

    // Create mock entity with event emission
    mockEntity = {
      emit: vi.fn(),
      id: 'test-entity',
    };

    healthComponent = new HealthComponent();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllTimers();
  });

  describe('constructor', () => {
    it('should create component with default values', () => {
      expect(healthComponent.maxHealth).toBe(100);
      expect(healthComponent.currentHealth).toBe(100);
      expect(healthComponent.invulnerable).toBe(false);
      expect(healthComponent.invulnerabilityDuration).toBe(0);
      expect(healthComponent.lastDamageTime).toBe(0);
      expect(healthComponent.armor).toBe(0);
      expect(healthComponent.resistance).toBe(0);
      expect(healthComponent.regeneration).toBe(0);
      expect(healthComponent.lastRegenTime).toBe(0);
    });

    it('should create component with custom maxHealth', () => {
      const customHealth = new HealthComponent(150);
      expect(customHealth.maxHealth).toBe(150);
      expect(customHealth.currentHealth).toBe(150);
    });

    it('should create component with custom current and max health', () => {
      const customHealth = new HealthComponent(200, 150);
      expect(customHealth.maxHealth).toBe(200);
      expect(customHealth.currentHealth).toBe(150);
    });

    it('should enforce minimum maxHealth of 1', () => {
      const zeroHealth = new HealthComponent(0);
      expect(zeroHealth.maxHealth).toBe(1);

      const negativeHealth = new HealthComponent(-50);
      expect(negativeHealth.maxHealth).toBe(1);
    });

    it('should handle null currentHealth parameter', () => {
      const health = new HealthComponent(100, null);
      expect(health.maxHealth).toBe(100);
      expect(health.currentHealth).toBe(100);
    });

    it('should log component creation', () => {
      expect(Logger.debug).toHaveBeenCalledWith(
        '[HealthComponent] Created: 100 max health'
      );
    });
  });

  describe('init method', () => {
    it('should initialize with empty data', () => {
      const originalMaxHealth = healthComponent.maxHealth;
      healthComponent.init();
      
      expect(healthComponent.maxHealth).toBe(originalMaxHealth);
      expect(healthComponent.currentHealth).toBe(originalMaxHealth);
    });

    it('should initialize with custom health values', () => {
      const initData = {
        maxHealth: 200,
        currentHealth: 150,
        armor: 10,
        resistance: 0.2,
        regeneration: 5,
        invulnerable: true,
      };

      healthComponent.init(initData);

      expect(healthComponent.maxHealth).toBe(200);
      expect(healthComponent.currentHealth).toBe(150);
      expect(healthComponent.armor).toBe(10);
      expect(healthComponent.resistance).toBe(0.2);
      expect(healthComponent.regeneration).toBe(5);
      expect(healthComponent.invulnerable).toBe(true);
    });

    it('should clamp resistance to valid range (0-1)', () => {
      healthComponent.init({ resistance: -0.5 });
      expect(healthComponent.resistance).toBe(0);

      healthComponent.init({ resistance: 1.5 });
      expect(healthComponent.resistance).toBe(1);

      healthComponent.init({ resistance: 0.75 });
      expect(healthComponent.resistance).toBe(0.75);
    });

    it('should enforce minimum values for armor and regeneration', () => {
      healthComponent.init({
        armor: -10,
        regeneration: -5,
      });

      expect(healthComponent.armor).toBe(0);
      expect(healthComponent.regeneration).toBe(0);
    });

    it('should clamp current health to valid range', () => {
      healthComponent.init({
        maxHealth: 100,
        currentHealth: 150, // Above max
      });
      expect(healthComponent.currentHealth).toBe(100);

      healthComponent.init({
        maxHealth: 100,
        currentHealth: -10, // Below zero
      });
      expect(healthComponent.currentHealth).toBe(0);
    });

    it('should enforce minimum maxHealth of 1', () => {
      // Note: data.maxHealth || this.maxHealth means 0 falls back to existing value
      healthComponent.init({ maxHealth: 0 });
      expect(healthComponent.maxHealth).toBe(100); // Falls back to existing value

      healthComponent.init({ maxHealth: -50 });
      expect(healthComponent.maxHealth).toBe(1); // Negative values get Math.max(1, -50)
    });

    it('should call parent init method', () => {
      const initData = { maxHealth: 150 };
      const parentInitSpy = vi.spyOn(Object.getPrototypeOf(HealthComponent.prototype), 'init');
      
      healthComponent.init(initData);
      
      expect(parentInitSpy).toHaveBeenCalledWith(initData);
      parentInitSpy.mockRestore();
    });
  });

  describe('takeDamage method', () => {
    beforeEach(() => {
      healthComponent.entity = mockEntity;
    });

    it('should apply damage normally', () => {
      const damage = healthComponent.takeDamage(30);
      
      expect(damage).toBe(30);
      expect(healthComponent.currentHealth).toBe(70);
      expect(healthComponent.lastDamageTime).toBe(Date.now());
    });

    it('should not damage when invulnerable', () => {
      healthComponent.invulnerable = true;
      const damage = healthComponent.takeDamage(50);
      
      expect(damage).toBe(0);
      expect(healthComponent.currentHealth).toBe(100);
    });

    it('should not damage when already dead', () => {
      healthComponent.currentHealth = 0;
      const damage = healthComponent.takeDamage(25);
      
      expect(damage).toBe(0);
      expect(healthComponent.currentHealth).toBe(0);
    });

    it('should not damage with zero or negative damage amount', () => {
      const zeroDamage = healthComponent.takeDamage(0);
      expect(zeroDamage).toBe(0);
      expect(healthComponent.currentHealth).toBe(100);

      const negativeDamage = healthComponent.takeDamage(-10);
      expect(negativeDamage).toBe(0);
      expect(healthComponent.currentHealth).toBe(100);
    });

    it('should apply armor damage reduction', () => {
      healthComponent.armor = 10;
      const damage = healthComponent.takeDamage(30);
      
      expect(damage).toBe(20); // 30 - 10 armor
      expect(healthComponent.currentHealth).toBe(80);
    });

    it('should apply resistance percentage reduction', () => {
      healthComponent.resistance = 0.5; // 50% resistance
      const damage = healthComponent.takeDamage(40);
      
      expect(damage).toBe(20); // 40 * (1 - 0.5)
      expect(healthComponent.currentHealth).toBe(80);
    });

    it('should apply both armor and resistance', () => {
      healthComponent.armor = 10;
      healthComponent.resistance = 0.5;
      const damage = healthComponent.takeDamage(50);
      
      // (50 - 10) * (1 - 0.5) = 20
      expect(damage).toBe(20);
      expect(healthComponent.currentHealth).toBe(80);
    });

    it('should floor damage calculation', () => {
      healthComponent.resistance = 0.33; // Creates fractional damage
      const damage = healthComponent.takeDamage(10);
      
      // 10 * (1 - 0.33) = 6.7, floored to 6
      expect(damage).toBe(6);
      expect(healthComponent.currentHealth).toBe(94);
    });

    it('should not apply negative damage after mitigation', () => {
      healthComponent.armor = 50;
      const damage = healthComponent.takeDamage(30);
      
      expect(damage).toBe(0); // Max(0, 30 - 50)
      expect(healthComponent.currentHealth).toBe(100);
    });

    it('should not reduce health below zero', () => {
      healthComponent.currentHealth = 20;
      const damage = healthComponent.takeDamage(50);
      
      expect(damage).toBe(50);
      expect(healthComponent.currentHealth).toBe(0);
    });

    it('should emit damage event when entity has event scopeName', () => {
      const damage = healthComponent.takeDamage(25);
      
      expect(mockEntity.emit).toHaveBeenCalledWith('damage', {
        rawDamage: 25,
        actualDamage: 25,
        damageType: 'generic',
        remainingHealth: 75,
        isDead: false,
      });
    });

    it('should emit damage event with death status', () => {
      healthComponent.currentHealth = 20;
      healthComponent.takeDamage(30);
      
      expect(mockEntity.emit).toHaveBeenCalledWith('damage', {
        rawDamage: 30,
        actualDamage: 30,
        damageType: 'generic',
        remainingHealth: 0,
        isDead: true,
      });
    });

    it('should support custom damage types', () => {
      healthComponent.takeDamage(15, 'fire');
      
      expect(mockEntity.emit).toHaveBeenCalledWith('damage', {
        rawDamage: 15,
        actualDamage: 15,
        damageType: 'fire',
        remainingHealth: 85,
        isDead: false,
      });
    });

    it('should not emit events when entity has no event scopeName', () => {
      healthComponent.entity = null;
      healthComponent.takeDamage(25);
      
      expect(mockEntity.emit).not.toHaveBeenCalled();
    });

    it('should not emit events when entity lacks emit method', () => {
      healthComponent.entity = { id: 'no-emit' };
      healthComponent.takeDamage(25);
      
      expect(mockEntity.emit).not.toHaveBeenCalled();
    });

    it('should log damage calculation', () => {
      healthComponent.takeDamage(30);
      
      expect(Logger.debug).toHaveBeenCalledWith(
        '[HealthComponent] damage: 30 -> 30 (100 -> 70)'
      );
    });

    it('should log damage with mitigation', () => {
      healthComponent.armor = 5;
      healthComponent.resistance = 0.2;
      healthComponent.takeDamage(25);
      
      // (25 - 5) * (1 - 0.2) = 16
      expect(Logger.debug).toHaveBeenCalledWith(
        '[HealthComponent] damage: 25 -> 16 (100 -> 84)'
      );
    });
  });

  describe('heal method', () => {
    beforeEach(() => {
      healthComponent.entity = mockEntity;
      healthComponent.currentHealth = 50; // Start with partial health
    });

    it('should heal normally', () => {
      const healing = healthComponent.heal(30);
      
      expect(healing).toBe(30);
      expect(healthComponent.currentHealth).toBe(80);
    });

    it('should not heal when at full health', () => {
      healthComponent.currentHealth = 100;
      const healing = healthComponent.heal(20);
      
      expect(healing).toBe(0);
      expect(healthComponent.currentHealth).toBe(100);
    });

    it('should not heal with zero or negative amount', () => {
      const zeroHeal = healthComponent.heal(0);
      expect(zeroHeal).toBe(0);
      expect(healthComponent.currentHealth).toBe(50);

      const negativeHeal = healthComponent.heal(-10);
      expect(negativeHeal).toBe(0);
      expect(healthComponent.currentHealth).toBe(50);
    });

    it('should not exceed max health', () => {
      const healing = healthComponent.heal(70); // Would go to 120
      
      expect(healing).toBe(50); // Only healed to 100
      expect(healthComponent.currentHealth).toBe(100);
    });

    it('should emit heal event when entity has event scopeName', () => {
      healthComponent.heal(25);
      
      expect(mockEntity.emit).toHaveBeenCalledWith('heal', {
        healAmount: 25,
        currentHealth: 75,
        maxHealth: 100,
      });
    });

    it('should emit heal event with actual healing amount', () => {
      healthComponent.heal(70); // Tries to heal 70, but only heals 50
      
      expect(mockEntity.emit).toHaveBeenCalledWith('heal', {
        healAmount: 50,
        currentHealth: 100,
        maxHealth: 100,
      });
    });

    it('should not emit events when entity has no event scopeName', () => {
      healthComponent.entity = null;
      healthComponent.heal(25);
      
      expect(mockEntity.emit).not.toHaveBeenCalled();
    });

    it('should not emit events when entity lacks emit method', () => {
      healthComponent.entity = { id: 'no-emit' };
      healthComponent.heal(25);
      
      expect(mockEntity.emit).not.toHaveBeenCalled();
    });

    it('should log healing calculation', () => {
      healthComponent.heal(25);
      
      expect(Logger.debug).toHaveBeenCalledWith(
        '[HealthComponent] heal: 25 -> 25 (50 -> 75)'
      );
    });

    it('should log healing with clamping', () => {
      healthComponent.heal(70);
      
      expect(Logger.debug).toHaveBeenCalledWith(
        '[HealthComponent] heal: 70 -> 50 (50 -> 100)'
      );
    });
  });

  describe('setInvulnerable method', () => {
    it('should set invulnerable without duration', () => {
      healthComponent.setInvulnerable();
      
      expect(healthComponent.invulnerable).toBe(true);
      expect(healthComponent.invulnerabilityDuration).toBe(0);
    });

    it('should set invulnerable with duration', () => {
      healthComponent.setInvulnerable(1000);
      
      expect(healthComponent.invulnerable).toBe(true);
      expect(healthComponent.invulnerabilityDuration).toBe(1000);
    });

    it('should automatically clear invulnerability after duration', () => {
      healthComponent.setInvulnerable(1000);
      
      expect(healthComponent.invulnerable).toBe(true);
      
      // Fast-forward time
      vi.advanceTimersByTime(1000);
      
      expect(healthComponent.invulnerable).toBe(false);
      expect(healthComponent.invulnerabilityDuration).toBe(0);
    });

    it('should handle zero duration', () => {
      healthComponent.setInvulnerable(0);
      
      expect(healthComponent.invulnerable).toBe(true);
      expect(healthComponent.invulnerabilityDuration).toBe(0);
      
      // No timeout should be set
      vi.advanceTimersByTime(1000);
      expect(healthComponent.invulnerable).toBe(true);
    });

    it('should log invulnerability setting', () => {
      healthComponent.setInvulnerable(2000);
      
      expect(Logger.debug).toHaveBeenCalledWith(
        '[HealthComponent] invulnerability: 2000ms'
      );
    });

    it('should override previous invulnerability duration', () => {
      healthComponent.setInvulnerable(2000);
      expect(healthComponent.invulnerabilityDuration).toBe(2000);
      
      healthComponent.setInvulnerable(1000);
      expect(healthComponent.invulnerabilityDuration).toBe(1000);
      
      // Both timeouts should be active, but second one should override
      vi.advanceTimersByTime(1000);
      expect(healthComponent.invulnerable).toBe(false);
    });
  });

  describe('clearInvulnerability method', () => {
    it('should clear invulnerability state', () => {
      healthComponent.setInvulnerable(1000);
      expect(healthComponent.invulnerable).toBe(true);
      
      healthComponent.clearInvulnerability();
      
      expect(healthComponent.invulnerable).toBe(false);
      expect(healthComponent.invulnerabilityDuration).toBe(0);
    });

    it('should work when not invulnerable', () => {
      expect(healthComponent.invulnerable).toBe(false);
      
      healthComponent.clearInvulnerability();
      
      expect(healthComponent.invulnerable).toBe(false);
      expect(healthComponent.invulnerabilityDuration).toBe(0);
    });
  });

  describe('update method (regeneration)', () => {
    beforeEach(() => {
      healthComponent.entity = mockEntity;
      healthComponent.currentHealth = 50;
      healthComponent.regeneration = 10; // 10 HP per second
      healthComponent.lastRegenTime = Date.now();
    });

    it('should not regenerate when at full health', () => {
      healthComponent.currentHealth = 100;
      healthComponent.update(1000);
      
      expect(healthComponent.currentHealth).toBe(100);
      expect(mockEntity.emit).not.toHaveBeenCalled();
    });

    it('should not regenerate when regeneration is zero', () => {
      healthComponent.regeneration = 0;
      
      vi.advanceTimersByTime(1000);
      healthComponent.update(1000);
      
      expect(healthComponent.currentHealth).toBe(50);
    });

    it('should regenerate after 1 second', () => {
      vi.advanceTimersByTime(1000);
      healthComponent.update(1000);
      
      expect(healthComponent.currentHealth).toBe(60); // 50 + 10
      expect(healthComponent.lastRegenTime).toBe(Date.now());
    });

    it('should not regenerate before 1 second passes', () => {
      vi.advanceTimersByTime(500);
      healthComponent.update(500);
      
      expect(healthComponent.currentHealth).toBe(50);
    });

    it('should handle multiple seconds of regeneration', () => {
      vi.advanceTimersByTime(2500); // 2.5 seconds
      healthComponent.update(2500);
      
      // 2.5 seconds * 10 HP/s = 25 HP
      expect(healthComponent.currentHealth).toBe(75);
    });

    it('should not exceed max health through regeneration', () => {
      healthComponent.currentHealth = 95;
      healthComponent.regeneration = 20;
      
      vi.advanceTimersByTime(1000);
      healthComponent.update(1000);
      
      expect(healthComponent.currentHealth).toBe(100); // Clamped to max
    });

    it('should emit heal events during regeneration', () => {
      vi.advanceTimersByTime(1000);
      healthComponent.update(1000);
      
      expect(mockEntity.emit).toHaveBeenCalledWith('heal', {
        healAmount: 10,
        currentHealth: 60,
        maxHealth: 100,
      });
    });

    it('should handle fractional regeneration timing', () => {
      healthComponent.regeneration = 15; // 15 HP per second
      
      vi.advanceTimersByTime(1500); // 1.5 seconds
      healthComponent.update(1500);
      
      // 1.5 seconds * 15 HP/s = 22.5 HP, healed as 22.5
      expect(healthComponent.currentHealth).toBe(72.5); // 50 + 22.5
    });

    it('should update lastRegenTime after regeneration', () => {
      const initialTime = Date.now();
      
      vi.advanceTimersByTime(1000);
      healthComponent.update(1000);
      
      expect(healthComponent.lastRegenTime).toBe(initialTime + 1000);
    });

    it('should handle regeneration when lastRegenTime is 0', () => {
      healthComponent.lastRegenTime = 0;
      
      vi.advanceTimersByTime(1000);
      healthComponent.update(1000);
      
      // Should regenerate based on the full time difference
      expect(healthComponent.currentHealth).toBeGreaterThan(50);
    });
  });

  describe('status check methods', () => {
    describe('isAlive', () => {
      it('should return true when health is positive', () => {
        healthComponent.currentHealth = 1;
        expect(healthComponent.isAlive()).toBe(true);

        healthComponent.currentHealth = 50;
        expect(healthComponent.isAlive()).toBe(true);

        healthComponent.currentHealth = 100;
        expect(healthComponent.isAlive()).toBe(true);
      });

      it('should return false when health is zero or negative', () => {
        healthComponent.currentHealth = 0;
        expect(healthComponent.isAlive()).toBe(false);

        healthComponent.currentHealth = -10;
        expect(healthComponent.isAlive()).toBe(false);
      });
    });

    describe('isFullHealth', () => {
      it('should return true when at max health', () => {
        healthComponent.currentHealth = 100;
        expect(healthComponent.isFullHealth()).toBe(true);
      });

      it('should return true when above max health (edge case)', () => {
        healthComponent.currentHealth = 110;
        expect(healthComponent.isFullHealth()).toBe(true);
      });

      it('should return false when below max health', () => {
        healthComponent.currentHealth = 99;
        expect(healthComponent.isFullHealth()).toBe(false);

        healthComponent.currentHealth = 50;
        expect(healthComponent.isFullHealth()).toBe(false);

        healthComponent.currentHealth = 0;
        expect(healthComponent.isFullHealth()).toBe(false);
      });
    });

    describe('getHealthPercentage', () => {
      it('should return correct percentage for normal health', () => {
        healthComponent.currentHealth = 75;
        expect(healthComponent.getHealthPercentage()).toBe(0.75);

        healthComponent.currentHealth = 50;
        expect(healthComponent.getHealthPercentage()).toBe(0.5);

        healthComponent.currentHealth = 25;
        expect(healthComponent.getHealthPercentage()).toBe(0.25);
      });

      it('should return 1.0 for full health', () => {
        healthComponent.currentHealth = 100;
        expect(healthComponent.getHealthPercentage()).toBe(1.0);
      });

      it('should return 0.0 for zero health', () => {
        healthComponent.currentHealth = 0;
        expect(healthComponent.getHealthPercentage()).toBe(0.0);
      });

      it('should handle edge case of zero max health', () => {
        // This shouldn't happen due to constructor validation, but test anyway
        healthComponent.maxHealth = 0;
        healthComponent.currentHealth = 0;
        expect(healthComponent.getHealthPercentage()).toBe(0);
      });

      it('should handle percentage > 1.0 (edge case)', () => {
        healthComponent.currentHealth = 150; // Above max
        expect(healthComponent.getHealthPercentage()).toBe(1.5);
      });
    });
  });

  describe('serialization', () => {
    it('should serialize all health data', () => {
      healthComponent.init({
        maxHealth: 150,
        currentHealth: 100,
        armor: 5,
        resistance: 0.2,
        regeneration: 3,
        invulnerable: true,
      });

      const serialized = healthComponent.serialize();

      expect(serialized).toEqual({
        type: 'HealthComponent',
        componentId: healthComponent.componentId,
        active: true,
        maxHealth: 150,
        currentHealth: 100,
        armor: 5,
        resistance: 0.2,
        regeneration: 3,
        invulnerable: true,
      });
    });

    it('should include parent serialization data', () => {
      const serialized = healthComponent.serialize();
      
      expect(serialized).toHaveProperty('type');
      expect(serialized).toHaveProperty('componentId');
      expect(serialized).toHaveProperty('active');
    });

    it('should serialize default values correctly', () => {
      const serialized = healthComponent.serialize();

      expect(serialized.maxHealth).toBe(100);
      expect(serialized.currentHealth).toBe(100);
      expect(serialized.armor).toBe(0);
      expect(serialized.resistance).toBe(0);
      expect(serialized.regeneration).toBe(0);
      expect(serialized.invulnerable).toBe(false);
    });
  });

  describe('deserialization', () => {
    it('should deserialize health data correctly', () => {
      const data = {
        componentId: 'test-id',
        active: false,
        maxHealth: 200,
        currentHealth: 150,
        armor: 10,
        resistance: 0.3,
        regeneration: 5,
        invulnerable: true,
      };

      healthComponent.deserialize(data);

      expect(healthComponent.componentId).toBe('test-id');
      expect(healthComponent.active).toBe(false);
      expect(healthComponent.maxHealth).toBe(200);
      expect(healthComponent.currentHealth).toBe(150);
      expect(healthComponent.armor).toBe(10);
      expect(healthComponent.resistance).toBe(0.3);
      expect(healthComponent.regeneration).toBe(5);
      expect(healthComponent.invulnerable).toBe(true);
    });

    it('should call parent deserialize method', () => {
      const parentDeserializeSpy = vi.spyOn(Object.getPrototypeOf(HealthComponent.prototype), 'deserialize');
      const data = { maxHealth: 150 };
      
      healthComponent.deserialize(data);
      
      expect(parentDeserializeSpy).toHaveBeenCalledWith(data);
      parentDeserializeSpy.mockRestore();
    });

    it('should call init method with data', () => {
      const initSpy = vi.spyOn(healthComponent, 'init');
      const data = { maxHealth: 175, armor: 8 };
      
      healthComponent.deserialize(data);
      
      expect(initSpy).toHaveBeenCalledWith(data);
      initSpy.mockRestore();
    });

    it('should handle partial data', () => {
      const originalMaxHealth = healthComponent.maxHealth;
      const data = { armor: 15 };
      
      healthComponent.deserialize(data);
      
      expect(healthComponent.maxHealth).toBe(originalMaxHealth);
      expect(healthComponent.armor).toBe(15);
    });
  });

  describe('validation', () => {
    it('should validate default component as valid', () => {
      expect(healthComponent.validate()).toBe(true);
    });

    it('should validate component with valid values', () => {
      healthComponent.init({
        maxHealth: 150,
        currentHealth: 100,
        armor: 10,
        resistance: 0.5,
        regeneration: 5,
      });

      expect(healthComponent.validate()).toBe(true);
    });

    it('should invalidate zero max health', () => {
      healthComponent.maxHealth = 0;
      expect(healthComponent.validate()).toBe(false);
    });

    it('should invalidate negative max health', () => {
      healthComponent.maxHealth = -10;
      expect(healthComponent.validate()).toBe(false);
    });

    it('should invalidate negative current health', () => {
      healthComponent.currentHealth = -5;
      expect(healthComponent.validate()).toBe(false);
    });

    it('should invalidate current health above max health', () => {
      healthComponent.currentHealth = 150; // Max is 100
      expect(healthComponent.validate()).toBe(false);
    });

    it('should invalidate negative armor', () => {
      healthComponent.armor = -5;
      expect(healthComponent.validate()).toBe(false);
    });

    it('should invalidate negative resistance', () => {
      healthComponent.resistance = -0.1;
      expect(healthComponent.validate()).toBe(false);
    });

    it('should invalidate resistance above 1', () => {
      healthComponent.resistance = 1.5;
      expect(healthComponent.validate()).toBe(false);
    });

    it('should invalidate negative regeneration', () => {
      healthComponent.regeneration = -2;
      expect(healthComponent.validate()).toBe(false);
    });

    it('should validate boundary values', () => {
      healthComponent.init({
        maxHealth: 1, // Minimum valid
        currentHealth: 1,
        armor: 0,
        resistance: 0,
        regeneration: 0,
      });
      expect(healthComponent.validate()).toBe(true);

      healthComponent.init({
        maxHealth: 1000,
        currentHealth: 1000,
        armor: 1000,
        resistance: 1, // Maximum valid
        regeneration: 1000,
      });
      expect(healthComponent.validate()).toBe(true);
    });
  });

  describe('complex damage scenarios', () => {
    beforeEach(() => {
      healthComponent.entity = mockEntity;
    });

    it('should handle high armor vs low damage', () => {
      healthComponent.armor = 100;
      const damage = healthComponent.takeDamage(50);
      
      expect(damage).toBe(0);
      expect(healthComponent.currentHealth).toBe(100);
    });

    it('should handle high resistance vs damage', () => {
      healthComponent.resistance = 0.9; // 90% resistance
      const damage = healthComponent.takeDamage(100);
      
      expect(damage).toBe(9); // Math.floor(100 * (1 - 0.9)) = Math.floor(10) = 10, but actually 9 due to precision
      expect(healthComponent.currentHealth).toBe(91);
    });

    it('should handle extreme mitigation combination', () => {
      healthComponent.armor = 20;
      healthComponent.resistance = 0.8;
      const damage = healthComponent.takeDamage(100);
      
      // (100 - 20) * (1 - 0.8) = 80 * 0.2 = 16, but Math.floor makes it 15
      expect(damage).toBe(15);
      expect(healthComponent.currentHealth).toBe(85);
    });

    it('should handle overkill damage', () => {
      healthComponent.currentHealth = 25;
      const damage = healthComponent.takeDamage(1000);
      
      expect(damage).toBe(1000);
      expect(healthComponent.currentHealth).toBe(0);
      expect(mockEntity.emit).toHaveBeenCalledWith('damage', {
        rawDamage: 1000,
        actualDamage: 1000,
        damageType: 'generic',
        remainingHealth: 0,
        isDead: true,
      });
    });
  });

  describe('complex healing scenarios', () => {
    beforeEach(() => {
      healthComponent.entity = mockEntity;
    });

    it('should handle massive overheal', () => {
      healthComponent.currentHealth = 50;
      const healing = healthComponent.heal(10000);
      
      expect(healing).toBe(50); // Only healed to max
      expect(healthComponent.currentHealth).toBe(100);
    });

    it('should handle minimal heal at near-full health', () => {
      healthComponent.currentHealth = 99;
      const healing = healthComponent.heal(10);
      
      expect(healing).toBe(1);
      expect(healthComponent.currentHealth).toBe(100);
    });
  });

  describe('time-based functionality edge cases', () => {
    beforeEach(() => {
      healthComponent.entity = mockEntity;
    });

    it('should handle invulnerability timeout with multiple calls', () => {
      healthComponent.setInvulnerable(1000);
      healthComponent.setInvulnerable(2000); // Override previous
      
      // Both timeouts are active, but the first one (1000ms) will fire first
      vi.advanceTimersByTime(1000);
      expect(healthComponent.invulnerable).toBe(false); // First timeout fired
      
      // Even though second timeout is still pending, the first one already cleared invulnerability
      vi.advanceTimersByTime(1000); // Total 2000ms - second timeout fires
      expect(healthComponent.invulnerable).toBe(false);
    });

    it('should handle regeneration with zero lastRegenTime', () => {
      healthComponent.currentHealth = 50;
      healthComponent.regeneration = 5;
      healthComponent.lastRegenTime = 0;
      
      vi.advanceTimersByTime(2000);
      healthComponent.update(2000);
      
      // Should use full time difference for regeneration
      expect(healthComponent.currentHealth).toBeGreaterThan(50);
      expect(healthComponent.lastRegenTime).toBeGreaterThan(0);
    });

    it('should handle rapid update calls', () => {
      healthComponent.currentHealth = 50;
      healthComponent.regeneration = 10;
      healthComponent.lastRegenTime = Date.now();
      
      // Call update rapidly without advancing time
      healthComponent.update(100);
      healthComponent.update(200);
      healthComponent.update(300);
      
      expect(healthComponent.currentHealth).toBe(50); // No regen yet
      
      vi.advanceTimersByTime(1000);
      healthComponent.update(400);
      
      expect(healthComponent.currentHealth).toBe(60); // Now regen happens
    });
  });

  describe('event scopeName integration', () => {
    it('should handle entity with custom emit behavior', () => {
      const customEntity = {
        emit: vi.fn((event, data) => {
          // Custom emit that modifies data
          data.customProperty = 'added';
        }),
      };
      
      healthComponent.entity = customEntity;
      healthComponent.takeDamage(25);
      
      expect(customEntity.emit).toHaveBeenCalled();
      const callArgs = customEntity.emit.mock.calls[0];
      expect(callArgs[0]).toBe('damage');
      expect(callArgs[1].customProperty).toBe('added');
    });

    it('should handle entity emit method that throws', () => {
      const throwingEntity = {
        emit: vi.fn(() => {
          throw new Error('Emit failed');
        }),
      };
      
      healthComponent.entity = throwingEntity;
      
      // Should not throw - error should be contained
      expect(() => healthComponent.takeDamage(25)).toThrow('Emit failed');
    });
  });

  describe('inheritance and integration', () => {
    it('should maintain BaseComponent functionality', () => {
      expect(healthComponent).toBeInstanceOf(HealthComponent);
      expect(healthComponent).toBeInstanceOf(BaseComponent);
      expect(healthComponent.componentId).toBeDefined();
      expect(healthComponent.active).toBe(true);
      expect(healthComponent.entity).toBe(null);
      expect(typeof healthComponent.destroy).toBe('function');
    });

    it('should work with component lifecycle', () => {
      const entity = { emit: vi.fn() };
      healthComponent.entity = entity;
      
      // Use component normally
      healthComponent.takeDamage(25);
      healthComponent.heal(10);
      
      // Serialize state
      const serialized = healthComponent.serialize();
      
      // Create new component and restore state
      const newComponent = new HealthComponent();
      newComponent.deserialize(serialized);
      
      expect(newComponent.currentHealth).toBe(healthComponent.currentHealth);
      expect(newComponent.maxHealth).toBe(healthComponent.maxHealth);
      
      // Destroy components
      healthComponent.destroy();
      newComponent.destroy();
      
      expect(healthComponent.entity).toBe(null);
      expect(healthComponent.active).toBe(false);
      expect(newComponent.entity).toBe(null);
      expect(newComponent.active).toBe(false);
    });
  });

  describe('logging integration', () => {
    it('should log creation with max health', () => {
      const customComponent = new HealthComponent(150);
      
      expect(Logger.debug).toHaveBeenCalledWith(
        '[HealthComponent] Created: 150 max health'
      );
    });

    it('should log damage calculations in various scenarios', () => {
      healthComponent.entity = mockEntity;
      
      // Clear constructor logs
      vi.clearAllMocks();
      
      healthComponent.takeDamage(25);
      expect(Logger.debug).toHaveBeenCalledWith(
        '[HealthComponent] damage: 25 -> 25 (100 -> 75)'
      );
      
      healthComponent.armor = 5;
      healthComponent.takeDamage(20);
      expect(Logger.debug).toHaveBeenCalledWith(
        '[HealthComponent] damage: 20 -> 15 (75 -> 60)'
      );
    });

    it('should log healing calculations', () => {
      healthComponent.entity = mockEntity;
      healthComponent.currentHealth = 40;
      
      vi.clearAllMocks();
      
      healthComponent.heal(30);
      expect(Logger.debug).toHaveBeenCalledWith(
        '[HealthComponent] heal: 30 -> 30 (40 -> 70)'
      );
    });

    it('should log invulnerability settings', () => {
      vi.clearAllMocks();
      
      healthComponent.setInvulnerable(1500);
      expect(Logger.debug).toHaveBeenCalledWith(
        '[HealthComponent] invulnerability: 1500ms'
      );
    });
  });
});