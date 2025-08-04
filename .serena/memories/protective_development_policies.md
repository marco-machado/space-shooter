# Protective Development Policies - Space Shooter Game

## Core Protection Principles

### 1. Never Lint Whole Project Policy
- **FORBIDDEN**: `npm run lint` or `eslint src/` (whole project linting)
- **REQUIRED**: Always use selective linting with specific file targets
- **Safe Usage**: `eslint src/utils/MathUtils.js` (single file only)
- **Rationale**: Prevents automated changes to complex game scenes and ECS systems

### 2. GameScene Protection Policy
**PROTECTED FILES:**
- `src/scenes/GameScene.js` - Critical gameplay scene (NEVER modify for testing)
- `src/scenes/*.js` - All scene files protected from automated modification
- `src/systems/*.js` - ECS systems protected from automated changes
- `src/entities/*.js` - Game entities protected from automated changes

**MANUAL ONLY**: These files require manual code review and testing
**NO AUTO-FIX**: Never use `--fix` flag on protected files

### 3. Testing Boundary Policy
- **NEVER TEST**: Game scenes, ECS systems, or Phaser-dependent code
- **TESTING FORBIDDEN**: Making changes to game files for testing purposes
- **PROTECTED AREAS**: GameScene.js integrity must be maintained
- **MANUAL TESTING**: All gameplay features tested manually, not programmatically

### 4. Development Workflow Protection
- **Selective Operations**: Target specific files/directories only
- **Manual Override**: Developers can skip automated checks when needed
- **Code Quality Gates**: Quality checks must not block critical development
- **Emergency Bypass**: Always provide escape hatches for urgent development

## Safe Commands

### ✅ ALWAYS SAFE
```bash
npm run dev          # Development server
npm run build        # Production build  
npm run preview      # Preview build
npm run test         # Tests utils/ only
npm start            # Development alias
```

### ✅ SAFE (Selective Usage)
```bash
eslint src/utils/MathUtils.js        # Single file linting
eslint src/config/GameConfig.js      # Config file linting
prettier --check src/utils/          # Directory-specific formatting
vitest src/utils/MathUtils.test.js   # Single test file
```

### ❌ FORBIDDEN (Interfere with Game Development)
```bash
npm run lint         # FORBIDDEN: Whole project linting
npm run lint:fix     # FORBIDDEN: Automated fixes project-wide
npm run format       # FORBIDDEN: May format protected game files  
npm run validate     # FORBIDDEN: Runs whole project quality checks
eslint src/          # FORBIDDEN: Whole project linting
eslint src/scenes/   # FORBIDDEN: Protected game scenes
eslint src/systems/  # FORBIDDEN: Protected ECS systems
```

## Protected vs Safe Files

### 🚫 PROTECTED (Manual Changes Only)
- **GameScene.js** - Heart of the game, modifications forbidden
- **All scenes/** - Game scenes protected from automation
- **All systems/** - ECS systems protected from automation  
- **All entities/** - Game entities protected from automation

### ✅ SAFE (Automation Allowed)
- **utils/** - Utility functions (safe for linting/testing)
- **config/** - Configuration files (safe for linting)

## Emergency Bypass

When automated tools interfere with development:
```bash
export SKIP_LINT=true && npm run dev
export SKIP_FORMAT=true && npm run build
npm run dev:unsafe   # Development without quality gates
```

## Why These Policies Exist

1. **GameScene.js Integrity**: The game scene contains complex Phaser interactions that automated tools can break
2. **ECS System Complexity**: Game systems have intricate dependencies that linting can disrupt
3. **Development Velocity**: Automated interference slows down game development
4. **Testing Boundaries**: Game code requires manual testing, not automated unit tests
5. **Code Quality Balance**: Maintain professional standards without blocking development

## Implementation Status

- ✅ CLAUDE.md updated with protective policies
- ✅ README.md updated with safe development workflow
- ✅ Available Scripts section updated with protective usage guidelines
- ✅ Critical warning section added to README.md
- ✅ Memory saved for future reference

These policies ensure that automated tools enhance development rather than interfere with critical game functionality.