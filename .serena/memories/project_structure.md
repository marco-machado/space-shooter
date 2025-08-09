# Project Structure

## Current Structure:
```
space-shooter/
├── CLAUDE.md              # Development guidelines
├── PRD.md                # Product requirements document
├── package.json          # Dependencies and scripts
├── index.html            # Entry point HTML
├── src/
│   ├── main.js           # Currently: Vite template (needs Phaser setup)
│   ├── style.css         # Basic styles
│   ├── counter.js        # Template file (to be removed)
│   └── javascript.svg    # Template asset (to be removed)
└── public/
    └── vite.svg          # Template asset
```

## Target Structure (from CLAUDE.md):
```
space-shooter/
├── .env                   # Environment variables (not in git)
├── .env.example          # Template for environment setup
├── .eslintrc.js          # ESLint configuration
├── .prettierrc           # Prettier configuration
├── vite.config.js        # Vite configuration with Vitest
├── package.json          # Dependencies and scripts
├── index.html            # Entry point HTML
├── src/
│   ├── main.js           # Game initialization and Phaser config
│   ├── config/           # Game configuration
│   ├── core/             # Core systems (Logger, AssetManager)
│   ├── scenes/           # Phaser scenes
│   ├── entities/         # Game entities (game-based)
│   ├── components/       # game components (data classes)
│   ├── systems/          # game systems (game logic)
│   ├── graphics/         # Development graphics generators
│   └── utils/            # Utility functions
├── tests/                # Basic test files (minimal coverage)
└── public/
    └── assets/           # Static assets (sounds, fonts)
```

## Key Directories:
- **src/scenes/**: BootScene, PreloaderScene, MainMenuScene, GameScene, GameOverScene
- **src/entities/**: BaseEntity.js (base), Player.js, Enemy.js, Projectile.js, PowerUp.js
- **src/components/**: Health, Weapon, Movement, Collision, Render components
- **src/systems/**: Movement, Weapon, Collision, EnemySpawn, Progression, Audio systems
- **src/utils/**: MathUtils, ObjectPool, SaveManager