/**
 * Phaser engine configuration generator
 * Creates Phaser game configuration with physics, rendering, and input settings
 * @module PhaserConfig
 */

/* global process */
import Phaser from 'phaser';
import { GameConfig } from './GameConfig.js';
import { VisualConfig } from './VisualConfig.js';

/**
 * Generate Phaser game configuration object
 * @param {Object} envConfig - Environment configuration from ConfigManager
 * @param {Array} scenes - Scene classes to register
 * @returns {Object} Phaser configuration object
 */
export function createPhaserConfig(envConfig, scenes = []) {
  // In test environment, return a mock configuration
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    return {
      type: 'WEBGL', // Mock value for tests
      width: 600,
      height: 800,
      parent: 'game-container',
      backgroundColor: '#000011',
      scene: scenes,
      physics: { default: 'arcade', arcade: { gravity: { y: 0 } } },
      render: { antialias: false },
      audio: { noAudio: !envConfig.audioEnabled },
      input: { keyboard: true, mouse: true, touch: true },
      scale: { mode: 'NONE', autoCenter: 'NO_CENTER' },
      banner: { hidePhaser: !envConfig.debugMode },
      disableContextMenu: true,
    };
  }

  return {
    type: Phaser.AUTO,
    width: GameConfig.GAME_WIDTH,
    height: GameConfig.GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: VisualConfig.COLORS.BACKGROUND,

    scene: scenes,

    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: envConfig.physicsDebug,
        debugShowBody: envConfig.physicsDebug,
        debugShowStaticBody: envConfig.physicsDebug,
        debugShowVelocity: envConfig.physicsDebug,
        debugVelocityColor: 0x00ff00,
        debugBodyColor: 0xff0000,
        debugStaticBodyColor: 0x0000ff,
      },
    },

    render: {
      antialias: true, // Pixel-perfect for retro feel
      pixelArt: false, // May enable later for pixel art
      roundPixels: true, // Prevent sub-pixel rendering
      transparent: false,
      clearBeforeRender: true,
      preserveDrawingBuffer: false,
      failIfMajorPerformanceCaveat: false,
      powerPreference: 'default',
    },

    audio: {
      disableWebAudio: false,
      context: false,
      noAudio: !envConfig.audioEnabled,
    },

    input: {
      keyboard: true,
      mouse: false,
      touch: false,
      gamepad: false,
    },

    scale: {
      mode: Phaser.Scale.NONE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GameConfig.GAME_WIDTH,
      height: GameConfig.GAME_HEIGHT,
    },

    banner: {
      hidePhaser: !envConfig.debugMode,
    },

    fps: envConfig.showFps
      ? {
          target: 60,
          forceSetTimeOut: false,
          deltaHistory: 10,
          panicMax: 120,
          smoothStep: true,
        }
      : undefined,

    callbacks: {
      preBoot: game => {
        if (envConfig.debugMode) {
          game.debug = true;
        }
      },

      postBoot: game => {
        if (envConfig.showDebugInfo) {
          game.scene.scenes.forEach(scene => {
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
 * Phaser configuration factory
 * @constant {Object}
 */
export const PhaserConfig = {
  create: createPhaserConfig,
};

export default PhaserConfig;
