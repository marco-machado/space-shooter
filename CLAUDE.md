# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a space shooter game built with Phaser.js 3.x and Vite build tooling. The game features multiple weapon types, enemy varieties, player progression, and power-up systems using an enhanced BaseEntity BaseComponent BaseSystem architecture with flexible GameObject support, auto-initializing Logger system, and event-driven input management. All game data is persisted using browser localStorage. The development phase uses simple colored rectangles for rapid prototyping before final graphics are implemented.

## Development Commands

### Setup and Installation

```bash
# Initial project setup (use official Phaser Vite template)
npm create vite@latest space-shooter -- --template vanilla
cd space-shooter
npm install phaser

# Install development dependencies (comprehensive testing setup)
npm install -D eslint prettier vitest jsdom
npm install -D @eslint/js eslint-config-prettier eslint-plugin-prettier

# Development commands
npm run dev                 # Start Vite dev server (localhost:5173)
npm run build              # Build for production
npm run preview            # Preview production build
```

### Development Workflow

#### **Standard Development Commands**
```bash
# Code quality and testing
npm run lint               # Lint entire project with ESLint
npm run lint:fix           # Auto-fix linting issues where possible
npm run format             # Format code with Prettier
npm run format:check       # Check formatting without changes

# Testing (comprehensive coverage encouraged)
npm run test               # Run all unit tests
npm run test:watch         # Watch mode for continuous testing
npm run test:coverage      # Generate test coverage report
npm run test:ui            # Run tests with Vitest UI (if configured)

# Development and build
npm run dev                # Start development server with HMR
npm run build              # Build for production
npm run preview            # Preview production build
```

#### **Individual File Operations**
```bash
# Target specific files when needed
eslint src/path/to/file.js              # Lint specific file
prettier --write src/path/to/file.js    # Format specific file
vitest src/path/to/file.test.js         # Run specific test file
```

### Environment Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit environment variables for development
# VITE_DEBUG_MODE=true
# VITE_LOG_LEVEL=debug
# VITE_PHYSICS_DEBUG=true
```

## Project Structure

```
space-shooter/
├── .env                   # Environment variables (not in git)
├── .env.example          # Template for environment setup
├── .eslintrc.js          # ESLint configuration
├── .prettierrc           # Prettier configuration
├── .prettierignore       # Prettier ignore rules
├── vite.config.js        # Vite configuration with Vitest
├── vitest.config.js      # Vitest configuration
├── package.json          # Dependencies and scripts
├── index.html            # Entry point HTML
├── src/
│   ├── main.js           # Game initialization and Phaser config
│   ├── config/           # Game configuration
│   │   ├── GameConfig.js # Phaser game configuration
│   │   ├── Constants.js  # Game constants and enums
│   │   └── Environment.js # Environment variable handling
│   ├── core/             # Core systems
│   │   ├── Logger.js     # Environment-aware logging system
│   │   └── AssetManager.js # Asset loading and management
│   ├── scenes/           # Phaser scenes
│   │   ├── BootScene.js  # Initial setup and environment loading
│   │   ├── PreloaderScene.js # Asset loading with dev graphics
│   │   ├── MainMenuScene.js  # Main menu
│   │   ├── GameScene.js  # Primary gameplay scene
│   │   └── GameOverScene.js  # End game results
│   ├── entities/         # Game entities (ECS-based)
│   │   ├── BaseEntity.js     # Base entity class (extends Phaser.GameObject)
│   │   ├── Player.js     # Player entity (blue rectangle in dev)
│   │   ├── Enemy.js      # Enemy entities (red rectangles in dev)
│   │   ├── Projectile.js # Bullet entities (small colored shapes)
│   │   └── PowerUp.js    # Power-up entities (green/purple shapes)
│   ├── components/       # ECS components (simple data classes)
│   │   ├── BaseComponent.js  # Base component class
│   │   ├── HealthComponent.js    # Health and damage
│   │   ├── WeaponComponent.js    # Weapon stats and behavior
│   │   ├── MovementComponent.js  # Movement and physics
│   │   ├── CollisionComponent.js # Collision detection
│   │   └── RenderComponent.js    # Rendering and visual effects
│   ├── systems/          # ECS systems (game logic)
│   │   ├── BaseSystem.js     # Base system class
│   │   ├── MovementSystem.js     # Handle entity movement
│   │   ├── WeaponSystem.js       # Weapon firing and projectiles
│   │   ├── CollisionSystem.js    # Collision detection and response
│   │   ├── EnemySpawnSystem.js   # Enemy wave generation
│   │   ├── ProgressionSystem.js  # XP and leveling
│   │   └── AudioSystem.js        # Sound management
│   ├── graphics/         # Development graphics generators
│   │   ├── DevShapes.js  # Colored rectangle/shape generators
│   │   └── DebugGraphics.js # Debug visualization
│   └── utils/            # Utility functions
│       ├── MathUtils.js  # Math helper functions
│       ├── ObjectPool.js # Object pooling for performance
│       └── SaveManager.js # localStorage persistence
├── tests/                # Comprehensive test coverage
│   ├── units/            # Unit tests for all components
│   ├── integration/      # Integration tests for workflows
│   ├── __mocks__/        # Mock implementations
│   └── setup.js          # Test environment setup
└── public/
    └── assets/           # Static assets (sounds, fonts)
        ├── audio/        # Sound effects and music
        └── fonts/        # Custom fonts (if any)
```

## Architecture Guidelines

### BaseEntity BaseComponent BaseSystem (ECS)

- **Entities**: Extend Phaser.GameObjects.Sprite/Image as base entities
- **Components**: Pure data containers (health, weapon stats, movement data)
- **Systems**: Handle logic and updates (movement, collision, weapons)
- **Leverage Phaser**: Use built-in Transform, Physics, Render, Input systems
- **Event-driven**: Use Phaser's EventEmitter for component communication

### Development Graphics Strategy

- **Player**: Blue 64x64px rectangle (`this.add.rectangle(x, y, 64, 64, 0x0099ff)`)
- **Enemies**: Red rectangles of varying sizes (32x32, 48x48, 80x80)
- **Projectiles**: Small yellow/orange circles or rectangles (8x8, 16x16)
- **Power-ups**: Green/purple distinctive shapes (diamonds, stars)
- **Background**: Simple gradient or solid color
- **Easy transition**: Replace with `texture` parameter when final graphics ready

### Scene Management

- Use Phaser's scene system for different game states
- Implement proper scene transitions and cleanup
- Pass data between scenes using scene.start() parameters
- Handle scene pausing/resuming for game states
- Bootstrap environment configuration in BootScene

### Performance Optimization Patterns

- **Object Pooling**: Use for bullets, enemies, and effects
- **Sprite Atlases**: Combine small sprites into texture atlases
- **Audio Sprites**: Use audio sprites for sound effects
- **Efficient Collision**: Use physics bodies appropriately
- **Update Optimization**: Only update active/visible objects

### State Management

- Centralized game state in dedicated managers
- Use events for decoupled component communication
- Persist critical data immediately to localStorage
- Implement fallbacks for corrupted save data

### Auto-Initializing Logger System

- **Zero Setup**: Logger auto-initializes on first method call - no manual `init()` required
- **Dual Environment Support**: Handles both Vite (`import.meta.env`) and Node.js (`process.env`)
- **Multiple levels**: `Logger.debug()`, `Logger.info()`, `Logger.warn()`, `Logger.error()`
- **Performance Methods**: `Logger.time()`, `Logger.timeEnd()`, `Logger.group()`, `Logger.table()`
- **Formatted output**: Clear prefixes, timestamps, and emoji indicators for debugging
- **Production-safe**: Automatically disabled in production builds
- **Usage**: `Logger.debug('Player spawned at', x, y)` works immediately - no setup needed

### Environment Configuration

- **Vite native .env support**: `import.meta.env.VITE_VARIABLE_NAME`
- **Development variables**: `VITE_DEBUG_MODE`, `VITE_LOG_LEVEL`, `VITE_PHYSICS_DEBUG`
- **Runtime configuration**: Environment variables available in browser
- **Example .env**:
  ```
  VITE_DEBUG_MODE=true
  VITE_LOG_LEVEL=debug
  VITE_PHYSICS_DEBUG=true
  VITE_AUDIO_ENABLED=true
  ```

### Event-Driven Input Management

- **KeyboardInputAdapter**: Centralized keyboard input handling with comprehensive state management
- **BaseAdapter Pattern**: Abstract base for extensible input management (touch, gamepad, etc.)
- **EventBus Integration**: Decoupled communication via structured events
- **Normalized Movement**: Diagonal movement normalization for consistent player speed
- **State Tracking**: Real-time input state with key press/release management

```javascript
// KeyboardInputAdapter pattern with EventBus integration
import KeyboardInputAdapter from '@/adapters/KeyboardInputAdapter.js';
import { getEventBus } from '@/event-bus/EventBus.js';
import { EventTypes } from '@/event-bus/EventTypes.js';

class GameScene extends Phaser.Scene {
  create() {
    // Initialize input adapter
    this.inputAdapter = new KeyboardInputAdapter(this);
    this.inputAdapter.activate();

    // Listen for structured input events
    const eventBus = getEventBus();
    eventBus.on(EventTypes.PLAYER_INPUT, this.handlePlayerInput, this);
  }

  handlePlayerInput(event) {
    if (event.action === 'movement') {
      // Normalized diagonal movement - no speed advantage
      this.player.setVelocity(
        event.direction.x * this.player.maxSpeed,
        event.direction.y * this.player.maxSpeed
      );
    } else if (event.action === 'weapon_fire') {
      this.player.getComponent(WeaponComponent).handleFiring(event.state);
    }
  }
}
```

## Code Quality Standards

### Modern Development Practices

✅ **Comprehensive Testing and Quality Assurance**

This project encourages modern development practices with comprehensive testing coverage:

#### **Full Project Linting**
- **ENCOURAGED**: `npm run lint` for project-wide code quality
- **AUTO-FIX**: Use `npm run lint:fix` to automatically resolve issues
- **CONSISTENT**: Apply ESLint rules consistently across all files
- **BEST PRACTICE**: Integrate linting into your development workflow

#### **Comprehensive Testing Strategy**
- **UNIT TESTS**: Test all components, utilities, systems, and entities
- **INTEGRATION TESTS**: Test interactions between systems and components
- **COMPONENT TESTS**: Test game entities and their behaviors
- **SYSTEM TESTS**: Test ECS systems with proper mocking
- **COVERAGE**: Aim for high test coverage across the codebase

#### **Quality Assurance Workflow**
- **AUTOMATED**: Run tests automatically during development
- **CONTINUOUS**: Use watch mode for immediate feedback
- **COMPREHENSIVE**: Test both happy paths and edge cases
- **MAINTAINABLE**: Keep tests clean, readable, and well-organized

### ESLint Configuration

- **Standard Rules**: Use ESLint recommended rules with Prettier integration
- **No console.log()**: Enforce Logger system usage instead of console methods
- **ES6+ Rules**: Modern JavaScript patterns and best practices
- **Phaser-specific**: Custom rules for Phaser GameObject lifecycle
- **Error Prevention**: Catch common game development mistakes early
- **PROJECT-WIDE**: Apply linting consistently across the entire project

### Prettier Configuration

- **Consistent Formatting**: Auto-format on save
- **2-space indentation**: Clean, readable code structure
- **Single quotes**: Consistent string quoting
- **Trailing commas**: Easier git diffs and array management
- **Line length**: 100 characters for readability

### JavaScript/ES6+ Conventions

- Use ES6 modules for all imports/exports
- Prefer const/let over var
- Use arrow functions for short callbacks
- Implement proper error handling with try/catch
- Use meaningful variable and function names
- **No console.log()**: Always use Logger system instead
- **Async/await**: Prefer over Promise chains for readability

### Enhanced ECS Architecture with Flexible GameObject Support

**NEW**: Enhanced BaseEntity with flexible GameObject types, runtime switching, and null-safe operations.

```javascript
// src/entities/BaseEntity.js - Enhanced flexible entity class
import Logger from '@/utils/Logger.js';

class BaseEntity {
  constructor(scene, ...args) {
    this.scene = scene;
    this.components = new Map();
    this.entityId = `entity_${Date.now()}_${Math.random()}`;
    
    // Flexible constructor - auto-detect signature
    if (args.length === 1 && typeof args[0] === 'object') {
      // NEW: Configuration object approach
      this.initFromConfig(scene, args[0]);
    } else {
      // BACKWARD COMPATIBLE: Legacy constructor
      this.initFromLegacy(scene, ...args);
    }
  }

  initFromConfig(scene, config) {
    this.config = { ...config };
    this.name = config.name || 'unnamed-entity';
    
    // Create GameObject based on type (or null for logical entities)
    this.gameObject = this.createGameObject(config);
    
    // Setup entity in scene
    this.setupInScene();
  }

  createGameObject(config) {
    const { type, x = 0, y = 0 } = config;
    
    try {
      switch (type) {
        case 'rectangle':
          return this.scene.add.rectangle(x, y, config.width, config.height, config.color);
        case 'sprite':
          return this.scene.add.sprite(x, y, config.texture, config.frame);
        case 'image':
          return this.scene.add.image(x, y, config.texture);
        case 'circle':
          return this.scene.add.circle(x, y, config.radius || 16, config.color);
        case 'polygon':
          return this.scene.add.polygon(x, y, config.points || [0, -12, 12, 0, 0, 12, -12, 0], config.color);
        case 'text':
          return this.scene.add.text(x, y, config.text || '', config.style || {});
        case null:
          // Logical entity - no visual representation
          this.logicalPosition = { x, y };
          return null;
        default:
          Logger.warn(`Unknown GameObject type: ${type}, falling back to rectangle`);
          return this.scene.add.rectangle(x, y, 32, 32, 0xffffff);
      }
    } catch (error) {
      Logger.error('GameObject creation failed, using fallback rectangle:', error);
      return this.scene.add.rectangle(x, y, 32, 32, 0xff0000);
    }
  }

  // NEW: Runtime GameObject type switching
  changeGameObjectType(newType, newConfig = {}) {
    const oldPosition = { x: this.x, y: this.y };
    
    // Destroy old GameObject if it exists
    if (this.gameObject) {
      this.gameObject.destroy();
    }
    
    // Create new GameObject
    this.gameObject = this.createGameObject({
      type: newType,
      x: oldPosition.x,
      y: oldPosition.y,
      ...newConfig
    });
    
    // Re-setup in scene
    this.setupInScene();
    
    Logger.debug(`Changed GameObject type to ${newType} for entity ${this.name}`);
  }

  getGameObjectType() {
    if (!this.gameObject) return null;
    if (this.gameObject.type) return this.gameObject.type;
    // Fallback detection based on GameObject properties
    if (this.gameObject.texture) return 'sprite';
    if (this.gameObject.fillColor !== undefined) return 'rectangle';
    return 'unknown';
  }

  // NULL-SAFE property delegation
  get x() { return this.gameObject ? this.gameObject.x : (this.logicalPosition?.x || 0); }
  set x(value) { 
    if (this.gameObject) this.gameObject.x = value;
    else if (this.logicalPosition) this.logicalPosition.x = value;
  }
  
  get y() { return this.gameObject ? this.gameObject.y : (this.logicalPosition?.y || 0); }
  set y(value) { 
    if (this.gameObject) this.gameObject.y = value;
    else if (this.logicalPosition) this.logicalPosition.y = value;
  }

  get active() { return this.gameObject ? this.gameObject.active : this._active !== false; }
  set active(value) { 
    if (this.gameObject) this.gameObject.active = value;
    else this._active = value;
  }

  get visible() { return this.gameObject ? this.gameObject.visible : this._visible !== false; }
  set visible(value) { 
    if (this.gameObject) this.gameObject.visible = value;
    else this._visible = value;
  }

  // Component management (unchanged)
  addComponent(component) {
    component.entity = this;
    this.components.set(component.constructor.name, component);
    Logger.debug(`Added component ${component.constructor.name} to entity ${this.name}`);
    return this;
  }

  getComponent(componentType) {
    return this.components.get(componentType.name);
  }

  hasComponent(componentType) {
    return this.components.has(componentType.name);
  }

  // NULL-SAFE physics enablement
  enablePhysics(bodyType = 'dynamic') {
    if (this.gameObject && this.scene.physics) {
      this.scene.physics.add.existing(this.gameObject);
      // Configure physics body based on type
    }
    return this;
  }

  destroy() {
    // Clean up components
    this.components.clear();
    
    // Destroy GameObject if it exists
    if (this.gameObject) {
      this.gameObject.destroy();
    }
    
    // Remove from scene registry
    if (this.scene.entities) {
      const index = this.scene.entities.indexOf(this);
      if (index > -1) this.scene.entities.splice(index, 1);
    }
  }
}

// src/components/BaseComponent.js - Base component class
class BaseComponent {
  constructor() {
    // Base class for all components (optional - components can be plain objects)
  }
}

// src/components/HealthComponent.js - Example component (pure data)
class HealthComponent extends BaseComponent {
  constructor(maxHealth = 100) {
    super();
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
    this.invulnerable = false;
  }
}

// src/systems/BaseSystem.js - Base system class
class BaseSystem {
  constructor() {
    this.name = this.constructor.name;
  }

  update(entities, delta) {
    // Override in subclasses
    throw new Error(`${this.name} must implement update() method`);
  }
}

// src/systems/MovementSystem.js - Example system (logic handler)
import { MovementComponent } from '@/components/MovementComponent.js';
import Logger from '@/utils/Logger.js';

class MovementSystem extends BaseSystem {
  update(entities, delta) {
    entities.forEach(entity => {
      const movement = entity.getComponent(MovementComponent);
      if (movement) {
        entity.x += movement.velocityX * delta;
        entity.y += movement.velocityY * delta;
        Logger.debug(`BaseEntity moved to`, entity.x, entity.y);
      }
    });
  }
}

// Development graphics helper
import Logger from '@/utils/Logger.js';

class DevShapes {
  static createPlayer(scene, x, y) {
    const player = scene.add.rectangle(x, y, 64, 64, 0x0099ff);
    scene.physics.add.existing(player);
    Logger.info('Created player rectangle at', x, y);
    return player;
  }

  static createEnemy(scene, x, y, size = 32) {
    const enemy = scene.add.rectangle(x, y, size, size, 0xff0000);
    scene.physics.add.existing(enemy);
    Logger.info('Created enemy rectangle at', x, y);
    return enemy;
  }
}
```

### Example Test Implementations

**Comprehensive testing examples with proper mocking and coverage.**

```javascript
// AUTO-INITIALIZING LOGGER TESTS
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Logger from '@/utils/Logger.js';

describe('Logger System', () => {
  beforeEach(() => {
    Logger.isInitialized = false;
    vi.clearAllMocks();
  });

  it('should auto-initialize on first method call', () => {
    expect(Logger.isInitialized).toBe(false);
    Logger.debug('test message');
    expect(Logger.isInitialized).toBe(true);
  });

  it('should handle environment variables correctly', () => {
    Logger.debug('Environment test');
    expect(Logger.debugMode).toBeDefined();
    expect(Logger.logLevel).toBeDefined();
  });

  it('should support all logging levels', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    Logger.debug('debug message');
    Logger.info('info message');
    Logger.warn('warning message');
    Logger.error('error message');
    expect(consoleSpy).toHaveBeenCalled();
  });
});

// BASEENTITY COMPREHENSIVE TESTS
import BaseEntity from '@/entities/BaseEntity.js';
import { MockScene } from '../__mocks__/PhaserMocks.js';
import HealthComponent from '@/components/HealthComponent.js';

describe('BaseEntity', () => {
  let mockScene;

  beforeEach(() => {
    mockScene = new MockScene();
  });

  it('should create entity with components', () => {
    const entity = new BaseEntity(mockScene, { type: 'rectangle' });
    const health = new HealthComponent(100);
    
    entity.addComponent(health);
    expect(entity.hasComponent(HealthComponent)).toBe(true);
    expect(entity.getComponent(HealthComponent)).toBe(health);
  });

  it('should handle GameObject type switching', () => {
    const entity = new BaseEntity(mockScene, { type: 'rectangle' });
    entity.changeGameObjectType('circle', { radius: 25 });
    expect(entity.getGameObjectType()).toBe('circle');
  });

  it('should support logical entities without GameObjects', () => {
    const entity = new BaseEntity(mockScene, { type: null });
    expect(entity.gameObject).toBeNull();
    entity.x = 100;
    expect(entity.x).toBe(100);
  });
});

// COMPONENT TESTS
import HealthComponent from '@/components/HealthComponent.js';

describe('HealthComponent', () => {
  it('should initialize with correct values', () => {
    const health = new HealthComponent(100);
    expect(health.maxHealth).toBe(100);
    expect(health.currentHealth).toBe(100);
    expect(health.invulnerable).toBe(false);
  });

  it('should handle damage correctly', () => {
    const health = new HealthComponent(100);
    health.currentHealth -= 25;
    expect(health.currentHealth).toBe(75);
  });
});

// SYSTEM TESTS WITH MOCKING
import MovementSystem from '@/systems/MovementSystem.js';
import MovementComponent from '@/components/MovementComponent.js';

describe('MovementSystem', () => {
  let system;
  let mockEntities;

  beforeEach(() => {
    system = new MovementSystem();
    mockEntities = [
      {
        x: 0,
        y: 0,
        getComponent: vi.fn().mockReturnValue(new MovementComponent(5, 0))
      }
    ];
  });

  it('should update entity positions', () => {
    system.update(mockEntities, 16); // 16ms delta
    expect(mockEntities[0].x).toBe(80); // 5 * 16
  });
});

// SCENE TESTS
import GameScene from '@/scenes/GameScene.js';
import { MockScene } from '../__mocks__/PhaserMocks.js';

describe('GameScene', () => {
  let scene;

  beforeEach(() => {
    scene = new GameScene();
    // Mock Phaser scene methods
    scene.add = { rectangle: vi.fn() };
    scene.physics = { add: { existing: vi.fn() } };
  });

  it('should initialize player correctly', () => {
    scene.create();
    expect(scene.player).toBeDefined();
    expect(scene.add.rectangle).toHaveBeenCalled();
  });
});

// INTEGRATION TESTS
describe('ECS Integration', () => {
  it('should handle complete entity lifecycle', () => {
    const scene = new MockScene();
    const entity = new BaseEntity(scene, { type: 'rectangle' });
    const health = new HealthComponent(100);
    const movement = new MovementComponent(5, 0);
    
    entity.addComponent(health);
    entity.addComponent(movement);
    
    const movementSystem = new MovementSystem();
    movementSystem.update([entity], 16);
    
    expect(entity.x).toBe(80);
    expect(entity.hasComponent(HealthComponent)).toBe(true);
  });
});
```

### Mock Implementation Examples

```javascript
// tests/__mocks__/PhaserMocks.js
export class MockScene {
  constructor() {
    this.add = {
      rectangle: vi.fn(() => new MockRectangle()),
      sprite: vi.fn(() => new MockSprite()),
      circle: vi.fn(() => new MockCircle())
    };
    this.physics = {
      add: {
        existing: vi.fn()
      }
    };
    this.input = {
      on: vi.fn(),
      emit: vi.fn()
    };
  }
}

export class MockRectangle {
  constructor(x = 0, y = 0, width = 32, height = 32, color = 0xffffff) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.fillColor = color;
    this.active = true;
    this.visible = true;
  }

  destroy() {
    this.active = false;
  }
}
```

### Asset Management (Development Phase)

- **Development Graphics**: Use Phaser's shape generators instead of image files
- **Colors for Development**:
  - Player: `0x0099ff` (blue)
  - Enemies: `0xff0000` (red), `0xcc0000` (dark red for bosses)
  - Projectiles: `0xffff00` (yellow), `0xff8800` (orange)
  - Power-ups: `0x00ff00` (green), `0x8800ff` (purple)
  - UI: `0xffffff` (white text), `0x333333` (dark backgrounds)
- **Audio**: Place in `public/assets/audio/` for static loading
- **Future**: Easy transition to PNG sprites by replacing shape creation with `scene.add.sprite()`

### Data Persistence

```javascript
// SaveManager pattern with Logger integration
import Logger from '@/utils/Logger.js';

class SaveManager {
  static save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      Logger.debug('Saved data to localStorage:', key);
    } catch (error) {
      Logger.error('Failed to save data:', error);
    }
  }

  static load(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      const result = data ? JSON.parse(data) : defaultValue;
      Logger.debug('Loaded data from localStorage:', key, result);
      return result;
    } catch (error) {
      Logger.error('Failed to load data:', error);
      return defaultValue;
    }
  }
}

// Auto-initializing Logger system pattern
class Logger {
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

  static info(message, ...args) {
    this._ensureInitialized(); // Auto-initialize on first call
    if (this.shouldLog('info')) {
      const timestamp = new Date().toLocaleTimeString();
      console.info(`ℹ️ ${timestamp} [INFO] ${message}`, ...args);
    }
  }

  static warn(message, ...args) {
    this._ensureInitialized(); // Auto-initialize on first call
    if (this.shouldLog('warn')) {
      const timestamp = new Date().toLocaleTimeString();
      console.warn(`⚠️ ${timestamp} [WARN] ${message}`, ...args);
    }
  }

  static error(message, ...args) {
    this._ensureInitialized(); // Auto-initialize on first call
    if (this.shouldLog('error')) {
      const timestamp = new Date().toLocaleTimeString();
      console.error(`❌ ${timestamp} [ERROR] ${message}`, ...args);
    }
  }

  static _getEnvVariable(name) {
    // Dual environment support with graceful fallbacks
    try {
      return import.meta?.env?.[name] || process?.env?.[name] || undefined;
    } catch {
      return undefined;
    }
  }

  static shouldLog(level) {
    this._ensureInitialized();
    return this.levels[level] >= this.levels[this.logLevel];
  }

  // Performance methods - also auto-initialize
  static time(label) {
    this._ensureInitialized();
    if (this.debugMode) console.time(`⏱️ ${label}`);
  }

  static timeEnd(label) {
    this._ensureInitialized();
    if (this.debugMode) console.timeEnd(`⏱️ ${label}`);
  }
}
```

## Testing Guidelines (COMPREHENSIVE APPROACH)

### Modern Testing Philosophy

- **Test Everything**: Comprehensive unit testing across all components, systems, entities, and utilities
- **Quality First**: High test coverage ensures code reliability and maintainability
- **Automated Testing**: Continuous testing during development with watch mode
- **Mock When Needed**: Use strategic mocking for external dependencies like Phaser
- **TDD Encouraged**: Write tests first when developing new features
- **Maintainable Tests**: Keep tests clean, readable, and well-organized

### What TO Test (COMPREHENSIVE COVERAGE)

#### ✅ UNIT TESTING (All Components)
- **Logger System**: Auto-initialization, environment detection, all logging methods
- **BaseEntity**: GameObject lifecycle, component management, flexible construction
- **Components**: All component classes (Health, Weapon, Movement, Collision, etc.)
- **Systems**: All ECS systems (Movement, Weapon, Collision, EnemySpawn, etc.)
- **Entities**: Player, Enemy, Projectile, PowerUp classes and their behaviors
- **Utilities**: Math functions, ObjectPool, SaveManager, all helper functions
- **Adapters**: Input adapters, EventBus integration, state management
- **Scenes**: Scene logic, transitions, initialization, and cleanup
- **Configuration**: GameConfig, Environment, Constants validation

#### ✅ INTEGRATION TESTING
- **ECS Integration**: Entity-Component-System interactions
- **Event System**: EventBus message passing and handling
- **Scene Transitions**: Data flow between scenes
- **Save/Load**: Complete persistence workflows
- **Input Handling**: End-to-end input processing

#### ✅ TESTING STRATEGIES
- **Phaser Mocking**: Mock Phaser objects and scenes for isolated testing
- **Component Testing**: Test components in isolation and integration
- **System Testing**: Test systems with mock entities and components
- **End-to-End**: Test complete workflows with minimal mocking

### Test Organization Structure

```bash
tests/
├── units/                  # Unit tests for all components
│   ├── components/         # Component tests
│   │   ├── HealthComponent.test.js
│   │   ├── WeaponComponent.test.js
│   │   ├── MovementComponent.test.js
│   │   └── CollisionComponent.test.js
│   ├── systems/            # System tests
│   │   ├── MovementSystem.test.js
│   │   ├── WeaponSystem.test.js
│   │   ├── CollisionSystem.test.js
│   │   └── EnemySpawnSystem.test.js
│   ├── entities/           # Entity tests
│   │   ├── BaseEntity.test.js
│   │   ├── Player.test.js
│   │   ├── Enemy.test.js
│   │   └── Projectile.test.js
│   ├── scenes/             # Scene tests
│   │   ├── GameScene.test.js
│   │   ├── MainMenuScene.test.js
│   │   └── PreloaderScene.test.js
│   └── utils/              # Utility tests
│       ├── Logger.test.js
│       ├── ObjectPool.test.js
│       ├── SaveManager.test.js
│       └── MathUtils.test.js
├── integration/            # Integration tests
│   ├── ecs-integration.test.js
│   ├── scene-transitions.test.js
│   └── save-load-workflow.test.js
├── __mocks__/              # Mock implementations
│   ├── PhaserMocks.js      # Comprehensive Phaser mocking
│   ├── LocalStorageMock.js # localStorage mock
│   └── BrowserMocks.js     # Browser API mocks
└── setup.js                # Test environment setup
```

### Testing Best Practices

#### **Mocking Strategy**
- **Phaser Objects**: Create comprehensive mocks for Phaser scenes and GameObjects
- **Browser APIs**: Mock localStorage, audio, and other browser-specific APIs
- **External Dependencies**: Mock any external libraries or services
- **Minimal Mocking**: Mock only what's necessary for isolated testing

#### **Test Structure**
- **Arrange-Act-Assert**: Clear test structure for readability
- **Descriptive Names**: Test names should clearly describe what they test
- **Edge Cases**: Test both happy paths and error conditions
- **Isolated Tests**: Each test should be independent and repeatable

#### **Coverage Goals**
- **Unit Tests**: 80%+ coverage for all business logic
- **Integration Tests**: Cover critical workflows and interactions
- **Component Tests**: Test all public interfaces and behaviors
- **System Tests**: Validate system-level functionality

### TDD Workflow (Test-Driven Development)

1. **Red**: Write a failing test that describes the desired behavior
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve code quality while keeping tests green
4. **Repeat**: Continue the cycle for each new feature or change

### Testing Commands Reference

```bash
# Run all tests
npm run test

# Watch mode for continuous testing
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
vitest tests/units/components/HealthComponent.test.js

# Run tests matching pattern
vitest --grep "BaseEntity"

# Run tests with UI interface
npm run test:ui
```

### Manual Testing Complement

While comprehensive unit testing is the foundation, manual testing remains important for:

- **User Experience**: Game feel, balance, and fun factor
- **Visual Verification**: Graphics, animations, and visual effects  
- **Performance**: Real-world performance under various conditions
- **Browser Compatibility**: Testing across different browsers and devices
- **Audio**: Sound effects and music integration

#### Manual Testing Checklist

- [ ] Game loads without errors in target browsers
- [ ] Player movement feels responsive and smooth
- [ ] Weapons fire correctly and hit targets accurately
- [ ] Enemies spawn and behave as expected
- [ ] Power-ups can be collected and provide benefits
- [ ] Game saves and loads progress correctly
- [ ] All unit tests pass
- [ ] Code coverage meets targets
- [ ] ESLint and Prettier pass without errors

## Debugging Tips

### Common Issues

- **Performance drops**: Check for memory leaks, excessive object creation
- **Asset loading failures**: Verify file paths and formats
- **Audio issues**: Check browser autoplay policies
- **Save/load problems**: Validate JSON structure and localStorage limits
- **Physics glitches**: Review collision groups and body configurations

### Development Tools

- Use browser developer tools for performance profiling
- Enable Phaser debug mode for collision visualization
- Implement debug overlays for game state visualization
- Use console.log judiciously (remove for production)

## Deployment Considerations

### Build Optimization

- Minify JavaScript and CSS
- Optimize images and audio files
- Use texture atlases to reduce HTTP requests
- Implement proper caching headers
- Consider Progressive Web App features

### Browser Compatibility

- Test across target browsers and versions
- Provide WebGL fallbacks where necessary
- Handle touch input for mobile devices
- Consider viewport scaling for different screen sizes

## Asset Guidelines

### Development Phase Graphics

- **Player**: Blue 64x64px rectangle (`scene.add.rectangle(x, y, 64, 64, 0x0099ff)`)
- **Enemies**: Red rectangles of varying sizes (32x32, 48x48, 80x80)
- **Projectiles**: Small yellow/orange rectangles or circles (8x8, 16x16)
- **Power-ups**: Green/purple distinctive shapes (diamonds using `scene.add.polygon()`)
- **UI**: White text on dark backgrounds, simple geometric buttons
- **Background**: Solid color or simple CSS gradient

### Production Phase Graphics (Future)

- Player ship: 64x64px sprite with engine trail animation
- Enemies: 32x32px to 128x128px depending on type
- Projectiles: 8x8px to 16x16px sprites
- UI elements: SVG graphics for scalability
- Background: Seamless tileable space backgrounds

### Audio Requirements

- Sound effects: Short, punchy samples (<1 second typically)
- Background music: Looping tracks (2-4 minutes)
- File format: OGG Vorbis preferred, MP3 fallback
- Volume levels: Normalized and balanced across all audio
- **Phaser Integration**: Use Web Audio API with spatial positioning

## Performance Targets

### Frame Rate

- Maintain 60 FPS on target hardware
- Graceful degradation on slower devices
- Monitor and optimize update loops

### Memory Usage

- Keep total memory under 100MB
- Implement object pooling for frequently created objects
- Clean up unused assets between scenes

### Loading Times

- Initial load: <3 seconds on broadband
- Scene transitions: <500ms
- Use loading screens for user feedback

This documentation should be updated as the project evolves and new patterns or requirements emerge.
