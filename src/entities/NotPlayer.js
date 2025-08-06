export default class NotPlayer extends Phaser.GameObjects.Rectangle {
  constructor(scene) {
    super(scene, scene.scale.width / 2, 100, 48, 48, 0xff0000, 1);

    scene.add.existing(this);
    scene.enemyGroup.add(this);

    this.body.setCollideWorldBounds(false);
  }
}
