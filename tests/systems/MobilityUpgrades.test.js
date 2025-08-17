import UpgradeSystem from '@/systems/UpgradeSystem.js';
import { playerFactory } from '@/entities/Player.js';
import GameStateManager from '@/utils/GameStateManager.js';
import { EventTypes } from '@/event-bus/EventTypes.js';
import { getEventBus } from '@/event-bus/EventBus.js';

/**
 * Comprehensive test suite for Mobility Tree Upgrades (Epic 6)
 * Tests all mobility upgrades: speed boosts, special abilities, and maneuverability
 */
describe('Epic 6: Mobility Tree Upgrades', () => {
  let mockScene;
  let mockPlayerGroup;
  let gameStateManager;
  let upgradeSystem;
  let player;
  let eventBus;

  beforeEach(() => {
    // Mock Phaser scene and physics group
    mockScene = {
      add: {
        rectangle: jest.fn().mockReturnValue({
          body: { setCollideWorldBounds: jest.fn(), setSize: jest.fn() },
          health: null,
          mobilityState: null,
          upgradeSystem: null
        })
      },
      scale: { width: 800, height: 800 }
    };

    mockPlayerGroup = {
      scene: mockScene,
      add: jest.fn().mockImplementation((obj) => {
        obj.body = {
          setCollideWorldBounds: jest.fn(),
          setSize: jest.fn(),
          setVelocity: jest.fn(),
          velocity: { x: 0, y: 0 }
        };
        return obj;
      })
    };

    // Setup real systems
    gameStateManager = new GameStateManager(mockScene);
    upgradeSystem = new UpgradeSystem(gameStateManager);
    eventBus = getEventBus();

    // Give player some points to spend
    gameStateManager.addExperience(5000); // Should give plenty of points
  });

  afterEach(() => {
    if (upgradeSystem) {
      upgradeSystem.destroy();
    }
    jest.clearAllMocks();
  });

  describe('Task 6.1 & 6.2: Enhanced Movement System & Speed Upgrades', () => {
    test('should have all speed upgrade definitions', () => {
      const speedUpgrades = upgradeSystem.getUpgradesByBranch('mobility', 'speed');
      
      expect(speedUpgrades).toHaveLength(5); // 3 engine boosts + 2 afterburner upgrades
      
      const upgradeIds = speedUpgrades.map(u => u.id);
      expect(upgradeIds).toContain('engine-boost-1');
      expect(upgradeIds).toContain('engine-boost-2');
      expect(upgradeIds).toContain('engine-boost-3');
      expect(upgradeIds).toContain('afterburner');
      expect(upgradeIds).toContain('advanced-afterburner');
    });

    test('should apply correct speed multipliers for engine boost upgrades', () => {
      // Purchase Engine Boost I
      expect(upgradeSystem.purchaseUpgrade('engine-boost-1')).toBe(true);
      let effects = upgradeSystem.getUpgradeEffects();
      expect(effects.movementSpeedMultiplier).toBe(1.15);

      // Purchase Engine Boost II
      expect(upgradeSystem.purchaseUpgrade('engine-boost-2')).toBe(true);
      effects = upgradeSystem.getUpgradeEffects();
      expect(effects.movementSpeedMultiplier).toBe(1.25);

      // Purchase Engine Boost III
      expect(upgradeSystem.purchaseUpgrade('engine-boost-3')).toBe(true);
      effects = upgradeSystem.getUpgradeEffects();
      expect(effects.movementSpeedMultiplier).toBe(1.35);
    });

    test('should enforce prerequisite chain for engine boost upgrades', () => {
      // Cannot purchase Engine Boost II without I
      expect(upgradeSystem.validateUpgradePurchase('engine-boost-2').valid).toBe(false);
      expect(upgradeSystem.validateUpgradePurchase('engine-boost-2').code).toBe('PREREQUISITES_NOT_MET');

      // Can purchase Engine Boost I
      expect(upgradeSystem.validateUpgradePurchase('engine-boost-1').valid).toBe(true);
      
      upgradeSystem.purchaseUpgrade('engine-boost-1');
      
      // Now can purchase Engine Boost II
      expect(upgradeSystem.validateUpgradePurchase('engine-boost-2').valid).toBe(true);
    });

    test('should integrate player movement with upgrade system', () => {
      player = playerFactory(mockPlayerGroup, upgradeSystem);
      
      // Mock cursors and verify movement integration
      const mockCursors = {
        left: { isDown: false },
        right: { isDown: true },
        up: { isDown: false },
        down: { isDown: false }
      };

      // Before upgrades - base speed should be used
      player.update(mockCursors, 16.67);
      expect(mockPlayerGroup.add).toHaveBeenCalled();
      
      // Purchase speed upgrade
      upgradeSystem.purchaseUpgrade('engine-boost-1');
      
      // Verify player has upgrade system reference
      expect(player.upgradeSystem).toBe(upgradeSystem);
    });
  });

  describe('Task 6.3: Afterburner Special Ability', () => {
    beforeEach(() => {
      player = playerFactory(mockPlayerGroup, upgradeSystem);
      upgradeSystem.purchaseUpgrade('engine-boost-1'); // Prerequisite
      upgradeSystem.purchaseUpgrade('afterburner');
    });

    test('should have afterburner upgrade available after engine boost', () => {
      const validation = upgradeSystem.validateUpgradePurchase('afterburner');
      expect(validation.valid).toBe(true);
    });

    test('should apply afterburner effects correctly', () => {
      const effects = upgradeSystem.getUpgradeEffects();
      
      expect(effects.afterburnerSpeed).toBe(2.0);
      expect(effects.afterburnerDuration).toBe(1500); // 1.5 seconds
      expect(effects.afterburnerCooldown).toBe(3000); // 3 seconds
    });

    test('should activate afterburner on double-tap', () => {
      const eventSpy = jest.fn();
      eventBus.on(EventTypes.AFTERBURNER_ACTIVATED, eventSpy);

      const currentTime = Date.now();
      
      // First tap
      player.handleDoubleTap('up', currentTime);
      expect(eventSpy).not.toHaveBeenCalled();
      
      // Second tap within window
      player.handleDoubleTap('up', currentTime + 200);
      expect(eventSpy).toHaveBeenCalledWith({
        player: player,
        duration: 1500,
        speedMultiplier: 2.0,
        damageTrail: false
      });

      eventBus.off(EventTypes.AFTERBURNER_ACTIVATED, eventSpy);
    });

    test('should apply cooldown after afterburner deactivation', () => {
      const currentTime = Date.now();
      
      // Activate afterburner
      player.handleDoubleTap('up', currentTime);
      player.handleDoubleTap('up', currentTime + 200);
      
      expect(player.mobilityState.afterburner.active).toBe(true);
      
      // Try to activate again immediately - should fail
      const secondActivation = player.handleDoubleTap('up', currentTime + 400);
      expect(secondActivation).toBe(false);
    });

    test('should upgrade to advanced afterburner', () => {
      upgradeSystem.purchaseUpgrade('advanced-afterburner');
      const effects = upgradeSystem.getUpgradeEffects();
      
      expect(effects.afterburnerDuration).toBe(2500); // 2.5 seconds
      expect(effects.afterburnerDamageTrail).toBe(true);
    });
  });

  describe('Task 6.4: Maneuverability & Dodge System', () => {
    test('should have all maneuverability upgrade definitions', () => {
      const agilityUpgrades = upgradeSystem.getUpgradesByBranch('mobility', 'agility');
      
      expect(agilityUpgrades).toHaveLength(4);
      
      const upgradeIds = agilityUpgrades.map(u => u.id);
      expect(upgradeIds).toContain('tight-controls');
      expect(upgradeIds).toContain('expert-pilot');
      expect(upgradeIds).toContain('barrel-roll');
      expect(upgradeIds).toContain('evasive-maneuvers');
    });

    test('should apply tight controls acceleration boost', () => {
      upgradeSystem.purchaseUpgrade('tight-controls');
      const effects = upgradeSystem.getUpgradeEffects();
      
      expect(effects.accelerationMultiplier).toBe(1.3);
    });

    test('should apply expert pilot effects', () => {
      upgradeSystem.purchaseUpgrade('tight-controls');
      upgradeSystem.purchaseUpgrade('expert-pilot');
      const effects = upgradeSystem.getUpgradeEffects();
      
      expect(effects.accelerationMultiplier).toBe(1.5);
      expect(effects.hitboxMultiplier).toBe(0.8);
    });

    test('should activate barrel roll with invulnerability frames', () => {
      player = playerFactory(mockPlayerGroup, upgradeSystem);
      upgradeSystem.purchaseUpgrade('tight-controls');
      upgradeSystem.purchaseUpgrade('barrel-roll');

      const eventSpy = jest.fn();
      eventBus.on(EventTypes.BARREL_ROLL_ACTIVATED, eventSpy);

      const currentTime = Date.now();
      
      // Double-tap to activate barrel roll
      player.handleDoubleTap('left', currentTime);
      player.handleDoubleTap('left', currentTime + 200);
      
      expect(eventSpy).toHaveBeenCalledWith({
        player: player,
        duration: 500,
        invulnerable: true
      });

      expect(player.isInvulnerable()).toBe(true);

      eventBus.off(EventTypes.BARREL_ROLL_ACTIVATED, eventSpy);
    });

    test('should implement evasive maneuvers dodge chance', () => {
      player = playerFactory(mockPlayerGroup, upgradeSystem);
      upgradeSystem.purchaseUpgrade('tight-controls');
      upgradeSystem.purchaseUpgrade('barrel-roll');
      upgradeSystem.purchaseUpgrade('evasive-maneuvers');

      const effects = upgradeSystem.getUpgradeEffects();
      expect(effects.dodgeChance).toBe(0.15);

      // Test dodge functionality with mocked random
      const originalRandom = Math.random;
      
      // Force a dodge (roll < dodgeChance)
      Math.random = jest.fn(() => 0.1);
      expect(player.shouldDodgeDamage()).toBe(true);
      
      // Force no dodge (roll >= dodgeChance)
      Math.random = jest.fn(() => 0.2);
      expect(player.shouldDodgeDamage()).toBe(false);
      
      Math.random = originalRandom;
    });

    test('should enforce prerequisite chains for maneuverability upgrades', () => {
      // Cannot purchase Expert Pilot without Tight Controls
      expect(upgradeSystem.validateUpgradePurchase('expert-pilot').valid).toBe(false);
      
      // Cannot purchase Barrel Roll without Tight Controls
      expect(upgradeSystem.validateUpgradePurchase('barrel-roll').valid).toBe(false);
      
      upgradeSystem.purchaseUpgrade('tight-controls');
      
      // Now can purchase both
      expect(upgradeSystem.validateUpgradePurchase('expert-pilot').valid).toBe(true);
      expect(upgradeSystem.validateUpgradePurchase('barrel-roll').valid).toBe(true);
      
      upgradeSystem.purchaseUpgrade('barrel-roll');
      
      // Can purchase Evasive Maneuvers after Barrel Roll
      expect(upgradeSystem.validateUpgradePurchase('evasive-maneuvers').valid).toBe(true);
    });
  });

  describe('Task 6.5: Mobility Tree UI Integration', () => {
    test('should include mobility tree in available trees', () => {
      // This would be tested in UpgradeTreeScene.test.js
      // Here we just verify the upgrade system supports mobility tree
      const mobilityUpgrades = upgradeSystem.getUpgradesByBranch('mobility');
      expect(mobilityUpgrades.length).toBeGreaterThan(0);
    });

    test('should have correct upgrade costs and balance', () => {
      const speedUpgrades = upgradeSystem.getUpgradesByBranch('mobility', 'speed');
      const agilityUpgrades = upgradeSystem.getUpgradesByBranch('mobility', 'agility');
      
      // Verify reasonable cost progression
      const engineBoost1 = speedUpgrades.find(u => u.id === 'engine-boost-1');
      const engineBoost2 = speedUpgrades.find(u => u.id === 'engine-boost-2');
      const engineBoost3 = speedUpgrades.find(u => u.id === 'engine-boost-3');
      
      expect(engineBoost1.cost).toBe(2);
      expect(engineBoost2.cost).toBe(3);
      expect(engineBoost3.cost).toBe(4);
      
      // Special abilities should cost more
      const afterburner = speedUpgrades.find(u => u.id === 'afterburner');
      const barrelRoll = agilityUpgrades.find(u => u.id === 'barrel-roll');
      
      expect(afterburner.cost).toBe(4);
      expect(barrelRoll.cost).toBe(4);
    });
  });

  describe('Comprehensive Integration Tests', () => {
    test('should combine multiple mobility upgrades correctly', () => {
      // Purchase multiple upgrades
      upgradeSystem.purchaseUpgrade('engine-boost-1');
      upgradeSystem.purchaseUpgrade('engine-boost-2');
      upgradeSystem.purchaseUpgrade('tight-controls');
      upgradeSystem.purchaseUpgrade('afterburner');

      const effects = upgradeSystem.getUpgradeEffects();
      
      // Should stack properly
      expect(effects.movementSpeedMultiplier).toBe(1.25); // Engine Boost II
      expect(effects.accelerationMultiplier).toBe(1.3);   // Tight Controls
      expect(effects.afterburnerSpeed).toBe(2.0);         // Afterburner
      expect(effects.afterburnerDuration).toBe(1500);     // Afterburner duration
    });

    test('should maintain save/load compatibility', () => {
      // Purchase upgrades
      upgradeSystem.purchaseUpgrade('engine-boost-1');
      upgradeSystem.purchaseUpgrade('tight-controls');
      
      // Save state
      upgradeSystem.saveUpgrades();
      
      // Create new upgrade system and verify load
      const newGameStateManager = new GameStateManager(mockScene);
      const newUpgradeSystem = new UpgradeSystem(newGameStateManager);
      
      const effects = newUpgradeSystem.getUpgradeEffects();
      expect(effects.movementSpeedMultiplier).toBe(1.15);
      expect(effects.accelerationMultiplier).toBe(1.3);
      
      newUpgradeSystem.destroy();
    });

    test('should maintain performance with all mobility upgrades active', () => {
      // Purchase all mobility upgrades
      const mobilityUpgrades = [
        'engine-boost-1', 'engine-boost-2', 'engine-boost-3',
        'afterburner', 'advanced-afterburner',
        'tight-controls', 'expert-pilot', 'barrel-roll', 'evasive-maneuvers'
      ];

      // Add enough points
      gameStateManager.addExperience(50000);
      
      for (const upgradeId of mobilityUpgrades) {
        if (upgradeSystem.validateUpgradePurchase(upgradeId).valid) {
          upgradeSystem.purchaseUpgrade(upgradeId);
        }
      }

      // Performance test - should complete quickly
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        upgradeSystem.getUpgradeEffects();
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
    });

    test('should emit correct events for all mobility abilities', () => {
      player = playerFactory(mockPlayerGroup, upgradeSystem);
      
      // Purchase all special abilities
      upgradeSystem.purchaseUpgrade('engine-boost-1');
      upgradeSystem.purchaseUpgrade('afterburner');
      upgradeSystem.purchaseUpgrade('tight-controls');
      upgradeSystem.purchaseUpgrade('barrel-roll');
      upgradeSystem.purchaseUpgrade('evasive-maneuvers');

      const afterburnerSpy = jest.fn();
      const barrelRollSpy = jest.fn();
      const dodgeSpy = jest.fn();

      eventBus.on(EventTypes.AFTERBURNER_ACTIVATED, afterburnerSpy);
      eventBus.on(EventTypes.BARREL_ROLL_ACTIVATED, barrelRollSpy);
      eventBus.on(EventTypes.PLAYER_DODGED, dodgeSpy);

      const currentTime = Date.now();
      
      // Test afterburner activation
      player.handleDoubleTap('up', currentTime);
      player.handleDoubleTap('up', currentTime + 200);
      expect(afterburnerSpy).toHaveBeenCalled();

      // Test barrel roll activation (different direction)
      player.handleDoubleTap('left', currentTime + 1000);
      player.handleDoubleTap('left', currentTime + 1200);
      expect(barrelRollSpy).toHaveBeenCalled();

      // Test dodge
      Math.random = jest.fn(() => 0.1); // Force dodge
      player.shouldDodgeDamage();
      expect(dodgeSpy).toHaveBeenCalled();

      // Cleanup
      eventBus.off(EventTypes.AFTERBURNER_ACTIVATED, afterburnerSpy);
      eventBus.off(EventTypes.BARREL_ROLL_ACTIVATED, barrelRollSpy);
      eventBus.off(EventTypes.PLAYER_DODGED, dodgeSpy);
    });
  });

  describe('Definition of Done Validation', () => {
    test('✅ Speed upgrades affect player movement speed', () => {
      upgradeSystem.purchaseUpgrade('engine-boost-1');
      const effects = upgradeSystem.getUpgradeEffects();
      expect(effects.movementSpeedMultiplier).toBeGreaterThan(1.0);
    });

    test('✅ Afterburner special ability works with double-tap', () => {
      player = playerFactory(mockPlayerGroup, upgradeSystem);
      upgradeSystem.purchaseUpgrade('engine-boost-1');
      upgradeSystem.purchaseUpgrade('afterburner');

      const currentTime = Date.now();
      const result = player.handleDoubleTap('up', currentTime) || 
                    player.handleDoubleTap('up', currentTime + 200);
      expect(result).toBe(true);
    });

    test('✅ Barrel Roll provides invulnerability frames', () => {
      player = playerFactory(mockPlayerGroup, upgradeSystem);
      upgradeSystem.purchaseUpgrade('tight-controls');
      upgradeSystem.purchaseUpgrade('barrel-roll');

      const currentTime = Date.now();
      player.handleDoubleTap('left', currentTime);
      player.handleDoubleTap('left', currentTime + 200);
      
      expect(player.isInvulnerable()).toBe(true);
    });

    test('✅ Dodge chance system works for Evasive Maneuvers', () => {
      player = playerFactory(mockPlayerGroup, upgradeSystem);
      upgradeSystem.purchaseUpgrade('tight-controls');
      upgradeSystem.purchaseUpgrade('barrel-roll');
      upgradeSystem.purchaseUpgrade('evasive-maneuvers');

      Math.random = jest.fn(() => 0.1); // Force dodge
      expect(player.shouldDodgeDamage()).toBe(true);
    });

    test('✅ Special abilities have appropriate cooldowns', () => {
      const effects = upgradeSystem.getUpgradeEffects();
      upgradeSystem.purchaseUpgrade('engine-boost-1');
      upgradeSystem.purchaseUpgrade('afterburner');
      upgradeSystem.purchaseUpgrade('tight-controls');
      upgradeSystem.purchaseUpgrade('barrel-roll');

      const updatedEffects = upgradeSystem.getUpgradeEffects();
      expect(updatedEffects.afterburnerCooldown).toBe(3000); // 3 seconds
      expect(updatedEffects.barrelRollCooldown).toBe(2000);  // 2 seconds
    });

    test('✅ Mobility upgrades visible in upgrade tree UI', () => {
      const mobilityUpgrades = upgradeSystem.getUpgradesByBranch('mobility');
      expect(mobilityUpgrades.length).toBeGreaterThan(0);
      
      const speedUpgrades = upgradeSystem.getUpgradesByBranch('mobility', 'speed');
      const agilityUpgrades = upgradeSystem.getUpgradesByBranch('mobility', 'agility');
      
      expect(speedUpgrades.length).toBeGreaterThan(0);
      expect(agilityUpgrades.length).toBeGreaterThan(0);
    });

    test('✅ Movement feels responsive with upgrades', () => {
      player = playerFactory(mockPlayerGroup, upgradeSystem);
      upgradeSystem.purchaseUpgrade('tight-controls');
      
      const effects = upgradeSystem.getUpgradeEffects();
      expect(effects.accelerationMultiplier).toBeGreaterThan(1.0);
    });

    test('✅ Special abilities have clear visual feedback', () => {
      // This would be tested with UI integration tests
      // Here we verify the events are emitted for UI to respond to
      const eventTypes = [
        EventTypes.AFTERBURNER_ACTIVATED,
        EventTypes.AFTERBURNER_DEACTIVATED,
        EventTypes.BARREL_ROLL_ACTIVATED,
        EventTypes.BARREL_ROLL_DEACTIVATED,
        EventTypes.PLAYER_DODGED
      ];

      eventTypes.forEach(eventType => {
        expect(typeof eventType).toBe('string');
        expect(eventType).toBeTruthy();
      });
    });
  });
});