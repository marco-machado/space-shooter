import { defineQuery, enterQuery, exitQuery } from 'bitecs';
import { Position, Weapon, Player, Enemy } from '@/ecs/components/index.js';
import { weaponQuery, playerCombatQuery, enemyCombatQuery } from './queries.js';
import Logger from '@/utils/Logger.js';

const logger = Logger.scope('ECS:WeaponSystem');

/**
 * Query for entities that have just entered the weapon system.
 * Used for weapon initialization and setup.
 */
export const enteredWeaponQuery = enterQuery(weaponQuery);

/**
 * Query for entities that have just exited the weapon system.
 * Used for weapon cleanup.
 */
export const exitedWeaponQuery = exitQuery(weaponQuery);

/**
 * Weapon system that handles firing mechanics for entities with weapons.
 * Manages fire rates, cooldowns, and projectile creation triggers.
 * 
 * @param {Object} world - The bitECS world instance
 * @returns {Object} The world instance for pipeline chaining
 */
export const weaponSystem = (world) => {
  const { time: { elapsed } } = world;
  
  // Handle entities that just entered the weapon system
  const enteredEntities = enteredWeaponQuery(world);
  for (let i = 0; i < enteredEntities.length; i++) {
    const eid = enteredEntities[i];
    
    // Initialize weapon state
    if (Weapon.lastFired[eid] === 0) {
      Weapon.lastFired[eid] = elapsed;
    }
    
    logger.debug('Entity entered weapon system', { 
      eid,
      weaponType: Weapon.weaponType[eid],
      fireRate: Weapon.fireRate[eid],
      damage: Weapon.damage[eid]
    });
  }
  
  // Process all entities with weapons
  const weaponEntities = weaponQuery(world);
  let weaponsFired = 0;
  
  for (let i = 0; i < weaponEntities.length; i++) {
    const eid = weaponEntities[i];
    
    // Check if weapon can fire (fire rate cooldown)
    const timeSinceLastFired = elapsed - Weapon.lastFired[eid];
    const canFire = timeSinceLastFired >= Weapon.fireRate[eid];
    
    if (canFire) {
      // Determine if entity should fire based on type
      let shouldFire = false;
      
      // Player weapons: will be triggered by input system later
      // For now, we just track cooldowns
      
      // Enemy weapons: basic AI firing logic
      if (world.entityTypeMap?.get(eid) === 'enemy') {
        // Simple AI: fire periodically at player position
        // This is basic logic - AI system will handle more complex targeting
        shouldFire = Math.random() < 0.02; // 2% chance per frame when cooldown allows
      }
      
      if (shouldFire) {
        // Trigger projectile creation (will be handled by projectile creation system)
        // For now, we just update the lastFired timestamp
        Weapon.lastFired[eid] = elapsed;
        
        // Store firing event for projectile system to process
        if (!world.weaponEvents) {
          world.weaponEvents = [];
        }
        
        world.weaponEvents.push({
          shooterEid: eid,
          x: Position.x[eid],
          y: Position.y[eid],
          damage: Weapon.damage[eid],
          projectileSpeed: Weapon.projectileSpeed[eid],
          weaponType: Weapon.weaponType[eid],
          timestamp: elapsed
        });
        
        weaponsFired++;
        
        logger.debug('Weapon fired', {
          eid,
          weaponType: Weapon.weaponType[eid],
          damage: Weapon.damage[eid],
          projectileSpeed: Weapon.projectileSpeed[eid]
        });
      }
    }
  }
  
  // Handle entities that just exited the weapon system
  const exitedEntities = exitedWeaponQuery(world);
  for (let i = 0; i < exitedEntities.length; i++) {
    const eid = exitedEntities[i];
    logger.debug('Entity exited weapon system', { eid });
  }
  
  // Log system execution
  if (weaponsFired > 0) {
    logger.debug('Weapon system updated', { 
      totalWeapons: weaponEntities.length,
      weaponsFired,
      weaponEvents: world.weaponEvents?.length || 0
    });
  }
  
  return world;
};

/**
 * Trigger weapon firing for a specific entity.
 * Used by input systems or AI to initiate weapon fire.
 * 
 * @param {Object} world - The bitECS world instance
 * @param {number} eid - Entity ID to fire weapon
 * @returns {boolean} True if weapon was fired, false if on cooldown
 */
export const triggerWeaponFire = (world, eid) => {
  const { time: { elapsed } } = world;
  
  // Check if entity has weapon
  if (Weapon.fireRate[eid] === undefined) {
    logger.warn('Attempted to fire weapon on entity without weapon component', { eid });
    return false;
  }
  
  // Check cooldown
  const timeSinceLastFired = elapsed - Weapon.lastFired[eid];
  const canFire = timeSinceLastFired >= Weapon.fireRate[eid];
  
  if (!canFire) {
    return false;
  }
  
  // Fire weapon
  Weapon.lastFired[eid] = elapsed;
  
  // Create weapon event
  if (!world.weaponEvents) {
    world.weaponEvents = [];
  }
  
  world.weaponEvents.push({
    shooterEid: eid,
    x: Position.x[eid],
    y: Position.y[eid],
    damage: Weapon.damage[eid],
    projectileSpeed: Weapon.projectileSpeed[eid],
    weaponType: Weapon.weaponType[eid],
    timestamp: elapsed
  });
  
  logger.debug('Weapon triggered', { eid, weaponType: Weapon.weaponType[eid] });
  return true;
};

/**
 * Set weapon properties for an entity.
 * 
 * @param {number} eid - Entity ID
 * @param {Object} weaponConfig - Weapon configuration
 * @param {number} weaponConfig.fireRate - Fire rate in milliseconds
 * @param {number} weaponConfig.damage - Damage per projectile
 * @param {number} weaponConfig.projectileSpeed - Projectile speed
 * @param {number} weaponConfig.weaponType - Weapon type identifier
 * @returns {void}
 */
export const setWeaponConfig = (eid, weaponConfig) => {
  const { fireRate, damage, projectileSpeed, weaponType } = weaponConfig;
  
  if (fireRate !== undefined) Weapon.fireRate[eid] = fireRate;
  if (damage !== undefined) Weapon.damage[eid] = damage;
  if (projectileSpeed !== undefined) Weapon.projectileSpeed[eid] = projectileSpeed;
  if (weaponType !== undefined) Weapon.weaponType[eid] = weaponType;
};

/**
 * Get weapon cooldown remaining for an entity.
 * 
 * @param {Object} world - The bitECS world instance
 * @param {number} eid - Entity ID
 * @returns {number} Cooldown remaining in milliseconds, 0 if ready to fire
 */
export const getWeaponCooldown = (world, eid) => {
  const { time: { elapsed } } = world;
  const timeSinceLastFired = elapsed - Weapon.lastFired[eid];
  const cooldownRemaining = Weapon.fireRate[eid] - timeSinceLastFired;
  return Math.max(0, cooldownRemaining);
};

/**
 * Check if weapon can fire.
 * 
 * @param {Object} world - The bitECS world instance
 * @param {number} eid - Entity ID
 * @returns {boolean} True if weapon can fire
 */
export const canWeaponFire = (world, eid) => {
  return getWeaponCooldown(world, eid) === 0;
};

logger.debug('Weapon system initialized');

export default weaponSystem;