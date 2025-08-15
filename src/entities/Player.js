import { GameConfig } from '@/config/GameConfig.js';

export function playerFactory(playerGroup) {
  const scene = playerGroup.scene;

  const player = scene.add.triangle(scene.scale.width/2, scene.scale.height - 100, 0, -24, -24, 24, 24, 24, 0xff0000);

  playerGroup.add(player);

  player.body.setCollideWorldBounds(true);

  /**
   * Update player movement based on keyboard input.
   * @param {Phaser.Types.Input.Keyboard.CursorKeys} cursors - Cursor keys object
   * @param {number} delta - Time delta in milliseconds
   * @returns {void}
   */
  player.update = function(cursors, delta) {
    if (!cursors || !this.body) return;

    const speed = GameConfig.PLAYER.SPEED;
    
    // Reset velocity
    this.body.setVelocity(0);

    // Horizontal movement
    if (cursors.left.isDown) {
      this.body.setVelocityX(-speed);
    } else if (cursors.right.isDown) {
      this.body.setVelocityX(speed);
    }

    // Vertical movement
    if (cursors.up.isDown) {
      this.body.setVelocityY(-speed);
    } else if (cursors.down.isDown) {
      this.body.setVelocityY(speed);
    }
  };

  return player;
}
