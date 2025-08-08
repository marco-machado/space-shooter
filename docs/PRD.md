# Space Shooter Game - Product Requirements Document

## Game Overview

### Vision Statement

Create an engaging top-down space shooter game using Phaser.js 3.x with Vite build tooling that combines classic arcade action with modern progression mechanics. The game will feature multiple weapon types, diverse enemy encounters, power-up systems, and persistent player progression using bitECS (Entity Component System) architecture.

### Target Platform

- Web browsers (desktop and mobile)
- HTML5 Canvas with WebGL rendering
- Client-side only with localStorage persistence
- Modern ES6+ JavaScript with Vite bundling
- Environment-configurable development features

## Core Game Features

### 1. Player Ship & Controls

**Objective**: Provide responsive and intuitive player control

**Requirements**:

- Top-down view spaceship sprite
- WASD or Arrow key movement with smooth acceleration/deceleration
- Screen boundary constraints (ship cannot leave visible area)
- Visual feedback for movement (engine trails, rotation)
- Collision detection with enemies and projectiles

**Acceptance Criteria**:

- Ship responds immediately to input with smooth movement
- Movement feels precise and controllable at 60fps
- Visual effects enhance the sense of movement

### 2. Weapon System

**Objective**: Provide varied combat options with meaningful upgrade paths

#### Weapon Types:

1. **Laser Cannon** (Starting weapon)
   - High fire rate, low damage
   - Straight-line projectiles
   - Upgrades: Increased damage, faster projectiles, multi-shot

2. **Plasma Gun** (Unlocked at level 3)
   - Medium fire rate, medium damage
   - Slightly slower projectiles with area effect
   - Upgrades: Larger blast radius, piercing shots, chain lightning

3. **Missile Launcher** (Unlocked at level 7)
   - Low fire rate, high damage
   - Homing projectiles (when upgraded)
   - Upgrades: Homing capability, cluster bombs, increased blast radius

#### Weapon Mechanics:

- Active weapon switching with number keys (1, 2, 3)
- Visual ammunition/energy indicators
- Weapon overheating mechanics to prevent spam
- Upgrade trees with meaningful choices

**Acceptance Criteria**:

- Each weapon feels distinct and useful in different situations
- Upgrade progression provides clear power increases
- Weapon switching is smooth and responsive

### 3. Enemy System

**Objective**: Create varied and challenging opposition

#### Enemy Types:

1. **Scout** (Basic enemy)
   - Fast movement, low health (1-2 hits)
   - Simple movement patterns (straight lines, basic curves)
   - No weapons, collision damage only
   - Spawns frequently in early waves

2. **Fighter** (Standard enemy)
   - Medium speed and health (3-4 hits)
   - Shoots basic projectiles at player
   - More complex movement (formation flying, evasion)
   - Primary enemy type in mid-game

3. **Bomber** (Heavy enemy)
   - Slow movement, high health (6-8 hits)
   - Drops explosive bombs in player's path
   - Predictable movement patterns
   - Appears in later waves, fewer numbers

4. **Boss Enemies** (Special encounters)
   - Large sprites with multiple hit zones
   - 50-100+ health with multiple attack phases
   - Complex attack patterns and movement
   - Appear every 5-10 waves

#### Enemy Behaviors:

- Formation flying for groups
- Basic AI targeting and prediction
- Difficulty scaling with wave progression
- Special spawn patterns and timing

**Acceptance Criteria**:

- Each enemy type requires different strategies to defeat
- Enemy difficulty scales appropriately with player progression
- Boss encounters feel epic and challenging

### 4. Power-Up System

**Objective**: Provide temporary advantages and permanent progression

#### Temporary Power-ups (Duration: 10-15 seconds):

- **Shield Boost**: Extra layer of protection
- **Rapid Fire**: Increased fire rate for all weapons
- **Invincibility**: Temporary immunity to damage
- **Multi-Shot**: Additional projectiles for current weapon

#### Permanent Power-ups:

- **Weapon Upgrades**: Enhance current weapons
- **Hull Reinforcement**: Increase maximum health
- **Engine Boost**: Improve movement speed
- **Shield Generator**: Add rechargeable shields

#### Drop Mechanics:

- Random drops from destroyed enemies (15% chance)
- Guaranteed drops from boss enemies
- Visual attraction effect (magnetic collection)
- Clear visual distinction between temporary and permanent

**Acceptance Criteria**:

- Power-ups provide meaningful but balanced advantages
- Drop rates feel fair and rewarding
- Visual feedback clearly indicates power-up effects

### 5. Player Progression System

**Objective**: Provide long-term motivation and character growth

#### Experience and Leveling:

- Gain XP from destroying enemies (Scout: 10 XP, Fighter: 25 XP, Bomber: 50 XP, Boss: 200+ XP)
- Level progression with increasing XP requirements
- Each level provides upgrade points to spend

#### Upgrade Categories:

1. **Weapons**: Damage, fire rate, special effects
2. **Defense**: Hull strength, shield capacity, regeneration
3. **Mobility**: Speed, acceleration, maneuverability
4. **Special**: Weapon switching speed, power-up duration, XP multiplier

#### Progression Persistence:

- All progression saved to localStorage
- High scores and achievements tracked
- Unlock new weapons and abilities at specific levels

**Acceptance Criteria**:

- Progression feels meaningful and impactful
- Player can see clear improvement over time
- Persistent saves work reliably across sessions

### 6. Wave System & Difficulty Scaling

**Objective**: Provide escalating challenge and varied gameplay

#### Wave Structure:

- Waves 1-5: Tutorial waves with basic enemies
- Waves 6-15: Mixed enemy types, increasing numbers
- Wave 16+: Boss encounters every 5 waves
- Endless mode with continuous difficulty scaling

#### Difficulty Scaling:

- Enemy health increases by 10% every 3 waves
- Enemy speed increases by 5% every 5 waves
- More complex enemy formations in later waves
- Introduction of new enemy types at specific wave thresholds

**Acceptance Criteria**:

- Difficulty curve feels natural and challenging
- Players can survive longer as they improve
- Wave variety keeps gameplay engaging

## Technical Requirements

### Core Technology Stack:

- **Framework**: Phaser 3.70+ (latest stable)
- **Language**: ES6+ JavaScript with modules
- **Build Tool**: Vite for development and production builds
- **Architecture**: bitECS (Entity Component System) with Phaser integration
- **Code Quality**: ESLint for linting, Prettier for code formatting
- **Testing**: Vitest for unit testing
- **Logging**: Custom Logger system with environment-based debug modes
- **Configuration**: .env files for environment variables
- **Audio**: Web Audio API via Phaser with spatial audio support
- **Storage**: localStorage for persistence
- **Graphics**: Development phase uses colored rectangles, production will use PNG sprites

### Development Architecture:

- **bitECS**: High-performance Entity Component System for game logic
- **Components**: Data-oriented component definitions (Position, Velocity, Health, etc.)
- **Systems**: Update logic that operates on component data with queries
- **Phaser Integration**: Sprites managed via sprite mapping, scene updates drive ECS pipeline
- **Development Graphics**: Simple colored rectangles and shapes for rapid prototyping
- **Logger Integration**: Environment-aware debug logging with scoped loggers
- **Code Quality Standards**: ESLint rules for consistent code style and error prevention
- **Automated Formatting**: Prettier integration for consistent code formatting
- **Test-Driven Development**: Unit testing for ECS systems and core utilities

### Performance Requirements:

- Maintain 60fps on modern browsers
- Handle 50+ entities simultaneously
- Fast loading times (<3 seconds initial load)
- Responsive design for multiple screen sizes
- Object pooling for projectiles and effects
- Vite's HMR for rapid development iteration

### Browser Compatibility:

- Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- Mobile browser support (iOS Safari, Chrome Mobile)
- WebGL fallback to Canvas if needed

## User Interface Design

### Main Menu:

- Start Game button
- High Scores display
- Settings (audio, controls, graphics)
- Help/Instructions screen

### In-Game HUD:

- Health/Shield indicators
- Current weapon and ammo display
- Score and wave counter
- XP bar and level indicator
- Mini-map (optional, for larger levels)

### Game Over Screen:

- Final score and statistics
- High score comparison
- Restart and main menu options
- Social sharing capabilities (optional)

## Audio Requirements

### Audio Technology:

- **Phaser Web Audio API**: Automatic fallback to HTML5 Audio
- **Spatial Audio**: 3D positioning for immersive sound effects
- **Audio Sprites**: Combine multiple SFX into single files for efficiency
- **Format Strategy**: OGG Vorbis primary, MP3 fallback for compatibility
- **File Size Targets**: SFX <100KB each, Music 2-4MB compressed

### Sound Effects:

- Weapon firing sounds (distinct per weapon type)
- Enemy destruction explosions with spatial positioning
- Power-up collection sounds
- UI interaction sounds
- Player damage/shield hit sounds

### Music:

- Main menu background music (looping)
- Dynamic in-game combat music with intensity scaling
- Boss encounter music (more intense)
- Game over music
- Volume controls for music and SFX separately

## Implementation Phases

### Phase 1: Foundation & Setup — COMPLETED ✅

- **Vite + Phaser Project Setup**: ✅ Initialized with Phaser Vite template
- **Code Quality Setup**: ✅ ESLint, Prettier, and Vitest configured
- **Environment Configuration**: ✅ .env files and environment variables set up
- **Logger System**: ✅ Debug-aware logging system implemented
- **bitECS Setup**: ✅ bitECS installed, world created, components and systems defined
- **Development Graphics**: ✅ Colored rectangle placeholders for all game objects
- **Player Entity**: ✅ Blue 64x64px rectangle with basic movement (BaseEntity during transition)

### Phase 2: Core ECS & Gameplay — COMPLETED ✅

- **ECS Components**: ✅ Health, Weapon, Movement, and Collision component definitions
- **Enemy Entities**: ✅ Red rectangles with AI patterns and object pooling
- **Weapon System**: ✅ Projectile shooting system with ECS integration
- **Collision System**: ✅ Damage and destruction mechanics with ECS bridge
- **Wave Spawning**: ✅ Enemy wave generation with formation flying

### Phase 3: Game Systems & Progression — PARTIALLY COMPLETED 🔄

- **Power-up System**: ✅ Green/purple colored shapes with effects
- **XP and Leveling**: ✅ Progression system with localStorage persistence
- **Weapon Upgrades**: ✅ Enhanced firing patterns and damage
- **Audio Integration**: ✅ Web Audio API with spatial positioning
- **UI System**: ✅ Text-based HUD and menus

### Phase 4: Current Development — IN PROGRESS 🔄

- **Performance Optimization**: Object pooling and efficient collision detection (no performance tests)
- **Mobile Compatibility**: Touch controls and responsive design (manual testing only)
- **Audio Polish**: Dynamic music and complete SFX implementation
- **Gameplay Balance**: Difficulty curves and progression tuning (manual balancing)
- **Debug Tools**: Visual debugging overlays and performance monitoring
- **Code Quality**: ESLint compliance and Prettier formatting (no test coverage requirements)

### Phase 5: Production Preparation — PLANNED 📋

- **Asset Pipeline**: Prepare for transition from dev graphics to final assets
- **Build Optimization**: Production builds with asset optimization
- **SVG Integration**: Implement SVG loading for scalable UI elements
- **Cross-browser Testing**: Ensure compatibility across target browsers
- **Documentation**: Complete technical and user documentation

### Phase 6: Enhancement & Polish — FUTURE 🚀

- **Final Graphics Integration**: Replace placeholder graphics with production assets
- **Advanced Audio**: Implement audio sprites and advanced spatial effects
- **Achievement System**: Player accomplishments and unlocks
- **Performance Profiling**: Advanced optimization and monitoring
- **Deployment**: Production deployment and distribution setup

## Success Metrics

### Player Engagement:

- Average session length: 10+ minutes
- Return rate: 40% of players return within 24 hours
- Wave progression: 50% of players reach wave 10+

### Technical Performance:

- 60fps maintained on target hardware
- Load time under 3 seconds
- Zero critical bugs in core gameplay loop
- <5% crash rate across supported browsers

### Feature Adoption:

- 80% of players try all weapon types
- 60% of players reach level 5+
- 90% of players collect power-ups when available

## Risk Assessment

### Technical Risks:

- **Performance degradation**: Mitigate with object pooling and efficient collision detection
- **Browser compatibility**: Test across multiple browsers, provide WebGL fallbacks
- **Mobile performance**: Optimize assets and rendering for mobile devices

### Design Risks:

- **Difficulty balancing**: Implement extensive playtesting and adjustable difficulty
- **Progression pacing**: Monitor player data and adjust XP/upgrade curves
- **Repetitive gameplay**: Ensure varied enemy patterns and boss encounters

### Development Risks:

- **Scope creep**: Maintain focus on core features first
- **Timeline overrun**: Prioritize MVP features, plan enhancement phases
- **Asset availability**: Identify art and audio asset sources early

## Conclusion

This PRD outlines a comprehensive space shooter game that combines classic arcade action with modern progression mechanics. The phased development approach ensures steady progress while maintaining flexibility for improvements and enhancements based on playtesting feedback.

The game's success will depend on tight controls, balanced difficulty progression, and meaningful upgrade systems that keep players engaged for multiple sessions. Regular playtesting and iteration will be crucial for achieving the optimal gameplay experience.

## bitECS Implementation Status

### Overview
Complete migration from BaseEntity architecture to bitECS for better performance and data-oriented design.

**Current Progress**: Core enemy implementation complete and validated. Enemy entities fully managed by bitECS with object pooling, AI systems, and Phaser integration. Player and projectiles remain in BaseEntity during transition phase.

### Phase 1: Infrastructure — COMPLETED ✅

**bitECS Setup**
- bitECS dependency installed and configured
- ECS directory structure established: `src/ecs/` with components, systems, entities, and world management
- World management via `src/ecs/world.js` with sprite mapping and time synchronization

**Component Definitions**
Core components implemented:
- Position, Velocity, Health, Weapon, Render, Physics, AI
- Tag components: Player, Enemy, Projectile, PowerUp

```js
// Example components
export const Position = defineComponent({ x: Types.f32, y: Types.f32 });
export const Health = defineComponent({ current: Types.i32, max: Types.i32 });
export const Enemy = defineComponent(); // Tag component
```

### Phase 2: Core Systems — COMPLETED ✅

**System Pipeline**
- MovementSystem: Position updates based on Velocity and delta time
- RenderSystem: Synchronizes sprites from Position/Render via sprite mapping
- WeaponSystem: Handles cooldowns and weapon event emission
- AISystem: 6 AI patterns (idle, chase, patrol, flee, circle, zigzag)
- TimeSystem: Time management and event lifecycle

**Query Management**
- Centralized queries in `src/ecs/systems/queries.js`
- Pipeline configurations: production, debug, and test modes
- Performance monitoring and statistics

### Phase 3: Enemy Integration — COMPLETED ✅

**Enemy Implementation**
- `createEnemy.js`: Factory for scout/fighter/bomber with component assignment
- Object pooling: 20 entities per enemy type with deactivate/reactivate lifecycle
- EnemySpawnSystem integration with formation flying and wave management
- Collision bridge: ECS enemies interact with BaseEntity projectiles and player

**Validation Results**
1. ✅ ECS architecture compliance verified
2. ✅ Object pooling implementation with offscreen entity management
3. ✅ Component integration with configurable enemy types
4. ✅ Entity lifecycle management (deactivate/reactivate/isActive)
5. ✅ AI system integration with player targeting
6. ✅ Phaser integration via DevShapes and sprite mapping
7. ✅ Performance optimizations with preallocated pools

### Phase 4: Current Work — IN PROGRESS 🔄

**Projectile System**
- ECS projectile path implemented with `ProjectileData` component
- `createProjectile` entity factory and `projectileSystem` processing
- Pipeline integration: projectileSystem runs after weaponSystem
- Collision handling: ECS projectiles damage ECS enemies and BaseEntity player

**Integration Tasks**
- Wire player firing into ECS projectile creation
- Replace remaining BaseEntity projectile spawns
- Improve projectile targeting and direction inheritance
- Add ECS projectile pooling for performance

### Phase 5: Future Work — PLANNED 📋

**Full ECS Migration**
- Migrate Player entity to bitECS
- Migrate remaining projectile systems to ECS
- Remove BaseEntity collision bridge
- Complete legacy code cleanup

**Performance & Polish**
- ECS-driven collision detection
- Advanced pooling optimizations
- Performance profiling and monitoring
- Complete BaseEntity code removal
