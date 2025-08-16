# Code Style and Conventions

## ESLint Configuration:
- **ESLint 9.x**: Latest version with @eslint/js recommended rules
- **Prettier Integration**: Automated formatting with eslint-plugin-prettier
- **No console.log()**: Enforced Logger scope usage instead of console methods
- **ES6+ Rules**: Modern JavaScript patterns and best practices
- **Game Development Specific**: Custom rules for Phaser GameObject lifecycle
- **Error Prevention**: Rules to catch common game development mistakes

## Prettier Configuration:
- **2-space Indentation**: Clean, readable code structure
- **Single Quotes**: Consistent string quoting throughout codebase
- **Trailing Commas**: Easier git diffs and array/object management
- **Line Length**: 100 characters for optimal readability
- **Auto-formatting**: Format on save for consistency

## JavaScript/ES6+ Conventions:

### **Modern JavaScript Patterns**
- **ES6 Modules**: All imports/exports use ES module syntax
- **const/let**: Prefer over `var` for block scoping
- **Arrow Functions**: Used for short callbacks and functional programming
- **Async/Await**: Preferred over Promise chains for readability
- **Destructuring**: Used for object and array destructuring where appropriate
- **Template Literals**: Used for string interpolation and multi-line strings

### **Error Handling**
- **Try/Catch Blocks**: Proper error handling for async operations
- **Logger Integration**: All errors logged through Logger system
- **Graceful Degradation**: Error states handled with user-friendly messages
- **Global Error Handling**: Centralized error management in SpaceShooterGame

## Naming Conventions:

### **Code Naming Standards**
- **Classes**: PascalCase (e.g., `SpaceShooterGame`, `EnemySystem`, `ConfigManager`)
- **Functions/Variables**: camelCase (e.g., `updatePosition`, `currentHealth`, `getEventBus`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_ENEMIES`, `WEAPON_TYPES`, `EVENT_TYPES`)
- **Files**: PascalCase for classes, camelCase for utilities
- **Private Fields**: Use `#` prefix for true private fields (e.g., `#logger`, `#internalState`)

### **Event and Configuration Naming**
- **Event Types**: Descriptive constants in EventTypes (e.g., `GAME_PAUSE_TOGGLE`, `ENEMY_SPAWNED`)
- **Config Keys**: Clear, hierarchical naming (e.g., `game.player.speed`, `collision.layers`)
- **Scene Names**: Descriptive scene identifiers (e.g., `BootScene`, `GameScene`)

## Logger System Usage (Critical Pattern):

### **Mandatory Logger Usage**
```javascript
// NEVER use console methods - ALWAYS use Logger
// ❌ WRONG
console.log('Player spawned');
console.error('Failed to save');

// ✅ CORRECT
Logger.debug('Player spawned at', x, y);
Logger.error('Failed to save data');
```

### **Logger Patterns**
```javascript
// Class-based pattern (preferred for classes)
class GameScene extends Phaser.Scene {
  #logger;
  
  constructor() {
    super({ key: 'GameScene' });
    this.#logger = Logger.scope('GameScene');
  }
  
  create() {
    this.#logger.debug('GameScene created');
    this.#logger.info('Loading game assets');
  }
}

// Global logging methods (for standalone functions/utilities)
Logger.debug('Player spawned at', x, y);
Logger.info('Level completed');
Logger.warn('Low health warning');
Logger.error('Critical error');

// Direct scoped logging (when not using class pattern)
Logger.scope('SpaceShooterGame').info('Destroying game instance');
Logger.scope('EnemySystem').debug('Enemy spawned', enemy.id);
Logger.scope('WeaponSystem').warn('Weapon overheating');
```

## Phaser-Specific Patterns:

### **Scene Management**
- **Proper Lifecycle**: Use create(), update(), and shutdown() methods appropriately
- **Event Cleanup**: Remove all event listeners in shutdown() to prevent memory leaks
- **Data Passing**: Use scene.scene.start(key, data) for inter-scene communication
- **Scene Flow**: Follow Boot → Preloader → MainMenu → GameScene + UIScene pattern

### **Entity Patterns**
```javascript
// Entity classes extend Phaser objects
class Player extends Phaser.GameObjects.Rectangle {
  #logger;
  #health;
  
  constructor(scene, x, y) {
    super(scene, x, y, 64, 64, 0x0099ff);
    this.#logger = Logger.scope('Player');
    this.#health = new Health(100);
    
    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }
  
  update(deltaTime) {
    this.#updateMovement(deltaTime);
    this.#updateWeapons(deltaTime);
  }
  
  #updateMovement(deltaTime) {
    // Private method implementation
  }
}
```

### **Configuration Access**
```javascript
// ConfigManager auto-initializes on first use
const config = ConfigManager.getConfig();
const playerSpeed = config.game.player.speed;

// Phaser-specific configuration
const phaserConfig = ConfigManager.getPhaserConfig();
```

### **Event System Usage**
```javascript
// Get singleton EventBus instance
const eventBus = getEventBus();

// Emit typed events
eventBus.emit(EventTypes.GAME_PAUSE_TOGGLE, { paused: true });
eventBus.emit(EventTypes.PLAYER_DAMAGED, { damage: 25, health: 75 });

// Listen for events (always clean up in shutdown)
eventBus.on(EventTypes.ENEMY_SPAWNED, this.handleEnemySpawn, this);

// Clean up in scene shutdown
shutdown() {
  eventBus.off(EventTypes.ENEMY_SPAWNED, this.handleEnemySpawn, this);
}
```

## JSDoc Documentation Standards:

### **Required Tags**
- `@param {type} paramName - Description` for all parameters
- `@returns {type} Description` for all return values  
- `@private` for all private/internal members
- `@class` for constructor functions
- `@extends ParentClass` for inheritance

### **Documentation Example**
```javascript
/**
 * Enemy entity with AI behavior and health system.
 * @class
 * @extends Phaser.GameObjects.Rectangle
 */
class Enemy extends Phaser.GameObjects.Rectangle {
  /**
   * Create a new enemy.
   * @param {Phaser.Scene} scene - The Phaser scene
   * @param {Object} config - Enemy configuration
   * @param {number} config.x - X position
   * @param {number} config.y - Y position
   * @param {string} config.type - Enemy type (scout, fighter, bomber)
   */
  constructor(scene, config) {
    // Implementation
  }
  
  /**
   * Update enemy behavior and movement.
   * @param {number} deltaTime - Time since last update in milliseconds
   * @returns {void}
   */
  update(deltaTime) {
    // Implementation
  }
  
  /**
   * Handle damage taken by enemy.
   * @private
   * @param {number} damage - Amount of damage to apply
   * @returns {boolean} True if enemy was destroyed
   */
  #takeDamage(damage) {
    // Private implementation
  }
}
```

## Performance and Quality Standards:

### **Performance Patterns**
- **Object Pooling**: Used for projectiles and frequently created/destroyed objects
- **Event Cleanup**: Always remove event listeners to prevent memory leaks
- **Efficient Updates**: Use delta time for frame-rate independent updates
- **Spatial Optimization**: Grid-based collision detection for performance

### **Code Quality Gates**
- **Linting**: `npm run lint <files>` for specific file validation
- **Formatting**: `npm run format` for consistent code style
- **Testing**: `npm run test` for functionality validation
- **Validation**: `npm run validate` for complete quality pipeline

### **Git and Development**
- **File-Specific Linting**: Lint only changed files to avoid noise
- **Commit Standards**: Use descriptive commit messages with type prefixes
- **No Auto-Commit**: Never commit without explicit user request
- **Environment Variables**: Use .env for configuration, never commit secrets

## Implemented Patterns in Codebase:

### **Auto-Initializing Systems**
- **Logger**: Works immediately without setup
- **ConfigManager**: Auto-validates environment and configuration
- **EventBus**: Singleton pattern with getEventBus() factory
- **GameStateManager**: Persistent state with localStorage integration

### **Error Handling**
- **Global Error Handler**: Centralized error management
- **User-Friendly Messages**: Error display with reload functionality
- **Logger Integration**: All errors go through Logger system
- **Graceful Degradation**: Fallbacks for configuration and asset loading

This represents the current implemented patterns and conventions successfully used throughout the Sprint 2 development phase.