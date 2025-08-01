import Environment from '../config/Environment.js';
import Logger from '../core/Logger.js';

/**
 * Boot Scene - Initial setup and environment loading
 * Handles environment initialization and transitions to preloader
 */
class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  /**
   * Initialize the boot scene
   */
  init() {
    Logger.info('BootScene: Starting game initialization');

    // Initialize environment configuration
    Environment.init();

    // Initialize logger with environment settings
    Logger.init();

    // Validate environment configuration
    if (!Environment.validate()) {
      Logger.error('BootScene: Invalid environment configuration');
      return;
    }

    Logger.info('BootScene: Environment initialized', Environment.getConfig());
  }

  /**
   * Preload critical assets for boot scene
   */
  preload() {
    // Set loading path for assets
    this.load.path = 'assets/';

    // Preload minimal assets needed for loading screen
    // (In development phase, we'll use colored rectangles)

    Logger.debug('BootScene: Preloading boot assets');
  }

  /**
   * Create boot scene elements
   */
  create() {
    Logger.info('BootScene: Boot scene created');

    // Set up game-level event listeners
    this.setupGameEvents();

    // Create loading indicator
    this.createLoadingIndicator();

    // Set up input handling
    this.setupInput();

    // Add small delay to show boot scene, then transition
    this.time.delayedCall(500, () => {
      this.transitionToPreloader();
    });
  }

  /**
   * Set up game-level event listeners
   */
  setupGameEvents() {
    // Handle window focus/blur
    this.game.events.on('focus', () => {
      Logger.debug('Game focused');
    });

    this.game.events.on('blur', () => {
      Logger.debug('Game blurred');
    });

    // Handle window resize
    this.scale.on('resize', gameSize => {
      Logger.debug('Game resized:', gameSize);
    });

    // Handle errors
    this.game.events.on('error', error => {
      Logger.error('Game error:', error);
    });
  }

  /**
   * Create simple loading indicator
   */
  createLoadingIndicator() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Game title
    this.add
      .text(centerX, centerY - 100, 'SPACE SHOOTER', {
        fontSize: '48px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5);

    // Loading text
    this.loadingText = this.add
      .text(centerX, centerY + 50, 'INITIALIZING...', {
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
          this.loadingText.setText('INITIALIZING');
        } else {
          this.loadingText.setText(`${this.loadingText.text}.`);
        }
      },
      loop: true,
    });

    // Development mode indicator
    if (Environment.DEBUG_MODE) {
      this.add.text(10, 10, `DEBUG MODE | v${Environment.IS_DEVELOPMENT ? 'DEV' : 'PROD'}`, {
        fontSize: '12px',
        color: '#ffff00',
        fontFamily: 'monospace',
      });
    }

    // Environment info (debug only)
    if (Environment.SHOW_DEBUG_INFO) {
      const config = Environment.getConfig();
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
    if (Environment.DEBUG_MODE) {
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
    Logger.info('BootScene: Transitioning to PreloaderScene');

    // Fade out effect
    this.cameras.main.fadeOut(300, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('PreloaderScene');
    });
  }

  /**
   * Update boot scene
   * @param {number} time - Current time
   * @param {number} delta - Time delta
   */
  update(time, delta) {
    // Boot scene typically doesn't need update logic
    // but we can add performance monitoring here if needed

    if (Environment.SHOW_DEBUG_INFO && time % 1000 < delta) {
      Logger.debug('BootScene update: FPS ~', Math.round(1000 / delta));
    }
  }

  /**
   * Clean up boot scene
   */
  shutdown() {
    Logger.debug('BootScene: Shutting down');

    // Clean up timers
    this.time.removeAllEvents();

    // Remove event listeners
    this.input.keyboard.removeAllListeners();
    this.input.removeAllListeners();
  }
}

export default BootScene;
