# Architecture Decision Records (ADRs)

This document records the key architectural decisions made during the development of the Space Shooter game, including the context, decision rationale, and consequences of each choice.

## Table of Contents

- [ADR-001: Entity Component System Architecture](#adr-001-entity-component-system-architecture)
- [ADR-002: Development Graphics Strategy](#adr-002-development-graphics-strategy)
- [ADR-003: Environment-Aware Logger System](#adr-003-environment-aware-logger-system)
- [ADR-004: Scene Management Architecture](#adr-004-scene-management-architecture)
- [ADR-005: Component as Data Containers](#adr-005-component-as-data-containers)
- [ADR-006: Minimal Testing Strategy](#adr-006-minimal-testing-strategy)
- [ADR-007: Direct Main Branch Development](#adr-007-direct-main-branch-development)

---

## ADR-001: Entity Component System Architecture

**Status**: Accepted ✅  
**Date**: Sprint 1  
**Deciders**: Development Team

### Context

The game requires a flexible architecture that can handle multiple entity types (Player, Enemy, Projectile, PowerUp) with varying behaviors and properties. Traditional inheritance hierarchies become complex and rigid as features are added.

### Decision

Implement an Entity Component System (ECS) architecture built on top of Phaser.js GameObjects:

- **Entities**: Extend `Phaser.GameObjects.Rectangle` for development phase
- **Components**: Pure data containers inheriting from base `Component` class
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
- **Full ECS Library**: Overhead not justified for game scope
- **Traditional Inheritance**: Becomes unwieldy with multiple entity types

### Implementation

```javascript
// Entity - Game object with component management
class Entity extends Phaser.GameObjects.Rectangle {
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

// Component - Pure data container
class HealthComponent extends Component {
  constructor(maxHealth) {
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
  }
}

// System - Logic processor
class MovementSystem extends System {
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
- ❌ Component lookup has small performance overhead

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

## ADR-003: Environment-Aware Logger System

**Status**: Accepted ✅  
**Date**: Sprint 1  
**Deciders**: Development Team

### Context

Console logging is essential for development debugging but should be completely disabled in production builds. Standard `console.log` statements either clutter production code or require manual removal.

### Decision

Implement a centralized Logger system that respects environment configuration:

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
- **Third-party logging library**: Overkill for project scope

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
- Logger.init() called early in startup sequence

---

## ADR-004: Scene Management Architecture

**Status**: Accepted ✅  
**Date**: Sprint 1  
**Deciders**: Development Team

### Context

The game requires multiple distinct states (loading, menu, gameplay, game over) with different UI, input handling, and game logic requirements. Transitions between states must be smooth and manageable.

### Decision

Implement a structured scene flow using Phaser's scene management system:

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
    Logger.init();
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

## ADR-005: Component as Data Containers

**Status**: Accepted ✅  
**Date**: Sprint 1  
**Deciders**: Development Team

### Context

In ECS architecture, there are different approaches to component design. Components can be pure data containers, or they can include methods and logic. The choice affects maintainability, testing, and system design.

### Decision

Implement components as primarily data containers with minimal methods:

- **Data-Focused**: Components store state and properties
- **Minimal Logic**: Only data validation and simple getters/setters
- **System Processing**: Business logic handled by Systems
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
// Component - Primarily data with minimal methods
class HealthComponent extends Component {
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

// System handles complex logic
class CombatSystem extends System {
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

- ❌ Some operations require component + system coordination
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
- **GitFlow**: Too complex for project scope
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

## Decision Summary

| ADR     | Decision             | Status      | Impact                               |
| ------- | -------------------- | ----------- | ------------------------------------ |
| ADR-001 | ECS Architecture     | ✅ Accepted | High - Affects all game entities     |
| ADR-002 | Development Graphics | ✅ Accepted | Medium - Visual development approach |
| ADR-003 | Logger System        | ✅ Accepted | High - Used throughout codebase      |
| ADR-004 | Scene Management     | ✅ Accepted | Medium - Game flow structure         |
| ADR-005 | Component Data Focus | ✅ Accepted | High - ECS implementation details    |
| ADR-006 | Minimal Testing      | ✅ Accepted | Medium - Development process         |
| ADR-007 | Single Branch        | ✅ Accepted | Low - Development workflow           |

---

## Future Considerations

### Decisions to Revisit

**ADR-002 (Development Graphics)**: Will need to transition to actual sprites in later sprints. Plan transition strategy and asset pipeline.

**ADR-006 (Minimal Testing)**: As complexity grows, may need to expand testing strategy, particularly for save/load systems and game state management.

### Upcoming Decisions

**Sprint 2 Decisions Needed:**

- Audio system architecture (Web Audio API vs Phaser Audio)
- Particle system approach (custom vs Phaser built-in)
- Save game data format and versioning strategy
- Performance optimization techniques (object pooling, etc.)

**Future Architecture Considerations:**

- Multiplayer support (if required)
- Mobile input handling
- Progressive Web App features
- Content delivery and asset optimization

This ADR document will be updated as new architectural decisions are made throughout the project development.
