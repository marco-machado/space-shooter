# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a space shooter game built with Phaser.js 3.x and Vite build tooling. The game features multiple weapon types, enemy varieties, player progression, and power-up systems using a simple BaseEntity BaseComponent BaseSystem architecture. All game data is persisted using browser localStorage. The development phase uses simple colored rectangles for rapid prototyping before final graphics are implemented.

## Development Commands

### Setup and Installation

```bash
# Initial project setup (use official Phaser Vite template)
npm create vite@latest space-shooter -- --template vanilla
cd space-shooter
npm install phaser

# Install development dependencies (minimal testing setup)
npm install -D eslint prettier vitest jsdom
npm install -D @eslint/js eslint-config-prettier eslint-plugin-prettier

# Development commands
npm run dev                 # Start Vite dev server (localhost:5173)
npm run build              # Build for production
npm run preview            # Preview production build
```

### Safe Development Workflow (PROTECTED)

⚠️ **CRITICAL: Use these safe, selective commands instead of project-wide operations**

#### **Safe Linting Commands (SELECTIVE ONLY)**
```bash
# ✅ SAFE: Lint specific utility files only
eslint src/utils/MathUtils.js
eslint src/utils/ObjectPool.js
eslint src/utils/SaveManager.js

# ✅ SAFE: Lint config files only
eslint src/config/GameConfig.js
eslint src/config/Environment.js

# ❌ FORBIDDEN: Never lint these protected areas
# eslint src/scenes/          # PROTECTED: Game scenes
# eslint src/systems/         # PROTECTED: ECS systems  
# eslint src/entities/        # PROTECTED: Game entities
# eslint src/               # FORBIDDEN: Whole project
# npm run lint              # FORBIDDEN: Uses whole project
```

#### **Safe Testing Commands (UTILITIES ONLY)**
```bash
# ✅ SAFE: Test only utility functions
npm run test               # Only tests utils/ directory
npm run test:watch         # Watch mode for utility tests only
vitest src/utils/MathUtils.test.js    # Single test file

# ❌ FORBIDDEN: Never test these areas
# Testing game scenes, systems, or entities is FORBIDDEN
# Never create tests for Phaser-dependent code
# Never modify GameScene.js for testing purposes
```

#### **Safe Formatting Commands (SELECTIVE)**
```bash
# ✅ SAFE: Format specific files only
prettier --write src/utils/MathUtils.js
prettier --write src/config/GameConfig.js

# ✅ SAFE: Check formatting without changes
npm run format:check       # Read-only formatting check

# ❌ FORBIDDEN: Never auto-format protected files
# prettier --write src/scenes/    # PROTECTED
# prettier --write src/systems/   # PROTECTED
# npm run format                  # May affect protected files
```

#### **Development Server (ALWAYS SAFE)**
```bash
npm run dev                # ✅ SAFE: Start development with HMR
npm run build              # ✅ SAFE: Build for production
npm run preview            # ✅ SAFE: Preview production build
```

#### **Emergency Development Bypass**
```bash
# When automated tools interfere with development:
export SKIP_LINT=true      # Skip linting temporarily
export SKIP_FORMAT=true    # Skip formatting temporarily
npm run dev:unsafe         # Development without quality gates
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
├── tests/                # Basic test files (minimal coverage)
│   ├── __mocks__/        # Simple mock files
│   ├── utils/            # Core utility function tests only
│   └── setup.js          # Basic test setup
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

### Logger BaseSystem

- **Environment-aware**: Only logs in development when `VITE_DEBUG_MODE=true`
- **Multiple levels**: `Logger.debug()`, `Logger.info()`, `Logger.warn()`, `Logger.error()`
- **Formatted output**: Clear prefixes and timestamps for debugging
- **Production-safe**: Automatically disabled in production builds
- **Usage**: `Logger.debug('Player spawned at', x, y)` instead of `console.log()`

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

## Code Quality Standards

### Protective Development Policies

⚠️ **CRITICAL: Automated Tool Safety Guidelines** ⚠️

These policies prevent automated tools from interfering with critical game development work:

#### **Never Lint Whole Project Policy**
- **FORBIDDEN**: `npm run lint` or `eslint src/` (whole project linting)
- **REQUIRED**: Always use selective linting with specific file targets
- **Safe Usage**: `eslint src/utils/MathUtils.js` (single file only)
- **Rationale**: Prevents automated changes to complex game scenes and ECS systems

#### **Game Scene Protection Policy**
- **PROTECTED FILES**: 
  - `src/scenes/GameScene.js` - Critical gameplay scene
  - `src/scenes/*.js` - All scene files protected from automated modification
  - `src/systems/*.js` - ECS systems protected from automated changes
  - `src/entities/*.js` - Game entities protected from automated changes
- **MANUAL ONLY**: These files require manual code review and testing
- **NO AUTO-FIX**: Never use `--fix` flag on protected files

#### **Testing Boundary Policy**
- **NEVER TEST**: Game scenes, ECS systems, or Phaser-dependent code
- **TESTING FORBIDDEN**: Making changes to game files for testing purposes
- **PROTECTED AREAS**: GameScene.js integrity must be maintained
- **MANUAL TESTING**: All gameplay features tested manually, not programmatically

#### **Development Workflow Protection**
- **Selective Operations**: Target specific files/directories only
- **Manual Override**: Developers can skip automated checks when needed
- **Code Quality Gates**: Quality checks must not block critical development
- **Emergency Bypass**: Always provide escape hatches for urgent development

### ESLint Configuration

- **Standard Rules**: Use ESLint recommended rules with Prettier integration
- **No console.log()**: Enforce Logger system usage instead of console methods
- **ES6+ Rules**: Modern JavaScript patterns and best practices
- **Phaser-specific**: Custom rules for Phaser GameObject lifecycle
- **Error Prevention**: Catch common game development mistakes early
- **SELECTIVE USE ONLY**: Never run on whole project - target specific files

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

### ECS Patterns with Phaser (Inline Base Classes)

```javascript
// src/entities/BaseEntity.js - Base entity class
import Logger from '@/utils/Logger.js';

class BaseEntity extends Phaser.GameObjects.Rectangle {
  constructor(scene, x, y, width, height, color) {
    super(scene, x, y, width, height, color);

    this.components = new Map();
    scene.add.existing(this);

    // Add to scene's entity registry (simple array)
    if (!scene.entities) scene.entities = [];
    scene.entities.push(this);
  }

  addComponent(component) {
    this.components.set(component.constructor.name, component);
    Logger.debug(`Added component ${component.constructor.name} to entity`);
    return this;
  }

  getComponent(componentType) {
    return this.components.get(componentType.name);
  }

  hasComponent(componentType) {
    return this.components.has(componentType.name);
  }

  destroy() {
    // Remove from scene's entity registry
    if (this.scene.entities) {
      const index = this.scene.entities.indexOf(this);
      if (index > -1) this.scene.entities.splice(index, 1);
    }
    super.destroy();
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

### Minimal Testing Approach (TDD for Core Utilities Only)

```javascript
// ONLY test core utility functions - keep it simple!
import { describe, it, expect } from 'vitest';
import { MathUtils } from '@/utils/MathUtils.js';

describe('MathUtils', () => {
  it('should calculate distance between two points', () => {
    const distance = MathUtils.distance(0, 0, 3, 4);
    expect(distance).toBe(5);
  });

  it('should clamp values within range', () => {
    expect(MathUtils.clamp(15, 0, 10)).toBe(10);
    expect(MathUtils.clamp(-5, 0, 10)).toBe(0);
    expect(MathUtils.clamp(5, 0, 10)).toBe(5);
  });
});

// Simple SaveManager test - core functionality only
import { SaveManager } from '@/utils/SaveManager.js';

describe('SaveManager', () => {
  it('should save and load data', () => {
    const testData = { score: 100, level: 5 };
    SaveManager.save('test', testData);
    const loaded = SaveManager.load('test');
    expect(loaded).toEqual(testData);
  });
});

// DON'T TEST:
// - Phaser GameObjects (too complex to mock)
// - ECS Components (simple data containers)
// - Systems (rely on Phaser, test via gameplay)
// - UI/Graphics (visual elements)
// - Audio (browser-dependent)
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

// Logger system pattern
class Logger {
  static init() {
    this.debugMode = import.meta.env.VITE_DEBUG_MODE === 'true';
    this.logLevel = import.meta.env.VITE_LOG_LEVEL || 'info';
    this.levels = { debug: 0, info: 1, warn: 2, error: 3 };
  }

  static debug(message, ...args) {
    if (this.debugMode && this.shouldLog('debug')) {
      console.log(`🔍 [DEBUG] ${message}`, ...args);
    }
  }

  static info(message, ...args) {
    if (this.shouldLog('info')) {
      console.info(`ℹ️ [INFO] ${message}`, ...args);
    }
  }

  static warn(message, ...args) {
    if (this.shouldLog('warn')) {
      console.warn(`⚠️ [WARN] ${message}`, ...args);
    }
  }

  static error(message, ...args) {
    if (this.shouldLog('error')) {
      console.error(`❌ [ERROR] ${message}`, ...args);
    }
  }

  static shouldLog(level) {
    return this.levels[level] >= this.levels[this.logLevel];
  }
}
```

## Testing Guidelines (PROTECTIVE BOUNDARIES)

### Minimal Testing Philosophy (SAFETY FIRST)

- **Focus**: Test ONLY core utility functions (math, save/load, object pooling)
- **NEVER MODIFY GAME FILES**: Testing must never require changes to game scenes or systems
- **GameScene Protection**: GameScene.js integrity is PARAMOUNT - no testing modifications allowed
- **No Elaborate Suites**: Keep test files small and focused
- **No E2E Tests**: Manual testing for gameplay and UI interactions
- **Time Limit**: Don't spend hours writing/fixing tests - keep it basic

### What TO Test (SAFE ZONE ONLY)

#### ✅ SAFE TO TEST (utils/ directory only)
- **Utility Functions**: Math calculations, data transformations
- **Save/Load Logic**: localStorage operations (mocked)
- **Object Pooling**: Basic get/release functionality
- **Pure Functions**: Functions with clear inputs/outputs
- **Configuration**: Environment and config utilities

#### 🟨 SAFE LOCATION
```bash
tests/utils/                # ONLY safe testing location
├── MathUtils.test.js       # ✅ Math operations testing
├── SaveManager.test.js     # ✅ localStorage testing (mocked)
├── ObjectPool.test.js      # ✅ Pool management testing
└── GameConfig.test.js      # ✅ Configuration testing
```

### What NOT to Test (FORBIDDEN ZONES)

#### ❌ ABSOLUTELY FORBIDDEN
- **GameScene.js**: NEVER create tests that require modifying this file
- **All Scenes**: src/scenes/* - Manual testing only
- **ECS Systems**: src/systems/* - Too complex, Phaser-dependent
- **Game Entities**: src/entities/* - Phaser GameObjects, manual testing only
- **Components**: Simple data containers, testing adds no value
- **Phaser Integration**: Any code that requires Phaser context

#### 🚫 FORBIDDEN TESTING ACTIVITIES
- **Never modify GameScene.js** for testing purposes
- **Never mock Phaser objects** - too complex and fragile
- **Never create test scenes** - disrupts game architecture
- **Never test ECS interactions** - use manual gameplay testing
- **Never test UI/Graphics** - visual verification only
- **Never test audio systems** - browser-dependent functionality

### Protected Testing Principles

#### **GameScene Integrity Protection**
- GameScene.js is the **heart of the game** - modifications forbidden
- Any testing that requires GameScene changes is **REJECTED**
- Complex game logic tested through **manual gameplay**
- Performance testing done via **runtime monitoring**

#### **Manual Testing Priority**
- **Primary Method**: Manual gameplay testing
- **User Experience**: Play-testing for game balance and fun
- **Integration Testing**: Scene transitions and system interactions
- **Performance Validation**: Real gameplay performance monitoring

### Basic Test Organization

```bash
tests/
├── utils/                # ONLY utility function tests
│   ├── MathUtils.test.js      # Basic math operations
│   ├── SaveManager.test.js    # localStorage operations
│   └── ObjectPool.test.js     # Object pooling basics
├── __mocks__/            # Simple mocks only
│   └── localStorage.js   # Mock localStorage for tests
└── setup.js              # Minimal test setup
```

### Manual Testing Checklist (Primary Testing Method)

- [ ] Game loads without errors in target browsers
- [ ] Player movement feels responsive
- [ ] Weapons fire and hit targets
- [ ] Enemies spawn and move correctly
- [ ] Power-ups can be collected
- [ ] Game saves progress correctly
- [ ] ESLint passes with no errors
- [ ] Prettier formatting is consistent
- [ ] Basic unit tests pass (should be quick)

### TDD Workflow (Utilities Only)

1. **Write failing test** for utility function (2-3 minutes max)
2. **Implement minimal code** to make test pass
3. **Refactor if needed** (keep it simple)
4. **Move on** - don't over-engineer

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
