import { defineComponent, Types } from 'bitecs';
import Logger from '@/utils/Logger.js';

const logger = Logger.scope('ECS:Health');

/**
 * Health component for entity damage and survival mechanics.
 * Stores integer values for current and maximum health points.
 * 
 * @component Health
 * @property {Types.i32} current - Current health points
 * @property {Types.i32} max - Maximum health points
 */
export const Health = defineComponent({
  current: Types.i32,
  max: Types.i32
});

logger.debug('Health component defined');

export default Health;