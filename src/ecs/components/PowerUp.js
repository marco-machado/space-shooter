import { defineComponent } from 'bitecs';
import Logger from '@/utils/Logger.js';

const logger = Logger.scope('ECS:PowerUp');

/**
 * PowerUp tag component for identifying power-up entities.
 * Tag component with no properties - used for power-up item classification.
 * 
 * @component PowerUp
 * @tag
 */
export const PowerUp = defineComponent();

logger.debug('PowerUp tag component defined');

export default PowerUp;