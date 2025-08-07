import ConfigManager from '@/config/ConfigManager.js';
import Logger from '@/utils/Logger.js';
import Phaser from 'phaser';

/**
 * Boot Scene - Initial setup and environment loading
 * Handles environment initialization and transitions to preloader
 */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });

    this.logger = Logger.scope('BootScene');
  }

  preload() {
    this.logger.debug('Preload BootScene');

    // Set loading path for assets
    this.load.path = 'assets/';

    // Preload minimal assets needed for loading screen
    // (In development phase, we'll use colored rectangles)
  }

  create() {
    this.logger.debug('Create BootScene');

    // Create loading indicator
    this.createLoadingIndicator();

    // Add small delay to show boot scene, then transition
    this.time.delayedCall(5000, () => {
      this.transitionToPreloader();
    });
  }

  createLoadingIndicator() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Loading text
    this.loadingText = this.add
      .text(centerX, centerY + 50, 'LOADING...', {
        fontSize: '24px',
        color: '#888888',
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5);

    // Simple animated dots
    this.time.addEvent({
      delay: 500,
      callback: () => {
        const dots = this.loadingText.text.match(/\./g) || [];
        if (dots.length >= 3) {
          this.loadingText.setText('LOADING');
        } else {
          this.loadingText.setText(`${this.loadingText.text}.`);
        }
      },
      loop: true,
    });

    // Development mode indicator
    if (ConfigManager.getConfig().debugMode) {
      this.add.text(
        10,
        10,
        `DEBUG MODE | v${ConfigManager.getConfig().isDevelopment ? 'DEV' : 'PROD'}`,
        {
          fontSize: '12px',
          color: '#ffff00',
          fontFamily: 'monospace',
        },
      );
    }

    // Environment info (debug only)
    if (ConfigManager.getConfig().showDebugInfo) {
      const config = ConfigManager.getConfig();
      const debugInfo = [
        `Log Level: ${config.logLevel}`,
        `Physics Debug: ${config.physicsDebug}`,
        `Audio: ${config.audioEnabled}`,
        `Show FPS: ${config.showFps}`,
      ];

      this.add.text(10, this.scale.height - 80, debugInfo.join('\n'), {
        fontSize: '10px',
        color: '#00ff00',
        fontFamily: 'monospace',
      });
    }
  }

  transitionToPreloader() {
    // Fade out effect
    this.cameras.main.fadeOut(300, 0, 0, 0);

    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('PreloaderScene');
    });
  }
}
