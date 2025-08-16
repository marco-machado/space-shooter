# Space Shooter Game - Product Requirements Document

## Game Overview

### Vision Statement

Create an engaging top-down space shooter game using Phaser.js 3.x with Vite build tooling that combines classic arcade action with modern progression mechanics. The game will feature multiple weapon types, diverse enemy encounters, power-up systems, and persistent player progression.

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
- Visual feedback for movement
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
- Weapon overheating mechanics:
  - Each shot generates heat (+5 heat)
  - Weapons passively cool at 5 heat per second when not firing
  - Reaching 100 heat causes an overheat lockout until cooled below 50
- Upgrade trees with meaningful choices

**Acceptance Criteria**:

- Each weapon feels distinct and useful in different situations
- Upgrade progression provides clear power increases
- Weapon switching is smooth and responsive
- Overheating prevents continuous firing and is verified by tests

### 3. Enemy System

**Objective**: Create varied and challenging opposition

#### Enemy Types:

1. **Scout** (Basic enemy)
   - Fast movement, low health (1 hit)
   - Simple movement patterns (straight lines, top to bottom)
   - No weapons, collision damage only
   - Spawns frequently in early waves

2. **Fighter** (Standard enemy)
   - Medium speed and health (3 hits)
   - Shoots basic projectiles at player
   - More complex movement (formation flying)
   - Primary enemy type in mid-game

3. **Bomber** (Heavy enemy)
   - Slow movement, high health (6 hits)
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

#### Temporary Power-ups (Duration: 15 seconds):

- **Shield Boost**: Extra layer of protection; dissipates after absorbing one hit or when 15 seconds pass
- **Rapid Fire**: Increased fire rate for all weapons; effect wears off after 15 seconds
- **Damage Boost**: Doubles weapon damage; expires after 15 seconds
- **Invulnerability**: Player cannot take damage; invincibility ends when the timer runs out

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

### 5. Difficulty Scaling

**Objective**: Provide escalating challenge and varied gameplay

#### Difficulty Scaling:

- Enemy health increases by 10% every 3 levels
- Enemy speed increases by 5% every 5 levels
- More complex enemy formations in later levels
- Introduction of new enemy types at specific thresholds

**Acceptance Criteria**:

- Difficulty curve feels natural and challenging
- Players can survive longer as they improve
- Variety keeps gameplay engaging

## Technical Requirements

### Core Technology Stack:

- **Framework**: Phaser 3.70+ (latest stable)
- **Language**: ES6+ JavaScript with modules
- **Build Tool**: Vite for development and production builds
- **Architecture**: Phaser scene-based
- **Code Quality**: ESLint for linting, Prettier for code formatting
- **Testing**: Vitest for unit testing
- **Logging**: Custom Logger system with environment-based debug modes
- **Configuration**: .env files for environment variables
- **Audio**: Web Audio API via Phaser with spatial audio support
- **Storage**: localStorage for persistence
- **Graphics**: Colored shapes and sizes

### Development Architecture:

- **Logger Integration**: Environment-aware debug logging with scoped loggers
- **Code Quality Standards**: ESLint rules for consistent code style and error prevention
- **Automated Formatting**: Prettier integration for consistent code formatting
- **Test-Driven Development**: Unit testing for game systems and core utilities

### Performance Requirements:

- Maintain 60fps on modern browsers
- Handle 50+ entities simultaneously
- Fast loading times (<3 seconds initial load)
- Responsive design for multiple screen sizes
- Vite's HMR for rapid development iteration

### Browser Compatibility:

- Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- Mobile browser support (iOS Safari, Chrome Mobile)
- WebGL fallback to Canvas if needed

## User Interface Design

### Main Menu:

- Start Game button
- High Scores display
- Help/Instructions screen

### In-Game HUD:

- Health/Shield indicators
- Current weapon and ammo display
- Score display
- XP bar and level indicator

### Game Over Screen:

- Final score and statistics
- High score comparison
- Restart and main menu options

## Audio Requirements

### Audio Technology:

- **Phaser Web Audio API**: Automatic fallback to HTML5 Audio
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
