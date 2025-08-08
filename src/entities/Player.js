import EightDirection from 'phaser3-rex-plugins/plugins/behaviors/eightdirection/EightDirection.js';
import { addEntity, addComponent } from 'bitecs';
import { Position, Velocity, Health, Player as PlayerTag } from '@/ecs/components/index.js';
import { addSpriteMapping } from '@/ecs/world.js';
import Logger from '@/utils/Logger.js';

const logger = Logger.scope('Player');

export default class Player extends Phaser.GameObjects.Rectangle {
  constructor(scene) {
    super(scene, scene.scale.width / 2, scene.scale.height - 100, 64, 64, 0x0000ff, 1);

    scene.add.existing(this);
    scene.playerGroup.add(this);

    this.body.setCollideWorldBounds(true);

    new EightDirection(this, {
      speed: 400, // TODO: Integrate with power-ups.
    });

    // Create ECS entity for the player
    this.createECSEntity(scene);
  }

  /**
   * Create an ECS entity for this player to enable AI targeting
   */
  createECSEntity(scene) {
    if (!scene.world) {
      logger.warn('Scene world not available for player ECS entity creation');
      return;
    }

    // Create ECS entity
    this.entityId = addEntity(scene.world);
    
    // Add required components
    addComponent(scene.world, Position, this.entityId);
    addComponent(scene.world, Velocity, this.entityId);
    addComponent(scene.world, Health, this.entityId);
    addComponent(scene.world, PlayerTag, this.entityId); // Tag component for queries
    
    // Set initial values
    Position.x[this.entityId] = this.x;
    Position.y[this.entityId] = this.y;
    Velocity.x[this.entityId] = 0;
    Velocity.y[this.entityId] = 0;
    Health.current[this.entityId] = 100;
    Health.max[this.entityId] = 100;
    
    // Store reference on sprite for collision detection
    this.entityType = 'player';
    
    // Add sprite mapping for consistency with enemy system
    addSpriteMapping(scene.world, this.entityId, this);
    
    logger.debug('Player ECS entity created', { entityId: this.entityId });
  }

  /**
   * Update ECS entity position when player moves
   */
  updateECSPosition() {
    if (this.entityId && this.scene.world) {
      Position.x[this.entityId] = this.x;
      Position.y[this.entityId] = this.y;
    }
  }

  /**
   * Override setPosition to sync with ECS
   */
  setPosition(x, y) {
    super.setPosition(x, y);
    this.updateECSPosition();
    return this;
  }
}
