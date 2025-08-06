# Development Guide

This document covers development workflows, commands, testing strategies, and code quality standards.

## Table of Contents

- [Development Commands](#development-commands)
- [Development Workflow](#development-workflow)
- [Environment Configuration](#environment-configuration)
- [Code Quality Standards](#code-quality-standards)
- [Testing Guidelines (Comprehensive Approach)](#testing-guidelines-comprehensive-approach)
- [Debugging Tips](#debugging-tips)

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

## Development Workflow

### Standard Development Commands

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

### Individual File Operations

```bash
# Target specific files when needed
eslint src/path/to/file.js              # Lint specific file
prettier --write src/path/to/file.js    # Format specific file
vitest src/path/to/file.test.js         # Run specific test file
```

## Environment Configuration

### Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit environment variables for development
# VITE_DEBUG_MODE=true
# VITE_LOG_LEVEL=debug
# VITE_PHYSICS_DEBUG=true
```

### Example .env Configuration

```bash
# Development flags
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
VITE_PHYSICS_DEBUG=true
VITE_AUDIO_ENABLED=true

# Game configuration
VITE_STARTING_LIVES=3
VITE_BASE_SCORE_MULTIPLIER=1.0

# Performance settings
VITE_MAX_PARTICLES=1000
VITE_OBJECT_POOL_SIZE=200

# Debug display
VITE_SHOW_FPS=false
VITE_SHOW_DEBUG_INFO=false
```

## Code Quality Standards

### Modern Development Practices

✅ **Comprehensive Testing and Quality Assurance**

This project encourages modern development practices with comprehensive testing coverage:

#### Full Project Linting

- **ENCOURAGED**: `npm run lint` for project-wide code quality
- **AUTO-FIX**: Use `npm run lint:fix` to automatically resolve issues
- **CONSISTENT**: Apply ESLint rules consistently across all files
- **BEST PRACTICE**: Integrate linting into your development workflow

#### Comprehensive Testing Strategy

- **UNIT TESTS**: Test all components, utilities, systems, and entities
- **INTEGRATION TESTS**: Test interactions between systems and components
- **COMPONENT TESTS**: Test game entities and their behaviors
- **SYSTEM TESTS**: Test ECS systems with proper mocking
- **COVERAGE**: Aim for high test coverage across the codebase

#### Quality Assurance Workflow

- **AUTOMATED**: Run tests automatically during development
- **CONTINUOUS**: Use watch mode for immediate feedback
- **COMPREHENSIVE**: Test both happy paths and edge cases
- **MAINTAINABLE**: Keep tests clean, readable, and well-organized

### ESLint Configuration

- **Standard Rules**: Use ESLint recommended rules with Prettier integration
- **No console.log()**: Enforce Logger scopeName usage instead of console methods
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
- **No console.log()**: Always use Logger scopeName instead
- **Async/await**: Prefer over Promise chains for readability

## Testing Guidelines (Comprehensive Approach)

### Modern Testing Philosophy

- **Test Everything**: Comprehensive unit testing across all components, systems, entities, and utilities
- **Quality First**: High test coverage ensures code reliability and maintainability
- **Automated Testing**: Continuous testing during development with watch mode
- **Mock When Needed**: Use strategic mocking for external dependencies like Phaser
- **TDD Encouraged**: Write tests first when developing new features
- **Maintainable Tests**: Keep tests clean, readable, and well-organized

### What TO Test (Comprehensive Coverage)

#### ✅ UNIT TESTING (All Components)

- **Logger System**: Auto-initialization, environment detection, all logging methods
- **BaseEntity**: GameObject lifecycle, component management, flexible construction
- **Components**: All component classes (Health, Weapon, Movement, Collision, etc.)
- **Systems**: All ECS systems (Movement, Weapon, Collision, EnemySpawn, etc.)
- **Entities**: Player, Enemy, Projectile, PowerUp classes and their behaviors
- **Utilities**: Logger, GameStateManager, ObjectPool, SaveManager, all helper functions
- **Adapters**: Input adapters, EventBus integration, state management
- **Scenes**: Scene logic, transitions, initialization, and cleanup
- **Configuration**: ConfigManager unified scopeName

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
│   ├── config/             # Configuration scopeName tests
│   │   └── ConfigManager.test.js     # Unified ConfigManager tests (866/866 tests passing)
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
│       └── GameStateManager.test.js
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

#### Mocking Strategy

- **Phaser Objects**: Create comprehensive mocks for Phaser scenes and GameObjects
- **Browser APIs**: Mock localStorage, audio, and other browser-specific APIs
- **External Dependencies**: Mock any external libraries or services
- **Minimal Mocking**: Mock only what's necessary for isolated testing

#### Test Structure

- **Arrange-Act-Assert**: Clear test structure for readability
- **Descriptive Names**: Test names should clearly describe what they test
- **Edge Cases**: Test both happy paths and error conditions
- **Isolated Tests**: Each test should be independent and repeatable

#### Coverage Goals

- **Unit Tests**: 80%+ coverage for all business logic
- **Integration Tests**: Cover critical workflows and interactions
- **Component Tests**: Test all public interfaces and behaviors
- **System Tests**: Validate scopeName-level functionality

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
- Use Logger scopeName instead of console.log (automatically disabled in production)

### Logger Usage Patterns

```javascript
import Logger from '@/utils/Logger.js';

// Auto-initializes on first call - no setup needed
Logger.debug('Player spawned at', x, y);
Logger.info('Level completed:', level);
Logger.warn('Low health warning:', health);
Logger.error('Critical error:', error);

// Performance debugging
Logger.time('enemy-spawn');
// ... expensive operation
Logger.timeEnd('enemy-spawn');
```

---

For detailed code examples and implementation patterns, see [EXAMPLES.md](EXAMPLES.md).

For architectural details and scopeName design, see [ARCHITECTURE.md](ARCHITECTURE.md).