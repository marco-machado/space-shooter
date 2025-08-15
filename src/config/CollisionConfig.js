/**
 * Collision system configuration
 * Contains collision groups, categories, matrix, cooldowns, and effects
 * @module CollisionConfig
 */

/**
 * Collision groups for Phaser Arcade Physics
 * @constant {Object}
 */
export const CollisionGroups = {
  PLAYER: 'player',
  ENEMY: 'enemy',
  PLAYER_PROJECTILE: 'playerProjectile',
  ENEMY_PROJECTILE: 'enemyProjectile',
  POWERUP: 'powerup',
};

/**
 * Collision categories (bitmasks for Phaser physics)
 * @constant {Object}
 */
export const CollisionCategories = {
  PLAYER: 0x0001, // 1
  ENEMY: 0x0002, // 2
  PLAYER_PROJECTILE: 0x0004, // 4
  ENEMY_PROJECTILE: 0x0008, // 8
  POWERUP: 0x0010, // 16
  OBSTACLE: 0x0020, // 32
};

/**
 * Collision matrix - defines what collides with what
 * @constant {Object}
 */
export const CollisionMatrix = {
  [CollisionGroups.PLAYER]: [
    CollisionCategories.ENEMY,
    CollisionCategories.ENEMY_PROJECTILE,
    CollisionCategories.POWERUP,
  ],
  [CollisionGroups.ENEMY]: [
    CollisionCategories.PLAYER,
    CollisionCategories.PLAYER_PROJECTILE,
  ],
  [CollisionGroups.PLAYER_PROJECTILE]: [CollisionCategories.ENEMY],
  [CollisionGroups.ENEMY_PROJECTILE]: [CollisionCategories.PLAYER],
};

/**
 * Collision cooldown settings (in milliseconds)
 * @constant {Object}
 */
export const CollisionCooldowns = {
  PLAYER_ENEMY: 1000, // 1 second invulnerability after enemy contact
  PLAYER_PROJECTILE: 500, // 0.5 second invulnerability after projectile hit
  ENEMY_PROJECTILE: 100, // 0.1 second for enemy projectile hits (brief)
  PLAYER_OBSTACLE: 500, // 0.5 second after obstacle collision
  ENEMY_OBSTACLE: 200, // 0.2 second for enemies hitting obstacles
};

/**
 * Complete collision configuration object
 * @constant {Object}
 */
export const CollisionConfig = {
  GROUPS: CollisionGroups,
  CATEGORIES: CollisionCategories,
  MATRIX: CollisionMatrix,
  COOLDOWNS: CollisionCooldowns,
};

export default CollisionConfig;