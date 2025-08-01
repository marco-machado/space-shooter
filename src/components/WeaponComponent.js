import Component from './Component.js';
import Logger from '../core/Logger.js';

/**
 * Weapon Component
 * Manages weapon types, firing mechanics, cooldowns, and ammunition
 */
class WeaponComponent extends Component {
  constructor(weaponType = 'laser') {
    super();

    // Current weapon configuration
    this.currentWeapon = weaponType;
    this.availableWeapons = new Set(['laser']); // Player starts with laser only

    // Weapon specifications based on PRD
    this.weaponSpecs = {
      laser: {
        name: 'Laser Cannon',
        damage: 25,
        fireRate: 300, // milliseconds between shots
        projectileSpeed: 800,
        projectileColor: 0xffff00, // Yellow
        projectileSize: { width: 12, height: 4 },
        ammoType: 'energy',
        maxAmmo: -1, // Unlimited
        currentAmmo: -1,
        unlockLevel: 1,
        sound: 'laser_fire',
      },
      plasma: {
        name: 'Plasma Gun',
        damage: 40,
        fireRate: 500, // Slower but more powerful
        projectileSpeed: 600,
        projectileColor: 0x00ff88, // Green-blue
        projectileSize: { width: 16, height: 8 },
        ammoType: 'energy',
        maxAmmo: -1, // Unlimited
        currentAmmo: -1,
        unlockLevel: 3,
        sound: 'plasma_fire',
      },
      missile: {
        name: 'Missile Launcher',
        damage: 100,
        fireRate: 1200, // Much slower but devastating
        projectileSpeed: 400,
        projectileColor: 0xff8800, // Orange
        projectileSize: { width: 8, height: 16 },
        ammoType: 'explosive',
        maxAmmo: 50,
        currentAmmo: 50,
        unlockLevel: 7,
        sound: 'missile_fire',
      },
    };

    // Firing state
    this.lastFireTime = 0;
    this.canFire = true;
    this.continuousFire = false;
    this.isFiring = false;

    // Upgrade system
    this.upgradeLevel = 1;
    this.upgradeBonuses = {
      damage: 0,
      fireRateReduction: 0, // Milliseconds reduced from fire rate
      projectileSpeedBonus: 0,
    };

    Logger.debug(`WeaponComponent created: ${this.currentWeapon} weapon`);
  }

  /**
   * Initialize weapon component with specific configuration
   * @param {Object} data - Weapon configuration
   */
  init(data = {}) {
    super.init(data);

    this.currentWeapon = data.currentWeapon || 'laser';
    this.upgradeLevel = Math.max(1, data.upgradeLevel || 1);
    this.continuousFire = data.continuousFire || false;

    // Initialize available weapons
    if (data.availableWeapons) {
      this.availableWeapons = new Set(data.availableWeapons);
    }

    // Apply any saved ammo states
    if (data.weaponAmmo) {
      Object.keys(data.weaponAmmo).forEach(weaponType => {
        if (this.weaponSpecs[weaponType]) {
          this.weaponSpecs[weaponType].currentAmmo = data.weaponAmmo[weaponType];
        }
      });
    }

    // Apply upgrade bonuses
    if (data.upgradeBonuses) {
      this.upgradeBonuses = { ...this.upgradeBonuses, ...data.upgradeBonuses };
    }
  }

  /**
   * Get current weapon specifications with upgrades applied
   * @returns {Object} Current weapon spec
   */
  getCurrentWeaponSpec() {
    const baseSpec = { ...this.weaponSpecs[this.currentWeapon] };

    // Apply upgrade bonuses
    baseSpec.damage += this.upgradeBonuses.damage;
    baseSpec.fireRate = Math.max(50, baseSpec.fireRate - this.upgradeBonuses.fireRateReduction);
    baseSpec.projectileSpeed += this.upgradeBonuses.projectileSpeedBonus;

    return baseSpec;
  }

  /**
   * Check if weapon can fire
   * @returns {boolean} True if weapon can fire
   */
  canFireWeapon() {
    if (!this.canFire) return false;

    const currentTime = Date.now();
    const weaponSpec = this.getCurrentWeaponSpec();

    // Check fire rate cooldown
    if (currentTime - this.lastFireTime < weaponSpec.fireRate) {
      return false;
    }

    // Check ammo
    if (weaponSpec.maxAmmo > 0 && weaponSpec.currentAmmo <= 0) {
      return false;
    }

    return true;
  }

  /**
   * Attempt to fire weapon
   * @returns {Object|null} Projectile configuration or null if can't fire
   */
  fire() {
    if (!this.canFireWeapon()) {
      return null;
    }

    const weaponSpec = this.getCurrentWeaponSpec();
    this.lastFireTime = Date.now();
    this.isFiring = true;

    // Consume ammo if limited
    if (weaponSpec.maxAmmo > 0) {
      this.weaponSpecs[this.currentWeapon].currentAmmo--;
    }

    Logger.debug(`WeaponComponent fired: ${this.currentWeapon} (ammo: ${weaponSpec.currentAmmo})`);

    // Emit fire event if entity supports it
    if (this.entity && this.entity.emit) {
      this.entity.emit('weaponFire', {
        weaponType: this.currentWeapon,
        spec: weaponSpec,
        remainingAmmo: weaponSpec.currentAmmo,
      });
    }

    // Return projectile configuration
    return {
      damage: weaponSpec.damage,
      speed: weaponSpec.projectileSpeed,
      color: weaponSpec.projectileColor,
      size: weaponSpec.projectileSize,
      weaponType: this.currentWeapon,
      sound: weaponSpec.sound,
    };
  }

  /**
   * Switch to a different weapon
   * @param {string} weaponType - Target weapon type
   * @returns {boolean} True if switch successful
   */
  switchWeapon(weaponType) {
    if (!this.availableWeapons.has(weaponType) || !this.weaponSpecs[weaponType]) {
      Logger.warn(`WeaponComponent: Cannot switch to unavailable weapon: ${weaponType}`);
      return false;
    }

    const previousWeapon = this.currentWeapon;
    this.currentWeapon = weaponType;
    this.lastFireTime = 0; // Reset cooldown when switching

    Logger.info(`WeaponComponent: Switched from ${previousWeapon} to ${weaponType}`);

    // Emit weapon switch event if entity supports it
    if (this.entity && this.entity.emit) {
      this.entity.emit('weaponSwitch', {
        previousWeapon,
        currentWeapon: this.currentWeapon,
        spec: this.getCurrentWeaponSpec(),
      });
    }

    return true;
  }

  /**
   * Unlock a new weapon
   * @param {string} weaponType - Weapon to unlock
   * @param {number} playerLevel - Current player level
   * @returns {boolean} True if weapon was unlocked
   */
  unlockWeapon(weaponType, playerLevel) {
    const weaponSpec = this.weaponSpecs[weaponType];

    if (!weaponSpec) {
      Logger.warn(`WeaponComponent: Unknown weapon type: ${weaponType}`);
      return false;
    }

    if (this.availableWeapons.has(weaponType)) {
      Logger.debug(`WeaponComponent: Weapon already unlocked: ${weaponType}`);
      return false;
    }

    if (playerLevel < weaponSpec.unlockLevel) {
      Logger.debug(
        `WeaponComponent: Level ${playerLevel} insufficient for ${weaponType} (requires ${weaponSpec.unlockLevel})`
      );
      return false;
    }

    this.availableWeapons.add(weaponType);
    Logger.info(`WeaponComponent: Unlocked ${weaponSpec.name} at level ${playerLevel}`);

    // Emit unlock event if entity supports it
    if (this.entity && this.entity.emit) {
      this.entity.emit('weaponUnlocked', {
        weaponType,
        weaponName: weaponSpec.name,
        playerLevel,
      });
    }

    return true;
  }

  /**
   * Add ammo to a weapon
   * @param {string} weaponType - Weapon type
   * @param {number} amount - Ammo amount to add
   * @returns {number} Actual ammo added
   */
  addAmmo(weaponType, amount) {
    const weaponSpec = this.weaponSpecs[weaponType];

    if (!weaponSpec || weaponSpec.maxAmmo <= 0) {
      return 0; // Unlimited ammo weapons don't need ammo pickups
    }

    const previousAmmo = weaponSpec.currentAmmo;
    weaponSpec.currentAmmo = Math.min(weaponSpec.maxAmmo, weaponSpec.currentAmmo + amount);
    const actualAmmoAdded = weaponSpec.currentAmmo - previousAmmo;

    if (actualAmmoAdded > 0) {
      Logger.debug(
        `WeaponComponent: Added ${actualAmmoAdded} ammo to ${weaponType} (${weaponSpec.currentAmmo}/${weaponSpec.maxAmmo})`
      );
    }

    return actualAmmoAdded;
  }

  /**
   * Upgrade weapon damage
   * @param {number} damageBonus - Additional damage bonus
   */
  upgradeDamage(damageBonus) {
    this.upgradeBonuses.damage += damageBonus;
    Logger.info(
      `WeaponComponent: Damage upgraded by ${damageBonus} (total bonus: ${this.upgradeBonuses.damage})`
    );
  }

  /**
   * Upgrade weapon fire rate
   * @param {number} fireRateReduction - Milliseconds to reduce from fire rate
   */
  upgradeFireRate(fireRateReduction) {
    this.upgradeBonuses.fireRateReduction += fireRateReduction;
    Logger.info(
      `WeaponComponent: Fire rate upgraded by ${fireRateReduction}ms (total reduction: ${this.upgradeBonuses.fireRateReduction})`
    );
  }

  /**
   * Upgrade projectile speed
   * @param {number} speedBonus - Additional speed bonus
   */
  upgradeProjectileSpeed(speedBonus) {
    this.upgradeBonuses.projectileSpeedBonus += speedBonus;
    Logger.info(
      `WeaponComponent: Projectile speed upgraded by ${speedBonus} (total bonus: ${this.upgradeBonuses.projectileSpeedBonus})`
    );
  }

  /**
   * Set continuous firing mode
   * @param {boolean} continuous - True for continuous firing
   */
  setContinuousFire(continuous) {
    this.continuousFire = continuous;
    if (!continuous) {
      this.isFiring = false;
    }
  }

  /**
   * Stop firing
   */
  stopFiring() {
    this.isFiring = false;
  }

  /**
   * Update weapon component
   * @param {number} delta - Time delta in milliseconds
   */
  update(_delta) {
    // Update firing state based on cooldown
    if (this.isFiring && !this.continuousFire) {
      this.isFiring = false;
    }
  }

  /**
   * Get all available weapons with their status
   * @returns {Array} Available weapons info
   */
  getAvailableWeapons() {
    return Array.from(this.availableWeapons).map(weaponType => {
      const spec = this.weaponSpecs[weaponType];
      return {
        type: weaponType,
        name: spec.name,
        current: weaponType === this.currentWeapon,
        ammo: spec.currentAmmo,
        maxAmmo: spec.maxAmmo,
        unlockLevel: spec.unlockLevel,
      };
    });
  }

  /**
   * Check if any weapon needs ammo
   * @returns {boolean} True if any weapon is low on ammo
   */
  needsAmmo() {
    return Array.from(this.availableWeapons).some(weaponType => {
      const spec = this.weaponSpecs[weaponType];
      return spec.maxAmmo > 0 && spec.currentAmmo < spec.maxAmmo * 0.3; // Less than 30%
    });
  }

  /**
   * Serialize weapon component data
   * @returns {Object} Serializable data
   */
  serialize() {
    const weaponAmmo = {};
    Object.keys(this.weaponSpecs).forEach(weaponType => {
      weaponAmmo[weaponType] = this.weaponSpecs[weaponType].currentAmmo;
    });

    return {
      ...super.serialize(),
      currentWeapon: this.currentWeapon,
      availableWeapons: Array.from(this.availableWeapons),
      upgradeLevel: this.upgradeLevel,
      upgradeBonuses: this.upgradeBonuses,
      weaponAmmo,
      continuousFire: this.continuousFire,
    };
  }

  /**
   * Deserialize weapon component data
   * @param {Object} data - Saved data
   */
  deserialize(data) {
    super.deserialize(data);
    this.init(data);
  }

  /**
   * Validate weapon component data
   * @returns {boolean} True if valid
   */
  validate() {
    return (
      this.weaponSpecs[this.currentWeapon] !== undefined &&
      this.availableWeapons.has(this.currentWeapon) &&
      this.upgradeLevel >= 1 &&
      this.upgradeBonuses.damage >= 0 &&
      this.upgradeBonuses.fireRateReduction >= 0 &&
      this.upgradeBonuses.projectileSpeedBonus >= 0
    );
  }
}

export default WeaponComponent;
