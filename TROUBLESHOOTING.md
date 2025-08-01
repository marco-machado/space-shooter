# Space Shooter Troubleshooting Guide

This guide provides solutions for common issues encountered during development and deployment of the Space Shooter game.

## Table of Contents

- [Setup Issues](#setup-issues)
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
import Logger from './core/Logger.js';

# Solution 2: Verify export syntax
# Use ES6 modules:
export default ClassName;
export { namedExport };

# Solution 3: Check relative paths
# From src/scenes/GameScene.js:
import Logger from '../core/Logger.js';  # Correct
import Logger from './core/Logger.js';   # Wrong

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

**Performance Optimization Checklist:**

- [ ] Object pooling for bullets/particles
- [ ] Efficient collision detection
- [ ] Minimal DOM manipulation
- [ ] Proper entity cleanup
- [ ] Optimized render calls
- [ ] Texture atlas usage

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
// Solution 1: Implement save system (future sprint)
// For now, use browser localStorage:
localStorage.setItem('gameScore', this.score);
const savedScore = localStorage.getItem('gameScore');

// Solution 2: Check for localStorage errors
try {
  localStorage.setItem('test', 'value');
} catch (error) {
  console.error('localStorage not available:', error);
}

// Solution 3: Verify data serialization
const gameData = {
  score: this.score,
  level: this.level,
  lives: this.lives,
};
localStorage.setItem('gameData', JSON.stringify(gameData));
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

| Feature             | Access                    | Description                     |
| ------------------- | ------------------------- | ------------------------------- |
| **Console Logging** | Browser DevTools          | Detailed game state logging     |
| **FPS Counter**     | On-screen display         | Real-time performance metrics   |
| **Debug Info**      | Bottom-left overlay       | Entity count, player position   |
| **Physics Debug**   | Visual overlay            | Collision boundaries and bodies |
| **Global Access**   | `window.spaceShooterGame` | Direct game instance access     |
| **Debug Controls**  | F2/F3 keys                | Add score/take damage           |

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

// Manual debugging
Logger.debug('Current game state:', {
  score: scene.score,
  lives: scene.lives,
  playerHealth: health?.currentHealth,
  playerPosition: { x: player.x, y: player.y },
});

// Performance testing
Logger.time('Update Loop');
// ... some operation
Logger.timeEnd('Update Loop');
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
