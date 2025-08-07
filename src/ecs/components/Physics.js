import { defineComponent, Types } from 'bitecs';
import Logger from '@/utils/Logger.js';

const logger = Logger.scope('ECS:Physics');

/**
 * Physics component for collision detection and physics bodies.
 * Manages collision groups and physics body configuration.
 * 
 * @component Physics
 * @property {Types.ui8} bodyType - Physics body type (0=static, 1=dynamic, 2=kinematic)
 * @property {Types.ui8} collisionGroup - Collision group identifier for filtering
 */
export const Physics = defineComponent({
  bodyType: Types.ui8,
  collisionGroup: Types.ui8
});

logger.debug('Physics component defined');

export default Physics;