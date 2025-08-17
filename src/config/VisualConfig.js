/**
 * Visual configuration for colors, depths, and visual effects
 * Contains all visual styling and effect settings for the game
 * @module VisualConfig
 */

/**
 * Color palette for game elements (development phase)
 * @constant {Object}
 */
export const Colors = {
  PLAYER: 0x0099ff, // Blue
  ENEMY: 0xff0000, // Red
  ENEMY_BOSS: 0xcc0000, // Dark red
  PROJECTILE_PLAYER: 0xffff00, // Yellow
  PROJECTILE_ENEMY: 0xff8800, // Orange
  POWERUP_HEALTH: 0x00ff00, // Green
  POWERUP_WEAPON: 0x8800ff, // Purple
  UI_TEXT: 0xffffff, // White
  UI_BACKGROUND: 0x333333, // Dark gray
  BACKGROUND: 0x000011, // Dark space blue
};

/**
 * Render depth layers for proper z-ordering
 * @constant {Object}
 */
export const Depths = {
  BACKGROUND: -100,
  POWERUPS: 10,
  ENEMIES: 20,
  PLAYER: 30,
  PROJECTILES: 40,
  PARTICLES: 50,
  UI: 100,
  DEBUG: 1000,
};

/**
 * Visual effects configuration for collisions and events
 * @constant {Object}
 */
export const VisualEffects = {
  SCREEN_SHAKE: {
    PLAYER_HIT: { duration: 300, intensity: 8 },
    ENEMY_DESTROYED: { duration: 150, intensity: 4 },
  },
  FLASH_EFFECT: {
    PLAYER_HIT: { color: 0xff0000, duration: 200 }, // Red flash
    ENEMY_HIT: { color: 0xffffff, duration: 100 }, // White flash
    POWERUP_COLLECTED: { color: 0x00ff00, duration: 150 }, // Green flash
  },
  PARTICLES: {
    EXPLOSION_SMALL: { count: 15, speed: 100, life: 500 },
    EXPLOSION_LARGE: { count: 30, speed: 150, life: 800 },
    SPARK_EFFECT: { count: 8, speed: 80, life: 300 },
  },
};

/**
 * Complete visual configuration object
 * @constant {Object}
 */
export const VisualConfig = {
  COLORS: Colors,
  DEPTHS: Depths,
  EFFECTS: VisualEffects,
};

export default VisualConfig;
