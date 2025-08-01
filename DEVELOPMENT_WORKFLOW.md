# Development Workflow Documentation

This document outlines the development workflow, sprint procedures, testing processes, and code quality standards for the Space Shooter game project.

## Table of Contents

- [Sprint Management](#sprint-management)
- [Development Process](#development-process)
- [Code Quality Standards](#code-quality-standards)
- [Testing Procedures](#testing-procedures)
- [Git Workflow](#git-workflow)
- [Documentation Standards](#documentation-standards)
- [Performance Guidelines](#performance-guidelines)
- [Sprint Completion Procedures](#sprint-completion-procedures)

---

## Sprint Management

### Sprint Structure

**Sprint Duration**: 1 week (5 working days)
**Sprint Planning**: Start of each sprint
**Sprint Review**: End of each sprint
**Retrospective**: Combined with sprint review

### Sprint Phases

#### Phase 1: Planning (Day 1 Morning)

```bash
# Sprint planning activities
1. Review previous sprint outcomes
2. Analyze current backlog priorities
3. Define sprint goal and success criteria
4. Break down features into tasks
5. Estimate task complexity and time
6. Identify dependencies and risks
```

#### Phase 2: Development (Days 1-4)

```bash
# Daily development workflow
1. Start with environment setup verification
2. Run code quality checks
3. Implement planned features
4. Test functionality continuously
5. Document progress and decisions
```

#### Phase 3: Integration & Testing (Day 5)

```bash
# Sprint completion activities
1. Integrate all features
2. Run comprehensive testing
3. Perform code quality validation
4. Update documentation
5. Prepare sprint review
```

### Sprint Success Criteria

**Technical Criteria:**

- [ ] All planned features implemented and functional
- [ ] Code quality standards met (100% ESLint pass)
- [ ] Performance targets maintained (60+ FPS)
- [ ] No console.log statements in final code
- [ ] All components properly tested

**Documentation Criteria:**

- [ ] API documentation updated for new features
- [ ] README reflects current implementation
- [ ] Troubleshooting guide updated with new issues
- [ ] Architecture decisions documented

**Quality Criteria:**

- [ ] Manual testing checklist completed
- [ ] Cross-browser compatibility verified
- [ ] Memory leaks checked and resolved
- [ ] Error handling tested and verified

---

## Development Process

### Daily Development Workflow

#### Morning Setup (10 minutes)

```bash
# 1. Environment verification
git pull origin main
npm install  # Only if package.json changed
cp .env.example .env  # Only for new setup

# 2. Dependency check
npm run validate  # ESLint + Prettier + Tests

# 3. Start development server
npm run dev

# 4. Verify game loads correctly
# Check http://localhost:5173
# Verify no console errors
```

#### Development Loop

```bash
# 1. Feature implementation
# - Create/modify source files
# - Follow ECS architecture patterns
# - Use Logger instead of console.log
# - Add JSDoc comments

# 2. Continuous testing
# Save file -> Browser auto-refreshes
# Test functionality immediately
# Check for console errors

# 3. Code quality check (every 30 minutes)
npm run lint:fix
npm run format

# 4. Progress documentation
# Update relevant documentation
# Commit working changes regularly
```

#### End of Day (15 minutes)

```bash
# 1. Final quality check
npm run validate

# 2. Commit day's work
git add .
git commit -m "Implement [feature]: [description]"

# 3. Update progress tracking
# Document completed tasks
# Note any blockers or issues
# Plan next day priorities
```

### Feature Development Process

#### 1. Architecture Planning

```javascript
// Before implementing any feature:
// 1. Identify required entities
// 2. Design necessary components
// 3. Plan systems integration
// 4. Consider performance impact

// Example: Adding weapon system
// Entities: Player (existing), Projectile (new)
// Components: WeaponComponent (new), update HealthComponent
// Systems: WeaponSystem (new), CollisionSystem (update)
```

#### 2. Component-First Development

```javascript
// Start with data structures (Components)
class WeaponComponent extends Component {
  constructor(weaponType) {
    super();
    this.weaponType = weaponType;
    this.damage = 25;
    this.fireRate = 500; // ms between shots
    this.lastFiredTime = 0;
  }
}

// Then create/update entities to use components
player.addComponent(new WeaponComponent('laser'));

// Finally implement systems to process components
class WeaponSystem extends System {
  update(entities, delta) {
    // Process all entities with WeaponComponent
  }
}
```

#### 3. Development Graphics Integration

```javascript
// Use DevShapes for rapid prototyping
import DevShapes from '../graphics/DevShapes.js';

// Create projectile as simple shape
const projectile = DevShapes.createProjectile(scene, x, y, 8);
// Easy to replace with sprite later:
// const projectile = scene.add.sprite(x, y, 'bulletTexture');
```

#### 4. Logger Integration

```javascript
import Logger from '../core/Logger.js';

// Replace all console.log with Logger methods
Logger.debug('Weapon fired', { damage: weapon.damage });
Logger.info('Player leveled up', { newLevel: player.level });
Logger.warn('Low ammunition', { remaining: weapon.ammo });
Logger.error('Failed to create projectile', error);
```

### Code Organization Standards

#### File Structure

```bash
# New feature implementation should follow:
src/
├── components/
│   └── [FeatureName]Component.js  # Data container
├── entities/
│   └── [EntityName].js           # Game object
├── systems/
│   └── [FeatureName]System.js    # Logic processor
├── scenes/
│   └── [SceneName]Scene.js       # Scene management
└── utils/
    └── [UtilityName].js          # Helper functions
```

#### Naming Conventions

```javascript
// Classes: PascalCase
class WeaponComponent extends Component {}
class ProjectileEntity extends Entity {}
class WeaponSystem extends System {}

// Variables/Functions: camelCase
const maxHealth = 100;
const fireRate = 500;
function calculateDamage() {}

// Constants: UPPER_SNAKE_CASE
const MAX_ENEMIES = 50;
const DEFAULT_SPEED = 200;

// Files: PascalCase for classes, camelCase for utilities
WeaponComponent.js;
ProjectileEntity.js;
mathUtils.js;
```

---

## Code Quality Standards

### ESLint Configuration

**Required Rules:**

- No `console.log` statements (use Logger system)
- ES6+ syntax required (const/let, arrow functions, classes)
- Single quotes for strings
- 2-space indentation
- Trailing commas in objects/arrays
- Semicolons required

**Custom Rules for Game Development:**

```javascript
// .eslintrc.js custom rules
rules: {
  'no-console': 'error',  // Enforces Logger usage
  'prefer-const': 'error',
  'no-var': 'error',
  'quotes': ['error', 'single'],
  'semi': ['error', 'always'],
  'comma-dangle': ['error', 'always-multiline'],
}
```

### Prettier Configuration

**Formatting Standards:**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

### Code Quality Validation

#### Pre-Commit Checks

```bash
# Run before every commit
npm run validate

# What it checks:
# 1. ESLint passes with no errors
# 2. Prettier formatting is consistent
# 3. Basic unit tests pass
# 4. No console.log statements
# 5. Import/export syntax is valid
```

#### Daily Quality Metrics

```bash
# Track these metrics daily:
# 1. ESLint pass rate: Should be 100%
# 2. Test coverage: Utilities only, keep minimal
# 3. Performance: 60+ FPS maintained
# 4. Memory usage: No leaks detected
# 5. Bundle size: Monitor for bloat
```

### JSDoc Documentation Standards

```javascript
/**
 * Component for managing entity weapons
 * @class WeaponComponent
 * @extends Component
 */
class WeaponComponent extends Component {
  /**
   * Create a weapon component
   * @param {string} weaponType - Type of weapon ('laser', 'missile', etc.)
   * @param {number} damage - Base damage value
   * @param {number} fireRate - Milliseconds between shots
   */
  constructor(weaponType = 'basic', damage = 25, fireRate = 500) {
    super();
    this.weaponType = weaponType;
    this.damage = damage;
    this.fireRate = fireRate;
  }

  /**
   * Check if weapon can fire
   * @param {number} currentTime - Current game time in milliseconds
   * @returns {boolean} True if weapon can fire
   */
  canFire(currentTime) {
    return currentTime - this.lastFiredTime >= this.fireRate;
  }
}
```

---

## Testing Procedures

### Testing Philosophy

**What We Test:**

- ✅ Core utility functions (math, data transformation)
- ✅ Save/load operations
- ✅ Object pooling mechanics
- ✅ Pure functions with clear inputs/outputs

**What We Don't Test:**

- ❌ Phaser GameObjects (too complex to mock)
- ❌ ECS Components (simple data containers)
- ❌ Systems (integration tested manually)
- ❌ UI/Graphics (visual testing only)
- ❌ Audio (browser-dependent)

### Unit Testing (Minimal)

#### Test Structure

```javascript
// tests/utils/MathUtils.test.js
import { describe, it, expect } from 'vitest';
import { MathUtils } from '../../src/utils/MathUtils.js';

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
```

#### Running Tests

```bash
# Run all tests (should complete in <30 seconds)
npm run test

# Watch mode for TDD
npm run test:watch

# Coverage report
npm run test:coverage
```

### Manual Testing (Primary Method)

#### Daily Testing Checklist

```bash
# Performance Testing
[ ] Game loads without errors
[ ] Maintains 60+ FPS during gameplay
[ ] Memory usage stable (no leaks)
[ ] No console errors in DevTools

# Functionality Testing
[ ] Player movement responsive (WASD/Arrows)
[ ] Player stops at screen boundaries
[ ] Health system works correctly
[ ] Pause/resume functions (ESC key)
[ ] Debug controls work (F2/F3)

# Code Quality Testing
[ ] ESLint passes with 0 errors
[ ] Prettier formatting consistent
[ ] No console.log statements in code
[ ] Logger messages appear in debug mode

# Cross-Browser Testing (weekly)
[ ] Chrome (primary development browser)
[ ] Firefox (secondary compatibility)
[ ] Safari (if on macOS)
[ ] Edge (Windows testing)
```

#### Integration Testing Process

```bash
# End-to-end gameplay testing
1. Start game from main menu
2. Play for 5+ minutes continuously
3. Test all implemented features
4. Verify UI updates correctly
5. Check performance remains stable
6. Test pause/resume functionality
7. Verify proper game state management
```

---

## Git Workflow

### Branch Strategy

**Main Branch**: `main`

- Always deployable/functional
- All code passes quality checks
- Sprint-ready features only

**Development Approach**: Direct commits to main

- Small, frequent commits
- Each commit is functional
- Quality checks before every commit

### Commit Standards

#### Commit Message Format

```bash
# Format: [Type]: [Description]
# Types: implement, fix, refactor, docs, style, test

# Examples:
git commit -m "implement: Player movement with WASD controls"
git commit -m "fix: Health bar not updating on damage"
git commit -m "refactor: Extract weapon logic to WeaponComponent"
git commit -m "docs: Add API documentation for Logger system"
git commit -m "style: Apply Prettier formatting to all files"
git commit -m "test: Add MathUtils distance calculation tests"
```

#### Pre-Commit Workflow

```bash
# 1. Check working changes
git status
git diff

# 2. Run quality checks
npm run validate

# 3. Add files to staging
git add .

# 4. Commit with descriptive message
git commit -m "implement: [feature description]"

# 5. Optional: Push to remote
git push origin main
```

### Code Review Process

#### Self-Review Checklist

```bash
# Before committing, verify:
[ ] Code follows project conventions
[ ] Logger used instead of console.log
[ ] JSDoc comments added for new functions
[ ] No hardcoded values (use constants)
[ ] Error handling implemented
[ ] Performance impact considered
[ ] Documentation updated if needed
```

---

## Documentation Standards

### Documentation Requirements

**Always Update:**

- README.md for new features or setup changes
- API_DOCUMENTATION.md for new components/systems
- TROUBLESHOOTING.md for new issues discovered
- Code comments for complex logic

**Documentation Levels:**

#### 1. Code-Level Documentation

```javascript
/**
 * Create a new projectile entity
 * @param {Phaser.Scene} scene - Scene to add projectile to
 * @param {number} x - Starting X coordinate
 * @param {number} y - Starting Y coordinate
 * @param {number} damage - Damage value for collision
 * @param {number} speed - Movement speed in pixels/second
 * @returns {Entity} Created projectile entity
 */
function createProjectile(scene, x, y, damage, speed) {
  const projectile = new Entity(scene, x, y, 8, 8, 0xffff00);
  // Implementation details...
  return projectile;
}
```

#### 2. Component/System Documentation

```javascript
/**
 * Movement Component - Sprint 1 Implementation
 *
 * Handles entity movement with velocity, acceleration, and screen bounds.
 * Integrates with Phaser physics system for collision detection.
 *
 * Features:
 * - Direct velocity control
 * - Acceleration/force application
 * - Screen boundary clamping
 * - Drag and friction simulation
 *
 * Usage:
 * const movement = new MovementComponent(300); // 300 max speed
 * entity.addComponent(movement);
 * movement.setVelocity(100, -50); // Move right and up
 */
```

#### 3. Architecture Documentation

```markdown
## ECS Architecture Decision - Sprint 1

**Decision**: Use components as pure data containers, systems as logic processors

**Rationale**:

- Separates data from behavior
- Enables easy testing of systems
- Supports flexible entity composition
- Integrates well with Phaser's existing systems

**Implementation**:

- Components extend base Component class
- Systems process entities in update loops
- Entities manage component lifecycle
```

### Inline Documentation

```javascript
// Use inline comments for complex logic
function updatePlayerMovement(delta) {
  const movement = this.player.getComponent(MovementComponent);

  // Apply input velocity directly (no acceleration for responsive feel)
  let velocityX = 0;
  let velocityY = 0;

  // Check horizontal input (WASD or Arrow keys)
  if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
    velocityX = -movement.maxSpeed;
  } else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
    velocityX = movement.maxSpeed;
  }

  // Apply calculated velocity (component handles bounds checking)
  movement.setVelocity(velocityX, velocityY);
}
```

---

## Performance Guidelines

### Performance Targets

**Frame Rate**: 60+ FPS consistently
**Memory Usage**: <100MB total
**Load Time**: <3 seconds initial load
**Input Latency**: <16ms response time

### Performance Monitoring

#### Development Monitoring

```bash
# Enable performance debugging
VITE_SHOW_FPS=true
VITE_SHOW_DEBUG_INFO=true

# Monitor in browser DevTools:
# 1. Performance tab for frame rate analysis
# 2. Memory tab for leak detection
# 3. Network tab for asset loading
```

#### Performance Optimization Checklist

```bash
# Code Optimization
[ ] Object pooling for frequently created objects
[ ] Efficient entity/component updates
[ ] Minimal garbage collection pressure
[ ] Optimized collision detection

# Render Optimization
[ ] Proper sprite batching
[ ] Texture atlas usage
[ ] Efficient particle systems
[ ] Appropriate depth/layer usage

# Memory Optimization
[ ] Proper entity cleanup
[ ] Event listener removal
[ ] Texture disposal
[ ] Audio buffer management
```

### Performance Testing

#### Daily Performance Check

```bash
# Run game for 10+ minutes continuously
# Monitor these metrics:
1. Average FPS (should stay >60)
2. Memory usage (should not continuously grow)
3. Input responsiveness (no lag)
4. Browser DevTools performance score
```

---

## Sprint Completion Procedures

### Sprint Review Process

#### Day 5: Sprint Completion

```bash
# Morning: Feature completion and integration
1. Complete all planned features
2. Run comprehensive testing
3. Fix any critical issues found
4. Ensure code quality standards met

# Afternoon: Documentation and review
1. Update all documentation files
2. Run final quality validation
3. Prepare sprint review presentation
4. Plan next sprint priorities
```

### Quality Gates

#### Technical Quality Gate

```bash
# All must pass before sprint completion:
[ ] ESLint: 0 errors, 0 warnings
[ ] Prettier: All files formatted consistently
[ ] Tests: All utility tests passing
[ ] Performance: 60+ FPS maintained
[ ] Memory: No leaks detected in 10+ minute test
[ ] Cross-browser: Basic functionality in 2+ browsers
```

#### Documentation Quality Gate

```bash
# Documentation must be current:
[ ] README.md reflects current implementation
[ ] API_DOCUMENTATION.md covers new features
[ ] TROUBLESHOOTING.md includes new issues
[ ] Code comments explain complex logic
[ ] Architecture decisions documented
```

#### Functional Quality Gate

```bash
# Manual testing checklist complete:
[ ] All sprint features working as designed
[ ] User interface updates correctly
[ ] Game state management working
[ ] Error handling tested and functional
[ ] Debug features working in development
```

### Sprint Retrospective

#### Review Questions

```bash
# What went well this sprint?
- Technical achievements
- Process improvements
- Learning outcomes

# What could be improved?
- Development bottlenecks
- Quality issues encountered
- Process pain points

# What will we do differently next sprint?
- Process adjustments
- Technical approach changes
- Quality improvement actions
```

### Next Sprint Planning

#### Sprint Transition

```bash
# End of current sprint:
1. Archive sprint documentation
2. Update project status
3. Identify carry-over tasks
4. Plan next sprint goals

# Start of next sprint:
1. Review previous sprint outcomes
2. Set new sprint objectives
3. Break down planned features
4. Update development environment
```

This development workflow ensures consistent quality, maintainable code, and steady progress toward project goals while maintaining flexibility for iteration and improvement.
