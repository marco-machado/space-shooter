# Reference Guide

This document provides reference information for assets, performance targets, deployment considerations, and project structure details.

## Table of Contents

- [Project Structure](#project-structure)
- [Asset Guidelines](#asset-guidelines)
- [Performance Targets](#performance-targets)
- [Deployment Considerations](#deployment-considerations)
- [Scene Management](#scene-management)
- [Development Graphics Strategy](#development-graphics-strategy)

## Project Structure

```
space-shooter/
├── .env                   # Environment variables (not in git)
├── .env.example          # Template for environment setup
├── .eslintrc.js          # ESLint configuration
├── .prettierrc           # Prettier configuration
├── .prettierignore       # Prettier ignore rules
├── vite.config.js        # Vite configuration with Vitest
├── vitest.config.js      # Vitest configuration
├── package.json          # Dependencies and scripts
├── index.html            # Entry point HTML
├── CLAUDE.md             # Project documentation and guidelines
├── docs/                 # Structured documentation
│   ├── ARCHITECTURE.md   # System architecture and patterns
│   ├── DEVELOPMENT.md    # Development workflow and testing
│   ├── EXAMPLES.md       # Code examples and implementations
│   └── REFERENCE.md      # This file - assets, performance, deployment
├── src/
│   ├── main.js           # Game initialization and Phaser config
│   ├── config/           # Unified configuration scopeName
│   │   ├── ConfigManager.js # Unified configuration manager
│   │   └── Constants.js  # Game constants and enums
│   ├── core/             # Core systems
│   │   └── SpaceShooterGame.js # Main game class and initialization
│   ├── scenes/           # Phaser scenes
│   │   ├── BootScene.js  # Initial setup and environment loading
│   │   ├── PreloaderScene.js # Asset loading with dev graphics
│   │   ├── MainMenuScene.js  # Main menu
│   │   ├── GameScene.js  # Primary gameplay scene
│   │   └── GameOverScene.js  # End game results
│   ├── entities/         # Game entities (ECS-based)
│   │   ├── BaseEntity.js     # Base entity class (extends Phaser.GameObject)
│   │   ├── Player.js     # Player entity (blue rectangle in dev)
│   │   ├── Enemy.js      # Enemy entities (red rectangles in dev)
│   │   ├── Projectile.js # Bullet entities (small colored shapes)
│   │   └── PowerUp.js    # Power-up entities (green/purple shapes)
│   ├── components/       # ECS components (simple data classes)
│   │   ├── BaseComponent.js  # Base component class
│   │   ├── HealthComponent.js    # Health and damage
│   │   ├── WeaponComponent.js    # Weapon stats and behavior
│   │   ├── MovementComponent.js  # Movement and physics
│   │   ├── CollisionComponent.js # Collision detection
│   │   └── RenderComponent.js    # Rendering and visual effects
│   ├── systems/          # ECS systems (game logic)
│   │   ├── BaseSystem.js     # Base scopeName class
│   │   ├── MovementSystem.js     # Handle entity movement
│   │   ├── WeaponSystem.js       # Weapon firing and projectiles
│   │   ├── CollisionSystem.js    # Collision detection and response
│   │   ├── EnemySpawnSystem.js   # Enemy wave generation
│   │   ├── ProgressionSystem.js  # XP and leveling
│   │   └── AudioSystem.js        # Sound management
│   ├── graphics/         # Development graphics generators
│   │   ├── DevShapes.js  # Colored rectangle/shape generators
│   │   └── DebugGraphics.js # Debug visualization
│   └── utils/            # Utility functions
│       ├── Logger.js     # Environment-aware logging scopeName
│       ├── GameStateManager.js # Game state management
│       ├── ObjectPool.js # Object pooling for performance
│       └── SaveManager.js # localStorage persistence
├── tests/                # Comprehensive test coverage
│   ├── units/            # Unit tests for all components
│   ├── integration/      # Integration tests for workflows
│   ├── __mocks__/        # Mock implementations
│   └── setup.js          # Test environment setup
└── public/
    └── assets/           # Static assets (sounds, fonts)
        ├── audio/        # Sound effects and music
        └── fonts/        # Custom fonts (if any)
```

## Asset Guidelines

### Development Phase Graphics

The game uses simple colored rectangles and shapes for rapid prototyping during development:

- **Player**: Blue 64x64px rectangle (`scene.add.rectangle(x, y, 64, 64, 0x0099ff)`)
- **Enemies**: Red rectangles of varying sizes (32x32, 48x48, 80x80)
- **Projectiles**: Small yellow/orange rectangles or circles (8x8, 16x16)
- **Power-ups**: Green/purple distinctive shapes (diamonds using `scene.add.polygon()`)
- **UI**: White text on dark backgrounds, simple geometric buttons
- **Background**: Solid color or simple CSS gradient

### Development Color Palette

- **Player**: `0x0099ff` (blue)
- **Enemies**: `0xff0000` (red), `0xcc0000` (dark red for bosses)
- **Projectiles**: `0xffff00` (yellow), `0xff8800` (orange)
- **Power-ups**: `0x00ff00` (green), `0x8800ff` (purple)
- **UI**: `0xffffff` (white text), `0x333333` (dark backgrounds)

### Production Phase Graphics (Future)

When transitioning to final graphics:

- **Player ship**: 64x64px sprite with engine trail animation
- **Enemies**: 32x32px to 128x128px depending on type
- **Projectiles**: 8x8px to 16x16px sprites
- **UI elements**: SVG graphics for scalability
- **Background**: Seamless tileable space backgrounds
- **Easy transition**: Replace shape creation with `scene.add.sprite()`

### Audio Requirements

- **Sound effects**: Short, punchy samples (<1 second typically)
- **Background music**: Looping tracks (2-4 minutes)
- **File format**: OGG Vorbis preferred, MP3 fallback
- **Volume levels**: Normalized and balanced across all audio
- **Phaser Integration**: Use Web Audio API with spatial positioning
- **Audio placement**: Store in `public/assets/audio/` for static loading

### Asset Management (Development Phase)

- **Development Graphics**: Use Phaser's shape generators instead of image files
- **Audio**: Place in `public/assets/audio/` for static loading
- **Future**: Easy transition to PNG sprites by replacing shape creation with `scene.add.sprite()`

## Performance Targets

### Frame Rate

- **Target**: Maintain 60 FPS on target hardware
- **Degradation**: Graceful degradation on slower devices
- **Monitoring**: Monitor and optimize update loops
- **Optimization**: Use delta time for frame-rate independent movement

### Memory Usage

- **Target**: Keep total memory under 100MB
- **Object Pooling**: Implement for frequently created objects (bullets, enemies, effects)
- **Asset Cleanup**: Clean up unused assets between scenes
- **Component Management**: Proper disposal of ECS components

### Loading Times

- **Initial load**: <3 seconds on broadband
- **Scene transitions**: <500ms
- **User feedback**: Use loading screens for user feedback
- **Progressive loading**: Load critical assets first

### Performance Optimization Strategies

- **Object Pooling**: Use for bullets, enemies, and effects
- **Sprite Atlases**: Combine small sprites into texture atlases (future)
- **Audio Sprites**: Use audio sprites for sound effects
- **Efficient Collision**: Use physics bodies appropriately
- **Update Optimization**: Only update active/visible objects
- **Memory Management**: Regular cleanup of destroyed entities

## Deployment Considerations

### Build Optimization

- **Minification**: Minify JavaScript and CSS
- **Asset Optimization**: Optimize images and audio files
- **HTTP Requests**: Use texture atlases to reduce HTTP requests
- **Caching**: Implement proper caching headers
- **PWA Features**: Consider Progressive Web App features

### Browser Compatibility

- **Testing**: Test across target browsers and versions
- **WebGL Fallbacks**: Provide WebGL fallbacks where necessary
- **Touch Input**: Handle touch input for mobile devices
- **Viewport Scaling**: Consider viewport scaling for different screen sizes
- **Audio Policies**: Handle browser autoplay policies

### Production Safety

- **Environment Variables**: Validate all environment variables
- **Error Handling**: Implement comprehensive error handling
- **Logging**: Disable debug logging in production
- **Security**: Never expose sensitive configuration in client code
- **Fallbacks**: Provide fallback configurations for all settings

## Scene Management

### Scene Architecture

- Use Phaser's scene scopeName for different game states
- Implement proper scene transitions and cleanup
- Pass data between scenes using scene.start() parameters
- Handle scene pausing/resuming for game states
- Bootstrap environment configuration in BootScene

### Scene Flow

```
BootScene (Environment setup)
    ↓
PreloaderScene (Asset loading)
    ↓
MainMenuScene (Main menu)
    ↓
GameScene (Primary gameplay)
    ↓
GameOverScene (Results and restart)
```

### Scene Responsibilities

- **BootScene**: Environment configuration, initial setup
- **PreloaderScene**: Asset loading with progress indication
- **MainMenuScene**: Menu navigation, settings, save/load
- **GameScene**: Core gameplay, entity management, systems
- **GameOverScene**: Score display, statistics, restart options

## Development Graphics Strategy

### Shape Creation Patterns

```javascript
// Player (blue rectangle)
const player = scene.add.rectangle(x, y, 64, 64, 0x0099ff);

// Enemy (red rectangle, varying sizes)
const enemy = scene.add.rectangle(x, y, 32, 32, 0xff0000);

// Projectile (yellow rectangle)
const bullet = scene.add.rectangle(x, y, 8, 16, 0xffff00);

// Power-up (green diamond using polygon)
const points = [0, -12, 12, 0, 0, 12, -12, 0];
const powerUp = scene.add.polygon(x, y, points, 0x00ff00);

// Background (solid color or gradient)
scene.cameras.main.setBackgroundColor(0x000033);
```

### Easy Transition to Production Graphics

Development shapes are designed for easy transition to final graphics:

```javascript
// Development
const player = scene.add.rectangle(x, y, 64, 64, 0x0099ff);

// Production (same API, just change method and add texture)
const player = scene.add.sprite(x, y, 'player-ship-texture');
```

### Graphics Development Guidelines

- **Consistent Sizing**: Use consistent size ratios between entity types
- **Clear Distinction**: Ensure entities are easily distinguishable by color/shape
- **Performance**: Shapes are faster to render than textured sprites during development
- **Easy Replacement**: Design for seamless transition to production graphics
- **Debug Visualization**: Use shapes for debug overlays and collision visualization

---

For architectural details and scopeName design patterns, see [ARCHITECTURE.md](ARCHITECTURE.md).

For development workflow and testing strategies, see [DEVELOPMENT.md](DEVELOPMENT.md).

For detailed code examples and implementation patterns, see [EXAMPLES.md](EXAMPLES.md).