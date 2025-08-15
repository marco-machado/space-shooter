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
    SPEED: 150, // pixels per second
    FIRE_RATE: 1000, // milliseconds between shots when holding fire button
  },

  // Projectile settings
  PROJECTILES: {
    PLAYER: {
      SPEED: 600,    // pixels per second (increased for better visibility)
      WIDTH: 6,      // projectile width (increased for better visibility)
      HEIGHT: 16,    // projectile height (increased for better visibility)
      COLOR: 0xffff00, // yellow
      DAMAGE: 1,     // damage dealt to enemies
    },
    ENEMY: {
      SPEED: 200,    // pixels per second
      WIDTH: 3,      // projectile width
      HEIGHT: 8,     // projectile height
      COLOR: 0xff8800, // orange
      DAMAGE: 1,     // damage dealt to player
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
