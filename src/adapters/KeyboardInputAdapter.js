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
      weaponFiring: false,
    };

    // Movement key mappings
    this.movementKeys = {
      KeyW: { x: 0, y: -1 },
      KeyS: { x: 0, y: 1 },
      KeyA: { x: -1, y: 0 },
      KeyD: { x: 1, y: 0 },
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
    };
  }

  /**
   * Activates the input handling by binding keyboard events to the corresponding event handlers.
   *
   * @return {void} Does not return a value.
   */
  activate() {
    // Bind keyboard events
    this.scene.input.keyboard.on(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, this.onKeyDown, this);
    this.scene.input.keyboard.on(Phaser.Input.Keyboard.Events.ANY_KEY_UP, this.onKeyUp, this);
  }

  /**
   * Handles the `keydown` event triggered by the user pressing a key.
   * Manages input state for game controls and emits events based on the specific key pressed.
   *
   * @param {KeyboardEvent} event - The keyboard event containing data about the pressed key.
   * @return {void} - This method does not return a value.
   */
  onKeyDown(event) {
    const keyCode = event.code;

    // Avoid duplicate key down events
    if (this.inputState.keys.has(keyCode)) {
      Logger.scope('KeyboardInputAdapter').warn('Duplicate key down event');
      return;
    }

    this.inputState.keys.add(keyCode);

    // Handle ESC key for pause toggle (always allowed, even when paused)
    if (keyCode === 'Escape') {
      this.eventBus.emit(EventTypes.GAME_PAUSE_TOGGLE, {
        keyCode,
        timestamp: performance.now(),
      });
      return;
    }

    if (this.scene.gameStateManager?.isPaused) {
      return;
    }

    // Player movement
    if (this.movementKeys[keyCode]) {
      this.updateMovementState();
      this.eventBus.emit(EventTypes.PLAYER_INPUT, {
        action: 'movement',
        timestamp: performance.now(),
        direction: this.inputState.movement,
        keys: Array.from(this.inputState.keys),
        intensity: 1.0,
      });
    }

    // Weapon firing
    if (keyCode === 'Space') {
      if (!this.inputState.weaponFiring) {
        this.inputState.weaponFiring = true;
        this.eventBus.emit(EventTypes.WEAPON_FIRED, {
          state: 'start',
          weapon: 'current',
        });
      }
    }

    // Emit raw key event for other systems
    this.eventBus.emit(EventTypes.INPUT_KEY_DOWN, {
      keyCode,
      originalEvent: event,
    });
  }

  onKeyUp(event) {
    const keyCode = event.code;

    if (!this.inputState.keys.has(keyCode)) {
      return;
    }

    this.inputState.keys.delete(keyCode);

    // ESC key up events don't need special handling - pause toggle happens on key down
    if (keyCode === 'Escape') {
      return;
    }

    if (this.scene.gameStateManager?.isPaused) {
      return;
    }

    // Player movement
    if (this.movementKeys[keyCode]) {
      this.updateMovementState();
      this.eventBus.emit(EventTypes.PLAYER_INPUT, {
        action: 'movement',
        timestamp: performance.now(),
        direction: this.inputState.movement,
        keys: Array.from(this.inputState.keys),
        intensity: 1.0,
      });
    }

    // Handle weapon firing
    if (keyCode === 'Space') {
      if (this.inputState.weaponFiring) {
        this.inputState.weaponFiring = false;
        this.eventBus.emit(EventTypes.WEAPON_FIRED, {
          state: 'stop',
          weapon: 'current',
        });
      }
    }

    // Emit raw key event for other systems
    this.eventBus.emit(EventTypes.INPUT_KEY_UP, {
      keyCode,
      originalEvent: event,
    });
  }

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
  }

  destroy() {
    if (this.scene && this.scene.input && this.scene.input.keyboard) {
      this.scene.input.keyboard.off(
        Phaser.Input.Keyboard.Events.ANY_KEY_DOWN,
        this.onKeyDown,
        this
      );
      this.scene.input.keyboard.off(Phaser.Input.Keyboard.Events.ANY_KEY_UP, this.onKeyUp, this);
    }

    this.inputState.keys.clear();
    super.destroy();
  }
}
