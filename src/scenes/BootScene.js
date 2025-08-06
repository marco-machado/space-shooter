import ConfigManager from '@/config/ConfigManager.js';
import Logger from '@/utils/Logger.js';
import Phaser from 'phaser';

/**
 * Boot Scene - Initial setup and environment loading
 * Handles environment initialization and transitions to preloader
 */
class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  init() {
    Logger.debug('BootScene.init() begin');
    Logger.debug('BootScene.init() end');
  }

  preload() {
    Logger.debug('BootScene.preload() begin');

    // Set loading path for assets
    this.load.path = 'assets/';

    // Preload minimal assets needed for loading screen
    // (In development phase, we'll use colored rectangles)

    Logger.debug('BootScene.preload() end');
  }

  create() {
    Logger.debug('BootScene.create() begin');

    // Create loading indicator
    // this.createLoadingIndicator();

    // Set up input handling
    // this.setupInput();

    // Add small delay to show boot scene, then transition
    this.time.delayedCall(500, () => {
      this.transitionToPreloader();
    });

    Logger.debug('BootScene.create() end');
  }

  /**
   * Update boot scene
   * @param {number} time - Current time
   * @param {number} delta - Time delta
   */
  update(time, delta) {
    // Boot scene typically doesn't need update logic
    // but we can add performance monitoring here if needed

    if (ConfigManager.getConfig().showDebugInfo && time % 1000 < delta) {
      Logger.debug('BootScene.update(): FPS ~', Math.round(1000 / delta));
    }
  }

  /**
   * Create simple loading indicator
   */
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
      this.add.text(10, 10, `DEBUG MODE | v${ConfigManager.getConfig().isDevelopment ? 'DEV' : 'PROD'}`, {
        fontSize: '12px',
        color: '#ffff00',
        fontFamily: 'monospace',
      });
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

  /**
   * Set up basic input handling
   */
  setupInput() {
    // Allow skipping boot scene with any key (debug only)
    if (ConfigManager.getConfig().debugMode) {
      this.input.keyboard.on('keydown', () => {
        this.transitionToPreloader();
      });

      this.input.on('pointerdown', () => {
        this.transitionToPreloader();
      });
    }
  }

  /**
   * Transition to preloader scene
   */
  transitionToPreloader() {
    Logger.debug('BootScene.transitionToPreloader()');

    // Fade out effect
    this.cameras.main.fadeOut(300, 0, 0, 0);

    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('PreloaderScene');
    });
  }

  /**
   * Clean up boot scene
   */
  shutdown() {
    Logger.debug('BootScene.shutdown()');

    // Clean up timers
    this.time.removeAllEvents();

    // Remove event listeners
    this.input.keyboard.removeAllListeners();
    this.input.removeAllListeners();
  }
}

export default BootScene;
