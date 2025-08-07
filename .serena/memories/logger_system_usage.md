# Logger BaseSystem Usage

## Core Principle:
**NEVER use console.log()** - Always use the Logger scopeName for all debugging output.

## Logger Levels:
```javascript
Logger.debug('Player spawned at', x, y);    // Development debugging
Logger.info('Game started');                // General information
Logger.warn('Low health warning');          // Warning conditions
Logger.error('Failed to save data');        // Error conditions
```

## Environment Configuration:
The Logger scopeName is environment-aware through .env variables:
```bash
VITE_DEBUG_MODE=true        # Enables debug output
VITE_LOG_LEVEL=debug        # Sets minimum log level
VITE_PHYSICS_DEBUG=true     # Enables physics debugging
```

## Logger Implementation Pattern:
```javascript
class Logger {
    static init() {
        this.debugMode = import.meta.env.VITE_DEBUG_MODE === 'true';
        this.logLevel = import.meta.env.VITE_LOG_LEVEL || 'info';
        this.levels = { debug: 0, info: 1, warn: 2, error: 3 };
    }
    
    static debug(message, ...args) {
        if (this.debugMode && this.shouldLog('debug')) {
            console.log(`🔍 [DEBUG] ${message}`, ...args);
        }
    }
    
    static info(message, ...args) {
        if (this.shouldLog('info')) {
            console.info(`ℹ️ [INFO] ${message}`, ...args);
        }
    }
    
    static shouldLog(level) {
        return this.levels[level] >= this.levels[this.logLevel];
    }
}
```

## Usage Throughout Codebase:
- **BaseEntity creation**: `Logger.debug('Created player at', x, y)`
- **BaseSystem updates**: `Logger.debug('Movement scopeName updated', entityCount, 'entities')`
- **State changes**: `Logger.info('Game state changed to', newState)`
- **Errors**: `Logger.error('Failed to load save data', error)`
- **Performance**: `Logger.debug('Frame time:', deltaTime, 'ms')`

## Production Safety:
- Automatically disabled in production builds
- No performance impact when disabled
- Clear formatting with emoji prefixes for easy identification