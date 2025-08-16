import HealthComponent from '@/components/Health.js';
import { GameConfig } from '@/config/GameConfig.js';

export function playerFactory(playerGroup) {
  const scene = playerGroup.scene;

  const player = scene.add.rectangle(
    scene.scale.width / 2,
    scene.scale.height - GameConfig.PLAYER.START_Y_OFFSET,
    GameConfig.PLAYER.WIDTH,
    GameConfig.PLAYER.HEIGHT,
    GameConfig.PLAYER.COLOR,
  );

  playerGroup.add(player);

  player.body.setCollideWorldBounds(true);

  // Add health component
  player.health = new HealthComponent(player, 100);

  /**
   * Update player movement based on keyboard input.
   * @param {Phaser.Types.Input.Keyboard.CursorKeys} cursors - Cursor keys object
   * @param {number} _delta - Time delta in milliseconds (unused)
   * @returns {void}
   */
  player.update = function (cursors, _delta) {
    if (!cursors || !this.body) return;

    const speed = GameConfig.PLAYER.SPEED;
    let velocityX = 0;
    let velocityY = 0;

    // Calculate desired movement
    if (cursors.left.isDown) {
      velocityX = -speed;
    } else if (cursors.right.isDown) {
      velocityX = speed;
    }

    if (cursors.up.isDown) {
      velocityY = -speed;
    } else if (cursors.down.isDown) {
      velocityY = speed;
    }

    // Normalize diagonal movement
    if (velocityX !== 0 && velocityY !== 0) {
      const normalizedSpeed = speed * 0.707; // sqrt(2)/2 ≈ 0.707
      velocityX = velocityX > 0 ? normalizedSpeed : -normalizedSpeed;
      velocityY = velocityY > 0 ? normalizedSpeed : -normalizedSpeed;
    }

    // Apply velocity
    this.body.setVelocity(velocityX, velocityY);
  };

  /**
   * Destroy the player and clean up resources
   * @returns {void}
   */
  player.destroy = function () {
    if (this.health) {
      this.health.destroy();
      this.health = null;
    }
  };

  return player;
}
