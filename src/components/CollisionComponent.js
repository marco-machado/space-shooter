import Component from './Component.js';
import Logger from '../core/Logger.js';

/**
 * Collision Component
 * Manages collision detection, layers, and response behaviors
 */
class CollisionComponent extends Component {
  constructor(layer = 'default', shape = 'rectangle') {
    super();

    // Collision layer system for filtering collisions
    this.layer = layer;
    this.collidesWithLayers = new Set(['default']);

    // Shape and bounds
    this.shape = shape; // 'rectangle', 'circle'
    this.width = 32;
    this.height = 32;
    this.radius = 16;
    this.offsetX = 0; // Offset from entity center
    this.offsetY = 0;

    // Collision state
    this.isColliding = false;
    this.lastCollisionTime = 0;
    this.collisionCooldown = 0; // Milliseconds between collision checks

    // Damage dealing and receiving
    this.canDealDamage = false;
    this.canReceiveDamage = false;
    this.damageAmount = 0;
    this.damageType = 'generic';

    // Collision response behaviors
    this.collisionResponse = {
      destroy: false, // Destroy this entity on collision
      bounce: false, // Bounce off collision
      push: false, // Push other entity away
      dealDamage: false, // Deal damage to other entity
      receiveDamage: false, // Receive damage from other entity
      stopMovement: false, // Stop movement on collision
      trigger: false, // Trigger event without physical response
    };

    // Physics integration
    this.usePhysicsBody = true;
    this.isSensor = false; // Phaser physics sensor (no physical collision)
    this.immovable = false; // Can't be pushed by other bodies

    Logger.debug(`CollisionComponent created: ${this.layer} layer, ${this.shape} shape`);
  }

  /**
   * Initialize collision component with specific configuration
   * @param {Object} data - Collision configuration
   */
  init(data = {}) {
    super.init(data);

    this.layer = data.layer || this.layer;
    this.shape = data.shape || this.shape;
    this.width = Math.max(1, data.width || this.width);
    this.height = Math.max(1, data.height || this.height);
    this.radius = Math.max(1, data.radius || this.radius);
    this.offsetX = data.offsetX || 0;
    this.offsetY = data.offsetY || 0;
    this.collisionCooldown = Math.max(0, data.collisionCooldown || 0);

    // Damage properties
    this.canDealDamage = data.canDealDamage || false;
    this.canReceiveDamage = data.canReceiveDamage || false;
    this.damageAmount = Math.max(0, data.damageAmount || 0);
    this.damageType = data.damageType || 'generic';

    // Physics settings
    this.usePhysicsBody = data.usePhysicsBody !== undefined ? data.usePhysicsBody : true;
    this.isSensor = data.isSensor || false;
    this.immovable = data.immovable || false;

    // Collision layers
    if (data.collidesWithLayers) {
      this.collidesWithLayers = new Set(data.collidesWithLayers);
    }

    // Collision response
    if (data.collisionResponse) {
      this.collisionResponse = { ...this.collisionResponse, ...data.collisionResponse };
    }

    // Update damage dealing/receiving based on response
    if (this.collisionResponse.dealDamage) {
      this.canDealDamage = true;
    }
    if (this.collisionResponse.receiveDamage) {
      this.canReceiveDamage = true;
    }
  }

  /**
   * Add a collision layer to collide with
   * @param {string} layer - Layer to collide with
   */
  addCollisionLayer(layer) {
    this.collidesWithLayers.add(layer);
    Logger.debug(`CollisionComponent: Added collision with layer: ${layer}`);
  }

  /**
   * Remove a collision layer
   * @param {string} layer - Layer to stop colliding with
   */
  removeCollisionLayer(layer) {
    this.collidesWithLayers.delete(layer);
    Logger.debug(`CollisionComponent: Removed collision with layer: ${layer}`);
  }

  /**
   * Check if this component should collide with another
   * @param {CollisionComponent} otherCollision - Other collision component
   * @returns {boolean} True if should collide
   */
  shouldCollideWith(otherCollision) {
    if (!otherCollision) return false;

    return this.collidesWithLayers.has(otherCollision.layer);
  }

  /**
   * Check if collision is on cooldown
   * @returns {boolean} True if can collide
   */
  canCollide() {
    if (this.collisionCooldown <= 0) return true;

    const now = Date.now();
    return now - this.lastCollisionTime >= this.collisionCooldown;
  }

  /**
   * Get collision bounds relative to entity position
   * @param {number} entityX - Entity X position
   * @param {number} entityY - Entity Y position
   * @returns {Object} Collision bounds
   */
  getBounds(entityX, entityY) {
    const centerX = entityX + this.offsetX;
    const centerY = entityY + this.offsetY;

    if (this.shape === 'circle') {
      return {
        type: 'circle',
        x: centerX,
        y: centerY,
        radius: this.radius,
      };
    } else {
      return {
        type: 'rectangle',
        x: centerX - this.width / 2,
        y: centerY - this.height / 2,
        width: this.width,
        height: this.height,
        centerX,
        centerY,
      };
    }
  }

  /**
   * Check collision between two collision components
   * @param {CollisionComponent} other - Other collision component
   * @param {Object} thisPos - This entity position {x, y}
   * @param {Object} otherPos - Other entity position {x, y}
   * @returns {boolean} True if colliding
   */
  static checkCollision(comp1, comp2, pos1, pos2) {
    const bounds1 = comp1.getBounds(pos1.x, pos1.y);
    const bounds2 = comp2.getBounds(pos2.x, pos2.y);

    // Circle vs Circle
    if (bounds1.type === 'circle' && bounds2.type === 'circle') {
      const dx = bounds1.x - bounds2.x;
      const dy = bounds1.y - bounds2.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < bounds1.radius + bounds2.radius;
    }

    // Rectangle vs Rectangle
    if (bounds1.type === 'rectangle' && bounds2.type === 'rectangle') {
      return !(
        bounds1.x + bounds1.width < bounds2.x ||
        bounds2.x + bounds2.width < bounds1.x ||
        bounds1.y + bounds1.height < bounds2.y ||
        bounds2.y + bounds2.height < bounds1.y
      );
    }

    // Circle vs Rectangle (or vice versa)
    let circle, rect;
    if (bounds1.type === 'circle') {
      circle = bounds1;
      rect = bounds2;
    } else {
      circle = bounds2;
      rect = bounds1;
    }

    // Find closest point on rectangle to circle center
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

    // Calculate distance from circle center to closest point
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < circle.radius;
  }

  /**
   * Handle collision with another entity
   * @param {Entity} otherEntity - Entity that was collided with
   * @param {CollisionComponent} otherCollision - Other collision component
   * @returns {Object} Collision result information
   */
  handleCollision(otherEntity, otherCollision) {
    if (!this.canCollide()) {
      return { handled: false, reason: 'cooldown' };
    }

    this.isColliding = true;
    this.lastCollisionTime = Date.now();

    const collisionResult = {
      handled: true,
      destroyed: false,
      damageDealt: 0,
      damageReceived: 0,
      effects: [],
    };

    Logger.debug(
      `CollisionComponent: Handling collision between ${this.layer} and ${otherCollision.layer}`
    );

    // Deal damage to other entity
    if (this.collisionResponse.dealDamage && this.canDealDamage && otherEntity.getComponent) {
      const otherHealth = otherEntity.getComponent('HealthComponent');
      if (otherHealth && otherCollision.canReceiveDamage) {
        const damageDealt = otherHealth.takeDamage(this.damageAmount, this.damageType);
        collisionResult.damageDealt = damageDealt;
        collisionResult.effects.push('damageDealt');
        Logger.debug(`CollisionComponent: Dealt ${damageDealt} ${this.damageType} damage`);
      }
    }

    // Receive damage from other entity
    if (this.collisionResponse.receiveDamage && this.canReceiveDamage && this.entity.getComponent) {
      const myHealth = this.entity.getComponent('HealthComponent');
      if (myHealth && otherCollision.canDealDamage) {
        const damageReceived = myHealth.takeDamage(
          otherCollision.damageAmount,
          otherCollision.damageType
        );
        collisionResult.damageReceived = damageReceived;
        collisionResult.effects.push('damageReceived');
        Logger.debug(
          `CollisionComponent: Received ${damageReceived} ${otherCollision.damageType} damage`
        );
      }
    }

    // Destroy this entity
    if (this.collisionResponse.destroy) {
      collisionResult.destroyed = true;
      collisionResult.effects.push('destroyed');

      // Schedule destruction to avoid physics update conflicts
      if (this.entity.scene) {
        this.entity.scene.time.delayedCall(10, () => {
          if (this.entity && this.entity.destroy) {
            this.entity.destroy();
          }
        });
      }
    }

    // Stop movement
    if (this.collisionResponse.stopMovement && this.entity.getComponent) {
      const movement = this.entity.getComponent('MovementComponent');
      if (movement) {
        movement.stop();
        collisionResult.effects.push('stoppedMovement');
      }
    }

    // Bounce off collision (reverse velocity)
    if (this.collisionResponse.bounce && this.entity.getComponent) {
      const movement = this.entity.getComponent('MovementComponent');
      if (movement) {
        movement.velocityX *= -0.8; // Reduce velocity on bounce
        movement.velocityY *= -0.8;
        collisionResult.effects.push('bounced');
      }
    }

    // Trigger event
    if (this.collisionResponse.trigger && this.entity.emit) {
      this.entity.emit('collisionTrigger', {
        otherEntity,
        otherLayer: otherCollision.layer,
        collisionResult,
      });
      collisionResult.effects.push('triggered');
    }

    // Emit collision event if entity supports it
    if (this.entity && this.entity.emit) {
      this.entity.emit('collision', {
        otherEntity,
        otherLayer: otherCollision.layer,
        result: collisionResult,
      });
    }

    return collisionResult;
  }

  /**
   * Update collision component
   * @param {number} delta - Time delta in milliseconds
   */
  update(_delta) {
    // Reset collision state if not actively colliding
    if (this.isColliding) {
      this.isColliding = false; // Will be set true again if still colliding
    }
  }

  /**
   * Create collision configuration for common entity types
   */
  static createPlayerConfig() {
    return {
      layer: 'player',
      collidesWithLayers: ['enemy', 'enemyProjectile', 'powerup', 'obstacle'],
      canReceiveDamage: true,
      collisionResponse: {
        receiveDamage: true,
        trigger: true,
      },
      shape: 'rectangle',
      width: 48, // Slightly smaller than visual for better gameplay
      height: 48,
    };
  }

  static createEnemyConfig(enemyType = 'scout') {
    const configs = {
      scout: { width: 28, height: 28 },
      fighter: { width: 40, height: 40 },
      bomber: { width: 56, height: 56 },
    };

    const config = configs[enemyType] || configs.scout;

    return {
      layer: 'enemy',
      collidesWithLayers: ['player', 'playerProjectile'],
      canReceiveDamage: true,
      canDealDamage: true,
      damageAmount: 20,
      collisionResponse: {
        receiveDamage: true,
        dealDamage: true,
      },
      shape: 'rectangle',
      width: config.width,
      height: config.height,
    };
  }

  static createProjectileConfig(isPlayerProjectile = true) {
    return {
      layer: isPlayerProjectile ? 'playerProjectile' : 'enemyProjectile',
      collidesWithLayers: isPlayerProjectile ? ['enemy', 'obstacle'] : ['player', 'obstacle'],
      canDealDamage: true,
      damageAmount: 25, // Will be overridden by weapon
      collisionResponse: {
        dealDamage: true,
        destroy: true,
      },
      shape: 'rectangle',
      width: 8,
      height: 16,
      collisionCooldown: 0, // Projectiles can collide immediately
    };
  }

  static createPowerUpConfig() {
    return {
      layer: 'powerup',
      collidesWithLayers: ['player'],
      collisionResponse: {
        destroy: true,
        trigger: true,
      },
      shape: 'circle',
      radius: 16,
      isSensor: true, // No physical collision, just detection
    };
  }

  /**
   * Serialize collision component data
   * @returns {Object} Serializable data
   */
  serialize() {
    return {
      ...super.serialize(),
      layer: this.layer,
      collidesWithLayers: Array.from(this.collidesWithLayers),
      shape: this.shape,
      width: this.width,
      height: this.height,
      radius: this.radius,
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      collisionCooldown: this.collisionCooldown,
      canDealDamage: this.canDealDamage,
      canReceiveDamage: this.canReceiveDamage,
      damageAmount: this.damageAmount,
      damageType: this.damageType,
      collisionResponse: this.collisionResponse,
      usePhysicsBody: this.usePhysicsBody,
      isSensor: this.isSensor,
      immovable: this.immovable,
    };
  }

  /**
   * Deserialize collision component data
   * @param {Object} data - Saved data
   */
  deserialize(data) {
    super.deserialize(data);
    this.init(data);
  }

  /**
   * Validate collision component data
   * @returns {boolean} True if valid
   */
  validate() {
    return (
      this.layer &&
      this.layer.length > 0 &&
      this.collidesWithLayers.size >= 0 &&
      ['rectangle', 'circle'].includes(this.shape) &&
      this.width > 0 &&
      this.height > 0 &&
      this.radius > 0 &&
      this.collisionCooldown >= 0 &&
      this.damageAmount >= 0
    );
  }
}

export default CollisionComponent;
