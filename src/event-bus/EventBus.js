import { getDefaultPriority } from '@/event-bus/EventTypes.js';
import Logger from '@/utils/Logger.js';

export default class EventBus {
  constructor() {
    this.listeners = new Map();
    this.oneTimeListeners = new Map();
    this.wildcardListeners = new Set();

    this.nextEventId = 1;
    this.nextListenerId = 1;

    this.logger = Logger.scope('EventBus');
  }

  /**
   * Subscribe to events of a specific type
   * @param {string|Array<string>} eventTypes - Event type(s) to listen for
   * @param {Function} callback - Event handler function
   * @param {Object} context - Context to bind callback to
   * @param {number} priority - Listener priority (lower = higher priority)
   * @param {Object} options - Additional options
   * @returns {string} Listener ID for removal
   */
  on(eventTypes, callback, context = null, priority = 100, options = {}) {
    // Input validation
    if (!this.validateEventTypes(eventTypes)) {
      throw new Error('[EventBus] Invalid event types provided to on()');
    }
    if (!this.validateCallback(callback)) {
      throw new Error('[EventBus] Invalid callback function provided to on()');
    }
    if (context !== null && !this.isValidContext(context)) {
      throw new Error('[EventBus] Invalid context object provided to on()');
    }

    if (typeof eventTypes === 'string') {
      eventTypes = [eventTypes];
    }

    const listener = {
      id: this.generateListenerId(),
      callback,
      context,
      priority,
      options,
      eventTypes: new Set(eventTypes),
      addedAt: Date.now(),
    };

    // Add to listener map for each event type
    for (const eventType of eventTypes) {
      if (!this.listeners.has(eventType)) {
        this.listeners.set(eventType, new Set());
      }
      this.listeners.get(eventType).add(listener);
    }

    // Sort listeners by priority for each event type
    for (const eventType of eventTypes) {
      this.sortListeners(eventType);
    }

    return listener.id;
  }

  /**
   * Subscribe to event once
   * @param {string|Array<string>} eventTypes - Event type(s) to listen for
   * @param {Function} callback - Event handler function
   * @param {Object} context - Context to bind callback to
   * @returns {string} Listener ID for removal
   */
  once(eventTypes, callback, context = null) {
    // Input validation
    if (!this.validateEventTypes(eventTypes)) {
      throw new Error('[EventBus] Invalid event types provided to once()');
    }
    if (!this.validateCallback(callback)) {
      throw new Error('[EventBus] Invalid callback function provided to once()');
    }
    if (context !== null && !this.isValidContext(context)) {
      throw new Error('[EventBus] Invalid context object provided to once()');
    }

    if (typeof eventTypes === 'string') {
      eventTypes = [eventTypes];
    }

    const listener = {
      id: this.generateListenerId(),
      callback,
      context,
      eventTypes: new Set(eventTypes),
      addedAt: Date.now(),
    };

    for (const eventType of eventTypes) {
      if (!this.oneTimeListeners.has(eventType)) {
        this.oneTimeListeners.set(eventType, new Set());
      }
      this.oneTimeListeners.get(eventType).add(listener);
    }

    return listener.id;
  }

  /**
   * Subscribe to all events
   * @param {Function} callback - Event handler function
   * @param {Object} context - Context to bind callback to
   * @returns {string} Listener ID for removal
   */
  onAny(callback, context = null) {
    // Input validation
    if (!this.validateCallback(callback)) {
      throw new Error('[EventBus] Invalid callback function provided to onAny()');
    }
    if (context !== null && !this.isValidContext(context)) {
      throw new Error('[EventBus] Invalid context object provided to onAny()');
    }

    const listener = {
      id: this.generateListenerId(),
      callback,
      context,
      addedAt: Date.now(),
    };

    this.wildcardListeners.add(listener);
    return listener.id;
  }

  /**
   * Unsubscribe from events
   * @param {string} listenerId - Listener ID returned from on(), once(), or onAny()
   * @returns {boolean} True if listener was found and removed
   */
  off(listenerId) {
    if (!listenerId || typeof listenerId !== 'string') {
      return false;
    }

    let removed = false;

    // Remove from regular listeners
    for (const [eventType, listeners] of this.listeners.entries()) {
      for (const listener of listeners) {
        if (listener.id === listenerId) {
          listeners.delete(listener);
          removed = true;

          // Clean up empty event type entries
          if (listeners.size === 0) {
            this.listeners.delete(eventType);
          }
          break;
        }
      }
    }

    // Remove from one-time listeners
    for (const [eventType, listeners] of this.oneTimeListeners.entries()) {
      for (const listener of listeners) {
        if (listener.id === listenerId) {
          listeners.delete(listener);
          removed = true;

          // Clean up empty event type entries
          if (listeners.size === 0) {
            this.oneTimeListeners.delete(eventType);
          }
          break;
        }
      }
    }

    // Remove from wildcard listeners
    for (const listener of this.wildcardListeners) {
      if (listener.id === listenerId) {
        this.wildcardListeners.delete(listener);
        removed = true;
        break;
      }
    }

    return removed;
  }

  /**
   * Emit event immediately (synchronous)
   * @param {string} eventType - Type of event to emit
   * @param {Object} eventData - Event data payload
   * @param {number|null} priority - Event priority (0 = highest)
   * @returns {string} Event ID
   */
  emit(eventType, eventData = {}, priority = null) {
    // Input validation
    if (!eventType || typeof eventType !== 'string' || eventType.trim() === '') {
      throw new Error('[EventBus] Event type must be a non-empty string');
    }

    const event = this.createEvent(eventType, eventData, priority || getDefaultPriority(eventType));

    this.processEventImmediate(event);
    return event.id;
  }

  generateListenerId() {
    return `lis_${this.nextListenerId++}_${Date.now()}`;
  }

  sortListeners(eventType) {
    if (this.listeners.has(eventType)) {
      const listeners = Array.from(this.listeners.get(eventType));
      listeners.sort((a, b) => a.priority - b.priority);
      this.listeners.set(eventType, new Set(listeners));
    }
  }

  createEvent(eventType, eventData, priority) {
    const event = {
      id: this.generateEventId(),
      type: eventType,
      data: eventData,
      priority,
      timestamp: performance.now(),
      processed: false,
      createdAt: Date.now(),
    };

    return event;
  }

  generateEventId() {
    return `evt_${this.nextEventId++}_${Date.now()}`;
  }

  /**
   * Process single event immediately
   * @param {Object} event - Event to process
   */
  processEventImmediate(event) {
    const startTime = performance.now();

    try {
      // Process event listeners

      // Process regular listeners
      if (this.listeners.has(event.type)) {
        const listeners = Array.from(this.listeners.get(event.type));
        this.callListeners(listeners, event);
      }

      // Process one-time listeners
      if (this.oneTimeListeners.has(event.type)) {
        const listeners = Array.from(this.oneTimeListeners.get(event.type));

        // Call listeners first
        const calledListeners = this.callListeners(listeners, event);

        // Remove only the listeners that were successfully called
        if (calledListeners && calledListeners.length > 0) {
          const remainingListeners = this.oneTimeListeners.get(event.type);
          for (const calledListener of calledListeners) {
            remainingListeners.delete(calledListener);
          }

          // Clean up empty event type entries
          if (remainingListeners.size === 0) {
            this.oneTimeListeners.delete(event.type);
          }
        }
      }

      // Process wildcard listeners
      if (this.wildcardListeners.size > 0) {
        const listeners = Array.from(this.wildcardListeners);
        this.callListeners(listeners, event, true);
      }

      event.processed = true;

      // Log processing time for performance monitoring
      const processingTime = performance.now() - startTime;
      if (processingTime > 10) {
        this.logger.warn(`Slow event processing: ${processingTime}ms for event ${event.type}`);
      }
    } catch (error) {
      this.logger.error(' Error processing event:', {
        eventType: event.type,
        eventId: event.id,
        error: error.message,
        stack: error.stack,
      });
      this.handleError(error, event, 'event-processing');
    }
  }

  /**
   * Call array of listeners for an event
   * @param {Array} listeners - Array of listener objects
   * @param {Object} event - Event object
   * @param {boolean} isWildcard - Whether these are wildcard listeners
   */
  callListeners(listeners, event, isWildcard = false) {
    const calledListeners = [];

    for (const listener of listeners) {
      try {
        const callStartTime = performance.now();

        if (listener.context) {
          if (isWildcard) {
            listener.callback.call(listener.context, event.type, event.data, event);
          } else {
            listener.callback.call(listener.context, event.data, event);
          }
        } else {
          if (isWildcard) {
            listener.callback(event.type, event.data, event);
          } else {
            listener.callback(event.data, event);
          }
        }

        const callTime = performance.now() - callStartTime;
        calledListeners.push(listener);

        // Log slow listeners for debugging
        if (callTime > 5) {
          this.logger.warn(`Slow listener detected: ${callTime}ms for event ${event.type}`);
        }
      } catch (error) {
        this.logger.error(' Error executing listener:', {
          eventType: event.type,
          listenerId: listener.id,
          error: error.message,
          stack: error.stack,
        });
        this.handleError(error, event, 'listener-execution', listener);
      }
    }

    return calledListeners;
  }

  /**
   * Input validation methods
   */

  /**
   * Validate event types parameter
   * @param {string|Array<string>} eventTypes - Event types to validate
   * @returns {boolean} True if valid
   */
  validateEventTypes(eventTypes) {
    if (!eventTypes) return false;

    if (typeof eventTypes === 'string') {
      return eventTypes.trim() !== '';
    }

    if (Array.isArray(eventTypes)) {
      return (
        eventTypes.length > 0 &&
        eventTypes.every(type => typeof type === 'string' && type.trim() !== '')
      );
    }

    return false;
  }

  /**
   * Validate callback function
   * @param {Function} callback - Callback to validate
   * @returns {boolean} True if valid
   */
  validateCallback(callback) {
    return typeof callback === 'function';
  }

  /**
   * Validate context object
   * @param {Object} context - Context to validate
   * @returns {boolean} True if valid
   */
  isValidContext(context) {
    return context !== null && typeof context === 'object';
  }

  /**
   * Handle errors during event processing
   * @param {Error} error - The error that occurred
   * @param {Object} event - The event being processed
   * @param {string} phase - The phase where error occurred
   * @param {Object} listener - The listener that caused the error (optional)
   */
  handleError(error, event, phase, listener = null) {
    const errorInfo = {
      phase,
      eventType: event?.type,
      eventId: event?.id,
      timestamp: Date.now(),
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
    };

    if (listener) {
      errorInfo.listener = {
        id: listener.id,
        callbackName: listener.callback.name || 'anonymous',
      };
    }

    // Log detailed error information
    this.logger.error(`${phase} error:`, errorInfo);

    // Emit error event (but prevent infinite loops)
    if (event?.type !== 'event-bus-error') {
      try {
        this.emit('event-bus-error', errorInfo);
      } catch (nestedError) {
        this.logger.error(' Failed to emit error event:', nestedError.message);
      }
    }
  }

  /**
   * Get EventBus statistics for debugging
   * @returns {Object} Statistics object
   */
  getStats() {
    const stats = {
      regularListeners: 0,
      oneTimeListeners: 0,
      wildcardListeners: this.wildcardListeners.size,
      eventTypes: {
        regular: Array.from(this.listeners.keys()),
        oneTime: Array.from(this.oneTimeListeners.keys()),
      },
    };

    // Count regular listeners
    for (const listeners of this.listeners.values()) {
      stats.regularListeners += listeners.size;
    }

    // Count one-time listeners
    for (const listeners of this.oneTimeListeners.values()) {
      stats.oneTimeListeners += listeners.size;
    }

    return stats;
  }

  /**
   * Clear all listeners (useful for cleanup)
   */
  clear() {
    this.listeners.clear();
    this.oneTimeListeners.clear();
    this.wildcardListeners.clear();
  }
}

let eventBus = null;

export const getEventBus = () => {
  if (!eventBus) {
    eventBus = new EventBus();
  }

  return eventBus;
};
