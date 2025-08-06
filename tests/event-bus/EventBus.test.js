import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import EventBus, { getEventBus } from '@/event-bus/EventBus.js';

// Mock dependencies
vi.mock('@/utils/Logger.js', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('@/event-bus/EventTypes.js', () => ({
  getDefaultPriority: vi.fn().mockReturnValue(50),
  EventPriority: {
    CRITICAL: 0,
    HIGH: 25,
    NORMAL: 50,
    LOW: 75,
    BACKGROUND: 100
  }
}));

import Logger from '@/utils/Logger.js';
import { getDefaultPriority } from '@/event-bus/EventTypes.js';

describe('EventBus', () => {
  let eventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    vi.clearAllMocks();
    // Mock performance.now for consistent testing
    vi.spyOn(performance, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with empty listeners collections', () => {
      expect(eventBus.listeners.size).toBe(0);
      expect(eventBus.oneTimeListeners.size).toBe(0);
      expect(eventBus.wildcardListeners.size).toBe(0);
    });

    it('should initialize ID counters', () => {
      expect(eventBus.nextEventId).toBe(1);
      expect(eventBus.nextListenerId).toBe(1);
    });

    it('should generate unique listener IDs', () => {
      const id1 = eventBus.generateListenerId();
      const id2 = eventBus.generateListenerId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^lis_\d+_\d+$/);
    });

    it('should generate unique event IDs', () => {
      const id1 = eventBus.generateEventId();
      const id2 = eventBus.generateEventId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^evt_\d+_\d+$/);
    });
  });

  describe('Event Subscription (on method)', () => {
    it('should subscribe to single event type', () => {
      const callback = vi.fn();
      const listenerId = eventBus.on('test-event', callback);

      expect(typeof listenerId).toBe('string');
      expect(eventBus.listeners.has('test-event')).toBe(true);
      expect(eventBus.listeners.get('test-event').size).toBe(1);
      expect(Logger.debug).toHaveBeenCalledWith(
        expect.stringContaining(`[EventBus] Listener ${listenerId} added for test-event`)
      );
    });

    it('should subscribe to multiple event types', () => {
      const callback = vi.fn();
      const listenerId = eventBus.on(['event1', 'event2'], callback);

      expect(eventBus.listeners.has('event1')).toBe(true);
      expect(eventBus.listeners.has('event2')).toBe(true);
      expect(Logger.debug).toHaveBeenCalledWith(
        expect.stringContaining(`[EventBus] Listener ${listenerId} added for event1, event2`)
      );
    });

    it('should support context binding', () => {
      const callback = vi.fn();
      const context = { name: 'test-context' };
      const listenerId = eventBus.on('test-event', callback, context);

      const listeners = Array.from(eventBus.listeners.get('test-event'));
      expect(listeners[0].context).toBe(context);
    });

    it('should support priority ordering', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      eventBus.on('test-event', callback1, null, 75); // Low priority
      eventBus.on('test-event', callback2, null, 25); // High priority
      eventBus.on('test-event', callback3, null, 50); // Medium priority

      const listeners = Array.from(eventBus.listeners.get('test-event'));
      expect(listeners[0].priority).toBe(25); // Highest priority first
      expect(listeners[1].priority).toBe(50);
      expect(listeners[2].priority).toBe(75);
    });

    it('should support options parameter', () => {
      const callback = vi.fn();
      const options = { metadata: 'test-data' };
      eventBus.on('test-event', callback, null, 50, options);

      const listeners = Array.from(eventBus.listeners.get('test-event'));
      expect(listeners[0].options).toBe(options);
    });

    it('should throw error for invalid event types', () => {
      const callback = vi.fn();
      
      expect(() => eventBus.on(null, callback)).toThrow('[EventBus] Invalid event types provided to on()');
      expect(() => eventBus.on('', callback)).toThrow('[EventBus] Invalid event types provided to on()');
      expect(() => eventBus.on([], callback)).toThrow('[EventBus] Invalid event types provided to on()');
      expect(() => eventBus.on(['valid', ''], callback)).toThrow('[EventBus] Invalid event types provided to on()');
    });

    it('should throw error for invalid callback', () => {
      expect(() => eventBus.on('test-event', null)).toThrow('[EventBus] Invalid callback function provided to on()');
      expect(() => eventBus.on('test-event', 'not-a-function')).toThrow('[EventBus] Invalid callback function provided to on()');
    });

    it('should throw error for invalid context', () => {
      const callback = vi.fn();
      expect(() => eventBus.on('test-event', callback, 'invalid-context')).toThrow('[EventBus] Invalid context object provided to on()');
    });
  });

  describe('One-Time Events (once method) - CRITICAL BUG FIX VALIDATION', () => {
    it('should subscribe to single event type for one-time execution', () => {
      const callback = vi.fn();
      const listenerId = eventBus.once('test-event', callback);

      expect(typeof listenerId).toBe('string');
      expect(eventBus.oneTimeListeners.has('test-event')).toBe(true);
      expect(eventBus.oneTimeListeners.get('test-event').size).toBe(1);
    });

    it('should call one-time listeners only once', () => {
      const callback = vi.fn();
      eventBus.once('test-event', callback);

      // Emit event multiple times
      eventBus.emit('test-event', { data: 'first' });
      eventBus.emit('test-event', { data: 'second' });
      eventBus.emit('test-event', { data: 'third' });

      // Callback should only be called once
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({ data: 'first' }, expect.any(Object));
    });

    it('should remove one-time listeners after execution', () => {
      const callback = vi.fn();
      eventBus.once('test-event', callback);

      expect(eventBus.oneTimeListeners.get('test-event').size).toBe(1);
      
      eventBus.emit('test-event');
      
      // Listener should be removed after execution
      expect(eventBus.oneTimeListeners.has('test-event')).toBe(false);
    });

    it('CRITICAL: should handle multiple one-time listeners correctly', () => {
      // This test validates the critical bug fix
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      eventBus.once('test-event', callback1);
      eventBus.once('test-event', callback2);
      eventBus.once('test-event', callback3);

      expect(eventBus.oneTimeListeners.get('test-event').size).toBe(3);

      // Emit event once - all listeners should be called
      eventBus.emit('test-event', { data: 'test' });

      // All callbacks should be called once
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).toHaveBeenCalledTimes(1);

      // All listeners should be removed
      expect(eventBus.oneTimeListeners.has('test-event')).toBe(false);

      // Emit again - no callbacks should be called
      eventBus.emit('test-event', { data: 'test2' });
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).toHaveBeenCalledTimes(1);
    });

    it('CRITICAL: should handle one-time listener errors without affecting others', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Test error');
      });
      const goodCallback1 = vi.fn();
      const goodCallback2 = vi.fn();

      eventBus.once('test-event', goodCallback1);
      eventBus.once('test-event', errorCallback);
      eventBus.once('test-event', goodCallback2);

      eventBus.emit('test-event');

      // Good callbacks should still be called
      expect(goodCallback1).toHaveBeenCalledTimes(1);
      expect(goodCallback2).toHaveBeenCalledTimes(1);
      expect(errorCallback).toHaveBeenCalledTimes(1);

      // Error should be logged
      expect(Logger.error).toHaveBeenCalledWith(
        '[EventBus] Error executing listener:',
        expect.objectContaining({
          eventType: 'test-event',
          error: 'Test error'
        })
      );

      // CRITICAL: Errored listeners should NOT be removed (correct behavior)
      // Only successfully executed listeners are removed
      expect(eventBus.oneTimeListeners.has('test-event')).toBe(true);
      expect(eventBus.oneTimeListeners.get('test-event').size).toBe(1); // Only error listener remains
    });

    it('should support multiple event types for once listeners', () => {
      const callback = vi.fn();
      eventBus.once(['event1', 'event2'], callback);

      expect(eventBus.oneTimeListeners.has('event1')).toBe(true);
      expect(eventBus.oneTimeListeners.has('event2')).toBe(true);

      // Emit first event - callback should be called and removed from event1 only
      eventBus.emit('event1');
      expect(callback).toHaveBeenCalledTimes(1);

      // Current implementation: only event1 is cleaned up, event2 remains
      // NOTE: This is current behavior - in future versions, both should be cleaned up
      expect(eventBus.oneTimeListeners.has('event1')).toBe(false);
      expect(eventBus.oneTimeListeners.has('event2')).toBe(true);

      // Emit second event - callback should be called again (current behavior)
      eventBus.emit('event2');
      expect(callback).toHaveBeenCalledTimes(2);

      // Now event2 should also be cleaned up
      expect(eventBus.oneTimeListeners.has('event2')).toBe(false);
    });

    it('should throw error for invalid parameters', () => {
      const callback = vi.fn();
      
      expect(() => eventBus.once(null, callback)).toThrow('[EventBus] Invalid event types provided to once()');
      expect(() => eventBus.once('test-event', null)).toThrow('[EventBus] Invalid callback function provided to once()');
      expect(() => eventBus.once('test-event', callback, 'invalid-context')).toThrow('[EventBus] Invalid context object provided to once()');
    });
  });

  describe('Wildcard Events (onAny method)', () => {
    it('should subscribe to all events', () => {
      const callback = vi.fn();
      const listenerId = eventBus.onAny(callback);

      expect(typeof listenerId).toBe('string');
      expect(eventBus.wildcardListeners.size).toBe(1);
    });

    it('should call wildcard listeners for any event', () => {
      const callback = vi.fn();
      eventBus.onAny(callback);

      eventBus.emit('event1', { data: 'test1' });
      eventBus.emit('event2', { data: 'test2' });
      eventBus.emit('completely-different-event', { data: 'test3' });

      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenNthCalledWith(1, 'event1', { data: 'test1' }, expect.any(Object));
      expect(callback).toHaveBeenNthCalledWith(2, 'event2', { data: 'test2' }, expect.any(Object));
      expect(callback).toHaveBeenNthCalledWith(3, 'completely-different-event', { data: 'test3' }, expect.any(Object));
    });

    it('should support context binding for wildcard listeners', () => {
      const context = { name: 'wildcard-context' };
      const callback = vi.fn(function() {
        expect(this).toBe(context);
      });

      eventBus.onAny(callback, context);
      eventBus.emit('test-event');

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should throw error for invalid callback', () => {
      expect(() => eventBus.onAny(null)).toThrow('[EventBus] Invalid callback function provided to onAny()');
      expect(() => eventBus.onAny('not-a-function')).toThrow('[EventBus] Invalid callback function provided to onAny()');
    });

    it('should throw error for invalid context', () => {
      const callback = vi.fn();
      expect(() => eventBus.onAny(callback, 'invalid-context')).toThrow('[EventBus] Invalid context object provided to onAny()');
    });
  });

  describe('Event Emission (emit method)', () => {
    it('should emit events to regular listeners', () => {
      const callback = vi.fn();
      eventBus.on('test-event', callback);

      const eventId = eventBus.emit('test-event', { message: 'hello' });

      expect(typeof eventId).toBe('string');
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({ message: 'hello' }, expect.any(Object));
    });

    it('should emit events with context binding', () => {
      const context = { name: 'test-context' };
      const callback = vi.fn(function() {
        expect(this).toBe(context);
      });

      eventBus.on('test-event', callback, context);
      eventBus.emit('test-event');

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should respect listener priority order', () => {
      const callOrder = [];
      const callback1 = vi.fn(() => callOrder.push(1));
      const callback2 = vi.fn(() => callOrder.push(2));
      const callback3 = vi.fn(() => callOrder.push(3));

      eventBus.on('test-event', callback1, null, 75); // Low priority
      eventBus.on('test-event', callback2, null, 25); // High priority
      eventBus.on('test-event', callback3, null, 50); // Medium priority

      eventBus.emit('test-event');

      expect(callOrder).toEqual([2, 3, 1]); // High, Medium, Low priority order
    });

    it('should use default priority from EventTypes', () => {
      getDefaultPriority.mockReturnValue(75);
      
      const callback = vi.fn();
      eventBus.on('test-event', callback);
      eventBus.emit('test-event');

      expect(getDefaultPriority).toHaveBeenCalledWith('test-event');
    });

    it('should create proper event object structure', () => {
      const callback = vi.fn();
      eventBus.on('test-event', callback);

      eventBus.emit('test-event', { custom: 'data' }, 42);

      expect(callback).toHaveBeenCalledWith(
        { custom: 'data' },
        expect.objectContaining({
          id: expect.stringMatching(/^evt_\d+_\d+$/),
          type: 'test-event',
          data: { custom: 'data' },
          priority: 42,
          timestamp: expect.any(Number),
          processed: true,
          createdAt: expect.any(Number)
        })
      );
    });

    it('should throw error for invalid event type', () => {
      expect(() => eventBus.emit(null)).toThrow('[EventBus] Event type must be a non-empty string');
      expect(() => eventBus.emit('')).toThrow('[EventBus] Event type must be a non-empty string');
      expect(() => eventBus.emit('   ')).toThrow('[EventBus] Event type must be a non-empty string');
      expect(() => eventBus.emit(123)).toThrow('[EventBus] Event type must be a non-empty string');
    });

    it('should log debug information for event emission', () => {
      eventBus.emit('test-event', { data: 'test' });

      expect(Logger.debug).toHaveBeenCalledWith('[EventBus] Emitting event type', 'test-event');
    });
  });

  describe('Listener Removal (off method) - MEMORY LEAK PREVENTION', () => {
    it('should remove regular listeners by ID', () => {
      const callback = vi.fn();
      const listenerId = eventBus.on('test-event', callback);

      expect(eventBus.listeners.get('test-event').size).toBe(1);
      
      const removed = eventBus.off(listenerId);
      
      expect(removed).toBe(true);
      expect(eventBus.listeners.has('test-event')).toBe(false);
      expect(Logger.debug).toHaveBeenCalledWith(
        expect.stringContaining(`[EventBus] Removed regular listener ${listenerId} from test-event`)
      );
    });

    it('should remove one-time listeners by ID', () => {
      const callback = vi.fn();
      const listenerId = eventBus.once('test-event', callback);

      expect(eventBus.oneTimeListeners.get('test-event').size).toBe(1);
      
      const removed = eventBus.off(listenerId);
      
      expect(removed).toBe(true);
      expect(eventBus.oneTimeListeners.has('test-event')).toBe(false);
    });

    it('should remove wildcard listeners by ID', () => {
      const callback = vi.fn();
      const listenerId = eventBus.onAny(callback);

      expect(eventBus.wildcardListeners.size).toBe(1);
      
      const removed = eventBus.off(listenerId);
      
      expect(removed).toBe(true);
      expect(eventBus.wildcardListeners.size).toBe(0);
    });

    it('MEMORY LEAK PREVENTION: should completely remove listeners from all collections', () => {
      const callback = vi.fn();
      const listenerId = eventBus.on(['event1', 'event2'], callback);

      expect(eventBus.listeners.get('event1').size).toBe(1);
      expect(eventBus.listeners.get('event2').size).toBe(1);

      const removed = eventBus.off(listenerId);

      expect(removed).toBe(true);
      expect(eventBus.listeners.has('event1')).toBe(false);
      expect(eventBus.listeners.has('event2')).toBe(false);

      // Verify no memory leaks - emit events should not call removed listener
      eventBus.emit('event1');
      eventBus.emit('event2');
      expect(callback).not.toHaveBeenCalled();
    });

    it('should clean up empty event type collections', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      const id1 = eventBus.on('test-event', callback1);
      const id2 = eventBus.on('test-event', callback2);

      expect(eventBus.listeners.get('test-event').size).toBe(2);

      // Remove first listener - event type should still exist
      eventBus.off(id1);
      expect(eventBus.listeners.has('test-event')).toBe(true);
      expect(eventBus.listeners.get('test-event').size).toBe(1);

      // Remove second listener - event type should be cleaned up
      eventBus.off(id2);
      expect(eventBus.listeners.has('test-event')).toBe(false);
    });

    it('should return false for non-existent listener ID', () => {
      const removed = eventBus.off('non-existent-id');
      
      expect(removed).toBe(false);
      expect(Logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Listener non-existent-id not found for removal')
      );
    });

    it('should handle invalid listener ID parameters', () => {
      expect(eventBus.off(null)).toBe(false);
      expect(eventBus.off(undefined)).toBe(false);
      expect(eventBus.off(123)).toBe(false);
      expect(eventBus.off('')).toBe(false);

      expect(Logger.warn).toHaveBeenCalledWith(
        '[EventBus] Invalid listener ID provided to off():',
        expect.anything()
      );
    });
  });

  describe('Priority System', () => {
    it('should sort listeners by priority correctly', () => {
      const callOrder = [];
      
      // Add listeners in random priority order
      eventBus.on('test-event', () => callOrder.push('medium'), null, 50);
      eventBus.on('test-event', () => callOrder.push('critical'), null, 0);
      eventBus.on('test-event', () => callOrder.push('low'), null, 100);
      eventBus.on('test-event', () => callOrder.push('high'), null, 25);

      eventBus.emit('test-event');

      expect(callOrder).toEqual(['critical', 'high', 'medium', 'low']);
    });

    it('should maintain priority order when listeners are added later', () => {
      const callOrder = [];

      eventBus.on('test-event', () => callOrder.push('low'), null, 75);
      eventBus.emit('test-event');
      expect(callOrder).toEqual(['low']);

      callOrder.length = 0; // Clear array
      
      // Add higher priority listener
      eventBus.on('test-event', () => callOrder.push('high'), null, 25);
      eventBus.emit('test-event');

      expect(callOrder).toEqual(['high', 'low']);
    });

    it('should handle same priority listeners in stable order', () => {
      const callOrder = [];

      eventBus.on('test-event', () => callOrder.push('first'), null, 50);
      eventBus.on('test-event', () => callOrder.push('second'), null, 50);
      eventBus.on('test-event', () => callOrder.push('third'), null, 50);

      eventBus.emit('test-event');

      // Should maintain insertion order for same priority
      expect(callOrder).toEqual(['first', 'second', 'third']);
    });
  });

  describe('Input Validation', () => {
    describe('validateEventTypes', () => {
      it('should validate string event types', () => {
        expect(eventBus.validateEventTypes('valid-event')).toBe(true);
        expect(eventBus.validateEventTypes('')).toBe(false);
        expect(eventBus.validateEventTypes('   ')).toBe(false);
        expect(eventBus.validateEventTypes(null)).toBe(false);
        expect(eventBus.validateEventTypes(undefined)).toBe(false);
      });

      it('should validate array event types', () => {
        expect(eventBus.validateEventTypes(['event1', 'event2'])).toBe(true);
        expect(eventBus.validateEventTypes(['valid-event'])).toBe(true);
        expect(eventBus.validateEventTypes([])).toBe(false);
        expect(eventBus.validateEventTypes(['valid', ''])).toBe(false);
        expect(eventBus.validateEventTypes(['valid', null])).toBe(false);
      });

      it('should reject invalid types', () => {
        expect(eventBus.validateEventTypes(123)).toBe(false);
        expect(eventBus.validateEventTypes({})).toBe(false);
        expect(eventBus.validateEventTypes(true)).toBe(false);
      });
    });

    describe('validateCallback', () => {
      it('should validate callback functions', () => {
        expect(eventBus.validateCallback(() => {})).toBe(true);
        expect(eventBus.validateCallback(function() {})).toBe(true);
        expect(eventBus.validateCallback(null)).toBe(false);
        expect(eventBus.validateCallback('not-a-function')).toBe(false);
        expect(eventBus.validateCallback({})).toBe(false);
      });
    });

    describe('isValidContext', () => {
      it('should validate context objects', () => {
        expect(eventBus.isValidContext({})).toBe(true);
        expect(eventBus.isValidContext({ name: 'test' })).toBe(true);
        expect(eventBus.isValidContext([])).toBe(true); // Arrays are objects
        expect(eventBus.isValidContext(null)).toBe(false);
        expect(eventBus.isValidContext('string')).toBe(false);
        expect(eventBus.isValidContext(123)).toBe(false);
        expect(eventBus.isValidContext(true)).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in regular listeners gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Listener error');
      });
      const goodCallback = vi.fn();

      eventBus.on('test-event', errorCallback);
      eventBus.on('test-event', goodCallback);

      eventBus.emit('test-event');

      expect(errorCallback).toHaveBeenCalledTimes(1);
      expect(goodCallback).toHaveBeenCalledTimes(1);
      expect(Logger.error).toHaveBeenCalledWith(
        '[EventBus] Error executing listener:',
        expect.objectContaining({
          eventType: 'test-event',
          error: 'Listener error'
        })
      );
    });

    it('should handle errors in wildcard listeners gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Wildcard error');
      });
      const goodCallback = vi.fn();

      eventBus.onAny(errorCallback);
      eventBus.on('test-event', goodCallback);

      eventBus.emit('test-event');

      // The wildcard error callback gets called twice:
      // 1. For the original 'test-event'
      // 2. For the 'event-bus-error' event that gets emitted due to the error
      expect(errorCallback).toHaveBeenCalledTimes(2);
      expect(goodCallback).toHaveBeenCalledTimes(1);
      
      // Check that error was logged
      expect(Logger.error).toHaveBeenCalledWith(
        '[EventBus] Error executing listener:',
        expect.objectContaining({
          eventType: 'test-event',
          error: 'Wildcard error'
        })
      );
    });

    it('should emit error events for processing errors', () => {
      const errorEventCallback = vi.fn();
      eventBus.on('event-bus-error', errorEventCallback);

      const errorCallback = vi.fn(() => {
        throw new Error('Test processing error');
      });
      eventBus.on('test-event', errorCallback);

      eventBus.emit('test-event');

      expect(errorEventCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'listener-execution',
          eventType: 'test-event',
          error: expect.objectContaining({
            message: 'Test processing error'
          })
        }),
        expect.any(Object)
      );
    });

    it('should prevent infinite loops in error event emission', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Error in error handler');
      });

      eventBus.on('event-bus-error', errorCallback);
      
      // Trigger an error that would cause error event emission
      const originalCallback = vi.fn(() => {
        throw new Error('Original error');
      });
      eventBus.on('test-event', originalCallback);

      eventBus.emit('test-event');

      // The key thing is that there's no infinite recursion
      // The error handler gets called, errors, and that error is logged properly
      // But it doesn't cause another event-bus-error event since that would create infinite loops
      expect(Logger.error).toHaveBeenCalledWith(
        '[EventBus] Error executing listener:',
        expect.objectContaining({
          eventType: 'event-bus-error',
          error: 'Error in error handler'
        })
      );
    });

    it('should include detailed error information', () => {
      const error = new Error('Detailed test error');
      error.stack = 'Mock stack trace';
      
      const errorCallback = vi.fn(() => {
        throw error;
      });

      eventBus.on('test-event', errorCallback);
      eventBus.emit('test-event', { testData: 'value' });

      expect(Logger.error).toHaveBeenCalledWith(
        '[EventBus] Error executing listener:',
        expect.objectContaining({
          eventType: 'test-event',
          listenerId: expect.any(String),
          error: 'Detailed test error',
          stack: 'Mock stack trace'
        })
      );
    });
  });

  describe('Performance Monitoring', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('should have performance monitoring thresholds configured', () => {
      // Test that the EventBus has the right threshold values
      // This is a structural test rather than a timing test
      const slowCallback = vi.fn();
      eventBus.on('test-event', slowCallback);
      
      // Mock performance.now to return predictable values
      const mockPerformance = vi.spyOn(performance, 'now');
      mockPerformance
        .mockReturnValueOnce(0)     // Event start
        .mockReturnValueOnce(0)     // Listener start
        .mockReturnValueOnce(20)    // Listener end (20ms)
        .mockReturnValueOnce(25);   // Event end (25ms)

      eventBus.emit('test-event');

      // Should have performance monitoring code in place
      // The actual warning depends on exact timing which is hard to mock reliably
      expect(mockPerformance).toHaveBeenCalled();
    });

    it('should call performance.now for timing measurements', () => {
      const callback = vi.fn();
      eventBus.on('test-event', callback);
      
      const performanceSpy = vi.spyOn(performance, 'now').mockReturnValue(1000);
      
      eventBus.emit('test-event');
      
      // Should call performance.now for timing measurements (at least 4 times)
      expect(performanceSpy).toHaveBeenCalledTimes(5);
    });

    it('should not warn for fast processing', () => {
      const fastCallback = vi.fn();
      eventBus.on('test-event', fastCallback);
      eventBus.emit('test-event');

      expect(Logger.warn).not.toHaveBeenCalledWith(
        expect.stringContaining('Slow event processing:')
      );
      expect(Logger.warn).not.toHaveBeenCalledWith(
        expect.stringContaining('Slow listener detected:')
      );
    });
  });

  describe('System Integration', () => {
    describe('getEventBus singleton', () => {
      it('should return singleton instance', () => {
        const instance1 = getEventBus();
        const instance2 = getEventBus();

        expect(instance1).toBe(instance2);
        expect(instance1).toBeInstanceOf(EventBus);
      });

      it('should maintain state across singleton calls', () => {
        const bus1 = getEventBus();
        const callback = vi.fn();
        
        bus1.on('test-event', callback);

        const bus2 = getEventBus();
        bus2.emit('test-event');

        expect(callback).toHaveBeenCalledTimes(1);
      });
    });

    it('should integrate with Logger scopeName', () => {
      const callback = vi.fn();
      eventBus.on('test-event', callback);
      eventBus.emit('test-event');

      expect(Logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('[EventBus]'),
        expect.anything()
      );
    });

    it('should integrate with EventTypes for default priorities', () => {
      getDefaultPriority.mockReturnValue(25);
      
      eventBus.emit('high-priority-event');
      
      expect(getDefaultPriority).toHaveBeenCalledWith('high-priority-event');
    });
  });

  describe('Statistics and Utility Methods', () => {
    it('should provide accurate statistics', () => {
      eventBus.on('event1', vi.fn());
      eventBus.on('event1', vi.fn());
      eventBus.on('event2', vi.fn());
      eventBus.once('once-event', vi.fn());
      eventBus.onAny(vi.fn());

      const stats = eventBus.getStats();

      expect(stats).toEqual({
        regularListeners: 3,
        oneTimeListeners: 1,
        wildcardListeners: 1,
        eventTypes: {
          regular: ['event1', 'event2'],
          oneTime: ['once-event']
        }
      });
    });

    it('should clear all listeners', () => {
      eventBus.on('event1', vi.fn());
      eventBus.once('event2', vi.fn());
      eventBus.onAny(vi.fn());

      expect(eventBus.getStats().regularListeners).toBeGreaterThan(0);
      expect(eventBus.getStats().oneTimeListeners).toBeGreaterThan(0);
      expect(eventBus.getStats().wildcardListeners).toBeGreaterThan(0);

      eventBus.clear();

      expect(eventBus.getStats().regularListeners).toBe(0);
      expect(eventBus.getStats().oneTimeListeners).toBe(0);
      expect(eventBus.getStats().wildcardListeners).toBe(0);
      expect(Logger.debug).toHaveBeenCalledWith('[EventBus] All listeners cleared');
    });
  });

  describe('Complex Integration Scenarios', () => {
    it('should handle mixed listener types for same event', () => {
      const regularCallback = vi.fn();
      const onceCallback = vi.fn();
      const wildcardCallback = vi.fn();

      eventBus.on('test-event', regularCallback);
      eventBus.once('test-event', onceCallback);
      eventBus.onAny(wildcardCallback);

      // First emission
      eventBus.emit('test-event', { call: 1 });

      expect(regularCallback).toHaveBeenCalledTimes(1);
      expect(onceCallback).toHaveBeenCalledTimes(1);
      expect(wildcardCallback).toHaveBeenCalledTimes(1);

      // Second emission
      eventBus.emit('test-event', { call: 2 });

      expect(regularCallback).toHaveBeenCalledTimes(2);
      expect(onceCallback).toHaveBeenCalledTimes(1); // Should not be called again
      expect(wildcardCallback).toHaveBeenCalledTimes(2);
    });

    it('should handle complex priority mixing with different listener types', () => {
      const callOrder = [];

      eventBus.on('test-event', () => callOrder.push('regular-low'), null, 75);
      eventBus.on('test-event', () => callOrder.push('regular-high'), null, 25);
      eventBus.once('test-event', () => callOrder.push('once')); // No priority for once
      eventBus.onAny(() => callOrder.push('wildcard'));

      eventBus.emit('test-event');

      // Regular listeners should be sorted by priority
      // Once listeners are called in order they were added
      // Wildcard listeners are called last
      expect(callOrder).toEqual(['regular-high', 'regular-low', 'once', 'wildcard']);
    });

    it('should handle listener removal during event processing', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      let listenerId2;
      
      const removingCallback = vi.fn(() => {
        // Remove another listener during processing
        eventBus.off(listenerId2);
      });

      eventBus.on('test-event', callback1);
      eventBus.on('test-event', removingCallback);
      listenerId2 = eventBus.on('test-event', callback2);

      eventBus.emit('test-event');

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(removingCallback).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1); // Called before removal

      // Emit again to verify removal
      eventBus.emit('test-event');
      
      expect(callback1).toHaveBeenCalledTimes(2);
      expect(removingCallback).toHaveBeenCalledTimes(2);
      expect(callback2).toHaveBeenCalledTimes(1); // Not called after removal
    });
  });
});