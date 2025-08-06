# Logger System Usage (Updated with Auto-Initialization)

## Core Principle:
**NEVER use console.log()** - Always use the Logger scopeName for all debugging output.

## Auto-Initialization Feature (NEW):
The Logger now **automatically initializes** on first use - no manual init() required!

```javascript
// ✅ NEW: No manual initialization needed
Logger.debug('Player spawned at', x, y);    // Auto-initializes on first call
Logger.info('Game started');                // Already initialized
Logger.warn('Low health warning');          // Already initialized
Logger.error('Failed to save data');        // Already initialized

// ✅ OLD: Still supported for backward compatibility
// Logger auto-initializes on first use - no init() needed
Logger.debug('Player spawned at', x, y);
```

## Logger Levels:
```javascript
Logger.debug('Player spawned at', x, y);    // Development debugging (requires debugMode=true)
Logger.info('Game started');                // General information
Logger.warn('Low health warning');          // Warning conditions
Logger.error('Failed to save data');        // Error conditions
```

## Environment Configuration:
The Logger scopeName auto-detects environment configuration:
```bash
VITE_DEBUG_MODE=true        # Enables debug output and performance methods
VITE_LOG_LEVEL=debug        # Sets minimum log level (debug/info/warn/error)
```

## Enhanced Features:

### Timestamp Integration
All log messages now include timestamps:
```javascript
Logger.info('Game started');
// Output: ℹ️ 14:30:25 [INFO] Game started
```

### Performance Methods
```javascript
Logger.time('level-load');          // Start timer (debug mode only)
// ... game loading logic ...
Logger.timeEnd('level-load');       // End timer (debug mode only)

Logger.group('Entity Updates');     // Group related logs (debug mode only)
Logger.debug('Player updated');
Logger.debug('Enemy updated');
Logger.groupEnd();                  // End group (debug mode only)

Logger.table([                      // Table display (debug mode only)
  { entity: 'Player', health: 100 },
  { entity: 'Enemy', health: 50 }
]);
```

### Error Handling
Robust error handling during initialization:
```javascript
// Logger gracefully handles environment access failures
// Falls back to safe defaults (debugMode: false, logLevel: 'info')
Logger.error('This will work even if environment setup fails');
```

## Updated Usage Throughout Codebase:

### No Manual Initialization Required
```javascript
// ✅ OLD pattern (still works)
class GameScene extends Phaser.Scene {
  create() {
    // Logger auto-initializes - no manual initialization needed
    Logger.info('GameScene created');
  }
}

// ✅ NEW pattern (recommended)
class GameScene extends Phaser.Scene {
  create() {
    Logger.info('GameScene created'); // Auto-initializes
  }
}
```

### BaseEntity Creation
```javascript
class Player extends BaseEntity {
  constructor(scene, x, y) {
    super(scene, x, y, 64, 64, 0x0099ff);
    Logger.debug('Created player at', x, y); // Auto-initializes if needed
  }
}
```

### System Updates
```javascript
class MovementSystem extends BaseSystem {
  update(entities, delta) {
    Logger.debug('Movement scopeName updating', entities.length, 'entities'); // Auto-initializes
    // ... scopeName logic ...
  }
}
```

### Error Logging
```javascript
class SaveManager {
  static save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      Logger.info('Saved data to localStorage:', key); // Auto-initializes
    } catch (error) {
      Logger.error('Failed to save data:', error); // Auto-initializes
    }
  }
}
```

## Environment Handling:

### Dual Environment Support
- **Vite Development**: Automatically detects `import.meta.env.VITE_*` variables
- **Node.js Fallback**: Falls back to `process.env` if import.meta unavailable
- **Error Recovery**: Uses safe defaults if both environment methods fail

### Production Safety:
- Automatically disabled debug output in production builds
- No performance impact when debug mode is disabled
- Graceful degradation if environment access fails

## Testing Integration:
Comprehensive test suite with 32 test cases covering:
- Auto-initialization behavior
- Environment variable parsing
- Log level filtering
- Performance method functionality
- Error handling and edge cases
- Message formatting and timestamps

## Migration Guide:

### For Existing Code:
```javascript
// ✅ No changes needed - existing code continues to work

Logger.debug('This still works exactly the same');

// ✅ Can simplify by removing manual init() calls
//  // <- Can remove this line
Logger.debug('This will auto-initialize');
```

### For New Code:
```javascript
// ✅ Recommended: Use Logger directly without init()
Logger.info('New feature implemented');
Logger.debug('Debug info for', someVariable);
Logger.error('Error occurred:', error);
```

## Key Benefits:
1. **Simplified Usage**: No manual initialization required
2. **Backward Compatible**: Existing code continues to work unchanged
3. **Robust Error Handling**: Graceful fallback if environment access fails
4. **Enhanced Debugging**: Timestamps, performance methods, and grouping
5. **Comprehensive Testing**: Full test coverage ensures reliability

The Logger scopeName is now more robust, user-friendly, and feature-rich while maintaining full backward compatibility with existing code.