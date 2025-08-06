import { getEventBus } from '@/event-bus/EventBus.js';

export default class BaseAdapter {
  constructor(scene) {
    if (new.target === BaseAdapter) {
      throw new Error('BaseAdapter is abstract and cannot be instantiated directly');
    }

    if (scene === null || !(scene instanceof Phaser.Scene)) {
      throw new Error('Adapter requires a Phaser.Scene object');
    }

    this.scene = scene;

    this.eventBus = getEventBus();
  }

  destroy() {
    this.scene = null;
    this.eventBus = null;
  }
}
