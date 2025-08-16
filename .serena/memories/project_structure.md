# Project Structure

## Current Implemented Structure:
```
space-shooter/
├── .env.example           # Environment variable template
├── .eslintrc.js          # ESLint configuration
├── .prettierrc           # Prettier configuration
├── vite.config.js        # Vite configuration with Vitest
├── vitest.config.js      # Vitest testing configuration
├── package.json          # Dependencies and scripts
├── index.html            # Entry point HTML
├── CLAUDE.md             # Development guidelines
├── README.md             # Project documentation
├── src/
│   ├── main.js           # Entry point, initializes SpaceShooterGame
│   ├── core/
│   │   └── SpaceShooterGame.js # Main game class with Phaser setup
│   ├── scenes/           # Phaser scene classes
│   │   ├── BootScene.js       # Environment and initialization
│   │   ├── PreloaderScene.js  # Asset loading
│   │   ├── MainMenuScene.js   # Main menu interface  
│   │   ├── GameScene.js       # Core gameplay with integrated systems
│   │   ├── UIScene.js         # Game UI overlay with real-time stats
│   │   └── index.js           # Scene exports
│   ├── config/           # Configuration management
│   │   ├── ConfigManager.js   # Main configuration manager
│   │   ├── GameConfig.js      # Game-specific settings
│   │   ├── PhaserConfig.js    # Phaser engine configuration
│   │   ├── VisualConfig.js    # Graphics and UI settings
│   │   ├── CollisionConfig.js # Collision layer definitions
│   │   ├── PerformanceConfig.js # Performance optimization settings
│   │   └── EnvironmentSchema.js # Environment variable validation
│   ├── entities/         # Game entity classes
│   │   ├── Player.js          # Player entity with movement and shooting
│   │   ├── Enemy.js           # Enemy entities with AI and state machines
│   │   ├── Projectile.js      # Projectile system with object pooling
│   │   └── Background.js      # Animated starfield background
│   ├── components/       # Data components for entities
│   │   └── Health.js          # Health component for damage system
│   ├── systems/          # Game logic systems
│   │   └── EnemySystem.js     # Enemy AI, spawning, and wave management
│   ├── event-bus/       # Event system
│   │   ├── EventBus.js       # Singleton event manager
│   │   ├── EventTypes.js     # Core event type constants
│   │   ├── GameEvents.js     # Game-specific events
│   │   └── EnemyEvents.js    # Enemy system events
│   └── utils/
│       ├── Logger.js          # Auto-initializing logger with scopes
│       └── GameStateManager.js # Game state, progression, and persistence
├── tests/                # Test infrastructure (minimal coverage approach)
└── .serena/
    └── memories/         # Serena AI assistant memory files
```

## Architecture Patterns:

### **Scene-Based Architecture**
- **BootScene**: Environment setup and configuration validation
- **PreloaderScene**: Asset loading
- **MainMenuScene**: Game start menu interface
- **GameScene**: Main gameplay with collision groups and game loop
- **UIScene**: HUD and interface elements

### **Auto-Initializing Systems**
- **Logger**: `Logger.debug('message')` works immediately - no setup needed
- **ConfigManager**: `ConfigManager.getConfig()` auto-initializes with validation
- **EventBus**: Centralized event management with getEventBus() singleton
- **GameStateManager**: Handles score, lives, progression, and game state transitions

### **Entity-Component-System Pattern**
- **Entities**: Player, Enemy, Projectile, Background (game objects)
- **Components**: Health (data containers)
- **Systems**: EnemySystem (logic and behavior)

### **Performance Optimization**
- **Object Pooling**: Projectile system reuses objects for efficiency
- **Spatial Grid**: Collision detection optimization
- **Event-Driven**: Decoupled communication between systems
- **Memory Management**: Proper cleanup and lifecycle management

## Key Directories Explained:

### **Core Systems (/src/core/)**
- Main game initialization and Phaser setup
- Central coordination of all game systems

### **Configuration (/src/config/)**
- Multi-file configuration system for different aspects
- Environment variable validation with Zod schemas
- Auto-initialization with validation

### **Scenes (/src/scenes/)**
- Traditional Phaser scene flow implementation
- Each scene handles specific game phases
- Proper lifecycle management and cleanup

### **Entities (/src/entities/)**
- Game object classes that extend Phaser objects
- Self-contained entities with behavior and state
- Integrated with component system

### **Event System (/src/event-bus/)**
- Centralized event management
- Typed event constants for consistency
- Decoupled system communication

### **Utilities (/src/utils/)**
- Auto-initializing Logger with scope-based debugging
- Game state management with persistence
- Shared utility functions

## Development Status:
- **Sprint 2 Complete**: All core systems implemented and functional
- **Fully Playable**: Complete gameplay loop with all major features
- **Performance Optimized**: 60+ FPS with efficient memory usage
- **Refactored Architecture**: Simplified from ECS to scene-based for maintainability