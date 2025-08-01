import Logger from '../core/Logger.js';

/**
 * Base Entity class extending Phaser.GameObjects.Rectangle
 * Provides ECS foundation with component management
 * Uses colored rectangles for development graphics
 */
class Entity extends Phaser.GameObjects.Rectangle {
  constructor(scene, x, y, width, height, color) {
    super(scene, x, y, width, height, color);

    // Component storage
    this.components = new Map();

    // Entity metadata
    this.entityId = Entity.generateId();
    this.active = true;
    this.visible = true;

    // Add to scene display list and physics world if needed
    scene.add.existing(this);

    // Register with scene's entity system
    if (!scene.entities) {
      scene.entities = [];
    }
    scene.entities.push(this);

    Logger.debug(`Entity created: ${this.entityId}`, {
      position: { x, y },
      size: { width, height },
      color: color.toString(16),
    });
  }

  /**
   * Generate unique entity ID
   * @returns {string} Unique identifier
   */
  static generateId() {
    return `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add a component to this entity
   * @param {Object} component - Component instance to add
   * @returns {Entity} This entity for chaining
   */
  addComponent(component) {
    const componentName = component.constructor.name;
    this.components.set(componentName, component);

    // Set reference back to entity
    component.entity = this;

    Logger.debug(`Component added: ${componentName} to ${this.entityId}`);
    return this;
  }

  /**
   * Remove a component from this entity
   * @param {Function} componentType - Component class/constructor
   * @returns {Entity} This entity for chaining
   */
  removeComponent(componentType) {
    const componentName = componentType.name;
    const component = this.components.get(componentName);

    if (component) {
      // Clear entity reference
      component.entity = null;
      this.components.delete(componentName);
      Logger.debug(`Component removed: ${componentName} from ${this.entityId}`);
    }

    return this;
  }

  /**
   * Get a component of the specified type
   * @param {Function} componentType - Component class/constructor
   * @returns {Object|null} Component instance or null if not found
   */
  getComponent(componentType) {
    return this.components.get(componentType.name) || null;
  }

  /**
   * Check if entity has a component of the specified type
   * @param {Function} componentType - Component class/constructor
   * @returns {boolean} True if component exists
   */
  hasComponent(componentType) {
    return this.components.has(componentType.name);
  }

  /**
   * Get all components attached to this entity
   * @returns {Array<Object>} Array of all components
   */
  getAllComponents() {
    return Array.from(this.components.values());
  }

  /**
   * Update entity - called by systems or scene update
   * Override in subclasses for entity-specific behavior
   * @param {number} delta - Time delta in milliseconds
   */
  update(_delta) {
    // Base update logic - can be overridden
    // Systems will handle most update logic via components
  }

  /**
   * Clean up entity and remove from scene
   * Properly removes from entity registry and cleans up components
   */
  destroy() {
    Logger.debug(`Entity destroyed: ${this.entityId}`);

    // Clean up all components
    this.components.forEach(component => {
      if (component.entity) {
        component.entity = null;
      }
    });
    this.components.clear();

    // Remove from scene's entity registry
    if (this.scene && this.scene.entities) {
      const index = this.scene.entities.indexOf(this);
      if (index > -1) {
        this.scene.entities.splice(index, 1);
      }
    }

    // Call Phaser's destroy method
    super.destroy();
  }

  /**
   * Enable physics for this entity
   * @param {string} bodyType - Physics body type ('dynamic', 'static', 'kinematic')
   * @returns {Entity} This entity for chaining
   */
  enablePhysics(bodyType = 'dynamic') {
    if (this.scene.physics && this.scene.physics.world) {
      this.scene.physics.add.existing(this, bodyType === 'static');

      // Configure physics body based on type
      if (this.body) {
        switch (bodyType) {
          case 'static':
            this.body.setImmovable(true);
            break;
          case 'kinematic':
            this.body.setImmovable(true);
            this.body.moves = true;
            break;
          case 'dynamic':
          default:
            this.body.setImmovable(false);
            break;
        }
      }

      Logger.debug(`Physics enabled for ${this.entityId}: ${bodyType}`);
    }

    return this;
  }

  /**
   * Set entity position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Entity} This entity for chaining
   */
  setPosition(x, y) {
    super.setPosition(x, y);
    Logger.debug(`Entity ${this.entityId} moved to (${x}, ${y})`);
    return this;
  }

  /**
   * Set entity size
   * @param {number} width - Width
   * @param {number} height - Height
   * @returns {Entity} This entity for chaining
   */
  setSize(width, height) {
    try {
      // Validate entity state before calling setSize
      if (!this.scene || this.scene.sys.isDestroyed) {
        Logger.error(`Entity ${this.entityId}: Cannot setSize - scene is destroyed`);
        return this;
      }

      // Validate parameters
      if (typeof width !== 'number' || typeof height !== 'number' || width <= 0 || height <= 0) {
        Logger.error(`Entity ${this.entityId}: Invalid size parameters`, { width, height });
        return this;
      }

      // Check if entity is in valid state
      if (!this.active && !this.getData) {
        Logger.error(`Entity ${this.entityId}: Entity appears to be corrupted or destroyed`);
        return this;
      }

      // Call parent setSize with error handling
      super.setSize(width, height);
      
      // Update physics body size if it exists
      if (this.body && this.body.setSize) {
        this.body.setSize(width * 0.8, height * 0.8);
        this.body.setOffset(width * 0.1, height * 0.1);
      }

      Logger.debug(`Entity ${this.entityId} resized to ${width}x${height}`);
    } catch (error) {
      Logger.error(`Entity ${this.entityId}: setSize failed`, {
        error: error.message,
        width,
        height,
        entityState: {
          active: this.active,
          visible: this.visible,
          hasScene: !!this.scene,
          hasBody: !!this.body
        }
      });
    }
    return this;
  }
}

export default Entity;
