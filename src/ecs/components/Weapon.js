import { defineComponent, Types } from 'bitecs';
import Logger from '@/utils/Logger.js';

const logger = Logger.scope('ECS:Weapon');

/**
 * Weapon component for entity firing mechanics.
 * Stores weapon configuration and state for projectile systems.
 * 
 * @component Weapon
 * @property {Types.f32} fireRate - Time between shots in milliseconds
 * @property {Types.f32} lastFired - Last firing timestamp
 * @property {Types.i32} damage - Damage dealt per projectile
 * @property {Types.f32} projectileSpeed - Speed of fired projectiles
 * @property {Types.ui8} weaponType - Weapon type identifier (0-255)
 */
export const Weapon = defineComponent({
  fireRate: Types.f32,
  lastFired: Types.f32,
  damage: Types.i32,
  projectileSpeed: Types.f32,
  weaponType: Types.ui8
});

logger.debug('Weapon component defined');

export default Weapon;