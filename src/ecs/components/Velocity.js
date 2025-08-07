import { defineComponent, Types } from 'bitecs';
import Logger from '@/utils/Logger.js';

const logger = Logger.scope('ECS:Velocity');

/**
 * Velocity component for entity movement vectors.
 * Stores 32-bit floating point x,y velocity values in pixels per millisecond.
 * 
 * @component Velocity
 * @property {Types.f32} x - X velocity vector
 * @property {Types.f32} y - Y velocity vector
 */
export const Velocity = defineComponent({
  x: Types.f32,
  y: Types.f32
});

logger.debug('Velocity component defined');

export default Velocity;