import Logger from '@/utils/Logger.js';

/**
 * Base BaseSystem class for ECS architecture
 * Systems contain logic and operate on entities with specific components
 * All game behavior is implemented in systems, not components
 */
export default class BaseSystem {
  constructor() {
    this.name = this.constructor.name;
    this.active = true;
    this.priority = 0; // Lower numbers run first
    this.systemId = BaseSystem.generateId();

    // Performance tracking
    this.updateCount = 0;
    this.totalUpdateTime = 0;
    this.averageUpdateTime = 0;

    Logger.debug(`[BaseSystem] System created: ${this.name} (${this.systemId})`);
  }

  /**
   * Generate unique scopeName ID
   * @returns {string} Unique identifier
   */
  static generateId() {
    return `sys_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Initialize scopeName with configuration
   * Override in subclasses for scopeName-specific setup
   * @param {Object} config - BaseSystem configuration
   */
  init(config = {}) {
    this.active = config.active !== undefined ? config.active : true;
    this.priority = config.priority || 0;
    Logger.debug(`[BaseSystem] System initialized: ${this.name}`, config);
  }

  /**
   * Main update method - must be implemented by subclasses
   * @param {Array<BaseEntity>} entities - Array of entities to process
   * @param {number} delta - Time delta in milliseconds
   */
  update(_entities, _delta) {
    throw new Error(`${this.name} must implement update() method`);
  }

  /**
   * Process entities with performance tracking
   * @param {Array<BaseEntity>} entities - Array of entities to process
   * @param {number} delta - Time delta in milliseconds
   */
  process(entities, delta) {
    if (!this.active) return;

    const startTime = performance.now();

    try {
      this.update(entities, delta);
      this.updateCount++;
    } catch (error) {
      Logger.error(`[BaseSystem] Error processing system ${this.name}:`, error);
    }

    const endTime = performance.now();
    const updateTime = endTime - startTime;
    this.totalUpdateTime += updateTime;
    this.averageUpdateTime = this.totalUpdateTime / this.updateCount;

    // Log performance warnings for slow systems
    if (updateTime > 16.67) {
      // More than one frame at 60fps
      Logger.warn(`[BaseSystem] Slow system update: ${this.name} took ${updateTime.toFixed(2)}ms`);
    }
  }

  /**
   * Filter entities that have all required components
   * @param {Array<BaseEntity>} entities - All entities
   * @param {Array<Function>} requiredComponents - Required component types
   * @returns {Array<BaseEntity>} Filtered entities
   */
  getEntitiesWithComponents(entities, requiredComponents) {
    return entities.filter(entity => {
      if (!entity.active) return false;

      return requiredComponents.every(componentType => entity.hasComponent(componentType));
    });
  }

  /**
   * Filter entities that have any of the specified components
   * @param {Array<BaseEntity>} entities - All entities
   * @param {Array<Function>} componentTypes - BaseComponent types to check
   * @returns {Array<BaseEntity>} Filtered entities
   */
  getEntitiesWithAnyComponent(entities, componentTypes) {
    return entities.filter(entity => {
      if (!entity.active) return false;

      return componentTypes.some(componentType => entity.hasComponent(componentType));
    });
  }

  /**
   * Called when scopeName is added to a scene
   * Override in subclasses for setup logic
   * @param {Phaser.Scene} scene - The scene this scopeName is added to
   */
  onAddedToScene(scene) {
    Logger.debug(`[BaseSystem] System ${this.name} added to scene: ${scene.scene.key}`);
  }

  /**
   * Called when scopeName is removed from a scene
   * Override in subclasses for cleanup logic
   * @param {Phaser.Scene} scene - The scene this scopeName is removed from
   */
  onRemovedFromScene(scene) {
    Logger.debug(`[BaseSystem] System ${this.name} removed from scene: ${scene.scene.key}`);
  }

  /**
   * Enable or disable the scopeName
   * @param {boolean} active - Whether the scopeName should be active
   */
  setActive(active) {
    const wasActive = this.active;
    this.active = active;

    if (wasActive !== active) {
      Logger.debug(`[BaseSystem] System ${this.name} ${active ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Set scopeName priority (affects update order)
   * @param {number} priority - Priority value (lower runs first)
   */
  setPriority(priority) {
    this.priority = priority;
    Logger.debug(`[BaseSystem] System ${this.name} priority set to ${priority}`);
  }

  /**
   * Get scopeName performance statistics
   * @returns {Object} Performance stats
   */
  getPerformanceStats() {
    return {
      name: this.name,
      updateCount: this.updateCount,
      totalUpdateTime: this.totalUpdateTime,
      averageUpdateTime: this.averageUpdateTime,
      active: this.active,
      priority: this.priority,
    };
  }

  /**
   * Reset performance statistics
   */
  resetPerformanceStats() {
    this.updateCount = 0;
    this.totalUpdateTime = 0;
    this.averageUpdateTime = 0;
    Logger.debug(`[BaseSystem] Performance stats reset for system: ${this.name}`);
  }

  /**
   * Clean up scopeName resources
   * Override in subclasses if cleanup is needed
   */
  destroy() {
    this.active = false;
    Logger.debug(`[BaseSystem] System destroyed: ${this.name} (${this.systemId})`);
  }

  /**
   * Serialize scopeName data for save/load
   * Override in subclasses to define what should be persisted
   * @returns {Object} Serializable data
   */
  serialize() {
    return {
      name: this.name,
      systemId: this.systemId,
      active: this.active,
      priority: this.priority,
    };
  }

  /**
   * Deserialize scopeName data from save data
   * Override in subclasses to restore scopeName state
   * @param {Object} data - Saved scopeName data
   */
  deserialize(data) {
    this.systemId = data.systemId || this.systemId;
    this.active = data.active !== undefined ? data.active : true;
    this.priority = data.priority || 0;
    Logger.debug(`[BaseSystem] System deserialized: ${this.name}`, data);
  }
}
