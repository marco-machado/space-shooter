import { defineComponent, Types } from 'bitecs';
import Logger from '@/utils/Logger.js';

const logger = Logger.scope('ECS:AI');

/**
 * AI component for autonomous entity behavior.
 * Manages AI patterns, targeting, and pattern-specific data arrays.
 * 
 * @component AI
 * @property {Types.ui8} pattern - AI behavior pattern identifier
 * @property {Types.eid} targetEntity - Target entity ID for AI focus
 * @property {[Types.f32, 8]} patternData - Array of 8 floats for pattern-specific data
 */
export const AI = defineComponent({
  pattern: Types.ui8,
  targetEntity: Types.eid,
  patternData: [Types.f32, 8] // Array for pattern-specific data
});

logger.debug('AI component defined');

export default AI;