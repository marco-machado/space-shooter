import { defineComponent, Types } from 'bitecs';
import Logger from '@/utils/Logger.js';

const logger = Logger.scope('ECS:Render');

/**
 * Render component for Phaser sprite synchronization.
 * Manages visual representation and rendering properties of entities.
 * 
 * @component Render
 * @property {Types.ui32} spriteId - Unique identifier for sprite mapping
 * @property {Types.ui8} visible - Visibility flag (0=hidden, 1=visible)
 * @property {Types.ui8} layer - Rendering layer/depth (0-255)
 */
export const Render = defineComponent({
  spriteId: Types.ui32,
  visible: Types.ui8,
  layer: Types.ui8
});

logger.debug('Render component defined');

export default Render;