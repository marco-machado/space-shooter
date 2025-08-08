import { defineComponent, Types } from 'bitecs';
import Logger from '@/utils/Logger.js';

const logger = Logger.scope('ECS:ProjectileData');

/**
 * ProjectileData component for projectile-specific state.
 * Stores damage, owner, and lifetime tracking.
 *
 * @component ProjectileData
 * @property {Types.i32} damage - Damage dealt on hit
 * @property {Types.ui8} owner - 0=player, 1=enemy
 * @property {Types.f32} life - Current lifetime (ms)
 * @property {Types.f32} maxLife - Max lifetime before auto-despawn (ms)
 */
export const ProjectileData = defineComponent({
  damage: Types.i32,
  owner: Types.ui8,
  life: Types.f32,
  maxLife: Types.f32
});

logger.debug('ProjectileData component defined');

export default ProjectileData;

