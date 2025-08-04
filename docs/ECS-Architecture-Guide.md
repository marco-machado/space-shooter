# ECS Architecture Guide

This comprehensive guide covers the Space Shooter game's Entity-Component-System (ECS) architecture, including the latest enhancements for flexible GameObject support, auto-initializing systems, and event-driven patterns.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [BaseEntity System](#baseentity-system)
  - [Flexible GameObject Types](#flexible-gameobject-types)
  - [Runtime Type Switching](#runtime-type-switching)
  - [Null-Safe Operations](#null-safe-operations)
- [Component Patterns](#component-patterns)
  - [Data-Centric Design](#data-centric-design)
  - [Component Lifecycle](#component-lifecycle)
  - [Serialization Support](#serialization-support)
- [System Design](#system-design)
  - [Logic Processing](#logic-processing)
  - [Performance Considerations](#performance-considerations)
  - [System Integration](#system-integration)
- [Advanced Patterns](#advanced-patterns)
  - [EventBus Integration](#eventbus-integration)
  - [Input Adapter Pattern](#input-adapter-pattern)
  - [Object Pooling](#object-pooling)
- [Implementation Examples](#implementation-examples)
- [Best Practices](#best-practices)
- [Migration Guide](#migration-guide)

---

## Architecture Overview

The Space Shooter implements a flexible Entity-Component-System architecture built on top of Phaser.js, providing maximum flexibility while maintaining performance and maintainability.

### Core Principles

**1. Composition Over Inheritance**
- Entities are composed of multiple components rather than inheriting from complex class hierarchies
- Components define what an entity *has* (data)
- Systems define what an entity *does* (behavior)

**2. Separation of Concerns**
- **Entities**: Container objects that hold components
- **Components**: Pure data containers with minimal logic
- **Systems**: Logic processors that operate on entities with specific components

**3. Flexible Visual Representation**
- Entities can have any Phaser GameObject type or no visual representation at all
- Support for development graphics with easy transition to final assets
- Runtime GameObject type switching capability

**4. Event-Driven Communication**
- EventBus enables decoupled communication between systems
- Input adapters emit structured events for game systems to consume
- Components can react to events without tight coupling

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     GameScene                               │
├─────────────────────────────────────────────────────────────┤
│  Entities[]  │  Systems[]  │  InputAdapter  │  EventBus    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐   ┌─────────────┐   ┌──────────────────────┐   │
│  │ Player  │   │ WeaponSystem │   │ KeyboardInputAdapter │   │
│  │Entity   │   │             │   │                      │   │
│  │         │   │ ┌─────────┐ │   │ ┌──────────────────┐ │   │
│  │ ┌─────┐ │   │ │Process  │ │   │ │ Event Emission   │ │   │
│  │ │Health│ │   │ │Weapon   │ │   │ │                  │ │   │
│  │ │Comp │ │   │ │Components││   │ │ Movement Events  │ │   │
│  │ └─────┘ │   │ └─────────┘ │   │ │ Weapon Events    │ │   │
│  │ ┌─────┐ │   │             │   │ └──────────────────┘ │   │
│  │ │Move │ │   └─────────────┘   └──────────────────────┘   │
│  │ │Comp │ │                                               │
│  │ └─────┘ │   ┌─────────────┐   ┌──────────────────────┐   │
│  │ ┌─────┐ │   │CollisionSys │   │      EventBus        │   │
│  │ │Weapon│ │   │             │   │                      │   │
│  │ │Comp │ │   │ ┌─────────┐ │   │ ┌──────────────────┐ │   │
│  │ └─────┘ │   │ │Spatial  │ │   │ │Event Distribution│ │   │
│  └─────────┘   │ │Grid     │ │   │ │                  │ │   │
│                 │ │Collision│ │   │ │ - PLAYER_INPUT   │ │   │
│  ┌─────────┐   │ └─────────┘ │   │ │ - COLLISION      │ │   │
│  │ Enemy   │   └─────────────┘   │ │ - GAME_STATE     │ │   │
│  │Entities │                     │ └──────────────────┘ │   │
│  │ ┌─────┐ │                     └──────────────────────┘   │
│  │ │AI   │ │                                               │
│  │ │Comp │ │                                               │
│  │ └─────┘ │                                               │
│  └─────────┘                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## BaseEntity System

### Flexible GameObject Types

The enhanced BaseEntity class supports multiple Phaser GameObject types, providing maximum flexibility for different entity needs:

#### Supported GameObject Types

**1. Rectangle (Default/Development)**
```javascript
// Backward compatible - existing code continues working
const player = new BaseEntity(scene, 100, 100, 64, 64, 0x0099ff, 'player');

// Explicit rectangle configuration
const rect = new BaseEntity(scene, {
  type: 'rectangle',
  x: 100, y: 100,
  width: 64, height: 64,
  color: 0x0099ff,
  name: 'player'
});
```

**2. Sprite (Production Assets)**
```javascript
const sprite = new BaseEntity(scene, {
  type: 'sprite',
  x: 200, y: 200,
  texture: 'player-sprite',
  frame: 0,
  name: 'sprite-player'
});
```

**3. Image (Static Graphics)**
```javascript
const image = new BaseEntity(scene, {
  type: 'image',
  x: 300, y: 300,
  texture: 'background-element',
  name: 'background'
});
```

**4. Circle (Round Entities)**
```javascript
const circle = new BaseEntity(scene, {
  type: 'circle',
  x: 400, y: 400,
  radius: 20,
  color: 0x00ff00,
  name: 'power-up'
});
```

**5. Polygon (Complex Shapes)**
```javascript
const diamond = new BaseEntity(scene, {
  type: 'polygon',
  x: 500, y: 500,
  points: [0, -12, 12, 0, 0, 12, -12, 0], // Diamond shape
  color: 0x8800ff,
  name: 'diamond-powerup'
});
```

**6. Text (UI Elements)**
```javascript
const textEntity = new BaseEntity(scene, {
  type: 'text',
  x: 600, y: 600,
  text: 'Score: 1000',
  style: { fontSize: '24px', fill: '#ffffff' },
  name: 'score-display'
});
```

**7. Null (Logical Entities)**
```javascript
const controller = new BaseEntity(scene, {
  type: null,
  x: 700, y: 700,
  name: 'game-controller'
});
// No visual representation, but full entity functionality
```

#### Constructor Patterns

**Backward Compatible Constructor:**
```javascript
// Legacy constructor - continues working exactly as before
new BaseEntity(scene, x, y, width, height, color, name);
```

**Configuration Object Constructor:**
```javascript
// New flexible constructor
new BaseEntity(scene, config);
```

**Automatic Type Detection:**
```javascript
class BaseEntity {
  constructor(scene, ...args) {
    // Automatically detects constructor signature
    if (args.length === 1 && typeof args[0] === 'object') {
      // Configuration object approach
      this.initFromConfig(scene, args[0]);
    } else {
      // Legacy constructor approach
      this.initFromLegacy(scene, ...args);
    }
  }
}
```

### Runtime Type Switching

One of the most powerful features is the ability to change GameObject types at runtime:

#### Basic Type Switching

```javascript
// Start as development rectangle
const entity = new BaseEntity(scene, {
  type: 'rectangle',
  x: 100, y: 100,
  width: 64, height: 64,
  color: 0xff0000,
  name: 'entity'
});

// Upgrade to sprite when assets are ready
entity.changeGameObjectType('sprite', {
  texture: 'upgraded-sprite',
  frame: 0
});

// Switch to circle for special state
entity.changeGameObjectType('circle', {
  radius: 30,
  color: 0x00ff00
});

// Convert to logical entity (remove visual)
entity.changeGameObjectType(null);
```

#### Advanced Type Switching Use Cases

**Progressive Asset Loading:**
```javascript
class AssetProgressiveLoader {
  upgradeEntityVisuals(entity, assetData) {
    if (assetData.spriteLoaded) {
      entity.changeGameObjectType('sprite', {
        texture: assetData.spriteKey,
        frame: assetData.frame
      });
    } else if (assetData.imageLoaded) {
      entity.changeGameObjectType('image', {
        texture: assetData.imageKey
      });
    }
    // Falls back to existing rectangle if no assets ready
  }
}
```

**State-Based Visual Changes:**
```javascript
class Player extends BaseEntity {
  activateShield() {
    // Change to circle with shield visual
    this.changeGameObjectType('circle', {
      radius: this.originalRadius + 10,
      color: 0x00aaff // Shield blue
    });
    
    this.shieldActive = true;
  }
  
  deactivateShield() {
    // Return to original sprite
    this.changeGameObjectType('sprite', {
      texture: this.originalTexture,
      frame: this.originalFrame
    });
    
    this.shieldActive = false;
  }
}
```

**Development to Production Transition:**
```javascript
class DevToProductionMigrator {
  migrateEntity(entity, productionAssets) {
    const currentType = entity.getGameObjectType();
    
    if (currentType === 'rectangle' && productionAssets.hasSprite(entity.name)) {
      // Seamless transition from dev rectangle to production sprite
      entity.changeGameObjectType('sprite', {
        texture: productionAssets.getSpriteKey(entity.name),
        frame: 0
      });
    }
  }
}
```

### Null-Safe Operations

All BaseEntity operations work safely even when no GameObject is present:

#### Property Delegation

```javascript
const logicalEntity = new BaseEntity(scene, {
  type: null,
  x: 100,
  y: 200,
  name: 'controller'
});

// All properties work without GameObject
console.log(logicalEntity.x); // 100
console.log(logicalEntity.y); // 200
console.log(logicalEntity.active); // true (default)
console.log(logicalEntity.visible); // true (default)

// Property setters work safely
logicalEntity.x = 150;
logicalEntity.y = 250;
logicalEntity.active = false;
```

#### Method Safety

```javascript
// All methods work safely with null GameObject
logicalEntity.addComponent(new HealthComponent(100));
logicalEntity.enablePhysics('dynamic'); // Safely ignored if no GameObject
logicalEntity.update(delta); // Updates components only
logicalEntity.destroy(); // Safe cleanup

// Even property access that might fail is handled
const width = logicalEntity.width || 0; // Safe fallback
const height = logicalEntity.height || 0; // Safe fallback
```

#### Component Integration

```javascript
// Components work identically regardless of GameObject presence
class LogicController extends BaseEntity {
  constructor(scene) {
    super(scene, { type: null, name: 'logic-controller' });
    
    // Full component functionality without visual representation
    this.addComponent(new TimerComponent(5000))
        .addComponent(new StateComponent('initializing'))
        .addComponent(new EventEmitterComponent());
  }
  
  update(delta) {
    // Full update functionality
    const timer = this.getComponent(TimerComponent);
    if (timer && timer.isComplete()) {
      this.switchToActiveState();
    }
  }
}
```

---

## Component Patterns

### Data-Centric Design

Components are designed as pure data containers with minimal logic, following the principle of separation between data and behavior.

#### Component Structure

```javascript
class BaseComponent {
  constructor() {
    this.entity = null; // Reference to parent entity
    this.active = true; // Component state
    this.name = this.constructor.name; // Component identifier
  }
  
  // Minimal lifecycle methods
  init(data = {}) {
    // Initialize component with configuration data
  }
  
  update(delta) {
    // Optional: Simple data updates only
  }
  
  serialize() {
    // Return serializable component data
    return {
      active: this.active,
      // ... component-specific data
    };
  }
  
  deserialize(data) {
    // Restore component from serialized data
    this.active = data.active;
    // ... restore component-specific data
  }
}
```

#### Data-Focused Component Examples

**HealthComponent (Pure Data):**
```javascript
class HealthComponent extends BaseComponent {
  constructor(maxHealth = 100) {
    super();
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
    this.invulnerable = false;
    this.invulnerableTime = 0;
    this.lastDamageTime = 0;
    this.damageHistory = [];
  }
  
  // Simple data operations only
  takeDamage(amount, source = 'unknown') {
    if (!this.invulnerable && amount > 0) {
      this.currentHealth = Math.max(0, this.currentHealth - amount);
      this.lastDamageTime = Date.now();
      this.damageHistory.push({ amount, source, timestamp: this.lastDamageTime });
    }
  }
  
  heal(amount) {
    if (amount > 0) {
      this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    }
  }
  
  // Getters for derived data
  isAlive() { return this.currentHealth > 0; }
  getHealthPercentage() { return this.currentHealth / this.maxHealth; }
  isDamaged() { return this.currentHealth < this.maxHealth; }
  canTakeDamage() { return !this.invulnerable; }
  
  serialize() {
    return {
      ...super.serialize(),
      maxHealth: this.maxHealth,
      currentHealth: this.currentHealth,
      invulnerable: this.invulnerable,
      invulnerableTime: this.invulnerableTime
    };
  }
}
```

**MovementComponent (Data + Simple Updates):**
```javascript
class MovementComponent extends BaseComponent {
  constructor(maxSpeed = 300) {
    super();
    this.maxSpeed = maxSpeed;
    this.velocityX = 0;
    this.velocityY = 0;
    this.accelerationX = 0;
    this.accelerationY = 0;
    this.friction = 0.95;
    this.aiPattern = null;
    this.patternData = {};
    this.boundaryBehavior = 'clamp';
  }
  
  // Simple data operations
  setVelocity(x, y) {
    this.velocityX = x;
    this.velocityY = y;
  }
  
  addVelocity(x, y) {
    this.velocityX += x;
    this.velocityY += y;
  }
  
  stop() {
    this.velocityX = 0;
    this.velocityY = 0;
  }
  
  // Simple update - just data manipulation
  update(delta) {
    // Apply acceleration
    this.velocityX += this.accelerationX * delta;
    this.velocityY += this.accelerationY * delta;
    
    // Apply friction
    this.velocityX *= this.friction;
    this.velocityY *= this.friction;
    
    // Clamp to max speed
    const speed = Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2);
    if (speed > this.maxSpeed) {
      this.velocityX = (this.velocityX / speed) * this.maxSpeed;
      this.velocityY = (this.velocityY / speed) * this.maxSpeed;
    }
  }
  
  // Getters for derived data
  getCurrentSpeed() {
    return Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2);
  }
  
  getDirection() {
    return Math.atan2(this.velocityY, this.velocityX);
  }
}
```

### Component Lifecycle

Components follow a clear lifecycle managed by the ECS system:

#### Lifecycle Stages

```javascript
// 1. Creation and Configuration
const component = new HealthComponent(100);
component.init({ invulnerable: true, invulnerableTime: 2000 });

// 2. Entity Association
entity.addComponent(component); // Sets component.entity reference

// 3. Active Processing
if (component.active) {
  component.update(delta); // Called by systems or entity
}

// 4. Serialization (for save games)
const data = component.serialize();

// 5. Cleanup
entity.removeComponent(HealthComponent); // Removes and cleans up
```

#### Component Integration with BaseEntity

```javascript
class BaseEntity {
  addComponent(component) {
    // Set bidirectional reference
    component.entity = this;
    this.components.set(component.constructor.name, component);
    
    // Allow component to perform initialization with entity context
    if (typeof component.onAddedToEntity === 'function') {
      component.onAddedToEntity(this);
    }
    
    return this; // Method chaining
  }
  
  removeComponent(componentType) {
    const component = this.components.get(componentType.name);
    if (component) {
      // Allow component to perform cleanup
      if (typeof component.onRemovedFromEntity === 'function') {
        component.onRemovedFromEntity(this);
      }
      
      component.entity = null;
      this.components.delete(componentType.name);
    }
    return this;
  }
}
```

### Serialization Support

Components support full serialization for save games and state persistence:

#### Serialization Patterns

```javascript
class WeaponComponent extends BaseComponent {
  serialize() {
    return {
      ...super.serialize(), // Base component data
      weaponType: this.weaponType,
      damage: this.damage,
      fireRate: this.fireRate,
      ammunition: this.ammunition,
      upgrades: [...this.upgrades], // Clone arrays
      stats: { ...this.stats } // Clone objects
    };
  }
  
  deserialize(data) {
    super.deserialize(data);
    this.weaponType = data.weaponType;
    this.damage = data.damage;
    this.fireRate = data.fireRate;
    this.ammunition = data.ammunition;
    this.upgrades = [...(data.upgrades || [])];
    this.stats = { ...(data.stats || {}) };
  }
}
```

#### Entity-Level Serialization

```javascript
class SaveGameManager {
  serializeEntity(entity) {
    const entityData = {
      type: entity.getGameObjectType(),
      x: entity.x,
      y: entity.y,
      name: entity.name,
      components: {}
    };
    
    // Serialize all components
    entity.getAllComponents().forEach(component => {
      entityData.components[component.constructor.name] = component.serialize();
    });
    
    return entityData;
  }
  
  deserializeEntity(scene, entityData) {
    // Recreate entity with original configuration
    const entity = new BaseEntity(scene, {
      type: entityData.type,
      x: entityData.x,
      y: entityData.y,
      name: entityData.name
    });
    
    // Restore components
    Object.entries(entityData.components).forEach(([componentName, componentData]) => {
      const ComponentClass = this.getComponentClass(componentName);
      const component = new ComponentClass();
      component.deserialize(componentData);
      entity.addComponent(component);
    });
    
    return entity;
  }
}
```

---

## System Design

Systems are the logic processors in the ECS architecture, responsible for implementing game behavior by operating on entities with specific components.

### Logic Processing

Systems follow a consistent pattern for processing entities:

#### Base System Pattern

```javascript
class BaseSystem {
  constructor() {
    this.name = this.constructor.name;
    this.enabled = true;
    this.priority = 0; // For system ordering
  }
  
  update(entities, delta) {
    if (!this.enabled) return;
    
    // Filter entities that have required components
    const relevantEntities = this.filterEntities(entities);
    
    // Process each relevant entity
    relevantEntities.forEach(entity => {
      this.processEntity(entity, delta);
    });
  }
  
  filterEntities(entities) {
    // Override in subclasses to filter relevant entities
    return entities.filter(entity => this.isRelevantEntity(entity));
  }
  
  isRelevantEntity(entity) {
    // Override in subclasses to define relevance criteria
    return entity.active;
  }
  
  processEntity(entity, delta) {
    // Override in subclasses to implement specific logic
  }
}
```

#### Real System Examples

**MovementSystem (Entity Positioning):**
```javascript
class MovementSystem extends BaseSystem {
  isRelevantEntity(entity) {
    return entity.active && entity.hasComponent(MovementComponent);
  }
  
  processEntity(entity, delta) {
    const movement = entity.getComponent(MovementComponent);
    
    // Update movement component data
    movement.update(delta);
    
    // Apply movement to entity position (if it has a GameObject)
    if (entity.gameObject) {
      entity.x += movement.velocityX * delta;
      entity.y += movement.velocityY * delta;
      
      // Handle boundary behavior
      this.handleBoundaries(entity, movement);
    }
    
    // Handle AI patterns
    if (movement.aiPattern) {
      this.updateAIPattern(entity, movement, delta);
    }
  }
  
  handleBoundaries(entity, movement) {
    const bounds = this.scene.cameras.main;
    
    switch (movement.boundaryBehavior) {
      case 'clamp':
        entity.x = Phaser.Math.Clamp(entity.x, 0, bounds.width);
        entity.y = Phaser.Math.Clamp(entity.y, 0, bounds.height);
        break;
      case 'wrap':
        if (entity.x < 0) entity.x = bounds.width;
        if (entity.x > bounds.width) entity.x = 0;
        if (entity.y < 0) entity.y = bounds.height;
        if (entity.y > bounds.height) entity.y = 0;
        break;
      case 'bounce':
        if (entity.x <= 0 || entity.x >= bounds.width) {
          movement.velocityX *= -1;
        }
        if (entity.y <= 0 || entity.y >= bounds.height) {
          movement.velocityY *= -1;
        }
        break;
      case 'destroy':
        if (entity.x < -50 || entity.x > bounds.width + 50 ||
            entity.y < -50 || entity.y > bounds.height + 50) {
          entity.destroy();
        }
        break;
    }
  }
}
```

**WeaponSystem (Complex Game Logic):**
```javascript
class WeaponSystem extends BaseSystem {
  constructor(scene) {
    super();
    this.scene = scene;
    this.objectPools = {
      playerProjectiles: new ObjectPool(() => new Projectile(scene), 100),
      enemyProjectiles: new ObjectPool(() => new Projectile(scene), 100)
    };
  }
  
  isRelevantEntity(entity) {
    return entity.active && entity.hasComponent(WeaponComponent);
  }
  
  processEntity(entity, delta) {
    const weapon = entity.getComponent(WeaponComponent);
    
    // Handle weapon firing logic
    if (entity === this.scene.player) {
      this.handlePlayerWeapon(entity, weapon);
    } else {
      this.handleEnemyWeapon(entity, weapon);
    }
    
    // Update weapon cooldowns
    weapon.lastFiredTime += delta * 1000;
  }
  
  handlePlayerWeapon(entity, weapon) {
    // Check for firing input (from input system)
    if (this.scene.inputState.weaponFiring && weapon.canFire(Date.now())) {
      this.createProjectile(entity, weapon, 'player');
      weapon.fire(Date.now());
    }
  }
  
  createProjectile(entity, weapon, team) {
    const pool = team === 'player' ? 
      this.objectPools.playerProjectiles : 
      this.objectPools.enemyProjectiles;
    
    const projectile = pool.get();
    if (projectile) {
      projectile.activate(
        entity.x,
        entity.y - entity.height / 2,
        0, // velocityX
        -weapon.projectileSpeed, // velocityY (upward)
        weapon.damage,
        team
      );
    }
  }
}
```

### Performance Considerations

Systems are designed with performance in mind:

#### Entity Filtering Optimization

```javascript
class OptimizedCollisionSystem extends BaseSystem {
  constructor(gridSize = 64) {
    super();
    this.gridSize = gridSize;
    this.spatialGrid = new Map();
    this.lastGridUpdate = 0;
  }
  
  update(entities, delta) {
    // Update spatial grid periodically, not every frame
    const now = Date.now();
    if (now - this.lastGridUpdate > 16) { // ~60fps grid updates
      this.updateSpatialGrid(entities);
      this.lastGridUpdate = now;
    }
    
    // Only check collisions for entities in populated grid cells
    this.checkCollisions(delta);
  }
  
  updateSpatialGrid(entities) {
    this.spatialGrid.clear();
    
    entities.forEach(entity => {
      if (entity.hasComponent(CollisionComponent)) {
        const gridX = Math.floor(entity.x / this.gridSize);
        const gridY = Math.floor(entity.y / this.gridSize);
        const key = `${gridX},${gridY}`;
        
        if (!this.spatialGrid.has(key)) {
          this.spatialGrid.set(key, []);
        }
        this.spatialGrid.get(key).push(entity);
      }
    });
  }
}
```

#### Component Caching

```javascript
class CachedHealthSystem extends BaseSystem {
  constructor() {
    super();
    this.healthComponents = new Map(); // Cache component lookups
  }
  
  processEntity(entity, delta) {
    // Cache component lookup
    let health = this.healthComponents.get(entity.entityId);
    if (!health) {
      health = entity.getComponent(HealthComponent);
      if (health) {
        this.healthComponents.set(entity.entityId, health);
      }
    }
    
    if (health) {
      this.updateHealth(entity, health, delta);
    }
  }
  
  onEntityDestroyed(entity) {
    // Clean up cache when entities are destroyed
    this.healthComponents.delete(entity.entityId);
  }
}
```

### System Integration

Systems work together through the EventBus and shared entity state:

#### EventBus Integration

```javascript
class CombatSystem extends BaseSystem {
  constructor(scene) {
    super();
    this.scene = scene;
    this.eventBus = getEventBus();
    
    // Listen for collision events
    this.eventBus.on(EventTypes.COLLISION_START, this.handleCollision, this);
  }
  
  handleCollision(event) {
    const { entityA, entityB } = event;
    
    // Process damage between entities
    this.processDamage(entityA, entityB);
    this.processDamage(entityB, entityA);
  }
  
  processDamage(attacker, target) {
    const attackerCollision = attacker.getComponent(CollisionComponent);
    const targetHealth = target.getComponent(HealthComponent);
    
    if (attackerCollision?.dealsDamage && targetHealth?.canTakeDamage()) {
      targetHealth.takeDamage(attackerCollision.damageAmount, attacker.name);
      
      // Emit damage event for other systems
      this.eventBus.emit(EventTypes.DAMAGE_DEALT, {
        attacker,
        target,
        damage: attackerCollision.damageAmount,
        timestamp: Date.now()
      });
    }
  }
}
```

#### System Coordination

```javascript
class GameScene extends Phaser.Scene {
  create() {
    // Initialize systems in dependency order
    this.systems = [
      new InputSystem(this),      // 1. Process input first
      new MovementSystem(this),   // 2. Update positions
      new CollisionSystem(this),  // 3. Check collisions
      new CombatSystem(this),     // 4. Process combat
      new HealthSystem(this),     // 5. Update health
      new RenderSystem(this)      // 6. Update visuals last
    ];
    
    // Sort systems by priority if needed
    this.systems.sort((a, b) => a.priority - b.priority);
  }
  
  update(time, delta) {
    // Update all systems in order
    this.systems.forEach(system => {
      if (system.enabled) {
        system.update(this.entities, delta / 1000); // Convert to seconds
      }
    });
  }
}
```

---

## Advanced Patterns

### EventBus Integration

The EventBus provides a centralized communication system that enables loose coupling between game systems:

#### EventBus Architecture

```javascript
// Singleton EventBus implementation
class EventBus extends Phaser.Events.EventEmitter {
  constructor() {
    super();
    this.eventHistory = [];
    this.maxHistorySize = 1000;
  }
  
  emit(event, ...args) {
    // Record event for debugging
    this.eventHistory.push({
      event,
      args,
      timestamp: Date.now()
    });
    
    // Trim history to prevent memory leaks
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
    
    return super.emit(event, ...args);
  }
}

// Singleton access
let eventBusInstance = null;
export function getEventBus() {
  if (!eventBusInstance) {
    eventBusInstance = new EventBus();
  }
  return eventBusInstance;
}
```

#### Event Types and Patterns

```javascript
// Centralized event type definitions
export const EventTypes = {
  // Input Events
  PLAYER_INPUT: 'player_input',
  INPUT_KEY_DOWN: 'input_key_down',
  INPUT_KEY_UP: 'input_key_up',
  
  // Game State Events
  GAME_STATE_CHANGED: 'game_state_changed',
  LEVEL_UP: 'level_up',
  SCORE_CHANGED: 'score_changed',
  
  // Combat Events
  COLLISION_START: 'collision_start',
  COLLISION_END: 'collision_end',
  DAMAGE_DEALT: 'damage_dealt',
  ENTITY_DESTROYED: 'entity_destroyed',
  
  // System Events
  WEAPON_FIRED: 'weapon_fired',
  ENEMY_SPAWNED: 'enemy_spawned',
  POWERUP_COLLECTED: 'powerup_collected'
};
```

#### Event-Driven System Communication

```javascript
class ScoreSystem extends BaseSystem {
  constructor() {
    super();
    this.eventBus = getEventBus();
    this.score = 0;
    
    // Listen for score-affecting events
    this.eventBus.on(EventTypes.DAMAGE_DEALT, this.onDamageDealt, this);
    this.eventBus.on(EventTypes.ENTITY_DESTROYED, this.onEntityDestroyed, this);
    this.eventBus.on(EventTypes.POWERUP_COLLECTED, this.onPowerupCollected, this);
  }
  
  onDamageDealt(event) {
    if (event.attacker.name === 'player') {
      this.addScore(event.damage * 10);
    }
  }
  
  onEntityDestroyed(event) {
    if (event.entity.hasComponent(EnemyComponent)) {
      const enemyType = event.entity.getComponent(EnemyComponent).type;
      const baseScore = { scout: 100, fighter: 200, bomber: 500 }[enemyType] || 50;
      this.addScore(baseScore);
    }
  }
  
  addScore(points) {
    this.score += points;
    
    // Emit score change event for UI updates
    this.eventBus.emit(EventTypes.SCORE_CHANGED, {
      newScore: this.score,
      pointsAdded: points,
      timestamp: Date.now()
    });
  }
}
```

### Input Adapter Pattern

The adapter pattern provides a clean abstraction for different input types:

#### BaseAdapter Foundation

```javascript
class BaseAdapter {
  constructor(scene) {
    this.scene = scene;
    this.eventBus = getEventBus();
    this.active = false;
  }
  
  activate() {
    this.active = true;
    // Override in subclasses to setup input listeners
  }
  
  deactivate() {
    this.active = false;
    // Override in subclasses to cleanup input listeners
  }
  
  destroy() {
    this.deactivate();
    // Override in subclasses for additional cleanup
  }
  
  // Helper method for structured event emission
  emitInputEvent(eventType, data) {
    this.eventBus.emit(eventType, {
      timestamp: performance.now(),
      source: this.constructor.name,
      ...data
    });
  }
}
```

#### KeyboardInputAdapter Implementation

```javascript
class KeyboardInputAdapter extends BaseAdapter {
  constructor(scene) {
    super(scene);
    
    this.inputState = {
      movement: { x: 0, y: 0 },
      keys: new Set(),
      weaponFiring: false
    };
    
    this.movementKeys = {
      'KeyW': { x: 0, y: -1 },
      'KeyA': { x: -1, y: 0 },
      'KeyS': { x: 0, y: 1 },
      'KeyD': { x: 1, y: 0 },
      'ArrowUp': { x: 0, y: -1 },
      'ArrowLeft': { x: -1, y: 0 },
      'ArrowDown': { x: 0, y: 1 },
      'ArrowRight': { x: 1, y: 0 }
    };
  }
  
  activate() {
    super.activate();
    
    // Setup Phaser keyboard event listeners
    this.scene.input.keyboard.on('keydown', this.onKeyDown, this);
    this.scene.input.keyboard.on('keyup', this.onKeyUp, this);
  }
  
  onKeyDown(event) {
    const keyCode = event.code;
    
    if (!this.inputState.keys.has(keyCode)) {
      this.inputState.keys.add(keyCode);
      
      // Handle movement keys
      if (this.movementKeys[keyCode]) {
        this.updateMovementState();
      }
      
      // Handle weapon firing
      if (keyCode === 'Space') {
        this.inputState.weaponFiring = true;
        this.emitPlayerInput('weapon_fire', {
          state: 'start',
          weapon: 'current'
        });
      }
      
      // Emit raw key event for other systems
      this.emitInputEvent(EventTypes.INPUT_KEY_DOWN, {
        keyCode,
        originalEvent: event
      });
    }
  }
  
  updateMovementState() {
    let x = 0, y = 0;
    
    // Accumulate movement from all pressed keys
    for (const keyCode of this.inputState.keys) {
      if (this.movementKeys[keyCode]) {
        const direction = this.movementKeys[keyCode];
        x += direction.x;
        y += direction.y;
      }
    }
    
    // Normalize diagonal movement
    if (x !== 0 && y !== 0) {
      const length = Math.sqrt(x * x + y * y);
      x /= length;
      y /= length;
    }
    
    this.inputState.movement = { x, y };
    
    // Emit structured movement event
    this.emitPlayerInput('movement', {
      direction: this.inputState.movement,
      keys: Array.from(this.inputState.keys),
      intensity: Math.sqrt(x * x + y * y)
    });
  }
  
  emitPlayerInput(action, data) {
    this.emitInputEvent(EventTypes.PLAYER_INPUT, {
      action,
      ...data
    });
  }
}
```

#### Multi-Platform Input Support

```javascript
class InputManager {
  constructor(scene) {
    this.scene = scene;
    this.adapters = new Map();
    this.activeAdapter = null;
  }
  
  registerAdapter(name, adapter) {
    this.adapters.set(name, adapter);
  }
  
  activateAdapter(name) {
    // Deactivate current adapter
    if (this.activeAdapter) {
      this.activeAdapter.deactivate();
    }
    
    // Activate new adapter
    const adapter = this.adapters.get(name);
    if (adapter) {
      adapter.activate();
      this.activeAdapter = adapter;
    }
  }
  
  setupAdapters() {
    // Register all available input adapters
    this.registerAdapter('keyboard', new KeyboardInputAdapter(this.scene));
    this.registerAdapter('gamepad', new GamepadInputAdapter(this.scene));
    this.registerAdapter('touch', new TouchInputAdapter(this.scene));
    
    // Auto-detect primary input method
    this.detectPrimaryInput();
  }
  
  detectPrimaryInput() {
    if (this.scene.input.gamepad.total > 0) {
      this.activateAdapter('gamepad');
    } else if ('ontouchstart' in window) {
      this.activateAdapter('touch');
    } else {
      this.activateAdapter('keyboard');
    }
  }
}
```

### Object Pooling

Object pooling prevents garbage collection pauses by reusing objects:

#### Generic ObjectPool Implementation

```javascript
class ObjectPool {
  constructor(createFn, resetFn = null, initialSize = 10, maxSize = 100) {
    this.createFn = createFn;
    this.resetFn = resetFn || ((obj) => { if (obj.reset) obj.reset(); });
    this.pool = [];
    this.active = new Set();
    this.maxSize = maxSize;
    
    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }
  
  get() {
    let obj;
    
    if (this.pool.length > 0) {
      obj = this.pool.pop();
    } else {
      obj = this.createFn();
    }
    
    this.active.add(obj);
    return obj;
  }
  
  release(obj) {
    if (this.active.has(obj)) {
      this.active.delete(obj);
      
      // Reset object state
      this.resetFn(obj);
      
      // Return to pool if not at max capacity
      if (this.pool.length < this.maxSize) {
        this.pool.push(obj);
      }
    }
  }
  
  releaseAll() {
    for (const obj of this.active) {
      this.resetFn(obj);
      if (this.pool.length < this.maxSize) {
        this.pool.push(obj);
      }
    }
    this.active.clear();
  }
  
  // Pool statistics
  get activeCount() { return this.active.size; }
  get pooledCount() { return this.pool.length; }
  get totalCount() { return this.activeCount + this.pooledCount; }
}
```

#### Projectile Pooling Example

```javascript
class ProjectilePool {
  constructor(scene, poolSize = 100) {
    this.scene = scene;
    
    this.pool = new ObjectPool(
      () => this.createProjectile(),
      (projectile) => this.resetProjectile(projectile),
      poolSize
    );
  }
  
  createProjectile() {
    const projectile = new BaseEntity(this.scene, {
      type: 'rectangle',
      x: 0, y: 0,
      width: 8, height: 16,
      color: 0xffff00,
      name: 'projectile'
    });
    
    projectile.addComponent(new MovementComponent(400))
           .addComponent(new CollisionComponent('projectile'))
           .addComponent(new DamageComponent(25));
    
    // Initially inactive
    projectile.active = false;
    projectile.visible = false;
    
    return projectile;
  }
  
  resetProjectile(projectile) {
    projectile.active = false;
    projectile.visible = false;
    projectile.x = 0;
    projectile.y = 0;
    
    // Reset components
    const movement = projectile.getComponent(MovementComponent);
    if (movement) {
      movement.stop();
    }
  }
  
  fireProjectile(x, y, velocityX, velocityY, damage, team) {
    const projectile = this.pool.get();
    
    if (projectile) {
      // Configure projectile
      projectile.x = x;
      projectile.y = y;
      projectile.active = true;
      projectile.visible = true;
      
      // Configure components
      const movement = projectile.getComponent(MovementComponent);
      movement.setVelocity(velocityX, velocityY);
      
      const collision = projectile.getComponent(CollisionComponent);
      collision.setLayer(`${team}Projectile`);
      
      const damage = projectile.getComponent(DamageComponent);
      damage.amount = damage;
      
      return projectile;
    }
    
    return null;
  }
  
  returnProjectile(projectile) {
    this.pool.release(projectile);
  }
}
```

---

## Implementation Examples

### Complete Entity Implementation

Here's a complete example showing how to implement a complex entity using all the architectural patterns:

```javascript
class Enemy extends BaseEntity {
  constructor(scene, x, y, enemyType = 'scout') {
    // Use flexible configuration for different enemy types
    const config = Enemy.getTypeConfig(enemyType, x, y);
    super(scene, config);
    
    this.enemyType = enemyType;
    this.aiState = 'spawning';
    this.target = null;
    
    // Add components based on enemy type
    this.setupComponents(config);
    
    // Enable physics if GameObject exists
    if (this.gameObject) {
      this.enablePhysics('dynamic');
      this.setDepth(10);
    }
    
    // Listen for game events
    this.setupEventListeners();
    
    Logger.debug(`Created ${enemyType} enemy at (${x}, ${y})`);
  }
  
  static getTypeConfig(type, x, y) {
    const configs = {
      scout: {
        type: 'rectangle',
        x, y, width: 32, height: 32,
        color: 0xff4400,
        name: 'scout-enemy',
        health: 50,
        speed: 200,
        damage: 10,
        aiPattern: 'straight'
      },
      fighter: {
        type: 'rectangle',
        x, y, width: 48, height: 48,
        color: 0xff0000,
        name: 'fighter-enemy',
        health: 100,
        speed: 150,
        damage: 25,
        aiPattern: 'chase'
      },
      bomber: {
        type: 'rectangle',
        x, y, width: 64, height: 64,
        color: 0x880000,
        name: 'bomber-enemy',
        health: 200,
        speed: 80,
        damage: 50,
        aiPattern: 'formation'
      },
      // Future sprite version
      'scout-sprite': {
        type: 'sprite',
        x, y,
        texture: 'enemy-scout',
        frame: 0,
        name: 'scout-enemy',
        health: 50,
        speed: 200,
        damage: 10,
        aiPattern: 'straight'
      }
    };
    
    return configs[type] || configs.scout;
  }
  
  setupComponents(config) {
    // Core components
    this.addComponent(new HealthComponent(config.health))
        .addComponent(new MovementComponent(config.speed))
        .addComponent(new CollisionComponent('enemy'))
        .addComponent(new WeaponComponent('enemy-basic'));
    
    // Configure components
    const movement = this.getComponent(MovementComponent);
    movement.setAIPattern(config.aiPattern);
    movement.setBoundaryBehavior('destroy');
    
    const collision = this.getComponent(CollisionComponent);
    collision.setTargetLayers(['player', 'playerProjectile']);
    collision.setDealsDamage(true, config.damage);
    collision.setReceivesDamage(true);
    
    const weapon = this.getComponent(WeaponComponent);
    weapon.configure({
      damage: config.damage,
      fireRate: 1000 + Math.random() * 1000, // Vary fire rate
      range: 300
    });
  }
  
  setupEventListeners() {
    const eventBus = getEventBus();
    
    // Listen for player events to set target
    eventBus.on(EventTypes.PLAYER_INPUT, (event) => {
      if (event.action === 'movement' && this.scene.player) {
        this.target = this.scene.player;
      }
    });
    
    // React to taking damage
    eventBus.on(EventTypes.DAMAGE_DEALT, (event) => {
      if (event.target === this) {
        this.onTakeDamage(event);
      }
    });
  }
  
  update(delta) {
    super.update(delta);
    
    // Update AI state machine
    this.updateAI(delta);
    
    // Check if should fire weapon
    this.updateWeapon(delta);
    
    // Check health status
    const health = this.getComponent(HealthComponent);
    if (health && !health.isAlive()) {
      this.onDestroyed();
    }
  }
  
  updateAI(delta) {
    const movement = this.getComponent(MovementComponent);
    
    switch (this.aiState) {
      case 'spawning':
        // Brief pause after spawning
        this.aiStateTimer = (this.aiStateTimer || 0) + delta;
        if (this.aiStateTimer > 0.5) {
          this.aiState = 'active';
          this.aiStateTimer = 0;
        }
        break;
        
      case 'active':
        if (this.target && movement) {
          // Update AI pattern based on target
          movement.updateAI(delta, this, this.target);
        }
        break;
        
      case 'fleeing':
        // Move away from player
        if (this.target && movement) {
          const dx = this.x - this.target.x;
          const dy = this.y - this.target.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            movement.setVelocity(
              (dx / distance) * movement.maxSpeed,
              (dy / distance) * movement.maxSpeed
            );
          }
        }
        break;
    }
  }
  
  updateWeapon(delta) {
    const weapon = this.getComponent(WeaponComponent);
    
    if (weapon && this.target && this.aiState === 'active') {
      const distance = Phaser.Math.Distance.Between(
        this.x, this.y,
        this.target.x, this.target.y
      );
      
      // Fire if target is in range
      if (distance < weapon.range && weapon.canFire(Date.now())) {
        this.fireAtTarget();
        weapon.fire(Date.now());
      }
    }
  }
  
  fireAtTarget() {
    const eventBus = getEventBus();
    
    // Calculate firing direction
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const weapon = this.getComponent(WeaponComponent);
      
      eventBus.emit(EventTypes.WEAPON_FIRED, {
        shooter: this,
        x: this.x,
        y: this.y + this.height / 2,
        velocityX: (dx / distance) * weapon.projectileSpeed,
        velocityY: (dy / distance) * weapon.projectileSpeed,
        damage: weapon.damage,
        team: 'enemy'
      });
    }
  }
  
  onTakeDamage(event) {
    const health = this.getComponent(HealthComponent);
    
    // Visual feedback for damage
    if (this.gameObject) {
      this.scene.tweens.add({
        targets: this.gameObject,
        alpha: 0.5,
        duration: 100,
        yoyo: true,
        repeat: 1
      });
    }
    
    // AI state change based on health
    if (health && health.getHealthPercentage() < 0.3) {
      this.aiState = 'fleeing';
    }
  }
  
  onDestroyed() {
    const eventBus = getEventBus();
    
    // Emit destruction event for score system
    eventBus.emit(EventTypes.ENTITY_DESTROYED, {
      entity: this,
      enemyType: this.enemyType,
      position: { x: this.x, y: this.y },
      timestamp: Date.now()
    });
    
    // Create destruction effect
    this.createDestructionEffect();
    
    // Clean up
    this.destroy();
  }
  
  createDestructionEffect() {
    // Visual effect for destruction
    if (this.scene) {
      this.scene.add.circle(this.x, this.y, 2, 0xffff00)
        .setAlpha(1)
        .setScale(1);
      
      this.scene.tweens.add({
        targets: this.scene.children.list[this.scene.children.list.length - 1],
        scaleX: 10,
        scaleY: 10,
        alpha: 0,
        duration: 300,
        onComplete: (tween) => {
          tween.targets[0].destroy();
        }
      });
    }
  }
  
  // Example of runtime GameObject type change
  upgradeToSprite() {
    if (this.enemyType === 'scout') {
      Logger.info('Upgrading scout enemy to sprite version');
      
      this.changeGameObjectType('sprite', {
        texture: 'enemy-scout-upgraded',
        frame: 0
      });
      
      // Update enemy stats for upgraded version
      const health = this.getComponent(HealthComponent);
      if (health) {
        health.maxHealth = 75;
        health.currentHealth = 75;
      }
    }
  }
}
```

### Complete System Implementation

```javascript
class EnemyAISystem extends BaseSystem {
  constructor(scene) {
    super();
    this.scene = scene;
    this.eventBus = getEventBus();
    
    // Formation patterns
    this.formations = {
      line: { spacing: 60, pattern: 'horizontal' },
      v: { spacing: 50, pattern: 'v-formation' },
      circle: { radius: 100, pattern: 'circular' }
    };
    
    this.currentFormation = 'line';
    this.formationCenter = { x: 400, y: 100 };
  }
  
  isRelevantEntity(entity) {
    return entity.active && 
           entity instanceof Enemy && 
           entity.hasComponent(MovementComponent);
  }
  
  update(entities, delta) {
    const enemies = this.filterEntities(entities);
    
    // Update formation center based on player position
    this.updateFormationCenter();
    
    // Process each enemy
    enemies.forEach((enemy, index) => {
      this.processEnemyAI(enemy, index, enemies.length, delta);
    });
  }
  
  updateFormationCenter() {
    if (this.scene.player) {
      // Formation follows player with offset
      this.formationCenter.x = this.scene.player.x;
      this.formationCenter.y = Math.max(100, this.scene.player.y - 200);
    }
  }
  
  processEnemyAI(enemy, index, totalEnemies, delta) {
    const movement = enemy.getComponent(MovementComponent);
    if (!movement) return;
    
    switch (movement.aiPattern) {
      case 'formation':
        this.updateFormationMovement(enemy, movement, index, totalEnemies);
        break;
      case 'chase':
        this.updateChaseMovement(enemy, movement);
        break;
      case 'patrol':
        this.updatePatrolMovement(enemy, movement, delta);
        break;
      case 'straight':
        this.updateStraightMovement(enemy, movement);
        break;
      default:
        // Default behavior
        movement.setVelocity(0, 50); // Slow downward movement
    }
  }
  
  updateFormationMovement(enemy, movement, index, totalEnemies) {
    const formation = this.formations[this.currentFormation];
    let targetX, targetY;
    
    switch (formation.pattern) {
      case 'horizontal':
        targetX = this.formationCenter.x + 
                  (index - totalEnemies / 2) * formation.spacing;
        targetY = this.formationCenter.y;
        break;
        
      case 'v-formation':
        const side = index % 2 === 0 ? -1 : 1;
        const row = Math.floor(index / 2);
        targetX = this.formationCenter.x + side * row * formation.spacing;
        targetY = this.formationCenter.y + row * formation.spacing * 0.5;
        break;
        
      case 'circular':
        const angle = (index / totalEnemies) * Math.PI * 2;
        targetX = this.formationCenter.x + Math.cos(angle) * formation.radius;
        targetY = this.formationCenter.y + Math.sin(angle) * formation.radius;
        break;
    }
    
    // Move towards formation position
    const dx = targetX - enemy.x;
    const dy = targetY - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 10) { // Dead zone to prevent jitter
      movement.setVelocity(
        (dx / distance) * movement.maxSpeed * 0.5,
        (dy / distance) * movement.maxSpeed * 0.5
      );
    } else {
      movement.setVelocity(0, 0);
    }
  }
  
  updateChaseMovement(enemy, movement) {
    if (!this.scene.player) return;
    
    const dx = this.scene.player.x - enemy.x;
    const dy = this.scene.player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      // Chase with some randomness to avoid clustering
      const randomOffset = {
        x: (Math.random() - 0.5) * 50,
        y: (Math.random() - 0.5) * 50
      };
      
      movement.setVelocity(
        ((dx + randomOffset.x) / distance) * movement.maxSpeed * 0.7,
        ((dy + randomOffset.y) / distance) * movement.maxSpeed * 0.7
      );
    }
  }
  
  updatePatrolMovement(enemy, movement, delta) {
    // Initialize patrol data if needed
    if (!movement.patternData.patrol) {
      movement.patternData.patrol = {
        direction: Math.random() > 0.5 ? 1 : -1,
        changeTimer: 0,
        changeInterval: 2 + Math.random() * 3
      };
    }
    
    const patrol = movement.patternData.patrol;
    patrol.changeTimer += delta;
    
    // Change direction periodically
    if (patrol.changeTimer > patrol.changeInterval) {
      patrol.direction *= -1;
      patrol.changeTimer = 0;
      patrol.changeInterval = 2 + Math.random() * 3;
    }
    
    movement.setVelocity(
      patrol.direction * movement.maxSpeed * 0.3,
      movement.maxSpeed * 0.2 // Slow downward drift
    );
  }
  
  updateStraightMovement(enemy, movement) {
    // Simple straight-line movement
    if (!movement.patternData.straight) {
      movement.patternData.straight = {
        velocityX: (Math.random() - 0.5) * movement.maxSpeed * 0.3,
        velocityY: movement.maxSpeed * 0.5
      };
    }
    
    const straight = movement.patternData.straight;
    movement.setVelocity(straight.velocityX, straight.velocityY);
  }
  
  // Formation management methods
  setFormation(formationType) {
    if (this.formations[formationType]) {
      this.currentFormation = formationType;
      
      // Emit formation change event
      this.eventBus.emit(EventTypes.FORMATION_CHANGED, {
        formation: formationType,
        center: this.formationCenter
      });
    }
  }
  
  cycleFormation() {
    const formations = Object.keys(this.formations);
    const currentIndex = formations.indexOf(this.currentFormation);
    const nextIndex = (currentIndex + 1) % formations.length;
    this.setFormation(formations[nextIndex]);
  }
}
```

### Complete Scene Integration

```javascript
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    
    this.entities = [];
    this.systems = [];
    this.objectPools = {};
    this.inputAdapter = null;
  }
  
  create() {
    // Initialize EventBus
    this.eventBus = getEventBus();
    
    // Setup object pools
    this.setupObjectPools();
    
    // Initialize input adapter
    this.setupInput();
    
    // Create player entity
    this.createPlayer();
    
    // Initialize all systems
    this.setupSystems();
    
    // Setup UI
    this.setupUI();
    
    // Listen for game events
    this.setupEventListeners();
    
    Logger.info('GameScene created with ECS architecture');
  }
  
  setupObjectPools() {
    this.objectPools = {
      playerProjectiles: new ObjectPool(
        () => this.createProjectile('player'),
        (projectile) => this.resetProjectile(projectile),
        100
      ),
      enemyProjectiles: new ObjectPool(
        () => this.createProjectile('enemy'),
        (projectile) => this.resetProjectile(projectile),
        100
      ),
      enemies: new ObjectPool(
        () => new Enemy(this, 0, 0, 'scout'),
        (enemy) => this.resetEnemy(enemy),
        50
      )
    };
  }
  
  setupInput() {
    this.inputAdapter = new KeyboardInputAdapter(this);
    this.inputAdapter.activate();
  }
  
  createPlayer() {
    this.player = new BaseEntity(this, 400, 500, 64, 64, 0x0099ff, 'player');
    this.player
      .addComponent(new HealthComponent(100))
      .addComponent(new MovementComponent(300))
      .addComponent(new WeaponComponent('laser'))
      .addComponent(new CollisionComponent('player'));
    
    // Configure player components
    const collision = this.player.getComponent(CollisionComponent);
    collision.setTargetLayers(['enemy', 'enemyProjectile']);
    collision.setReceivesDamage(true);
    
    this.entities.push(this.player);
  }
  
  setupSystems() {
    // Initialize systems in dependency order
    this.systems = [
      new MovementSystem(this),
      new CollisionSystem(this, 64), // 64px spatial grid
      new WeaponSystem(this),
      new EnemyAISystem(this),
      new HealthSystem(this),
      new EnemySpawnSystem(this)
    ];
    
    // Sort by priority if needed
    this.systems.sort((a, b) => (a.priority || 0) - (b.priority || 0));
  }
  
  setupUI() {
    this.uiElements = {
      healthBar: this.createHealthBar(),
      scoreText: this.createScoreText(),
      debugInfo: this.createDebugInfo()
    };
  }
  
  setupEventListeners() {
    // Player input handling
    this.eventBus.on(EventTypes.PLAYER_INPUT, this.handlePlayerInput, this);
    
    // Weapon firing
    this.eventBus.on(EventTypes.WEAPON_FIRED, this.handleWeaponFired, this);
    
    // Entity destruction
    this.eventBus.on(EventTypes.ENTITY_DESTROYED, this.handleEntityDestroyed, this);
    
    // Score changes
    this.eventBus.on(EventTypes.SCORE_CHANGED, this.handleScoreChanged, this);
  }
  
  handlePlayerInput(event) {
    if (event.action === 'movement') {
      const movement = this.player.getComponent(MovementComponent);
      if (movement) {
        movement.setVelocity(
          event.direction.x * movement.maxSpeed,
          event.direction.y * movement.maxSpeed
        );
      }
    }
  }
  
  handleWeaponFired(event) {
    const pool = event.team === 'player' ? 
      this.objectPools.playerProjectiles : 
      this.objectPools.enemyProjectiles;
    
    const projectile = pool.get();
    if (projectile) {
      projectile.x = event.x;
      projectile.y = event.y;
      projectile.active = true;
      projectile.visible = true;
      
      const movement = projectile.getComponent(MovementComponent);
      movement.setVelocity(event.velocityX, event.velocityY);
      
      this.entities.push(projectile);
    }
  }
  
  update(time, delta) {
    const deltaSeconds = delta / 1000;
    
    // Update all systems
    this.systems.forEach(system => {
      if (system.enabled) {
        system.update(this.entities, deltaSeconds);
      }
    });
    
    // Clean up destroyed entities
    this.entities = this.entities.filter(entity => {
      if (!entity.active || entity.pendingDestroy) {
        this.cleanupEntity(entity);
        return false;
      }
      return true;
    });
    
    // Update UI
    this.updateUI();
  }
  
  cleanupEntity(entity) {
    // Return pooled objects to their pools
    if (entity.poolType) {
      const pool = this.objectPools[entity.poolType];
      if (pool) {
        pool.release(entity);
        return;
      }
    }
    
    // Regular cleanup
    entity.destroy();
  }
  
  updateUI() {
    if (this.player) {
      const health = this.player.getComponent(HealthComponent);
      if (health && this.uiElements.healthBar) {
        this.updateHealthBar(health.getHealthPercentage());
      }
    }
  }
  
  destroy() {
    // Clean up input adapter
    if (this.inputAdapter) {
      this.inputAdapter.destroy();
    }
    
    // Clean up all entities
    this.entities.forEach(entity => entity.destroy());
    this.entities = [];
    
    // Clean up object pools
    Object.values(this.objectPools).forEach(pool => {
      pool.releaseAll();
    });
    
    // Remove event listeners
    this.eventBus.removeAllListeners();
    
    super.destroy();
  }
}
```

---

## Best Practices

### Entity Design

1. **Favor Composition**: Use components to define entity capabilities rather than inheritance
2. **Component Responsibility**: Keep components focused on single concerns
3. **GameObject Flexibility**: Use appropriate GameObject types for different entity needs
4. **Null-Safe Design**: Design entities to work with or without visual representation

### Component Design

1. **Data-Centric**: Components should primarily contain data, not behavior
2. **Serializable**: Design components to support save/load functionality
3. **Minimal Dependencies**: Components should not directly reference other components
4. **Clear Interfaces**: Provide clear methods for data access and manipulation

### System Design

1. **Single Responsibility**: Each system should handle one aspect of game logic
2. **Performance Aware**: Use efficient filtering and processing patterns
3. **Event-Driven**: Use EventBus for system communication rather than direct references
4. **Order Independence**: Systems should not depend on execution order when possible

### Performance Optimization

1. **Object Pooling**: Use pools for frequently created/destroyed objects
2. **Spatial Partitioning**: Use spatial grids for collision detection
3. **Component Caching**: Cache component lookups where appropriate
4. **Efficient Filtering**: Filter entities efficiently using appropriate data structures

### Testing Strategies

1. **Component Testing**: Test component data manipulation independently
2. **System Logic Testing**: Test system logic with mock entities
3. **Integration Testing**: Test complete entity-component-system interactions
4. **Performance Testing**: Monitor and test performance characteristics

---

## Migration Guide

### From Legacy to Flexible BaseEntity

**Step 1: Update Entity Creation**
```javascript
// OLD: Direct rectangle creation
const entity = new BaseEntity(scene, x, y, width, height, color);

// NEW: Flexible configuration (backward compatible)
const entity = new BaseEntity(scene, x, y, width, height, color); // Still works!

// OR: New configuration object approach
const entity = new BaseEntity(scene, {
  type: 'rectangle',
  x, y, width, height, color,
  name: 'entity-name'
});
```

**Step 2: Prepare for Sprite Transition**
```javascript
// Plan for easy sprite transition
const entity = new BaseEntity(scene, {
  type: 'rectangle', // Development
  x: 100, y: 100,
  width: 64, height: 64,
  color: 0x0099ff,
  name: 'player',
  // Add future sprite configuration
  futureSprite: {
    texture: 'player-sprite',
    frame: 0
  }
});

// Later, easy transition:
// entity.changeGameObjectType('sprite', entity.config.futureSprite);
```

**Step 3: Add Runtime Type Switching**
```javascript
// Add methods for dynamic type changes
class Player extends BaseEntity {
  activatePowerUp() {
    // Visual feedback through type change
    this.changeGameObjectType('circle', {
      radius: 40,
      color: 0x00ffff
    });
  }
  
  deactivatePowerUp() {
    // Return to original type
    this.changeGameObjectType('rectangle', {
      width: 64, height: 64,
      color: 0x0099ff
    });
  }
}
```

### From Manual Logger Init to Auto-Init

**Step 1: Remove Manual Initialization**
```javascript
// OLD: Manual initialization required
Logger.init();
Logger.debug('Debug message');

// NEW: Auto-initialization (manual init still works)
Logger.debug('Debug message'); // Works immediately!
```

**Step 2: Update Import Paths**
```javascript
// Update import if Logger moved
import Logger from '@/utils/Logger.js'; // New location
// import Logger from '@/core/Logger.js'; // Old location
```

**Step 3: Leverage Enhanced Features**
```javascript
// Use new performance methods without setup
Logger.time('operation');
// ... some operation ...
Logger.timeEnd('operation');

// Use table display
Logger.table([
  { entity: 'Player', health: 100 },
  { entity: 'Enemy', health: 50 }
]);
```

### From Direct Input to Adapter Pattern

**Step 1: Replace Direct Input Handling**
```javascript
// OLD: Direct Phaser input in GameScene
this.cursors = this.input.keyboard.createCursorKeys();
this.wasdKeys = this.input.keyboard.addKeys('W,S,A,D');

// NEW: Use InputAdapter
this.inputAdapter = new KeyboardInputAdapter(this);
this.inputAdapter.activate();
```

**Step 2: Convert to Event-Driven**
```javascript
// OLD: Direct input polling in update()
if (this.cursors.left.isDown) {
  this.player.x -= this.player.speed * delta;
}

// NEW: Event-driven handling
this.eventBus.on(EventTypes.PLAYER_INPUT, (event) => {
  if (event.action === 'movement') {
    const movement = this.player.getComponent(MovementComponent);
    movement.setVelocity(
      event.direction.x * movement.maxSpeed,
      event.direction.y * movement.maxSpeed
    );
  }
});
```

**Step 3: Add Multi-Platform Support**
```javascript
// Future: Easy to add other input types
this.inputManager = new InputManager(this);
this.inputManager.setupAdapters(); // Auto-detects input type
```

### From Minimal to Comprehensive Testing

**Step 1: Add Architectural Tests**
```javascript
// Add tests for core components
describe('BaseEntity Flexibility', () => {
  it('should support all GameObject types', () => {
    const types = ['rectangle', 'sprite', 'circle', 'text', null];
    types.forEach(type => {
      const entity = createTestEntity(type);
      expect(entity.getGameObjectType()).toBe(type);
    });
  });
});
```

**Step 2: Add Component Tests**
```javascript
// Test component serialization
describe('Component Serialization', () => {
  it('should serialize and deserialize correctly', () => {
    const component = new HealthComponent(100);
    component.takeDamage(25);
    
    const data = component.serialize();
    const newComponent = new HealthComponent();
    newComponent.deserialize(data);
    
    expect(newComponent.currentHealth).toBe(75);
  });
});
```

**Step 3: Add System Tests**
```javascript
// Test system logic with mocks
describe('MovementSystem', () => {
  it('should update entity positions', () => {
    const mockEntity = createMockEntity();
    const system = new MovementSystem();
    
    system.processEntity(mockEntity, 0.016); // ~60fps
    
    expect(mockEntity.x).toBeGreaterThan(initialX);
  });
});
```

This comprehensive ECS Architecture Guide provides all the information needed to understand, implement, and extend the Space Shooter's sophisticated entity-component-system architecture with flexible GameObject support, auto-initializing systems, and event-driven patterns.