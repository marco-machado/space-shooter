import { getEventBus } from '@/event-bus/EventBus.js';
import { EventPriority, EventTypes } from '@/event-bus/EventTypes.js';
import Logger from '@/utils/Logger.js';

/**
 * Upgrade System
 * @class
 * @classdesc Manages upgrade trees, prerequisites, validation, and effects application.
 * Provides a comprehensive upgrade system with prerequisite validation, effect calculation,
 * and integration with the EventBus for reactive state management.
 */
class UpgradeSystem {
  // Private fields
  #logger;
  #eventBus;
  #saveKey = 'space-shooter-upgrades';

  /**
   * Create a new UpgradeSystem instance
   * @param {GameStateManager} gameStateManager - Reference to the game state manager
   */
  constructor(gameStateManager) {
    if (!gameStateManager) {
      throw new TypeError('gameStateManager is required');
    }

    this.#logger = Logger.scope('UpgradeSystem');
    this.#eventBus = getEventBus();
    this.gameStateManager = gameStateManager;

    // Upgrade state
    this.purchasedUpgrades = new Map(); // upgradeId -> { level, purchaseDate }
    this.upgradeEffects = {
      // Weapon effects
      weaponDamageMultiplier: 1.0,
      weaponSpeedMultiplier: 1.0,
      weaponFireRateMultiplier: 1.0,
      weaponPiercing: 0,
      weaponMultishot: 1,
      weaponSpreadPattern: false,
      
      // Plasma weapon effects
      plasmaExplosionRadius: 0,
      plasmaChainReaction: false,
      plasmaOverchargeChance: 0,
      
      // Missile weapon effects
      missileTrackingEnabled: false,
      missileTrackingRange: 0,
      missileClusterBombs: 0,
      missileMIRVWarheads: 0,
      
      // Universal weapon effects (affects ALL weapon types)
      weaponCoolingMultiplier: 1.0,
      weaponHeatCapacityMultiplier: 1.0,
      weaponOverheatThreshold: 100,
      
      // Defense effects
      healthMultiplier: 1.0,
      healthBonus: 0, // Flat health bonus from hull upgrades
      damageReductionPercentage: 0,
      shieldCapacity: 0,
      shieldRegenRate: 1.0,
      shieldRegenDelay: 3000, // milliseconds before shield starts regenerating
      shieldBurstDamage: 0,
      shieldBurstRadius: 0,
      
      // Mobility effects
      movementSpeedMultiplier: 1.0,
      accelerationMultiplier: 1.0,
      hitboxMultiplier: 1.0,
      
      // Special abilities
      afterburnerSpeed: 1.0,
      afterburnerDuration: 0,
      afterburnerCooldown: 0,
      afterburnerDamageTrail: false,
      barrelRollDuration: 0,
      barrelRollCooldown: 0,
      invulnerabilityFrames: false,
      dodgeChance: 0,
    };

    // Heat tracking for weapon overheating system
    this.weaponHeat = 0;
    this.weaponOverheated = false;
    this.lastCooldownTime = 0;

    // Initialize upgrade definitions
    this.initializeUpgradeDefinitions();

    // Load saved upgrades
    this.loadUpgrades();
  }

  /**
   * Initialize all upgrade tree definitions with prerequisites and effects
   * @private
   * @returns {void}
   */
  initializeUpgradeDefinitions() {
    this.upgradeDefinitions = {
      // Laser Branch Upgrades
      'laser-damage-1': {
        id: 'laser-damage-1',
        name: 'Laser Damage I',
        description: '+20% laser damage',
        cost: 2,
        tree: 'weapons',
        branch: 'laser',
        prerequisites: [],
        maxLevel: 1,
        effects: {
          weaponDamageMultiplier: 1.2
        }
      },
      'laser-damage-2': {
        id: 'laser-damage-2',
        name: 'Laser Damage II',
        description: '+30% laser damage',
        cost: 3,
        tree: 'weapons',
        branch: 'laser',
        prerequisites: ['laser-damage-1'],
        maxLevel: 1,
        effects: {
          weaponDamageMultiplier: 1.3
        }
      },
      'laser-damage-3': {
        id: 'laser-damage-3',
        name: 'Laser Damage III',
        description: '+40% laser damage',
        cost: 5,
        tree: 'weapons',
        branch: 'laser',
        prerequisites: ['laser-damage-2'],
        maxLevel: 1,
        effects: {
          weaponDamageMultiplier: 1.4
        }
      },
      'twin-lasers': {
        id: 'twin-lasers',
        name: 'Twin Lasers',
        description: 'Fire 2 parallel laser beams',
        cost: 4,
        tree: 'weapons',
        branch: 'laser',
        prerequisites: ['laser-damage-1'],
        maxLevel: 1,
        effects: {
          weaponMultishot: 2
        }
      },
      'triple-threat': {
        id: 'triple-threat',
        name: 'Triple Threat',
        description: 'Fire 3 laser beams in spread pattern',
        cost: 6,
        tree: 'weapons',
        branch: 'laser',
        prerequisites: ['twin-lasers'],
        maxLevel: 1,
        effects: {
          weaponMultishot: 3,
          weaponSpreadPattern: true
        }
      },
      'laser-velocity': {
        id: 'laser-velocity',
        name: 'Laser Velocity',
        description: '+50% laser projectile speed',
        cost: 3,
        tree: 'weapons',
        branch: 'laser',
        prerequisites: [],
        maxLevel: 1,
        effects: {
          weaponSpeedMultiplier: 1.5
        }
      },
      'piercing-shots': {
        id: 'piercing-shots',
        name: 'Piercing Shots',
        description: 'Lasers pierce through 2 enemies',
        cost: 5,
        tree: 'weapons',
        branch: 'laser',
        prerequisites: ['laser-damage-2'],
        maxLevel: 1,
        effects: {
          weaponPiercing: 2
        }
      },

      // Plasma Branch Upgrades
      'plasma-core-1': {
        id: 'plasma-core-1',
        name: 'Plasma Core I',
        description: '+25% plasma damage',
        cost: 2,
        tree: 'weapons',
        branch: 'plasma',
        prerequisites: [],
        maxLevel: 1,
        effects: {
          weaponDamageMultiplier: 1.25
        }
      },
      'plasma-core-2': {
        id: 'plasma-core-2',
        name: 'Plasma Core II',
        description: '+40% plasma damage',
        cost: 3,
        tree: 'weapons',
        branch: 'plasma',
        prerequisites: ['plasma-core-1'],
        maxLevel: 1,
        effects: {
          weaponDamageMultiplier: 1.4
        }
      },
      'plasma-core-3': {
        id: 'plasma-core-3',
        name: 'Plasma Core III',
        description: '+60% plasma damage',
        cost: 5,
        tree: 'weapons',
        branch: 'plasma',
        prerequisites: ['plasma-core-2'],
        maxLevel: 1,
        effects: {
          weaponDamageMultiplier: 1.6
        }
      },
      'blast-radius-1': {
        id: 'blast-radius-1',
        name: 'Blast Radius I',
        description: 'Small explosion radius (40 pixels) on plasma impact',
        cost: 3,
        tree: 'weapons',
        branch: 'plasma',
        prerequisites: ['plasma-core-1'],
        maxLevel: 1,
        effects: {
          plasmaExplosionRadius: 40
        }
      },
      'blast-radius-2': {
        id: 'blast-radius-2',
        name: 'Blast Radius II',
        description: 'Larger explosion radius (60 pixels) on plasma impact',
        cost: 4,
        tree: 'weapons',
        branch: 'plasma',
        prerequisites: ['blast-radius-1'],
        maxLevel: 1,
        effects: {
          plasmaExplosionRadius: 60
        }
      },
      'chain-reaction': {
        id: 'chain-reaction',
        name: 'Chain Reaction',
        description: 'Plasma explosions can trigger secondary explosions',
        cost: 6,
        tree: 'weapons',
        branch: 'plasma',
        prerequisites: ['blast-radius-2'],
        maxLevel: 1,
        effects: {
          plasmaChainReaction: true
        }
      },
      'overcharge': {
        id: 'overcharge',
        name: 'Overcharge',
        description: '15% chance for critical hits with double damage',
        cost: 5,
        tree: 'weapons',
        branch: 'plasma',
        prerequisites: ['plasma-core-2'],
        maxLevel: 1,
        effects: {
          plasmaOverchargeChance: 0.15
        }
      },

      // Missile Branch Upgrades
      'missile-bay-1': {
        id: 'missile-bay-1',
        name: 'Missile Bay I',
        description: '+30% missile damage',
        cost: 2,
        tree: 'weapons',
        branch: 'missile',
        prerequisites: [],
        maxLevel: 1,
        effects: {
          weaponDamageMultiplier: 1.3
        }
      },
      'missile-bay-2': {
        id: 'missile-bay-2',
        name: 'Missile Bay II',
        description: '+50% missile damage',
        cost: 3,
        tree: 'weapons',
        branch: 'missile',
        prerequisites: ['missile-bay-1'],
        maxLevel: 1,
        effects: {
          weaponDamageMultiplier: 1.5
        }
      },
      'missile-bay-3': {
        id: 'missile-bay-3',
        name: 'Missile Bay III',
        description: '+75% missile damage',
        cost: 5,
        tree: 'weapons',
        branch: 'missile',
        prerequisites: ['missile-bay-2'],
        maxLevel: 1,
        effects: {
          weaponDamageMultiplier: 1.75
        }
      },
      'homing-system': {
        id: 'homing-system',
        name: 'Homing System',
        description: 'Missiles track nearest enemy within 200 pixels',
        cost: 4,
        tree: 'weapons',
        branch: 'missile',
        prerequisites: ['missile-bay-1'],
        maxLevel: 1,
        effects: {
          missileTrackingEnabled: true,
          missileTrackingRange: 200
        }
      },
      'advanced-targeting': {
        id: 'advanced-targeting',
        name: 'Advanced Targeting',
        description: 'Improved tracking range (300 pixels) and turning speed',
        cost: 5,
        tree: 'weapons',
        branch: 'missile',
        prerequisites: ['homing-system'],
        maxLevel: 1,
        effects: {
          missileTrackingEnabled: true,
          missileTrackingRange: 300
        }
      },
      'cluster-bombs': {
        id: 'cluster-bombs',
        name: 'Cluster Bombs',
        description: 'Missiles split into 3 smaller projectiles on impact',
        cost: 6,
        tree: 'weapons',
        branch: 'missile',
        prerequisites: ['missile-bay-2'],
        maxLevel: 1,
        effects: {
          missileClusterBombs: 3
        }
      },
      'mirv-warheads': {
        id: 'mirv-warheads',
        name: 'MIRV Warheads',
        description: 'Missiles split into 5 homing submunitions before impact',
        cost: 8,
        tree: 'weapons',
        branch: 'missile',
        prerequisites: ['cluster-bombs', 'advanced-targeting'],
        maxLevel: 1,
        effects: {
          missileMIRVWarheads: 5
        }
      },

      // Universal Tree Upgrades - Heat Sink System
      'heat-sink-1': {
        id: 'heat-sink-1',
        name: 'Heat Sink I',
        description: '+20% weapon cooling rate, +10% heat capacity',
        cost: 3,
        tree: 'universal',
        branch: 'thermal',
        prerequisites: [],
        maxLevel: 1,
        effects: {
          weaponCoolingMultiplier: 1.2,
          weaponHeatCapacityMultiplier: 1.1
        }
      },
      'heat-sink-2': {
        id: 'heat-sink-2',
        name: 'Heat Sink II',
        description: '+35% weapon cooling rate, +20% heat capacity',
        cost: 4,
        tree: 'universal',
        branch: 'thermal',
        prerequisites: ['heat-sink-1'],
        maxLevel: 1,
        effects: {
          weaponCoolingMultiplier: 1.35,
          weaponHeatCapacityMultiplier: 1.2
        }
      },
      'heat-sink-3': {
        id: 'heat-sink-3',
        name: 'Heat Sink III',
        description: '+50% weapon cooling rate, +30% heat capacity',
        cost: 6,
        tree: 'universal',
        branch: 'thermal',
        prerequisites: ['heat-sink-2'],
        maxLevel: 1,
        effects: {
          weaponCoolingMultiplier: 1.5,
          weaponHeatCapacityMultiplier: 1.3
        }
      },

      // Universal Tree Upgrades - Rapid Fire System
      'rapid-fire': {
        id: 'rapid-fire',
        name: 'Rapid Fire',
        description: '+15% fire rate for all weapons',
        cost: 3,
        tree: 'universal',
        branch: 'firing',
        prerequisites: [],
        maxLevel: 1,
        effects: {
          weaponFireRateMultiplier: 1.15
        }
      },
      'ammunition-expert': {
        id: 'ammunition-expert',
        name: 'Ammunition Expert',
        description: '+25% fire rate for all weapons',
        cost: 5,
        tree: 'universal',
        branch: 'firing',
        prerequisites: ['rapid-fire'],
        maxLevel: 1,
        effects: {
          weaponFireRateMultiplier: 1.25
        }
      },

      // Defense Tree - Hull Branch Upgrades
      'reinforced-hull-1': {
        id: 'reinforced-hull-1',
        name: 'Reinforced Hull I',
        description: '+1 maximum health',
        cost: 2,
        tree: 'defense',
        branch: 'hull',
        prerequisites: [],
        maxLevel: 1,
        effects: {
          healthBonus: 1
        }
      },
      'reinforced-hull-2': {
        id: 'reinforced-hull-2',
        name: 'Reinforced Hull II',
        description: '+2 maximum health',
        cost: 3,
        tree: 'defense',
        branch: 'hull',
        prerequisites: ['reinforced-hull-1'],
        maxLevel: 1,
        effects: {
          healthBonus: 2
        }
      },
      'reinforced-hull-3': {
        id: 'reinforced-hull-3',
        name: 'Reinforced Hull III',
        description: '+3 maximum health',
        cost: 4,
        tree: 'defense',
        branch: 'hull',
        prerequisites: ['reinforced-hull-2'],
        maxLevel: 1,
        effects: {
          healthBonus: 3
        }
      },
      'titanium-plating': {
        id: 'titanium-plating',
        name: 'Titanium Plating',
        description: '+5 maximum health',
        cost: 6,
        tree: 'defense',
        branch: 'hull',
        prerequisites: ['reinforced-hull-3'],
        maxLevel: 1,
        effects: {
          healthBonus: 5
        }
      },

      // Defense Tree - Damage Reduction Branch
      'damage-reduction-1': {
        id: 'damage-reduction-1',
        name: 'Damage Reduction I',
        description: '10% damage reduction',
        cost: 3,
        tree: 'defense',
        branch: 'armor',
        prerequisites: [],
        maxLevel: 1,
        effects: {
          damageReductionPercentage: 10
        }
      },
      'damage-reduction-2': {
        id: 'damage-reduction-2',
        name: 'Damage Reduction II',
        description: '20% damage reduction (replaces Damage Reduction I)',
        cost: 5,
        tree: 'defense',
        branch: 'armor',
        prerequisites: ['damage-reduction-1'],
        maxLevel: 1,
        effects: {
          damageReductionPercentage: 20
        }
      },

      // Defense Tree - Shield Branch Upgrades
      'shield-generator-1': {
        id: 'shield-generator-1',
        name: 'Shield Generator I',
        description: '50 shield capacity, regenerates after 3 seconds',
        cost: 3,
        tree: 'defense',
        branch: 'shields',
        prerequisites: [],
        maxLevel: 1,
        effects: {
          shieldCapacity: 50,
          shieldRegenRate: 10, // shields per second
          shieldRegenDelay: 3000 // milliseconds
        }
      },
      'shield-generator-2': {
        id: 'shield-generator-2',
        name: 'Shield Generator II',
        description: '100 shield capacity with improved regeneration',
        cost: 4,
        tree: 'defense',
        branch: 'shields',
        prerequisites: ['shield-generator-1'],
        maxLevel: 1,
        effects: {
          shieldCapacity: 100,
          shieldRegenRate: 15, // shields per second
          shieldRegenDelay: 3000
        }
      },
      'shield-generator-3': {
        id: 'shield-generator-3',
        name: 'Shield Generator III',
        description: '150 shield capacity with fast regeneration',
        cost: 6,
        tree: 'defense',
        branch: 'shields',
        prerequisites: ['shield-generator-2'],
        maxLevel: 1,
        effects: {
          shieldCapacity: 150,
          shieldRegenRate: 20, // shields per second
          shieldRegenDelay: 3000
        }
      },
      'quick-recharge': {
        id: 'quick-recharge',
        name: 'Quick Recharge',
        description: 'Shield regeneration starts 1 second sooner',
        cost: 3,
        tree: 'defense',
        branch: 'shields',
        prerequisites: ['shield-generator-1'],
        maxLevel: 1,
        effects: {
          shieldRegenDelay: 2000 // reduced delay
        }
      },
      'instant-recharge': {
        id: 'instant-recharge',
        name: 'Instant Recharge',
        description: 'Shield regeneration starts immediately after damage',
        cost: 5,
        tree: 'defense',
        branch: 'shields',
        prerequisites: ['quick-recharge'],
        maxLevel: 1,
        effects: {
          shieldRegenDelay: 500 // very short delay
        }
      },
      'shield-burst': {
        id: 'shield-burst',
        name: 'Shield Burst',
        description: 'When shield breaks, deals 50 damage in 80-pixel radius',
        cost: 5,
        tree: 'defense',
        branch: 'shields',
        prerequisites: ['shield-generator-2'],
        maxLevel: 1,
        effects: {
          shieldBurstDamage: 50,
          shieldBurstRadius: 80
        }
      },

      // Mobility Tree - Speed Branch Upgrades
      'engine-boost-1': {
        id: 'engine-boost-1',
        name: 'Engine Boost I',
        description: '+15% movement speed',
        cost: 2,
        tree: 'mobility',
        branch: 'speed',
        prerequisites: [],
        maxLevel: 1,
        effects: {
          movementSpeedMultiplier: 1.15
        }
      },
      'engine-boost-2': {
        id: 'engine-boost-2',
        name: 'Engine Boost II',
        description: '+25% movement speed',
        cost: 3,
        tree: 'mobility',
        branch: 'speed',
        prerequisites: ['engine-boost-1'],
        maxLevel: 1,
        effects: {
          movementSpeedMultiplier: 1.25
        }
      },
      'engine-boost-3': {
        id: 'engine-boost-3',
        name: 'Engine Boost III',
        description: '+35% movement speed',
        cost: 4,
        tree: 'mobility',
        branch: 'speed',
        prerequisites: ['engine-boost-2'],
        maxLevel: 1,
        effects: {
          movementSpeedMultiplier: 1.35
        }
      },

      // Mobility Tree - Maneuverability Branch Upgrades
      'tight-controls': {
        id: 'tight-controls',
        name: 'Tight Controls',
        description: '+30% acceleration for more responsive movement',
        cost: 3,
        tree: 'mobility',
        branch: 'agility',
        prerequisites: [],
        maxLevel: 1,
        effects: {
          accelerationMultiplier: 1.3
        }
      },
      'expert-pilot': {
        id: 'expert-pilot',
        name: 'Expert Pilot',
        description: '+50% acceleration and 20% smaller hitbox',
        cost: 5,
        tree: 'mobility',
        branch: 'agility',
        prerequisites: ['tight-controls'],
        maxLevel: 1,
        effects: {
          accelerationMultiplier: 1.5,
          hitboxMultiplier: 0.8
        }
      },

      // Mobility Tree - Special Abilities
      'afterburner': {
        id: 'afterburner',
        name: 'Afterburner',
        description: 'Double-tap movement key for 2x speed burst (1.5s duration, 3s cooldown)',
        cost: 4,
        tree: 'mobility',
        branch: 'speed',
        prerequisites: ['engine-boost-1'],
        maxLevel: 1,
        effects: {
          afterburnerSpeed: 2.0,
          afterburnerDuration: 1500, // milliseconds
          afterburnerCooldown: 3000  // milliseconds
        }
      },
      'advanced-afterburner': {
        id: 'advanced-afterburner',
        name: 'Advanced Afterburner',
        description: 'Longer afterburner duration (2.5s) with damage trail',
        cost: 6,
        tree: 'mobility',
        branch: 'speed',
        prerequisites: ['afterburner'],
        maxLevel: 1,
        effects: {
          afterburnerSpeed: 2.0,
          afterburnerDuration: 2500, // milliseconds
          afterburnerCooldown: 3000,  // milliseconds
          afterburnerDamageTrail: true
        }
      },
      'barrel-roll': {
        id: 'barrel-roll',
        name: 'Barrel Roll',
        description: 'Double-tap dodge for 0.5s invulnerability frames',
        cost: 4,
        tree: 'mobility',
        branch: 'agility',
        prerequisites: ['tight-controls'],
        maxLevel: 1,
        effects: {
          barrelRollDuration: 500,   // milliseconds
          barrelRollCooldown: 2000,  // milliseconds
          invulnerabilityFrames: true
        }
      },
      'evasive-maneuvers': {
        id: 'evasive-maneuvers',
        name: 'Evasive Maneuvers',
        description: '15% chance to dodge incoming damage',
        cost: 5,
        tree: 'mobility',
        branch: 'agility',
        prerequisites: ['barrel-roll'],
        maxLevel: 1,
        effects: {
          dodgeChance: 0.15  // 15% chance
        }
      }
    };

    this.#logger.info('Upgrade definitions initialized', {
      totalUpgrades: Object.keys(this.upgradeDefinitions).length,
      laserUpgrades: Object.values(this.upgradeDefinitions).filter(u => u.branch === 'laser').length,
      universalUpgrades: Object.values(this.upgradeDefinitions).filter(u => u.tree === 'universal').length,
    });
  }

  /**
   * Validate if an upgrade can be purchased
   * @param {string} upgradeId - The upgrade ID to validate
   * @returns {Object} Validation result with success flag and reason
   */
  validateUpgradePurchase(upgradeId) {
    const upgrade = this.upgradeDefinitions[upgradeId];
    
    if (!upgrade) {
      return { 
        valid: false, 
        reason: 'Upgrade not found',
        code: 'UPGRADE_NOT_FOUND'
      };
    }

    // Check if already purchased
    const currentLevel = this.purchasedUpgrades.get(upgradeId)?.level || 0;
    if (currentLevel >= upgrade.maxLevel) {
      return { 
        valid: false, 
        reason: 'Already purchased',
        code: 'ALREADY_PURCHASED'
      };
    }

    // Check if player has enough points
    if (this.gameStateManager.availablePoints < upgrade.cost) {
      return { 
        valid: false, 
        reason: `Insufficient points. Need ${upgrade.cost}, have ${this.gameStateManager.availablePoints}`,
        code: 'INSUFFICIENT_POINTS'
      };
    }

    // Check prerequisites
    for (const prereqId of upgrade.prerequisites) {
      if (!this.purchasedUpgrades.has(prereqId)) {
        const prereqUpgrade = this.upgradeDefinitions[prereqId];
        return { 
          valid: false, 
          reason: `Requires ${prereqUpgrade?.name || prereqId}`,
          code: 'PREREQUISITES_NOT_MET',
          missingPrerequisite: prereqId
        };
      }
    }

    return { 
      valid: true, 
      reason: 'Valid purchase',
      code: 'VALID'
    };
  }

  /**
   * Purchase an upgrade with validation and effect application
   * @param {string} upgradeId - The upgrade ID to purchase
   * @returns {boolean} True if purchase was successful, false otherwise
   */
  purchaseUpgrade(upgradeId) {
    const validation = this.validateUpgradePurchase(upgradeId);
    
    if (!validation.valid) {
      this.#logger.warn(`Failed to purchase upgrade ${upgradeId}: ${validation.reason}`, {
        upgradeId,
        validation,
      });
      return false;
    }

    const upgrade = this.upgradeDefinitions[upgradeId];
    
    // Spend points
    const success = this.gameStateManager.spendPoints(upgrade.cost, `Upgrade: ${upgrade.name}`);
    if (!success) {
      this.#logger.error(`Failed to spend points for upgrade ${upgradeId}`);
      return false;
    }

    // Record purchase
    const currentLevel = this.purchasedUpgrades.get(upgradeId)?.level || 0;
    this.purchasedUpgrades.set(upgradeId, {
      level: currentLevel + 1,
      purchaseDate: new Date().toISOString(),
    });

    // Apply effects
    this.recalculateEffects();

    // Save upgrades
    this.saveUpgrades();

    this.#logger.info(`Upgrade purchased: ${upgrade.name}`, {
      upgradeId,
      cost: upgrade.cost,
      pointsRemaining: this.gameStateManager.availablePoints,
    });

    // Emit upgrade purchased event
    this.#eventBus.emit(EventTypes.UPGRADE_PURCHASED, {
      upgradeId,
      upgrade,
      currentLevel: this.purchasedUpgrades.get(upgradeId).level,
      pointsSpent: upgrade.cost,
      pointsRemaining: this.gameStateManager.availablePoints,
      effects: this.upgradeEffects,
    }, EventPriority.NORMAL);

    return true;
  }

  /**
   * Refund an upgrade (for respec functionality)
   * @param {string} upgradeId - The upgrade ID to refund
   * @returns {boolean} True if refund was successful, false otherwise
   */
  refundUpgrade(upgradeId) {
    if (!this.purchasedUpgrades.has(upgradeId)) {
      this.#logger.warn(`Cannot refund upgrade ${upgradeId}: not purchased`);
      return false;
    }

    const upgrade = this.upgradeDefinitions[upgradeId];
    const _purchaseData = this.purchasedUpgrades.get(upgradeId);

    // Check if other upgrades depend on this one
    const dependentUpgrades = Object.values(this.upgradeDefinitions)
      .filter(u => u.prerequisites.includes(upgradeId))
      .filter(u => this.purchasedUpgrades.has(u.id));

    if (dependentUpgrades.length > 0) {
      this.#logger.warn(`Cannot refund upgrade ${upgradeId}: other upgrades depend on it`, {
        dependentUpgrades: dependentUpgrades.map(u => u.name),
      });
      return false;
    }

    // Refund points
    const success = this.gameStateManager.refundPoints(upgrade.cost, `Refund: ${upgrade.name}`);
    if (!success) {
      this.#logger.error(`Failed to refund points for upgrade ${upgradeId}`);
      return false;
    }

    // Remove purchase record
    this.purchasedUpgrades.delete(upgradeId);

    // Recalculate effects
    this.recalculateEffects();

    // Save upgrades
    this.saveUpgrades();

    this.#logger.info(`Upgrade refunded: ${upgrade.name}`, {
      upgradeId,
      refund: upgrade.cost,
      pointsAvailable: this.gameStateManager.availablePoints,
    });

    // Emit upgrade refunded event
    this.#eventBus.emit(EventTypes.UPGRADE_REFUNDED, {
      upgradeId,
      upgrade,
      pointsRefunded: upgrade.cost,
      pointsAvailable: this.gameStateManager.availablePoints,
      effects: this.upgradeEffects,
    }, EventPriority.NORMAL);

    return true;
  }

  /**
   * Recalculate all upgrade effects from purchased upgrades
   * @private
   * @returns {void}
   */
  recalculateEffects() {
    // Reset effects to base values
    this.upgradeEffects = {
      weaponDamageMultiplier: 1.0,
      weaponSpeedMultiplier: 1.0,
      weaponFireRateMultiplier: 1.0,
      weaponPiercing: 0,
      weaponMultishot: 1,
      weaponSpreadPattern: false,
      plasmaExplosionRadius: 0,
      plasmaChainReaction: false,
      plasmaOverchargeChance: 0,
      missileTrackingEnabled: false,
      missileTrackingRange: 0,
      missileClusterBombs: 0,
      missileMIRVWarheads: 0,
      weaponCoolingMultiplier: 1.0,
      weaponHeatCapacityMultiplier: 1.0,
      weaponOverheatThreshold: 100,
      healthMultiplier: 1.0,
      healthBonus: 0,
      damageReductionPercentage: 0,
      shieldCapacity: 0,
      shieldRegenRate: 1.0,
      shieldRegenDelay: 3000,
      shieldBurstDamage: 0,
      shieldBurstRadius: 0,
      movementSpeedMultiplier: 1.0,
      accelerationMultiplier: 1.0,
      hitboxMultiplier: 1.0,
      afterburnerSpeed: 1.0,
      afterburnerDuration: 0,
      afterburnerCooldown: 0,
      afterburnerDamageTrail: false,
      barrelRollDuration: 0,
      barrelRollCooldown: 0,
      invulnerabilityFrames: false,
      dodgeChance: 0,
    };

    // Apply effects from all purchased upgrades
    for (const [upgradeId, purchaseData] of this.purchasedUpgrades) {
      const upgrade = this.upgradeDefinitions[upgradeId];
      if (!upgrade || !upgrade.effects) continue;

      // Apply multiplicative effects
      if (upgrade.effects.weaponDamageMultiplier) {
        this.upgradeEffects.weaponDamageMultiplier *= upgrade.effects.weaponDamageMultiplier;
      }
      if (upgrade.effects.weaponSpeedMultiplier) {
        this.upgradeEffects.weaponSpeedMultiplier *= upgrade.effects.weaponSpeedMultiplier;
      }
      if (upgrade.effects.weaponFireRateMultiplier) {
        this.upgradeEffects.weaponFireRateMultiplier *= upgrade.effects.weaponFireRateMultiplier;
      }
      if (upgrade.effects.weaponCoolingMultiplier) {
        this.upgradeEffects.weaponCoolingMultiplier *= upgrade.effects.weaponCoolingMultiplier;
      }
      if (upgrade.effects.weaponHeatCapacityMultiplier) {
        this.upgradeEffects.weaponHeatCapacityMultiplier *= upgrade.effects.weaponHeatCapacityMultiplier;
      }
      if (upgrade.effects.healthMultiplier) {
        this.upgradeEffects.healthMultiplier *= upgrade.effects.healthMultiplier;
      }
      if (upgrade.effects.movementSpeedMultiplier) {
        this.upgradeEffects.movementSpeedMultiplier *= upgrade.effects.movementSpeedMultiplier;
      }
      if (upgrade.effects.accelerationMultiplier) {
        this.upgradeEffects.accelerationMultiplier *= upgrade.effects.accelerationMultiplier;
      }
      if (upgrade.effects.hitboxMultiplier) {
        this.upgradeEffects.hitboxMultiplier *= upgrade.effects.hitboxMultiplier;
      }

      // Apply additive effects
      if (upgrade.effects.weaponPiercing) {
        this.upgradeEffects.weaponPiercing += upgrade.effects.weaponPiercing;
      }
      if (upgrade.effects.healthBonus) {
        this.upgradeEffects.healthBonus += upgrade.effects.healthBonus;
      }
      if (upgrade.effects.damageReductionPercentage) {
        // Damage reduction uses maximum value (not additive)
        this.upgradeEffects.damageReductionPercentage = Math.max(
          this.upgradeEffects.damageReductionPercentage,
          upgrade.effects.damageReductionPercentage
        );
      }
      if (upgrade.effects.shieldCapacity) {
        this.upgradeEffects.shieldCapacity = Math.max(
          this.upgradeEffects.shieldCapacity,
          upgrade.effects.shieldCapacity
        );
      }
      if (upgrade.effects.shieldRegenRate) {
        this.upgradeEffects.shieldRegenRate = Math.max(
          this.upgradeEffects.shieldRegenRate,
          upgrade.effects.shieldRegenRate
        );
      }
      if (upgrade.effects.shieldRegenDelay) {
        this.upgradeEffects.shieldRegenDelay = Math.min(
          this.upgradeEffects.shieldRegenDelay,
          upgrade.effects.shieldRegenDelay
        );
      }
      if (upgrade.effects.shieldBurstDamage) {
        this.upgradeEffects.shieldBurstDamage = Math.max(
          this.upgradeEffects.shieldBurstDamage,
          upgrade.effects.shieldBurstDamage
        );
      }
      if (upgrade.effects.shieldBurstRadius) {
        this.upgradeEffects.shieldBurstRadius = Math.max(
          this.upgradeEffects.shieldBurstRadius,
          upgrade.effects.shieldBurstRadius
        );
      }
      if (upgrade.effects.dodgeChance) {
        this.upgradeEffects.dodgeChance += upgrade.effects.dodgeChance;
      }

      // Apply override effects (last one wins)
      if (upgrade.effects.weaponMultishot) {
        this.upgradeEffects.weaponMultishot = upgrade.effects.weaponMultishot;
      }
      if (upgrade.effects.weaponSpreadPattern !== undefined) {
        this.upgradeEffects.weaponSpreadPattern = upgrade.effects.weaponSpreadPattern;
      }
      
      // Apply special ability effects (override)
      if (upgrade.effects.afterburnerSpeed) {
        this.upgradeEffects.afterburnerSpeed = Math.max(this.upgradeEffects.afterburnerSpeed, upgrade.effects.afterburnerSpeed);
      }
      if (upgrade.effects.afterburnerDuration) {
        this.upgradeEffects.afterburnerDuration = Math.max(this.upgradeEffects.afterburnerDuration, upgrade.effects.afterburnerDuration);
      }
      if (upgrade.effects.afterburnerCooldown) {
        this.upgradeEffects.afterburnerCooldown = Math.max(this.upgradeEffects.afterburnerCooldown, upgrade.effects.afterburnerCooldown);
      }
      if (upgrade.effects.afterburnerDamageTrail !== undefined) {
        this.upgradeEffects.afterburnerDamageTrail = upgrade.effects.afterburnerDamageTrail;
      }
      if (upgrade.effects.barrelRollDuration) {
        this.upgradeEffects.barrelRollDuration = Math.max(this.upgradeEffects.barrelRollDuration, upgrade.effects.barrelRollDuration);
      }
      if (upgrade.effects.barrelRollCooldown) {
        this.upgradeEffects.barrelRollCooldown = Math.max(this.upgradeEffects.barrelRollCooldown, upgrade.effects.barrelRollCooldown);
      }
      if (upgrade.effects.invulnerabilityFrames !== undefined) {
        this.upgradeEffects.invulnerabilityFrames = upgrade.effects.invulnerabilityFrames;
      }
      
      // Apply plasma weapon effects (override for maximum values)
      if (upgrade.effects.plasmaExplosionRadius) {
        this.upgradeEffects.plasmaExplosionRadius = Math.max(
          this.upgradeEffects.plasmaExplosionRadius,
          upgrade.effects.plasmaExplosionRadius
        );
      }
      if (upgrade.effects.plasmaChainReaction !== undefined) {
        this.upgradeEffects.plasmaChainReaction = upgrade.effects.plasmaChainReaction;
      }
      if (upgrade.effects.plasmaOverchargeChance) {
        this.upgradeEffects.plasmaOverchargeChance = Math.max(
          this.upgradeEffects.plasmaOverchargeChance,
          upgrade.effects.plasmaOverchargeChance
        );
      }
      
      // Apply missile weapon effects (override for maximum values)
      if (upgrade.effects.missileTrackingEnabled !== undefined) {
        this.upgradeEffects.missileTrackingEnabled = upgrade.effects.missileTrackingEnabled;
      }
      if (upgrade.effects.missileTrackingRange) {
        this.upgradeEffects.missileTrackingRange = Math.max(
          this.upgradeEffects.missileTrackingRange,
          upgrade.effects.missileTrackingRange
        );
      }
      if (upgrade.effects.missileClusterBombs) {
        this.upgradeEffects.missileClusterBombs = Math.max(
          this.upgradeEffects.missileClusterBombs,
          upgrade.effects.missileClusterBombs
        );
      }
      if (upgrade.effects.missileMIRVWarheads) {
        this.upgradeEffects.missileMIRVWarheads = Math.max(
          this.upgradeEffects.missileMIRVWarheads,
          upgrade.effects.missileMIRVWarheads
        );
      }
    }

    // Calculate final heat capacity threshold based on multipliers
    this.upgradeEffects.weaponOverheatThreshold = Math.floor(100 * this.upgradeEffects.weaponHeatCapacityMultiplier);

    this.#logger.debug('Upgrade effects recalculated', {
      effects: this.upgradeEffects,
      purchasedUpgrades: this.purchasedUpgrades.size,
    });
  }

  /**
   * Get all upgrades for a specific tree and branch
   * @param {string} tree - Tree name (e.g., 'weapons', 'defense', 'mobility')
   * @param {string} [branch] - Branch name (e.g., 'laser', 'plasma', 'missile')
   * @returns {Array} Array of upgrade definitions
   */
  getUpgradesByBranch(tree, branch = null) {
    return Object.values(this.upgradeDefinitions).filter(upgrade => {
      if (upgrade.tree !== tree) return false;
      if (branch && upgrade.branch !== branch) return false;
      return true;
    });
  }

  /**
   * Get upgrade purchase status
   * @param {string} upgradeId - The upgrade ID to check
   * @returns {Object} Purchase status with level and availability
   */
  getUpgradeStatus(upgradeId) {
    const upgrade = this.upgradeDefinitions[upgradeId];
    if (!upgrade) {
      return { exists: false };
    }

    const _purchaseData = this.purchasedUpgrades.get(upgradeId);
    const currentLevel = _purchaseData?.level || 0;
    const validation = this.validateUpgradePurchase(upgradeId);

    return {
      exists: true,
      upgrade,
      currentLevel,
      maxLevel: upgrade.maxLevel,
      isPurchased: currentLevel > 0,
      canPurchase: validation.valid,
      validationResult: validation,
      purchaseDate: _purchaseData?.purchaseDate,
    };
  }

  /**
   * Get current upgrade effects
   * @returns {Object} Current calculated effects
   */
  getUpgradeEffects() {
    return { ...this.upgradeEffects };
  }

  /**
   * Get all purchased upgrades
   * @returns {Map} Map of purchased upgrades
   */
  getPurchasedUpgrades() {
    return new Map(this.purchasedUpgrades);
  }

  /**
   * Check if weapon can fire based on heat level and fire rate
   * @param {number} currentTime - Current time in milliseconds
   * @param {number} lastFireTime - Time of last weapon fire
   * @param {number} baseFireRate - Base fire rate in milliseconds
   * @returns {Object} Fire permission result
   */
  canWeaponFire(currentTime, lastFireTime, baseFireRate) {
    // Check if weapon is overheated
    if (this.weaponOverheated) {
      return {
        canFire: false,
        reason: 'OVERHEATED',
        timeUntilReady: Math.max(0, this.#getTimeUntilCooled(currentTime)),
        heatLevel: this.weaponHeat,
        heatThreshold: this.upgradeEffects.weaponOverheatThreshold,
      };
    }

    // Calculate modified fire rate with upgrades
    const modifiedFireRate = baseFireRate / this.upgradeEffects.weaponFireRateMultiplier;
    const timeSinceLastFire = currentTime - lastFireTime;

    if (timeSinceLastFire < modifiedFireRate) {
      return {
        canFire: false,
        reason: 'FIRE_RATE_LIMIT',
        timeUntilReady: modifiedFireRate - timeSinceLastFire,
        heatLevel: this.weaponHeat,
        heatThreshold: this.upgradeEffects.weaponOverheatThreshold,
      };
    }

    return {
      canFire: true,
      reason: 'READY',
      timeUntilReady: 0,
      heatLevel: this.weaponHeat,
      heatThreshold: this.upgradeEffects.weaponOverheatThreshold,
    };
  }

  /**
   * Add heat to weapon when fired
   * @param {number} heatAmount - Amount of heat to add (default: 10)
   * @returns {void}
   */
  addWeaponHeat(heatAmount = 10) {
    this.weaponHeat = Math.min(this.weaponHeat + heatAmount, this.upgradeEffects.weaponOverheatThreshold + 50);
    
    // Check for overheating
    if (this.weaponHeat >= this.upgradeEffects.weaponOverheatThreshold && !this.weaponOverheated) {
      this.weaponOverheated = true;
      this.#logger.warn('Weapon overheated', {
        heat: this.weaponHeat,
        threshold: this.upgradeEffects.weaponOverheatThreshold,
      });

      // Emit overheating event
      this.#eventBus.emit(EventTypes.WEAPON_OVERHEATED, {
        heat: this.weaponHeat,
        threshold: this.upgradeEffects.weaponOverheatThreshold,
        coolingMultiplier: this.upgradeEffects.weaponCoolingMultiplier,
      });
    }
  }

  /**
   * Update weapon cooling system
   * @param {number} currentTime - Current time in milliseconds
   * @param {number} deltaTime - Time delta in milliseconds
   * @returns {void}
   */
  updateWeaponCooling(currentTime, deltaTime) {
    if (this.weaponHeat <= 0) return;

    // Cool down based on upgrade effects
    const baseCoolingRate = 20; // Base cooling per second
    const enhancedCoolingRate = baseCoolingRate * this.upgradeEffects.weaponCoolingMultiplier;
    const coolingThisFrame = (enhancedCoolingRate * deltaTime) / 1000;

    this.weaponHeat = Math.max(0, this.weaponHeat - coolingThisFrame);

    // Check if no longer overheated
    const cooldownThreshold = this.upgradeEffects.weaponOverheatThreshold * 0.7; // 70% cooldown before ready
    if (this.weaponOverheated && this.weaponHeat <= cooldownThreshold) {
      this.weaponOverheated = false;
      this.#logger.info('Weapon ready after cooldown', {
        heat: this.weaponHeat,
        threshold: this.upgradeEffects.weaponOverheatThreshold,
      });

      // Emit cooling complete event
      this.#eventBus.emit(EventTypes.WEAPON_COOLING_COMPLETE, {
        heat: this.weaponHeat,
        threshold: this.upgradeEffects.weaponOverheatThreshold,
      });
    }

    this.lastCooldownTime = currentTime;
  }

  /**
   * Get weapon heat status for UI display
   * @returns {Object} Heat status information
   */
  getWeaponHeatStatus() {
    return {
      heat: this.weaponHeat,
      maxHeat: this.upgradeEffects.weaponOverheatThreshold,
      overheated: this.weaponOverheated,
      heatPercentage: Math.min(100, (this.weaponHeat / this.upgradeEffects.weaponOverheatThreshold) * 100),
      coolingMultiplier: this.upgradeEffects.weaponCoolingMultiplier,
    };
  }

  /**
   * Calculate total max health including bonuses
   * @param {number} baseHealth - Base health value
   * @returns {number} Total max health including upgrade bonuses
   */
  getTotalMaxHealth(baseHealth) {
    return Math.floor(baseHealth * this.upgradeEffects.healthMultiplier) + this.upgradeEffects.healthBonus;
  }

  /**
   * Get current damage reduction percentage
   * @returns {number} Damage reduction percentage (0-100)
   */
  getDamageReduction() {
    return Math.min(100, this.upgradeEffects.damageReductionPercentage);
  }

  /**
   * Get defense upgrade status for UI display
   * @returns {Object} Defense status information
   */
  getDefenseStatus(baseHealth) {
    const totalMaxHealth = this.getTotalMaxHealth(baseHealth);
    const damageReduction = this.getDamageReduction();
    
    return {
      baseHealth,
      healthBonus: this.upgradeEffects.healthBonus,
      totalMaxHealth,
      healthMultiplier: this.upgradeEffects.healthMultiplier,
      damageReduction,
      effectiveHealthMultiplier: totalMaxHealth / baseHealth,
    };
  }

  /**
   * Calculate time until weapon is cooled enough to fire
   * @private
   * @param {number} currentTime - Current time in milliseconds
   * @returns {number} Time in milliseconds until weapon is ready
   */
  #getTimeUntilCooled(currentTime) {
    if (!this.weaponOverheated) return 0;

    const cooldownThreshold = this.upgradeEffects.weaponOverheatThreshold * 0.7;
    const heatToCool = this.weaponHeat - cooldownThreshold;
    
    if (heatToCool <= 0) return 0;

    const baseCoolingRate = 20; // Base cooling per second
    const enhancedCoolingRate = baseCoolingRate * this.upgradeEffects.weaponCoolingMultiplier;
    
    return (heatToCool / enhancedCoolingRate) * 1000; // Convert to milliseconds
  }

  /**
   * Save upgrades to localStorage
   * @private
   * @returns {void}
   */
  saveUpgrades() {
    try {
      const saveData = {
        purchasedUpgrades: Object.fromEntries(this.purchasedUpgrades),
        upgradeEffects: this.upgradeEffects,
        lastSaved: Date.now(),
        version: '1.0.0',
      };

      localStorage.setItem(this.#saveKey, JSON.stringify(saveData));
      this.#logger.debug('Upgrades saved to localStorage');
    } catch (error) {
      this.#logger.error('Failed to save upgrades:', error);
    }
  }

  /**
   * Load upgrades from localStorage
   * @private
   * @returns {void}
   */
  loadUpgrades() {
    try {
      const savedData = localStorage.getItem(this.#saveKey);
      if (!savedData) {
        this.#logger.debug('No saved upgrade data found');
        return;
      }

      const data = JSON.parse(savedData);
      
      // Load purchased upgrades
      if (data.purchasedUpgrades) {
        this.purchasedUpgrades = new Map(Object.entries(data.purchasedUpgrades));
      }

      // Recalculate effects (don't trust saved effects)
      this.recalculateEffects();

      this.#logger.info('Upgrades loaded from localStorage', {
        upgradesLoaded: this.purchasedUpgrades.size,
      });
    } catch (error) {
      this.#logger.error('Failed to load upgrades:', error);
      // Continue with empty state
    }
  }

  /**
   * Reset all upgrades (for debugging/testing)
   * @returns {void}
   */
  resetAllUpgrades() {
    const totalRefund = Array.from(this.purchasedUpgrades.entries())
      .map(([upgradeId]) => this.upgradeDefinitions[upgradeId]?.cost || 0)
      .reduce((sum, cost) => sum + cost, 0);

    // Clear purchases
    this.purchasedUpgrades.clear();
    
    // Recalculate effects
    this.recalculateEffects();
    
    // Refund all points
    if (totalRefund > 0) {
      this.gameStateManager.refundPoints(totalRefund, 'Respec: All upgrades reset');
    }

    // Save state
    this.saveUpgrades();

    this.#logger.info('All upgrades reset', {
      pointsRefunded: totalRefund,
    });
  }

  /**
   * Clean up resources
   * @returns {void}
   */
  destroy() {
    // Save final state
    this.saveUpgrades();

    // Clear references
    this.gameStateManager = null;
    this.purchasedUpgrades.clear();
    this.upgradeDefinitions = {};

    this.#logger.info('UpgradeSystem destroyed');
  }
}

export default UpgradeSystem;