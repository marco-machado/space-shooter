import { defineComponent, Types } from 'bitecs';
import Logger from '@/utils/Logger.js';

const logger = Logger.scope('ECS:Position');

/**
 * Position component for entity spatial coordinates.
 * Stores 32-bit floating point x,y position values.
 * 
 * @component Position
 * @property {Types.f32} x - X coordinate position
 * @property {Types.f32} y - Y coordinate position
 */
export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32
});

logger.debug('Position component defined');

export default Position;