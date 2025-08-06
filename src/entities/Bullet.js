export default class Bullet extends Phaser.GameObjects.Rectangle {
  constructor(scene, x, y, direction) {
    super(scene, x, y, 6, 12, 0xffff00, 1);

    scene.add.existing(this);
    scene.playerProjectileGroup.add(this);

    this.body.setCollideWorldBounds(false);
    this.body.enable = true;
    this.body.setVelocity(direction.x * 300, direction.y * 300);
  }
}
