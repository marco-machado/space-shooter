import Logger from '@/utils/Logger.js';

/**
 * Base class for all ECS components
 * Provides common functionality for component lifecycle management,
 * serialization, and validation
 */
export default class BaseComponent {
  /**
   * Create a new component instance
   */
  constructor() {
    /** @type {BaseEntity|null} Reference to the entity this component is attached to */
    this.entity = null;
    /** @type {boolean} Whether this component is active */
    this.active = true;
    /** @type {string} Unique component identifier */
    this.componentId = BaseComponent.generateId();

    Logger.debug(
      `[BaseComponent] Component created: ${this.constructor.name} (${this.componentId})`
    );
  }

  /**
   * Generate unique component ID
   * @returns {string} Unique identifier in format 'comp_timestamp_randomstring'
   * @static
   */
  static generateId() {
    return `comp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Initialize component with data
   * Override in subclasses to handle component-specific initialization
   * @param {Object} [data={}] - Initialization data
   * @throws {Error} When data validation fails
   */
  init(data = {}) {
    if (data !== null && typeof data !== 'object') {
      throw new Error(`[BaseComponent] Invalid data type for ${this.constructor.name}: expected object, got ${typeof data}`);
    }
    
    // Override in subclasses
    Logger.debug(`[BaseComponent] Component initialized: ${this.constructor.name}`, data);
  }

  /**
   * Validate component data
   * Override in subclasses to implement validation logic
   * @returns {boolean} True if component state is valid, false otherwise
   */
  validate() {
    // Base validation checks
    if (!this.componentId || typeof this.componentId !== 'string') {
      Logger.warn(`[BaseComponent] Invalid componentId for ${this.constructor.name}:`, this.componentId);
      return false;
    }
    
    if (typeof this.active !== 'boolean') {
      Logger.warn(`[BaseComponent] Invalid active state for ${this.constructor.name}:`, this.active);
      return false;
    }
    
    // Override in subclasses for additional validation
    return true;
  }

  /**
   * Serialize component data for save/load
   * Override in subclasses to define what data should be persisted
   * @returns {Object} Serializable data containing type, componentId, and active state
   * @throws {Error} When serialization fails or required data is missing
   */
  serialize() {
    try {
      const serializedData = {
        type: this.constructor.name,
        componentId: this.componentId,
        active: this.active,
      };
      
      // Validate serialized data
      if (!serializedData.type || !serializedData.componentId) {
        throw new Error(`[BaseComponent] Serialization failed for ${this.constructor.name}: missing required data`);
      }
      
      return serializedData;
    } catch (error) {
      Logger.error(`[BaseComponent] Serialization error for ${this.constructor.name}:`, error.message);
      throw error;
    }
  }

  /**
   * Deserialize component data from save data
   * Override in subclasses to restore component state
   * @param {Object} data - Saved component data with componentId and active properties
   * @param {string} [data.componentId] - Component identifier to restore
   * @param {boolean} [data.active] - Component active state to restore
   * @throws {Error} When data validation fails or deserialization encounters errors
   */
  deserialize(data) {
    try {
      if (!data || typeof data !== 'object') {
        throw new Error(`[BaseComponent] Invalid deserialization data for ${this.constructor.name}: expected object, got ${typeof data}`);
      }
      
      if (data.componentId && typeof data.componentId !== 'string') {
        throw new Error(`[BaseComponent] Invalid componentId type for ${this.constructor.name}: expected string, got ${typeof data.componentId}`);
      }
      
      if (data.active !== undefined && typeof data.active !== 'boolean') {
        throw new Error(`[BaseComponent] Invalid active type for ${this.constructor.name}: expected boolean, got ${typeof data.active}`);
      }
      
      this.componentId = data.componentId || this.componentId;
      this.active = data.active !== undefined ? data.active : true;
      Logger.debug(`[BaseComponent] Component deserialized: ${this.constructor.name}`, data);
    } catch (error) {
      Logger.error(`[BaseComponent] Deserialization error for ${this.constructor.name}:`, error.message);
      throw error;
    }
  }

  /**
   * Clean up component resources
   * Override in subclasses if cleanup is needed
   * Clears entity reference and sets component as inactive
   */
  destroy() {
    // Validate state before destruction
    if (!this.validate()) {
      Logger.warn(`[BaseComponent] Destroying component with invalid state: ${this.constructor.name} (${this.componentId})`);
    }
    
    this.entity = null;
    this.active = false;
    Logger.debug(
      `[BaseComponent] Component destroyed: ${this.constructor.name} (${this.componentId})`
    );
  }
}
