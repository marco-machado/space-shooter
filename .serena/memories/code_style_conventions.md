# Code Style and Conventions

## ESLint Configuration:
- Use ESLint recommended rules with Prettier integration
- **No console.log()**: Enforce Logger scope usage instead of console methods
- ES6+ rules for modern JavaScript patterns
- Phaser-specific custom rules for GameObject lifecycle
- Error prevention for common game development mistakes

## Prettier Configuration:
- **2-space indentation**: Clean, readable code structure
- **Single quotes**: Consistent string quoting
- **Trailing commas**: Easier git diffs and array management
- **Line length**: 100 characters for readability
- Auto-format on save

## JavaScript/ES6+ Conventions:
- Use ES6 modules for all imports/exports
- Prefer `const`/`let` over `var`
- Use arrow functions for short callbacks
- Implement proper error handling with try/catch
- Use meaningful variable and function names
- **No console.log()**: Always use Logger scopeName instead
- **Async/await**: Prefer over Promise chains for readability

## Naming Conventions:
- **Classes**: PascalCase (e.g., `MovementSystem`, `HealthComponent`)
- **Functions/Variables**: camelCase (e.g., `updatePosition`, `currentHealth`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_ENEMIES`, `WEAPON_TYPES`)
- **Files**: PascalCase for classes, camelCase for utilities

## Logger BaseSystem Usage:
```javascript
// ALWAYS use Logger instead of console
Logger.debug('Player spawned at', x, y);
Logger.info('Game started');
Logger.warn('Low health warning');
Logger.error('Failed to save data');
```

## Component Patterns:
- **Entities**: Extend Phaser.GameObjects.Rectangle/Sprite
- **Components**: Pure data containers (no methods)
- **Systems**: Handle all logic and updates
- Use Phaser's EventEmitter for component communication
