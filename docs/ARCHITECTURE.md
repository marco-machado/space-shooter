# Architecture Guide

This document details the architectural patterns and systems used in the Space Shooter game.

## Table of Contents

- [BaseEntity-BaseComponent-BaseSystem (ECS)](#baseentity-basecomponent-basesystem-ecs)
- [Enhanced BaseEntity with Flexible GameObject Support](#enhanced-baseentity-with-flexible-gameobject-support)
- [Unified Configuration System (ConfigManager)](#unified-configuration-system-configmanager)
- [Auto-Initializing Logger System](#auto-initializing-logger-system)
- [Event-Driven Input Management](#event-driven-input-management)
- [State Management](#state-management)
- [Performance Optimization Patterns](#performance-optimization-patterns)

## BaseEntity-BaseComponent-BaseSystem (ECS)

### Core Principles

- **Entities**: Extend Phaser.GameObjects.Sprite/Image as base entities
- **Components**: Pure data containers (health, weapon stats, movement data)
- **Systems**: Handle logic and updates (movement, collision, weapons)
- **Leverage Phaser**: Use built-in Transform, Physics, Render, Input systems
- **Event-driven**: Use Phaser's EventEmitter for component communication

### Architecture Overview

```
BaseEntity (GameObject wrapper)
├── Components (Data only)
│   ├── HealthComponent
│   ├── WeaponComponent
│   ├── MovementComponent
│   └── CollisionComponent
└── Systems (Logic handlers)
    ├── MovementSystem
    ├── WeaponSystem
    ├── CollisionSystem
    └── EnemySpawnSystem
```

## Enhanced BaseEntity with Flexible GameObject Support

**NEW**: Enhanced BaseEntity with flexible GameObject types, runtime switching, and null-safe operations.

### Key Features

- **Flexible Constructor**: Auto-detect configuration object vs legacy parameters
- **Multiple GameObject Types**: rectangle, sprite, image, circle, polygon, text, or null (logical entities)
- **Runtime Type Switching**: Change GameObject type dynamically
- **Null-Safe Operations**: Works with logical entities (no visual representation)
- **Fallback Handling**: Graceful degradation on GameObject creation failures

### GameObject Types Supported

- `rectangle`: Colored rectangles for development graphics
- `sprite`: Textured sprites for production graphics
- `image`: Static images
- `circle`: Circular shapes
- `polygon`: Custom polygon shapes
- `text`: Text objects
- `null`: Logical entities with no visual representation

### Usage Pattern

```javascript
// Configuration object approach
const entity = new BaseEntity(scene, {
  type: 'rectangle',
  x: 100,
  y: 100,
  width: 64,
  height: 64,
  color: 0x0099ff,
  name: 'player'
});

// Runtime switching
entity.changeGameObjectType('circle', { radius: 32, color: 0xff0000 });

// Logical entities
const logicEntity = new BaseEntity(scene, { type: null, x: 0, y: 0 });
```

## Unified Configuration System (ConfigManager)

The project uses a unified ConfigManager scopeName that consolidates all configuration needs in a single, clean interface.

### Features

- **Unified Access**: Single source for all configuration (environment, game constants, Phaser settings)
- **Auto-Initialization**: Automatic initialization with schema-based validation
- **Production Safe**: Built-in production safety checks and failsafe defaults
- **Comprehensive Testing**: 866/866 tests passing with the unified scopeName
- **Type-Safe Parsing**: Validated parsing with bounds checking for all configuration types

### Architecture Overview

```
ConfigManager.js (Single Source)
├── Environment Variables (VITE_*)
├── Game Constants (Colors, Physics Groups, Depths, Scenes)
├── Phaser Configuration (Complete game setup)
├── Schema Validation (Type checking, bounds validation)
└── Production Safety (Failsafe defaults, security warnings)
```

### Environment Variables

- **Vite native .env support**: `import.meta.env.VITE_VARIABLE_NAME`
- **Development variables**: `VITE_DEBUG_MODE`, `VITE_LOG_LEVEL`, `VITE_PHYSICS_DEBUG`
- **Game settings**: `VITE_STARTING_LIVES`, `VITE_BASE_SCORE_MULTIPLIER`
- **Performance**: `VITE_MAX_PARTICLES`, `VITE_OBJECT_POOL_SIZE`
- **Debug display**: `VITE_SHOW_FPS`, `VITE_SHOW_DEBUG_INFO`
- **Runtime configuration**: All variables are processed through ConfigManager for validation and type safety

### Configuration Schema & Validation

ConfigManager provides comprehensive schema validation:

- **Type checking** (boolean, number, string)
- **Range validation** for numbers (min/max bounds)
- **Enum validation** for strings (allowed values)
- **Production safety** warnings
- **Cross-parameter consistency** checks

## Auto-Initializing Logger System

### Features

- **Zero Setup**: Logger auto-initializes on first method call - no manual `init()` required
- **Dual Environment Support**: Handles both Vite (`import.meta.env`) and Node.js (`process.env`)
- **Multiple levels**: `Logger.debug()`, `Logger.info()`, `Logger.warn()`, `Logger.error()`
- **Performance Methods**: `Logger.time()`, `Logger.timeEnd()`, `Logger.group()`, `Logger.table()`
- **Formatted output**: Clear prefixes, timestamps, and emoji indicators for debugging
- **Production-safe**: Automatically disabled in production builds
- **Usage**: `Logger.debug('Player spawned at', x, y)` works immediately - no setup needed

### Implementation Pattern

```javascript
static _ensureInitialized() {
  if (!this.isInitialized) {
    // Auto-initialize with dual environment support
    this.debugMode = this._getEnvVariable('VITE_DEBUG_MODE') === 'true';
    this.logLevel = this._getEnvVariable('VITE_LOG_LEVEL') || 'info';
    this.levels = { debug: 0, info: 1, warn: 2, error: 3 };
    this.isInitialized = true;
  }
}

static debug(message, ...args) {
  this._ensureInitialized(); // Auto-initialize on first call
  if (this.debugMode && this.shouldLog('debug')) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`🔍 ${timestamp} [DEBUG] ${message}`, ...args);
  }
}
```

## Event-Driven Input Management

### Architecture Components

- **KeyboardInputAdapter**: Centralized keyboard input handling with comprehensive state management
- **BaseAdapter Pattern**: Abstract base for extensible input management (touch, gamepad, etc.)
- **EventBus Integration**: Decoupled communication via structured events
- **Normalized Movement**: Diagonal movement normalization for consistent player speed
- **State Tracking**: Real-time input state with key press/release management

### Pattern Implementation

Input adapters emit structured events through EventBus:

```javascript
// Input event structure
{
  action: 'movement' | 'weapon_fire' | 'pause',
  state: boolean | { pressed: boolean, released: boolean },
  direction: { x: number, y: number }, // Normalized for movement
  timestamp: number
}
```

## State Management

### Principles

- **Centralized game state** in dedicated managers
- **Use events** for decoupled component communication
- **Persist critical data** immediately to localStorage
- **Implement fallbacks** for corrupted save data

### State Managers

- **GameStateManager**: Overall game state and progression
- **SaveManager**: Persistent data with localStorage
- **ConfigManager**: Configuration and environment state

## Performance Optimization Patterns

### Core Strategies

- **Object Pooling**: Use for bullets, enemies, and effects
- **Sprite Atlases**: Combine small sprites into texture atlases
- **Audio Sprites**: Use audio sprites for sound effects
- **Efficient Collision**: Use physics bodies appropriately
- **Update Optimization**: Only update active/visible objects

### Memory Management

- **Component Cleanup**: Proper disposal of ECS components
- **GameObject Lifecycle**: Managed creation and destruction
- **Event Unsubscription**: Clean event listeners on entity destroy
- **Asset Management**: Proper loading and unloading of resources

### Update Loop Optimization

- **Selective Updates**: Only process active entities
- **System Prioritization**: Critical systems first
- **Delta Time Usage**: Frame-rate independent movement
- **Batch Operations**: Group similar operations together

---

For detailed code examples and implementation patterns, see [EXAMPLES.md](EXAMPLES.md).

For development workflow and testing strategies, see [DEVELOPMENT.md](DEVELOPMENT.md).