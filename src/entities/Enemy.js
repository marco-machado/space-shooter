import ConfigManager from '@/config/ConfigManager.js';

export function scoutFactory(enemyGroup) {
  const scout = enemyGroup.scene.add.circle(
    getRandomSpawnX(enemyGroup.scene),
    50, //spawnOffsetY
    15,
    0x0000ff,
  );
  enemyGroup.add(scout);
  scout.body.setCollideWorldBounds(false);

  scout.setDepth(ConfigManager.getConstants().DEPTHS.ENEMIES);

  const config = {
    scoutMinSpeed: 50,
    scoutMaxSpeed: 150,
    scoutRadius: 20,
    scoutHealth: 1,
    scoutDamage: 1,
    scoutScore: 10,
  };

  const speed =
    Math.random() * (config.scoutMaxSpeed - config.scoutMinSpeed) + config.scoutMinSpeed;

  scout.body.setVelocityY(speed);

  return scout;
}

const spawnMarginX = 50;

function getRandomSpawnX(scene) {
  const minX = spawnMarginX;
  const maxX = scene.scale.width - spawnMarginX;
  return Math.random() * (maxX - minX) + minX;
}
