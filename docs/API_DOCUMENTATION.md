# Space Shooter API Documentation

This document provides comprehensive API documentation for the Space Shooter game's architecture, systems, and components.

## Table of Contents

- [Core Architecture](#core-architecture)
  - [Logger BaseSystem](#logger-system)
  - [Environment Configuration](#environment-configuration)
- [BaseEntity BaseComponent BaseSystem](#entity-component-system)
  - [BaseEntity API](#entity-api)
  - [BaseComponent API](#component-api)
  - [BaseSystem API](#system-api)
- [Scene Management](#scene-management)
- [BaseEntity Types](#entity-types)
- [Game State Management](#game-state-management)
- [Performance Optimization](#performance-optimization)
- [Development Graphics](#development-graphics)
- [Usage Examples](#usage-examples)

---

## Core Architecture

### Logger BaseSystem

**Location**: `src/core/Logger.js`

Environment-aware logging system that replaces all `console.log` usage throughout the application.

#### Class: `Logger`

**Static Methods:**

##### `Logger.init()`

Initializes the logger with environment configuration. Must be called before using any logging methods.

```javascript
import Logger from '@/utils/Logger.js';

// Initialize logger (typically called in BootScene)
Logger.init();
```

##### `Logger.debug(message, ...args)`

Debug-level logging - only shows in development with debug mode enabled.

```javascript
Logger.debug('Player spawned at position', { x: 100, y: 200 });
// Output: 🔍 12:34:56 [DEBUG] Player spawned at position { x: 100, y: 200 }
```

**Parameters:**

- `message` (string): Debug message
- `...args` (any): Additional arguments to log

**Visibility**: Only shown when `VITE_DEBUG_MODE=true` and `VITE_LOG_LEVEL=debug`

##### `Logger.info(message, ...args)`

Info-level logging - general information messages.

```javascript
Logger.info('Game scene initialized');
// Output: ℹ️ 12:34:56 [INFO] Game scene initialized
```

**Parameters:**

- `message` (string): Info message
- `...args` (any): Additional arguments to log

**Visibility**: Always shown unless log level is set higher than 'info'

##### `Logger.warn(message, ...args)`

Warning-level logging - potential issues that don't break functionality.

```javascript
Logger.warn('Player health is low', { health: 15 });
// Output: ⚠️ 12:34:56 [WARN] Player health is low { health: 15 }
```

**Parameters:**

- `message` (string): Warning message
- `...args` (any): Additional arguments to log

##### `Logger.error(message, ...args)`

Error-level logging - serious problems that need attention.

```javascript
Logger.error('Failed to load asset', error);
// Output: ❌ 12:34:56 [ERROR] Failed to load asset [Error object]
```

**Parameters:**

- `message` (string): Error message
- `...args` (any): Additional arguments to log

##### Performance and Grouping Methods

```javascript
// Performance timing
Logger.time('loadAssets');
// ... some operation
Logger.timeEnd('loadAssets');

// Group related messages
Logger.group('Player Initialization');
Logger.info('Creating player entity');
Logger.debug('Adding components');
Logger.groupEnd();

// Table display for structured data
Logger.table([
  { name: 'Player', health: 100, x: 400, y: 300 },
  { name: 'Enemy1', health: 50, x: 200, y: 100 },
]);
```

**Environment Configuration:**

- `VITE_DEBUG_MODE`: Enable/disable debug features
- `VITE_LOG_LEVEL`: Set minimum log level (debug, info, warn, error)

---

### Environment Configuration

**Location**: `src/config/Environment.js`

Manages all environment variables and provides validation.

#### Class: `Environment`

**Static Properties:**

```javascript
// Debug Configuration
Environment.DEBUG_MODE; // boolean - Enable debug features
Environment.LOG_LEVEL; // string - Logging level
Environment.PHYSICS_DEBUG; // boolean - Show physics debug visuals
Environment.SHOW_FPS; // boolean - Display FPS counter
Environment.SHOW_DEBUG_INFO; // boolean - Show debug overlay

// Game Configuration
Environment.STARTING_LIVES; // number - Player starting lives
Environment.BASE_SCORE_MULTIPLIER; // number - Score calculation multiplier
Environment.AUDIO_ENABLED; // boolean - Enable audio system

// Performance Settings
Environment.MAX_PARTICLES; // number - Maximum particle count
Environment.OBJECT_POOL_SIZE; // number - Object pool size

// Runtime Properties
Environment.IS_DEVELOPMENT; // boolean - Development mode check
Environment.IS_PRODUCTION; // boolean - Production build check
```

**Static Methods:**

##### `Environment.init()`

Initialize environment configuration from Vite environment variables.

```javascript
import Environment from '@/config/Environment.js';

Environment.init();
console.log('Debug mode:', Environment.DEBUG_MODE);
```

##### `Environment.validate()`

Validate all environment configuration values.

```javascript
if (!Environment.validate()) {
  throw new Error('Invalid environment configuration');
}
```

**Returns**: `boolean` - True if all values are valid

---

## BaseEntity BaseComponent BaseSystem

### BaseEntity API

**Location**: `src/entities/BaseEntity.js`

Base entity class that extends `Phaser.GameObjects.Rectangle` to provide ECS functionality.

#### Class: `BaseEntity`

**Constructor:**

```javascript
new BaseEntity(scene, x, y, width, height, color);
```

**Parameters:**

- `scene` (Phaser.Scene): The scene this entity belongs to
- `x` (number): X coordinate
- `y` (number): Y coordinate
- `width` (number): BaseEntity width in pixels
- `height` (number): BaseEntity height in pixels
- `color` (number): Color value (e.g., 0x0099ff for blue)

**Properties:**

- `entityId` (string): Unique identifier for this entity
- `components` (Map): Map of component instances
- `active` (boolean): Whether entity is active
- `visible` (boolean): Whether entity is visible

**Methods:**

##### `addComponent(component)`

Add a component to this entity.

```javascript
const player = new BaseEntity(scene, 100, 100, 64, 64, 0x0099ff);
player.addComponent(new HealthComponent(100)).addComponent(new MovementComponent(300));
```

**Parameters:**

- `component` (BaseComponent): BaseComponent instance to add

**Returns**: `BaseEntity` - This entity for method chaining

##### `removeComponent(componentType)`

Remove a component from this entity.

```javascript
player.removeComponent(HealthComponent);
```

**Parameters:**

- `componentType` (Function): BaseComponent class/constructor

**Returns**: `BaseEntity` - This entity for method chaining

##### `getComponent(componentType)`

Get a component of the specified type.

```javascript
const health = player.getComponent(HealthComponent);
if (health) {
  console.log('Current health:', health.currentHealth);
}
```

**Parameters:**

- `componentType` (Function): BaseComponent class/constructor

**Returns**: `BaseComponent|null` - BaseComponent instance or null if not found

##### `hasComponent(componentType)`

Check if entity has a component of the specified type.

```javascript
if (player.hasComponent(MovementComponent)) {
  // BaseEntity can move
}
```

**Parameters:**

- `componentType` (Function): BaseComponent class/constructor

**Returns**: `boolean` - True if component exists

##### `getAllComponents()`

Get all components attached to this entity.

```javascript
const components = player.getAllComponents();
components.forEach(component => {
  console.log('BaseComponent:', component.constructor.name);
});
```

**Returns**: `Array<BaseComponent>` - Array of all components

##### `enablePhysics(bodyType)`

Enable physics for this entity.

```javascript
player.enablePhysics('dynamic'); // Can move and collide
enemy.enablePhysics('static'); // Cannot move, can collide
bullet.enablePhysics('kinematic'); // Moves but not affected by physics
```

**Parameters:**

- `bodyType` (string): Physics body type - 'dynamic', 'static', or 'kinematic'

**Returns**: `BaseEntity` - This entity for method chaining

##### `update(delta)`

Update entity - called by systems or scene update loop.

```javascript
// Override in subclasses for entity-specific behavior
class Player extends BaseEntity {
  update(delta) {
    super.update(delta);
    // Custom player update logic
  }
}
```

**Parameters:**

- `delta` (number): Time delta in seconds

##### `destroy()`

Clean up entity and remove from scene.

```javascript
entity.destroy(); // Properly removes from scene and cleans up components
```

---

### BaseComponent API

**Location**: `src/components/BaseComponent.js`

Base component class providing common functionality for all components.

#### Class: `BaseComponent`

**Constructor:**

```javascript
new BaseComponent();
```

**Properties:**

- `entity` (BaseEntity): Reference to the entity this component is attached to
- `active` (boolean): Whether this component is active
- `name` (string): BaseComponent name (derived from class name)

**Methods:**

##### `init(data)`

Initialize component with configuration data.

```javascript
class CustomComponent extends BaseComponent {
  init(data = {}) {
    super.init(data);
    this.customProperty = data.customProperty || defaultValue;
  }
}
```

**Parameters:**

- `data` (Object): Configuration data

##### `update(delta)`

Update component - called by entity or system.

```javascript
class CustomComponent extends BaseComponent {
  update(delta) {
    // BaseComponent update logic
    this.customProperty += delta;
  }
}
```

**Parameters:**

- `delta` (number): Time delta in seconds

##### `serialize()`

Serialize component data for saving.

```javascript
const data = component.serialize();
// Returns: { active: true, customProperty: value, ... }
```

**Returns**: `Object` - Serializable component data

##### `deserialize(data)`

Deserialize component data from saved state.

```javascript
component.deserialize(savedData);
```

**Parameters:**

- `data` (Object): Previously serialized component data

#### Built-in Components

##### `HealthComponent`

**Location**: `src/components/HealthComponent.js`

Manages entity health, damage, and invulnerability.

```javascript
// Create health component
const health = new HealthComponent(100); // 100 max health

// Usage
health.takeDamage(25); // Deal 25 damage
health.heal(10); // Heal 10 points
health.setInvulnerable(2000); // 2 seconds invulnerability

// Properties
health.maxHealth; // Maximum health value
health.currentHealth; // Current health value
health.invulnerable; // Is currently invulnerable
health.invulnerableTime; // Remaining invulnerability time

// Methods
health.isAlive(); // Returns boolean
health.getHealthPercentage(); // Returns 0.0 to 1.0
health.isDamaged(); // Returns boolean
health.canTakeDamage(); // Returns boolean (not invulnerable)
```

##### `MovementComponent`

**Location**: `src/components/MovementComponent.js`

Manages entity movement, velocity, acceleration, and AI patterns.

```javascript
// Create movement component
const movement = new MovementComponent(300); // 300 max speed

// Direct velocity control
movement.setVelocity(100, -50); // Set X,Y velocity
movement.addVelocity(25, 0); // Add to current velocity
movement.stop(); // Stop all movement

// AI Movement Patterns (Sprint 2)
movement.setAIPattern('straight', { angle: Math.PI / 2, speed: 100 });
movement.setAIPattern('curve', { amplitude: 50, frequency: 0.01 });
movement.setAIPattern('formation', { target: playerEntity, offset: { x: 50, y: 0 } });
movement.setAIPattern('chase', { target: playerEntity, speed: 150 });
movement.setAIPattern('circle', { center: { x: 400, y: 300 }, radius: 100 });
movement.setAIPattern('zigzag', { amplitude: 100, frequency: 0.02 });

// Boundary behaviors
movement.setBoundaryBehavior('bounce'); // Bounce off screen edges
movement.setBoundaryBehavior('wrap'); // Wrap around screen
movement.setBoundaryBehavior('destroy'); // Destroy when off-screen
movement.setBoundaryBehavior('clamp'); // Stop at screen edges

// Properties
movement.velocityX; // Current X velocity
movement.velocityY; // Current Y velocity
movement.maxSpeed; // Maximum speed limit
movement.aiPattern; // Current AI movement pattern
movement.boundaryBehavior; // How entity behaves at screen boundaries
movement.patternData; // Data specific to current AI pattern

// Methods
movement.getCurrentSpeed(); // Get current speed magnitude
movement.getDirection(); // Get movement angle in radians
movement.updateAI(delta, entity); // Update AI movement (called by MovementSystem)
movement.update(delta); // Update movement (called automatically)
```

##### `WeaponComponent`

**Location**: `src/components/WeaponComponent.js`

Manages weapon stats, firing mechanics, and upgrade system.

```javascript
// Create weapon component
const weapon = new WeaponComponent('laser'); // Default weapon type

// Weapon configuration
weapon.configure({
  weaponType: 'plasma',
  damage: 40,
  fireRate: 500, // milliseconds between shots
  projectileSpeed: 400,
  range: 600,
  spread: 0, // bullet spread in radians
  burstCount: 1, // projectiles per shot
  accuracy: 1.0, // 1.0 = perfect accuracy
});

// Firing mechanics
weapon.canFire(currentTime); // Check if weapon can fire
weapon.fire(currentTime); // Attempt to fire weapon
weapon.upgrade(); // Upgrade weapon stats

// Properties
weapon.weaponType; // 'laser', 'plasma', 'missile'
weapon.damage; // Damage per projectile
weapon.fireRate; // Milliseconds between shots
weapon.lastFiredTime; // Last time weapon was fired
weapon.level; // Weapon upgrade level
weapon.maxLevel; // Maximum upgrade level

// Methods
weapon.getUpgradeCost(); // Get cost to upgrade
weapon.canUpgrade(); // Check if weapon can be upgraded
weapon.getStats(); // Get current weapon statistics
```

##### `CollisionComponent`

**Location**: `src/components/CollisionComponent.js`

Manages collision detection, layers, and response behaviors.

```javascript
// Create collision component
const collision = new CollisionComponent('player');

// Configure collision layers
collision.setLayer('player'); // BaseEntity belongs to player layer
collision.setTargetLayers(['enemy', 'enemyProjectile']); // Can collide with these layers
collision.setIgnoreLayers(['playerProjectile']); // Ignore these layers

// Collision behavior
collision.setDealsDamage(true, 25); // This entity deals 25 damage on collision
collision.setReceivesDamage(true); // This entity can take damage from collisions
collision.setDestroyOnCollision(false); // Don't destroy on collision

// Collision response callbacks
collision.onCollisionStart = otherEntity => {
  Logger.info('Collision started with', otherEntity.constructor.name);
};

collision.onCollisionEnd = otherEntity => {
  Logger.info('Collision ended with', otherEntity.constructor.name);
};

// Properties
collision.layer; // Collision layer this entity belongs to
collision.targetLayers; // Array of layers this entity can collide with
collision.dealsDamage; // Whether this entity deals damage
collision.damageAmount; // Amount of damage dealt
collision.receivesDamage; // Whether this entity can take damage
collision.destroyOnCollision; // Whether to destroy on collision

// Methods
collision.canCollideWith(otherCollision); // Check if can collide with other entity
collision.handleCollision(otherEntity); // Handle collision response
```

---

### BaseSystem API

**Location**: `src/systems/BaseSystem.js`

Base system class for processing entities with specific components.

#### Class: `BaseSystem`

**Constructor:**

```javascript
new BaseSystem();
```

**Properties:**

- `name` (string): BaseSystem name

**Methods:**

##### `update(entities, delta)`

Update system - process all relevant entities.

```javascript
class MovementSystem extends BaseSystem {
  update(entities, delta) {
    entities.forEach(entity => {
      const movement = entity.getComponent(MovementComponent);
      if (movement && entity.active) {
        movement.update(delta);
      }
    });
  }
}
```

**Parameters:**

- `entities` (Array<BaseEntity>): Array of entities to process
- `delta` (number): Time delta in seconds

**Must be overridden in subclasses.**

#### Implemented Systems

##### `WeaponSystem`

**Location**: `src/systems/WeaponSystem.js`

Handles weapon firing, projectile creation, and object pooling.

```javascript
// Initialize weapon system in GameScene
const weaponSystem = new WeaponSystem(this); // Pass scene reference
this.systems.push(weaponSystem);

// BaseSystem automatically handles:
// - Input detection for firing
// - Weapon cooldowns and fire rates
// - Projectile creation from object pools
// - Different weapon types and behaviors
```

**Features:**

- Object pooling for projectiles (100 per pool)
- Weapon switching with number keys
- Different projectile behaviors per weapon type
- Performance monitoring and optimization

##### `CollisionSystem`

**Location**: `src/systems/CollisionSystem.js`

Advanced collision detection with spatial grid optimization.

```javascript
// Initialize collision system
const collisionSystem = new CollisionSystem(64); // 64px grid size
this.systems.push(collisionSystem);

// BaseSystem provides:
// - O(1) collision detection using spatial grid
// - Layer-based collision filtering
// - Damage dealing and collision response
// - Performance metrics and monitoring
```

**Performance:**

- 64px spatial grid for efficient collision detection
- Only checks entities in nearby grid cells
- Supports collision layers and filtering
- Real-time performance monitoring

##### `EnemySpawnSystem`

**Location**: `src/systems/EnemySpawnSystem.js`

Manages enemy wave generation, spawning, and AI coordination.

```javascript
// Initialize enemy spawn system
const enemySpawnSystem = new EnemySpawnSystem(this);
this.systems.push(enemySpawnSystem);

// BaseSystem handles:
// - Wave-based enemy spawning
// - Progressive difficulty scaling
// - Enemy formation patterns
// - AI behavior coordination
```

**Features:**

- 3 enemy types: Scout (fast), Fighter (balanced), Bomber (slow/powerful)
- Formation flight patterns
- Wave progression with 10% difficulty increase
- AI state machines for enemy behavior

---

## Scene Management

### Scene Flow

The game follows a structured scene progression:

```
BootScene → PreloaderScene → MainMenuScene → GameScene
```

#### BootScene

**Location**: `src/scenes/BootScene.js`

- Initializes environment configuration
- Sets up Logger system
- Validates configuration
- Transitions to PreloaderScene

#### PreloaderScene

**Location**: `src/scenes/PreloaderScene.js`

- Loads game assets (currently dev graphics)
- Shows loading progress
- Prepares game resources
- Transitions to MainMenuScene

#### MainMenuScene

**Location**: `src/scenes/MainMenuScene.js`

- Displays main menu interface
- Handles menu navigation
- Starts new game
- Transitions to GameScene

#### GameScene

**Location**: `src/scenes/GameScene.js`

Primary gameplay scene with comprehensive API:

**Properties:**

- `entities` (Array): All game entities
- `systems` (Array): All game systems
- `gameState` (string): Current state ('playing', 'paused', 'gameOver')
- `player` (BaseEntity): Player entity reference
- `score` (number): Current game score
- `lives` (number): Player lives remaining
- `level` (number): Current level

**UI Elements:**

- `uiElements.scoreText`: Score display
- `uiElements.livesText`: Lives display
- `uiElements.levelText`: Level display
- `uiElements.healthBar`: Player health bar
- `uiElements.pauseText`: Pause indicator

**Input Handling:**

- `cursors`: Arrow key input
- `wasdKeys`: WASD key input
- `spaceKey`: Space bar input

**Methods:**

##### `createPlayer()`

Creates the player entity with components.

```javascript
// Creates blue rectangle player with health and movement
this.createPlayer(); // Called automatically in create()
```

##### `setupInput()`

Configures keyboard input handling.

```javascript
// Sets up WASD, arrows, space, ESC keys
this.setupInput(); // Called automatically in create()
```

##### `togglePause()`

Toggle game pause state.

```javascript
this.togglePause(); // Called by ESC key
```

##### `addScore(points)`

Add points to the game score.

```javascript
this.addScore(100); // Add 100 points
```

##### `takeDamage(damage)`

Deal damage to the player.

```javascript
this.takeDamage(25); // Deal 25 damage to player
```

---

## BaseEntity Types

### Player BaseEntity

**Location**: Integrated in `src/scenes/GameScene.js`

The player entity is the main controllable character with comprehensive component integration.

```javascript
// Player creation with all components
this.player = new BaseEntity(this, 400, 500, 64, 64, 0x0099ff);
this.player
  .addComponent(new HealthComponent(100))
  .addComponent(new MovementComponent(300))
  .addComponent(new WeaponComponent('laser'))
  .addComponent(new CollisionComponent('player'));

// Player automatically handles:
// - WASD movement with screen boundary collision
// - Weapon firing with spacebar
// - Weapon switching with number keys
// - Collision with enemies and enemy projectiles
// - Health management and damage visualization
```

### Projectile BaseEntity

**Location**: `src/entities/Projectile.js`

Projectiles are object-pooled entities that handle weapon fire.

```javascript
// Create projectile from object pool
const projectile = this.objectPools.playerProjectiles.get();
projectile.activate(x, y, velocityX, velocityY, damage, 'player');

// Projectile features:
// - Automatic movement and collision detection
// - Layer-based collision (player vs enemy projectiles)
// - Auto-cleanup when leaving screen
// - Object pooling for performance (0% pool misses)
// - Different visual styles per weapon type
```

### Enemy BaseEntity

**Location**: `src/entities/Enemy.js`

AI-driven enemies with state machines and formation behavior.

```javascript
// Create enemy with AI pattern
const enemy = new Enemy(this, x, y, 'fighter');
enemy.getComponent(MovementComponent).setAIPattern('formation', {
  target: this.player,
  offset: { x: 100, y: 50 },
});

// Enemy types:
// - Scout: 32x32, 50 HP, fast movement, 150 speed
// - Fighter: 48x48, 100 HP, shoots projectiles, 120 speed
// - Bomber: 64x64, 200 HP, slow but powerful, 80 speed

// AI behaviors:
// - Formation flight patterns
// - Chase player with pathfinding
// - Shooting at player when in range
// - State machine (idle, attacking, fleeing)
```

## Game State Management

### GameStateManager

**Location**: `src/utils/GameStateManager.js`

Centralized game state management with persistence.

```javascript
// Initialize game state manager
const gameState = new GameStateManager();

// Score and progression
gameState.addScore(100, 'enemy_kill'); // Add score with reason
gameState.addExperience(25); // Add XP
gameState.levelUp(); // Handle level up

// Lives and health
gameState.loseLife(); // Lose a life
gameState.addLife(); // Gain a life (rare)

// Wave progression
gameState.nextWave(); // Advance to next wave
gameState.getWaveDifficulty(); // Get current difficulty multiplier

// Achievements
gameState.checkAchievements(); // Check for new achievements
gameState.unlockAchievement('first_kill'); // Unlock specific achievement

// Persistence
gameState.saveGame(); // Save to localStorage
gameState.loadGame(); // Load from localStorage
gameState.resetGame(); // Reset all progress

// Statistics
const stats = gameState.getStatistics();
// Returns: { score, level, wave, kills, accuracy, playtime, ... }
```

## Performance Optimization

### Object Pooling

```javascript
// Object pools for projectiles (prevents garbage collection)
this.objectPools = {
  playerProjectiles: new ObjectPool(() => new Projectile(this), 100),
  enemyProjectiles: new ObjectPool(() => new Projectile(this), 100),
};

// Usage (handled automatically by WeaponSystem)
const projectile = this.objectPools.playerProjectiles.get();
projectile.activate(x, y, vx, vy, damage, 'player');

// Return to pool when done (automatic)
projectile.deactivate(); // Returns to pool for reuse
```

### Spatial Grid Collision

```javascript
// CollisionSystem uses spatial grid for O(1) collision detection
const collisionSystem = new CollisionSystem(64); // 64px grid cells

// Automatic optimization:
// - Entities placed in grid cells based on position
// - Only check collisions between entities in same/adjacent cells
// - Massive performance improvement over brute-force collision
// - Real-time performance monitoring available
```

---

## Development Graphics

**Location**: `src/graphics/DevShapes.js`

Utility class for creating development graphics using colored shapes.

#### Class: `DevShapes`

**Static Methods:**

##### `DevShapes.createPlayer(scene, x, y)`

Create a blue rectangle representing the player.

```javascript
const player = DevShapes.createPlayer(scene, 400, 300);
// Creates: 64x64px blue rectangle (0x0099ff)
```

**Parameters:**

- `scene` (Phaser.Scene): Scene to add shape to
- `x` (number): X coordinate
- `y` (number): Y coordinate

**Returns**: `Phaser.GameObjects.Rectangle` - Created shape

##### `DevShapes.createEnemy(scene, x, y, size)`

Create a red rectangle representing an enemy.

```javascript
const enemy = DevShapes.createEnemy(scene, 200, 100, 48);
// Creates: 48x48px red rectangle (0xff0000)
```

**Parameters:**

- `scene` (Phaser.Scene): Scene to add shape to
- `x` (number): X coordinate
- `y` (number): Y coordinate
- `size` (number): Size in pixels (default: 32)

**Returns**: `Phaser.GameObjects.Rectangle` - Created shape

##### `DevShapes.createProjectile(scene, x, y, size)`

Create a yellow/orange shape representing a projectile.

```javascript
const bullet = DevShapes.createProjectile(scene, 400, 250, 8);
// Creates: 8x8px yellow rectangle (0xffff00)
```

**Parameters:**

- `scene` (Phaser.Scene): Scene to add shape to
- `x` (number): X coordinate
- `y` (number): Y coordinate
- `size` (number): Size in pixels (default: 8)

**Returns**: `Phaser.GameObjects.Rectangle` - Created shape

##### `DevShapes.createPowerUp(scene, x, y, type)`

Create a colored shape representing a power-up.

```javascript
const powerUp = DevShapes.createPowerUp(scene, 300, 200, 'health');
// Creates: Green diamond shape for health power-up
```

**Parameters:**

- `scene` (Phaser.Scene): Scene to add shape to
- `x` (number): X coordinate
- `y` (number): Y coordinate
- `type` (string): Power-up type ('health', 'weapon', 'speed', etc.)

**Returns**: `Phaser.GameObjects.Shape` - Created shape

**Development Color Scheme:**

| BaseEntity Type        | Color         | Hex Code          | Size        |
| ------------------ | ------------- | ----------------- | ----------- |
| **Player**         | Blue          | 0x0099ff          | 64x64       |
| **Enemy**          | Red           | 0xff0000          | 32-80px     |
| **Projectile**     | Yellow/Orange | 0xffff00/0xff8800 | 8-16px      |
| **Health PowerUp** | Green         | 0x00ff00          | 24x24       |
| **Weapon PowerUp** | Purple        | 0x8800ff          | 24x24       |
| **UI Text**        | White         | 0xffffff          | Various     |
| **Background**     | Dark Blue     | 0x000011          | Full screen |

---

## Usage Examples

### Creating a New BaseEntity Type

```javascript
import BaseEntity from '@/entities/BaseEntity.js';
import HealthComponent from '@/components/HealthComponent.js';
import MovementComponent from '@/components/MovementComponent.js';

class Enemy extends BaseEntity {
  constructor(scene, x, y) {
    // Create red 48x48px rectangle
    super(scene, x, y, 48, 48, 0xff0000);

    // Add components
    this.addComponent(new HealthComponent(50)).addComponent(new MovementComponent(150));

    // Enable physics
    this.enablePhysics('dynamic');

    // Set depth for layering
    this.setDepth(20);
  }

  update(delta) {
    super.update(delta);

    // Custom enemy behavior
    const movement = this.getComponent(MovementComponent);
    if (movement) {
      // Move toward player
      const player = this.scene.player;
      if (player) {
        movement.moveTowards(player.x, player.y, 100);
      }
    }
  }
}
```

### Creating a Custom BaseComponent

```javascript
import BaseComponent from '@/components/BaseComponent.js';

class WeaponComponent extends BaseComponent {
  constructor(weaponType = 'basic') {
    super();

    this.weaponType = weaponType;
    this.damage = 25;
    this.fireRate = 500; // milliseconds between shots
    this.lastFiredTime = 0;
    this.ammunition = -1; // -1 for unlimited
    this.range = 400;
  }

  init(data = {}) {
    super.init(data);

    this.weaponType = data.weaponType || this.weaponType;
    this.damage = data.damage || this.damage;
    this.fireRate = data.fireRate || this.fireRate;
    this.ammunition = data.ammunition !== undefined ? data.ammunition : this.ammunition;
    this.range = data.range || this.range;
  }

  canFire(currentTime) {
    return (
      currentTime - this.lastFiredTime >= this.fireRate &&
      (this.ammunition > 0 || this.ammunition === -1)
    );
  }

  fire(currentTime) {
    if (this.canFire(currentTime)) {
      this.lastFiredTime = currentTime;
      if (this.ammunition > 0) {
        this.ammunition--;
      }
      return true;
    }
    return false;
  }

  reload(amount) {
    if (this.ammunition !== -1) {
      this.ammunition += amount;
    }
  }

  serialize() {
    return {
      ...super.serialize(),
      weaponType: this.weaponType,
      damage: this.damage,
      fireRate: this.fireRate,
      ammunition: this.ammunition,
      range: this.range,
    };
  }
}

export default WeaponComponent;
```

### Creating a Custom BaseSystem

```javascript
import BaseSystem from '@/systems/BaseSystem.js';
import WeaponComponent from '@/components/WeaponComponent.js';

class WeaponSystem extends BaseSystem {
  constructor(scene) {
    super();
    this.scene = scene;
  }

  update(entities, delta) {
    entities.forEach(entity => {
      const weapon = entity.getComponent(WeaponComponent);
      if (weapon && entity.active) {
        this.updateWeapon(entity, weapon, delta);
      }
    });
  }

  updateWeapon(entity, weapon, delta) {
    // Handle weapon cooling down
    weapon.lastFiredTime += delta * 1000; // Convert to milliseconds

    // Check for firing input (example for player)
    if (entity === this.scene.player && this.scene.spaceKey.isDown) {
      if (weapon.fire(Date.now())) {
        this.createProjectile(entity, weapon);
      }
    }
  }

  createProjectile(entity, weapon) {
    // Create projectile at entity position
    const projectile = new Projectile(
      this.scene,
      entity.x,
      entity.y - entity.height / 2,
      weapon.damage
    );

    Logger.debug('Weapon fired', {
      weaponType: weapon.weaponType,
      damage: weapon.damage,
      ammunition: weapon.ammunition,
    });
  }
}

export default WeaponSystem;
```

### Integration in GameScene

```javascript
// In GameScene.js create() method
import WeaponSystem from '@/systems/WeaponSystem.js';
import WeaponComponent from '@/components/WeaponComponent.js';

// Add weapon to player
this.player.addComponent(new WeaponComponent('laser'));

// Initialize weapon system
this.weaponSystem = new WeaponSystem(this);
this.systems.push(this.weaponSystem);

// In update() method
this.systems.forEach(system => {
  system.update(this.entities, delta / 1000);
});
```

### Environment-Aware Logging

```javascript
import Logger from '@/utils/Logger.js';

class GameFeature {
  constructor() {
    Logger.info('GameFeature initialized');
  }

  processData(data) {
    Logger.debug('Processing data', { count: data.length });

    try {
      // Process data
      const result = this.complexOperation(data);
      Logger.debug('Processing complete', { result });
      return result;
    } catch (error) {
      Logger.error('Processing failed', error);
      throw error;
    }
  }

  performanceTest() {
    Logger.time('Performance Test');

    Logger.group('Test Results');
    for (let i = 0; i < 1000; i++) {
      // Some operation
    }
    Logger.info('Completed 1000 operations');
    Logger.groupEnd();

    Logger.timeEnd('Performance Test');
  }
}
```

## Development Workflow

### Adding New Weapon Types

```javascript
// 1. Define weapon configuration
const weaponConfig = {
  railgun: {
    damage: 200,
    fireRate: 2000,
    projectileSpeed: 800,
    color: 0x00ffff,
    unlockLevel: 10,
  },
};

// 2. Add to WeaponComponent.js weapon types
// 3. Update WeaponSystem.js for new projectile behavior
// 4. Add unlock condition to GameStateManager.js
```

### Adding New Enemy Types

```javascript
// 1. Define enemy in Enemy.js constructor
case 'destroyer':
  this.setSize(96, 96).setFillStyle(0x800000);
  this.addComponent(new HealthComponent(500))
    .addComponent(new MovementComponent(60))
    .addComponent(new WeaponComponent('heavy'))
    .addComponent(new CollisionComponent('enemy'));
  break;

// 2. Add spawn logic to EnemySpawnSystem.js
// 3. Configure AI pattern and behavior
// 4. Add to wave progression system
```

### Performance Monitoring

```javascript
// Enable performance monitoring in Environment.js
VITE_DEBUG_MODE = true;
VITE_SHOW_FPS = true;
VITE_SHOW_DEBUG_INFO = true;

// Monitor in real-time:
// - FPS counter
// - BaseEntity count
// - Object pool usage
// - Collision system performance
// - Memory usage
```

This comprehensive API documentation covers all major systems and components implemented in Sprint 2 of the Space Shooter game. Use it as a reference for extending the game with new features and understanding the complete ECS architecture with performance optimizations.
