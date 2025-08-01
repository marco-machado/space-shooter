import System from './System.js';
import CollisionComponent from '../components/CollisionComponent.js';
import Logger from '../core/Logger.js';

/**
 * Collision System
 * Handles collision detection between entities with CollisionComponents
 * Uses spatial optimization for performance with large numbers of entities
 */
class CollisionSystem extends System {
  constructor(scene) {
    super();
    this.scene = scene;

    // Spatial grid for performance optimization
    this.gridSize = 64; // Size of each spatial grid cell
    this.spatialGrid = new Map();
    this.gridWidth = 0;
    this.gridHeight = 0;

    // Collision statistics
    this.stats = {
      totalChecks: 0,
      actualCollisions: 0,
      spatialOptimizations: 0,
      lastUpdateCount: 0,
    };

    // Update spatial grid dimensions
    this.updateGridDimensions();

    Logger.info('CollisionSystem initialized', {
      gridSize: this.gridSize,
      gridWidth: this.gridWidth,
      gridHeight: this.gridHeight,
    });
  }

  /**
   * Update spatial grid dimensions based on scene size
   */
  updateGridDimensions() {
    if (this.scene && this.scene.scale) {
      this.gridWidth = Math.ceil(this.scene.scale.width / this.gridSize);
      this.gridHeight = Math.ceil(this.scene.scale.height / this.gridSize);
    }
  }

  /**
   * Update collision system - main collision detection loop
   * @param {Array} entities - All entities in the scene
   * @param {number} delta - Time delta in milliseconds
   */
  update(entities, delta) {
    // Reset statistics
    this.stats.totalChecks = 0;
    this.stats.actualCollisions = 0;
    this.stats.spatialOptimizations = 0;
    this.stats.lastUpdateCount = entities.length;

    // Clear spatial grid
    this.clearSpatialGrid();

    // Get entities with collision components
    const collidableEntities = entities.filter(
      entity => entity.hasComponent && entity.hasComponent(CollisionComponent) && entity.active
    );

    if (collidableEntities.length === 0) return;

    // Populate spatial grid
    this.populateSpatialGrid(collidableEntities);

    // Perform collision checks
    this.performCollisionChecks(collidableEntities, delta);

    // Log performance periodically
    if (this.stats.totalChecks > 0 && Math.random() < 0.01) {
      // 1% chance
      Logger.debug('CollisionSystem performance', this.getStats());
    }
  }

  /**
   * Clear the spatial grid
   */
  clearSpatialGrid() {
    this.spatialGrid.clear();
  }

  /**
   * Populate spatial grid with entities
   * @param {Array} entities - Entities with collision components
   */
  populateSpatialGrid(entities) {
    entities.forEach(entity => {
      const collision = entity.getComponent(CollisionComponent);
      if (!collision) return;

      const bounds = collision.getBounds(entity.x, entity.y);
      const gridCells = this.getGridCells(bounds);

      gridCells.forEach(cellKey => {
        if (!this.spatialGrid.has(cellKey)) {
          this.spatialGrid.set(cellKey, []);
        }
        this.spatialGrid.get(cellKey).push(entity);
      });
    });
  }

  /**
   * Get grid cells that an entity occupies
   * @param {Object} bounds - Entity bounds
   * @returns {Array} Array of grid cell keys
   */
  getGridCells(bounds) {
    const cells = [];

    let minGridX, maxGridX, minGridY, maxGridY;

    if (bounds.type === 'circle') {
      minGridX = Math.floor((bounds.x - bounds.radius) / this.gridSize);
      maxGridX = Math.floor((bounds.x + bounds.radius) / this.gridSize);
      minGridY = Math.floor((bounds.y - bounds.radius) / this.gridSize);
      maxGridY = Math.floor((bounds.y + bounds.radius) / this.gridSize);
    } else {
      minGridX = Math.floor(bounds.x / this.gridSize);
      maxGridX = Math.floor((bounds.x + bounds.width) / this.gridSize);
      minGridY = Math.floor(bounds.y / this.gridSize);
      maxGridY = Math.floor((bounds.y + bounds.height) / this.gridSize);
    }

    // Clamp to grid boundaries
    minGridX = Math.max(0, minGridX);
    maxGridX = Math.min(this.gridWidth - 1, maxGridX);
    minGridY = Math.max(0, minGridY);
    maxGridY = Math.min(this.gridHeight - 1, maxGridY);

    for (let x = minGridX; x <= maxGridX; x++) {
      for (let y = minGridY; y <= maxGridY; y++) {
        cells.push(`${x},${y}`);
      }
    }

    return cells;
  }

  /**
   * Perform collision checks using spatial optimization
   * @param {Array} entities - Entities with collision components
   * @param {number} delta - Time delta in milliseconds
   */
  performCollisionChecks(entities, delta) {
    const checkedPairs = new Set();

    // Check collisions within each grid cell
    this.spatialGrid.forEach(cellEntities => {
      if (cellEntities.length < 2) return;

      // Check all pairs within this cell
      for (let i = 0; i < cellEntities.length; i++) {
        for (let j = i + 1; j < cellEntities.length; j++) {
          const entityA = cellEntities[i];
          const entityB = cellEntities[j];

          // Create unique pair identifier
          const pairId =
            entityA.entityId < entityB.entityId
              ? `${entityA.entityId}:${entityB.entityId}`
              : `${entityB.entityId}:${entityA.entityId}`;

          // Skip if already checked this pair
          if (checkedPairs.has(pairId)) {
            this.stats.spatialOptimizations++;
            continue;
          }
          checkedPairs.add(pairId);

          this.checkCollisionPair(entityA, entityB, delta);
        }
      }
    });
  }

  /**
   * Check collision between two entities
   * @param {Entity} entityA - First entity
   * @param {Entity} entityB - Second entity
   * @param {number} delta - Time delta in milliseconds
   */
  checkCollisionPair(entityA, entityB, delta) {
    this.stats.totalChecks++;

    const collisionA = entityA.getComponent(CollisionComponent);
    const collisionB = entityB.getComponent(CollisionComponent);

    if (!collisionA || !collisionB) return;

    // Check if entities should collide with each other
    if (!collisionA.shouldCollideWith(collisionB) && !collisionB.shouldCollideWith(collisionA)) {
      return;
    }

    // Check if both entities can collide (not on cooldown)
    if (!collisionA.canCollide() || !collisionB.canCollide()) {
      return;
    }

    // Perform actual collision detection
    const isColliding = CollisionComponent.checkCollision(
      collisionA,
      collisionB,
      { x: entityA.x, y: entityA.y },
      { x: entityB.x, y: entityB.y }
    );

    if (isColliding) {
      this.handleCollision(entityA, entityB, collisionA, collisionB, delta);
      this.stats.actualCollisions++;
    }
  }

  /**
   * Handle collision between two entities
   * @param {Entity} entityA - First entity
   * @param {Entity} entityB - Second entity
   * @param {CollisionComponent} collisionA - First entity's collision component
   * @param {CollisionComponent} collisionB - Second entity's collision component
   * @param {number} delta - Time delta in milliseconds
   */
  handleCollision(entityA, entityB, collisionA, collisionB, _delta) {
    Logger.debug(
      `Collision detected: ${entityA.constructor.name} <-> ${entityB.constructor.name}`,
      {
        layerA: collisionA.layer,
        layerB: collisionB.layer,
        positionA: { x: entityA.x, y: entityA.y },
        positionB: { x: entityB.x, y: entityB.y },
      }
    );

    // Handle collision for entity A
    const resultA = collisionA.handleCollision(entityB, collisionB);

    // Handle collision for entity B (if entity A wasn't destroyed)
    let resultB = { handled: false };
    if (entityA.active && entityB.active) {
      resultB = collisionB.handleCollision(entityA, collisionA);
    }

    // Emit collision events
    this.emitCollisionEvents(entityA, entityB, resultA, resultB);

    // Handle special collision types
    this.handleSpecialCollisions(entityA, entityB, collisionA, collisionB, resultA, resultB);

    // Apply physics separation if needed (prevent overlap)
    if (entityA.active && entityB.active && !collisionA.isSensor && !collisionB.isSensor) {
      this.separateEntities(entityA, entityB, collisionA, collisionB);
    }
  }

  /**
   * Emit collision events to the scene and entities
   * @param {Entity} entityA - First entity
   * @param {Entity} entityB - Second entity
   * @param {Object} resultA - Collision result for entity A
   * @param {Object} resultB - Collision result for entity B
   */
  emitCollisionEvents(entityA, entityB, resultA, resultB) {
    // Emit to scene for global collision handling
    if (this.scene.events) {
      this.scene.events.emit('collision', {
        entityA,
        entityB,
        resultA,
        resultB,
      });
    }

    // Emit to individual entities
    if (entityA.emit) {
      entityA.emit('collision', { other: entityB, result: resultA });
    }

    if (entityB.emit) {
      entityB.emit('collision', { other: entityA, result: resultB });
    }
  }

  /**
   * Handle special collision cases (projectiles, power-ups, etc.)
   * @param {Entity} entityA - First entity
   * @param {Entity} entityB - Second entity
   * @param {CollisionComponent} collisionA - First entity's collision component
   * @param {CollisionComponent} collisionB - Second entity's collision component
   * @param {Object} resultA - Collision result for entity A
   * @param {Object} resultB - Collision result for entity B
   */
  handleSpecialCollisions(entityA, entityB, collisionA, collisionB, resultA, resultB) {
    // Handle projectile collisions
    if (entityA.constructor.name === 'Projectile' && resultA.handled) {
      if (entityA.onCollision) {
        entityA.onCollision(entityB, resultA);
      }
    }

    if (entityB.constructor.name === 'Projectile' && resultB.handled) {
      if (entityB.onCollision) {
        entityB.onCollision(entityA, resultB);
      }
    }

    // Handle power-up collection
    if (collisionA.layer === 'powerup' || collisionB.layer === 'powerup') {
      const powerup = collisionA.layer === 'powerup' ? entityA : entityB;
      const collector = collisionA.layer === 'powerup' ? entityB : entityA;

      if (collector.constructor.name === 'Player' || collector.entityType === 'player') {
        this.handlePowerUpCollection(powerup, collector);
      }
    }

    // Handle enemy-player collisions (damage)
    if (
      (collisionA.layer === 'enemy' && collisionB.layer === 'player') ||
      (collisionA.layer === 'player' && collisionB.layer === 'enemy')
    ) {
      const enemy = collisionA.layer === 'enemy' ? entityA : entityB;
      const player = collisionA.layer === 'player' ? entityA : entityB;

      this.handleEnemyPlayerCollision(enemy, player, resultA, resultB);
    }
  }

  /**
   * Handle power-up collection
   * @param {Entity} powerup - Power-up entity
   * @param {Entity} collector - Entity collecting the power-up
   */
  handlePowerUpCollection(powerup, collector) {
    Logger.info(`Power-up collected: ${powerup.powerupType || 'unknown'}`);

    // Emit power-up collection event
    if (this.scene.events) {
      this.scene.events.emit('powerUpCollected', {
        powerup,
        collector,
        type: powerup.powerupType,
        position: { x: powerup.x, y: powerup.y },
      });
    }

    // Apply power-up effect (handled by game systems)
    if (collector.emit) {
      collector.emit('powerUpCollected', {
        type: powerup.powerupType,
        powerup,
      });
    }
  }

  /**
   * Handle enemy-player collision
   * @param {Entity} enemy - Enemy entity
   * @param {Entity} player - Player entity
   * @param {Object} resultA - Collision result for first entity
   * @param {Object} resultB - Collision result for second entity
   */
  handleEnemyPlayerCollision(enemy, player, resultA, resultB) {
    Logger.info('Enemy-Player collision', {
      enemyType: enemy.enemyType,
      damageDealt: resultA.damageDealt + resultB.damageDealt,
    });

    // Emit collision event for visual/audio effects
    if (this.scene.events) {
      this.scene.events.emit('enemyPlayerCollision', {
        enemy,
        player,
        damage: resultA.damageDealt + resultB.damageDealt,
        position: { x: (enemy.x + player.x) / 2, y: (enemy.y + player.y) / 2 },
      });
    }
  }

  /**
   * Separate overlapping entities to prevent clipping
   * @param {Entity} entityA - First entity
   * @param {Entity} entityB - Second entity
   * @param {CollisionComponent} collisionA - First entity's collision component
   * @param {CollisionComponent} collisionB - Second entity's collision component
   */
  separateEntities(entityA, entityB, collisionA, collisionB) {
    // Skip separation for immovable entities
    if (collisionA.immovable && collisionB.immovable) return;

    const boundsA = collisionA.getBounds(entityA.x, entityA.y);
    const boundsB = collisionB.getBounds(entityB.x, entityB.y);

    // Calculate separation distance
    let separationX = 0;
    let separationY = 0;

    if (boundsA.type === 'rectangle' && boundsB.type === 'rectangle') {
      const overlapX = Math.min(
        boundsA.x + boundsA.width - boundsB.x,
        boundsB.x + boundsB.width - boundsA.x
      );
      const overlapY = Math.min(
        boundsA.y + boundsA.height - boundsB.y,
        boundsB.y + boundsB.height - boundsA.y
      );

      if (overlapX < overlapY) {
        separationX = (overlapX / 2) * (boundsA.centerX < boundsB.centerX ? -1 : 1);
      } else {
        separationY = (overlapY / 2) * (boundsA.centerY < boundsB.centerY ? -1 : 1);
      }
    } else {
      // Simple separation for circles or mixed shapes
      const dx = entityA.x - entityB.x;
      const dy = entityA.y - entityB.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        const normalX = dx / distance;
        const normalY = dy / distance;
        const separation = 2; // Minimum separation distance

        separationX = (normalX * separation) / 2;
        separationY = (normalY * separation) / 2;
      }
    }

    // Apply separation
    if (!collisionA.immovable) {
      entityA.x += separationX;
      entityA.y += separationY;
    }

    if (!collisionB.immovable) {
      entityB.x -= separationX;
      entityB.y -= separationY;
    }
  }

  /**
   * Get collision system statistics
   * @returns {Object} Performance and collision stats
   */
  getStats() {
    return {
      ...this.stats,
      gridSize: this.gridSize,
      gridCells: this.gridWidth * this.gridHeight,
      activeGridCells: this.spatialGrid.size,
      collisionRate:
        this.stats.totalChecks > 0
          ? `${((this.stats.actualCollisions / this.stats.totalChecks) * 100).toFixed(2)}%`
          : '0%',
      optimizationRate:
        this.stats.totalChecks > 0
          ? `${((this.stats.spatialOptimizations / this.stats.totalChecks) * 100).toFixed(2)}%`
          : '0%',
    };
  }

  /**
   * Optimize grid size based on entity density
   * @param {Array} entities - Current entities
   */
  optimizeGridSize(entities) {
    const collidableCount = entities.filter(
      e => e.hasComponent && e.hasComponent(CollisionComponent)
    ).length;

    // Adjust grid size based on entity count
    if (collidableCount > 100 && this.gridSize > 32) {
      this.gridSize = Math.max(32, this.gridSize - 8);
      this.updateGridDimensions();
      Logger.debug(`Grid size optimized: reduced to ${this.gridSize}`);
    } else if (collidableCount < 20 && this.gridSize < 128) {
      this.gridSize = Math.min(128, this.gridSize + 8);
      this.updateGridDimensions();
      Logger.debug(`Grid size optimized: increased to ${this.gridSize}`);
    }
  }

  /**
   * Clean up collision system
   */
  destroy() {
    this.clearSpatialGrid();
    Logger.info('CollisionSystem destroyed');
  }
}

export default CollisionSystem;
