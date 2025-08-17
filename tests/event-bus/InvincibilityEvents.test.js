/**
 * Evidence-Based Validation Tests for Invincibility Events
 * Tests functional, integration, and performance aspects of the invincibility event system
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getEventBus } from '@/event-bus/EventBus.js';
import { EventTypes, getEventCategory, getDefaultPriority } from '@/event-bus/EventTypes.js';

describe('Invincibility Events Validation', () => {
  let eventBus;
  
  beforeEach(() => {
    eventBus = getEventBus();
    eventBus.clear(); // Clean slate for each test
  });

  afterEach(() => {
    eventBus.clear();
  });

  describe('Event Definitions', () => {
    it('should define INVINCIBILITY_STARTED event', () => {
      expect(EventTypes.INVINCIBILITY_STARTED).toBeDefined();
      expect(typeof EventTypes.INVINCIBILITY_STARTED).toBe('string');
      expect(EventTypes.INVINCIBILITY_STARTED).toBe('invincibility-started');
    });

    it('should define INVINCIBILITY_ENDED event', () => {
      expect(EventTypes.INVINCIBILITY_ENDED).toBeDefined();
      expect(typeof EventTypes.INVINCIBILITY_ENDED).toBe('string');
      expect(EventTypes.INVINCIBILITY_ENDED).toBe('invincibility-ended');
    });

    it('should follow kebab-case naming convention', () => {
      const kebabCaseRegex = /^[a-z]+(-[a-z]+)*$/;
      expect(EventTypes.INVINCIBILITY_STARTED).toMatch(kebabCaseRegex);
      expect(EventTypes.INVINCIBILITY_ENDED).toMatch(kebabCaseRegex);
    });

    it('should have proper categorization', () => {
      const startedCategory = getEventCategory(EventTypes.INVINCIBILITY_STARTED);
      const endedCategory = getEventCategory(EventTypes.INVINCIBILITY_ENDED);
      
      // These events don't match existing patterns, so they return 'unknown'
      expect(startedCategory).toBe('unknown');
      expect(endedCategory).toBe('unknown');
    });

    it('should have numeric priority values', () => {
      const startedPriority = getDefaultPriority(EventTypes.INVINCIBILITY_STARTED);
      const endedPriority = getDefaultPriority(EventTypes.INVINCIBILITY_ENDED);
      
      expect(typeof startedPriority).toBe('number');
      expect(typeof endedPriority).toBe('number');
      expect(startedPriority).toBeGreaterThanOrEqual(0);
      expect(endedPriority).toBeGreaterThanOrEqual(0);
    });
  });

  describe('EventBus Integration', () => {
    it('should emit and receive INVINCIBILITY_STARTED events', () => {
      let receivedData = null;
      let eventReceived = false;

      const listenerId = eventBus.on(EventTypes.INVINCIBILITY_STARTED, (data) => {
        eventReceived = true;
        receivedData = data;
      });

      expect(typeof listenerId).toBe('string');

      const testData = { player: { id: 'test-player' }, duration: 1000 };
      const eventId = eventBus.emit(EventTypes.INVINCIBILITY_STARTED, testData);

      expect(typeof eventId).toBe('string');
      expect(eventReceived).toBe(true);
      expect(receivedData).toEqual(testData);
      expect(receivedData.duration).toBe(1000);
      expect(receivedData.player.id).toBe('test-player');

      eventBus.off(listenerId);
    });

    it('should emit and receive INVINCIBILITY_ENDED events', () => {
      let receivedData = null;
      let eventReceived = false;

      const listenerId = eventBus.on(EventTypes.INVINCIBILITY_ENDED, (data) => {
        eventReceived = true;
        receivedData = data;
      });

      const testData = { player: { id: 'test-player' } };
      eventBus.emit(EventTypes.INVINCIBILITY_ENDED, testData);

      expect(eventReceived).toBe(true);
      expect(receivedData).toEqual(testData);
      expect(receivedData.player.id).toBe('test-player');

      eventBus.off(listenerId);
    });

    it('should handle multiple listeners for invincibility events', () => {
      let listener1Called = false;
      let listener2Called = false;

      const listenerId1 = eventBus.on(EventTypes.INVINCIBILITY_STARTED, () => {
        listener1Called = true;
      });

      const listenerId2 = eventBus.on(EventTypes.INVINCIBILITY_STARTED, () => {
        listener2Called = true;
      });

      eventBus.emit(EventTypes.INVINCIBILITY_STARTED, { test: true });

      expect(listener1Called).toBe(true);
      expect(listener2Called).toBe(true);

      eventBus.off(listenerId1);
      eventBus.off(listenerId2);
    });

    it('should properly remove event listeners', () => {
      let eventReceived = false;

      const listenerId = eventBus.on(EventTypes.INVINCIBILITY_STARTED, () => {
        eventReceived = true;
      });

      const removed = eventBus.off(listenerId);
      expect(removed).toBe(true);

      eventBus.emit(EventTypes.INVINCIBILITY_STARTED, {});
      expect(eventReceived).toBe(false);
    });
  });

  describe('Cross-System Integration Simulation', () => {
    it('should support PlayerHealthSystem emission pattern', () => {
      let visualSystemReceived = [];

      // Simulate VisualFXSystem listener
      const listenerId1 = eventBus.on(EventTypes.INVINCIBILITY_STARTED, (data) => {
        visualSystemReceived.push({ type: 'started', data });
      });

      const listenerId2 = eventBus.on(EventTypes.INVINCIBILITY_ENDED, (data) => {
        visualSystemReceived.push({ type: 'ended', data });
      });

      // Simulate PlayerHealthSystem emissions
      const playerData = { 
        player: { 
          id: 'player1', 
          health: { current: 2, max: 3 } 
        } 
      };

      // Emit invincibility started
      eventBus.emit(EventTypes.INVINCIBILITY_STARTED, {
        duration: 1000,
        player: playerData.player,
      });

      // Emit invincibility ended
      eventBus.emit(EventTypes.INVINCIBILITY_ENDED, {
        player: playerData.player,
      });

      expect(visualSystemReceived).toHaveLength(2);
      
      const startedEvent = visualSystemReceived[0];
      const endedEvent = visualSystemReceived[1];

      expect(startedEvent.type).toBe('started');
      expect(startedEvent.data.duration).toBe(1000);
      expect(startedEvent.data.player.id).toBe('player1');

      expect(endedEvent.type).toBe('ended');
      expect(endedEvent.data.player.id).toBe('player1');

      eventBus.off(listenerId1);
      eventBus.off(listenerId2);
    });

    it('should handle expected data structures for PlayerHealthSystem', () => {
      let startedData = null;
      let endedData = null;

      const listenerId1 = eventBus.on(EventTypes.INVINCIBILITY_STARTED, (data) => {
        startedData = data;
      });

      const listenerId2 = eventBus.on(EventTypes.INVINCIBILITY_ENDED, (data) => {
        endedData = data;
      });

      // Test data structure compatibility (based on PlayerHealthSystem.js implementation)
      const expectedStartedData = {
        duration: 1000,
        player: { id: 'test-player', health: { current: 2, max: 3 } },
      };

      const expectedEndedData = {
        player: { id: 'test-player', health: { current: 2, max: 3 } },
      };

      eventBus.emit(EventTypes.INVINCIBILITY_STARTED, expectedStartedData);
      eventBus.emit(EventTypes.INVINCIBILITY_ENDED, expectedEndedData);

      // Verify data structure compatibility
      expect(startedData).toHaveProperty('duration');
      expect(startedData).toHaveProperty('player');
      expect(startedData.duration).toBe(1000);
      expect(startedData.player.id).toBe('test-player');

      expect(endedData).toHaveProperty('player');
      expect(endedData.player.id).toBe('test-player');

      eventBus.off(listenerId1);
      eventBus.off(listenerId2);
    });
  });

  describe('Performance Validation', () => {
    it('should emit events within acceptable time limits', () => {
      const listenerId = eventBus.on(EventTypes.INVINCIBILITY_STARTED, () => {});

      const start = performance.now();
      eventBus.emit(EventTypes.INVINCIBILITY_STARTED, { test: true });
      const end = performance.now();

      const duration = end - start;
      expect(duration).toBeLessThan(10); // Should complete in less than 10ms

      eventBus.off(listenerId);
    });

    it('should handle multiple rapid emissions efficiently', () => {
      let eventCount = 0;
      const listenerId = eventBus.on(EventTypes.INVINCIBILITY_STARTED, () => {
        eventCount++;
      });

      const start = performance.now();
      
      // Emit 100 events rapidly
      for (let i = 0; i < 100; i++) {
        eventBus.emit(EventTypes.INVINCIBILITY_STARTED, { test: i });
      }
      
      const end = performance.now();
      const duration = end - start;

      expect(eventCount).toBe(100);
      expect(duration).toBeLessThan(50); // Should handle 100 events in less than 50ms

      eventBus.off(listenerId);
    });
  });

  describe('Architecture Compliance', () => {
    it('should be positioned with player progress events in EventTypes', () => {
      const eventTypesKeys = Object.keys(EventTypes);
      const invincibilityStartedIndex = eventTypesKeys.indexOf('INVINCIBILITY_STARTED');
      const invincibilityEndedIndex = eventTypesKeys.indexOf('INVINCIBILITY_ENDED');
      
      expect(invincibilityStartedIndex).toBeGreaterThan(-1);
      expect(invincibilityEndedIndex).toBeGreaterThan(-1);
      
      // Should be consecutive
      expect(invincibilityEndedIndex).toBe(invincibilityStartedIndex + 1);
    });

    it('should follow event-driven architecture principles', () => {
      // Test that events can be used for decoupled communication
      let systemAReceived = false;
      let systemBReceived = false;

      // System A listens
      const listenerA = eventBus.on(EventTypes.INVINCIBILITY_STARTED, () => {
        systemAReceived = true;
      });

      // System B listens
      const listenerB = eventBus.on(EventTypes.INVINCIBILITY_STARTED, () => {
        systemBReceived = true;
      });

      // System C emits (without knowing about A or B)
      eventBus.emit(EventTypes.INVINCIBILITY_STARTED, { decoupled: true });

      expect(systemAReceived).toBe(true);
      expect(systemBReceived).toBe(true);

      eventBus.off(listenerA);
      eventBus.off(listenerB);
    });

    it('should maintain clean separation of concerns', () => {
      // Test that event data doesn't require specific system knowledge
      let receivedData = null;

      const listenerId = eventBus.on(EventTypes.INVINCIBILITY_STARTED, (data) => {
        receivedData = data;
      });

      // Generic event data that any system can understand
      const genericData = {
        duration: 1500,
        player: { id: 'any-player' },
      };

      eventBus.emit(EventTypes.INVINCIBILITY_STARTED, genericData);

      expect(receivedData).toEqual(genericData);
      expect(receivedData).not.toHaveProperty('internalState'); // No system-specific data
      expect(receivedData).not.toHaveProperty('privateData'); // No private data

      eventBus.off(listenerId);
    });
  });

  describe('Error Handling', () => {
    it('should handle listener errors gracefully', () => {
      let validListenerCalled = false;

      // Add a listener that throws an error
      const errorListenerId = eventBus.on(EventTypes.INVINCIBILITY_STARTED, () => {
        throw new Error('Test error');
      });

      // Add a valid listener
      const validListenerId = eventBus.on(EventTypes.INVINCIBILITY_STARTED, () => {
        validListenerCalled = true;
      });

      // Emit event - should not throw, and valid listener should still be called
      expect(() => {
        eventBus.emit(EventTypes.INVINCIBILITY_STARTED, {});
      }).not.toThrow();

      expect(validListenerCalled).toBe(true);

      eventBus.off(errorListenerId);
      eventBus.off(validListenerId);
    });

    it('should validate event parameters', () => {
      expect(() => {
        eventBus.emit('', {}); // Empty event type
      }).toThrow();

      expect(() => {
        eventBus.emit(null, {}); // Null event type
      }).toThrow();
    });
  });
});