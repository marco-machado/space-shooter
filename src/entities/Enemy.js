import BaseEntity from './BaseEntity.js';
import MovementComponent from '@/components/MovementComponent.js';
import HealthComponent from '@/components/HealthComponent.js';
import WeaponComponent from '@/components/WeaponComponent.js';
import Logger from '@/utils/Logger.js';

/**
 * Enemy Entity
 * Represents different types of enemy ships with AI behavior
 * Uses colored rectangles for development graphics
 */
export default class Enemy extends BaseEntity {
  constructor(scene, x, y, enemyType = 'scout') {
    // Get enemy configuration
    const config = Enemy.getEnemyConfig(enemyType);

    super(scene, x, y, config.size.width, config.size.height, config.color);

    // Enemy properties
    this.enemyType = enemyType;
    this.maxHealth = config.health;
    this.scoreValue = config.scoreValue;
    this.spawnTime = Date.now();
    this.lastFireTime = 0;
    this.canFire = config.canFire;
    this.fireRate = config.fireRate;
    this.fireRange = config.fireRange;
    this.aggressionLevel = config.aggressionLevel; // 0-1, affects AI behavior

    // AI behavior state
    this.aiState = 'patrol'; // 'patrol', 'attack', 'retreat', 'formation'
    this.target = null; // Player or other target
    this.lastStateChange = Date.now();
    this.stateData = {}; // State-specific data

    // Formation support
    this.formationLeader = null;
    this.formationPosition = { x: 0, y: 0 };
    this.isFormationLeader = false;
    
    // Set entity type for pooling identification
    this.entityType = 'enemy';

    // Initialize components
    this.initializeComponents(config);

    // Enable physics with enemy collision group
    this.enablePhysics('dynamic');
    
    // Configure physics for enemy
    if (this.body) {
      this._configureEnemyPhysics(config);
    }

    // Set up collision callbacks for damage dealing
    this.setupCollisionHandling(config);

    Logger.debug(`Enemy created: ${this.enemyType}`, {
      health: this.maxHealth,
      scoreValue: this.scoreValue,
      position: { x, y },
      canFire: this.canFire,
    });
  }
  /**
   * Configure enemy physics properties based on enemy type
   * @private
   */
  _configureEnemyPhysics(config) {
    if (!this.body) return;

    // Manual physics configuration for enemy
    this.body.setSize(config.size.width * 0.9, config.size.height * 0.9);
    this.body.setOffset(config.size.width * 0.05, config.size.height * 0.05);
    this.body.setImmovable(false);
    this.body.setBounce(0);
    this.body.setDrag(0);
    this.body.setMaxVelocity(150, 150);

    Logger.debug(`[Enemy] Physics configuration applied for ${this.entityId}`);
  }

  /**
   * Get enemy configurations for different types
   */
  static getEnemyConfig(enemyType) { // TODO: Should we move this to the ConfigManager?
    const configs = {
      scout: {
        size: { width: 32, height: 32 },
        color: 0xff4444, // Light red
        health: 50,
        armor: 0,
        resistance: 0,
        scoreValue: 100,
        canFire: false,
        fireRate: 0,
        fireRange: 0,
        weaponDamage: 0,
        projectileSpeed: 0,
        collisionDamage: 15,
        aggressionLevel: 0.3,
        movementPattern: MovementComponent.createScoutPattern(),
      },

      fighter: {
        size: { width: 48, height: 48 },
        color: 0xcc2222, // Medium red
        health: 100,
        armor: 5,
        resistance: 0.1,
        scoreValue: 250,
        canFire: true,
        fireRate: 800, // Slower than player
        fireRange: 300,
        weaponDamage: 20,
        projectileSpeed: 400,
        collisionDamage: 25,
        aggressionLevel: 0.6,
        movementPattern: MovementComponent.createFighterPattern(),
      },

      bomber: {
        size: { width: 64, height: 64 },
        color: 0x881111, // Dark red
        health: 200,
        armor: 15,
        resistance: 0.2,
        scoreValue: 500,
        canFire: true,
        fireRate: 1500, // Very slow
        fireRange: 250,
        weaponDamage: 50,
        projectileSpeed: 300,
        collisionDamage: 40,
        aggressionLevel: 0.4,
        movementPattern: MovementComponent.createBomberPattern(),
      },
    };

    return configs[enemyType] || configs.scout;
  }

  /**
   * Create enemy variants for wave progression
   */
  static createEliteVariant(baseType, level = 1) {
    const config = Enemy.getEnemyConfig(baseType);
    const multiplier = 1 + level * 0.3; // 30% increase per level

    return {
      ...config,
      health: Math.floor(config.health * multiplier),
      armor: Math.floor(config.armor * multiplier),
      scoreValue: Math.floor(config.scoreValue * multiplier),
      weaponDamage: Math.floor(config.weaponDamage * multiplier),
      aggressionLevel: Math.min(1, config.aggressionLevel + level * 0.1),
      color: config.color - 0x222222, // Darker color for elite
      movementPattern: {
        ...config.movementPattern,
        maxSpeed: config.movementPattern.maxSpeed * 1.2,
      },
    };
  }

  /**
   * Create boss variant
   */
  static createBossVariant(baseType) {
    const config = Enemy.getEnemyConfig(baseType);

    return {
      ...config,
      size: {
        width: config.size.width * 2,
        height: config.size.height * 2,
      },
      health: config.health * 5,
      armor: config.armor * 3,
      scoreValue: config.scoreValue * 10,
      weaponDamage: config.weaponDamage * 2,
      fireRate: config.fireRate * 0.6, // Faster firing
      aggressionLevel: 0.9,
      color: config.color - 0x440000, // Much darker
      movementPattern: {
        ...config.movementPattern,
        aiPattern: 'circle', // Bosses use circle patterns
        maxSpeed: config.movementPattern.maxSpeed * 0.7, // Slower but more health
      },
    };
  }

  /**
   * Set up collision handling for physics-based collisions
   * @param {Object} config - Enemy configuration
   */
  setupCollisionHandling(config) {
    // Set up collision callback for dealing damage to player
    this.onCollision((enemy, otherEntity) => {
      this.handleCollisionDamage(otherEntity, config.collisionDamage);
    });

    // Set up overlap callback for projectile hits (receives damage)
    this.onOverlap((enemy, otherEntity) => {
      // Only handle projectile overlaps for damage receiving
      if (otherEntity.entityType === 'projectile' || 
          (otherEntity.collisionGroup && otherEntity.collisionGroup === 'playerProjectile')) {
        this.handleProjectileHit(otherEntity);
      }
    });

    Logger.debug(`Enemy collision handling setup: ${this.enemyType} (damage: ${config.collisionDamage})`);
  }

  /**
   * Handle collision damage dealing to other entities
   * @param {BaseEntity} otherEntity - Entity that collided with this enemy
   * @param {number} damageAmount - Damage to deal
   */
  handleCollisionDamage(otherEntity, damageAmount) {
    // Only deal damage to player entities
    if (otherEntity.entityType !== 'player' && 
        otherEntity.constructor.name !== 'Player') {
      return;
    }

    const otherHealth = otherEntity.getComponent('HealthComponent');
    if (otherHealth && otherHealth.isAlive()) {
      const damageDealt = otherHealth.takeDamage(damageAmount, 'collision');
      
      Logger.debug(`Enemy collision damage: ${this.enemyType} dealt ${damageDealt} collision damage to player`);
      
      // Emit collision event
      this.emit('enemyCollision', {
        enemy: this,
        target: otherEntity,
        damageDealt,
        damageType: 'collision'
      });
    }
  }

  /**
   * Handle projectile hits (enemy receives damage)
   * @param {BaseEntity} projectile - Projectile that hit this enemy
   */
  handleProjectileHit(projectile) {
    const health = this.getComponent('HealthComponent');
    if (!health || !health.isAlive()) {
      return;
    }

    // Get damage from projectile (will have damage property from weapon)
    const damage = projectile.damage || 25; // Default damage if not set
    const damageReceived = health.takeDamage(damage, 'projectile');
    
    Logger.debug(`Enemy hit: ${this.enemyType} received ${damageReceived} projectile damage`);
    
    // Emit hit event
    this.emit('enemyHit', {
      enemy: this,
      projectile,
      damageReceived,
      damageType: 'projectile'
    });

    // Destroy projectile on hit
    if (projectile.destroy) {
      projectile.destroy();
    }
  }

  /**
   * Initialize enemy components based on type
   * @param {Object} config - Enemy configuration
   */
  initializeComponents(config) {
    // Health component
    const healthComponent = new HealthComponent(config.health);
    healthComponent.init({
      armor: config.armor || 0,
      resistance: config.resistance || 0,
    });
    this.addComponent(healthComponent);

    // Movement component with AI pattern
    const movementConfig = config.movementPattern;
    const movementComponent = new MovementComponent(movementConfig.maxSpeed);
    movementComponent.init(movementConfig);
    this.addComponent(movementComponent);

    // Collision handling is now managed by physics callbacks (see setupCollisionHandling method)

    // Weapon component for enemies that can fire
    if (this.canFire) {
      const weaponComponent = new WeaponComponent('basic');
      weaponComponent.init({
        currentWeapon: 'basic',
        availableWeapons: ['basic'],
        continuousFire: false,
      });

      // Override basic weapon specs for enemy
      weaponComponent.weaponSpecs.basic = {
        name: 'Enemy Blaster',
        damage: config.weaponDamage,
        fireRate: this.fireRate,
        projectileSpeed: config.projectileSpeed,
        projectileColor: 0xff0000, // Red enemy projectiles
        projectileSize: { width: 6, height: 12 },
        ammoType: 'energy',
        maxAmmo: -1,
        currentAmmo: -1,
        sound: 'enemy_fire',
      };

      this.addComponent(weaponComponent);
    }
  }

  /**
   * Update enemy behavior and AI
   * @param {number} delta - Time delta in milliseconds
   */
  update(delta) {
    super.update(delta);

    // Update components
    this.updateComponents(delta);

    // Update AI behavior
    this.updateAI(delta);

    // Handle firing logic
    if (this.canFire) {
      this.updateFiring(delta);
    }

    // Check for death
    const health = this.getComponent(HealthComponent);
    if (health && !health.isAlive()) {
      this.onDeath();
    }
  }

  /**
   * Update all components
   * @param {number} delta - Time delta in milliseconds
   */
  updateComponents(delta) {
    const deltaSeconds = delta / 1000;

    const movement = this.getComponent(MovementComponent);
    if (movement) {
      movement.update(deltaSeconds);
    }

    const health = this.getComponent(HealthComponent);
    if (health) {
      health.update(delta);
    }

    // Collision handling is now event-driven via physics callbacks

    const weapon = this.getComponent(WeaponComponent);
    if (weapon) {
      weapon.update(delta);
    }
  }

  /**
   * Update AI behavior based on current state
   * @param {number} delta - Time delta in milliseconds
   */
  updateAI(delta) {
    // Find player target if not set
    if (!this.target && this.scene.entities) {
      this.target = this.scene.entities.find(
        entity => entity.constructor.name === 'Player' || entity.entityType === 'player'
      );
    }

    // Update AI state machine
    switch (this.aiState) {
      case 'patrol':
        this.updatePatrolState(delta);
        break;
      case 'attack':
        this.updateAttackState(delta);
        break;
      case 'retreat':
        this.updateRetreatState(delta);
        break;
      case 'formation':
        this.updateFormationState(delta);
        break;
    }

    // Check for state transitions
    this.checkStateTransitions();
  }

  /**
   * Update patrol behavior (default movement pattern)
   */
  updatePatrolState(_delta) {
    const movement = this.getComponent(MovementComponent);
    if (!movement) return;

    // Continue with default AI pattern (set during initialization)
    // This is handled by MovementComponent's AI patterns
  }

  /**
   * Update attack behavior (aggressive towards player)
   */
  updateAttackState(_delta) {
    if (!this.target) return;

    const movement = this.getComponent(MovementComponent);
    if (!movement) return;

    // Switch to chase pattern if not already chasing
    if (movement.aiPattern !== 'chase') {
      const chasePattern = MovementComponent.createChasePattern(this.target);
      movement.setAIPattern('chase', chasePattern.aiPatternData, this.target);
    }
  }

  /**
   * Update retreat behavior (move away from danger)
   */
  updateRetreatState(_delta) {
    if (!this.target) return;

    const movement = this.getComponent(MovementComponent);
    if (!movement) return;

    // Move away from player
    const dx = this.x - this.target.x;
    const dy = this.y - this.target.y;
    const angle = Math.atan2(dy, dx); // Away from target

    movement.moveInDirection(angle, movement.maxSpeed * 0.8);
  }

  /**
   * Update formation behavior (follow formation leader)
   */
  updateFormationState(_delta) {
    if (!this.formationLeader) {
      this.changeState('patrol');
      return;
    }

    const movement = this.getComponent(MovementComponent);
    if (!movement) return;

    // Use formation AI pattern
    if (movement.aiPattern !== 'formation') {
      movement.setAIPattern('formation', {
        formationLeader: this.formationLeader,
        offsetX: this.formationPosition.x,
        offsetY: this.formationPosition.y,
        followDistance: 60,
        speed: movement.maxSpeed * 0.7,
      });
    }
  }

  /**
   * Check for AI state transitions
   */
  checkStateTransitions() {
    if (!this.target) return;

    const distanceToTarget = Math.sqrt(
      Math.pow(this.x - this.target.x, 2) + Math.pow(this.y - this.target.y, 2)
    );

    const health = this.getComponent(HealthComponent);
    const healthPercent = health ? health.getHealthPercentage() : 1;

    // State transition logic based on distance, health, and aggression
    switch (this.aiState) {
      case 'patrol':
        if (distanceToTarget < 200 && this.aggressionLevel > 0.3) {
          this.changeState('attack');
        }
        break;

      case 'attack':
        if (healthPercent < 0.3 && this.aggressionLevel < 0.7) {
          this.changeState('retreat');
        } else if (distanceToTarget > 300) {
          this.changeState('patrol');
        }
        break;

      case 'retreat':
        if (healthPercent > 0.5 && distanceToTarget > 250) {
          this.changeState('patrol');
        }
        break;

      case 'formation':
        if (!this.formationLeader || distanceToTarget < 150) {
          this.changeState('attack');
        }
        break;
    }
  }

  /**
   * Change AI state
   * @param {string} newState - New AI state
   */
  changeState(newState) {
    if (this.aiState === newState) return;

    Logger.debug(`Enemy ${this.entityId} state change: ${this.aiState} -> ${newState}`);

    this.aiState = newState;
    this.lastStateChange = Date.now();
    this.stateData = {};

    // Emit state change event
    this.emit('stateChange', {
      oldState: this.aiState,
      newState,
      enemy: this,
    });
  }

  /**
   * Update firing behavior
   * @param {number} delta - Time delta in milliseconds
   */
  updateFiring(_delta) {
    if (!this.target || !this.canFire) return;

    const weapon = this.getComponent(WeaponComponent);
    if (!weapon) return;

    // Check if player is in range and in front of enemy
    const distanceToTarget = Math.sqrt(
      Math.pow(this.x - this.target.x, 2) + Math.pow(this.y - this.target.y, 2)
    );

    if (distanceToTarget > this.fireRange) return;

    // Check if roughly aiming at player (simple cone check)
    const angleToTarget = Math.atan2(this.target.y - this.y, this.target.x - this.x);
    const movement = this.getComponent(MovementComponent);
    const facingAngle = movement ? movement.getDirection() : Math.PI / 2; // Default downward

    const angleDiff = Math.abs(angleToTarget - facingAngle);
    const normalizedAngleDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);

    // Fire if roughly facing the target (within 45-degree cone)
    if (normalizedAngleDiff < Math.PI / 4 && weapon.canFireWeapon()) {
      this.fireAtTarget();
    }
  }

  /**
   * Fire at the current target
   */
  fireAtTarget() {
    if (!this.target) return;

    const weapon = this.getComponent(WeaponComponent);
    if (!weapon) return;

    const projectileConfig = weapon.fire();
    if (!projectileConfig) return;

    // Create projectile (will be handled by WeaponSystem in practice)
    this.emit('enemyFire', {
      enemy: this,
      target: this.target,
      config: projectileConfig,
      position: { x: this.x, y: this.y + this.height / 2 },
      angle: Math.atan2(this.target.y - this.y, this.target.x - this.x),
    });

    Logger.debug(`Enemy fired at target: ${this.enemyType}`);
  }

  /**
   * Handle enemy death
   */
  onDeath() {
    Logger.info(`Enemy destroyed: ${this.enemyType} (score: ${this.scoreValue})`);

    // Emit death event for score/effects
    this.emit('enemyDeath', {
      enemy: this,
      enemyType: this.enemyType,
      scoreValue: this.scoreValue,
      position: { x: this.x, y: this.y },
    });

    // Chance to drop power-up (handled by game systems)
    if (Math.random() < 0.15) {
      // 15% chance
      this.emit('dropPowerUp', {
        position: { x: this.x, y: this.y },
        enemyType: this.enemyType,
      });
    }

    // Destroy with slight delay for visual effects
    this.scene.time.delayedCall(50, () => {
      if (this.active) {
        this.destroy();
      }
    });
  }

  /**
   * Set formation position
   * @param {BaseEntity} leader - Formation leader
   * @param {number} offsetX - X offset from leader
   * @param {number} offsetY - Y offset from leader
   */
  setFormation(leader, offsetX, offsetY) {
    this.formationLeader = leader;
    this.formationPosition = { x: offsetX, y: offsetY };
    this.changeState('formation');

    Logger.debug(`Enemy joined formation: offset (${offsetX}, ${offsetY})`);
  }

  /**
   * Leave current formation
   */
  leaveFormation() {
    this.formationLeader = null;
    this.formationPosition = { x: 0, y: 0 };
    this.changeState('patrol');

    Logger.debug('Enemy left formation');
  }
}
