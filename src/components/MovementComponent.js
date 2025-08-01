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
    this.boundaryBehavior = 'clamp'; // 'clamp', 'wrap', 'bounce', 'destroy'

    // Movement state
    this.isMoving = false;
    this.lastDirection = { x: 0, y: 0 };

    // AI Movement patterns
    this.aiPattern = 'none'; // 'none', 'straight', 'curve', 'formation', 'chase', 'circle', 'zigzag'
    this.aiTarget = null; // Target entity for chase pattern
    this.aiPatternData = {}; // Pattern-specific data

    // AI timing and state
    this.aiUpdateTimer = 0;
    this.aiUpdateInterval = 100; // Update AI every 100ms
    this.patternStartTime = Date.now();
    this.patternPhase = 0;

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
    this.boundaryBehavior = data.boundaryBehavior || 'clamp';

    // AI pattern initialization
    this.aiPattern = data.aiPattern || 'none';
    this.aiTarget = data.aiTarget || null;
    this.aiUpdateInterval = Math.max(50, data.aiUpdateInterval || 100);
    this.aiPatternData = data.aiPatternData || {};

    // Initialize pattern-specific data
    this.initializeAIPattern();
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
   * Initialize AI pattern-specific data
   */
  initializeAIPattern() {
    this.patternStartTime = Date.now();
    this.patternPhase = 0;

    switch (this.aiPattern) {
      case 'straight':
        this.aiPatternData = {
          direction: this.aiPatternData.direction || 0, // Angle in radians
          speed: this.aiPatternData.speed || this.maxSpeed * 0.5,
          ...this.aiPatternData,
        };
        break;

      case 'curve':
        this.aiPatternData = {
          amplitude: this.aiPatternData.amplitude || 100, // Curve amplitude
          frequency: this.aiPatternData.frequency || 2, // Oscillations per second
          baseDirection: this.aiPatternData.baseDirection || Math.PI / 2, // Downward
          speed: this.aiPatternData.speed || this.maxSpeed * 0.6,
          ...this.aiPatternData,
        };
        break;

      case 'circle':
        this.aiPatternData = {
          centerX: this.aiPatternData.centerX || (this.entity ? this.entity.x : 0),
          centerY: this.aiPatternData.centerY || (this.entity ? this.entity.y : 0),
          radius: this.aiPatternData.radius || 80,
          angularSpeed: this.aiPatternData.angularSpeed || 2, // Radians per second
          clockwise:
            this.aiPatternData.clockwise !== undefined ? this.aiPatternData.clockwise : true,
          ...this.aiPatternData,
        };
        break;

      case 'zigzag':
        this.aiPatternData = {
          amplitude: this.aiPatternData.amplitude || 60,
          frequency: this.aiPatternData.frequency || 3,
          baseDirection: this.aiPatternData.baseDirection || Math.PI / 2,
          speed: this.aiPatternData.speed || this.maxSpeed * 0.7,
          ...this.aiPatternData,
        };
        break;

      case 'formation':
        this.aiPatternData = {
          formationLeader: this.aiPatternData.formationLeader || null,
          offsetX: this.aiPatternData.offsetX || 0,
          offsetY: this.aiPatternData.offsetY || 0,
          followDistance: this.aiPatternData.followDistance || 60,
          speed: this.aiPatternData.speed || this.maxSpeed * 0.8,
          ...this.aiPatternData,
        };
        break;

      case 'chase':
        this.aiPatternData = {
          chaseSpeed: this.aiPatternData.chaseSpeed || this.maxSpeed * 0.9,
          keepDistance: this.aiPatternData.keepDistance || 0, // Minimum distance to maintain
          prediction: this.aiPatternData.prediction || 0.5, // Predict target movement
          ...this.aiPatternData,
        };
        break;
    }
  }

  /**
   * Set AI movement pattern
   * @param {string} pattern - AI pattern type
   * @param {Object} patternData - Pattern-specific configuration
   * @param {Entity} target - Target entity (for chase pattern)
   */
  setAIPattern(pattern, patternData = {}, target = null) {
    this.aiPattern = pattern;
    this.aiPatternData = patternData;
    this.aiTarget = target;
    this.initializeAIPattern();
    Logger.debug(`MovementComponent: Set AI pattern to ${pattern}`);
  }

  /**
   * Update AI movement based on current pattern
   * @param {number} delta - Time delta in seconds
   */
  updateAIMovement(delta) {
    if (this.aiPattern === 'none' || !this.entity) return;

    this.aiUpdateTimer += delta * 1000; // Convert to milliseconds
    if (this.aiUpdateTimer < this.aiUpdateInterval) return;

    this.aiUpdateTimer = 0;
    const elapsed = (Date.now() - this.patternStartTime) / 1000; // Seconds since pattern start

    switch (this.aiPattern) {
      case 'straight':
        this.updateStraightMovement();
        break;

      case 'curve':
        this.updateCurveMovement(elapsed);
        break;

      case 'circle':
        this.updateCircleMovement(elapsed);
        break;

      case 'zigzag':
        this.updateZigzagMovement(elapsed);
        break;

      case 'formation':
        this.updateFormationMovement();
        break;

      case 'chase':
        this.updateChaseMovement();
        break;
    }
  }

  updateStraightMovement() {
    const data = this.aiPatternData;
    this.velocityX = Math.cos(data.direction) * data.speed;
    this.velocityY = Math.sin(data.direction) * data.speed;
  }

  updateCurveMovement(elapsed) {
    const data = this.aiPatternData;
    const oscillation = Math.sin(elapsed * data.frequency * Math.PI * 2) * data.amplitude;

    // Base movement direction
    const baseVelX = Math.cos(data.baseDirection) * data.speed;
    const baseVelY = Math.sin(data.baseDirection) * data.speed;

    // Perpendicular oscillation
    const perpX = -Math.sin(data.baseDirection);
    const perpY = Math.cos(data.baseDirection);

    this.velocityX = baseVelX + perpX * oscillation * 0.01; // Scale oscillation to velocity
    this.velocityY = baseVelY + perpY * oscillation * 0.01;
  }

  updateCircleMovement(elapsed) {
    const data = this.aiPatternData;
    const angle = elapsed * data.angularSpeed * (data.clockwise ? 1 : -1);

    const targetX = data.centerX + Math.cos(angle) * data.radius;
    const targetY = data.centerY + Math.sin(angle) * data.radius;

    // Move towards the target position on the circle
    this.moveTowards(targetX, targetY, this.maxSpeed * 0.8);
  }

  updateZigzagMovement(elapsed) {
    const data = this.aiPatternData;
    const zigzag = Math.sin(elapsed * data.frequency * Math.PI * 2) * data.amplitude;

    // Base movement
    const baseVelX = Math.cos(data.baseDirection) * data.speed;
    const baseVelY = Math.sin(data.baseDirection) * data.speed;

    // Add zigzag perpendicular to base direction
    const perpX = -Math.sin(data.baseDirection);
    const perpY = Math.cos(data.baseDirection);

    this.velocityX = baseVelX + perpX * zigzag * 0.02;
    this.velocityY = baseVelY + perpY * zigzag * 0.02;
  }

  updateFormationMovement() {
    const data = this.aiPatternData;
    if (!data.formationLeader || !data.formationLeader.x) return;

    const targetX = data.formationLeader.x + data.offsetX;
    const targetY = data.formationLeader.y + data.offsetY;

    const distance = Math.sqrt(
      Math.pow(targetX - this.entity.x, 2) + Math.pow(targetY - this.entity.y, 2)
    );

    if (distance > data.followDistance) {
      this.moveTowards(targetX, targetY, data.speed);
    } else {
      // Slow down when close to formation position
      this.velocityX *= 0.5;
      this.velocityY *= 0.5;
    }
  }

  updateChaseMovement() {
    const data = this.aiPatternData;
    if (!this.aiTarget || !this.aiTarget.x) return;

    let targetX = this.aiTarget.x;
    let targetY = this.aiTarget.y;

    // Predict target movement
    if (data.prediction > 0 && this.aiTarget.getComponent) {
      const targetMovement = this.aiTarget.getComponent('MovementComponent');
      if (targetMovement) {
        targetX += targetMovement.velocityX * data.prediction;
        targetY += targetMovement.velocityY * data.prediction;
      }
    }

    const distance = Math.sqrt(
      Math.pow(targetX - this.entity.x, 2) + Math.pow(targetY - this.entity.y, 2)
    );

    // Only chase if outside minimum distance
    if (distance > data.keepDistance) {
      this.moveTowards(targetX, targetY, data.chaseSpeed);
    } else {
      // Stop or move away if too close
      this.velocityX *= 0.3;
      this.velocityY *= 0.3;
    }
  }

  /**
   * Update movement component
   * @param {number} delta - Time delta in seconds
   */
  update(delta) {
    if (!this.entity) return;

    // Update AI movement patterns first
    this.updateAIMovement(delta);

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
   * Apply screen boundary constraints based on boundary behavior
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

    let shouldDestroy = false;

    // Handle X bounds
    if (this.entity.x < minX) {
      switch (this.boundaryBehavior) {
        case 'clamp':
          this.entity.x = minX;
          this.velocityX = Math.max(0, this.velocityX);
          break;
        case 'wrap':
          this.entity.x = maxX;
          break;
        case 'bounce':
          this.entity.x = minX;
          this.velocityX = Math.abs(this.velocityX) * 0.8; // Reduce velocity on bounce
          break;
        case 'destroy':
          shouldDestroy = true;
          break;
      }
    } else if (this.entity.x > maxX) {
      switch (this.boundaryBehavior) {
        case 'clamp':
          this.entity.x = maxX;
          this.velocityX = Math.min(0, this.velocityX);
          break;
        case 'wrap':
          this.entity.x = minX;
          break;
        case 'bounce':
          this.entity.x = maxX;
          this.velocityX = -Math.abs(this.velocityX) * 0.8;
          break;
        case 'destroy':
          shouldDestroy = true;
          break;
      }
    }

    // Handle Y bounds
    if (this.entity.y < minY) {
      switch (this.boundaryBehavior) {
        case 'clamp':
          this.entity.y = minY;
          this.velocityY = Math.max(0, this.velocityY);
          break;
        case 'wrap':
          this.entity.y = maxY;
          break;
        case 'bounce':
          this.entity.y = minY;
          this.velocityY = Math.abs(this.velocityY) * 0.8;
          break;
        case 'destroy':
          shouldDestroy = true;
          break;
      }
    } else if (this.entity.y > maxY) {
      switch (this.boundaryBehavior) {
        case 'clamp':
          this.entity.y = maxY;
          this.velocityY = Math.min(0, this.velocityY);
          break;
        case 'wrap':
          this.entity.y = minY;
          break;
        case 'bounce':
          this.entity.y = maxY;
          this.velocityY = -Math.abs(this.velocityY) * 0.8;
          break;
        case 'destroy':
          shouldDestroy = true;
          break;
      }
    }

    // Handle entity destruction
    if (shouldDestroy) {
      Logger.debug('MovementComponent: Entity destroyed by boundary behavior');
      // Schedule destruction to avoid physics update conflicts
      if (this.entity.scene) {
        this.entity.scene.time.delayedCall(10, () => {
          if (this.entity && this.entity.destroy) {
            this.entity.destroy();
          }
        });
      }
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
      boundaryBehavior: this.boundaryBehavior,
      aiPattern: this.aiPattern,
      aiPatternData: this.aiPatternData,
      aiUpdateInterval: this.aiUpdateInterval,
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
      this.screenPadding >= 0 &&
      ['none', 'straight', 'curve', 'formation', 'chase', 'circle', 'zigzag'].includes(
        this.aiPattern
      ) &&
      ['clamp', 'wrap', 'bounce', 'destroy'].includes(this.boundaryBehavior)
    );
  }

  /**
   * Static helper methods for creating common AI patterns
   */
  static createScoutPattern() {
    return {
      aiPattern: 'straight',
      aiPatternData: {
        direction: Math.PI / 2, // Downward
        speed: 150,
      },
      boundaryBehavior: 'destroy',
      maxSpeed: 180,
    };
  }

  static createFighterPattern() {
    return {
      aiPattern: 'zigzag',
      aiPatternData: {
        amplitude: 40,
        frequency: 2,
        baseDirection: Math.PI / 2,
        speed: 120,
      },
      boundaryBehavior: 'destroy',
      maxSpeed: 150,
    };
  }

  static createBomberPattern() {
    return {
      aiPattern: 'curve',
      aiPatternData: {
        amplitude: 80,
        frequency: 1,
        baseDirection: Math.PI / 2,
        speed: 80,
      },
      boundaryBehavior: 'destroy',
      maxSpeed: 100,
    };
  }

  static createChasePattern(target) {
    return {
      aiPattern: 'chase',
      aiPatternData: {
        chaseSpeed: 140,
        keepDistance: 50,
        prediction: 0.3,
      },
      aiTarget: target,
      boundaryBehavior: 'bounce',
      maxSpeed: 160,
    };
  }
}

export default MovementComponent;
