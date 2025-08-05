# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a space shooter game built with Phaser.js 3.x and Vite build tooling. The game features multiple weapon types, enemy varieties, player progression, and power-up systems using an enhanced BaseEntity BaseComponent BaseSystem architecture with flexible GameObject support, unified ConfigManager system, auto-initializing Logger system, and event-driven input management. All game data is persisted using browser localStorage. The development phase uses simple colored rectangles for rapid prototyping before final graphics are implemented.

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

## Detailed Documentation

For comprehensive information, see the structured documentation:

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - ECS patterns, ConfigManager, Logger system, input management
- **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Commands, workflow, testing strategies, code quality
- **[docs/EXAMPLES.md](docs/EXAMPLES.md)** - Complete code examples and implementation patterns
- **[docs/REFERENCE.md](docs/REFERENCE.md)** - Project structure, assets, performance, deployment

## Project Structure (Overview)

```
space-shooter/
├── docs/                 # Structured documentation
├── src/
│   ├── main.js           # Game initialization
│   ├── config/           # ConfigManager + Constants
│   ├── core/             # SpaceShooterGame
│   ├── scenes/           # Phaser scenes (Boot, Game, Menu, etc.)
│   ├── entities/         # BaseEntity + game entities
│   ├── components/       # ECS components (data)
│   ├── systems/          # ECS systems (logic)
│   ├── graphics/         # DevShapes for development
│   └── utils/            # Logger, SaveManager, ObjectPool
├── tests/                # Comprehensive unit test coverage
│   ├── components/       # Component unit tests
│   ├── utils/            # Utility unit tests
│   └── __mocks__/        # Mock implementations
└── public/assets/        # Static assets
```

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

// Auto-initializes on first call
Logger.debug('Player spawned at', x, y);
Logger.info('Level completed');
Logger.warn('Low health warning');
Logger.error('Critical error');
```

### Entity Creation

```javascript
import BaseEntity from '@/entities/BaseEntity.js';

// Flexible configuration approach
const player = new BaseEntity(scene, {
  type: 'rectangle',
  x: 400, y: 300,
  width: 64, height: 64,
  color: 0x0099ff,
  name: 'player'
});

// Runtime type switching
player.changeGameObjectType('sprite', { texture: 'player-ship' });
```

## Code Quality Standards

- **ESLint**: Lint only session-modified files for focused quality checks
- **No console.log()**: Always use Logger system instead
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

## Important Notes

- All systems **auto-initialize** - no manual setup required
- Use **Logger** instead of console.log (production-safe)
- **ConfigManager** validates all environment variables
- Development uses **colored shapes** for rapid prototyping
- Easy transition to production graphics via sprite replacement

---

This documentation is updated as the project evolves. For detailed implementation guides, architectural patterns, and comprehensive examples, refer to the files in the `docs/` directory.
