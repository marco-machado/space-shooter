import BaseAdapter from '@/adapters/BaseAdapter.js';
import Logger from '@/utils/Logger.js';
import { EventTypes } from '@/event-bus/EventTypes.js';

export default class InputAdapter extends BaseAdapter {
  activate() {
    // Bind keyboard events
    this.scene.input.keyboard.on(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, this.onKeyDown, this);

    this.eventBus.on(EventTypes.INPUT_KEY_DOWN, this.onEventBusKeyDown, this);
  }

  onKeyDown(event) {
    Logger.debug('InputAdapter.onKeyDown()', event);

    this.eventBus.emit(EventTypes.INPUT_KEY_DOWN, event); // TODO: Setup a translator?
  }

  onEventBusKeyDown(event) {
    Logger.debug('InputAdapter.onEventBusKeyDown()', event);
  }
}
