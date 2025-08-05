# Code Examples and Implementation Patterns

This document provides comprehensive code examples and implementation patterns for the Space Shooter game architecture.

## Table of Contents

- [Enhanced BaseEntity Implementation](#enhanced-baseentity-implementation)
- [Component and System Examples](#component-and-system-examples)
- [Configuration Usage Examples](#configuration-usage-examples)
- [Logger System Examples](#logger-system-examples)
- [Input Management Examples](#input-management-examples)
- [Testing Implementation Examples](#testing-implementation-examples)
- [Mock Implementation Examples](#mock-implementation-examples)

## Enhanced BaseEntity Implementation

### Complete BaseEntity Class

```javascript
// src/entities/BaseEntity.js - Enhanced flexible entity class
import Logger from '@/utils/Logger.js';

class BaseEntity {
  constructor(scene, ...args) {
    this.scene = scene;
    this.components = new Map();
    this.entityId = `entity_${Date.now()}_${Math.random()}`;
    
    // Flexible constructor - auto-detect signature
    if (args.length === 1 && typeof args[0] === 'object') {
      // NEW: Configuration object approach
      this.initFromConfig(scene, args[0]);
    } else {
      // BACKWARD COMPATIBLE: Legacy constructor
      this.initFromLegacy(scene, ...args);
    }
  }

  initFromConfig(scene, config) {
    this.config = { ...config };
    this.name = config.name || 'unnamed-entity';
    
    // Create GameObject based on type (or null for logical entities)
    this.gameObject = this.createGameObject(config);
    
    // Setup entity in scene
    this.setupInScene();
  }

  createGameObject(config) {
    const { type, x = 0, y = 0 } = config;
    
    try {
      switch (type) {
        case 'rectangle':
          return this.scene.add.rectangle(x, y, config.width, config.height, config.color);
        case 'sprite':
          return this.scene.add.sprite(x, y, config.texture, config.frame);
        case 'image':
          return this.scene.add.image(x, y, config.texture);
        case 'circle':
          return this.scene.add.circle(x, y, config.radius || 16, config.color);
        case 'polygon':
          return this.scene.add.polygon(x, y, config.points || [0, -12, 12, 0, 0, 12, -12, 0], config.color);
        case 'text':
          return this.scene.add.text(x, y, config.text || '', config.style || {});
        case null:
          // Logical entity - no visual representation
          this.logicalPosition = { x, y };
          return null;
        default:
          Logger.warn(`Unknown GameObject type: ${type}, falling back to rectangle`);
          return this.scene.add.rectangle(x, y, 32, 32, 0xffffff);
      }
    } catch (error) {
      Logger.error('GameObject creation failed, using fallback rectangle:', error);
      return this.scene.add.rectangle(x, y, 32, 32, 0xff0000);
    }
  }

  // NEW: Runtime GameObject type switching
  changeGameObjectType(newType, newConfig = {}) {
    const oldPosition = { x: this.x, y: this.y };
    
    // Destroy old GameObject if it exists
    if (this.gameObject) {
      this.gameObject.destroy();
    }
    
    // Create new GameObject
    this.gameObject = this.createGameObject({
      type: newType,
      x: oldPosition.x,
      y: oldPosition.y,
      ...newConfig
    });
    
    // Re-setup in scene
    this.setupInScene();
    
    Logger.debug(`Changed GameObject type to ${newType} for entity ${this.name}`);
  }

  getGameObjectType() {
    if (!this.gameObject) return null;
    if (this.gameObject.type) return this.gameObject.type;
    // Fallback detection based on GameObject properties
    if (this.gameObject.texture) return 'sprite';
    if (this.gameObject.fillColor !== undefined) return 'rectangle';
    return 'unknown';
  }

  // NULL-SAFE property delegation
  get x() { return this.gameObject ? this.gameObject.x : (this.logicalPosition?.x || 0); }
  set x(value) { 
    if (this.gameObject) this.gameObject.x = value;
    else if (this.logicalPosition) this.logicalPosition.x = value;
  }
  
  get y() { return this.gameObject ? this.gameObject.y : (this.logicalPosition?.y || 0); }
  set y(value) { 
    if (this.gameObject) this.gameObject.y = value;
    else if (this.logicalPosition) this.logicalPosition.y = value;
  }

  get active() { return this.gameObject ? this.gameObject.active : this._active !== false; }
  set active(value) { 
    if (this.gameObject) this.gameObject.active = value;
    else this._active = value;
  }

  get visible() { return this.gameObject ? this.gameObject.visible : this._visible !== false; }
  set visible(value) { 
    if (this.gameObject) this.gameObject.visible = value;
    else this._visible = value;
  }

  // Component management
  addComponent(component) {
    component.entity = this;
    this.components.set(component.constructor.name, component);
    Logger.debug(`Added component ${component.constructor.name} to entity ${this.name}`);
    return this;
  }

  getComponent(componentType) {
    return this.components.get(componentType.name);
  }

  hasComponent(componentType) {
    return this.components.has(componentType.name);
  }

  // NULL-SAFE physics enablement
  enablePhysics(bodyType = 'dynamic') {
    if (this.gameObject && this.scene.physics) {
      this.scene.physics.add.existing(this.gameObject);
      // Configure physics body based on type
    }
    return this;
  }

  setupInScene() {
    // Register entity with scene if scene has entity tracking
    if (this.scene.entities && !this.scene.entities.includes(this)) {
      this.scene.entities.push(this);
    }
  }

  destroy() {
    // Clean up components
    this.components.clear();
    
    // Destroy GameObject if it exists
    if (this.gameObject) {
      this.gameObject.destroy();
    }
    
    // Remove from scene registry
    if (this.scene.entities) {
      const index = this.scene.entities.indexOf(this);
      if (index > -1) this.scene.entities.splice(index, 1);
    }
  }
}

export default BaseEntity;
```

## Component and System Examples

### Base Component Class

```javascript
// src/components/BaseComponent.js - Base component class
class BaseComponent {
  constructor() {
    // Base class for all components (optional - components can be plain objects)
  }
}

export default BaseComponent;
```

### Health Component Example

```javascript
// src/components/HealthComponent.js - Example component (pure data)
import BaseComponent from './BaseComponent.js';

class HealthComponent extends BaseComponent {
  constructor(maxHealth = 100) {
    super();
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
    this.invulnerable = false;
    this.lastDamageTime = 0;
    this.invulnerabilityDuration = 1000; // 1 second
  }

  takeDamage(amount, timestamp = Date.now()) {
    if (this.invulnerable || timestamp - this.lastDamageTime < this.invulnerabilityDuration) {
      return false; // Damage blocked
    }

    this.currentHealth = Math.max(0, this.currentHealth - amount);
    this.lastDamageTime = timestamp;
    return true; // Damage applied
  }

  heal(amount) {
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
  }

  get isAlive() {
    return this.currentHealth > 0;
  }

  get healthPercent() {
    return this.currentHealth / this.maxHealth;
  }
}

export default HealthComponent;
```

### Movement System Example

```javascript
// src/systems/MovementSystem.js - Example system (logic handler)
import BaseSystem from './BaseSystem.js';
import MovementComponent from '@/components/MovementComponent.js';
import Logger from '@/utils/Logger.js';

class MovementSystem extends BaseSystem {
  update(entities, delta) {
    entities.forEach(entity => {
      const movement = entity.getComponent(MovementComponent);
      if (movement && entity.active) {
        // Apply velocity with delta time
        entity.x += movement.velocityX * delta;
        entity.y += movement.velocityY * delta;
        
        // Apply friction
        if (movement.friction > 0) {
          movement.velocityX *= (1 - movement.friction * delta);
          movement.velocityY *= (1 - movement.friction * delta);
        }
        
        // Boundary checking if enabled
        if (movement.boundaryCheck && entity.scene.physics.world) {
          const bounds = entity.scene.physics.world.bounds;
          entity.x = Math.max(0, Math.min(bounds.width, entity.x));
          entity.y = Math.max(0, Math.min(bounds.height, entity.y));
        }
        
        Logger.debug(`Entity ${entity.name} moved to`, entity.x, entity.y);
      }
    });
  }
}

export default MovementSystem;
```

## Configuration Usage Examples

### Unified ConfigManager Pattern

```javascript
// UNIFIED CONFIGMANAGER PATTERN
import ConfigManager from '@/config/ConfigManager.js';

class GameScene extends Phaser.Scene {
  create() {
    // Get all configuration in one call
    const config = ConfigManager.getConfig();
    const constants = ConfigManager.getConstants();
    
    // Use configuration values
    if (config.debugMode) {
      this.setupDebugGraphics();
    }
    
    // Create player with configured colors
    this.player = this.add.rectangle(
      400, 300, 64, 64, 
      constants.COLORS.PLAYER // 0x0099ff (blue)
    );
    
    // Configure physics debug based on settings
    if (config.physicsDebug) {
      this.physics.world.debugGraphic.visible = true;
    }
    
    // Use performance settings
    this.setupObjectPools(config.objectPoolSize);
    this.setupParticleSystem(config.maxParticles);
  }

  setupDebugGraphics() {
    // Enable debug visualizations
    this.physics.world.createDebugGraphic();
    this.physics.world.debugGraphic.visible = true;
  }

  setupObjectPools(poolSize) {
    // Initialize object pools with configured size
    this.bulletPool = new ObjectPool(() => new Bullet(this), poolSize);
    this.enemyPool = new ObjectPool(() => new Enemy(this), Math.floor(poolSize / 2));
  }
}

// MAIN.JS INITIALIZATION PATTERN (Current Implementation)
import ConfigManager from '@/config/ConfigManager.js';
import Logger from '@/utils/Logger.js';
import SpaceShooterGame from '@/core/SpaceShooterGame.js';

const spaceShooterGame = new SpaceShooterGame();

// Initialize the game
spaceShooterGame.init().catch(error => {
  console.error('Failed to start Space Shooter game:', error);
});

// Make game instance available globally for debugging
if (ConfigManager.getConfig().debugMode) {
  window.spaceShooterGame = spaceShooterGame;
  Logger.debug('main: Debug mode - Game instance available as window.spaceShooterGame');
}
```

## Logger System Examples

### Auto-initializing Logger System Pattern

```javascript
// Auto-initializing Logger system pattern
class Logger {
  static _ensureInitialized() {
    if (!this.isInitialized) {
      // Auto-initialize with dual environment support
      this.debugMode = this._getEnvVariable('VITE_DEBUG_MODE') === 'true';
      this.logLevel = this._getEnvVariable('VITE_LOG_LEVEL') || 'info';
      this.levels = { debug: 0, info: 1, warn: 2, error: 3 };
      this.isInitialized = true;
    }
  }

  static debug(message, ...args) {
    this._ensureInitialized(); // Auto-initialize on first call
    if (this.debugMode && this.shouldLog('debug')) {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`🔍 ${timestamp} [DEBUG] ${message}`, ...args);
    }
  }

  static info(message, ...args) {
    this._ensureInitialized(); // Auto-initialize on first call
    if (this.shouldLog('info')) {
      const timestamp = new Date().toLocaleTimeString();
      console.info(`ℹ️ ${timestamp} [INFO] ${message}`, ...args);
    }
  }

  static warn(message, ...args) {
    this._ensureInitialized(); // Auto-initialize on first call
    if (this.shouldLog('warn')) {
      const timestamp = new Date().toLocaleTimeString();
      console.warn(`⚠️ ${timestamp} [WARN] ${message}`, ...args);
    }
  }

  static error(message, ...args) {
    this._ensureInitialized(); // Auto-initialize on first call
    if (this.shouldLog('error')) {
      const timestamp = new Date().toLocaleTimeString();
      console.error(`❌ ${timestamp} [ERROR] ${message}`, ...args);
    }
  }

  static _getEnvVariable(name) {
    // Dual environment support with graceful fallbacks
    try {
      return import.meta?.env?.[name] || process?.env?.[name] || undefined;
    } catch {
      return undefined;
    }
  }

  static shouldLog(level) {
    this._ensureInitialized();
    return this.levels[level] >= this.levels[this.logLevel];
  }

  // Performance methods - also auto-initialize
  static time(label) {
    this._ensureInitialized();
    if (this.debugMode) console.time(`⏱️ ${label}`);
  }

  static timeEnd(label) {
    this._ensureInitialized();
    if (this.debugMode) console.timeEnd(`⏱️ ${label}`);
  }
}
```

## Input Management Examples

### KeyboardInputAdapter Pattern with EventBus Integration

```javascript
// KeyboardInputAdapter pattern with EventBus integration
import KeyboardInputAdapter from '@/adapters/KeyboardInputAdapter.js';
import { getEventBus } from '@/event-bus/EventBus.js';
import { EventTypes } from '@/event-bus/EventTypes.js';

class GameScene extends Phaser.Scene {
  create() {
    // Initialize input adapter
    this.inputAdapter = new KeyboardInputAdapter(this);
    this.inputAdapter.activate();

    // Listen for structured input events
    const eventBus = getEventBus();
    eventBus.on(EventTypes.PLAYER_INPUT, this.handlePlayerInput, this);
  }

  handlePlayerInput(event) {
    if (event.action === 'movement') {
      // Normalized diagonal movement - no speed advantage
      this.player.setVelocity(
        event.direction.x * this.player.maxSpeed,
        event.direction.y * this.player.maxSpeed
      );
    } else if (event.action === 'weapon_fire') {
      this.player.getComponent(WeaponComponent).handleFiring(event.state);
    } else if (event.action === 'pause') {
      if (event.state.pressed) {
        this.scene.pause();
      }
    }
  }
}
```

### Development Graphics Helper

```javascript
// Development graphics helper
import Logger from '@/utils/Logger.js';

class DevShapes {
  static createPlayer(scene, x, y) {
    const player = scene.add.rectangle(x, y, 64, 64, 0x0099ff);
    scene.physics.add.existing(player);
    Logger.info('Created player rectangle at', x, y);
    return player;
  }

  static createEnemy(scene, x, y, size = 32) {
    const enemy = scene.add.rectangle(x, y, size, size, 0xff0000);
    scene.physics.add.existing(enemy);
    Logger.info('Created enemy rectangle at', x, y);
    return enemy;
  }

  static createProjectile(scene, x, y, color = 0xffff00) {
    const projectile = scene.add.rectangle(x, y, 8, 16, color);
    scene.physics.add.existing(projectile);
    Logger.debug('Created projectile at', x, y);
    return projectile;
  }

  static createPowerUp(scene, x, y, type = 'health') {
    const colors = {
      health: 0x00ff00,
      weapon: 0x8800ff,
      shield: 0x00ffff
    };
    
    // Create diamond shape using polygon
    const points = [0, -12, 12, 0, 0, 12, -12, 0];
    const powerUp = scene.add.polygon(x, y, points, colors[type] || 0x00ff00);
    scene.physics.add.existing(powerUp);
    Logger.info('Created', type, 'power-up at', x, y);
    return powerUp;
  }
}

export default DevShapes;
```

## Testing Implementation Examples

### Comprehensive Testing Examples with Proper Mocking

```javascript
// UNIFIED CONFIGMANAGER TESTS
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConfigManager from '@/config/ConfigManager.js';

// Mock Logger to avoid console output during tests
vi.mock('../../../src/utils/Logger.js', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
}));

describe('ConfigManager - Unified Configuration System', () => {
  beforeEach(() => {
    ConfigManager.isInitialized = false;
    ConfigManager.validationErrors = [];
    vi.clearAllMocks();
  });

  it('should auto-initialize on first access', () => {
    expect(ConfigManager.isInitialized).toBe(false);
    const config = ConfigManager.getConfig();
    expect(ConfigManager.isInitialized).toBe(true);
    expect(config).toBeDefined();
  });

  it('should provide comprehensive configuration object', () => {
    const config = ConfigManager.getConfig();
    expect(config).toHaveProperty('debugMode');
    expect(config).toHaveProperty('logLevel');
    expect(config).toHaveProperty('isDevelopment');
    expect(config).toHaveProperty('_metadata');
  });

  it('should validate configuration parameters with schema', () => {
    const schema = ConfigManager.getSchema();
    expect(schema).toHaveProperty('DEBUG_MODE');
    expect(schema.DEBUG_MODE).toHaveProperty('type', 'boolean');
    expect(schema.DEBUG_MODE).toHaveProperty('default', false);
  });

  it('should provide Phaser configuration', () => {
    const phaserConfig = ConfigManager.getPhaserConfig();
    expect(phaserConfig).toHaveProperty('width');
    expect(phaserConfig).toHaveProperty('height');
    expect(phaserConfig).toHaveProperty('physics');
    expect(phaserConfig).toHaveProperty('scene');
  });
});

// BASEENTITY COMPREHENSIVE TESTS
import BaseEntity from '@/entities/BaseEntity.js';
import { MockScene } from '../__mocks__/PhaserMocks.js';
import HealthComponent from '@/components/HealthComponent.js';

describe('BaseEntity', () => {
  let mockScene;

  beforeEach(() => {
    mockScene = new MockScene();
  });

  it('should create entity with components', () => {
    const entity = new BaseEntity(mockScene, { type: 'rectangle' });
    const health = new HealthComponent(100);
    
    entity.addComponent(health);
    expect(entity.hasComponent(HealthComponent)).toBe(true);
    expect(entity.getComponent(HealthComponent)).toBe(health);
  });

  it('should handle GameObject type switching', () => {
    const entity = new BaseEntity(mockScene, { type: 'rectangle' });
    entity.changeGameObjectType('circle', { radius: 25 });
    expect(entity.getGameObjectType()).toBe('circle');
  });

  it('should support logical entities without GameObjects', () => {
    const entity = new BaseEntity(mockScene, { type: null });
    expect(entity.gameObject).toBeNull();
    entity.x = 100;
    expect(entity.x).toBe(100);
  });
});

// SYSTEM TESTS WITH MOCKING
import MovementSystem from '@/systems/MovementSystem.js';
import MovementComponent from '@/components/MovementComponent.js';

describe('MovementSystem', () => {
  let system;
  let mockEntities;

  beforeEach(() => {
    system = new MovementSystem();
    mockEntities = [
      {
        x: 0,
        y: 0,
        active: true,
        name: 'test-entity',
        getComponent: vi.fn().mockReturnValue(new MovementComponent(5, 0))
      }
    ];
  });

  it('should update entity positions', () => {
    system.update(mockEntities, 16); // 16ms delta
    expect(mockEntities[0].x).toBe(80); // 5 * 16
  });

  it('should skip inactive entities', () => {
    mockEntities[0].active = false;
    const initialX = mockEntities[0].x;
    system.update(mockEntities, 16);
    expect(mockEntities[0].x).toBe(initialX); // No movement
  });
});
```

## Mock Implementation Examples

```javascript
// tests/__mocks__/PhaserMocks.js
import { vi } from 'vitest';

export class MockScene {
  constructor() {
    this.add = {
      rectangle: vi.fn(() => new MockRectangle()),
      sprite: vi.fn(() => new MockSprite()),
      circle: vi.fn(() => new MockCircle()),
      polygon: vi.fn(() => new MockPolygon()),
      text: vi.fn(() => new MockText())
    };
    this.physics = {
      add: {
        existing: vi.fn()
      },
      world: {
        bounds: { width: 800, height: 600 }
      }
    };
    this.input = {
      on: vi.fn(),
      emit: vi.fn()
    };
    this.entities = [];
  }
}

export class MockRectangle {
  constructor(x = 0, y = 0, width = 32, height = 32, color = 0xffffff) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.fillColor = color;
    this.active = true;
    this.visible = true;
    this.type = 'Rectangle';
  }

  destroy() {
    this.active = false;
  }

  setTint(color) {
    this.tint = color;
  }
}

export class MockSprite {
  constructor(x = 0, y = 0, texture = '', frame = '') {
    this.x = x;
    this.y = y;
    this.texture = { key: texture };
    this.frame = frame;
    this.active = true;
    this.visible = true;
    this.type = 'Sprite';
  }

  destroy() {
    this.active = false;
  }

  play(animationKey) {
    this.currentAnimation = animationKey;
  }
}

// Mock for localStorage
export const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index) => Object.keys(store)[index] || null)
  };
})();

// Setup for tests
export const setupMocks = () => {
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true
  });
};
```

### Data Persistence Examples

```javascript
// SaveManager pattern with Logger integration
import Logger from '@/utils/Logger.js';

class SaveManager {
  static save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      Logger.debug('Saved data to localStorage:', key);
    } catch (error) {
      Logger.error('Failed to save data:', error);
    }
  }

  static load(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      const result = data ? JSON.parse(data) : defaultValue;
      Logger.debug('Loaded data from localStorage:', key, result);
      return result;
    } catch (error) {
      Logger.error('Failed to load data:', error);
      return defaultValue;
    }
  }

  static saveGameState(gameState) {
    const saveData = {
      timestamp: Date.now(),
      version: '1.0.0',
      player: {
        level: gameState.playerLevel,
        experience: gameState.playerExp,
        health: gameState.playerHealth,
        position: { x: gameState.playerX, y: gameState.playerY }
      },
      game: {
        score: gameState.score,
        wave: gameState.currentWave,
        difficulty: gameState.difficulty
      },
      settings: {
        audioEnabled: gameState.audioEnabled,
        debugMode: gameState.debugMode
      }
    };
    
    this.save('spaceshooter-save', saveData);
    Logger.info('Game state saved successfully');
  }

  static loadGameState() {
    const defaultState = {
      playerLevel: 1,
      playerExp: 0,
      playerHealth: 100,
      playerX: 400,
      playerY: 300,
      score: 0,
      currentWave: 1,
      difficulty: 'normal',
      audioEnabled: true,
      debugMode: false
    };

    const saveData = this.load('spaceshooter-save', null);
    
    if (!saveData) {
      Logger.info('No save data found, using defaults');
      return defaultState;
    }

    // Validate and merge save data with defaults
    const gameState = {
      ...defaultState,
      ...saveData.player,
      ...saveData.game,
      ...saveData.settings
    };

    Logger.info('Game state loaded successfully:', gameState);
    return gameState;
  }
}

export default SaveManager;
```

---

For architectural details and system design patterns, see [ARCHITECTURE.md](ARCHITECTURE.md).

For development workflow and testing strategies, see [DEVELOPMENT.md](DEVELOPMENT.md).