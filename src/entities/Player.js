import HealthComponent from '@/components/Health.js';
import { GameConfig } from '@/config/GameConfig.js';

/**
 * Creates a new player entity with movement controls and health component.
 * @param {Phaser.Physics.Arcade.Group} playerGroup - The physics group to add the player to
 * @returns {Phaser.GameObjects.Rectangle} The created player object with update and destroy methods
 */
export function playerFactory(playerGroup) {
  const scene = playerGroup.scene;

  const player = scene.add.rectangle(
    scene.scale.width / 2,
    scene.scale.height - GameConfig.PLAYER.START_Y_OFFSET,
    GameConfig.PLAYER.WIDTH,
    GameConfig.PLAYER.HEIGHT,
    GameConfig.PLAYER.COLOR,
  );

  // playerGroup adds a physics body to player
  playerGroup.add(player);

  player.body.setCollideWorldBounds(true);

  // Add health component
  player.health = new HealthComponent(player, GameConfig.PLAYER.HEALTH);

  /**
   * Update player movement based on keyboard input.
   * @param {Phaser.Types.Input.Keyboard.CursorKeys} cursors - Cursor keys object
   * @param {number} _delta - Time delta in milliseconds (unused)
   * @returns {void}
   */
  player.update = function (cursors, _delta) {
    // Enhanced input validation
    if (!cursors || !this.body) return;
    if (!cursors.left || !cursors.right || !cursors.up || !cursors.down) return;
    if (typeof cursors.left.isDown !== 'boolean' || 
        typeof cursors.right.isDown !== 'boolean' || 
        typeof cursors.up.isDown !== 'boolean' || 
        typeof cursors.down.isDown !== 'boolean') return;

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
