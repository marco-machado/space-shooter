import Component from './Component.js';
import Logger from '../core/Logger.js';

/**
 * Movement Component
 * Manages entity movement, velocity, acceleration, and constraints
 */
class MovementComponent extends Component {
  constructor(maxSpeed = 200) {
    super();

    // Velocity
    this.velocityX = 0;
    this.velocityY = 0;
    this.maxSpeed = maxSpeed;

    // Acceleration
    this.accelerationX = 0;
    this.accelerationY = 0;

    // Drag/friction
    this.drag = 0; // Applied when no acceleration
    this.friction = 1; // Multiplier applied each frame (0-1)

    // Movement constraints
    this.boundToScreen = true;
    this.screenPadding = 0;

    // Movement state
    this.isMoving = false;
    this.lastDirection = { x: 0, y: 0 };

    Logger.debug(`MovementComponent created: max speed ${this.maxSpeed}`);
  }

  /**
   * Initialize movement component with specific values
   * @param {Object} data - Movement configuration
   */
  init(data = {}) {
    super.init(data);

    this.maxSpeed = Math.max(0, data.maxSpeed || this.maxSpeed);
    this.velocityX = data.velocityX || 0;
    this.velocityY = data.velocityY || 0;
    this.accelerationX = data.accelerationX || 0;
    this.accelerationY = data.accelerationY || 0;
    this.drag = Math.max(0, data.drag || 0);
    this.friction = Math.max(0, Math.min(1, data.friction !== undefined ? data.friction : 1));
    this.boundToScreen = data.boundToScreen !== undefined ? data.boundToScreen : true;
    this.screenPadding = Math.max(0, data.screenPadding || 0);
  }

  /**
   * Set velocity directly
   * @param {number} x - X velocity
   * @param {number} y - Y velocity
   */
  setVelocity(x, y) {
    this.velocityX = x;
    this.velocityY = y;
    this.clampVelocity();
    this.updateMovingState();
  }

  /**
   * Add to current velocity
   * @param {number} deltaX - X velocity change
   * @param {number} deltaY - Y velocity change
   */
  addVelocity(deltaX, deltaY) {
    this.velocityX += deltaX;
    this.velocityY += deltaY;
    this.clampVelocity();
    this.updateMovingState();
  }

  /**
   * Set acceleration
   * @param {number} x - X acceleration
   * @param {number} y - Y acceleration
   */
  setAcceleration(x, y) {
    this.accelerationX = x;
    this.accelerationY = y;
  }

  /**
   * Apply force (adds to acceleration)
   * @param {number} forceX - X force
   * @param {number} forceY - Y force
   */
  applyForce(forceX, forceY) {
    this.accelerationX += forceX;
    this.accelerationY += forceY;
  }

  /**
   * Move in a specific direction with given speed
   * @param {number} angle - Angle in radians
   * @param {number} speed - Movement speed
   */
  moveInDirection(angle, speed) {
    this.velocityX = Math.cos(angle) * speed;
    this.velocityY = Math.sin(angle) * speed;
    this.clampVelocity();
    this.updateMovingState();
  }

  /**
   * Move towards a target position
   * @param {number} targetX - Target X coordinate
   * @param {number} targetY - Target Y coordinate
   * @param {number} speed - Movement speed
   */
  moveTowards(targetX, targetY, speed) {
    if (!this.entity) return;

    const deltaX = targetX - this.entity.x;
    const deltaY = targetY - this.entity.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > 0) {
      this.velocityX = (deltaX / distance) * speed;
      this.velocityY = (deltaY / distance) * speed;
      this.clampVelocity();
      this.updateMovingState();
    }
  }

  /**
   * Stop movement
   */
  stop() {
    this.velocityX = 0;
    this.velocityY = 0;
    this.accelerationX = 0;
    this.accelerationY = 0;
    this.updateMovingState();
  }

  /**
   * Update movement component
   * @param {number} delta - Time delta in seconds
   */
  update(delta) {
    if (!this.entity) return;

    // Apply acceleration to velocity
    this.velocityX += this.accelerationX * delta;
    this.velocityY += this.accelerationY * delta;

    // Apply drag when no acceleration
    if (this.drag > 0 && this.accelerationX === 0 && this.accelerationY === 0) {
      const dragForceX = -this.velocityX * this.drag * delta;
      const dragForceY = -this.velocityY * this.drag * delta;
      this.velocityX += dragForceX;
      this.velocityY += dragForceY;
    }

    // Apply friction
    if (this.friction < 1) {
      const frictionMultiplier = Math.pow(this.friction, delta * 60); // Frame-rate independent
      this.velocityX *= frictionMultiplier;
      this.velocityY *= frictionMultiplier;
    }

    // Clamp velocity to max speed
    this.clampVelocity();

    // Update entity position
    this.entity.x += this.velocityX * delta;
    this.entity.y += this.velocityY * delta;

    // Apply screen bounds
    if (this.boundToScreen) {
      this.applyScreenBounds();
    }

    // Update movement state
    this.updateMovingState();

    // Reset acceleration (forces need to be applied each frame)
    this.accelerationX = 0;
    this.accelerationY = 0;
  }

  /**
   * Clamp velocity to maximum speed
   */
  clampVelocity() {
    if (this.maxSpeed <= 0) return;

    const currentSpeed = Math.sqrt(
      this.velocityX * this.velocityX + this.velocityY * this.velocityY
    );
    if (currentSpeed > this.maxSpeed) {
      const scale = this.maxSpeed / currentSpeed;
      this.velocityX *= scale;
      this.velocityY *= scale;
    }
  }

  /**
   * Apply screen boundary constraints
   */
  applyScreenBounds() {
    if (!this.entity || !this.entity.scene) return;

    const { width, height } = this.entity.scene.scale;
    const entityWidth = this.entity.width || 0;
    const entityHeight = this.entity.height || 0;

    const minX = this.screenPadding + entityWidth / 2;
    const maxX = width - this.screenPadding - entityWidth / 2;
    const minY = this.screenPadding + entityHeight / 2;
    const maxY = height - this.screenPadding - entityHeight / 2;

    // Clamp position and stop velocity if hitting bounds
    if (this.entity.x < minX) {
      this.entity.x = minX;
      this.velocityX = Math.max(0, this.velocityX);
    } else if (this.entity.x > maxX) {
      this.entity.x = maxX;
      this.velocityX = Math.min(0, this.velocityX);
    }

    if (this.entity.y < minY) {
      this.entity.y = minY;
      this.velocityY = Math.max(0, this.velocityY);
    } else if (this.entity.y > maxY) {
      this.entity.y = maxY;
      this.velocityY = Math.min(0, this.velocityY);
    }
  }

  /**
   * Update movement state and direction tracking
   */
  updateMovingState() {
    const wasMoving = this.isMoving;
    this.isMoving = Math.abs(this.velocityX) > 0.01 || Math.abs(this.velocityY) > 0.01;

    // Update last direction
    if (this.isMoving) {
      this.lastDirection.x = this.velocityX;
      this.lastDirection.y = this.velocityY;
    }

    // Emit movement events if entity supports it
    if (this.entity && this.entity.emit) {
      if (!wasMoving && this.isMoving) {
        this.entity.emit('moveStart', { velocity: { x: this.velocityX, y: this.velocityY } });
      } else if (wasMoving && !this.isMoving) {
        this.entity.emit('moveStop', { lastDirection: this.lastDirection });
      }
    }
  }

  /**
   * Get current speed
   * @returns {number} Current speed
   */
  getCurrentSpeed() {
    return Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
  }

  /**
   * Get movement direction as angle
   * @returns {number} Angle in radians
   */
  getDirection() {
    return Math.atan2(this.velocityY, this.velocityX);
  }

  /**
   * Serialize movement component data
   * @returns {Object} Serializable data
   */
  serialize() {
    return {
      ...super.serialize(),
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      maxSpeed: this.maxSpeed,
      drag: this.drag,
      friction: this.friction,
      boundToScreen: this.boundToScreen,
      screenPadding: this.screenPadding,
    };
  }

  /**
   * Deserialize movement component data
   * @param {Object} data - Saved data
   */
  deserialize(data) {
    super.deserialize(data);
    this.init(data);
  }

  /**
   * Validate movement component data
   * @returns {boolean} True if valid
   */
  validate() {
    return (
      this.maxSpeed >= 0 &&
      this.drag >= 0 &&
      this.friction >= 0 &&
      this.friction <= 1 &&
      this.screenPadding >= 0
    );
  }
}

export default MovementComponent;
