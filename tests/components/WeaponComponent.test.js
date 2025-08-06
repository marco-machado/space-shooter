import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import WeaponComponent from '../../src/components/WeaponComponent.js';

// Mock Logger to avoid console output during tests
vi.mock('../../src/utils/Logger.js', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock BaseComponent
vi.mock('../../src/components/BaseComponent.js', () => ({
  default: class MockBaseComponent {
    constructor() {
      this.entity = null;
      this.active = true;
      this.componentId = `comp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    }
    init() {}
    serialize() { 
      return {
        type: this.constructor.name,
        componentId: this.componentId,
        active: this.active,
      };
    }
    deserialize() {}
  }
}));

import Logger from '../../src/utils/Logger.js';

describe('WeaponComponent', () => {
  let weapon;
  let mockDateNow;

  beforeEach(() => {
    // Clear all mock calls before each test
    vi.clearAllMocks();
    
    // Mock Date.now for consistent timing tests
    mockDateNow = vi.spyOn(Date, 'now').mockReturnValue(1000);
    
    weapon = new WeaponComponent();
  });

  afterEach(() => {
    // Restore Date.now
    mockDateNow.mockRestore();
  });

  describe('constructor', () => {
    it('should create weapon with default laser configuration', () => {
      expect(weapon.currentWeapon).toBe('laser');
      expect(weapon.availableWeapons).toEqual(new Set(['laser']));
      expect(weapon.upgradeLevel).toBe(1);
      expect(weapon.canFire).toBe(true);
      expect(weapon.continuousFire).toBe(false);
      expect(weapon.isFiring).toBe(false);
      expect(weapon.lastFireTime).toBe(0);
    });

    it('should create weapon with specified weapon type', () => {
      const plasmaWeapon = new WeaponComponent('plasma');
      expect(plasmaWeapon.currentWeapon).toBe('plasma');
      expect(plasmaWeapon.availableWeapons).toEqual(new Set(['laser'])); // Still starts with laser only
    });

    it('should initialize upgrade bonuses to zero', () => {
      expect(weapon.upgradeBonuses).toEqual({
        damage: 0,
        fireRateReduction: 0,
        projectileSpeedBonus: 0,
      });
    });

    it('should have correct weapon specifications', () => {
      expect(weapon.weaponSpecs.laser).toEqual({
        name: 'Laser Cannon',
        damage: 25,
        fireRate: 300,
        projectileSpeed: 800,
        projectileColor: 0xffff00,
        projectileSize: { width: 12, height: 4 },
        ammoType: 'energy',
        maxAmmo: -1,
        currentAmmo: -1,
        unlockLevel: 1,
        sound: 'laser_fire',
      });

      expect(weapon.weaponSpecs.plasma).toEqual({
        name: 'Plasma Gun',
        damage: 40,
        fireRate: 500,
        projectileSpeed: 600,
        projectileColor: 0x00ff88,
        projectileSize: { width: 16, height: 8 },
        ammoType: 'energy',
        maxAmmo: -1,
        currentAmmo: -1,
        unlockLevel: 3,
        sound: 'plasma_fire',
      });

      expect(weapon.weaponSpecs.missile).toEqual({
        name: 'Missile Launcher',
        damage: 100,
        fireRate: 1200,
        projectileSpeed: 400,
        projectileColor: 0xff8800,
        projectileSize: { width: 8, height: 16 },
        ammoType: 'explosive',
        maxAmmo: 50,
        currentAmmo: 50,
        unlockLevel: 7,
        sound: 'missile_fire',
      });
    });

    it('should log weapon creation', () => {
      expect(Logger.debug).toHaveBeenCalledWith(
        '[WeaponComponent] created: laser weapon'
      );
    });
  });

  describe('init method', () => {
    it('should initialize with default values when no data provided', () => {
      weapon.init();
      
      expect(weapon.currentWeapon).toBe('laser');
      expect(weapon.upgradeLevel).toBe(1);
      expect(weapon.continuousFire).toBe(false);
    });

    it('should initialize with provided configuration', () => {
      const config = {
        currentWeapon: 'plasma',
        upgradeLevel: 5,
        continuousFire: true,
        availableWeapons: ['laser', 'plasma'],
        weaponAmmo: {
          missile: 25,
        },
        upgradeBonuses: {
          damage: 10,
          fireRateReduction: 50,
          projectileSpeedBonus: 100,
        },
      };

      weapon.init(config);

      expect(weapon.currentWeapon).toBe('plasma');
      expect(weapon.upgradeLevel).toBe(5);
      expect(weapon.continuousFire).toBe(true);
      expect(weapon.availableWeapons).toEqual(new Set(['laser', 'plasma']));
      expect(weapon.weaponSpecs.missile.currentAmmo).toBe(25);
      expect(weapon.upgradeBonuses).toEqual({
        damage: 10,
        fireRateReduction: 50,
        projectileSpeedBonus: 100,
      });
    });

    it('should ensure minimum upgrade level of 1', () => {
      weapon.init({ upgradeLevel: 0 });
      expect(weapon.upgradeLevel).toBe(1);

      weapon.init({ upgradeLevel: -5 });
      expect(weapon.upgradeLevel).toBe(1);
    });

    it('should handle partial weapon ammo data', () => {
      weapon.init({
        weaponAmmo: {
          missile: 30,
          invalidWeapon: 100, // Should be ignored
        },
      });

      expect(weapon.weaponSpecs.missile.currentAmmo).toBe(30);
      expect(weapon.weaponSpecs.laser.currentAmmo).toBe(-1); // Unchanged
    });

    it('should merge upgrade bonuses without replacing all', () => {
      weapon.upgradeBonuses.damage = 5; // Set initial value
      
      weapon.init({
        upgradeBonuses: {
          fireRateReduction: 25,
        },
      });

      expect(weapon.upgradeBonuses).toEqual({
        damage: 5, // Should keep existing
        fireRateReduction: 25, // Should be updated
        projectileSpeedBonus: 0, // Should keep existing
      });
    });
  });

  describe('getCurrentWeaponSpec method', () => {
    it('should return base weapon spec without upgrades', () => {
      const spec = weapon.getCurrentWeaponSpec();
      
      expect(spec.damage).toBe(25); // Laser base damage
      expect(spec.fireRate).toBe(300); // Laser base fire rate
      expect(spec.projectileSpeed).toBe(800); // Laser base speed
    });

    it('should apply damage upgrade bonus', () => {
      weapon.upgradeBonuses.damage = 15;
      const spec = weapon.getCurrentWeaponSpec();
      
      expect(spec.damage).toBe(40); // 25 + 15
    });

    it('should apply fire rate reduction with minimum limit', () => {
      weapon.upgradeBonuses.fireRateReduction = 100;
      const spec = weapon.getCurrentWeaponSpec();
      
      expect(spec.fireRate).toBe(200); // 300 - 100

      // Test minimum limit
      weapon.upgradeBonuses.fireRateReduction = 500;
      const specMin = weapon.getCurrentWeaponSpec();
      expect(specMin.fireRate).toBe(50); // Should not go below 50
    });

    it('should apply projectile speed bonus', () => {
      weapon.upgradeBonuses.projectileSpeedBonus = 200;
      const spec = weapon.getCurrentWeaponSpec();
      
      expect(spec.projectileSpeed).toBe(1000); // 800 + 200
    });

    it('should apply all upgrades simultaneously', () => {
      weapon.upgradeBonuses = {
        damage: 10,
        fireRateReduction: 50,
        projectileSpeedBonus: 100,
      };
      
      const spec = weapon.getCurrentWeaponSpec();
      
      expect(spec.damage).toBe(35); // 25 + 10
      expect(spec.fireRate).toBe(250); // 300 - 50
      expect(spec.projectileSpeed).toBe(900); // 800 + 100
    });

    it('should work with different weapon types', () => {
      weapon.currentWeapon = 'plasma';
      weapon.upgradeBonuses.damage = 20;
      
      const spec = weapon.getCurrentWeaponSpec();
      
      expect(spec.damage).toBe(60); // Plasma 40 + 20
      expect(spec.fireRate).toBe(500); // Plasma base fire rate
    });
  });

  describe('canFireWeapon method', () => {
    it('should return false when canFire is false', () => {
      weapon.canFire = false;
      expect(weapon.canFireWeapon()).toBe(false);
    });

    it('should return false when fire rate cooldown not met', () => {
      weapon.lastFireTime = 800; // 200ms ago (less than 300ms fire rate)
      mockDateNow.mockReturnValue(1000);
      
      expect(weapon.canFireWeapon()).toBe(false);
    });

    it('should return true when fire rate cooldown met', () => {
      weapon.lastFireTime = 600; // 400ms ago (more than 300ms fire rate)
      mockDateNow.mockReturnValue(1000);
      
      expect(weapon.canFireWeapon()).toBe(true);
    });

    it('should return false when limited ammo weapon has no ammo', () => {
      weapon.currentWeapon = 'missile';
      weapon.weaponSpecs.missile.currentAmmo = 0;
      
      expect(weapon.canFireWeapon()).toBe(false);
    });

    it('should return true when limited ammo weapon has ammo', () => {
      weapon.availableWeapons.add('missile'); // Need to add missile to available weapons
      weapon.switchWeapon('missile'); // Properly switch to missile - this sets lastFireTime = 0
      weapon.weaponSpecs.missile.currentAmmo = 5;
      // switchWeapon already set lastFireTime = 0, and Date.now() returns 1000
      // Fire rate for missile is 1200ms, so 1000 - 0 = 1000 < 1200, so it should fail
      // Let's set an old fire time to ensure cooldown is met
      weapon.lastFireTime = -1200; // 2200ms ago
      
      expect(weapon.canFireWeapon()).toBe(true);
    });

    it('should ignore ammo for unlimited ammo weapons', () => {
      weapon.currentWeapon = 'laser'; // Unlimited ammo
      weapon.lastFireTime = 0; // No cooldown
      
      expect(weapon.canFireWeapon()).toBe(true);
    });

    it('should respect upgraded fire rate in cooldown calculation', () => {
      weapon.upgradeBonuses.fireRateReduction = 100; // Fire rate becomes 200ms
      weapon.lastFireTime = 850; // 150ms ago
      mockDateNow.mockReturnValue(1000);
      
      expect(weapon.canFireWeapon()).toBe(false); // Still in cooldown
      
      weapon.lastFireTime = 750; // 250ms ago
      expect(weapon.canFireWeapon()).toBe(true); // Cooldown met
    });
  });

  describe('fire method', () => {
    beforeEach(() => {
      weapon.lastFireTime = 0; // No cooldown
    });

    it('should return null when cannot fire', () => {
      weapon.canFire = false;
      const result = weapon.fire();
      
      expect(result).toBe(null);
    });

    it('should return projectile configuration when can fire', () => {
      const result = weapon.fire();
      
      expect(result).toEqual({
        damage: 25,
        speed: 800,
        color: 0xffff00,
        size: { width: 12, height: 4 },
        weaponType: 'laser',
        sound: 'laser_fire',
      });
    });

    it('should update lastFireTime to current time', () => {
      mockDateNow.mockReturnValue(1500);
      weapon.fire();
      
      expect(weapon.lastFireTime).toBe(1500);
    });

    it('should set isFiring to true', () => {
      weapon.fire();
      expect(weapon.isFiring).toBe(true);
    });

    it('should consume ammo for limited ammo weapons', () => {
      weapon.availableWeapons.add('missile'); // Need to add missile to available weapons
      weapon.switchWeapon('missile'); // Properly switch to missile
      weapon.lastFireTime = -1200; // Ensure cooldown is met (missile has 1200ms fire rate)
      const initialAmmo = weapon.weaponSpecs.missile.currentAmmo;
      
      weapon.fire();
      
      expect(weapon.weaponSpecs.missile.currentAmmo).toBe(initialAmmo - 1);
    });

    it('should not consume ammo for unlimited ammo weapons', () => {
      weapon.currentWeapon = 'laser';
      const initialAmmo = weapon.weaponSpecs.laser.currentAmmo;
      
      weapon.fire();
      
      expect(weapon.weaponSpecs.laser.currentAmmo).toBe(initialAmmo); // Should remain -1
    });

    it('should log firing with ammo information', () => {
      weapon.fire();
      
      expect(Logger.debug).toHaveBeenCalledWith(
        '[WeaponComponent] fired: laser (ammo: -1)'
      );
    });

    it('should emit weaponFire event if entity supports it', () => {
      const mockEntity = { emit: vi.fn() };
      weapon.entity = mockEntity;
      
      weapon.fire();
      
      expect(mockEntity.emit).toHaveBeenCalledWith('weaponFire', {
        weaponType: 'laser',
        spec: expect.objectContaining({
          damage: 25,
          projectileSpeed: 800,
        }),
        remainingAmmo: -1,
      });
    });

    it('should not emit event if entity does not support it', () => {
      weapon.entity = {}; // No emit method
      
      expect(() => weapon.fire()).not.toThrow();
    });

    it('should return upgraded projectile configuration', () => {
      weapon.upgradeBonuses = {
        damage: 10,
        fireRateReduction: 50,
        projectileSpeedBonus: 100,
      };
      
      const result = weapon.fire();
      
      expect(result).toEqual({
        damage: 35, // 25 + 10
        speed: 900, // 800 + 100
        color: 0xffff00,
        size: { width: 12, height: 4 },
        weaponType: 'laser',
        sound: 'laser_fire',
      });
    });
  });

  describe('switchWeapon method', () => {
    beforeEach(() => {
      weapon.availableWeapons.add('plasma');
    });

    it('should return false for unavailable weapon', () => {
      const result = weapon.switchWeapon('missile');
      
      expect(result).toBe(false);
      expect(weapon.currentWeapon).toBe('laser'); // Should remain unchanged
    });

    it('should return false for invalid weapon type', () => {
      const result = weapon.switchWeapon('invalidWeapon');
      
      expect(result).toBe(false);
      expect(weapon.currentWeapon).toBe('laser');
    });

    it('should successfully switch to available weapon', () => {
      const result = weapon.switchWeapon('plasma');
      
      expect(result).toBe(true);
      expect(weapon.currentWeapon).toBe('plasma');
    });

    it('should reset cooldown when switching weapons', () => {
      weapon.lastFireTime = 1000;
      weapon.switchWeapon('plasma');
      
      expect(weapon.lastFireTime).toBe(0);
    });

    it('should log weapon switch', () => {
      weapon.switchWeapon('plasma');
      
      expect(Logger.info).toHaveBeenCalledWith(
        '[WeaponComponent]: Switched from laser to plasma'
      );
    });

    it('should log warning for unavailable weapon', () => {
      weapon.switchWeapon('missile');
      
      expect(Logger.warn).toHaveBeenCalledWith(
        '[WeaponComponent]: Cannot switch to unavailable weapon: missile'
      );
    });

    it('should emit weaponSwitch event if entity supports it', () => {
      const mockEntity = { emit: vi.fn() };
      weapon.entity = mockEntity;
      
      weapon.switchWeapon('plasma');
      
      expect(mockEntity.emit).toHaveBeenCalledWith('weaponSwitch', {
        previousWeapon: 'laser',
        currentWeapon: 'plasma',
        spec: expect.objectContaining({
          damage: 40, // Plasma damage
        }),
      });
    });
  });

  describe('unlockWeapon method', () => {
    it('should return false for invalid weapon type', () => {
      const result = weapon.unlockWeapon('invalidWeapon', 10);
      
      expect(result).toBe(false);
      expect(Logger.warn).toHaveBeenCalledWith(
        'WeaponComponent: Unknown weapon type: invalidWeapon'
      );
    });

    it('should return false for already unlocked weapon', () => {
      const result = weapon.unlockWeapon('laser', 10);
      
      expect(result).toBe(false);
      expect(Logger.debug).toHaveBeenCalledWith(
        'WeaponComponent: Weapon already unlocked: laser'
      );
    });

    it('should return false for insufficient player level', () => {
      const result = weapon.unlockWeapon('plasma', 2); // Requires level 3
      
      expect(result).toBe(false);
      expect(Logger.debug).toHaveBeenCalledWith(
        'WeaponComponent: Level 2 insufficient for plasma (requires 3)'
      );
    });

    it('should successfully unlock weapon with sufficient level', () => {
      const result = weapon.unlockWeapon('plasma', 3);
      
      expect(result).toBe(true);
      expect(weapon.availableWeapons.has('plasma')).toBe(true);
    });

    it('should log successful weapon unlock', () => {
      weapon.unlockWeapon('plasma', 5);
      
      expect(Logger.info).toHaveBeenCalledWith(
        'WeaponComponent: Unlocked Plasma Gun at level 5'
      );
    });

    it('should emit weaponUnlocked event if entity supports it', () => {
      const mockEntity = { emit: vi.fn() };
      weapon.entity = mockEntity;
      
      weapon.unlockWeapon('missile', 7);
      
      expect(mockEntity.emit).toHaveBeenCalledWith('weaponUnlocked', {
        weaponType: 'missile',
        weaponName: 'Missile Launcher',
        playerLevel: 7,
      });
    });

    it('should unlock weapon with exact required level', () => {
      const result = weapon.unlockWeapon('missile', 7); // Exactly level 7
      
      expect(result).toBe(true);
      expect(weapon.availableWeapons.has('missile')).toBe(true);
    });

    it('should unlock weapon with higher than required level', () => {
      const result = weapon.unlockWeapon('plasma', 10); // Higher than level 3
      
      expect(result).toBe(true);
      expect(weapon.availableWeapons.has('plasma')).toBe(true);
    });
  });

  describe('addAmmo method', () => {
    it('should return 0 for unlimited ammo weapons', () => {
      const result = weapon.addAmmo('laser', 50);
      
      expect(result).toBe(0);
      expect(weapon.weaponSpecs.laser.currentAmmo).toBe(-1); // Unchanged
    });

    it('should return 0 for invalid weapon type', () => {
      const result = weapon.addAmmo('invalidWeapon', 50);
      
      expect(result).toBe(0);
    });

    it('should add ammo to limited ammo weapon', () => {
      weapon.weaponSpecs.missile.currentAmmo = 20;
      const result = weapon.addAmmo('missile', 15);
      
      expect(result).toBe(15);
      expect(weapon.weaponSpecs.missile.currentAmmo).toBe(35);
    });

    it('should not exceed maximum ammo capacity', () => {
      weapon.weaponSpecs.missile.currentAmmo = 45; // Close to max of 50
      const result = weapon.addAmmo('missile', 10);
      
      expect(result).toBe(5); // Can only add 5 more
      expect(weapon.weaponSpecs.missile.currentAmmo).toBe(50);
    });

    it('should handle adding zero ammo', () => {
      const initialAmmo = weapon.weaponSpecs.missile.currentAmmo;
      const result = weapon.addAmmo('missile', 0);
      
      expect(result).toBe(0);
      expect(weapon.weaponSpecs.missile.currentAmmo).toBe(initialAmmo);
    });

    it('should handle negative ammo amounts', () => {
      const initialAmmo = weapon.weaponSpecs.missile.currentAmmo;
      const result = weapon.addAmmo('missile', -10);
      
      expect(result).toBe(-10); // Negative amounts are actually subtracted
      expect(weapon.weaponSpecs.missile.currentAmmo).toBe(initialAmmo - 10);
    });

    it('should log ammo addition when successful', () => {
      weapon.weaponSpecs.missile.currentAmmo = 20;
      weapon.addAmmo('missile', 10);
      
      expect(Logger.debug).toHaveBeenCalledWith(
        'WeaponComponent: Added 10 ammo to missile (30/50)'
      );
    });

    it('should not log when no ammo is added', () => {
      // Test with unlimited ammo weapon
      weapon.addAmmo('laser', 50);
      
      expect(Logger.debug).not.toHaveBeenCalledWith(
        expect.stringContaining('Added')
      );
    });
  });

  describe('upgrade methods', () => {
    describe('upgradeDamage', () => {
      it('should add damage bonus', () => {
        weapon.upgradeDamage(10);
        
        expect(weapon.upgradeBonuses.damage).toBe(10);
      });

      it('should accumulate damage bonuses', () => {
        weapon.upgradeDamage(10);
        weapon.upgradeDamage(5);
        
        expect(weapon.upgradeBonuses.damage).toBe(15);
      });

      it('should log damage upgrade', () => {
        weapon.upgradeDamage(15);
        
        expect(Logger.info).toHaveBeenCalledWith(
          'WeaponComponent: Damage upgraded by 15 (total bonus: 15)'
        );
      });

      it('should handle negative damage bonuses', () => {
        weapon.upgradeBonuses.damage = 20;
        weapon.upgradeDamage(-5);
        
        expect(weapon.upgradeBonuses.damage).toBe(15);
      });
    });

    describe('upgradeFireRate', () => {
      it('should add fire rate reduction', () => {
        weapon.upgradeFireRate(50);
        
        expect(weapon.upgradeBonuses.fireRateReduction).toBe(50);
      });

      it('should accumulate fire rate reductions', () => {
        weapon.upgradeFireRate(30);
        weapon.upgradeFireRate(20);
        
        expect(weapon.upgradeBonuses.fireRateReduction).toBe(50);
      });

      it('should log fire rate upgrade', () => {
        weapon.upgradeFireRate(40);
        
        expect(Logger.info).toHaveBeenCalledWith(
          'WeaponComponent: Fire rate upgraded by 40ms (total reduction: 40)'
        );
      });
    });

    describe('upgradeProjectileSpeed', () => {
      it('should add projectile speed bonus', () => {
        weapon.upgradeProjectileSpeed(100);
        
        expect(weapon.upgradeBonuses.projectileSpeedBonus).toBe(100);
      });

      it('should accumulate speed bonuses', () => {
        weapon.upgradeProjectileSpeed(75);
        weapon.upgradeProjectileSpeed(25);
        
        expect(weapon.upgradeBonuses.projectileSpeedBonus).toBe(100);
      });

      it('should log speed upgrade', () => {
        weapon.upgradeProjectileSpeed(80);
        
        expect(Logger.info).toHaveBeenCalledWith(
          'WeaponComponent: Projectile speed upgraded by 80 (total bonus: 80)'
        );
      });
    });
  });

  describe('continuous fire methods', () => {
    describe('setContinuousFire', () => {
      it('should set continuous fire mode', () => {
        weapon.setContinuousFire(true);
        
        expect(weapon.continuousFire).toBe(true);
      });

      it('should clear isFiring when disabling continuous fire', () => {
        weapon.isFiring = true;
        weapon.setContinuousFire(false);
        
        expect(weapon.continuousFire).toBe(false);
        expect(weapon.isFiring).toBe(false);
      });

      it('should not clear isFiring when enabling continuous fire', () => {
        weapon.isFiring = true;
        weapon.setContinuousFire(true);
        
        expect(weapon.continuousFire).toBe(true);
        expect(weapon.isFiring).toBe(true);
      });
    });

    describe('stopFiring', () => {
      it('should set isFiring to false', () => {
        weapon.isFiring = true;
        weapon.stopFiring();
        
        expect(weapon.isFiring).toBe(false);
      });

      it('should not affect continuousFire setting', () => {
        weapon.continuousFire = true;
        weapon.stopFiring();
        
        expect(weapon.continuousFire).toBe(true);
      });
    });
  });

  describe('update method', () => {
    it('should clear isFiring when not in continuous fire mode', () => {
      weapon.isFiring = true;
      weapon.continuousFire = false;
      
      weapon.update(16);
      
      expect(weapon.isFiring).toBe(false);
    });

    it('should preserve isFiring when in continuous fire mode', () => {
      weapon.isFiring = true;
      weapon.continuousFire = true;
      
      weapon.update(16);
      
      expect(weapon.isFiring).toBe(true);
    });

    it('should not change isFiring when already false', () => {
      weapon.isFiring = false;
      weapon.continuousFire = false;
      
      weapon.update(16);
      
      expect(weapon.isFiring).toBe(false);
    });
  });

  describe('getAvailableWeapons method', () => {
    beforeEach(() => {
      weapon.availableWeapons.add('plasma');
      weapon.availableWeapons.add('missile');
      weapon.currentWeapon = 'plasma';
    });

    it('should return available weapons with status information', () => {
      const weapons = weapon.getAvailableWeapons();
      
      expect(weapons).toHaveLength(3);
      
      const laser = weapons.find(w => w.type === 'laser');
      expect(laser).toEqual({
        type: 'laser',
        name: 'Laser Cannon',
        current: false,
        ammo: -1,
        maxAmmo: -1,
        unlockLevel: 1,
      });

      const plasma = weapons.find(w => w.type === 'plasma');
      expect(plasma).toEqual({
        type: 'plasma',
        name: 'Plasma Gun',
        current: true,
        ammo: -1,
        maxAmmo: -1,
        unlockLevel: 3,
      });

      const missile = weapons.find(w => w.type === 'missile');
      expect(missile).toEqual({
        type: 'missile',
        name: 'Missile Launcher',
        current: false,
        ammo: 50,
        maxAmmo: 50,
        unlockLevel: 7,
      });
    });

    it('should return empty array when no weapons available', () => {
      weapon.availableWeapons.clear();
      const weapons = weapon.getAvailableWeapons();
      
      expect(weapons).toEqual([]);
    });

    it('should reflect current ammo states', () => {
      weapon.weaponSpecs.missile.currentAmmo = 25;
      const weapons = weapon.getAvailableWeapons();
      
      const missile = weapons.find(w => w.type === 'missile');
      expect(missile.ammo).toBe(25);
    });
  });

  describe('needsAmmo method', () => {
    beforeEach(() => {
      weapon.availableWeapons.add('missile');
    });

    it('should return false when all weapons have sufficient ammo', () => {
      weapon.weaponSpecs.missile.currentAmmo = 40; // 80% of max (50)
      
      expect(weapon.needsAmmo()).toBe(false);
    });

    it('should return true when any weapon is low on ammo', () => {
      weapon.weaponSpecs.missile.currentAmmo = 10; // 20% of max (less than 30%)
      
      expect(weapon.needsAmmo()).toBe(true);
    });

    it('should ignore unlimited ammo weapons', () => {
      // Only laser is available (unlimited ammo)
      weapon.availableWeapons.clear();
      weapon.availableWeapons.add('laser');
      
      expect(weapon.needsAmmo()).toBe(false);
    });

    it('should return false with exactly 30% ammo', () => {
      weapon.weaponSpecs.missile.currentAmmo = 15; // Exactly 30% of 50
      
      expect(weapon.needsAmmo()).toBe(false);
    });

    it('should return true with just below 30% ammo', () => {
      weapon.weaponSpecs.missile.currentAmmo = 14; // Just below 30%
      
      expect(weapon.needsAmmo()).toBe(true);
    });

    it('should handle multiple limited ammo weapons', () => {
      // Create a test scenario with custom weapon specs
      weapon.weaponSpecs.testWeapon = {
        maxAmmo: 100,
        currentAmmo: 80, // 80% - sufficient
      };
      weapon.availableWeapons.add('testWeapon');
      weapon.weaponSpecs.missile.currentAmmo = 40; // 80% - sufficient
      
      expect(weapon.needsAmmo()).toBe(false);
      
      // Make one weapon low
      weapon.weaponSpecs.testWeapon.currentAmmo = 20; // 20% - low
      expect(weapon.needsAmmo()).toBe(true);
    });
  });

  describe('serialization', () => {
    describe('serialize method', () => {
      it('should serialize weapon component data', () => {
        weapon.currentWeapon = 'plasma';
        weapon.availableWeapons.add('plasma');
        weapon.upgradeLevel = 5;
        weapon.continuousFire = true;
        weapon.upgradeBonuses = {
          damage: 10,
          fireRateReduction: 50,
          projectileSpeedBonus: 100,
        };
        weapon.weaponSpecs.missile.currentAmmo = 25;

        const serialized = weapon.serialize();

        expect(serialized).toEqual({
          type: 'WeaponComponent',
          componentId: weapon.componentId,
          active: true,
          currentWeapon: 'plasma',
          availableWeapons: ['laser', 'plasma'],
          upgradeLevel: 5,
          upgradeBonuses: {
            damage: 10,
            fireRateReduction: 50,
            projectileSpeedBonus: 100,
          },
          weaponAmmo: {
            laser: -1,
            plasma: -1,
            missile: 25,
          },
          continuousFire: true,
        });
      });

      it('should include all weapon ammo states', () => {
        weapon.weaponSpecs.missile.currentAmmo = 30;
        const serialized = weapon.serialize();

        expect(serialized.weaponAmmo).toEqual({
          laser: -1,
          plasma: -1,
          missile: 30,
        });
      });
    });

    describe('deserialize method', () => {
      it('should deserialize weapon data by calling init', () => {
        const initSpy = vi.spyOn(weapon, 'init');
        const testData = {
          currentWeapon: 'plasma',
          upgradeLevel: 3,
        };

        weapon.deserialize(testData);

        expect(initSpy).toHaveBeenCalledWith(testData);
      });
    });
  });

  describe('validate method', () => {
    it('should return true for valid weapon state', () => {
      expect(weapon.validate()).toBe(true);
    });

    it('should return false for invalid current weapon', () => {
      weapon.currentWeapon = 'invalidWeapon';
      
      expect(weapon.validate()).toBe(false);
    });

    it('should return false when current weapon not in available weapons', () => {
      weapon.currentWeapon = 'plasma';
      // plasma not in availableWeapons
      
      expect(weapon.validate()).toBe(false);
    });

    it('should return false for invalid upgrade level', () => {
      weapon.upgradeLevel = 0;
      
      expect(weapon.validate()).toBe(false);
    });

    it('should return false for negative damage bonus', () => {
      weapon.upgradeBonuses.damage = -5;
      
      expect(weapon.validate()).toBe(false);
    });

    it('should return false for negative fire rate reduction', () => {
      weapon.upgradeBonuses.fireRateReduction = -10;
      
      expect(weapon.validate()).toBe(false);
    });

    it('should return false for negative projectile speed bonus', () => {
      weapon.upgradeBonuses.projectileSpeedBonus = -20;
      
      expect(weapon.validate()).toBe(false);
    });

    it('should return true for valid upgraded state', () => {
      weapon.availableWeapons.add('plasma');
      weapon.currentWeapon = 'plasma';
      weapon.upgradeLevel = 5;
      weapon.upgradeBonuses = {
        damage: 15,
        fireRateReduction: 75,
        projectileSpeedBonus: 150,
      };
      
      expect(weapon.validate()).toBe(true);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle firing with zero time difference', () => {
      weapon.lastFireTime = 1000;
      mockDateNow.mockReturnValue(1000); // Same time
      
      expect(weapon.canFireWeapon()).toBe(false);
    });

    it('should handle very large upgrade bonuses', () => {
      weapon.upgradeBonuses = {
        damage: 1000000,
        fireRateReduction: 1000000,
        projectileSpeedBonus: 1000000,
      };

      const spec = weapon.getCurrentWeaponSpec();
      
      expect(spec.damage).toBe(1000025); // Should not crash
      expect(spec.fireRate).toBe(50); // Should respect minimum
      expect(spec.projectileSpeed).toBe(1000800); // Should not crash
    });

    it('should handle switching to same weapon', () => {
      weapon.availableWeapons.add('laser'); // Already has laser
      const result = weapon.switchWeapon('laser');
      
      expect(result).toBe(true);
      expect(weapon.currentWeapon).toBe('laser');
    });

    it('should handle unlock weapon at exactly required level', () => {
      const result = weapon.unlockWeapon('plasma', 3); // Exactly level 3
      
      expect(result).toBe(true);
    });

    it('should handle addAmmo with weapon at exactly max capacity', () => {
      weapon.weaponSpecs.missile.currentAmmo = 50; // At max
      const result = weapon.addAmmo('missile', 10);
      
      expect(result).toBe(0);
      expect(weapon.weaponSpecs.missile.currentAmmo).toBe(50);
    });

    it('should handle empty available weapons in needsAmmo', () => {
      weapon.availableWeapons.clear();
      
      expect(weapon.needsAmmo()).toBe(false);
    });

    it('should handle concurrent fire attempts', () => {
      // First fire should succeed
      const result1 = weapon.fire();
      expect(result1).not.toBe(null);
      
      // Immediate second fire should fail due to cooldown
      const result2 = weapon.fire();
      expect(result2).toBe(null);
    });

    it('should maintain state consistency after multiple operations', () => {
      // Perform multiple operations
      weapon.unlockWeapon('plasma', 5);
      weapon.switchWeapon('plasma');
      weapon.upgradeDamage(20);
      weapon.upgradeFireRate(100);
      weapon.setContinuousFire(true);
      
      // Verify state is consistent
      expect(weapon.validate()).toBe(true);
      expect(weapon.currentWeapon).toBe('plasma');
      expect(weapon.availableWeapons.has('plasma')).toBe(true);
      expect(weapon.continuousFire).toBe(true);
      
      // Verify serialization/deserialization maintains consistency
      const serialized = weapon.serialize();
      const newWeapon = new WeaponComponent();
      newWeapon.deserialize(serialized);
      
      expect(newWeapon.validate()).toBe(true);
      expect(newWeapon.currentWeapon).toBe('plasma');
    });
  });

  describe('time-based behavior', () => {
    it('should handle rapid fire attempts correctly', () => {
      const fireResults = [];
      
      // Attempt to fire multiple times in quick succession
      for (let i = 0; i < 5; i++) {
        mockDateNow.mockReturnValue(1000 + i * 100); // 100ms intervals
        fireResults.push(weapon.fire() !== null);
      }
      
      // Only first fire should succeed (300ms fire rate), 4th would succeed at 300ms
      expect(fireResults).toEqual([true, false, false, true, false]);
    });

    it('should allow firing after sufficient cooldown', () => {
      // First fire
      mockDateNow.mockReturnValue(1000);
      const result1 = weapon.fire();
      expect(result1).not.toBe(null);
      
      // Wait for cooldown (300ms + 1ms)
      mockDateNow.mockReturnValue(1301);
      const result2 = weapon.fire();
      expect(result2).not.toBe(null);
    });

    it('should handle scopeName time changes gracefully', () => {
      // Fire at time 1000
      mockDateNow.mockReturnValue(1000);
      weapon.fire();
      
      // System time goes backwards (shouldn't happen but handle gracefully)
      mockDateNow.mockReturnValue(500);
      expect(weapon.canFireWeapon()).toBe(false); // Still in cooldown
      
      // Time moves forward normally
      mockDateNow.mockReturnValue(1500);
      expect(weapon.canFireWeapon()).toBe(true);
    });
  });

  describe('integration with entity events', () => {
    let mockEntity;

    beforeEach(() => {
      mockEntity = { emit: vi.fn() };
      weapon.entity = mockEntity;
    });

    it('should emit all events in sequence during typical gameplay', () => {
      // Unlock weapon
      weapon.unlockWeapon('plasma', 5);
      expect(mockEntity.emit).toHaveBeenCalledWith('weaponUnlocked', expect.any(Object));
      
      // Switch weapon
      weapon.switchWeapon('plasma');
      expect(mockEntity.emit).toHaveBeenCalledWith('weaponSwitch', expect.any(Object));
      
      // Fire weapon
      weapon.fire();
      expect(mockEntity.emit).toHaveBeenCalledWith('weaponFire', expect.any(Object));
      
      expect(mockEntity.emit).toHaveBeenCalledTimes(3);
    });

    it('should include correct data in weapon fire events', () => {
      weapon.upgradeBonuses.damage = 10;
      weapon.fire();
      
      expect(mockEntity.emit).toHaveBeenCalledWith('weaponFire', {
        weaponType: 'laser',
        spec: expect.objectContaining({
          damage: 35, // 25 + 10 upgrade
          projectileSpeed: 800,
          fireRate: 300,
        }),
        remainingAmmo: -1,
      });
    });

    it('should handle entity without emit method gracefully', () => {
      weapon.entity = {}; // No emit method
      
      expect(() => {
        weapon.unlockWeapon('plasma', 5);
        weapon.switchWeapon('plasma');
        weapon.fire();
      }).not.toThrow();
    });
  });
});