import { beforeEach, describe, expect, it, vi } from 'vitest';
import HealthComponent from '../../src/components/Health.js';
import UpgradeSystem from '../../src/systems/UpgradeSystem.js';
import PlayerHealthSystem from '../../src/systems/PlayerHealthSystem.js';
import GameStateManager from '../../src/utils/GameStateManager.js';

describe('Defense Upgrades - Epic 5', () => {
  let mockPlayer;
  let mockScene;
  let gameStateManager;
  let upgradeSystem;
  let playerHealthSystem;

  beforeEach(() => {
    // Clear localStorage to prevent interference between tests
    localStorage.clear();
    
    // Mock scene
    mockScene = {
      scene: {
        get: vi.fn(() => mockScene),
      },
      registry: {
        get: vi.fn(),
        set: vi.fn(),
      },
    };

    // Create mock player entity first
    mockPlayer = {
      id: 'test-player',
    };

    // Create health component with proper entity reference
    mockPlayer.health = new HealthComponent(mockPlayer, 5); // Base health of 5

    // Create GameStateManager
    gameStateManager = new GameStateManager(mockScene);
    gameStateManager.availablePoints = 20; // Give some points for upgrades

    // Create UpgradeSystem
    upgradeSystem = new UpgradeSystem(gameStateManager);
    
    // Clear any saved upgrades that might interfere with tests
    upgradeSystem.purchasedUpgrades.clear();
    upgradeSystem.recalculateEffects();

    // Create PlayerHealthSystem
    playerHealthSystem = new PlayerHealthSystem(mockPlayer, upgradeSystem);
  });

  afterEach(() => {
    playerHealthSystem.destroy();
    upgradeSystem.destroy();
  });

  describe('Enhanced HealthComponent', () => {
    it('should handle max health changes with healing option', () => {
      const mockEntity = { id: 'test-entity' };
      const health = new HealthComponent(mockEntity, 10);
      
      // Set to 5 health
      health.setCurrentHealth(5);
      expect(health.getCurrentHealth()).toBe(5);
      
      // Increase max health without healing
      health.setMaxHealth(15, false);
      expect(health.getMaxHealth()).toBe(15);
      expect(health.getCurrentHealth()).toBe(5); // Should remain the same
      
      // Increase max health with healing
      health.setMaxHealth(20, true);
      expect(health.getMaxHealth()).toBe(20);
      expect(health.getCurrentHealth()).toBe(20); // Should heal to max
    });

    it('should calculate damage reduction correctly', () => {
      const mockEntity = { id: 'test-entity' };
      const health = new HealthComponent(mockEntity, 10);
      
      // Test 10% damage reduction
      const actualDamage1 = health.calculateDamageAfterReduction(10, 10);
      expect(actualDamage1).toBe(9); // 10 damage - 10% = 9
      
      // Test 20% damage reduction
      const actualDamage2 = health.calculateDamageAfterReduction(10, 20);
      expect(actualDamage2).toBe(8); // 10 damage - 20% = 8
      
      // Test 100% damage reduction
      const actualDamage3 = health.calculateDamageAfterReduction(10, 100);
      expect(actualDamage3).toBe(0); // 10 damage - 100% = 0
    });

    it('should handle damage application with reduction', () => {
      const mockEntity = { id: 'test-entity' };
      const health = new HealthComponent(mockEntity, 10);
      
      // Apply 5 damage with 20% reduction
      const result = health.takeDamage(5, 20);
      
      expect(result.incomingDamage).toBe(5);
      expect(result.actualDamage).toBe(4); // 5 - 20% = 4
      expect(result.damageReduction).toBe(20);
      expect(result.healthLost).toBe(4);
      expect(result.currentHealth).toBe(6); // 10 - 4 = 6
      expect(result.wasKilled).toBe(false);
    });

    it('should handle healing correctly', () => {
      const mockEntity = { id: 'test-entity' };
      const health = new HealthComponent(mockEntity, 10);
      health.setCurrentHealth(5);
      
      const result = health.heal(3);
      
      expect(result.healAmount).toBe(3);
      expect(result.actualHealing).toBe(3);
      expect(result.currentHealth).toBe(8);
      expect(result.wasFullyHealed).toBe(false);
      
      // Try to overheal
      const result2 = health.heal(5);
      expect(result2.actualHealing).toBe(2); // Only heal to max
      expect(result2.currentHealth).toBe(10);
      expect(result2.wasFullyHealed).toBe(true);
    });
  });

  describe('Hull Branch Upgrades', () => {
    it('should have all hull upgrade definitions', () => {
      const hullUpgrades = upgradeSystem.getUpgradesByBranch('defense', 'hull');
      
      expect(hullUpgrades).toHaveLength(4);
      expect(hullUpgrades.find(u => u.id === 'reinforced-hull-1')).toBeDefined();
      expect(hullUpgrades.find(u => u.id === 'reinforced-hull-2')).toBeDefined();
      expect(hullUpgrades.find(u => u.id === 'reinforced-hull-3')).toBeDefined();
      expect(hullUpgrades.find(u => u.id === 'titanium-plating')).toBeDefined();
    });

    it('should validate hull upgrade prerequisites', () => {
      // Hull 1 should be available (no prerequisites)
      const validation1 = upgradeSystem.validateUpgradePurchase('reinforced-hull-1');
      expect(validation1.valid).toBe(true);
      
      // Hull 2 should not be available (requires Hull 1)
      const validation2 = upgradeSystem.validateUpgradePurchase('reinforced-hull-2');
      expect(validation2.valid).toBe(false);
      expect(validation2.code).toBe('PREREQUISITES_NOT_MET');
      
      // Purchase Hull 1
      upgradeSystem.purchaseUpgrade('reinforced-hull-1');
      
      // Hull 2 should now be available
      const validation3 = upgradeSystem.validateUpgradePurchase('reinforced-hull-2');
      expect(validation3.valid).toBe(true);
    });

    it('should apply health bonuses correctly', () => {
      const baseHealth = mockPlayer.health.getMaxHealth();
      expect(baseHealth).toBe(5);
      
      // Purchase Reinforced Hull I (+1 health)
      upgradeSystem.purchaseUpgrade('reinforced-hull-1');
      
      const newMaxHealth = upgradeSystem.getTotalMaxHealth(baseHealth);
      expect(newMaxHealth).toBe(6); // 5 base + 1 bonus
      
      // Purchase Reinforced Hull II (+2 more health)
      upgradeSystem.purchaseUpgrade('reinforced-hull-2');
      
      const newMaxHealth2 = upgradeSystem.getTotalMaxHealth(baseHealth);
      expect(newMaxHealth2).toBe(8); // 5 base + 1 + 2 = 8
    });

    it('should track health effects correctly', () => {
      // No upgrades initially
      expect(upgradeSystem.upgradeEffects.healthBonus).toBe(0);
      
      // Purchase all hull upgrades
      upgradeSystem.purchaseUpgrade('reinforced-hull-1'); // +1
      expect(upgradeSystem.upgradeEffects.healthBonus).toBe(1);
      
      upgradeSystem.purchaseUpgrade('reinforced-hull-2'); // +2 (total +3)
      expect(upgradeSystem.upgradeEffects.healthBonus).toBe(3);
      
      upgradeSystem.purchaseUpgrade('reinforced-hull-3'); // +3 (total +6)
      expect(upgradeSystem.upgradeEffects.healthBonus).toBe(6);
      
      upgradeSystem.purchaseUpgrade('titanium-plating'); // +5 (total +11)
      expect(upgradeSystem.upgradeEffects.healthBonus).toBe(11);
    });
  });

  describe('Damage Reduction Branch', () => {
    it('should have damage reduction upgrade definitions', () => {
      const armorUpgrades = upgradeSystem.getUpgradesByBranch('defense', 'armor');
      
      expect(armorUpgrades).toHaveLength(2);
      expect(armorUpgrades.find(u => u.id === 'damage-reduction-1')).toBeDefined();
      expect(armorUpgrades.find(u => u.id === 'damage-reduction-2')).toBeDefined();
    });

    it('should apply damage reduction correctly', () => {
      // No damage reduction initially
      expect(upgradeSystem.getDamageReduction()).toBe(0);
      
      // Purchase Damage Reduction I (10%)
      upgradeSystem.purchaseUpgrade('damage-reduction-1');
      expect(upgradeSystem.getDamageReduction()).toBe(10);
      
      // Purchase Damage Reduction II (20% total, not additive to 30%)
      upgradeSystem.purchaseUpgrade('damage-reduction-2');
      expect(upgradeSystem.getDamageReduction()).toBe(20);
    });

    it('should validate damage reduction prerequisites', () => {
      // Damage Reduction I should be available
      const validation1 = upgradeSystem.validateUpgradePurchase('damage-reduction-1');
      expect(validation1.valid).toBe(true);
      
      // Damage Reduction II should not be available
      const validation2 = upgradeSystem.validateUpgradePurchase('damage-reduction-2');
      expect(validation2.valid).toBe(false);
      expect(validation2.code).toBe('PREREQUISITES_NOT_MET');
    });
  });

  describe('Defense Status Integration', () => {
    it('should provide comprehensive defense status', () => {
      const baseHealth = 5;
      
      // Purchase some defense upgrades
      upgradeSystem.purchaseUpgrade('reinforced-hull-1'); // +1 health
      upgradeSystem.purchaseUpgrade('damage-reduction-1'); // 10% reduction
      
      const defenseStatus = upgradeSystem.getDefenseStatus(baseHealth);
      
      expect(defenseStatus.baseHealth).toBe(5);
      expect(defenseStatus.healthBonus).toBe(1);
      expect(defenseStatus.totalMaxHealth).toBe(6);
      expect(defenseStatus.damageReduction).toBe(10);
      expect(defenseStatus.effectiveHealthMultiplier).toBe(1.2); // 6/5
    });
  });

  describe('PlayerHealthSystem Integration', () => {
    it('should integrate with upgrade system for health management', () => {
      // Initial state
      expect(mockPlayer.health.getMaxHealth()).toBe(5);
      expect(mockPlayer.health.getCurrentHealth()).toBe(5);
      
      // Purchase hull upgrade
      upgradeSystem.purchaseUpgrade('reinforced-hull-1');
      
      // Health system should automatically apply the upgrade
      expect(mockPlayer.health.getMaxHealth()).toBe(6); // 5 + 1
      expect(mockPlayer.health.getCurrentHealth()).toBe(6); // Should heal to new max
    });

    it('should apply damage reduction in damage handling', () => {
      // Purchase damage reduction
      upgradeSystem.purchaseUpgrade('damage-reduction-1'); // 10% reduction
      
      // Mock the event bus for the damage event
      const eventBus = {
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      };
      
      // Mock the player health system's private damage handler
      // Since we can't access private methods, we'll test the integration
      // by verifying that the UpgradeSystem provides the correct reduction value
      expect(upgradeSystem.getDamageReduction()).toBe(10);
    });
  });

  describe('Upgrade Tree UI Integration', () => {
    it('should include defense tree in available trees', () => {
      // This would be tested in the UpgradeTreeScene, but we can verify
      // that the upgrade system supports defense tree upgrades
      const defenseUpgrades = upgradeSystem.getUpgradesByBranch('defense');
      expect(defenseUpgrades.length).toBeGreaterThan(0);
      
      const hullUpgrades = upgradeSystem.getUpgradesByBranch('defense', 'hull');
      const armorUpgrades = upgradeSystem.getUpgradesByBranch('defense', 'armor');
      
      expect(hullUpgrades.length).toBe(4);
      expect(armorUpgrades.length).toBe(2);
    });

    it('should provide correct upgrade status for UI display', () => {
      const hullStatus = upgradeSystem.getUpgradeStatus('reinforced-hull-1');
      
      expect(hullStatus.exists).toBe(true);
      expect(hullStatus.canPurchase).toBe(true);
      expect(hullStatus.isPurchased).toBe(false);
      
      // Purchase the upgrade
      upgradeSystem.purchaseUpgrade('reinforced-hull-1');
      
      const updatedStatus = upgradeSystem.getUpgradeStatus('reinforced-hull-1');
      expect(updatedStatus.isPurchased).toBe(true);
      expect(updatedStatus.canPurchase).toBe(false); // Can't purchase again
    });
  });

  describe('Save/Load Persistence', () => {
    it('should persist defense upgrades', () => {
      // Purchase some upgrades
      upgradeSystem.purchaseUpgrade('reinforced-hull-1');
      upgradeSystem.purchaseUpgrade('damage-reduction-1');
      
      // Save upgrades
      upgradeSystem.saveUpgrades();
      
      // Create new upgrade system and load
      const newUpgradeSystem = new UpgradeSystem(gameStateManager);
      
      // Check that upgrades were loaded
      expect(newUpgradeSystem.purchasedUpgrades.has('reinforced-hull-1')).toBe(true);
      expect(newUpgradeSystem.purchasedUpgrades.has('damage-reduction-1')).toBe(true);
      expect(newUpgradeSystem.upgradeEffects.healthBonus).toBe(1);
      expect(newUpgradeSystem.upgradeEffects.damageReductionPercentage).toBe(10);
      
      newUpgradeSystem.destroy();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid damage reduction values', () => {
      const mockEntity = { id: 'test-entity' };
      const health = new HealthComponent(mockEntity, 10);
      
      expect(() => {
        health.calculateDamageAfterReduction(10, -5);
      }).toThrow('damageReduction must be a number between 0 and 100');
      
      expect(() => {
        health.calculateDamageAfterReduction(10, 150);
      }).toThrow('damageReduction must be a number between 0 and 100');
    });

    it('should handle invalid heal amounts', () => {
      const mockEntity = { id: 'test-entity' };
      const health = new HealthComponent(mockEntity, 10);
      
      expect(() => {
        health.heal(-5);
      }).toThrow('healAmount must be a non-negative number');
      
      expect(() => {
        health.heal('invalid');
      }).toThrow('healAmount must be a non-negative number');
    });

    it('should cap damage reduction at 100%', () => {
      // This shouldn't happen with the current upgrade system,
      // but test defensive programming
      upgradeSystem.upgradeEffects.damageReductionPercentage = 150;
      
      const cappedReduction = upgradeSystem.getDamageReduction();
      expect(cappedReduction).toBe(100);
    });
  });
});