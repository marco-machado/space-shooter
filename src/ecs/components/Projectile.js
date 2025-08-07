import { defineComponent } from 'bitecs';
import Logger from '@/utils/Logger.js';

const logger = Logger.scope('ECS:Projectile');

/**
 * Projectile tag component for identifying projectile entities.
 * Tag component with no properties - used for bullet/projectile classification.
 * 
 * @component Projectile
 * @tag
 */
export const Projectile = defineComponent();

logger.debug('Projectile tag component defined');

export default Projectile;