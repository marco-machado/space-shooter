import Logger from '../utils/Logger.js';

/**
 * Base Component class
 * Components are pure data containers in the ECS architecture
 * All game behavior is handled by Systems, not Components
 */
class Component {
  constructor() {
    this.entity = null; // Reference to the entity this component is attached to
    this.active = true; // Whether this component is active
    this.componentId = Component.generateId();

    Logger.debug(`Component created: ${this.constructor.name} (${this.componentId})`);
  }

  /**
   * Generate unique component ID
   * @returns {string} Unique identifier
   */
  static generateId() {
    return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize component with data
   * Override in subclasses to handle component-specific initialization
   * @param {Object} data - Initialization data
   */
  init(data = {}) {
    // Override in subclasses
    Logger.debug(`Component initialized: ${this.constructor.name}`, data);
  }

  /**
   * Validate component data
   * Override in subclasses to implement validation logic
   * @returns {boolean} True if valid
   */
  validate() {
    // Override in subclasses
    return true;
  }

  /**
   * Serialize component data for save/load
   * Override in subclasses to define what data should be persisted
   * @returns {Object} Serializable data
   */
  serialize() {
    return {
      type: this.constructor.name,
      componentId: this.componentId,
      active: this.active,
    };
  }

  /**
   * Deserialize component data from save data
   * Override in subclasses to restore component state
   * @param {Object} data - Saved component data
   */
  deserialize(data) {
    this.componentId = data.componentId || this.componentId;
    this.active = data.active !== undefined ? data.active : true;
    Logger.debug(`Component deserialized: ${this.constructor.name}`, data);
  }

  /**
   * Clean up component resources
   * Override in subclasses if cleanup is needed
   */
  destroy() {
    this.entity = null;
    this.active = false;
    Logger.debug(`Component destroyed: ${this.constructor.name} (${this.componentId})`);
  }
}

export default Component;
