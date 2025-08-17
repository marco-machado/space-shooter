import { beforeEach, describe, expect, it, vi } from 'vitest';
import UpgradeSystem from '@/systems/UpgradeSystem.js';

// Mock dependencies
vi.mock('@/utils/Logger.js', () => ({
  default: {
    scope: () => ({
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

vi.mock('@/event-bus/EventBus.js', () => ({
  getEventBus: () => ({
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  }),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
vi.stubGlobal('localStorage', localStorageMock);

describe('UpgradeSystem', () => {
  let upgradeSystem;
  let mockGameStateManager;

  beforeEach(() => {
    // Reset localStorage mock
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();

    // Create mock GameStateManager
    mockGameStateManager = {
      availablePoints: 10,
      spentPoints: 0,
      spendPoints: vi.fn().mockReturnValue(true),
      refundPoints: vi.fn().mockReturnValue(true),
      getTotalPointsEarned: vi.fn().mockReturnValue(10),
    };

    upgradeSystem = new UpgradeSystem(mockGameStateManager);
  });

  describe('initialization', () => {
    it('should create upgrade system with default effects', () => {
      expect(upgradeSystem).toBeDefined();
      const effects = upgradeSystem.getUpgradeEffects();
      
      expect(effects.weaponDamageMultiplier).toBe(1.0);
      expect(effects.weaponSpeedMultiplier).toBe(1.0);
      expect(effects.weaponMultishot).toBe(1);
      expect(effects.weaponPiercing).toBe(0);
      expect(effects.weaponSpreadPattern).toBe(false);
    });

    it('should initialize laser upgrades', () => {
      const laserUpgrades = upgradeSystem.getUpgradesByBranch('weapons', 'laser');
      
      expect(laserUpgrades).toHaveLength(7);
      expect(laserUpgrades.some(u => u.id === 'laser-damage-1')).toBe(true);
      expect(laserUpgrades.some(u => u.id === 'twin-lasers')).toBe(true);
      expect(laserUpgrades.some(u => u.id === 'piercing-shots')).toBe(true);
    });
  });

  describe('upgrade validation', () => {
    it('should validate valid upgrade purchase', () => {
      const result = upgradeSystem.validateUpgradePurchase('laser-damage-1');
      
      expect(result.valid).toBe(true);
      expect(result.code).toBe('VALID');
    });

    it('should reject purchase with insufficient points', () => {
      mockGameStateManager.availablePoints = 1;
      
      const result = upgradeSystem.validateUpgradePurchase('laser-damage-1');
      
      expect(result.valid).toBe(false);
      expect(result.code).toBe('INSUFFICIENT_POINTS');
    });

    it('should reject purchase when prerequisites not met', () => {
      const result = upgradeSystem.validateUpgradePurchase('laser-damage-2');
      
      expect(result.valid).toBe(false);
      expect(result.code).toBe('PREREQUISITES_NOT_MET');
      expect(result.missingPrerequisite).toBe('laser-damage-1');
    });

    it('should reject purchase of already purchased upgrade', () => {
      // First purchase should succeed
      upgradeSystem.purchaseUpgrade('laser-damage-1');
      
      // Second purchase should fail
      const result = upgradeSystem.validateUpgradePurchase('laser-damage-1');
      
      expect(result.valid).toBe(false);
      expect(result.code).toBe('ALREADY_PURCHASED');
    });
  });

  describe('upgrade purchase', () => {
    it('should successfully purchase valid upgrade', () => {
      const success = upgradeSystem.purchaseUpgrade('laser-damage-1');
      
      expect(success).toBe(true);
      expect(mockGameStateManager.spendPoints).toHaveBeenCalledWith(2, 'Upgrade: Laser Damage I');
      
      const status = upgradeSystem.getUpgradeStatus('laser-damage-1');
      expect(status.isPurchased).toBe(true);
      expect(status.currentLevel).toBe(1);
    });

    it('should fail to purchase invalid upgrade', () => {
      mockGameStateManager.spendPoints.mockReturnValue(false);
      
      const success = upgradeSystem.purchaseUpgrade('laser-damage-1');
      
      expect(success).toBe(false);
    });

    it('should recalculate effects after purchase', () => {
      upgradeSystem.purchaseUpgrade('laser-damage-1');
      
      const effects = upgradeSystem.getUpgradeEffects();
      expect(effects.weaponDamageMultiplier).toBe(1.2); // +20% damage
    });

    it('should handle prerequisite chain correctly', () => {
      // Purchase laser-damage-1 first
      upgradeSystem.purchaseUpgrade('laser-damage-1');
      
      // Now laser-damage-2 should be available
      const result = upgradeSystem.validateUpgradePurchase('laser-damage-2');
      expect(result.valid).toBe(true);
      
      // Purchase laser-damage-2
      const success = upgradeSystem.purchaseUpgrade('laser-damage-2');
      expect(success).toBe(true);
      
      // Effects should stack multiplicatively
      const effects = upgradeSystem.getUpgradeEffects();
      expect(effects.weaponDamageMultiplier).toBe(1.56); // 1.2 * 1.3 = 1.56
    });
  });

  describe('multi-shot upgrades', () => {
    it('should enable twin lasers', () => {
      upgradeSystem.purchaseUpgrade('laser-damage-1');
      upgradeSystem.purchaseUpgrade('twin-lasers');
      
      const effects = upgradeSystem.getUpgradeEffects();
      expect(effects.weaponMultishot).toBe(2);
      expect(effects.weaponSpreadPattern).toBe(false);
    });

    it('should enable triple threat with spread pattern', () => {
      upgradeSystem.purchaseUpgrade('laser-damage-1');
      upgradeSystem.purchaseUpgrade('twin-lasers');
      upgradeSystem.purchaseUpgrade('triple-threat');
      
      const effects = upgradeSystem.getUpgradeEffects();
      expect(effects.weaponMultishot).toBe(3);
      expect(effects.weaponSpreadPattern).toBe(true);
    });
  });

  describe('piercing upgrade', () => {
    it('should enable piercing shots', () => {
      upgradeSystem.purchaseUpgrade('laser-damage-1');
      upgradeSystem.purchaseUpgrade('laser-damage-2');
      upgradeSystem.purchaseUpgrade('piercing-shots');
      
      const effects = upgradeSystem.getUpgradeEffects();
      expect(effects.weaponPiercing).toBe(2);
    });
  });

  describe('upgrade refund', () => {
    it('should refund upgrade successfully', () => {
      upgradeSystem.purchaseUpgrade('laser-velocity');
      
      const success = upgradeSystem.refundUpgrade('laser-velocity');
      
      expect(success).toBe(true);
      expect(mockGameStateManager.refundPoints).toHaveBeenCalledWith(3, 'Refund: Laser Velocity');
      
      const status = upgradeSystem.getUpgradeStatus('laser-velocity');
      expect(status.isPurchased).toBe(false);
    });

    it('should prevent refund when other upgrades depend on it', () => {
      upgradeSystem.purchaseUpgrade('laser-damage-1');
      upgradeSystem.purchaseUpgrade('laser-damage-2');
      
      // Try to refund laser-damage-1 which is required by laser-damage-2
      const success = upgradeSystem.refundUpgrade('laser-damage-1');
      
      expect(success).toBe(false);
    });
  });

  describe('persistence', () => {
    it('should save upgrades to localStorage', () => {
      upgradeSystem.purchaseUpgrade('laser-damage-1');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'space-shooter-upgrades',
        expect.stringContaining('laser-damage-1')
      );
    });

    it('should load upgrades from localStorage', () => {
      const saveData = {
        purchasedUpgrades: {
          'laser-damage-1': { level: 1, purchaseDate: '2025-01-01T00:00:00.000Z' }
        },
        version: '1.0.0'
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(saveData));
      
      const newUpgradeSystem = new UpgradeSystem(mockGameStateManager);
      
      const status = newUpgradeSystem.getUpgradeStatus('laser-damage-1');
      expect(status.isPurchased).toBe(true);
    });
  });

  describe('upgrade effects calculation', () => {
    it('should calculate combined effects correctly', () => {
      // Purchase damage upgrades
      upgradeSystem.purchaseUpgrade('laser-damage-1'); // 1.2x
      upgradeSystem.purchaseUpgrade('laser-damage-2'); // 1.3x
      upgradeSystem.purchaseUpgrade('laser-damage-3'); // 1.4x
      
      // Purchase velocity upgrade
      upgradeSystem.purchaseUpgrade('laser-velocity'); // 1.5x
      
      const effects = upgradeSystem.getUpgradeEffects();
      expect(effects.weaponDamageMultiplier).toBeCloseTo(2.184, 3); // 1.2 * 1.3 * 1.4
      expect(effects.weaponSpeedMultiplier).toBe(1.5);
    });
  });

  describe('reset functionality', () => {
    it('should reset all upgrades', () => {
      upgradeSystem.purchaseUpgrade('laser-damage-1');
      upgradeSystem.purchaseUpgrade('laser-velocity');
      
      upgradeSystem.resetAllUpgrades();
      
      expect(upgradeSystem.getPurchasedUpgrades().size).toBe(0);
      
      const effects = upgradeSystem.getUpgradeEffects();
      expect(effects.weaponDamageMultiplier).toBe(1.0);
      expect(effects.weaponSpeedMultiplier).toBe(1.0);
    });
  });

  describe('Universal Upgrades - Epic 4', () => {
    describe('heat sink system', () => {
      it('should purchase heat sink upgrades', () => {
        const success = upgradeSystem.purchaseUpgrade('heat-sink-1');
        expect(success).toBe(true);

        const status = upgradeSystem.getUpgradeStatus('heat-sink-1');
        expect(status.isPurchased).toBe(true);
      });

      it('should apply heat sink effects correctly', () => {
        upgradeSystem.purchaseUpgrade('heat-sink-1'); // 1.2x cooling, 1.1x capacity
        
        const effects = upgradeSystem.getUpgradeEffects();
        expect(effects.weaponCoolingMultiplier).toBe(1.2);
        expect(effects.weaponHeatCapacityMultiplier).toBe(1.1);
        expect(effects.weaponOverheatThreshold).toBe(110); // 100 * 1.1
      });

      it('should stack multiple heat sink upgrades', () => {
        upgradeSystem.purchaseUpgrade('heat-sink-1'); // 1.2x cooling, 1.1x capacity
        upgradeSystem.purchaseUpgrade('heat-sink-2'); // 1.35x cooling, 1.2x capacity
        upgradeSystem.purchaseUpgrade('heat-sink-3'); // 1.5x cooling, 1.3x capacity
        
        const effects = upgradeSystem.getUpgradeEffects();
        expect(effects.weaponCoolingMultiplier).toBeCloseTo(2.43, 2); // 1.2 * 1.35 * 1.5
        expect(effects.weaponHeatCapacityMultiplier).toBeCloseTo(1.716, 3); // 1.1 * 1.2 * 1.3
        expect(effects.weaponOverheatThreshold).toBe(171); // 100 * 1.716
      });

      it('should enforce heat sink upgrade prerequisites', () => {
        const validation = upgradeSystem.validateUpgradePurchase('heat-sink-2');
        expect(validation.valid).toBe(false);
        expect(validation.code).toBe('PREREQUISITES_NOT_MET');

        upgradeSystem.purchaseUpgrade('heat-sink-1');
        const validation2 = upgradeSystem.validateUpgradePurchase('heat-sink-2');
        expect(validation2.valid).toBe(true);
      });
    });

    describe('rapid fire system', () => {
      it('should purchase rapid fire upgrades', () => {
        const success = upgradeSystem.purchaseUpgrade('rapid-fire');
        expect(success).toBe(true);

        const status = upgradeSystem.getUpgradeStatus('rapid-fire');
        expect(status.isPurchased).toBe(true);
      });

      it('should apply fire rate effects correctly', () => {
        upgradeSystem.purchaseUpgrade('rapid-fire'); // 1.15x fire rate
        
        const effects = upgradeSystem.getUpgradeEffects();
        expect(effects.weaponFireRateMultiplier).toBe(1.15);
      });

      it('should stack fire rate upgrades', () => {
        upgradeSystem.purchaseUpgrade('rapid-fire'); // 1.15x
        upgradeSystem.purchaseUpgrade('ammunition-expert'); // 1.25x
        
        const effects = upgradeSystem.getUpgradeEffects();
        expect(effects.weaponFireRateMultiplier).toBeCloseTo(1.4375, 4); // 1.15 * 1.25
      });

      it('should enforce fire rate upgrade prerequisites', () => {
        const validation = upgradeSystem.validateUpgradePurchase('ammunition-expert');
        expect(validation.valid).toBe(false);
        expect(validation.code).toBe('PREREQUISITES_NOT_MET');

        upgradeSystem.purchaseUpgrade('rapid-fire');
        const validation2 = upgradeSystem.validateUpgradePurchase('ammunition-expert');
        expect(validation2.valid).toBe(true);
      });
    });

    describe('weapon heat management', () => {
      beforeEach(() => {
        // Set mock time to a consistent value
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('should check weapon fire permission based on heat', () => {
        const currentTime = 1000;
        const lastFireTime = 0;
        const baseFireRate = 800;

        const permission = upgradeSystem.canWeaponFire(currentTime, lastFireTime, baseFireRate);
        expect(permission.canFire).toBe(true);
        expect(permission.reason).toBe('READY');
      });

      it('should add heat when weapon fires', () => {
        upgradeSystem.addWeaponHeat(10);
        
        const heatStatus = upgradeSystem.getWeaponHeatStatus();
        expect(heatStatus.heat).toBe(10);
        expect(heatStatus.heatPercentage).toBe(10);
      });

      it('should overheat when heat exceeds threshold', () => {
        // Add enough heat to overheat
        upgradeSystem.addWeaponHeat(100);
        
        const heatStatus = upgradeSystem.getWeaponHeatStatus();
        expect(heatStatus.overheated).toBe(true);
        expect(heatStatus.heat).toBe(100);
      });

      it('should prevent firing when overheated', () => {
        upgradeSystem.addWeaponHeat(100); // Overheat the weapon
        
        const permission = upgradeSystem.canWeaponFire(1000, 0, 800);
        expect(permission.canFire).toBe(false);
        expect(permission.reason).toBe('OVERHEATED');
      });

      it('should cool down over time', () => {
        upgradeSystem.addWeaponHeat(50);
        
        // Simulate cooling over 1 second
        upgradeSystem.updateWeaponCooling(1000, 1000);
        
        const heatStatus = upgradeSystem.getWeaponHeatStatus();
        expect(heatStatus.heat).toBeLessThan(50);
      });

      it('should apply cooling upgrades to cooling rate', () => {
        upgradeSystem.purchaseUpgrade('heat-sink-1'); // 1.2x cooling
        upgradeSystem.addWeaponHeat(50);
        
        // Simulate cooling over 1 second
        upgradeSystem.updateWeaponCooling(1000, 1000);
        
        const heatStatus = upgradeSystem.getWeaponHeatStatus();
        // With 1.2x cooling, should cool faster than base rate
        expect(heatStatus.heat).toBeLessThan(30); // Should cool faster than base rate
      });
    });

    describe('universal upgrade trees', () => {
      it('should categorize upgrades by tree and branch', () => {
        const universalThermalUpgrades = upgradeSystem.getUpgradesByBranch('universal', 'thermal');
        expect(universalThermalUpgrades).toHaveLength(3);
        expect(universalThermalUpgrades.map(u => u.id)).toEqual([
          'heat-sink-1', 'heat-sink-2', 'heat-sink-3'
        ]);

        const universalFiringUpgrades = upgradeSystem.getUpgradesByBranch('universal', 'firing');
        expect(universalFiringUpgrades).toHaveLength(2);
        expect(universalFiringUpgrades.map(u => u.id)).toEqual([
          'rapid-fire', 'ammunition-expert'
        ]);
      });

      it('should combine universal and weapon-specific effects', () => {
        // Purchase weapon-specific upgrades
        upgradeSystem.purchaseUpgrade('laser-damage-1'); // 1.2x damage
        upgradeSystem.purchaseUpgrade('laser-velocity'); // 1.5x speed

        // Purchase universal upgrades
        upgradeSystem.purchaseUpgrade('rapid-fire'); // 1.15x fire rate
        upgradeSystem.purchaseUpgrade('heat-sink-1'); // 1.2x cooling, 1.1x capacity

        const effects = upgradeSystem.getUpgradeEffects();
        expect(effects.weaponDamageMultiplier).toBe(1.2);
        expect(effects.weaponSpeedMultiplier).toBe(1.5);
        expect(effects.weaponFireRateMultiplier).toBe(1.15);
        expect(effects.weaponCoolingMultiplier).toBe(1.2);
        expect(effects.weaponHeatCapacityMultiplier).toBe(1.1);
      });
    });
  });
});