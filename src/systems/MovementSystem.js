import BaseSystem from './BaseSystem.js';
import MovementComponent from '@/components/MovementComponent.js';
import Logger from '@/utils/Logger.js';
import { getEventBus } from '@/event-bus/EventBus.js';
import { EventPriority, EventTypes } from '@/event-bus/EventTypes.js';

/**
 * Movement System
 * Handles all entity movement, velocity, acceleration, and AI patterns
 * Processes entities with MovementComponent to update their position and movement state
 * Listens to EventBus for player input events
 */
export default class MovementSystem extends BaseSystem {
  constructor(scene) {
    super();
    this.scene = scene;
    this.priority = 10; // Run early in system update order

    // EventBus integration
    this.eventBus = getEventBus();
    this.inputListenerId = null;

    // Player input tracking
    this.playerInputState = {
      movement: { x: 0, y: 0 },
      weaponFiring: false,
    };

    Logger.debug(`[MovementSystem] Movement system created with EventBus integration`);
  }

  /**
   * Initialize movement system
   * @param {Object} config - System configuration
   */
  init(config = {}) {
    super.init(config);

    // Subscribe to player input events with HIGH priority
    this.inputListenerId = this.eventBus.on(
      EventTypes.PLAYER_INPUT,
      this.handlePlayerInput.bind(this),
      this,
      EventPriority.HIGH
    );

    Logger.debug(
      `[MovementSystem] Movement system initialized with input listener: ${this.inputListenerId}`
    );
  }

  /**
   * Update all entities with movement components
   * @param {Array<BaseEntity>} entities - Array of entities to process
   * @param {number} delta - Time delta in milliseconds
   */
  update(entities, delta) {
    const movingEntities = this.getEntitiesWithComponents(entities, [MovementComponent]);
    const deltaSeconds = delta / 1000; // Convert to seconds for calculations

    movingEntities.forEach(entity => {
      this.updateEntityMovement(entity, deltaSeconds);
    });
  }

  /**
   * Handle player input events from EventBus
   * @param {Object} inputData - Player input event data
   */
  handlePlayerInput(inputData) {
    const { action, direction, state } = inputData;

    switch (action) {
      case 'movement':
        this.playerInputState.movement = direction || { x: 0, y: 0 };
        Logger.debug(
          `[MovementSystem] Player movement input: x=${direction.x.toFixed(2)}, y=${direction.y.toFixed(2)}`
        );
        break;

      case 'weapon_fire':
        this.playerInputState.weaponFiring = state === 'start';
        Logger.debug(`[MovementSystem] Player weapon input: ${state}`);
        break;

      default:
        Logger.debug(`[MovementSystem] Unknown player input action: ${action}`);
    }
  }

  /**
   * Update movement for a single entity
   * @param {BaseEntity} entity - Entity to update
   * @param {number} delta - Time delta in seconds
   */
  updateEntityMovement(entity, delta) {
    const movement = entity.getComponent(MovementComponent);
    if (!movement || !entity.active) return;

    // Handle player input if this is a player entity
    if (entity.entityType === 'player') {
      this.applyPlayerInput(entity, movement);
    } else {
      // Update AI movement patterns for non-player entities
      this.updateAIMovement(entity, movement, delta);
    }

    // Apply acceleration to velocity
    movement.velocityX += movement.accelerationX * delta;
    movement.velocityY += movement.accelerationY * delta;

    // Apply drag when no acceleration
    if (movement.drag > 0 && movement.accelerationX === 0 && movement.accelerationY === 0) {
      const dragForceX = -movement.velocityX * movement.drag * delta;
      const dragForceY = -movement.velocityY * movement.drag * delta;
      movement.velocityX += dragForceX;
      movement.velocityY += dragForceY;
    }

    // Apply friction
    if (movement.friction < 1) {
      const frictionMultiplier = Math.pow(movement.friction, delta * 60); // Frame-rate independent
      movement.velocityX *= frictionMultiplier;
      movement.velocityY *= frictionMultiplier;
    }

    // Clamp velocity to max speed
    this.clampVelocity(movement);

    // Update entity position
    entity.x += movement.velocityX * delta;
    entity.y += movement.velocityY * delta;

    // Apply screen bounds
    if (movement.boundToScreen) {
      this.applyScreenBounds(entity, movement);
    }

    // Update movement state
    this.updateMovingState(entity, movement);

    // Reset acceleration (forces need to be applied each frame)
    movement.accelerationX = 0;
    movement.accelerationY = 0;
  }

  /**
   * Apply player input to entity movement
   * @param {BaseEntity} entity - Player entity to update
   * @param {MovementComponent} movement - Movement component
   */
  applyPlayerInput(entity, movement) {
    const input = this.playerInputState.movement;

    // Set velocity based on player input and max speed
    const targetVelocityX = input.x * movement.maxSpeed;
    const targetVelocityY = input.y * movement.maxSpeed;

    // Apply input velocity directly for responsive controls
    movement.setVelocity(targetVelocityX, targetVelocityY);

    // Log player movement (only when there's actual movement to reduce log spam)
    if (Math.abs(input.x) > 0.01 || Math.abs(input.y) > 0.01) {
      Logger.debug(
        `[MovementSystem] Applied player input to entity: vx=${targetVelocityX.toFixed(1)}, vy=${targetVelocityY.toFixed(1)}`
      );
    }
  }

  /**
   * Update AI movement based on current pattern
   * @param {BaseEntity} entity - Entity to update
   * @param {MovementComponent} movement - Movement component
   * @param {number} delta - Time delta in seconds
   */
  updateAIMovement(entity, movement, delta) {
    if (movement.aiPattern === 'none') return;

    movement.aiUpdateTimer += delta * 1000; // Convert to milliseconds
    if (movement.aiUpdateTimer < movement.aiUpdateInterval) return;

    movement.aiUpdateTimer = 0;
    const elapsed = (Date.now() - movement.patternStartTime) / 1000; // Seconds since pattern start

    switch (movement.aiPattern) {
      case 'straight':
        this.updateStraightMovement(entity, movement);
        break;

      case 'curve':
        this.updateCurveMovement(entity, movement, elapsed);
        break;

      case 'circle':
        this.updateCircleMovement(entity, movement, elapsed);
        break;

      case 'zigzag':
        this.updateZigzagMovement(entity, movement, elapsed);
        break;

      case 'formation':
        this.updateFormationMovement(entity, movement);
        break;

      case 'chase':
        this.updateChaseMovement(entity, movement);
        break;
    }
  }

  /**
   * Update straight line movement pattern
   * @param {BaseEntity} entity - Entity to update
   * @param {MovementComponent} movement - Movement component
   */
  updateStraightMovement(entity, movement) {
    const data = movement.aiPatternData;
    movement.velocityX = Math.cos(data.direction) * data.speed;
    movement.velocityY = Math.sin(data.direction) * data.speed;
  }

  /**
   * Update curve movement pattern
   * @param {BaseEntity} entity - Entity to update
   * @param {MovementComponent} movement - Movement component
   * @param {number} elapsed - Time elapsed since pattern start
   */
  updateCurveMovement(entity, movement, elapsed) {
    const data = movement.aiPatternData;
    const oscillation = Math.sin(elapsed * data.frequency * Math.PI * 2) * data.amplitude;

    // Base movement direction
    const baseVelX = Math.cos(data.baseDirection) * data.speed;
    const baseVelY = Math.sin(data.baseDirection) * data.speed;

    // Perpendicular oscillation
    const perpX = -Math.sin(data.baseDirection);
    const perpY = Math.cos(data.baseDirection);

    movement.velocityX = baseVelX + perpX * oscillation * 0.01; // Scale oscillation to velocity
    movement.velocityY = baseVelY + perpY * oscillation * 0.01;
  }

  /**
   * Update circle movement pattern
   * @param {BaseEntity} entity - Entity to update
   * @param {MovementComponent} movement - Movement component
   * @param {number} elapsed - Time elapsed since pattern start
   */
  updateCircleMovement(entity, movement, elapsed) {
    const data = movement.aiPatternData;
    const angle = elapsed * data.angularSpeed * (data.clockwise ? 1 : -1);

    const targetX = data.centerX + Math.cos(angle) * data.radius;
    const targetY = data.centerY + Math.sin(angle) * data.radius;

    // Move towards the target position on the circle
    this.moveTowards(entity, movement, targetX, targetY, movement.maxSpeed * 0.8);
  }

  /**
   * Update zigzag movement pattern
   * @param {BaseEntity} entity - Entity to update
   * @param {MovementComponent} movement - Movement component
   * @param {number} elapsed - Time elapsed since pattern start
   */
  updateZigzagMovement(entity, movement, elapsed) {
    const data = movement.aiPatternData;
    const zigzag = Math.sin(elapsed * data.frequency * Math.PI * 2) * data.amplitude;

    // Base movement
    const baseVelX = Math.cos(data.baseDirection) * data.speed;
    const baseVelY = Math.sin(data.baseDirection) * data.speed;

    // Add zigzag perpendicular to base direction
    const perpX = -Math.sin(data.baseDirection);
    const perpY = Math.cos(data.baseDirection);

    movement.velocityX = baseVelX + perpX * zigzag * 0.02;
    movement.velocityY = baseVelY + perpY * zigzag * 0.02;
  }

  /**
   * Update formation movement pattern
   * @param {BaseEntity} entity - Entity to update
   * @param {MovementComponent} movement - Movement component
   */
  updateFormationMovement(entity, movement) {
    const data = movement.aiPatternData;
    if (!data.formationLeader || !data.formationLeader.x) return;

    const targetX = data.formationLeader.x + data.offsetX;
    const targetY = data.formationLeader.y + data.offsetY;

    const distance = Math.sqrt(Math.pow(targetX - entity.x, 2) + Math.pow(targetY - entity.y, 2));

    if (distance > data.followDistance) {
      this.moveTowards(entity, movement, targetX, targetY, data.speed);
    } else {
      // Slow down when close to formation position
      movement.velocityX *= 0.5;
      movement.velocityY *= 0.5;
    }
  }

  /**
   * Update chase movement pattern
   * @param {BaseEntity} entity - Entity to update
   * @param {MovementComponent} movement - Movement component
   */
  updateChaseMovement(entity, movement) {
    const data = movement.aiPatternData;
    if (!movement.aiTarget || !movement.aiTarget.x) return;

    let targetX = movement.aiTarget.x;
    let targetY = movement.aiTarget.y;

    // Predict target movement
    if (data.prediction > 0 && movement.aiTarget.getComponent) {
      const targetMovement = movement.aiTarget.getComponent(MovementComponent);
      if (targetMovement) {
        targetX += targetMovement.velocityX * data.prediction;
        targetY += targetMovement.velocityY * data.prediction;
      }
    }

    const distance = Math.sqrt(Math.pow(targetX - entity.x, 2) + Math.pow(targetY - entity.y, 2));

    // Only chase if outside minimum distance
    if (distance > data.keepDistance) {
      this.moveTowards(entity, movement, targetX, targetY, data.chaseSpeed);
    } else {
      // Stop or move away if too close
      movement.velocityX *= 0.3;
      movement.velocityY *= 0.3;
    }
  }

  /**
   * Move entity towards a target position
   * @param {BaseEntity} entity - Entity to move
   * @param {MovementComponent} movement - Movement component
   * @param {number} targetX - Target X coordinate
   * @param {number} targetY - Target Y coordinate
   * @param {number} speed - Movement speed
   */
  moveTowards(entity, movement, targetX, targetY, speed) {
    const deltaX = targetX - entity.x;
    const deltaY = targetY - entity.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > 0) {
      movement.velocityX = (deltaX / distance) * speed;
      movement.velocityY = (deltaY / distance) * speed;
      this.clampVelocity(movement);
    }
  }

  /**
   * Clamp velocity to maximum speed
   * @param {MovementComponent} movement - Movement component
   */
  clampVelocity(movement) {
    if (movement.maxSpeed <= 0) return;

    const currentSpeed = Math.sqrt(
      movement.velocityX * movement.velocityX + movement.velocityY * movement.velocityY
    );
    if (currentSpeed > movement.maxSpeed) {
      const scale = movement.maxSpeed / currentSpeed;
      movement.velocityX *= scale;
      movement.velocityY *= scale;
    }
  }

  /**
   * Apply screen boundary constraints based on boundary behavior
   * @param {BaseEntity} entity - Entity to check bounds for
   * @param {MovementComponent} movement - Movement component
   */
  applyScreenBounds(entity, movement) {
    if (!this.scene) return;

    const { width, height } = this.scene.scale;
    const entityWidth = entity.width || 0;
    const entityHeight = entity.height || 0;

    const minX = movement.screenPadding + entityWidth / 2;
    const maxX = width - movement.screenPadding - entityWidth / 2;
    const minY = movement.screenPadding + entityHeight / 2;
    const maxY = height - movement.screenPadding - entityHeight / 2;

    let shouldDestroy = false;

    // Handle X bounds
    if (entity.x < minX) {
      switch (movement.boundaryBehavior) {
        case 'clamp':
          entity.x = minX;
          movement.velocityX = Math.max(0, movement.velocityX);
          break;
        case 'wrap':
          entity.x = maxX;
          break;
        case 'bounce':
          entity.x = minX;
          movement.velocityX = Math.abs(movement.velocityX) * 0.8; // Reduce velocity on bounce
          break;
        case 'destroy':
          shouldDestroy = true;
          break;
      }
    } else if (entity.x > maxX) {
      switch (movement.boundaryBehavior) {
        case 'clamp':
          entity.x = maxX;
          movement.velocityX = Math.min(0, movement.velocityX);
          break;
        case 'wrap':
          entity.x = minX;
          break;
        case 'bounce':
          entity.x = maxX;
          movement.velocityX = -Math.abs(movement.velocityX) * 0.8;
          break;
        case 'destroy':
          shouldDestroy = true;
          break;
      }
    }

    // Handle Y bounds
    if (entity.y < minY) {
      switch (movement.boundaryBehavior) {
        case 'clamp':
          entity.y = minY;
          movement.velocityY = Math.max(0, movement.velocityY);
          break;
        case 'wrap':
          entity.y = maxY;
          break;
        case 'bounce':
          entity.y = minY;
          movement.velocityY = Math.abs(movement.velocityY) * 0.8;
          break;
        case 'destroy':
          shouldDestroy = true;
          break;
      }
    } else if (entity.y > maxY) {
      switch (movement.boundaryBehavior) {
        case 'clamp':
          entity.y = maxY;
          movement.velocityY = Math.min(0, movement.velocityY);
          break;
        case 'wrap':
          entity.y = minY;
          break;
        case 'bounce':
          entity.y = maxY;
          movement.velocityY = -Math.abs(movement.velocityY) * 0.8;
          break;
        case 'destroy':
          shouldDestroy = true;
          break;
      }
    }

    // Handle entity destruction
    if (shouldDestroy) {
      Logger.debug('MovementSystem: Entity destroyed by boundary behavior');
      // Schedule destruction to avoid physics update conflicts
      if (this.scene) {
        this.scene.time.delayedCall(10, () => {
          if (entity && entity.destroy) {
            entity.destroy();
          }
        });
      }
    }
  }

  /**
   * Update movement state and direction tracking
   * @param {BaseEntity} entity - Entity to update
   * @param {MovementComponent} movement - Movement component
   */
  updateMovingState(entity, movement) {
    const wasMoving = movement.isMoving;
    movement.isMoving = Math.abs(movement.velocityX) > 0.01 || Math.abs(movement.velocityY) > 0.01;

    // Update last direction
    if (movement.isMoving) {
      movement.lastDirection.x = movement.velocityX;
      movement.lastDirection.y = movement.velocityY;
    }

    // Emit movement events if entity supports it
    if (entity && entity.emit) {
      if (!wasMoving && movement.isMoving) {
        entity.emit('moveStart', { velocity: { x: movement.velocityX, y: movement.velocityY } });
      } else if (wasMoving && !movement.isMoving) {
        entity.emit('moveStop', { lastDirection: movement.lastDirection });
      }
    }
  }

  /**
   * Called when system is added to a scene
   * @param {Phaser.Scene} scene - The scene this system is added to
   */
  onAddedToScene(scene) {
    super.onAddedToScene(scene);
    this.scene = scene;
    Logger.debug(`[MovementSystem] Movement system added to scene: ${scene.scene.key}`);
  }

  /**
   * Clean up movement system resources
   */
  destroy() {
    // Clean up EventBus listener
    if (this.inputListenerId && this.eventBus) {
      // Note: EventBus.off() is not implemented yet, but we set up the cleanup structure
      Logger.debug(`[MovementSystem] Would remove input listener: ${this.inputListenerId}`);
      this.inputListenerId = null;
    }

    // Clear input state
    this.playerInputState = {
      movement: { x: 0, y: 0 },
      weaponFiring: false,
    };

    this.eventBus = null;
    this.scene = null;
    super.destroy();
    Logger.debug(`[MovementSystem] Movement system destroyed and cleaned up`);
  }
}
