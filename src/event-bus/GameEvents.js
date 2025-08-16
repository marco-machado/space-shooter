import { EventPriority, EventTypes } from '@/event-bus/EventTypes.js';

export function makeScoreUpdatedEvent(score) {
  return {
    type: EventTypes.SCORE_UPDATED,
    data: {
      score,
    },
    priority: EventPriority.NORMAL,
  };
}
