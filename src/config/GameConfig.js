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