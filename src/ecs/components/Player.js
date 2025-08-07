import { defineComponent } from 'bitecs';
import Logger from '@/utils/Logger.js';

const logger = Logger.scope('ECS:Player');

/**
 * Player tag component for identifying player entities.
 * Tag component with no properties - used for entity classification.
 * 
 * @component Player
 * @tag
 */
export const Player = defineComponent();

logger.debug('Player tag component defined');

export default Player;