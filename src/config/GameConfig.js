import Environment from './Environment.js';

// Import scenes
import BootScene from '../scenes/BootScene.js';
import PreloaderScene from '../scenes/PreloaderScene.js';
import MainMenuScene from '../scenes/MainMenuScene.js';
import GameScene from '../scenes/GameScene.js';

/**
 * Phaser Game Configuration
 * Configures the game instance with scenes, physics, and rendering options
 */
class GameConfig {
  /**
   * Get Phaser game configuration object
   * @returns {Object} Phaser configuration
   */
  static getConfig() {
    // Initialize environment first
    Environment.init();

    return {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: 'game-container',
      backgroundColor: '#000011', // Dark space background

      // Scene configuration
      scene: [BootScene, PreloaderScene, MainMenuScene, GameScene],

      // Physics configuration
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 }, // No gravity for space shooter
          debug: Environment.PHYSICS_DEBUG,
          debugShowBody: Environment.PHYSICS_DEBUG,
          debugShowStaticBody: Environment.PHYSICS_DEBUG,
          debugShowVelocity: Environment.PHYSICS_DEBUG,
          debugVelocityColor: 0x00ff00,
          debugBodyColor: 0xff0000,
          debugStaticBodyColor: 0x0000ff,
        },
      },

      // Rendering options
      render: {
        antialias: false, // Pixel-perfect for retro feel
        pixelArt: false, // May enable later for pixel art
        roundPixels: true, // Prevent sub-pixel rendering
        transparent: false,
        clearBeforeRender: true,
        preserveDrawingBuffer: false,
        failIfMajorPerformanceCaveat: false,
        powerPreference: 'default',
      },

      // Audio configuration
      audio: {
        disableWebAudio: false,
        context: false,
        noAudio: !Environment.AUDIO_ENABLED,
      },

      // Input configuration
      input: {
        keyboard: true,
        mouse: true,
        touch: true,
        gamepad: false, // May enable later
      },

      // Scale configuration
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600,
        min: {
          width: 400,
          height: 300,
        },
        max: {
          width: 1600,
          height: 1200,
        },
      },

      // Banner configuration
      banner: {
        hidePhaser: !Environment.DEBUG_MODE,
        text: Environment.DEBUG_MODE ? '#FFFFFF' : 'transparent',
        background: Environment.DEBUG_MODE
          ? ['#FF6600', '#000000', '#FF6600', '#000000']
          : 'transparent',
      },

      // Development options
      fps: Environment.SHOW_FPS
        ? {
            target: 60,
            forceSetTimeOut: false,
            deltaHistory: 10,
            panicMax: 120,
            smoothStep: true,
          }
        : undefined,

      // Performance options
      disableContextMenu: true,
      transparent: false,
      antialias: false,
      desynchronized: false,

      // Callbacks
      callbacks: {
        preBoot: game => {
          // Game pre-boot setup
          if (Environment.DEBUG_MODE) {
            game.debug = true;
          }
        },

        postBoot: game => {
          // Game post-boot setup
          if (Environment.SHOW_DEBUG_INFO) {
            game.scene.scenes.forEach(scene => {
              // Ensure scene is properly initialized before accessing displayList
              if (scene.sys && scene.sys.displayList && scene.sys.displayList.on) {
                scene.sys.displayList.on('addedtoscene', gameObject => {
                  gameObject.setData('created', Date.now());
                });
              }
            });
          }
        },
      },
    };
  }

  /**
   * Get game constants and settings
   * @returns {Object} Game constants
   */
  static getConstants() {
    return {
      GAME_WIDTH: 800,
      GAME_HEIGHT: 600,

      // Colors (development phase)
      COLORS: {
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
      },

      // Physics groups
      PHYSICS_GROUPS: {
        PLAYER: 'player',
        ENEMIES: 'enemies',
        PLAYER_PROJECTILES: 'playerProjectiles',
        ENEMY_PROJECTILES: 'enemyProjectiles',
        POWERUPS: 'powerups',
      },

      // Z-depths for layering
      DEPTHS: {
        BACKGROUND: -100,
        POWERUPS: 10,
        ENEMIES: 20,
        PLAYER: 30,
        PROJECTILES: 40,
        PARTICLES: 50,
        UI: 100,
        DEBUG: 1000,
      },

      // Scene keys
      SCENES: {
        BOOT: 'BootScene',
        PRELOADER: 'PreloaderScene',
        MAIN_MENU: 'MainMenuScene',
        GAME: 'GameScene',
        GAME_OVER: 'GameOverScene',
        PAUSE: 'PauseScene',
      },
    };
  }
}

export default GameConfig;
