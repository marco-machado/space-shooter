# Space Shooter Troubleshooting Guide

This guide provides solutions for common issues encountered during development and deployment of the Space Shooter game, including architectural enhancements like auto-initializing Logger, flexible BaseEntity system, and comprehensive testing setup.

## Table of Contents

- [Setup Issues](#setup-issues)
- [Auto-Initializing Logger Issues](#auto-initializing-logger-issues)
- [Flexible BaseEntity Issues](#flexible-baseentity-issues)
- [Input Adapter Issues](#input-adapter-issues)
- [Testing Setup Issues](#testing-setup-issues)
- [Development Server Issues](#development-server-issues)
- [Environment Configuration Issues](#environment-configuration-issues)
- [Code Quality Issues](#code-quality-issues)
- [Performance Issues](#performance-issues)
- [Gameplay Issues](#gameplay-issues)
- [Build and Deployment Issues](#build-and-deployment-issues)
- [Browser Compatibility Issues](#browser-compatibility-issues)

---

## Setup Issues

### Problem: `npm install` fails with dependency errors

**Symptoms:**

- Command fails with `ERESOLVE unable to resolve dependency tree`
- Missing peer dependencies warnings
- Network timeout errors

**Solutions:**

```bash
# Solution 1: Clear npm cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Solution 2: Use legacy peer deps (if peer dependency conflicts)
npm install --legacy-peer-deps

# Solution 3: Check Node.js version (requires 18+)
node --version
# If < 18, update Node.js

# Solution 4: Network issues - try different registry
npm install --registry https://registry.npmjs.org/
```

**Prevention:**

- Use Node.js 18+ for best compatibility
- Keep npm updated: `npm install -g npm@latest`
- Use consistent Node.js version across team (consider `.nvmrc`)

### Problem: Missing `.env` file causes crashes

**Symptoms:**

- Game crashes on startup
- `Environment.DEBUG_MODE is undefined` errors
- Logger initialization fails

**Solutions:**

```bash
# Copy environment template
cp .env.example .env

# Verify required variables are set
cat .env

# Should contain:
# VITE_DEBUG_MODE=true
# VITE_LOG_LEVEL=debug
# VITE_PHYSICS_DEBUG=true
# VITE_AUDIO_ENABLED=true
# etc.
```

**Prevention:**

- Always copy `.env.example` to `.env` after cloning
- Add `.env` creation to setup documentation
- Consider environment validation in startup code

### Problem: Phaser.js import errors

**Symptoms:**

- `Cannot resolve module 'phaser'` errors
- Game window doesn't appear
- Console shows Phaser-related errors

**Solutions:**

```bash
# Verify Phaser installation
npm list phaser

# If not installed or wrong version
npm install phaser@^3.90.0

# Check import syntax in main.js
# Should be: import Phaser from 'phaser';
# Not: import * as Phaser from 'phaser';
```

---

## Auto-Initializing Logger Issues

### Problem: Logger messages not appearing in console

**Symptoms:**

- No debug messages despite `VITE_DEBUG_MODE=true`
- Logger appears to work but produces no output
- Console remains empty during game execution

**Solutions:**

```javascript
// Solution 1: Verify auto-initialization is working
import Logger from '@/utils/Logger.js';

// Check initialization status
console.log('Logger initialized:', Logger.isInitialized); // Should be false initially
Logger.debug('Test message'); // Should auto-initialize
console.log('Logger initialized:', Logger.isInitialized); // Should be true now

// Solution 2: Verify environment variables
Logger.debug('Debug mode:', Logger.debugMode);
Logger.debug('Log level:', Logger.logLevel);

// Solution 3: Force re-initialization if needed
Logger.isInitialized = false;
Logger.debug('Force re-initialization test');
```

**Environment Troubleshooting:**

```bash
# Check environment variables in .env file
grep VITE_DEBUG_MODE .env
grep VITE_LOG_LEVEL .env

# Verify Vite is loading environment variables
# In browser console:
console.log(import.meta.env.VITE_DEBUG_MODE);
console.log(import.meta.env.VITE_LOG_LEVEL);
```

**Prevention:**

- Use `Logger.error()` for testing - it should always appear regardless of settings
- Check that `.env` file contains `VITE_DEBUG_MODE=true`
- Verify `VITE_LOG_LEVEL=debug` for maximum verbosity

### Problem: Logger performance methods not working

**Symptoms:**

- `Logger.time()` and `Logger.timeEnd()` produce no output
- `Logger.group()` and `Logger.table()` not working
- Only basic logging methods function

**Solutions:**

```javascript
// Performance methods only work in debug mode
// Verify debug mode is enabled:
if (!Logger.debugMode) {
  console.warn('Performance methods require VITE_DEBUG_MODE=true');
}

// Test performance methods:
Logger.time('test-operation');
// ... some operation ...
Logger.timeEnd('test-operation'); // Should output timing

// Test grouping:
Logger.group('Test Group');
Logger.info('Grouped message');
Logger.groupEnd();

// Test table display:
Logger.table([
  { entity: 'Player', health: 100 },
  { entity: 'Enemy', health: 50 }
]);
```

### Problem: Environment detection failing

**Symptoms:**

- Logger defaults to production mode unexpectedly
- Environment variables not being read correctly
- Fallback behavior not working as expected

**Solutions:**

```javascript
// Manual environment debugging:
Logger._getEnvVariable = function(name) {
  console.log('Checking env var:', name);
  
  // Check import.meta.env first
  if (import.meta?.env?.[name]) {
    console.log('Found in import.meta.env:', import.meta.env[name]);
    return import.meta.env[name];
  }
  
  // Check process.env fallback
  if (process?.env?.[name]) {
    console.log('Found in process.env:', process.env[name]);
    return process.env[name];
  }
  
  console.log('Environment variable not found:', name);
  return undefined;
};

// Force re-initialization with debug
Logger.isInitialized = false;
Logger.debug('Environment test');
```

---

## Flexible BaseEntity Issues

### Problem: GameObject creation failures

**Symptoms:**

- Entities default to error rectangles (red color)
- `"GameObject creation failed"` error messages
- Unexpected GameObject types

**Solutions:**

```javascript
// Debug GameObject creation:
const entity = new BaseEntity(scene, {
  type: 'sprite', 
  texture: 'missing-texture' // This will fail
});

console.log('GameObject type:', entity.getGameObjectType()); // Should be 'rectangle' (fallback)
console.log('GameObject color:', entity.gameObject.fillColor); // Should be red (0xff0000)

// Check texture loading:
console.log('Texture loaded:', scene.textures.exists('missing-texture'));

// Use proper texture loading:
scene.load.image('player-sprite', 'path/to/sprite.png');
scene.load.start();
```

**Common Causes:**

1. **Missing Textures**: Sprite/image creation fails when texture doesn't exist
2. **Invalid Configuration**: Incorrect parameters passed to GameObject creation
3. **Scene Context Issues**: Scene not properly initialized when creating entities

**Prevention:**

- Always verify textures are loaded before creating sprite entities
- Use development rectangles first, then upgrade to sprites
- Check console for GameObject creation error messages

### Problem: Runtime type switching not working

**Symptoms:**

- `changeGameObjectType()` doesn't change visual appearance
- Position not preserved during type changes
- Components lost during type switching

**Solutions:**

```javascript
// Debug type switching:
const entity = new BaseEntity(scene, { type: 'rectangle', x: 100, y: 100 });
console.log('Initial type:', entity.getGameObjectType());
console.log('Initial position:', entity.x, entity.y);

// Ensure new texture exists before switching:
if (scene.textures.exists('new-sprite')) {
  entity.changeGameObjectType('sprite', { 
    texture: 'new-sprite',
    frame: 0 
  });
  
  console.log('New type:', entity.getGameObjectType());
  console.log('Preserved position:', entity.x, entity.y);
} else {
  console.error('Texture "new-sprite" not loaded');
}

// Verify components are preserved:
const health = entity.getComponent(HealthComponent);
console.log('Component preserved:', !!health);
```

### Problem: Null-safe operations failing

**Symptoms:**

- Property access errors on logical entities (type: null)
- Methods called on null GameObjects causing crashes
- Position updates not working on logical entities

**Solutions:**

```javascript
// Test null-safe operations:
const logicalEntity = new BaseEntity(scene, { 
  type: null, 
  x: 200, 
  y: 300,
  name: 'test-logical' 
});

// These should all work safely:
console.log('Position:', logicalEntity.x, logicalEntity.y); // Should be 200, 300
logicalEntity.x = 250;
console.log('Updated position:', logicalEntity.x); // Should be 250

// These should not crash:
logicalEntity.enablePhysics('dynamic'); // Should be ignored safely
logicalEntity.setDepth(10); // Should be ignored safely

// Verify logical position tracking:
console.log('Logical position:', logicalEntity.logicalPosition);
```

---

## Input Adapter Issues

### Problem: KeyboardInputAdapter not responding to input

**Symptoms:**

- Key presses not triggering movement
- No events emitted to EventBus
- Player character doesn't respond to WASD/Arrow keys

**Solutions:**

```javascript
// Debug adapter activation:
import KeyboardInputAdapter from '@/adapters/KeyboardInputAdapter.js';
import { getEventBus } from '@/event-bus/EventBus.js';
import { EventTypes } from '@/event-bus/EventTypes.js';

// Verify adapter is activated:
const adapter = new KeyboardInputAdapter(scene);
console.log('Adapter active before:', adapter.active);
adapter.activate();
console.log('Adapter active after:', adapter.active);

// Test event emission:
const eventBus = getEventBus();
eventBus.on(EventTypes.PLAYER_INPUT, (event) => {
  console.log('Player input received:', event);
});

// Check Phaser input setup:
console.log('Scene input keyboard:', !!scene.input.keyboard);
console.log('Scene input enabled:', scene.input.enabled);
```

**Common Causes:**

1. **Adapter Not Activated**: Forgot to call `adapter.activate()`
2. **EventBus Not Connected**: Missing event listeners
3. **Scene Input Disabled**: Phaser input system not working
4. **Key Event Conflicts**: Other systems consuming key events

### Problem: Movement not normalized properly

**Symptoms:**

- Diagonal movement faster than cardinal directions
- Player speed inconsistent
- Movement direction calculation incorrect

**Solutions:**

```javascript
// Debug movement calculation:
const adapter = new KeyboardInputAdapter(scene);

// Monitor input state:
setInterval(() => {
  console.log('Input state:', {
    keys: Array.from(adapter.inputState.keys),
    movement: adapter.inputState.movement,
    weaponFiring: adapter.inputState.weaponFiring
  });
}, 1000);

// Verify normalization:
// Press W+D (diagonal) - should output movement: { x: 0.707, y: -0.707 }
// Press W only - should output movement: { x: 0, y: -1 }
```

### Problem: EventBus integration issues

**Symptoms:**

- Events not received by game systems
- Multiple event listeners not working
- Event data structure incorrect

**Solutions:**

```javascript
// Debug EventBus singleton:
const eventBus1 = getEventBus();
const eventBus2 = getEventBus();
console.log('EventBus singleton:', eventBus1 === eventBus2); // Should be true

// Test event emission and listening:
eventBus1.on(EventTypes.PLAYER_INPUT, (event) => {
  console.log('Listener 1:', event.action);
});

eventBus1.on(EventTypes.PLAYER_INPUT, (event) => {
  console.log('Listener 2:', event.action);
});

// Manually emit test event:
eventBus1.emit(EventTypes.PLAYER_INPUT, {
  action: 'test',
  timestamp: performance.now()
});

// Should see both listeners fire
```

---

## Testing Setup Issues

### Problem: Tests failing with import errors

**Symptoms:**

- `Cannot resolve module` errors in tests
- Path alias `@/` not working in test files
- Vitest configuration issues

**Solutions:**

```bash
# Verify vitest configuration:
cat vitest.config.js

# Should contain path alias:
# resolve: {
#   alias: {
#     '@': path.resolve(__dirname, './src'),
#   },
# },

# Check test file imports:
# Use: import Logger from '@/utils/Logger.js';
# Not: import Logger from '../../../src/utils/Logger.js';

# Run tests with verbose output:
npm run test -- --reporter=verbose
```

### Problem: Phaser mocks not working

**Symptoms:**

- Tests crash with Phaser-related errors
- Mock objects behaving unexpectedly
- `MockScene` or `MockRectangle` not found

**Solutions:**

```javascript
// Verify mock imports in test files:
import { MockScene, MockRectangle } from '../__mocks__/PhaserMocks.js';

// Test mock functionality:
const mockScene = new MockScene();
console.log('Mock scene add methods:', Object.keys(mockScene.add));

// Create test entity with mocks:
const entity = new BaseEntity(mockScene, {
  type: 'rectangle',
  x: 100, y: 100
});

console.log('Mock GameObject created:', !!entity.gameObject);
console.log('GameObject type:', entity.gameObject.constructor.name);
```

### Problem: Auto-initializing Logger tests failing

**Symptoms:**

- Logger initialization state not resetting between tests
- Environment variable mocking not working
- Performance method tests inconsistent

**Solutions:**

```javascript
// Proper test setup in beforeEach:
beforeEach(() => {
  // Reset Logger state for fresh testing
  Logger.isInitialized = false;
  
  // Clear all mocks
  vi.clearAllMocks();
  
  // Reset environment variables
  global.importMeta = {
    env: {
      VITE_DEBUG_MODE: 'true',
      VITE_LOG_LEVEL: 'debug'
    }
  };
});

// Test auto-initialization properly:
it('should auto-initialize on first call', () => {
  expect(Logger.isInitialized).toBe(false);
  Logger.error('test'); // Use error as it always logs
  expect(Logger.isInitialized).toBe(true);
});
```

### Problem: Test execution performance

**Symptoms:**

- Tests take longer than 5 seconds to complete
- Memory usage climbing during test runs
- Test suite hanging or timing out

**Solutions:**

```javascript
// Optimize test cleanup:
afterEach(() => {
  vi.clearAllMocks();
  
  // Clean up large objects
  if (testEntities) {
    testEntities.forEach(entity => entity.destroy());
    testEntities.length = 0;
  }
  
  // Reset global state
  Logger.isInitialized = false;
});

// Use focused tests for debugging:
it.only('should test specific behavior', () => {
  // Only this test will run
});

// Skip problematic tests temporarily:
it.skip('should test complex behavior', () => {
  // This test will be skipped
});
```

---

## Development Server Issues

### Problem: Vite dev server won't start

**Symptoms:**

- `npm run dev` fails to start
- Port already in use errors
- Blank page after starting server

**Solutions:**

```bash
# Solution 1: Check if port 5173 is in use
netstat -an | grep 5173
# Or on macOS/Linux:
lsof -i :5173

# Kill process using the port
npx kill-port 5173

# Solution 2: Use different port
npm run dev -- --port 3000

# Solution 3: Check for firewall/antivirus blocking
# Temporarily disable and test

# Solution 4: Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

**Prevention:**

- Always stop dev server before shutting down terminal
- Use `Ctrl+C` to properly stop server
- Consider using different port in package.json if 5173 conflicts

### Problem: Hot Module Replacement (HMR) not working

**Symptoms:**

- Changes don't reflect in browser
- Need to manually refresh page
- Console shows HMR connection errors

**Solutions:**

```bash
# Solution 1: Check browser console for WebSocket errors
# If WSS connection fails, try HTTP:
# Edit vite.config.js:
export default {
  server: {
    hmr: {
      protocol: 'ws'
    }
  }
}

# Solution 2: Disable browser cache
# Open DevTools > Network > Disable cache

# Solution 3: Check file watchers (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Solution 4: Restart dev server
# Stop with Ctrl+C, then npm run dev
```

### Problem: Game shows blank/black screen

**Symptoms:**

- Vite server runs but game doesn't appear
- No console errors
- HTML loads but canvas is empty

**Solutions:**

```bash
# Solution 1: Check browser console for errors
# Press F12, look for JavaScript errors

# Solution 2: Verify environment variables
cat .env
# Ensure VITE_DEBUG_MODE=true for detailed errors

# Solution 3: Check main.js initialization
# Look for error in SpaceShooterGame.init()

# Solution 4: Verify canvas element exists
# Check index.html has div with id="game-container"

# Solution 5: Check for asset loading issues
# Verify BootScene -> PreloaderScene -> GameScene flow
```

**Debugging Steps:**

1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Verify game canvas is created in Elements tab
5. Check Application tab for localStorage data

---

## Environment Configuration Issues

### Problem: Logger messages not appearing

**Symptoms:**

- `Logger.debug()` calls don't show output
- Expected log messages missing
- Silent failures in development

**Solutions:**

```bash
# Solution 1: Check environment variables
echo $VITE_DEBUG_MODE  # Should be 'true'
echo $VITE_LOG_LEVEL   # Should be 'debug' or 'info'

# Solution 2: Verify .env file
cat .env | grep DEBUG
# Should show: VITE_DEBUG_MODE=true

# Solution 3: Check Logger initialization
# Ensure Logger.init() is called before any logging

# Solution 4: Test Logger directly in console
# In DevTools console:
window.spaceShooterGame.Logger.debug('Test message');

# Solution 5: Check log level hierarchy
# debug < info < warn < error
# If LOG_LEVEL=warn, debug/info won't show
```

**Environment Variable Reference:**

```bash
# Debug Configuration
VITE_DEBUG_MODE=true          # Enable debug features
VITE_LOG_LEVEL=debug          # debug|info|warn|error
VITE_PHYSICS_DEBUG=true       # Show physics bodies
VITE_SHOW_FPS=true           # Show FPS counter
VITE_SHOW_DEBUG_INFO=true    # Show debug overlay

# Game Configuration
VITE_STARTING_LIVES=3         # Player lives
VITE_BASE_SCORE_MULTIPLIER=1.0 # Score multiplier
VITE_AUDIO_ENABLED=true       # Enable audio

# Performance Settings
VITE_MAX_PARTICLES=1000       # Particle limit
VITE_OBJECT_POOL_SIZE=200     # Pool size
```

### Problem: Environment variables not loading

**Symptoms:**

- `import.meta.env.VITE_*` returns undefined
- Default values used instead of configured values
- Environment validation fails

**Solutions:**

```bash
# Solution 1: Check .env file location
# Must be in project root, not src/
ls -la .env

# Solution 2: Verify variable names start with VITE_
# Only VITE_ prefixed variables are available in browser
# Wrong: DEBUG_MODE=true
# Right: VITE_DEBUG_MODE=true

# Solution 3: Restart dev server after .env changes
# Stop server (Ctrl+C) and restart: npm run dev

# Solution 4: Check for syntax errors in .env
# No spaces around = sign
# No quotes needed for simple values
# Example:
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug

# Solution 5: Verify in browser
# Open DevTools console:
console.log(import.meta.env);
```

---

## Code Quality Issues

### Problem: ESLint errors prevent commits

**Symptoms:**

- `npm run lint` shows errors
- Commit hooks fail due to linting issues
- Code style inconsistencies

**Solutions:**

```bash
# Solution 1: Auto-fix common issues
npm run lint:fix

# Solution 2: Format code with Prettier
npm run format

# Solution 3: Run full validation
npm run validate

# Solution 4: Check specific file
npx eslint src/path/to/file.js

# Solution 5: Disable specific rules (if necessary)
/* eslint-disable-next-line rule-name */
problematicCode();
```

**Common ESLint Issues:**

| Error                              | Solution                         |
| ---------------------------------- | -------------------------------- |
| `console.log is not allowed`       | Use `Logger.debug()` instead     |
| `Unexpected var, use let or const` | Replace `var` with `let`/`const` |
| `Missing semicolon`                | Add semicolon or use `--fix`     |
| `Unused variable`                  | Remove or prefix with `_`        |
| `Missing trailing comma`           | Add comma after last item        |

### Problem: Prettier formatting conflicts

**Symptoms:**

- Code keeps getting reformatted
- ESLint and Prettier disagree on formatting
- Inconsistent indentation/spacing

**Solutions:**

```bash
# Solution 1: Use integrated validation
npm run validate  # Runs both lint and format check

# Solution 2: Check Prettier config
cat .prettierrc
# Should match ESLint settings

# Solution 3: Format entire codebase
npm run format

# Solution 4: Set up editor integration
# VS Code: Install Prettier extension
# Configure format on save

# Solution 5: Check ignore files
cat .prettierignore
# Ensure files you want formatted aren't ignored
```

### Problem: Import/export errors

**Symptoms:**

- `Cannot resolve module` errors
- `Unexpected token 'export'` errors
- Module loading failures

**Solutions:**

```bash
# Solution 1: Check file extensions
# Use .js extension in imports:
import Logger from '@/utils/Logger.js';

# Solution 2: Verify export syntax
# Use ES6 modules:
export default ClassName;
export { namedExport };

# Solution 3: Check relative paths
# From src/scenes/GameScene.js:
import Logger from '@/utils/Logger.js';  # Correct
import Logger from '@/utils/Logger.js';   # Wrong

# Solution 4: Verify package.json
# Should have: "type": "module"

# Solution 5: Check circular dependencies
npm ls --depth=0
```

---

## Performance Issues

### Problem: Low frame rate (< 60 FPS)

**Symptoms:**

- Choppy player movement
- Debug overlay shows < 60 FPS
- Game feels sluggish

**Solutions:**

```bash
# Solution 1: Enable performance debugging
# Set in .env:
VITE_SHOW_FPS=true
VITE_SHOW_DEBUG_INFO=true

# Solution 2: Check browser DevTools Performance tab
# Record while playing game
# Look for long-running functions

# Solution 3: Optimize update loops
# Ensure efficient entity/component updates
# Use object pooling for frequently created objects

# Solution 4: Check for memory leaks
# Use DevTools Memory tab
# Take heap snapshots before/after gameplay

# Solution 5: Disable physics debug
VITE_PHYSICS_DEBUG=false
```

**Performance Optimization Checklist (Sprint 2 Status):**

- [x] Object pooling for bullets/particles (100 projectiles per pool, 0% misses)
- [x] Efficient collision detection (64px spatial grid system)
- [x] Minimal DOM manipulation (Canvas-based rendering)
- [x] Proper entity cleanup (ECS component management)
- [x] Optimized render calls (Phaser rendering optimization)
- [ ] Texture atlas usage (planned for Sprint 3)

**Current Performance Metrics:**

- Frame Rate: 125 FPS sustained (208% of 60 FPS target)
- Memory Usage: 33-45MB (well under 100MB target)
- BaseEntity Management: 258 entities handled efficiently

### Problem: Memory usage keeps increasing

**Symptoms:**

- RAM usage grows during gameplay
- Browser becomes slow/unresponsive
- Game crashes after extended play

**Solutions:**

```bash
# Solution 1: Check entity cleanup
# Ensure entities are properly destroyed
entity.destroy(); // Should clean up components

# Solution 2: Verify event listener removal
# Remove listeners in scene shutdown:
this.input.keyboard.removeAllListeners();

# Solution 3: Check texture/audio cleanup
# Destroy unused assets between scenes

# Solution 4: Monitor in DevTools
# Memory tab > Take heap snapshot
# Compare before/after gameplay

# Solution 5: Implement object pooling
# Reuse objects instead of creating new ones
```

### Problem: Input lag or unresponsive controls

**Symptoms:**

- Delay between key press and movement
- Inconsistent input response
- Controls feel sluggish

**Solutions:**

```bash
# Solution 1: Check frame rate
# Low FPS causes input lag
# See frame rate solutions above

# Solution 2: Optimize input handling
# Use key state checking instead of events:
if (this.cursors.left.isDown) {
  // Move left
}

# Solution 3: Verify movement component settings
const movement = player.getComponent(MovementComponent);
movement.maxSpeed = 300; // Higher = faster movement

# Solution 4: Check update frequency
# Ensure consistent delta time handling
player.update(delta / 1000); // Convert to seconds

# Solution 5: Test on different devices
# Compare desktop vs laptop performance
```

---

## Gameplay Issues

### Problem: Player moves through screen boundaries

**Symptoms:**

- Player can move off-screen
- Player disappears at edges
- Collision detection not working

**Solutions:**

```bash
# Solution 1: Check MovementComponent settings
const movement = player.getComponent(MovementComponent);
movement.boundToScreen = true;  // Should be true
movement.screenPadding = 0;     // Adjust if needed

# Solution 2: Verify physics world bounds
this.physics.world.setBounds(0, 0, width, height);
player.body.setCollideWorldBounds(true);

# Solution 3: Check player size settings
player.body.setSize(60, 60); // Collision box
// Should be smaller than visual size for better feel

# Solution 4: Debug collision bounds
# Enable physics debug:
VITE_PHYSICS_DEBUG=true
```

### Problem: Health system not working

**Symptoms:**

- Player health doesn't decrease when taking damage
- Health bar doesn't update
- Player doesn't die at 0 health

**Solutions:**

```javascript
// Solution 1: Check component attachment
const health = player.getComponent(HealthComponent);
if (!health) {
  console.error('Player missing HealthComponent');
}

// Solution 2: Verify damage dealing
health.takeDamage(25);
console.log('Health after damage:', health.currentHealth);

// Solution 3: Check invulnerability
if (health.invulnerable) {
  console.log('Player is invulnerable');
}

// Solution 4: Verify UI update
// In GameScene updateUI():
const healthPercent = health.getHealthPercentage();
this.uiElements.healthBar.width = maxWidth * healthPercent;
```

### Problem: Game state not persisting

**Symptoms:**

- Score resets on refresh
- Progress not saved
- Settings not remembered

**Solutions:**

```javascript
// Solution 1: Use GameStateManager (Sprint 2)
const gameState = new GameStateManager();
gameState.saveGame(); // Automatically saves to localStorage

// Solution 2: Check for localStorage errors
try {
  localStorage.setItem('test', 'value');
} catch (error) {
  console.error('localStorage not available:', error);
}

// Solution 3: Verify save data format
// GameStateManager saves comprehensive game state:
// - score, level, lives, wave
// - weapons unlocked, achievements
// - statistics (kills, accuracy, playtime)

// Solution 4: Manual save testing
const testSave = {
  score: 1000,
  level: 3,
  wave: 5,
  weaponsUnlocked: ['laser', 'plasma'],
  achievements: ['first_kill', 'wave_5'],
};
localStorage.setItem('spaceShooterSave', JSON.stringify(testSave));
```

### Problem: Weapon switching not working

**Symptoms:**

- Number keys (1,2,3) don't switch weapons
- Only default laser weapon available
- Weapon UI shows incorrect weapon

**Solutions:**

```javascript
// Solution 1: Check weapon unlock status
const gameState = scene.gameStateManager;
console.log('Unlocked weapons:', gameState.getUnlockedWeapons());
// Level 3+ required for Plasma, Level 7+ for Missile

// Solution 2: Verify weapon component
const weapon = player.getComponent(WeaponComponent);
console.log('Current weapon:', weapon.weaponType);
console.log('Available weapons:', weapon.availableWeapons);

// Solution 3: Check input handling
// In GameScene.js, ensure weapon keys are set up:
this.weaponKeys = {
  1: this.input.keyboard.addKey('ONE'),
  2: this.input.keyboard.addKey('TWO'),
  3: this.input.keyboard.addKey('THREE'),
};

// Solution 4: Test weapon switching manually
scene.switchWeapon(1); // Should switch to Plasma if unlocked
scene.switchWeapon(2); // Should switch to Missile if unlocked

// Solution 5: Check weapon configuration
// Verify weapon types in WeaponComponent.js:
// laser: unlocked by default
// plasma: unlocked at level 3
// missile: unlocked at level 7
```

### Problem: Enemies not spawning or behaving incorrectly

**Symptoms:**

- No enemies appear on screen
- Enemies don't move or attack
- Wave progression not working

**Solutions:**

```javascript
// Solution 1: Check EnemySpawnSystem
const enemySystem = scene.systems.find(s => s.name === 'EnemySpawnSystem');
console.log('Enemy spawn system active:', !!enemySystem);

// Solution 2: Verify wave configuration
console.log('Current wave:', scene.gameStateManager.currentWave);
console.log('Wave difficulty:', scene.gameStateManager.getWaveDifficulty());

// Solution 3: Check enemy entity creation
// Enemies should have these components:
// - HealthComponent (Scout: 50, Fighter: 100, Bomber: 200)
// - MovementComponent with AI patterns
// - CollisionComponent (layer: 'enemy')
// - WeaponComponent (Fighter only)

// Solution 4: Test enemy creation manually
const testEnemy = new Enemy(scene, 400, 100, 'scout');
console.log('Enemy components:', testEnemy.getAllComponents().length);

// Solution 5: Verify AI patterns
const movement = enemy.getComponent(MovementComponent);
console.log('AI pattern:', movement.aiPattern);
// Should be: straight, curve, formation, chase, circle, or zigzag
```

### Problem: Collision detection not working

**Symptoms:**

- Player passes through enemies
- Projectiles don't hit targets
- No damage when colliding

**Solutions:**

```javascript
// Solution 1: Check CollisionSystem setup
const collisionSystem = scene.systems.find(s => s.name === 'CollisionSystem');
console.log('Collision system grid size:', collisionSystem.gridSize);
// Should be 64px for optimal performance

// Solution 2: Verify collision layers
const playerCollision = player.getComponent(CollisionComponent);
console.log('Player layer:', playerCollision.layer); // Should be 'player'
console.log('Target layers:', playerCollision.targetLayers);
// Should include 'enemy', 'enemyProjectile'

// Solution 3: Check spatial grid placement
// Enable debug mode to see collision grid:
// VITE_PHYSICS_DEBUG=true
// Grid cells should update as entities move

// Solution 4: Verify collision component setup
// Player should have: layer='player', targets=['enemy', 'enemyProjectile']
// Enemies should have: layer='enemy', targets=['player', 'playerProjectile']
// Projectiles should have: layer='playerProjectile'/'enemyProjectile'

// Solution 5: Test collision manually
const collision1 = entity1.getComponent(CollisionComponent);
const collision2 = entity2.getComponent(CollisionComponent);
console.log('Can collide:', collision1.canCollideWith(collision2));
```

### Problem: Object pooling causing issues

**Symptoms:**

- Projectiles appear at wrong positions
- "Pool exhausted" console warnings
- Memory still increasing despite pooling

**Solutions:**

```javascript
// Solution 1: Check pool configuration
console.log('Player projectile pool size:', scene.objectPools.playerProjectiles.size);
console.log('Available in pool:', scene.objectPools.playerProjectiles.available.length);
// Default size: 100, should rarely be exhausted

// Solution 2: Verify projectile activation/deactivation
// When creating projectile:
const projectile = scene.objectPools.playerProjectiles.get();
projectile.activate(x, y, velocityX, velocityY, damage, 'player');

// When projectile leaves screen or hits target:
projectile.deactivate(); // Should return to pool automatically

// Solution 3: Check pool efficiency
// Enable debug logging to see pool usage:
Logger.debug('Pool stats:', {
  total: pool.size,
  active: pool.active.length,
  available: pool.available.length,
});

// Solution 4: Increase pool size if needed
// In GameScene.js:
this.objectPools = {
  playerProjectiles: new ObjectPool(() => new Projectile(this), 200), // Increased from 100
  enemyProjectiles: new ObjectPool(() => new Projectile(this), 200),
};

// Solution 5: Monitor pool misses
// Should be 0% - if higher, increase pool size
console.log('Pool miss rate:', (poolMisses / totalRequests) * 100 + '%');
```

---

## Build and Deployment Issues

### Problem: Production build fails

**Symptoms:**

- `npm run build` command fails
- Build output missing or incomplete
- Console shows build errors

**Solutions:**

```bash
# Solution 1: Check for TypeScript errors (if using TS)
npm run build -- --mode production

# Solution 2: Verify environment variables
# Production might need different .env settings
# Create .env.production if needed

# Solution 3: Check for dynamic imports
# Ensure all imports are properly resolved
# No relative path issues

# Solution 4: Clear build cache
rm -rf dist/ .vite/
npm run build

# Solution 5: Check bundle size
npm run build
ls -la dist/
# Look for unusually large files
```

### Problem: Built game doesn't work on server

**Symptoms:**

- Game works locally but not on server
- Asset loading errors in production
- Blank screen on deployed version

**Solutions:**

```bash
# Solution 1: Check asset paths
# Use relative paths, not absolute
# Wrong: /assets/image.png
# Right: ./assets/image.png

# Solution 2: Test production build locally
npm run build
npm run preview
# Compare with development version

# Solution 3: Check server configuration
# Ensure server serves static files correctly
# Configure proper MIME types for .js files

# Solution 4: Verify HTTPS requirements
# Some browser features require HTTPS in production
# Check for mixed content warnings

# Solution 5: Check console for errors
# Open DevTools on deployed version
# Look for 404s or CORS errors
```

---

## Browser Compatibility Issues

### Problem: Game doesn't work in Safari/older browsers

**Symptoms:**

- Game loads in Chrome but not Safari
- Error messages about unsupported features
- WebGL context creation fails

**Solutions:**

```bash
# Solution 1: Check WebGL support
# Test in browser console:
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl');
console.log('WebGL supported:', !!gl);

# Solution 2: Add polyfills if needed
npm install --save-dev @babel/preset-env
# Configure for target browsers

# Solution 3: Check ES6 feature usage
# Ensure features are supported:
# - Arrow functions
# - Classes
# - Template literals
# - Destructuring

# Solution 4: Test fallback rendering
# Phaser should fall back to Canvas if WebGL fails
# Check Phaser.AUTO is used in config

# Solution 5: Verify audio support
# Different browsers support different formats
# Provide OGG and MP3 versions
```

### Problem: Performance varies between browsers

**Symptoms:**

- Chrome runs at 60fps, Firefox at 30fps
- Different rendering artifacts
- Inconsistent audio performance

**Solutions:**

```bash
# Solution 1: Profile in each browser
# Use browser-specific DevTools
# Compare performance profiles

# Solution 2: Adjust settings per browser
# Detect browser and reduce quality if needed
const isFirefox = navigator.userAgent.includes('Firefox');
if (isFirefox) {
  // Reduce particle count, etc.
}

# Solution 3: Test hardware acceleration
# Ensure GPU acceleration enabled
# Check about:gpu in Chrome
# Check about:support in Firefox

# Solution 4: Optimize for lowest common denominator
# Design for worst-performing target browser
# Add enhancement for better browsers
```

---

## Debug Mode Troubleshooting

### Enabling Debug Mode

```bash
# Set in .env file:
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
VITE_SHOW_FPS=true
VITE_SHOW_DEBUG_INFO=true
VITE_PHYSICS_DEBUG=true
```

### Debug Features Available

| Feature                | Access                    | Description                        |
| ---------------------- | ------------------------- | ---------------------------------- |
| **Console Logging**    | Browser DevTools          | Detailed game state logging        |
| **FPS Counter**        | On-screen display         | Real-time performance metrics      |
| **Debug Info**         | Bottom-left overlay       | BaseEntity count, player position      |
| **Physics Debug**      | Visual overlay            | Collision boundaries and bodies    |
| **Spatial Grid Debug** | Visual overlay            | Collision grid cells visualization |
| **Pool Monitoring**    | Console logs              | Object pool usage statistics       |
| **BaseSystem Performance** | Console logs              | Individual system performance      |
| **Global Access**      | `window.spaceShooterGame` | Direct game instance access        |
| **Debug Controls**     | F2/F3 keys                | Add score/take damage              |

### Common Debug Commands

```javascript
// In browser console (debug mode only):

// Access game instance
const game = window.spaceShooterGame.getGame();

// Access current scene
const scene = game.scene.getScene('GameScene');

// Access player
const player = scene.player;

// Check components
const health = player.getComponent(HealthComponent);
const movement = player.getComponent(MovementComponent);

// Manual debugging (Sprint 2 enhanced)
Logger.debug('Current game state:', {
  score: scene.gameStateManager.score,
  level: scene.gameStateManager.level,
  wave: scene.gameStateManager.currentWave,
  lives: scene.gameStateManager.lives,
  playerHealth: health?.currentHealth,
  playerPosition: { x: player.x, y: player.y },
  currentWeapon: player.getComponent(WeaponComponent)?.weaponType,
  enemiesActive: scene.entities.filter(e => e.constructor.name === 'Enemy').length,
});

// Weapon system debugging
const weapon = player.getComponent(WeaponComponent);
Logger.debug('Weapon stats:', weapon.getStats());
Logger.debug('Unlocked weapons:', scene.gameStateManager.getUnlockedWeapons());

// Collision system debugging
const collisionSystem = scene.systems.find(s => s.name === 'CollisionSystem');
Logger.debug('Collision grid performance:', collisionSystem.getPerformanceStats());

// Object pool debugging
Logger.debug('Pool status:', {
  playerProjectiles: {
    total: scene.objectPools.playerProjectiles.size,
    active: scene.objectPools.playerProjectiles.active.length,
    available: scene.objectPools.playerProjectiles.available.length,
  },
  enemyProjectiles: {
    total: scene.objectPools.enemyProjectiles.size,
    active: scene.objectPools.enemyProjectiles.active.length,
    available: scene.objectPools.enemyProjectiles.available.length,
  },
});

// Performance testing
Logger.time('Update Loop');
// ... some operation
Logger.timeEnd('Update Loop');

// Enemy AI debugging
scene.entities.forEach(entity => {
  if (entity.constructor.name === 'Enemy') {
    const movement = entity.getComponent(MovementComponent);
    Logger.debug(`Enemy ${entity.entityId}:`, {
      type: entity.enemyType,
      aiPattern: movement.aiPattern,
      health: entity.getComponent(HealthComponent)?.currentHealth,
    });
  }
});
```

---

## Getting Help

### Before Reporting Issues

1. **Check this troubleshooting guide** for known solutions
2. **Enable debug mode** and check console for detailed errors
3. **Test in multiple browsers** to isolate browser-specific issues
4. **Try minimal reproduction** - create simple test case
5. **Check recent changes** - what was modified before issue appeared

### Information to Include When Reporting

```bash
# Environment information
node --version
npm --version
cat package.json | grep version

# Browser information
# Include browser name and version
# Check User Agent string

# Error messages
# Include full error text from console
# Screenshots of visual issues

# Steps to reproduce
# Exact sequence of actions that cause issue

# Expected vs actual behavior
# What should happen vs what actually happens
```

### Useful Debug Commands

```bash
# Check all environment variables
npm run dev -- --debug

# Verbose logging
VITE_LOG_LEVEL=debug npm run dev

# Build analysis
npm run build -- --debug

# Dependencies check
npm audit
npm outdated
```

This troubleshooting guide covers the most common issues you'll encounter during development. Keep it updated as new issues are discovered and resolved.
