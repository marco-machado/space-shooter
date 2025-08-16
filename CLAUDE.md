# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a space shooter game built with Phaser.js 3.x and Vite build tooling. The game follows a traditional Phaser scene-based architecture with centralized event management through EventBus, unified ConfigManager for configuration, auto-initializing Logger for debugging, and GameStateManager for progression. The project is currently in active refactoring from an ECS-based approach to a simpler scene-based architecture. Uses simple colored rectangles for rapid prototyping before final graphics are implemented.

## Quick Start Commands

### Essential Development Commands

```bash
# Start development server
npm run dev                # localhost:5173

# Code quality and testing
npm run lint <files>       # Lint specific files only
npm run lint:fix           # Auto-fix linting issues
npm run format             # Format all files with Prettier
npm run format:check       # Check formatting without changes
npm run test               # Run all tests
npm run test:watch         # Continuous testing
npm run test:coverage      # Run tests with coverage report
npm run validate           # Run lint + format check + tests

# Lint specific files or patterns
npm run lint src/scenes/*.js    # Lint specific directory
npm run lint $(git diff --cached --name-only --diff-filter=ACMR | grep '\.js$')   # Lint staged files
npm run lint $(git diff --name-only --diff-filter=ACMR | grep '\.js$')            # Lint modified files

# Build
npm run build              # Production build
npm run preview            # Preview build
```

### Environment Setup

```bash
# Copy example environment file
cp .env.example .env

# Edit environment variables for development
# VITE_DEBUG_MODE=true
# VITE_LOG_LEVEL=debug
# VITE_PHYSICS_DEBUG=true
```

## Key Architecture Concepts

### Auto-Initializing Systems

- **Logger**: `Logger.debug('message')` works immediately - no setup needed
- **ConfigManager**: `ConfigManager.getConfig()` auto-initializes with validation
- **EventBus**: Centralized event management with getEventBus() singleton
- **GameStateManager**: Handles score, lives, progression, and game state transitions

### Scene-Based Architecture

Current project structure follows traditional Phaser patterns:
- **BootScene**: Environment setup and configuration validation
- **PreloaderScene**: Asset loading
- **MainMenuScene**: Game start menu interface
- **GameScene**: Main gameplay with collision groups and game loop
- **UIScene**: HUD and interface elements

### Graphics Strategy

- **Player**: Blue 64x64px rectangle (`0x0099ff`) - not yet implemented
- **Enemies**: Red rectangles of varying sizes (`0xff0000`) - not yet implemented
- **Projectiles**: Yellow/orange small shapes (`0xffff00`, `0xff8800`) - not yet implemented
- **Power-ups**: Green/purple polygons (`0x00ff00`, `0x8800ff`) - not yet implemented
- **Background**: Dark space with animated stars

### Core Patterns

- **Scene Management**: Traditional Phaser scene flow with proper lifecycle management
- **Event-Driven Architecture**: EventBus for decoupled communication between systems
- **Configuration Management**: Centralized config with environment variable support
- **Error Handling**: Global error handling with user-friendly messages
- **State Management**: GameStateManager for progression, scores, and persistence

## Current Implementation Status

### Completed Features (Sprint 2 Complete)
1. **Core Game Structure**: SpaceShooterGame main class with Phaser integration
2. **Scene Management**: Boot → Preloader → MainMenu → GameScene → UIScene flow
3. **Event System**: EventBus with GameEvents, EnemyEvents, and EventTypes
4. **Background**: Animated starfield with scrolling stars
5. **Player System**: Full player entity with WASD movement and weapon firing
6. **Enemy System**: Complete AI with 3 enemy types (Scout, Fighter, Bomber) and level spawning
7. **Weapon System**: 3 weapon types (Laser, Plasma, Missile) with switching and upgrades
8. **Projectile System**: Object pooling for performance with auto-cleanup
9. **Collision System**: Spatial grid optimization with layer-based collision detection
10. **Health System**: Damage dealing/receiving with visual feedback
11. **Game State**: Score tracking, lives, level progression, achievements, and persistence
12. **UI System**: Real-time HUD with health, score, level info, and weapon status
13. **Performance**: 60+ FPS with object pooling and spatial optimization

### Recently Implemented (Sprint 2)
- **Component Architecture**: Health, Movement, Weapon, and Collision components
- **Entity System**: Player, Enemy, Projectile, and Background entities
- **Game Systems**: EnemySystem for AI and spawning logic
- **Advanced Features**: Formation flying, AI state machines, weapon progression

### Debug Features
- **E Key**: Debug spawn key placeholder (currently just logs)
- **ESC Key**: Pause toggle functionality
- **Console Logs**: Comprehensive logging with Logger.scope() pattern
- **Error Display**: Visual error messages with reload functionality

## Usage Examples

### Configuration Access

```javascript
import ConfigManager from '@/config/ConfigManager.js';

// ConfigManager auto-initializes on first use
const config = ConfigManager.getConfig();
const phaserConfig = ConfigManager.getPhaserConfig();

// Register scenes with ConfigManager
ConfigManager.registerScenes([BootScene, PreloaderScene, MainMenuScene, GameScene, UIScene]);

// Validation
if (!ConfigManager.validate()) {
  throw new Error('Invalid configuration');
}
```

### Event System Usage

```javascript
import { getEventBus } from '@/event-bus/EventBus.js';
import { EventTypes } from '@/event-bus/EventTypes.js';

// Get singleton EventBus instance
const eventBus = getEventBus();

// Emit events
eventBus.emit(EventTypes.GAME_PAUSE_TOGGLE, { paused: true });
eventBus.emit(EventTypes.WINDOW_RESIZE);

// Listen for events
eventBus.on(EventTypes.GAME_ERROR, this.handleError, this);
eventBus.off(EventTypes.GAME_ERROR, this.handleError, this);
```

### Logger Usage

```javascript
import Logger from '@/utils/Logger.js';

// Class-based pattern (preferred for classes)
class MyGameClass {
  #logger;
  
  constructor() {
    this.#logger = Logger.scope('MyGameClass');
  }
  
  someMethod() {
    this.#logger.debug('Method called');
    this.#logger.info('Important event');
    this.#logger.warn('Warning condition');
    this.#logger.error('Error occurred');
  }
}

// Global logging methods (for standalone functions/utilities)
Logger.debug('Player spawned at', x, y);
Logger.info('Level completed');
Logger.warn('Low health warning');
Logger.error('Critical error');

// Direct scoped logging (when not using class pattern)
Logger.scope('SpaceShooterGame').info('Destroying game instance');
Logger.scope('GameScene').debug('Enemy spawned', enemy.id);
Logger.scope('WeaponSystem').warn('Weapon overheating');

// Performance methods (debug mode only)
Logger.scope('Performance').time('operation');
Logger.scope('Performance').timeEnd('operation');
Logger.scope('Debug').group('Entity Updates');
Logger.scope('Debug').groupEnd();
Logger.scope('Debug').table(entityData);
```

## Project Structure

The project is currently organized as follows:

```
src/
├── main.js                 # Entry point, initializes SpaceShooterGame
├── core/
│   └── SpaceShooterGame.js # Main game class with Phaser setup
├── scenes/                 # Phaser scene classes
│   ├── BootScene.js       # Environment and initialization
│   ├── PreloaderScene.js  # Asset loading
│   ├── MainMenuScene.js   # Main menu interface  
│   ├── GameScene.js       # Core gameplay with integrated systems
│   ├── UIScene.js         # Game UI overlay with real-time stats
│   └── index.js           # Scene exports
├── config/                 # Configuration management
│   ├── ConfigManager.js   # Main configuration manager
│   ├── GameConfig.js      # Game-specific settings
│   ├── PhaserConfig.js    # Phaser engine configuration
│   ├── VisualConfig.js    # Graphics and UI settings
│   ├── CollisionConfig.js # Collision layer definitions
│   ├── PerformanceConfig.js # Performance optimization settings
│   └── EnvironmentSchema.js # Environment variable validation
├── entities/               # Game entity classes
│   ├── Player.js          # Player entity with movement and shooting
│   ├── Enemy.js           # Enemy entities with AI and state machines
│   ├── Projectile.js      # Projectile system with object pooling
│   └── Background.js      # Animated starfield background
├── components/             # Data components for entities
│   └── Health.js          # Health component for damage system
├── systems/                # Game logic systems
│   └── EnemySystem.js     # Enemy AI, spawning, and level management
├── event-bus/             # Event system
│   ├── EventBus.js       # Singleton event manager
│   ├── EventTypes.js     # Core event type constants
│   ├── GameEvents.js     # Game-specific events
│   └── EnemyEvents.js    # Enemy system events
└── utils/
    ├── Logger.js          # Auto-initializing logger with scopes
    └── GameStateManager.js # Game state, progression, and persistence
```

## Code Quality Standards

- **ESLint**: Lint specific files only, avoid whole-project linting
- **No console.log()**: Always use Logger system instead
- **Logger Pattern**: Use `Logger.scope('ModuleName')` for all debugging output
- **Scene Management**: Follow Phaser scene lifecycle patterns
- **Event-Driven**: Use EventBus for decoupled communication
- **Modern JavaScript**: ES6+ patterns, async/await preferred

## Performance Targets

- **60 FPS** on target hardware
- **<100MB** total memory usage  
- **<3 seconds** initial load time
- **Efficient scene management** with proper cleanup

## Code Style Guidelines

### **Private Members & Naming**
- **Private Fields**: Use `#` private fields for true encapsulation
- **JSDoc Standards**: All private members must include `@private` tag
- **camelCase**: Use camelCase for variables, functions, and methods
- **PascalCase**: Use PascalCase for classes and constructors
- **No Underscores**: Avoid leading/trailing underscores (creates false privacy assumptions)

## JSDoc Documentation Standards

### **Required Tags**
- `@param {type} paramName - Description` for all parameters
- `@returns {type} Description` for all return values  
- `@private` for all private/internal members
- `@class` for constructor functions
- `@extends ParentClass` for inheritance

### **Example Pattern**
```javascript
/**
 * Base entity class for all game objects.
 * @class
 * @classdesc Provides common functionality for players, enemies, bullets, etc.
 */
class BaseEntity {
  #internalState = {};  // Truly private
  
  /**
   * Create a new entity.
   * @param {Phaser.Scene} scene - The Phaser scene
   * @param {Object} config - Entity configuration
   * @param {number} config.x - X position
   * @param {number} config.y - Y position
   */
  constructor(scene, config) {
    this.scene = scene;
    this.#internalState = { ...config };
  }
  
  /**
   * Update entity state.
   * @param {number} deltaTime - Time since last update
   * @returns {void}
   */
  update(deltaTime) {
    this.#updateInternals(deltaTime);
  }
  
  /**
   * Internal update logic.
   * @private
   * @param {number} deltaTime - Time since last update
   * @returns {void}
   */
  #updateInternals(deltaTime) {
    // Private implementation
  }
}
```

## Important Notes

- **Auto-initialization**: Logger, ConfigManager, and EventBus initialize automatically
- **Scene Lifecycle**: Proper cleanup in scene shutdown methods is critical  
- **Event Management**: Always remove event listeners to prevent memory leaks
- **Error Handling**: Use try/catch with Logger.error() for proper error reporting
- **Development Mode**: Set `VITE_DEBUG_MODE=true` for detailed logging
- **Scene Flow**: Boot → Preloader → MainMenu → GameScene (with UIScene overlay)

## Current Game Features (Fully Playable)

**Core Gameplay Loop:**
- Player movement with WASD controls
- Weapon firing with Spacebar (3 weapon types: Laser, Plasma, Missile)
- Weapon switching with number keys (1, 2, 3)
- Enemy levels with 3 enemy types and formation flying
- Real-time collision detection and damage system
- Score system with multipliers and level progression
- Lives system with player respawn mechanics
- Achievement system with unlockable rewards
- Persistent high scores and game statistics

**Performance Features:**
- 60+ FPS maintained through object pooling
- Spatial grid collision optimization
- Efficient memory management (<50MB usage)
- Real-time performance monitoring

## Next Development Priorities (Sprint 3+)

1. **Audio Integration**: Add sound effects and background music
2. **Visual Polish**: Replace rectangles with sprite graphics
3. **Power-up System**: Implement collectible power-ups and upgrades
4. **Boss Enemies**: Add larger enemies with complex attack patterns
5. **Particle Effects**: Enhance visual feedback with explosion and trail effects
6. **Menu System**: Implement settings, leaderboards, and game options
7. **Mobile Support**: Add touch controls and responsive design

---

This documentation reflects the current refactored state of the project. The architecture has been simplified from ECS to traditional Phaser patterns for easier development and maintenance.
