import { defineComponent, Types } from 'bitecs';
import Logger from '@/utils/Logger.js';

const logger = Logger.scope('ECS:Input');

/**
 * Input component for entities that respond to user input.
 * Stores current input state and movement direction.
 * 
 * @component Input
 * @property {Types.f32} moveX - Normalized X axis movement (-1 to 1)
 * @property {Types.f32} moveY - Normalized Y axis movement (-1 to 1)
 * @property {Types.ui8} firing - Whether the entity is firing (0 or 1)
 * @property {Types.ui32} lastFireTime - Last time the entity fired (milliseconds)
 * @property {Types.ui32} fireCooldown - Fire cooldown in milliseconds
 */
export const Input = defineComponent({
  moveX: Types.f32,
  moveY: Types.f32,
  firing: Types.ui8,
  lastFireTime: Types.ui32,
  fireCooldown: Types.ui32
});

logger.debug('Input component defined');

export default Input;