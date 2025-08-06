/**
 * EventBus mock for testing
 * Provides a minimal implementation of EventBus functionality
 */
class EventBusMock {
  constructor() {
    this.listeners = new Map();
    this.oneTimeListeners = new Map();
    this.wildcardListeners = new Set();
    this.nextEventId = 1;
    this.nextListenerId = 1;
    this.emittedEvents = [];
  }

  on(eventTypes, callback, context = null, priority = 100, options = {}) {
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

    for (const eventType of eventTypes) {
      if (!this.listeners.has(eventType)) {
        this.listeners.set(eventType, new Set());
      }
      this.listeners.get(eventType).add(listener);
    }

    return listener.id;
  }

  once(eventTypes, callback, context = null) {
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

  onAny(callback, context = null) {
    const listener = {
      id: this.generateListenerId(),
      callback,
      context,
      addedAt: Date.now(),
    };

    this.wildcardListeners.add(listener);
    return listener.id;
  }

  emit(eventType, eventData = {}, priority = null) {
    const event = {
      id: this.generateEventId(),
      type: eventType,
      data: eventData,
      priority: priority || 100,
      timestamp: performance.now(),
      processed: false,
    };

    this.emittedEvents.push(event);

    // Process listeners (simplified for testing)
    if (this.listeners.has(eventType)) {
      const listeners = Array.from(this.listeners.get(eventType));
      listeners.forEach(listener => {
        if (listener.context) {
          listener.callback.call(listener.context, eventData, event);
        } else {
          listener.callback(eventData, event);
        }
      });
    }

    // Process one-time listeners
    if (this.oneTimeListeners.has(eventType)) {
      const listeners = Array.from(this.oneTimeListeners.get(eventType));
      this.oneTimeListeners.delete(eventType);
      listeners.forEach(listener => {
        if (listener.context) {
          listener.callback.call(listener.context, eventData, event);
        } else {
          listener.callback(eventData, event);
        }
      });
    }

    // Process wildcard listeners
    this.wildcardListeners.forEach(listener => {
      if (listener.context) {
        listener.callback.call(listener.context, eventType, eventData, event);
      } else {
        listener.callback(eventType, eventData, event);
      }
    });

    event.processed = true;
    return event.id;
  }

  off(listenerId) {
    if (!listenerId || typeof listenerId !== 'string') {
      return false;
    }

    // Remove from regular listeners
    for (const [eventType, listeners] of this.listeners) {
      for (const listener of listeners) {
        if (listener.id === listenerId) {
          listeners.delete(listener);
          if (listeners.size === 0) {
            this.listeners.delete(eventType);
          }
          return true;
        }
      }
    }

    // Remove from one-time listeners
    for (const [eventType, listeners] of this.oneTimeListeners) {
      for (const listener of listeners) {
        if (listener.id === listenerId) {
          listeners.delete(listener);
          if (listeners.size === 0) {
            this.oneTimeListeners.delete(eventType);
          }
          return true;
        }
      }
    }

    // Remove from wildcard listeners
    for (const listener of this.wildcardListeners) {
      if (listener.id === listenerId) {
        this.wildcardListeners.delete(listener);
        return true;
      }
    }

    return false;
  }

  generateListenerId() {
    return `lis_${this.nextListenerId++}_${Date.now()}`;
  }

  generateEventId() {
    return `evt_${this.nextEventId++}_${Date.now()}`;
  }

  // Testing utilities
  reset() {
    this.listeners.clear();
    this.oneTimeListeners.clear();
    this.wildcardListeners.clear();
    this.emittedEvents = [];
    this.nextEventId = 1;
    this.nextListenerId = 1;
  }

  getEmittedEvents() {
    return [...this.emittedEvents];
  }

  getListenerCount(eventType) {
    return this.listeners.has(eventType) ? this.listeners.get(eventType).size : 0;
  }

  hasListener(eventType) {
    return this.listeners.has(eventType) && this.listeners.get(eventType).size > 0;
  }
}

// Singleton instance for testing
let mockEventBusInstance = null;

/**
 * Mock getEventBus function that returns a singleton mock instance
 * @returns {EventBusMock} Mock EventBus instance
 */
export const getEventBus = () => {
  if (!mockEventBusInstance) {
    mockEventBusInstance = new EventBusMock();
  }
  return mockEventBusInstance;
};

/**
 * Reset the mock EventBus instance (useful for test cleanup)
 */
export const resetMockEventBus = () => {
  if (mockEventBusInstance) {
    mockEventBusInstance.reset();
  }
  mockEventBusInstance = null;
};

/**
 * Create a new EventBus mock instance
 * @returns {EventBusMock} New mock instance
 */
export const createMockEventBus = () => {
  return new EventBusMock();
};

export default EventBusMock;