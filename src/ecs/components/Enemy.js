import { defineComponent } from 'bitecs';
import Logger from '@/utils/Logger.js';

const logger = Logger.scope('ECS:Enemy');

/**
 * Enemy tag component for identifying enemy entities.
 * Tag component with no properties - used for entity classification and queries.
 * 
 * @component Enemy
 * @tag
 */
export const Enemy = defineComponent();

logger.debug('Enemy tag component defined');

export default Enemy;