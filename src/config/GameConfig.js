/**
 * Core game configuration settings
 * Contains basic game dimensions, progression settings, and scene definitions
 * @module GameConfig
 */

/**
 * Core game settings and constants
 * @constant {Object}
 */
export const GameConfig = {
  // Game dimensions
  GAME_WIDTH: 800,
  GAME_HEIGHT: 800,

  // Player settings
  PLAYER: {
    SPEED: 200, // pixels per second
    FIRE_RATE: 800, // milliseconds between shots when holding fire button
    WIDTH: 64,
    HEIGHT: 64,
    COLOR: 0x0099ff,
    START_Y_OFFSET: 100,
  },

  // Projectile settings
  PROJECTILES: {
    PLAYER: {
      SPEED: 600,
      WIDTH: 6,
      HEIGHT: 16,
      COLOR: 0xffff00,
      DAMAGE: 1,
    },
    ENEMY: {
      SPEED: 200,
      WIDTH: 3,
      HEIGHT: 8,
      COLOR: 0xff8800,
      DAMAGE: 1,
    },
  },

  // Enemy settings
  ENEMIES: {
    SCOUT: {
      SPEED_MIN: 50,
      SPEED_MAX: 150,
      RADIUS: 15,
      HEALTH: 1,
      DAMAGE: 1,
      SCORE: 10,
      COLOR: 0xff0000,
    },
    SPAWN: {
      OFFSET_Y: -50,
      MARGIN_X: 30,
    },
  },

  // Scene keys
  SCENES: {
    BOOT: 'BootScene',
    PRELOADER: 'PreloaderScene',
    MAIN_MENU: 'MainMenuScene',
    GAME: 'GameScene',
    UI_SCENE: 'UIScene',
    GAME_OVER: 'GameOverScene',
    PAUSE: 'PauseScene',
  },
};

export default GameConfig;
