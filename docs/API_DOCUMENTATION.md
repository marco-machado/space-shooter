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
- [Input Management](#input-management)
  - [BaseAdapter API](#baseadapter-api)
  - [KeyboardInputAdapter API](#keyboardinputadapter-api)
  - [EventBus Integration](#eventbus-integration)
- [Scene Management](#scene-management)
- [BaseEntity Types](#entity-types)
- [Game State Management](#game-state-management)
- [Performance Optimization](#performance-optimization)
- [Development Graphics](#development-graphics)
- [Testing Architecture](#testing-architecture)
- [Usage Examples](#usage-examples)

---

## Core Architecture

### Logger BaseSystem

**Location**: `src/utils/Logger.js`

Environment-aware logging system that replaces all `console.log` usage throughout the application. Features **auto-initialization** - no manual setup required!

#### Class: `Logger`

**Auto-Initialization**: The Logger automatically initializes on first use. No manual `init()` call required.

**Static Methods:**

##### `Logger.init()` *(Optional)*

Initializes the logger with environment configuration. **Optional** - Logger auto-initializes on first use.

```javascript
import Logger from '@/utils/Logger.js';

// ✅ NEW: No manual initialization needed
Logger.info('Game started'); // Auto-initializes on first call

// ✅ OLD: Still supported for backward compatibility
Logger.init(); // Optional - Logger will auto-initialize anyway
Logger.info('Game started');
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

Advanced logging methods for debugging and performance monitoring. **Note**: Performance methods only work when `VITE_DEBUG_MODE=true`.

###### `Logger.time(label)` / `Logger.timeEnd(label)`

Performance timing methods for measuring execution time.

```javascript
Logger.time('levelLoad');
// ... level loading operations ...
Logger.timeEnd('levelLoad');
// Output: ⏱️ levelLoad: 245.123ms
```

**Parameters:**
- `label` (string): Timer identifier

**Visibility**: Debug mode only (`VITE_DEBUG_MODE=true`)

###### `Logger.group(label)` / `Logger.groupEnd()`

Group related log messages for better organization.

```javascript
Logger.group('Player Initialization');
Logger.info('Creating player entity');
Logger.debug('Adding movement component');
Logger.debug('Adding collision component');
Logger.groupEnd();
```

**Parameters:**
- `label` (string): Group title

**Visibility**: Debug mode only (`VITE_DEBUG_MODE=true`)

###### `Logger.table(data)`

Display structured data in table format.

```javascript
Logger.table([
  { entity: 'Player', health: 100, x: 400, y: 300 },
  { entity: 'Enemy1', health: 50, x: 200, y: 100 },
  { entity: 'Boss', health: 500, x: 600, y: 200 },
]);
```

**Parameters:**
- `data` (Array|Object): Data to display in table format

**Visibility**: Debug mode only (`VITE_DEBUG_MODE=true`)

##### Message Formatting

All log messages include automatic timestamp formatting and emoji prefixes for easy identification:

```javascript
Logger.debug('Debug message');   // 🔍 14:30:25 [DEBUG] Debug message
Logger.info('Info message');     // ℹ️ 14:30:25 [INFO] Info message  
Logger.warn('Warning message');  // ⚠️ 14:30:25 [WARN] Warning message
Logger.error('Error message');   // ❌ 14:30:25 [ERROR] Error message
```

##### Environment Handling

The Logger automatically detects and handles environment configuration:

**Dual Environment Support:**
- **Vite Development**: Uses `import.meta.env.VITE_*` variables
- **Node.js Fallback**: Falls back to `process.env` if import.meta unavailable
- **Error Recovery**: Uses safe defaults if both environment methods fail

**Environment Variables:**
- `VITE_DEBUG_MODE`: Enable/disable debug features and performance methods (true/false)
- `VITE_LOG_LEVEL`: Set minimum log level (debug/info/warn/error)

**Example .env configuration:**
```bash
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

##### Testing Coverage

The Logger includes comprehensive unit tests covering:
- Auto-initialization behavior (32 test cases total)
- All logging methods and performance features
- Environment variable parsing and fallbacks
- Error handling and edge cases
- Message formatting and timestamps

##### Migration Guide

**For existing code:**
```javascript
// ✅ No changes needed - existing code continues to work
Logger.init();
Logger.debug('This still works exactly the same');

// ✅ Can simplify by removing manual init() calls
Logger.debug('This will auto-initialize');
```

**For new code:**
```javascript
// ✅ Recommended: Use Logger directly without init()
Logger.info('New feature implemented');
Logger.debug('Debug info for', someVariable);
Logger.error('Error occurred:', error);
```

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

Flexible base entity class with support for multiple Phaser GameObject types or pure logical entities. Provides ECS functionality with maximum GameObject flexibility.

#### Class: `BaseEntity`

**Constructor (Flexible):**

```javascript
// Configuration object approach (recommended)
new BaseEntity(scene, config);

// Backward compatibility support
new BaseEntity(scene, x, y, width, height, color, name);
```

**Configuration Object Parameters:**

- `scene` (Phaser.Scene): The scene this entity belongs to
- `config` (Object): Flexible configuration object

**Configuration Object Properties:**

- `type` (string|null): GameObject type - 'rectangle', 'sprite', 'image', 'circle', 'polygon', 'text', or null
- `x` (number): X coordinate
- `y` (number): Y coordinate  
- `width` (number): Width in pixels (for applicable types)
- `height` (number): Height in pixels (for applicable types)
- `color` (number): Color value (e.g., 0x0099ff for blue)
- `name` (string): Entity name for identification
- `texture` (string): Texture key (for sprite/image types)
- `frame` (string|number): Texture frame (for sprite/image types)
- `radius` (number): Radius in pixels (for circle type, default: 16)
- `points` (Array): Array of points (for polygon type, defaults to diamond)
- `text` (string): Text content (for text type)
- `style` (Object): Text style configuration (for text type)

**Properties:**

- `entityId` (string): Unique identifier for this entity
- `components` (Map): Map of component instances
- `gameObject` (Phaser.GameObject|null): Underlying Phaser GameObject or null for logical entities
- `config` (Object): Entity configuration object
- `name` (string): Entity name for identification
- `active` (boolean): Whether entity is active (null-safe)
- `visible` (boolean): Whether entity is visible (null-safe)
- `x` (number): X coordinate (null-safe property delegation)
- `y` (number): Y coordinate (null-safe property delegation)
- `width` (number): Width in pixels (null-safe property delegation)
- `height` (number): Height in pixels (null-safe property delegation)
- `scene` (Phaser.Scene): Scene reference (null-safe)

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

##### `changeGameObjectType(newType, newConfig)`

**NEW**: Change the GameObject type at runtime.

```javascript
// Change from rectangle to sprite
entity.changeGameObjectType('sprite', {
  texture: 'upgraded-player',
  frame: 0
});

// Change to logical entity (no visual)
entity.changeGameObjectType(null);

// Change to circle
entity.changeGameObjectType('circle', {
  radius: 25,
  color: 0x00ff00
});
```

**Parameters:**

- `newType` (string|null): New GameObject type
- `newConfig` (Object): Configuration for new GameObject type

**Returns**: `BaseEntity` - This entity for method chaining

##### `getGameObjectType()`

**NEW**: Get the current GameObject type.

```javascript
const type = entity.getGameObjectType();
// Returns: 'rectangle', 'sprite', 'circle', 'text', etc., or null
```

**Returns**: `string|null` - Current GameObject type or null

##### GameObject Type Examples

**Rectangle (Backward Compatible):**
```javascript
const rect = new BaseEntity(scene, 100, 100, 64, 64, 0x0099ff, 'player');
// Creates blue 64x64 rectangle at (100, 100)
```

**Sprite:**
```javascript
const sprite = new BaseEntity(scene, {
  type: 'sprite',
  x: 200, y: 200,
  texture: 'player-sprite',
  frame: 0,
  name: 'player'
});
```

**Logical Entity (No Visual):**
```javascript
const controller = new BaseEntity(scene, {
  type: null,
  x: 300, y: 300,
  name: 'game-controller'
});
// Null-safe property access still works: controller.x, controller.y
```

**Circle:**
```javascript
const circle = new BaseEntity(scene, {
  type: 'circle',
  x: 400, y: 400,
  radius: 20,
  color: 0x00ff00,
  name: 'power-up'
});
```

**Text:**
```javascript
const textEntity = new BaseEntity(scene, {
  type: 'text',
  x: 500, y: 500,
  text: 'Score: 1000',
  style: { fontSize: '24px', fill: '#ffffff' },
  name: 'score-display'
});
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

## Input Management

### BaseAdapter API

**Location**: `src/adapters/BaseAdapter.js`

Abstract base class for all input adapters, providing common functionality and EventBus integration.

#### Class: `BaseAdapter`

**Constructor:**

```javascript
new BaseAdapter(scene);
```

**Parameters:**

- `scene` (Phaser.Scene): The scene this adapter belongs to

**Properties:**

- `scene` (Phaser.Scene): Scene reference
- `eventBus` (EventBus): EventBus instance for communication

**Abstract Methods:**

Subclasses must implement these methods:

- `activate()`: Activate the adapter (setup event listeners)
- `destroy()`: Clean up the adapter (remove event listeners)

**Usage Pattern:**

```javascript
class CustomInputAdapter extends BaseAdapter {
  constructor(scene) {
    super(scene); // Gets EventBus automatically
  }

  activate() {
    // Setup input event listeners
    this.scene.input.on('pointerdown', this.onPointerDown, this);
  }

  onPointerDown(pointer) {
    // Emit structured events via EventBus
    this.eventBus.emit(EventTypes.PLAYER_INPUT, {
      action: 'click',
      timestamp: performance.now(),
      position: { x: pointer.x, y: pointer.y }
    });
  }

  destroy() {
    this.scene.input.off('pointerdown', this.onPointerDown, this);
    super.destroy();
  }
}
```

---

### KeyboardInputAdapter API

**Location**: `src/adapters/KeyboardInputAdapter.js`

Comprehensive keyboard input management with state tracking, normalized movement, and structured event emission.

#### Class: `KeyboardInputAdapter`

**Constructor:**

```javascript
const inputAdapter = new KeyboardInputAdapter(scene);
```

**Parameters:**

- `scene` (Phaser.Scene): The scene this adapter belongs to

**Properties:**

- `inputState` (Object): Current input state tracking
  - `movement` (Object): Normalized movement direction `{ x: number, y: number }`
  - `keys` (Set): Currently pressed keys
  - `weaponFiring` (boolean): Whether weapon is currently firing
- `movementKeys` (Object): Key code to movement direction mapping

**Methods:**

##### `activate()`

Activate the keyboard input adapter.

```javascript
inputAdapter.activate();
// Sets up Phaser keyboard event listeners
```

##### `updateMovementState()`

**INTERNAL**: Update movement state based on currently pressed keys.

- Calculates normalized movement direction from all pressed movement keys
- Handles diagonal movement normalization (prevents faster diagonal movement)
- Updates `inputState.movement` with normalized `{ x, y }` values

```javascript
// Automatically called internally - handles:
// - Multiple simultaneous key presses (WASD + Arrow keys)
// - Diagonal movement normalization
// - Real-time state updates
```

##### `emitPlayerInput(action, data)`

**INTERNAL**: Emit structured player input event.

```javascript
// Automatically called - emits PLAYER_INPUT events with:
// - action: 'movement' or 'weapon_fire'
// - timestamp: performance.now()
// - action-specific data
```

##### `destroy()`

Clean up event listeners and input state.

```javascript
inputAdapter.destroy();
// Removes all event listeners and clears state
```

**Event Emission:**

The adapter emits structured events via EventBus:

**Movement Events:**
```javascript
// Emitted on key press/release for movement keys
EventBus.emit(EventTypes.PLAYER_INPUT, {
  action: 'movement',
  timestamp: performance.now(),
  direction: { x: 0.707, y: -0.707 }, // Normalized diagonal
  keys: ['KeyW', 'KeyD'], // Currently pressed keys
  intensity: 1.0
});
```

**Weapon Fire Events:**
```javascript
// Emitted on Space key press/release
EventBus.emit(EventTypes.PLAYER_INPUT, {
  action: 'weapon_fire',
  timestamp: performance.now(),
  state: 'start', // or 'stop'
  weapon: 'current'
});
```

**Raw Key Events:**
```javascript
// Emitted for all key presses for other systems
EventBus.emit(EventTypes.INPUT_KEY_DOWN, {
  keyCode: 'KeyW',
  originalEvent: keyboardEvent
});

EventBus.emit(EventTypes.INPUT_KEY_UP, {
  keyCode: 'KeyW',
  originalEvent: keyboardEvent
});
```

**Supported Keys:**

**Movement Keys:**
- **WASD**: `KeyW`, `KeyA`, `KeyS`, `KeyD`
- **Arrow Keys**: `ArrowUp`, `ArrowLeft`, `ArrowDown`, `ArrowRight`
- **Diagonal Movement**: Automatically normalized for consistent speed

**Action Keys:**
- **Space**: Weapon firing (continuous while held)

**Usage Example:**

```javascript
// In GameScene.js
import KeyboardInputAdapter from '@/adapters/KeyboardInputAdapter.js';
import { getEventBus } from '@/event-bus/EventBus.js';
import { EventTypes } from '@/event-bus/EventTypes.js';

class GameScene extends Phaser.Scene {
  create() {
    // Initialize input adapter
    this.inputAdapter = new KeyboardInputAdapter(this);
    this.inputAdapter.activate();

    // Listen for player input events
    const eventBus = getEventBus();
    eventBus.on(EventTypes.PLAYER_INPUT, this.handlePlayerInput, this);
  }

  handlePlayerInput(event) {
    if (event.action === 'movement') {
      // Update player movement with normalized direction
      this.player.getComponent(MovementComponent).setVelocity(
        event.direction.x * this.player.maxSpeed,
        event.direction.y * this.player.maxSpeed
      );
    } else if (event.action === 'weapon_fire') {
      if (event.state === 'start') {
        this.player.getComponent(WeaponComponent).startFiring();
      } else {
        this.player.getComponent(WeaponComponent).stopFiring();
      }
    }
  }

  destroy() {
    this.inputAdapter?.destroy();
    super.destroy();
  }
}
```

---

### EventBus Integration

**Location**: `src/event-bus/EventBus.js` & `src/event-bus/EventTypes.js`

The input management system integrates with the centralized EventBus for decoupled communication.

#### EventTypes

**Input-Related Event Types:**

```javascript
export const EventTypes = {
  // Player input events (structured, high-level)
  PLAYER_INPUT: 'player_input',
  
  // Raw input events (low-level, for specialized systems)
  INPUT_KEY_DOWN: 'input_key_down',
  INPUT_KEY_UP: 'input_key_up',
  
  // Future input types
  INPUT_POINTER_DOWN: 'input_pointer_down',
  INPUT_POINTER_UP: 'input_pointer_up',
  INPUT_GAMEPAD: 'input_gamepad',
};
```

#### EventBus Usage

**Listening for Input Events:**

```javascript
import { getEventBus } from '@/event-bus/EventBus.js';
import { EventTypes } from '@/event-bus/EventTypes.js';

const eventBus = getEventBus();

// Listen for structured player input
eventBus.on(EventTypes.PLAYER_INPUT, (event) => {
  Logger.debug('Player input:', event.action, event);
});

// Listen for raw key events (for specialized systems)
eventBus.on(EventTypes.INPUT_KEY_DOWN, (event) => {
  if (event.keyCode === 'Escape') {
    this.pauseGame();
  }
});
```

**Event Data Structures:**

All input events include consistent metadata:
- `timestamp`: High-precision timestamp from `performance.now()`
- `action`: Semantic action type ('movement', 'weapon_fire', etc.)
- Action-specific data with consistent naming conventions

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

## Testing Architecture

The Space Shooter implements comprehensive unit testing with strategic Phaser mocking to ensure architectural reliability.

### Testing Philosophy

**Expanded from Minimal to Comprehensive:**
- **Core Architecture**: Test ECS base classes, adapters, utilities, and event systems
- **Strategic Mocking**: Mock Phaser dependencies only where necessary for testing
- **36+ Test Cases**: Comprehensive coverage with edge cases and error conditions
- **Focus Areas**: Auto-initialization, flexible GameObject support, input management, object pooling

### Test Coverage Overview

#### Logger Testing (32 Test Cases)

**Location**: `tests/utils/Logger.test.js`

**Comprehensive auto-initialization testing:**

```javascript
describe('Logger Auto-Initialization', () => {
  it('should auto-initialize on first logging call', () => {
    expect(Logger.isInitialized).toBe(false);
    Logger.error('test error');
    expect(Logger.isInitialized).toBe(true);
  });

  it('should handle environment variable fallbacks', () => {
    // Tests dual environment support (Vite + Node.js)
    // Tests graceful fallbacks and error recovery
  });

  it('should support all logging methods with formatting', () => {
    // Tests debug, info, warn, error methods
    // Tests timestamp formatting and emoji prefixes
    // Tests performance methods (time, timeEnd, group, table)
  });
});
```

#### BaseEntity Testing (Flexible GameObject Support)

**Location**: `tests/entities/BaseEntity.test.js`

**GameObject type flexibility testing:**

```javascript
describe('BaseEntity GameObject Types', () => {
  it('should support backward compatibility', () => {
    const entity = new BaseEntity(mockScene, 100, 100, 64, 64, 0xff0000);
    expect(entity.gameObject).toBeInstanceOf(MockRectangle);
    expect(entity.x).toBe(100);
  });

  it('should support null GameObject for logical entities', () => {
    const entity = new BaseEntity(mockScene, { type: null, x: 100, y: 100 });
    expect(entity.gameObject).toBeNull();
    expect(entity.x).toBe(100); // Null-safe property access
  });

  it('should support runtime GameObject type changes', () => {
    const entity = new BaseEntity(mockScene, { type: 'rectangle' });
    entity.changeGameObjectType('circle', { radius: 25 });
    expect(entity.getGameObjectType()).toBe('circle');
  });
});
```

#### Object Pooling Testing

**Location**: `tests/utils/ObjectPool.test.js`

**Performance optimization testing:**

```javascript
describe('ObjectPool Management', () => {
  it('should manage object lifecycle correctly', () => {
    const pool = new ObjectPool(() => ({ active: false }), 5);
    const obj = pool.get();
    expect(obj).toBeDefined();
    expect(pool.activeCount).toBe(1);
    
    pool.release(obj);
    expect(pool.activeCount).toBe(0);
  });

  it('should handle pool limits and expansion', () => {
    // Tests initial size, max size, and dynamic expansion
    // Tests performance characteristics and memory management
  });
});
```

#### SaveManager Testing

**Location**: `tests/utils/SaveManager.test.js`

**Data persistence testing:**

```javascript
describe('SaveManager Persistence', () => {
  it('should save and load data reliably', () => {
    const testData = { score: 1000, level: 5 };
    SaveManager.save('test', testData);
    const loaded = SaveManager.load('test');
    expect(loaded).toEqual(testData);
  });

  it('should handle corrupted data gracefully', () => {
    // Tests error recovery and fallback strategies
    // Tests circular reference handling
  });
});
```

### Phaser Mocking Strategy

**Mock Configuration:**

```javascript
// tests/mocks/PhaserMocks.js
export const MockScene = {
  add: {
    existing: vi.fn(),
    rectangle: vi.fn(() => new MockRectangle()),
    sprite: vi.fn(() => new MockSprite()),
    circle: vi.fn(() => new MockCircle()),
  },
  physics: {
    add: {
      existing: vi.fn(),
    },
  },
};

export const MockRectangle = class {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.width = 32;
    this.height = 32;
    this.active = true;
    this.visible = true;
  }
};
```

**Strategic Mocking Principles:**

- **Minimal Mocking**: Only mock essential Phaser dependencies
- **Behavior Focus**: Mock behavior, not implementation details
- **Consistent Interface**: Mocks match Phaser API contracts
- **Test Isolation**: Each test has independent mock state

### Testing Utilities

**Test Setup Patterns:**

```javascript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Component Tests', () => {
  let mockScene;

  beforeEach(() => {
    mockScene = new MockScene();
    // Reset any global state
  });

  afterEach(() => {
    // Clean up test state
    vi.clearAllMocks();
  });
});
```

### Test Execution

**Running Tests:**

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test src/utils/Logger.test.js

# Generate coverage report
npm run test:coverage
```

**Test Performance:**

- **Execution Time**: ~661ms for 65+ tests
- **Success Rate**: 100% pass rate maintained
- **Coverage Focus**: Architecture components, utilities, and core systems

### Testing Guidelines

**What TO Test:**
- ✅ Auto-initialization behavior and timing
- ✅ GameObject type flexibility and edge cases
- ✅ Input adapter state management and event emission
- ✅ Object pooling lifecycle and performance
- ✅ Data persistence and error recovery
- ✅ Component-entity relationships
- ✅ Event system integration

**What NOT to Test:**
- ❌ Visual rendering and animations
- ❌ Complex Phaser integration (too fragile)
- ❌ Scene transitions and UI interactions
- ❌ Audio system (browser-dependent)
- ❌ Real-time gameplay mechanics

**Future Testing Expansion:**
- Mobile input adapter testing patterns
- Audio system mocking strategies
- Performance regression testing
- Component serialization testing

The comprehensive testing approach provides confidence in architectural changes while maintaining the project's pragmatic focus on testable components rather than visual/integration aspects.

---

## Usage Examples

### Creating a New BaseEntity Type with Flexible GameObjects

```javascript
import BaseEntity from '@/entities/BaseEntity.js';
import HealthComponent from '@/components/HealthComponent.js';
import MovementComponent from '@/components/MovementComponent.js';
import Logger from '@/utils/Logger.js';

class Enemy extends BaseEntity {
  constructor(scene, x, y, enemyType = 'basic') {
    // Use flexible configuration object for different enemy types
    const config = Enemy.getEnemyConfig(enemyType, x, y);
    super(scene, config);

    // Add components based on enemy type
    this.addComponent(new HealthComponent(config.health))
        .addComponent(new MovementComponent(config.speed));

    // Enable physics if GameObject exists
    if (this.gameObject) {
      this.enablePhysics('dynamic');
      this.setDepth(20);
    }

    Logger.debug(`Created ${enemyType} enemy at (${x}, ${y})`);
  }

  static getEnemyConfig(type, x, y) {
    const configs = {
      basic: {
        type: 'rectangle',
        x, y, width: 32, height: 32,
        color: 0xff0000,
        name: 'basic-enemy',
        health: 50,
        speed: 150
      },
      fast: {
        type: 'circle',
        x, y, radius: 16,
        color: 0xff4400,
        name: 'fast-enemy',
        health: 25,
        speed: 250
      },
      boss: {
        type: 'rectangle',
        x, y, width: 80, height: 80,
        color: 0x880000,
        name: 'boss-enemy',
        health: 500,
        speed: 80
      },
      sprite: {
        type: 'sprite',
        x, y,
        texture: 'enemy-sprite',
        frame: 0,
        name: 'sprite-enemy',
        health: 100,
        speed: 120
      }
    };
    
    return configs[type] || configs.basic;
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

  // Dynamic type change example
  upgrade() {
    Logger.info('Upgrading enemy to sprite version');
    this.changeGameObjectType('sprite', {
      texture: 'upgraded-enemy',
      frame: 0
    });
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

### Auto-Initializing Logger Usage

```javascript
import Logger from '@/utils/Logger.js';

class GameFeature {
  constructor() {
    // Logger auto-initializes on first call - no manual init() needed!
    Logger.info('GameFeature initialized');
  }

  processData(data) {
    // Logger works immediately with environment detection
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
    // Performance methods auto-initialize and work immediately
    Logger.time('Performance Test');

    Logger.group('Test Results');
    for (let i = 0; i < 1000; i++) {
      // Some operation
    }
    Logger.info('Completed 1000 operations');
    Logger.groupEnd();

    Logger.timeEnd('Performance Test');
  }

  demonstrateAutoInit() {
    // No initialization needed - these all work immediately
    Logger.debug('Debug information'); // Auto-initializes
    Logger.info('General information');
    Logger.warn('Warning message');
    Logger.error('Error information');
    
    // Performance methods also auto-initialize
    Logger.time('operation');
    // ... some operation ...
    Logger.timeEnd('operation');
    
    // Table display works immediately
    Logger.table([
      { entity: 'Player', health: 100, x: 400 },
      { entity: 'Enemy', health: 50, x: 200 }
    ]);

    // Grouping works without setup
    Logger.group('Feature Analysis');
    Logger.info('Feature working correctly');
    Logger.debug('All auto-initialization tests passed');
    Logger.groupEnd();
  }
}

// Example: Direct usage without any setup
Logger.info('Application starting'); // Works immediately!
Logger.debug('Auto-initialization successful');

// Example: Environment detection happens automatically
// Logger detects VITE_DEBUG_MODE and VITE_LOG_LEVEL automatically
// Handles both Vite and Node.js environments gracefully
// Falls back to safe defaults if environment detection fails
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
