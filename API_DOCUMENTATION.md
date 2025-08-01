# Space Shooter API Documentation

This document provides comprehensive API documentation for the Space Shooter game's architecture, systems, and components.

## Table of Contents

- [Core Architecture](#core-architecture)
  - [Logger System](#logger-system)
  - [Environment Configuration](#environment-configuration)
- [Entity Component System](#entity-component-system)
  - [Entity API](#entity-api)
  - [Component API](#component-api)
  - [System API](#system-api)
- [Scene Management](#scene-management)
- [Development Graphics](#development-graphics)
- [Usage Examples](#usage-examples)

---

## Core Architecture

### Logger System

**Location**: `src/core/Logger.js`

Environment-aware logging system that replaces all `console.log` usage throughout the application.

#### Class: `Logger`

**Static Methods:**

##### `Logger.init()`

Initializes the logger with environment configuration. Must be called before using any logging methods.

```javascript
import Logger from './core/Logger.js';

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
import Environment from './config/Environment.js';

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

## Entity Component System

### Entity API

**Location**: `src/entities/Entity.js`

Base entity class that extends `Phaser.GameObjects.Rectangle` to provide ECS functionality.

#### Class: `Entity`

**Constructor:**

```javascript
new Entity(scene, x, y, width, height, color);
```

**Parameters:**

- `scene` (Phaser.Scene): The scene this entity belongs to
- `x` (number): X coordinate
- `y` (number): Y coordinate
- `width` (number): Entity width in pixels
- `height` (number): Entity height in pixels
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
const player = new Entity(scene, 100, 100, 64, 64, 0x0099ff);
player.addComponent(new HealthComponent(100)).addComponent(new MovementComponent(300));
```

**Parameters:**

- `component` (Component): Component instance to add

**Returns**: `Entity` - This entity for method chaining

##### `removeComponent(componentType)`

Remove a component from this entity.

```javascript
player.removeComponent(HealthComponent);
```

**Parameters:**

- `componentType` (Function): Component class/constructor

**Returns**: `Entity` - This entity for method chaining

##### `getComponent(componentType)`

Get a component of the specified type.

```javascript
const health = player.getComponent(HealthComponent);
if (health) {
  console.log('Current health:', health.currentHealth);
}
```

**Parameters:**

- `componentType` (Function): Component class/constructor

**Returns**: `Component|null` - Component instance or null if not found

##### `hasComponent(componentType)`

Check if entity has a component of the specified type.

```javascript
if (player.hasComponent(MovementComponent)) {
  // Entity can move
}
```

**Parameters:**

- `componentType` (Function): Component class/constructor

**Returns**: `boolean` - True if component exists

##### `getAllComponents()`

Get all components attached to this entity.

```javascript
const components = player.getAllComponents();
components.forEach(component => {
  console.log('Component:', component.constructor.name);
});
```

**Returns**: `Array<Component>` - Array of all components

##### `enablePhysics(bodyType)`

Enable physics for this entity.

```javascript
player.enablePhysics('dynamic'); // Can move and collide
enemy.enablePhysics('static'); // Cannot move, can collide
bullet.enablePhysics('kinematic'); // Moves but not affected by physics
```

**Parameters:**

- `bodyType` (string): Physics body type - 'dynamic', 'static', or 'kinematic'

**Returns**: `Entity` - This entity for method chaining

##### `update(delta)`

Update entity - called by systems or scene update loop.

```javascript
// Override in subclasses for entity-specific behavior
class Player extends Entity {
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

### Component API

**Location**: `src/components/Component.js`

Base component class providing common functionality for all components.

#### Class: `Component`

**Constructor:**

```javascript
new Component();
```

**Properties:**

- `entity` (Entity): Reference to the entity this component is attached to
- `active` (boolean): Whether this component is active
- `name` (string): Component name (derived from class name)

**Methods:**

##### `init(data)`

Initialize component with configuration data.

```javascript
class CustomComponent extends Component {
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
class CustomComponent extends Component {
  update(delta) {
    // Component update logic
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

Manages entity movement, velocity, acceleration, and constraints.

```javascript
// Create movement component
const movement = new MovementComponent(300); // 300 max speed

// Direct velocity control
movement.setVelocity(100, -50); // Set X,Y velocity
movement.addVelocity(25, 0); // Add to current velocity
movement.stop(); // Stop all movement

// Directional movement
movement.moveInDirection(Math.PI / 4, 200); // Move at 45° angle
movement.moveTowards(targetX, targetY, 150); // Move toward target

// Physics-based movement
movement.setAcceleration(50, 0); // Set acceleration
movement.applyForce(100, -25); // Apply force (adds to acceleration)

// Properties
movement.velocityX; // Current X velocity
movement.velocityY; // Current Y velocity
movement.maxSpeed; // Maximum speed limit
movement.drag; // Drag coefficient
movement.friction; // Friction multiplier (0-1)
movement.boundToScreen; // Keep entity on screen
movement.screenPadding; // Padding from screen edges

// State properties
movement.isMoving; // Is currently moving
movement.lastDirection; // Last movement direction

// Methods
movement.getCurrentSpeed(); // Get current speed magnitude
movement.getDirection(); // Get movement angle in radians
movement.clampVelocity(); // Apply max speed limit
movement.update(delta); // Update movement (called automatically)
```

---

### System API

**Location**: `src/systems/System.js`

Base system class for processing entities with specific components.

#### Class: `System`

**Constructor:**

```javascript
new System();
```

**Properties:**

- `name` (string): System name

**Methods:**

##### `update(entities, delta)`

Update system - process all relevant entities.

```javascript
class MovementSystem extends System {
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

- `entities` (Array<Entity>): Array of entities to process
- `delta` (number): Time delta in seconds

**Must be overridden in subclasses.**

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
- `player` (Entity): Player entity reference
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

| Entity Type        | Color         | Hex Code          | Size        |
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

### Creating a New Entity Type

```javascript
import Entity from '../entities/Entity.js';
import HealthComponent from '../components/HealthComponent.js';
import MovementComponent from '../components/MovementComponent.js';

class Enemy extends Entity {
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

### Creating a Custom Component

```javascript
import Component from './Component.js';

class WeaponComponent extends Component {
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

### Creating a Custom System

```javascript
import System from './System.js';
import WeaponComponent from '../components/WeaponComponent.js';

class WeaponSystem extends System {
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
import WeaponSystem from '../systems/WeaponSystem.js';
import WeaponComponent from '../components/WeaponComponent.js';

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
import Logger from '../core/Logger.js';

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

This API documentation provides comprehensive coverage of all major systems and components in the Space Shooter game. Use it as a reference for extending the game with new features and understanding the existing architecture.
