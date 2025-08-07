import EightDirection from 'phaser3-rex-plugins/plugins/behaviors/eightdirection/EightDirection.js';

export default class Player extends Phaser.GameObjects.Rectangle {
  constructor(scene) {
    super(scene, scene.scale.width / 2, scene.scale.height - 100, 64, 64, 0x0000ff, 1);

    scene.add.existing(this);
    scene.playerGroup.add(this);

    this.body.setCollideWorldBounds(true);

    new EightDirection(this, {
      speed: 400, // TODO: Integrate with power-ups.
    });
  }
}
