import Logger from '@/utils/Logger.js';
import ConfigManager from '@/config/ConfigManager.js';

/**
 * Base Entity class using composition pattern with flexible Phaser GameObjects
 * Supports multiple GameObject types or no GameObject for pure logical entities
 * Maintains backward compatibility with rectangle-based usage
 * Uses colored rectangles for development graphics following project standards
 */
export default class BaseEntity {
  /**
   * Create a new BaseEntity with flexible GameObject support
   *
   * @param {Phaser.Scene} scene - Phaser scene reference
   * @param {Object|number} configOrX - Configuration object or X position (backward compatibility)
   * @param {number} [y] - Y position (backward compatibility)
   * @param {number} [width] - Width (backward compatibility)
   * @param {number} [height] - Height (backward compatibility)
   * @param {number} [color] - Color (backward compatibility)
   * @param {string} [name] - Entity name (backward compatibility)
   */
  constructor(scene, configOrX, y, width, height, color, name = 'noname') {
    // Handle backward compatibility: if configOrX is a number, use old constructor signature
    if (typeof configOrX === 'number') {
      this._initWithLegacyParams(scene, configOrX, y, width, height, color, name);
    } else {
      this._initWithConfig(scene, configOrX || {});
    }

    // BaseComponent storage
    this.components = new Map();

    // Entity metadata
    this.entityId = BaseEntity.generateId();

    // Internal event listeners
    this.eventListeners = new Map();

    // Create the GameObject based on configuration
    this.gameObject = this.createGameObject();

    // Register with scene's entity scopeName
    this._registerWithScene(scene);

    Logger.scope('BaseEntity').debug(` Entity created: ${this.entityId}`, {
      type: this.config.type,
      position: { x: this.config.x, y: this.config.y },
      hasGameObject: !!this.gameObject,
      name: this.name,
    });
  }

  /**
   * Get/Set X position
   */
  get x() {
    return this.gameObject ? this.gameObject.x : this.config.x;
  }

  /**
   *
   * GameObject proxies
   *
   */

  set x(value) {
    this.config.x = value;
    if (this.gameObject) {
      this.gameObject.x = value;
    }
  }

  /**
   * Get/Set Y position
   */
  get y() {
    return this.gameObject ? this.gameObject.y : this.config.y;
  }

  set y(value) {
    this.config.y = value;
    if (this.gameObject) {
      this.gameObject.y = value;
    }
  }

  /**
   * Get/Set width (null-safe)
   */
  get width() {
    if (this.gameObject && this.gameObject.width !== undefined) {
      return this.gameObject.width;
    }
    return this.config.width || 32;
  }

  set width(value) {
    this.config.width = value;
    if (this.gameObject && this.gameObject.width !== undefined) {
      this.gameObject.width = value;
    }
  }

  /**
   * Get/Set height (null-safe)
   */
  get height() {
    if (this.gameObject && this.gameObject.height !== undefined) {
      return this.gameObject.height;
    }
    return this.config.height || 32;
  }

  set height(value) {
    this.config.height = value;
    if (this.gameObject && this.gameObject.height !== undefined) {
      this.gameObject.height = value;
    }
  }

  /**
   * Get scene reference
   */
  get scene() {
    return this._scene || (this.gameObject ? this.gameObject.scene : null);
  }

  set scene(value) {
    this._scene = value;
  }

  /**
   * Get/Set active state (null-safe)
   */
  get active() {
    return this.gameObject ? this.gameObject.active : true;
  }

  set active(value) {
    if (this.gameObject) {
      this.gameObject.active = value;
    }
  }

  /**
   * Get/Set visible state (null-safe)
   */
  get visible() {
    return this.gameObject ? this.gameObject.visible : true;
  }

  set visible(value) {
    if (this.gameObject) {
      this.gameObject.visible = value;
    }
  }

  /**
   * Get physics body (null-safe)
   */
  get body() {
    return this.gameObject ? this.gameObject.body : null;
  }

  /**
   * Generate unique entity ID.
   *
   * @returns {string} Unique identifier
   */
  static generateId() {
    return `entity_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Initialize with legacy constructor parameters (backward compatibility)
   * @private
   */
  _initWithLegacyParams(scene, x, y, width, height, color, name) {
    this.scene = scene;
    this.name = name;
    this.config = {
      type: 'rectangle',
      x,
      y,
      width,
      height,
      color,
    };
  }

  /**
   * Initialize with configuration object
   * @private
   */
  _initWithConfig(scene, config) {
    this.scene = scene;
    this.name = config.name || 'noname';

    // Default configuration
    this.config = {
      type: config.type || 'rectangle',
      x: config.x || 0,
      y: config.y || 0,
      ...config,
    };
  }

  /**
   * Creates a game object based on the specified type in the configuration.
   *
   * @private
   * @return {Object|null} The created game object of the specified type, or null if the type is not set or invalid.
   */
  createGameObject() {
    if (this.config.type === null || this.config.type === 'null') {
      return null;
    }

    try {
      switch (this.config.type) {
        case 'rectangle':
          return this._createRectangle();
        case 'sprite':
          return this._createSprite();
        case 'image':
          return this._createImage();
        case 'circle':
          return this._createCircle();
        case 'polygon':
          return this._createPolygon();
        case 'text':
          return this._createText();
        default:
          Logger.scope('BaseEntity').warn(
            `Unknown GameObject type: ${this.config.type}, falling back to rectangle`
          );
          return this._createRectangle();
      }
    } catch (error) {
      Logger.scope('BaseEntity').error(` Failed to create GameObject of type ${this.config.type}:`, error);
      return this._createRectangle();
    }
  }

  /**
   * Create rectangle GameObject (default/fallback)
   * @private
   * @returns {Phaser.GameObjects.Rectangle}
   */
  _createRectangle() {
    const rectangle = this.scene.add.rectangle(
      this.config.x,
      this.config.y,
      this.config.width || 32,
      this.config.height || 32,
      this.config.color || 0xffffff
    );
    // this.scene.add.existing(rectangle);
    return rectangle;
  }

  /**
   * Create sprite GameObject
   * @private
   * @returns {Phaser.GameObjects.Sprite}
   */
  _createSprite() {
    if (!this.config.texture) {
      throw new Error('Sprite type requires texture parameter');
    }
    const sprite = this.scene.add.sprite(
      this.config.x,
      this.config.y,
      this.config.texture,
      this.config.frame
    );
    return sprite;
  }

  /**
   * Create image GameObject
   * @private
   * @returns {Phaser.GameObjects.Image}
   */
  _createImage() {
    if (!this.config.texture) {
      throw new Error('Image type requires texture parameter');
    }
    const image = this.scene.add.image(this.config.x, this.config.y, this.config.texture);
    return image;
  }

  /**
   * Create circle GameObject
   * @private
   * @returns {Phaser.GameObjects.Arc}
   */
  _createCircle() {
    const circle = this.scene.add.circle(
      this.config.x,
      this.config.y,
      this.config.radius || 16,
      this.config.color || 0xffffff
    );
    this.scene.add.existing(circle);
    return circle;
  }

  /**
   * Create polygon GameObject
   * @private
   * @returns {Phaser.GameObjects.Polygon}
   */
  _createPolygon() {
    if (!this.config.points) {
      // Default diamond shape for power-ups following development graphics strategy
      this.config.points = [0, -16, 14, 14, -14, 14];
    }
    const polygon = this.scene.add.polygon(
      this.config.x,
      this.config.y,
      this.config.points,
      this.config.color || 0x00ff00
    );
    this.scene.add.existing(polygon);
    return polygon;
  }

  /**
   * Create text GameObject
   * @private
   * @returns {Phaser.GameObjects.Text}
   */
  _createText() {
    const text = this.scene.add.text(
      this.config.x,
      this.config.y,
      this.config.text || 'Entity',
      this.config.style || { fontSize: '16px', color: '#ffffff' }
    );
    return text;
  }

  /**
   * Recreate GameObject when it has been destroyed (for object pooling)
   * @returns {BaseEntity} This entity for chaining
   */
  recreateGameObject() {
    throw new Error('NO GAMEOBJECT RECREATION');

    // Check if recreation is needed
    if (this.gameObject) {
      Logger.scope('BaseEntity').debug(` Entity ${this.entityId}: GameObject already exists, skipping recreation`
      );
      return this;
    }

    // Validate scene state before recreation
    if (!this.scene || this.scene.sys.isDestroyed) {
      Logger.scope('BaseEntity').error(` Entity ${this.entityId}: Cannot recreate GameObject - scene is destroyed`
      );
      return this;
    }

    try {
      // Recreate GameObject using existing configuration
      this.gameObject = this.createGameObject();

      if (this.gameObject) {
        // Re-enable physics if scene has physics and original entity had physics
        if (this.scene.physics && this.config.requiresPhysics) {
          this.enablePhysics(
            this.config.physicsBodyType || 'dynamic',
            this.config.collisionGroup,
            this.config.physicsOptions || {}
          );
        }

        // Restore position from config
        this.gameObject.setPosition(this.config.x, this.config.y);

        // Set visibility and active state
        this.gameObject.visible = true;
        this.gameObject.active = true;

        Logger.scope('BaseEntity').debug(` Entity ${this.entityId}: GameObject successfully recreated`, {
          type: this.config.type,
          position: { x: this.config.x, y: this.config.y },
          hasPhysics: !!this.body,
        });
      } else {
        Logger.scope('BaseEntity').error(` Entity ${this.entityId}: Failed to recreate GameObject`);
      }
    } catch (error) {
      Logger.scope('BaseEntity').error(` Entity ${this.entityId}: GameObject recreation failed`, {
        error: error.message,
        config: this.config,
      });
    }

    return this;
  }

  /**
   * Register entity with scene's entity scopeName
   * @private
   * @param {Phaser.Scene} scene - Scene reference
   */
  _registerWithScene(scene) {
    if (!scene.entities) {
      scene.entities = [];
    }
    scene.entities.push(this);
  }

  /**
   * Change GameObject type at runtime
   * @param {string} newType - New GameObject type
   * @param {Object} newConfig - New configuration for GameObject
   * @returns {BaseEntity} This entity for chaining
   */
  changeGameObjectType(newType, newConfig = {}) {
    // Preserve current position if not specified
    const currentX = this.gameObject ? this.gameObject.x : this.config.x;
    const currentY = this.gameObject ? this.gameObject.y : this.config.y;

    // Destroy current GameObject if it exists
    if (this.gameObject) {
      this.gameObject.destroy();
    }

    // Update configuration
    this.config = {
      ...this.config,
      ...newConfig,
      type: newType,
      x: newConfig.x !== undefined ? newConfig.x : currentX,
      y: newConfig.y !== undefined ? newConfig.y : currentY,
    };

    // Create new GameObject
    this.gameObject = this.createGameObject();

    Logger.scope('BaseEntity').debug(
      `Entity ${this.entityId} changed GameObject type to: ${newType}`
    );
    return this;
  }

  /**
   * Add a component to this entity
   * @param {Object} component - BaseComponent instance to add
   * @returns {BaseEntity} This entity for chaining
   */
  addComponent(component) {
    const componentName = component.constructor.name;
    this.components.set(componentName, component);

    // Set reference back to entity
    component.entity = this;

    return this;
  }

  /**
   * Remove a component from this entity
   * @param {Function} componentType - BaseComponent class/constructor
   * @returns {BaseEntity} This entity for chaining
   */
  removeComponent(componentType) {
    const componentName = componentType.name;
    const component = this.components.get(componentName);

    if (component) {
      // Clear entity reference
      component.entity = null;
      this.components.delete(componentName);
    }

    return this;
  }

  /**
   * Get a component of the specified type
   * @param {Function} componentType - BaseComponent class/constructor
   * @returns {Object|null} BaseComponent instance or null if not found
   */
  getComponent(componentType) {
    return this.components.get(componentType.name) || null;
  }

  /**
   * Check if entity has a component of the specified type
   * @param {Function} componentType - BaseComponent class/constructor
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
   * Deactivate entity for pooling (keeps GameObject intact)
   * Makes entity inactive and invisible but preserves GameObject for reuse
   */
  deactivate() {
    this.active = false;
    this.visible = false;

    // Move out of view but don't destroy GameObject
    if (this.gameObject) {
      this.gameObject.setPosition(-1000, -1000);
      this.gameObject.setVisible(false);
      this.gameObject.setActive(false);
    }

    // Reset physics velocity if body exists
    if (this.body && this.body.setVelocity) {
      this.body.setVelocity(0, 0);
    }

    // Reset component states without destroying them
    this.components.forEach(component => {
      if (component.reset) {
        component.reset();
      } else if (component.stop) {
        component.stop();
      }
    });

    Logger.scope('BaseEntity').debug(` Entity deactivated for pooling: ${this.entityId}`);
  }

  /**
   * Clean up entity and remove from scene
   * Properly removes from entity registry and cleans up components
   * WARNING: This permanently destroys the GameObject - use deactivate() for pooling
   */
  destroy() {
    this.active = false;

    // Clean up all components
    this.components.forEach(component => {
      if (component.entity) {
        component.entity = null;
      }
    });
    this.components.clear();

    // Clean up internal event listeners
    if (this.eventListeners) {
      this.eventListeners.clear();
    }

    // Remove from scene's entity registry
    if (this.scene && this.scene.entities) {
      const index = this.scene.entities.indexOf(this);
      if (index > -1) {
        this.scene.entities.splice(index, 1);
      }
    }

    // Call GameObject's destroy method if it exists
    if (this.gameObject) {
      this.gameObject.destroy();
    }

    Logger.scope('BaseEntity').debug(` Entity destroyed: ${this.entityId}`);
  }

  /**
   * Enable physics for this entity with collision group support
   * @param {string} bodyType - Physics body type ('dynamic', 'static', 'kinematic')
   * @param {string} [collisionGroup] - Collision group name from ConfigManager.COLLISION_GROUPS
   * @param {Object} [options] - Additional physics options
   * @param {number} [options.bodyScale] - Scale factor for physics body size (default: 0.8)
   * @param {number} [options.offsetScale] - Scale factor for physics body offset (default: 0.1)
   * @returns {BaseEntity} This entity for chaining
   */
  enablePhysics(bodyType = 'dynamic', collisionGroup = null, options = {}) {
    if (!this.gameObject) {
      Logger.scope('BaseEntity').warn(` Entity ${this.entityId}: Cannot enable physics - no GameObject`);
      return this;
    }

    if (!this.scene.physics || !this.scene.physics.world) {
      Logger.scope('BaseEntity').warn(` Entity ${this.entityId}: Scene has no physics world`);
      return this;
    }

    // Add physics body to the gameObject
    this.scene.physics.add.existing(this.gameObject, bodyType === 'static');

    // Configure physics body
    if (this.body) {
      this._configurePhysicsBody(bodyType, collisionGroup, options);

      // Store physics configuration for recreation
      this.config.physicsBodyType = bodyType;
      this.config.collisionGroup = collisionGroup;
      this.config.physicsOptions = { ...options };
      this.config.requiresPhysics = true;

      Logger.scope('BaseEntity').debug(` Physics enabled for ${this.entityId}`, {
        bodyType,
        collisionGroup,
        bodySize: { width: this.body.width, height: this.body.height },
        position: { x: this.body.x, y: this.body.y },
      });
    }

    return this;
  }

  /**
   * Configure physics body properties based on type and options
   * @private
   */
  _configurePhysicsBody(bodyType, collisionGroup, options) {
    if (!this.body) return;

    // Configure physics body based on type
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

    // Set physics body size to match visual representation
    this._updatePhysicsBodySize(options);

    // Set collision group if provided
    if (collisionGroup) {
      this.setCollisionGroup(collisionGroup);
    }

    Logger.scope('BaseEntity').debug(` Physics configuration applied for ${this.entityId}`);
  }

  /**
   * Update physics body size to match visual representation
   * @private
   * @param {Object} options - Physics options
   */
  _updatePhysicsBodySize(options = {}) {
    if (!this.body) return;

    const bodyScale = options.bodyScale || 0.8;
    const offsetScale = options.offsetScale || 0.1;

    const visualWidth = this.width;
    const visualHeight = this.height;

    const physicsWidth = visualWidth * bodyScale;
    const physicsHeight = visualHeight * bodyScale;
    const offsetX = visualWidth * offsetScale;
    const offsetY = visualHeight * offsetScale;

    this.body.setSize(physicsWidth, physicsHeight);
    this.body.setOffset(offsetX, offsetY);

    Logger.scope('BaseEntity').debug(` Physics body sized for ${this.entityId}`, {
      visual: { width: visualWidth, height: visualHeight },
      physics: { width: physicsWidth, height: physicsHeight },
      offset: { x: offsetX, y: offsetY },
    });
  }

  /**
   * Set collision group for this entity
   * @param {string} groupName - Collision group name from ConfigManager.COLLISION_GROUPS
   * @returns {BaseEntity} This entity for chaining
   */
  setCollisionGroup(groupName) {
    if (!this.body) {
      Logger.scope('BaseEntity').warn(` Entity ${this.entityId}: Cannot set collision group - no physics body`
      );
      return this;
    }

    const constants = ConfigManager.getConstants();

    if (!constants.COLLISION_GROUPS[groupName.toUpperCase()]) {
      Logger.scope('BaseEntity').warn(` Entity ${this.entityId}: Unknown collision group: ${groupName}`);
      return this;
    }

    // Store collision group for reference
    this.collisionGroup = groupName;
    this.config.collisionGroup = groupName;

    // Set collision category if available
    const categoryKey = groupName.toUpperCase();
    if (constants.COLLISION_CATEGORIES[categoryKey]) {
      this.body.collisionCategory = constants.COLLISION_CATEGORIES[categoryKey];
    }

    Logger.scope('BaseEntity').debug(` Collision group set for ${this.entityId}: ${groupName}`);
    return this;
  }

  /**
   * Add collision callback for when this entity collides with another
   * @param {Function} callback - Callback function (thisEntity, otherEntity) => void
   * @returns {BaseEntity} This entity for chaining
   */
  onCollision(callback) {
    if (!this.body) {
      Logger.scope('BaseEntity').warn(` Entity ${this.entityId}: Cannot add collision callback - no physics body`
      );
      return this;
    }

    // Store callback for use in collision handlers
    if (!this._collisionCallbacks) {
      this._collisionCallbacks = [];
    }
    this._collisionCallbacks.push(callback);

    Logger.scope('BaseEntity').debug(` Collision callback added for ${this.entityId}`);
    return this;
  }

  /**
   * Add overlap callback for when this entity overlaps with another (trigger collision)
   * @param {Function} callback - Callback function (thisEntity, otherEntity) => void
   * @returns {BaseEntity} This entity for chaining
   */
  onOverlap(callback) {
    if (!this.body) {
      Logger.scope('BaseEntity').warn(` Entity ${this.entityId}: Cannot add overlap callback - no physics body`
      );
      return this;
    }

    // Store callback for use in overlap handlers
    if (!this._overlapCallbacks) {
      this._overlapCallbacks = [];
    }
    this._overlapCallbacks.push(callback);

    Logger.scope('BaseEntity').debug(` Overlap callback added for ${this.entityId}`);
    return this;
  }

  /**
   * Execute collision callbacks when collision occurs
   * @param {BaseEntity} otherEntity - The other entity in the collision
   */
  _executeCollisionCallbacks(otherEntity) {
    if (this._collisionCallbacks) {
      this._collisionCallbacks.forEach(callback => {
        try {
          callback(this, otherEntity);
        } catch (error) {
          Logger.scope('BaseEntity').error(` Error in collision callback for ${this.entityId}:`, error);
        }
      });
    }
  }

  /**
   * Execute overlap callbacks when overlap occurs
   * @param {BaseEntity} otherEntity - The other entity in the overlap
   */
  _executeOverlapCallbacks(otherEntity) {
    if (this._overlapCallbacks) {
      this._overlapCallbacks.forEach(callback => {
        try {
          callback(this, otherEntity);
        } catch (error) {
          Logger.scope('BaseEntity').error(` Error in overlap callback for ${this.entityId}:`, error);
        }
      });
    }
  }

  /**
   * Set entity position (null-safe)
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {BaseEntity} This entity for chaining
   */
  setPosition(x, y) {
    this.config.x = x;
    this.config.y = y;

    if (this.gameObject) {
      this.gameObject.setPosition(x, y);
    }

    Logger.scope('BaseEntity').debug(` Entity ${this.entityId} moved to (${x}, ${y})`);
    return this;
  }

  /**
   * Set entity size (null-safe)
   * @param {number} width - Width
   * @param {number} height - Height
   * @returns {BaseEntity} This entity for chaining
   */
  setSize(width, height) {
    try {
      // Validate parameters
      if (typeof width !== 'number' || typeof height !== 'number' || width <= 0 || height <= 0) {
        Logger.scope('BaseEntity').error(` Entity ${this.entityId}: Invalid size parameters`, {
          width,
          height,
        });
        return this;
      }

      if (this.config.width === width || this.config.height === height) {
        Logger.scope('BaseEntity').debug(` Entity ${this.entityId} has correct size already`);
        return this;
      }

      // Update config
      this.config.width = width;
      this.config.height = height;

      // Update GameObject if it exists and supports setSize
      if (this.gameObject && typeof this.gameObject.setSize === 'function') {
        // Validate entity state before calling setSize
        if (!this.scene || this.scene.sys.isDestroyed) {
          Logger.scope('BaseEntity').error(` Entity ${this.entityId}: Cannot setSize - scene is destroyed`);
          return this;
        }

        // Check if gameObject is in valid state
        if (!this.gameObject.active) {
          Logger.scope('BaseEntity').error(` Entity ${this.entityId}: GameObject appears to be corrupted or destroyed`
          );
          return this;
        }

        // Call gameObject's setSize with error handling
        Logger.scope('BaseEntity').debug('[BaseEntity] GameObject has size parameters', this.gameObject);
        this.gameObject.setSize(width, height);
        Logger.scope('BaseEntity').debug(` GameObject has been resized`);

        // Update physics body size if it exists
        if (this.body && this.body.setSize) {
          this.body.setSize(width * 0.8, height * 0.8);
          this.body.setOffset(width * 0.1, height * 0.1);
        }
      }

      Logger.scope('BaseEntity').debug(` Entity ${this.entityId} resized to ${width}x${height}`);
    } catch (error) {
      Logger.scope('BaseEntity').error(` Entity ${this.entityId}: setSize failed`, {
        error: error.message,
        width,
        height,
        entityState: {
          active: this.active,
          visible: this.visible,
          hasScene: !!this.scene,
          hasBody: !!this.body,
          hasGameObject: !!this.gameObject,
        },
      });
    }
    return this;
  }

  // ========================================
  // EventEmitter Methods (Phaser Integration)
  // ========================================

  /**
   * Add event listener (delegates to gameObject or uses internal scopeName)
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   * @returns {BaseEntity} This entity for chaining
   */
  on(event, callback) {
    if (this.gameObject && this.gameObject.on) {
      this.gameObject.on(event, callback);
    } else {
      // Fallback internal event scopeName
      if (!this.eventListeners.has(event)) {
        this.eventListeners.set(event, []);
      }
      this.eventListeners.get(event).push(callback);
    }
    return this;
  }

  /**
   * Remove event listener (delegates to gameObject or uses internal scopeName)
   * @param {string} event - Event name
   * @param {Function} callback - Event callback to remove
   * @returns {BaseEntity} This entity for chaining
   */
  off(event, callback) {
    if (this.gameObject && this.gameObject.off) {
      this.gameObject.off(event, callback);
    } else {
      // Fallback internal event scopeName
      if (this.eventListeners.has(event)) {
        const listeners = this.eventListeners.get(event);
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
        if (listeners.length === 0) {
          this.eventListeners.delete(event);
        }
      }
    }
    return this;
  }

  /**
   * Add one-time event listener (delegates to gameObject or uses internal scopeName)
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   * @returns {BaseEntity} This entity for chaining
   */
  once(event, callback) {
    if (this.gameObject && this.gameObject.once) {
      this.gameObject.once(event, callback);
    } else {
      // Fallback internal event scopeName
      const onceWrapper = (...args) => {
        callback(...args);
        this.off(event, onceWrapper);
      };
      this.on(event, onceWrapper);
    }
    return this;
  }

  /**
   * Emit event (delegates to gameObject or uses internal scopeName)
   * @param {string} event - Event name
   * @param {...any} args - Event arguments
   * @returns {BaseEntity} This entity for chaining
   */
  emit(event, ...args) {
    if (this.gameObject && this.gameObject.emit) {
      this.gameObject.emit(event, ...args);
    } else {
      // Fallback internal event scopeName
      if (this.eventListeners.has(event)) {
        const listeners = this.eventListeners.get(event).slice(); // Copy to avoid modification during iteration
        listeners.forEach(callback => {
          try {
            callback(...args);
          } catch (error) {
            Logger.scope('BaseEntity').error(` Event handler error for event '${event}':`, error);
          }
        });
      }
    }
    return this;
  }

  /**
   * Remove all listeners for an event (delegates to gameObject or uses internal scopeName)
   * @param {string} [event] - Event name (if not provided, removes all listeners)
   * @returns {BaseEntity} This entity for chaining
   */
  removeAllListeners(event) {
    if (this.gameObject && this.gameObject.removeAllListeners) {
      this.gameObject.removeAllListeners(event);
    } else {
      // Fallback internal event scopeName
      if (event) {
        this.eventListeners.delete(event);
      } else {
        this.eventListeners.clear();
      }
    }
    return this;
  }

  // ========================================
  // Phaser GameObject Method Delegation
  // ========================================

  /**
   * Set depth for rendering layer (delegates to gameObject)
   * @param {number} depth - Rendering depth
   * @returns {BaseEntity} This entity for chaining
   */
  setDepth(depth) {
    if (this.gameObject && this.gameObject.setDepth) {
      this.gameObject.setDepth(depth);
    }
    return this;
  }

  /**
   * Set scale (delegates to gameObject)
   * @param {number} x - X scale
   * @param {number} [y] - Y scale (defaults to x)
   * @returns {BaseEntity} This entity for chaining
   */
  setScale(x, y) {
    if (this.gameObject && this.gameObject.setScale) {
      this.gameObject.setScale(x, y);
    }
    return this;
  }

  /**
   * Set rotation (delegates to gameObject)
   * @param {number} rotation - Rotation in radians
   * @returns {BaseEntity} This entity for chaining
   */
  setRotation(rotation) {
    if (this.gameObject && this.gameObject.setRotation) {
      this.gameObject.setRotation(rotation);
    }
    return this;
  }

  /**
   * Set alpha transparency (delegates to gameObject)
   * @param {number} alpha - Alpha value (0-1)
   * @returns {BaseEntity} This entity for chaining
   */
  setAlpha(alpha) {
    if (this.gameObject && this.gameObject.setAlpha) {
      this.gameObject.setAlpha(alpha);
    }
    return this;
  }

  /**
   * Set tint color (delegates to gameObject)
   * @param {number} tint - Tint color
   * @returns {BaseEntity} This entity for chaining
   */
  setTint(tint) {
    if (this.gameObject && this.gameObject.setTint) {
      this.gameObject.setTint(tint);
    }
    return this;
  }

  /**
   * Set active state (delegates to gameObject)
   * @param {boolean} value - Active state
   * @returns {BaseEntity} This entity for chaining
   */
  setActive(value) {
    this.active = value;
    return this;
  }

  /**
   * Set visible state (delegates to gameObject)
   * @param {boolean} value - Visible state
   * @returns {BaseEntity} This entity for chaining
   */
  setVisible(value) {
    this.visible = value;
    return this;
  }
}
