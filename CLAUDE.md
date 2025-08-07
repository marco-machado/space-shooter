# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a space shooter game built with Phaser.js 3.x and Vite build tooling. The game features multiple weapon types, enemy varieties, player progression, and power-up systems using an enhanced BaseEntity BaseComponent BaseSystem architecture with flexible GameObject support, unified ConfigManager scopeName, auto-initializing Logger scopeName, and event-driven input management. All game data is persisted using browser localStorage. The development phase uses simple colored rectangles for rapid prototyping before final graphics are implemented.

## Quick Start Commands

### Essential Development Commands

```bash
# Start development server
npm run dev                 # localhost:5173

# Code quality and testing
npm run lint <files>         # Lint specific files only
npm run lint:fix           # Auto-fix linting issues
npm run test               # Run all tests
npm run test:watch         # Continuous testing

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
- **BaseEntity**: Flexible GameObject types with runtime switching

### Development Graphics Strategy

- **Player**: Blue 64x64px rectangle (`0x0099ff`)
- **Enemies**: Red rectangles of varying sizes (`0xff0000`)
- **Projectiles**: Yellow/orange small shapes (`0xffff00`, `0xff8800`)
- **Power-ups**: Green/purple polygons (`0x00ff00`, `0x8800ff`)
- **Easy transition**: Replace shapes with sprites when ready

### Core Patterns

- **ECS Architecture**: BaseEntity + Components (data) + Systems (logic)
- **Event-Driven Input**: Normalized movement, structured events
- **Unified Configuration**: Single source for all settings and constants
- **Comprehensive Testing**: Unit tests with proper mocking and comprehensive coverage

## Usage Examples

### Configuration Access

```javascript
import ConfigManager from '@/config/ConfigManager.js';

const config = ConfigManager.getConfig();
const constants = ConfigManager.getConstants();

// Use configuration
if (config.debugMode) { /* debug setup */ }
const playerColor = constants.COLORS.PLAYER; // 0x0099ff
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

## Code Quality Standards

- **ESLint**: Lint only session-modified files for focused quality checks
- **No console.log()**: Always use Logger system instead
- **Logger Pattern**: Use `Logger.scope('ModuleName')` for all debugging output
- **Comprehensive Testing**: Comprehensive unit tests encouraged
- **Modern JavaScript**: ES6+ patterns, async/await preferred

## Testing Philosophy

- **Isolated Unit Testing**: Test components, systems, entities, utilities in isolation
- **Comprehensive Coverage**: Mock external dependencies for focused testing
- **TDD Encouraged**: Write tests first for new features with isolated test cases
- **Coverage Goals**: 90%+ for business logic with comprehensive unit test coverage

## Performance Targets

- **60 FPS** on target hardware
- **<100MB** total memory usage
- **<3 seconds** initial load time
- **Object pooling** for bullets, enemies, effects

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

- All systems **auto-initialize** - no manual setup required
- Use **Logger.scope('ModuleName')** instead of console.log (production-safe)
- **ConfigManager** validates all environment variables
- Development uses **colored shapes** for rapid prototyping
- Easy transition to production graphics via sprite replacement

---

This documentation is updated as the project evolves. For detailed implementation guides, architectural patterns, and comprehensive examples, refer to the files in the `docs/` directory.
