import HealthComponent from '@/components/Health.js';
import ConfigManager from '@/config/ConfigManager.js';

/**
 * Factory function to create a scout enemy.
 * @param {Phaser.Physics.Arcade.Group} enemyGroup - The physics group to add the enemy to
 * @returns {Phaser.GameObjects.Arc} The created scout enemy
 */
export function scoutFactory(enemyGroup) {
  const constants = ConfigManager.getConstants();
  const scoutConfig = constants.ENEMIES.SCOUT;
  const spawnConfig = constants.ENEMIES.SPAWN;

  const scout = enemyGroup.scene.add.circle(
    getRandomSpawnX(enemyGroup.scene),
    spawnConfig.OFFSET_Y,
    scoutConfig.RADIUS,
    scoutConfig.COLOR,
  );
  enemyGroup.add(scout);
  scout.body.setCollideWorldBounds(false);

  scout.setDepth(constants.DEPTHS.ENEMIES);

  const speed =
    Math.random() * (scoutConfig.SPEED_MAX - scoutConfig.SPEED_MIN) + scoutConfig.SPEED_MIN;

  scout.body.setVelocityY(speed);

  addHealthToEnemy(scout, scoutConfig.HEALTH);

  scout.score = scoutConfig.SCORE; // TODO: I don't like this

  return scout;
}

function getRandomSpawnX(scene) {
  const spawnMarginX = ConfigManager.getConstants().ENEMIES.SPAWN.MARGIN_X;
  const minX = spawnMarginX;
  const maxX = scene.scale.width - spawnMarginX;
  return Math.random() * (maxX - minX) + minX;
}

/**
 * Add health component to an enemy entity
 * @param {Object} enemy - The enemy entity to add health to
 * @param {number} maxHealth - Maximum health value
 * @returns {Object} The enemy with health component attached
 */
function addHealthToEnemy(enemy, maxHealth) {
  enemy.health = new HealthComponent(enemy, maxHealth);
  return enemy;
}
