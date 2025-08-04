# Sprint 1: Foundation & Setup - Detailed Task Breakdown

## Week 1 Objectives
**Goal**: Establish technical foundation and basic player movement
**Duration**: 5 working days
**Priority**: Critical Path - All subsequent work depends on this foundation

## Day-by-Day Task Breakdown

### Day 1: Environment Setup (Critical)
**Estimated Time**: 6-8 hours
**Tasks**:
1. **Dependency Installation** (2 hours)
   - Install Phaser.js 3.70+: `npm install phaser`
   - Install development tools: `npm install -D eslint prettier vitest jsdom`
   - Install ESLint config: `npm install -D @eslint/js eslint-config-prettier eslint-plugin-prettier`

2. **Configuration Setup** (3 hours)
   - Create .eslintrc.js with project-specific rules
   - Create .prettierrc with 2-space indentation, single quotes
   - Configure vite.config.js with Vitest integration
   - Create .env.example and .env files with debug settings

3. **Template Cleanup** (1 hour)
   - Remove counter.js, javascript.svg, style.css (Vite template files)
   - Clean up index.html for game-specific structure
   - Update package.json scripts (lint, format, test commands)

**Deliverable**: Clean development environment with proper tooling

### Day 2: Core Architecture Foundation (Critical)
**Estimated Time**: 6-8 hours
**Tasks**:
1. **Project Structure Creation** (2 hours)
   - Create directory structure: config/, core/, scenes/, entities/, components/, systems/, graphics/, utils/
   - Set up basic file structure according to CLAUDE.md specifications

2. **Logger BaseSystem Implementation** (2 hours)
   - Create src/core/Logger.js with environment-aware logging
   - Implement debug, info, warn, error methods with prefixes
   - Configure with VITE_DEBUG_MODE environment variable

3. **Base ECS Classes** (3 hours)
   - Create src/entities/BaseEntity.js (extends Phaser.GameObjects.Rectangle)
   - Create src/components/BaseComponent.js (base component class)
   - Create src/systems/BaseSystem.js (base system class)
   - Implement component add/get/has methods on BaseEntity

**Deliverable**: ECS architecture foundation with Logger system

### Day 3: Scene Infrastructure (High Priority)
**Estimated Time**: 6-8 hours
**Tasks**:
1. **Boot Scene Setup** (2 hours)
   - Create src/scenes/BootScene.js for environment initialization
   - Load environment variables and configure Logger
   - Handle initial setup and transition to Preloader

2. **Preloader Scene** (2 hours)
   - Create src/scenes/PreloaderScene.js for asset management
   - Set up for development graphics (no actual assets yet)
   - Progress bar for future asset loading

3. **Game Scene Foundation** (3 hours)
   - Create src/scenes/GameScene.js as main gameplay scene
   - Set up scene update loop and entity management
   - Basic scene structure with entities array

**Deliverable**: Scene management system ready for gameplay

### Day 4: Player BaseEntity Implementation (High Priority)
**Estimated Time**: 6-8 hours
**Tasks**:
1. **Player BaseEntity** (3 hours)
   - Create src/entities/Player.js extending BaseEntity
   - Implement as blue 64x64px rectangle using DevShapes
   - Add to GameScene with proper physics body

2. **Movement BaseComponent** (2 hours)
   - Create src/components/MovementComponent.js
   - Store velocity, speed, and movement state data
   - Handle boundary constraints

3. **Input Handling** (2 hours)
   - Set up keyboard input in GameScene (WASD/Arrow keys)
   - Connect input to player movement component
   - Basic input validation and state management

**Deliverable**: Player entity with component-based movement

### Day 5: Movement BaseSystem & Polish (High Priority)
**Estimated Time**: 6-8 hours
**Tasks**:
1. **Movement BaseSystem** (3 hours)
   - Create src/systems/MovementSystem.js
   - Implement update method for entity movement
   - Handle screen boundary collision

2. **Development Graphics Helper** (2 hours)
   - Create src/graphics/DevShapes.js
   - Static methods for creating colored rectangles
   - Player, enemy, projectile shape generators

3. **Integration & Testing** (2 hours)
   - Integrate all systems in GameScene update loop
   - Manual testing of player movement and controls
   - Performance verification (60fps target)
   - Code quality checks (ESLint, Prettier)

**Deliverable**: Fully controllable player character

## Sprint 1 Quality Gates
- [ ] **Environment**: ESLint passes with no errors, Prettier formatting consistent
- [ ] **Architecture**: ECS base classes implemented and functional
- [ ] **Logger**: All debug output uses Logger system (no console.log)
- [ ] **Player**: Blue rectangle moves smoothly with keyboard input
- [ ] **Performance**: Maintains 60fps with no memory leaks
- [ ] **Code Quality**: All files follow project conventions

## Definition of Done - Sprint 1
1. Player character (blue rectangle) responds to WASD/Arrow key input
2. Movement is smooth and bounded to screen edges
3. ECS architecture is in place and functional
4. Logger system is configured and used throughout
5. All code passes ESLint and Prettier checks
6. No console.log statements in final code
7. Development environment is stable and ready for Sprint 2

## Risk Mitigation - Sprint 1
- **Phaser Integration Complexity**: Allocate extra time on Day 2-3 for debugging
- **ECS Architecture Confusion**: Reference CLAUDE.md examples, keep it simple
- **Development Environment Issues**: Test all scripts and configurations thoroughly

## Success Metrics
- **Technical**: Player movement at 60fps, no console errors
- **Code Quality**: 100% ESLint pass rate, consistent formatting
- **Architecture**: Clean separation of BaseEntity/BaseComponent/BaseSystem responsibilities
- **Documentation**: All major functions have Logger debug statements