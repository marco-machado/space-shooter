import BaseAdapter from '@/adapters/BaseAdapter.js';
import Logger from '@/utils/Logger.js';
import { EventTypes } from '@/event-bus/EventTypes.js';

export default class KeyboardInputAdapter extends BaseAdapter {
  constructor(scene) {
    super(scene);
    
    // Input state tracking
    this.inputState = {
      movement: { x: 0, y: 0 },
      keys: new Set(),
      weaponFiring: false
    };
    
    // Movement key mappings
    this.movementKeys = {
      'KeyW': { x: 0, y: -1 },
      'KeyS': { x: 0, y: 1 },
      'KeyA': { x: -1, y: 0 },
      'KeyD': { x: 1, y: 0 },
      'ArrowUp': { x: 0, y: -1 },
      'ArrowDown': { x: 0, y: 1 },
      'ArrowLeft': { x: -1, y: 0 },
      'ArrowRight': { x: 1, y: 0 }
    };
    
    Logger.debug('[KeyboardInputAdapter] Initialized with movement key mappings');
  }

  activate() {
    // Bind keyboard events
    this.scene.input.keyboard.on(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, this.onKeyDown, this);
    this.scene.input.keyboard.on(Phaser.Input.Keyboard.Events.ANY_KEY_UP, this.onKeyUp, this);
    
    Logger.debug('[KeyboardInputAdapter] Event listeners activated');
  }

  onKeyDown(event) {
    const keyCode = event.code;
    
    // Avoid duplicate key down events
    if (this.inputState.keys.has(keyCode)) {
      return;
    }
    
    this.inputState.keys.add(keyCode);
    Logger.debug(`[KeyboardInputAdapter] Key down: ${keyCode}`);

    // Handle movement keys
    if (this.movementKeys[keyCode]) {
      this.updateMovementState();
      this.emitPlayerInput('movement', {
        direction: this.inputState.movement,
        keys: Array.from(this.inputState.keys),
        intensity: 1.0
      });
    }
    
    // Handle weapon firing
    if (keyCode === 'Space') {
      if (!this.inputState.weaponFiring) {
        this.inputState.weaponFiring = true;
        this.emitPlayerInput('weapon_fire', {
          state: 'start',
          weapon: 'current'
        });
      }
    }

    // Emit raw key event for other systems
    this.eventBus.emit(EventTypes.INPUT_KEY_DOWN, {
      keyCode,
      originalEvent: event
    });
  }

  onKeyUp(event) {
    const keyCode = event.code;
    
    if (!this.inputState.keys.has(keyCode)) {
      return;
    }
    
    this.inputState.keys.delete(keyCode);
    Logger.debug(`[KeyboardInputAdapter] Key up: ${keyCode}`);

    // Handle movement keys
    if (this.movementKeys[keyCode]) {
      this.updateMovementState();
      this.emitPlayerInput('movement', {
        direction: this.inputState.movement,
        keys: Array.from(this.inputState.keys),
        intensity: 1.0
      });
    }
    
    // Handle weapon firing
    if (keyCode === 'Space') {
      if (this.inputState.weaponFiring) {
        this.inputState.weaponFiring = false;
        this.emitPlayerInput('weapon_fire', {
          state: 'stop',
          weapon: 'current'
        });
      }
    }

    // Emit raw key event for other systems
    this.eventBus.emit(EventTypes.INPUT_KEY_UP, {
      keyCode,
      originalEvent: event
    });
  }
  
  /**
   * Update movement state based on currently pressed keys
   */
  updateMovementState() {
    let x = 0;
    let y = 0;
    
    // Calculate movement direction from all pressed movement keys
    for (const keyCode of this.inputState.keys) {
      if (this.movementKeys[keyCode]) {
        const direction = this.movementKeys[keyCode];
        x += direction.x;
        y += direction.y;
      }
    }
    
    // Normalize diagonal movement
    if (x !== 0 && y !== 0) {
      const length = Math.sqrt(x * x + y * y);
      x /= length;
      y /= length;
    }
    
    this.inputState.movement = { x, y };
    Logger.debug(`[KeyboardInputAdapter] Movement state updated: x=${x.toFixed(2)}, y=${y.toFixed(2)}`);
  }
  
  /**
   * Emit structured player input event
   * @param {string} action - Input action type
   * @param {Object} data - Action-specific data
   */
  emitPlayerInput(action, data) {
    this.eventBus.emit(EventTypes.PLAYER_INPUT, {
      action,
      timestamp: performance.now(),
      ...data
    });
    
    Logger.debug(`[KeyboardInputAdapter] Emitted PLAYER_INPUT: ${action}`, data);
  }
  
  /**
   * Clean up event listeners
   */
  destroy() {
    if (this.scene && this.scene.input && this.scene.input.keyboard) {
      this.scene.input.keyboard.off(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, this.onKeyDown, this);
      this.scene.input.keyboard.off(Phaser.Input.Keyboard.Events.ANY_KEY_UP, this.onKeyUp, this);
    }
    
    this.inputState.keys.clear();
    super.destroy();
    
    Logger.debug('[KeyboardInputAdapter] Destroyed and cleaned up');
  }
}
