import BaseComponent from './BaseComponent.js';
import Logger from '@/utils/Logger.js';

/**
 * Movement Component
 * Pure data container for entity movement, velocity, acceleration, and constraints
 * All movement logic is handled by MovementSystem
 */
export default class MovementComponent extends BaseComponent {
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

    Logger.scope('MovementComponent').debug(`[MovementComponent] created: max speed ${this.maxSpeed}`);
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
      boundaryBehavior: 'offscreen-deactivate',
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
      boundaryBehavior: 'offscreen-deactivate',
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
      boundaryBehavior: 'offscreen-deactivate',
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
   * Set velocity directly (data-only setter)
   * @param {number} x - X velocity
   * @param {number} y - Y velocity
   */
  setVelocity(x, y) {
    this.velocityX = x;
    this.velocityY = y;
  }

  /**
   * Add to current velocity (data-only setter)
   * @param {number} deltaX - X velocity change
   * @param {number} deltaY - Y velocity change
   */
  addVelocity(deltaX, deltaY) {
    this.velocityX += deltaX;
    this.velocityY += deltaY;
  }

  /**
   * Set acceleration (data-only setter)
   * @param {number} x - X acceleration
   * @param {number} y - Y acceleration
   */
  setAcceleration(x, y) {
    this.accelerationX = x;
    this.accelerationY = y;
  }

  /**
   * Apply force (adds to acceleration) (data-only setter)
   * @param {number} forceX - X force
   * @param {number} forceY - Y force
   */
  applyForce(forceX, forceY) {
    this.accelerationX += forceX;
    this.accelerationY += forceY;
  }

  /**
   * Move in a specific direction with given speed (data-only setter)
   * @param {number} angle - Angle in radians
   * @param {number} speed - Movement speed
   */
  moveInDirection(angle, speed) {
    this.velocityX = Math.cos(angle) * speed;
    this.velocityY = Math.sin(angle) * speed;
  }

  /**
   * Stop movement (data-only setter)
   */
  stop() {
    this.velocityX = 0;
    this.velocityY = 0;
    this.accelerationX = 0;
    this.accelerationY = 0;
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
   * Set AI movement pattern (data-only setter)
   * @param {string} pattern - AI pattern type
   * @param {Object} patternData - Pattern-specific configuration
   * @param {BaseEntity} target - Target entity (for chase pattern)
   */
  setAIPattern(pattern, patternData = {}, target = null) {
    this.aiPattern = pattern;
    this.aiPatternData = patternData;
    this.aiTarget = target;
    this.initializeAIPattern();
    Logger.scope('MovementComponent').debug(`MovementComponent: Set AI pattern to ${pattern}`);
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
      ['clamp', 'wrap', 'bounce', 'destroy', 'offscreen-deactivate'].includes(this.boundaryBehavior)
    );
  }
}