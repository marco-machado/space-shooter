# Architecture Decision Records (ADRs)

This document records the key architectural decisions made during the development of the Space Shooter game, including the context, decision rationale, and consequences of each choice.

## Table of Contents

- [ADR-001: BaseEntity BaseComponent BaseSystem Architecture](#adr-001-entity-component-system-architecture)
- [ADR-002: Development Graphics Strategy](#adr-002-development-graphics-strategy)
- [ADR-003: Environment-Aware Logger BaseSystem](#adr-003-environment-aware-logger-system)
- [ADR-004: Scene Management Architecture](#adr-004-scene-management-architecture)
- [ADR-005: BaseComponent as Data Containers](#adr-005-component-as-data-containers)
- [ADR-006: Minimal Testing Strategy](#adr-006-minimal-testing-strategy)
- [ADR-007: Direct Main Branch Development](#adr-007-direct-main-branch-development)
- [ADR-008: Auto-Initializing Logger Architecture](#adr-008-auto-initializing-logger-architecture)
- [ADR-009: Flexible BaseEntity GameObject Support](#adr-009-flexible-baseentity-gameobject-support)
- [ADR-010: KeyboardInputAdapter Event-Driven Input](#adr-010-keyboardinputadapter-event-driven-input)
- [ADR-011: Comprehensive Unit Testing with Phaser Mocking](#adr-011-comprehensive-unit-testing-with-phaser-mocking)

---

## ADR-001: BaseEntity BaseComponent BaseSystem Architecture

**Status**: Accepted ✅  
**Date**: Sprint 1  
**Deciders**: Development Team

### Context

The game requires a flexible architecture that can handle multiple entity types (Player, Enemy, Projectile, PowerUp) with varying behaviors and properties. Traditional inheritance hierarchies become complex and rigid as features are added.

### Decision

Implement an BaseEntity BaseComponent BaseSystem (ECS) architecture built on top of Phaser.js GameObjects:

- **Entities**: Extend `Phaser.GameObjects.Rectangle` for development phase
- **Components**: Pure data containers inheriting from base `BaseComponent` class
- **Systems**: Logic processors that operate on entities with specific components

### Rationale

**Benefits:**

- **Composition over Inheritance**: Flexible entity creation through component mixing
- **Separation of Concerns**: Data (Components) separated from Logic (Systems)
- **Phaser Integration**: Leverages existing Phaser features (physics, rendering, input)
- **Testability**: Components and Systems can be tested independently
- **Scalability**: Easy to add new behaviors without modifying existing code

**Alternatives Considered:**

- **Pure Phaser Approach**: Too rigid for complex entity behaviors
- **Full ECS Library**: Overhead not justified for game scopeName
- **Traditional Inheritance**: Becomes unwieldy with multiple entity types

### Implementation

```javascript
// BaseEntity - Game object with component management
class BaseEntity extends Phaser.GameObjects.Rectangle {
  addComponent(component) {
    /* ... */
  }

  getComponent(componentType) {
    /* ... */
  }

  hasComponent(componentType) {
    /* ... */
  }
}

// BaseComponent - Pure data container
class HealthComponent extends BaseComponent {
  constructor(maxHealth) {
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
  }
}

// BaseSystem - Logic processor
class MovementSystem extends BaseSystem {
  update(entities, delta) {
    // Process all entities with MovementComponent
  }
}
```

### Consequences

**Positive:**

- ✅ Flexible entity composition
- ✅ Clean separation of data and logic
- ✅ Easy to extend with new components/systems
- ✅ Good performance characteristics
- ✅ Integrates well with Phaser

**Negative:**

- ❌ More complex than simple inheritance for basic cases
- ❌ Requires discipline to maintain data/logic separation
- ❌ BaseComponent lookup has small performance overhead

**Mitigation:**

- Clear documentation and examples for team
- Base classes provide common patterns
- Performance monitoring to catch any issues

---

## ADR-002: Development Graphics Strategy

**Status**: Accepted ✅  
**Date**: Sprint 1  
**Deciders**: Development Team

### Context

The game needs visual representation during development to test gameplay mechanics. Waiting for final art assets would delay development and make testing difficult.

### Decision

Use simple colored geometric shapes for all game entities during development phase:

- **Player**: Blue 64x64px rectangle (`0x0099ff`)
- **Enemies**: Red rectangles of varying sizes (`0xff0000`)
- **Projectiles**: Yellow/orange small shapes (`0xffff00`, `0xff8800`)
- **Power-ups**: Green/purple distinctive shapes (`0x00ff00`, `0x8800ff`)

### Rationale

**Benefits:**

- **Rapid Development**: No waiting for art assets
- **Clear Identification**: Different colors instantly identify entity types
- **Performance Testing**: Test game logic without asset loading overhead
- **Easy Transition**: Simple to replace shape creation with sprite loading later
- **Consistent Visuals**: Standardized appearance across development team

**Alternatives Considered:**

- **Placeholder Images**: Require asset management and loading
- **ASCII Art**: Not visually clear in fast-paced gameplay
- **Simple Sprites**: Still require asset creation and management

### Implementation

```javascript
// DevShapes utility class
class DevShapes {
  static createPlayer(scene, x, y) {
    return scene.add.rectangle(x, y, 64, 64, 0x0099ff);
  }

  static createEnemy(scene, x, y, size = 32) {
    return scene.add.rectangle(x, y, size, size, 0xff0000);
  }

  static createProjectile(scene, x, y, size = 8) {
    return scene.add.rectangle(x, y, size, size, 0xffff00);
  }
}

// Easy transition to sprites later:
// const player = scene.add.sprite(x, y, 'playerTexture');
```

### Consequences

**Positive:**

- ✅ Extremely fast development iteration
- ✅ No asset pipeline complexity during development
- ✅ Clear visual debugging (colors indicate types)
- ✅ Consistent across team members
- ✅ No memory overhead from textures

**Negative:**

- ❌ Not representative of final visual quality
- ❌ Limited visual feedback for game feel
- ❌ May delay art pipeline decisions

**Mitigation:**

- Clear transition plan to sprites documented
- Regular review of visual requirements
- Art pipeline planning in parallel with development

---

## ADR-003: Environment-Aware Logger BaseSystem

**Status**: Accepted ✅  
**Date**: Sprint 1  
**Deciders**: Development Team

### Context

Console logging is essential for development debugging but should be completely disabled in production builds. Standard `console.log` statements either clutter production code or require manual removal.

### Decision

Implement a centralized Logger scopeName that respects environment configuration:

- **Environment-Aware**: Automatically disabled in production builds
- **Log Levels**: Debug, Info, Warn, Error with filtering capability
- **Formatted Output**: Timestamps, emoji indicators, structured formatting
- **Zero Production Impact**: No overhead when disabled

### Rationale

**Benefits:**

- **Production Safety**: No accidental console output in production
- **Development Efficiency**: Rich debugging information during development
- **Configurable**: Different log levels for different situations
- **Consistent Format**: Standardized logging across entire codebase
- **Performance**: Zero overhead when disabled

**Alternatives Considered:**

- **Console.log with manual removal**: Error-prone and labor-intensive
- **Build-time log removal**: Complex build configuration
- **Third-party logging library**: Overkill for project scopeName

### Implementation

```javascript
class Logger {
  static init() {
    this.debugMode = Environment.DEBUG_MODE;
    this.logLevel = Environment.LOG_LEVEL;
  }

  static debug(message, ...args) {
    if (this.debugMode && this.shouldLog('debug')) {
      console.log('🔍', this.formatMessage('debug', message), ...args);
    }
  }

  static info(message, ...args) {
    if (this.shouldLog('info')) {
      console.info('ℹ️', this.formatMessage('info', message), ...args);
    }
  }
}

// Usage throughout codebase:
Logger.debug('Player spawned at', x, y); // Instead of console.log
Logger.info('Game started');
Logger.error('Failed to load asset', error);
```

### Consequences

**Positive:**

- ✅ Clean production builds with zero logging overhead
- ✅ Rich development debugging experience
- ✅ Consistent logging format across codebase
- ✅ Configurable logging levels
- ✅ Team discipline around proper logging

**Negative:**

- ❌ Additional abstraction layer to learn
- ❌ Requires initialization before use
- ❌ May be forgotten in favor of console.log

**Mitigation:**

- ESLint rule prevents console.log usage
- Clear documentation and examples
- Logger auto-initializes on first use

---

## ADR-004: Scene Management Architecture

**Status**: Accepted ✅  
**Date**: Sprint 1  
**Deciders**: Development Team

### Context

The game requires multiple distinct states (loading, menu, gameplay, game over) with different UI, input handling, and game logic requirements. Transitions between states must be smooth and manageable.

### Decision

Implement a structured scene flow using Phaser's scene management scopeName:

```
BootScene → PreloaderScene → MainMenuScene → GameScene
```

Each scene has a specific responsibility:

- **BootScene**: Environment setup and validation
- **PreloaderScene**: Asset loading and preparation
- **MainMenuScene**: Menu interface and navigation
- **GameScene**: Core gameplay logic and systems

### Rationale

**Benefits:**

- **Clear Separation**: Each scene has a single responsibility
- **Phaser Native**: Uses Phaser's built-in scene management
- **Predictable Flow**: Easy to understand progression
- **Resource Management**: Proper cleanup between scenes
- **Error Isolation**: Problems in one scene don't affect others

**Alternatives Considered:**

- **Single Scene**: Would become complex with multiple states
- **Custom State Manager**: Reinventing Phaser functionality
- **More Complex Flow**: Additional scenes add unnecessary complexity

### Implementation

```javascript
// BootScene - Environment and Logger setup
class BootScene extends Phaser.Scene {
  create() {
    Environment.init();

    this.scene.start('PreloaderScene');
  }
}

// PreloaderScene - Asset loading
class PreloaderScene extends Phaser.Scene {
  create() {
    // Load assets (or setup dev graphics)
    this.scene.start('MainMenuScene');
  }
}

// GameScene - Primary gameplay
class GameScene extends Phaser.Scene {
  create() {
    this.createPlayer();
    this.setupInput();
    this.createUI();
  }
}
```

### Consequences

**Positive:**

- ✅ Clear mental model of game flow
- ✅ Proper resource lifecycle management
- ✅ Easy to add new scenes (GameOver, Settings, etc.)
- ✅ Built-in transition support
- ✅ Scene-specific error handling

**Negative:**

- ❌ Some overhead for scene transitions
- ❌ Data passing between scenes requires planning
- ❌ More files to manage

**Mitigation:**

- Document scene responsibilities clearly
- Use scene data parameters for communication
- Minimize scene transition frequency

---

## ADR-005: BaseComponent as Data Containers

**Status**: Accepted ✅  
**Date**: Sprint 1  
**Deciders**: Development Team

### Context

In ECS architecture, there are different approaches to component design. Components can be pure data containers, or they can include methods and logic. The choice affects maintainability, testing, and scopeName design.

### Decision

Implement components as primarily data containers with minimal methods:

- **Data-Focused**: Components store state and properties
- **Minimal Logic**: Only data validation and simple getters/setters
- **BaseSystem Processing**: Business logic handled by Systems
- **Update Methods**: Components can have update() but no complex logic

### Rationale

**Benefits:**

- **Clear Separation**: Data clearly separated from business logic
- **Testable Systems**: Logic centralized in Systems, easier to test
- **Serializable**: Pure data components easy to save/load
- **Reusable**: Components can be used across different entity types
- **Understandable**: Simple data structures easy to reason about

**Alternatives Considered:**

- **Logic-Heavy Components**: Would blur ECS boundaries
- **Passive Data Only**: Too restrictive for game development needs
- **Mixed Approach**: Inconsistent and confusing

### Implementation

```javascript
// BaseComponent - Primarily data with minimal methods
class HealthComponent extends BaseComponent {
  constructor(maxHealth) {
    super();
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
    this.invulnerable = false;
    this.invulnerableTime = 0;
  }

  // Simple data methods only
  takeDamage(amount) {
    if (!this.invulnerable) {
      this.currentHealth = Math.max(0, this.currentHealth - amount);
    }
  }

  // Getters for derived state
  isAlive() {
    return this.currentHealth > 0;
  }

  getHealthPercentage() {
    return this.currentHealth / this.maxHealth;
  }
}

// BaseSystem handles complex logic
class CombatSystem extends BaseSystem {
  update(entities, delta) {
    entities.forEach(entity => {
      const health = entity.getComponent(HealthComponent);
      if (health) {
        this.updateInvulnerability(health, delta);
        this.checkDeath(entity, health);
      }
    });
  }
}
```

### Consequences

**Positive:**

- ✅ Clean separation of concerns
- ✅ Components easy to understand and modify
- ✅ Systems contain all business logic
- ✅ Easy to serialize/deserialize for save games
- ✅ Components reusable across entity types

**Negative:**

- ❌ Some operations require component + scopeName coordination
- ❌ May feel verbose for simple operations
- ❌ Requires discipline to maintain separation

**Mitigation:**

- Clear guidelines on what belongs in components vs systems
- Examples and patterns documented
- Code review to maintain standards

---

## ADR-006: Minimal Testing Strategy

**Status**: Accepted ✅  
**Date**: Sprint 1  
**Deciders**: Development Team

### Context

Testing is important for code quality, but game development has unique challenges. Phaser GameObjects are complex to mock, visual elements require manual testing, and comprehensive test suites can be time-consuming to maintain.

### Decision

Implement a minimal, focused testing strategy:

**Test Coverage:**

- ✅ **Utility Functions**: Math, data transformation, pure functions
- ✅ **Core Logic**: Save/load, object pooling, algorithms
- ❌ **Phaser GameObjects**: Too complex to mock reliably
- ❌ **ECS Components**: Simple data containers, minimal logic
- ❌ **Systems**: Integration-heavy, better tested manually
- ❌ **UI/Graphics**: Visual elements require manual testing

**Primary Testing Method**: Manual testing with comprehensive checklists

### Rationale

**Benefits:**

- **Time Efficient**: Focus testing effort where it provides most value
- **Pragmatic**: Acknowledges game development testing challenges
- **Quality Focus**: Tests cover critical utility functions thoroughly
- **Maintainable**: Small test suite is easy to maintain and run quickly
- **Realistic**: Accounts for visual/interactive nature of game development

**Alternatives Considered:**

- **Comprehensive Testing**: Too time-consuming for game development
- **No Testing**: Would miss critical utility function bugs
- **E2E Testing**: Complex setup, fragile in game development

### Implementation

```javascript
// Example of what we DO test
describe('MathUtils', () => {
  it('should calculate distance between two points', () => {
    const distance = MathUtils.distance(0, 0, 3, 4);
    expect(distance).toBe(5);
  });

  it('should clamp values within range', () => {
    expect(MathUtils.clamp(15, 0, 10)).toBe(10);
  });
});

// Manual testing checklist for what we DON'T unit test
const manualTestingChecklist = [
  'Player moves smoothly with WASD/Arrow keys',
  'Health bar updates when taking damage',
  'Game maintains 60+ FPS during gameplay',
  'Pause/resume works correctly',
  // ... comprehensive manual testing
];
```

### Consequences

**Positive:**

- ✅ Efficient use of testing time
- ✅ Critical utility functions have good coverage
- ✅ Fast test execution (< 30 seconds)
- ✅ Easy to maintain and extend
- ✅ Realistic for game development constraints

**Negative:**

- ❌ Limited automated coverage
- ❌ Relies on manual testing discipline
- ❌ May miss integration issues

**Mitigation:**

- Comprehensive manual testing checklist
- Regular manual testing schedule
- Performance monitoring to catch issues
- Code review for quality assurance

---

## ADR-007: Direct Main Branch Development

**Status**: Accepted ✅  
**Date**: Sprint 1  
**Deciders**: Development Team

### Context

Git workflow strategies range from complex branching models (GitFlow) to simple approaches (trunk-based development). For a single-developer project with short sprints, the overhead of branch management may outweigh benefits.

### Decision

Use direct development on the main branch with quality gates:

- **Single Branch**: All development happens on `main`
- **Quality Gates**: Code must pass all checks before commit
- **Small Commits**: Frequent, functional commits
- **Always Deployable**: Main branch always in working state

### Rationale

**Benefits:**

- **Simplicity**: No branch management overhead
- **Fast Iteration**: Immediate integration of changes
- **Always Current**: No merge conflicts or stale branches
- **Quality Focus**: Quality gates ensure main stays stable
- **Single Developer**: No concurrent development conflicts

**Alternatives Considered:**

- **Feature Branches**: Overhead not justified for single developer
- **GitFlow**: Too complex for project scopeName
- **Release Branches**: Not needed for continuous development

### Implementation

```bash
# Development workflow
git add .
npm run validate  # Quality gate - must pass
git commit -m "implement: feature description"

# Quality gates enforced:
# - ESLint passes with 0 errors
# - Prettier formatting applied
# - Basic tests pass
# - No console.log statements
```

### Consequences

**Positive:**

- ✅ Simple, fast workflow
- ✅ No branch management complexity
- ✅ Always integrated code
- ✅ Quality enforced at commit time
- ✅ Clear project history

**Negative:**

- ❌ Less safety net for experimental features
- ❌ Harder to isolate incomplete work
- ❌ Requires discipline for quality

**Mitigation:**

- Strict quality gates before commits
- Small, incremental changes
- Regular commits to avoid large changes
- Easy rollback for issues

---

## ADR-008: Auto-Initializing Logger Architecture

**Status**: Accepted ✅  
**Date**: Sprint 3  
**Deciders**: Development Team

### Context

The original Logger system required explicit initialization before use, creating dependency ordering requirements and potential runtime errors if initialization was forgotten. This pattern was error-prone and created friction in development workflow.

### Decision

Implement auto-initializing Logger architecture with lazy loading:

- **Automatic Initialization**: Logger initializes on first method call
- **Backward Compatibility**: Explicit `init()` still supported but optional
- **Environment Handling**: Graceful fallbacks for both Vite and Node.js environments
- **Error Recovery**: Safe defaults if environment variable access fails

### Rationale

**Benefits:**

- **Developer Experience**: No manual initialization required - Logger.debug() works immediately
- **Error Prevention**: Eliminates runtime errors from forgotten initialization
- **Backward Compatibility**: Existing code continues working without changes
- **Robust Environment Handling**: Works reliably across different runtime environments
- **Performance**: Lazy initialization only occurs once, on first use

**Alternatives Considered:**

- **Static Initialization**: Would execute at module load, potentially before environment ready
- **Required Manual Init**: Current approach, error-prone and developer-unfriendly
- **Dependency Injection**: Too complex for logging utility

### Implementation

```javascript
class Logger {
  static _ensureInitialized() {
    if (!this.isInitialized) {
      // Auto-initialize with environment detection
      this.debugMode = this._getEnvVariable('VITE_DEBUG_MODE') === 'true';
      this.logLevel = this._getEnvVariable('VITE_LOG_LEVEL') || 'info';
      this.levels = { debug: 0, info: 1, warn: 2, error: 3 };
      this.isInitialized = true;
    }
  }

  static debug(message, ...args) {
    this._ensureInitialized(); // Auto-initialize
    if (this.debugMode && this.shouldLog('debug')) {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`🔍 ${timestamp} [DEBUG] ${message}`, ...args);
    }
  }

  static _getEnvVariable(name) {
    // Dual environment support with fallbacks
    try {
      return import.meta?.env?.[name] || process?.env?.[name] || undefined;
    } catch {
      return undefined;
    }
  }
}
```

### Consequences

**Positive:**

- ✅ Zero setup required - Logger works immediately
- ✅ Eliminates entire class of initialization errors
- ✅ Maintains all existing functionality
- ✅ Robust environment handling
- ✅ Comprehensive test coverage (32 test cases)

**Negative:**

- ❌ Slight performance overhead on first call (negligible)
- ❌ Less explicit about initialization timing
- ❌ Environment detection logic more complex

**Mitigation:**

- Performance impact minimal and one-time only
- Clear documentation about auto-initialization behavior
- Comprehensive error handling for environment detection failures

---

## ADR-009: Flexible BaseEntity GameObject Support

**Status**: Accepted ✅  
**Date**: Sprint 3  
**Deciders**: Development Team

### Context

The original BaseEntity class was rigid, only supporting Phaser Rectangle GameObjects. As development progressed, different entity types needed different visual representations (sprites, circles, text) or no visual representation at all (logical entities). The single GameObject type limited flexibility and forced workarounds.

### Decision

Implement flexible BaseEntity architecture supporting multiple GameObject types:

- **Multiple GameObject Types**: Rectangle, Sprite, Image, Circle, Polygon, Text, or null
- **Backward Compatibility**: Existing constructor signature continues working
- **Configuration Object**: New flexible constructor supporting type-specific parameters
- **Runtime Type Changes**: Ability to change GameObject type dynamically
- **Null-Safe Operations**: Full functionality even without visual representation

### Rationale

**Benefits:**

- **Maximum Flexibility**: Supports any Phaser GameObject type or pure logical entities
- **Future-Proof**: Easy transition from dev graphics to final sprites
- **Backward Compatible**: All existing code continues working unchanged
- **Performance**: Object pooling works with any GameObject type
- **Clean Separation**: Visual representation separated from entity logic

**Alternatives Considered:**

- **Multiple Entity Classes**: Would create inheritance complexity
- **GameObject Factory**: Would require external factory management
- **Composition Pattern**: Current approach IS composition pattern implementation

### Implementation

```javascript
// Backward compatibility - continues working
const player = new BaseEntity(scene, 100, 100, 64, 64, 0x0099ff, 'player');

// New configuration object approach
const sprite = new BaseEntity(scene, {
  type: 'sprite',
  x: 200, y: 200,
  texture: 'player-sprite',
  frame: 0,
  name: 'sprite-player'
});

// Logical entity with no visual representation
const controller = new BaseEntity(scene, {
  type: null,
  x: 300, y: 300,
  name: 'game-controller'
});

// Dynamic type changes at runtime
entity.changeGameObjectType('sprite', { texture: 'upgraded-player' });
```

### Consequences

**Positive:**

- ✅ Supports all Phaser GameObject types
- ✅ Enables pure logical entities (null GameObject)
- ✅ Perfect backward compatibility
- ✅ Runtime type switching capability
- ✅ Null-safe property delegation

**Negative:**

- ❌ More complex constructor logic
- ❌ Additional configuration validation required
- ❌ Multiple code paths to maintain

**Mitigation:**

- Comprehensive unit testing covers all GameObject types and edge cases
- Clear documentation with examples for each type
- Fallback strategies for invalid configurations

---

## ADR-010: KeyboardInputAdapter Event-Driven Input

**Status**: Accepted ✅  
**Date**: Sprint 3  
**Deciders**: Development Team

### Context

Input handling was scattered across scenes and systems, creating tight coupling and making it difficult to implement features like input recording, remapping, or multi-input support. Direct Phaser input handling in GameScene created maintenance challenges and limited extensibility.

### Decision

Implement centralized KeyboardInputAdapter with event-driven architecture:

- **Centralized Input**: Single source of truth for keyboard input
- **Event-Driven**: Uses EventBus for decoupled communication
- **State Management**: Comprehensive input state tracking
- **Normalized Movement**: Proper diagonal movement calculation
- **Structured Events**: Consistent event format with timestamps

### Rationale

**Benefits:**

- **Separation of Concerns**: Input logic separated from game logic
- **Extensible**: Easy to add new input types or features
- **Testable**: Input logic can be unit tested independently
- **Consistent**: Standardized input event format
- **Maintainable**: Centralized input handling

**Alternatives Considered:**

- **Direct Scene Input**: Current approach, creates tight coupling
- **Input Manager Class**: Similar to adapter but less flexible
- **Phaser Input Plugin**: Would require plugin development overhead

### Implementation

```javascript
// KeyboardInputAdapter with comprehensive state management
class KeyboardInputAdapter extends BaseAdapter {
  constructor(scene) {
    super(scene);
    
    this.inputState = {
      movement: { x: 0, y: 0 },
      keys: new Set(),
      weaponFiring: false
    };
    
    this.movementKeys = {
      'KeyW': { x: 0, y: -1 },
      'KeyA': { x: -1, y: 0 },
      'KeyS': { x: 0, y: 1 },
      'KeyD': { x: 1, y: 0 },
      // Arrow keys also supported
    };
  }

  updateMovementState() {
    // Normalized diagonal movement calculation
    let x = 0, y = 0;
    for (const keyCode of this.inputState.keys) {
      if (this.movementKeys[keyCode]) {
        const direction = this.movementKeys[keyCode];
        x += direction.x;
        y += direction.y;
      }
    }
    
    // Normalize diagonal movement
    if (x !== 0 && y !== 0) {
      const length = Math.sqrt(x * x + y * y);
      x /= length;
      y /= length;
    }
    
    this.inputState.movement = { x, y };
  }
}
```

### Consequences

**Positive:**

- ✅ Clean separation of input and game logic
- ✅ Centralized input state management
- ✅ Event-driven architecture enables extensibility
- ✅ Proper diagonal movement normalization
- ✅ Comprehensive input state tracking

**Negative:**

- ❌ Additional abstraction layer
- ❌ More complex setup compared to direct input
- ❌ EventBus dependency for communication

**Mitigation:**

- Clear documentation and examples for usage
- BaseAdapter provides common adapter functionality
- EventBus provides consistent communication pattern

---

## ADR-011: Comprehensive Unit Testing with Phaser Mocking

**Status**: Accepted ✅  
**Date**: Sprint 3  
**Deciders**: Development Team

### Context

The original minimal testing strategy only covered pure utility functions, leaving complex game architecture components untested. As the codebase matured with sophisticated ECS base classes, adapters, and Logger systems, the lack of testing created maintenance risks and reduced confidence in refactoring.

### Decision

Implement comprehensive unit testing with strategic Phaser mocking:

- **Expanded Test Coverage**: Test core architecture components beyond just utilities
- **Phaser Mocking Strategy**: Mock Phaser dependencies where necessary for testing
- **36+ Test Cases**: Comprehensive test suites for Logger, BaseEntity, and ObjectPool
- **Testing Architecture Components**: Test BaseAdapter, EventBus integration, and ECS patterns
- **Maintain Minimal Philosophy**: Still avoid testing visual/integration aspects

### Rationale

**Benefits:**

- **Architecture Confidence**: Core systems have reliable test coverage
- **Refactoring Safety**: Tests prevent regressions during code changes
- **Documentation**: Tests serve as usage examples for complex components
- **Quality Assurance**: Catch edge cases and error conditions
- **Development Speed**: Faster feedback loop on architecture changes

**Alternatives Considered:**

- **Continue Minimal Testing**: Would leave architecture untested as complexity grows
- **Full Integration Testing**: Too complex and fragile for game development
- **Visual Testing**: Inappropriate for game graphics and animations

### Implementation

```javascript
// Logger comprehensive testing (32 test cases)
describe('Logger Auto-Initialization', () => {
  it('should auto-initialize on first debug call', () => {
    Logger.debug('test message');
    expect(Logger.isInitialized).toBe(true);
  });

  it('should handle environment variable fallbacks', () => {
    // Test dual environment support
    // Test graceful fallbacks
    // Test error recovery
  });
});

// BaseEntity flexible GameObject testing
describe('BaseEntity GameObject Types', () => {
  it('should support rectangle creation (backward compatibility)', () => {
    const entity = new BaseEntity(mockScene, 100, 100, 64, 64, 0xff0000);
    expect(entity.gameObject).toBeInstanceOf(MockRectangle);
  });

  it('should support null GameObject for logical entities', () => {
    const entity = new BaseEntity(mockScene, { type: null, x: 100, y: 100 });
    expect(entity.gameObject).toBeNull();
    expect(entity.x).toBe(100); // Null-safe property access
  });
});
```

### Consequences

**Positive:**

- ✅ Core architecture components have reliable test coverage
- ✅ 36+ test cases provide comprehensive edge case coverage
- ✅ Phaser mocking enables testing of game components
- ✅ Tests serve as documentation for complex usage patterns
- ✅ Maintains focus on testable architecture components

**Negative:**

- ❌ More complex test setup with mocking requirements
- ❌ Test maintenance overhead as architecture evolves
- ❌ Still avoid testing visual/integration aspects

**Mitigation:**

- Strategic mocking focuses on essential dependencies only
- Clear separation between architecture testing and visual testing
- Comprehensive documentation of testing patterns and approaches

---

## Decision Summary

| ADR     | Decision             | Status      | Impact                               |
| ------- | -------------------- | ----------- | ------------------------------------ |
| ADR-001 | ECS Architecture     | ✅ Accepted | High - Affects all game entities     |
| ADR-002 | Development Graphics | ✅ Accepted | Medium - Visual development approach |
| ADR-003 | Logger BaseSystem        | ✅ Accepted | High - Used throughout codebase      |
| ADR-004 | Scene Management     | ✅ Accepted | Medium - Game flow structure         |
| ADR-005 | BaseComponent Data Focus | ✅ Accepted | High - ECS implementation details    |
| ADR-006 | Minimal Testing      | ✅ Accepted | Medium - Development process         |
| ADR-007 | Single Branch        | ✅ Accepted | Low - Development workflow           |
| ADR-008 | Auto-Init Logger     | ✅ Accepted | High - Eliminates initialization errors |
| ADR-009 | Flexible BaseEntity  | ✅ Accepted | High - Maximum GameObject flexibility |
| ADR-010 | KeyboardInputAdapter | ✅ Accepted | Medium - Centralized input handling |
| ADR-011 | Comprehensive Testing| ✅ Accepted | Medium - Architecture test coverage |

---

## Future Considerations

### Decisions to Revisit

**ADR-002 (Development Graphics)**: **READY FOR TRANSITION** - With flexible BaseEntity GameObject support (ADR-009), transitioning from dev graphics to sprites is now seamless. Plan asset pipeline and sprite loading strategy.

**ADR-006 vs ADR-011 (Testing Strategy Evolution)**: Successfully evolved from minimal testing to comprehensive unit testing with Phaser mocking. Continue expanding test coverage for new systems while maintaining focus on architecture components.

**ADR-009 (BaseEntity Flexibility)**: Monitor performance impact of flexible GameObject types and consider optimization strategies if needed.

### Recently Implemented Decisions

**Sprint 3 Achievements:**

- ✅ **Auto-Initializing Logger** (ADR-008): Eliminated initialization errors and improved developer experience
- ✅ **Flexible BaseEntity** (ADR-009): Maximum GameObject flexibility with backward compatibility
- ✅ **KeyboardInputAdapter** (ADR-010): Centralized, event-driven input handling
- ✅ **Comprehensive Testing** (ADR-011): 36+ test cases with Phaser mocking strategy

### Upcoming Decisions

**Sprint 4+ Decisions Needed:**

- **Mobile Input Adapter**: Extend input adapter pattern for touch/mobile input
- **Audio System Architecture**: Web Audio API integration with EventBus pattern
- **Particle System Integration**: BaseEntity-based particle scopeName design
- **Save Game Versioning**: Data format evolution and migration strategies
- **Performance Monitoring**: Real-time performance metrics and optimization

**Future Architecture Considerations:**

- **Multi-Platform Input**: Extending adapter pattern for gamepad, touch, and keyboard
- **Component Serialization**: Enhanced save/load support with component versioning
- **Asset Management**: Integration with flexible BaseEntity GameObject types
- **Progressive Web App**: Offline support and caching strategies
- **Performance Optimization**: Object pooling patterns for all GameObject types

### Architecture Maturity Assessment

The project architecture has significantly matured through Sprint 3:

**✅ Completed Foundations:**
- Flexible ECS with multiple GameObject support
- Auto-initializing utility systems
- Event-driven architecture patterns
- Comprehensive unit testing approach
- Centralized input management

**🔄 Continuing Evolution:**
- Performance optimization patterns
- Asset pipeline integration
- Advanced game systems (audio, particles, etc.)
- Cross-platform compatibility

**🎯 Next Phase Focus:**
- Multi-modal input support (mobile, gamepad)
- Advanced game systems integration
- Performance monitoring and optimization
- Asset pipeline maturation

This ADR document will be updated as new architectural decisions are made throughout the project development. The strong architectural foundation established in Sprint 3 provides excellent support for future feature development.
