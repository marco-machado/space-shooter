import ConfigManager from '@/config/ConfigManager.js';
import Logger from '@/utils/Logger.js';

/**
 * Preloader Scene - Asset loading
 * Handles loading of all game assets and displays progress
 * @class
 * @classdesc Manages asset loading with visual progress indicators
 * @extends Phaser.Scene
 */
export default class PreloaderScene extends Phaser.Scene {
  /**
   * Loading progress bar graphic element
   * @private
   * @type {Phaser.GameObjects.Rectangle|null}
   */
  #loadingBar = null;

  /**
   * Loading status text element
   * @private
   * @type {Phaser.GameObjects.Text|null}
   */
  #loadingText = null;

  /**
   * Progress percentage text element
   * @private
   * @type {Phaser.GameObjects.Text|null}
   */
  #progressText = null;

  /**
   * Logger instance for this scene
   * @private
   * @type {Logger}
   */
  #logger = Logger.scope('PreloaderScene');

  /**
   * Create a new PreloaderScene instance.
   * Initializes the scene with loading UI components and logger.
   */
  constructor() {
    super({ key: 'PreloaderScene' });
  }

  /**
   * Phaser scene preload lifecycle method.
   * Sets up loading UI, events, and initiates asset loading.
   * @returns {void}
   */
  preload() {
    this.createLoadingUI();
    this.setupLoadingEvents();

    // Set loading path
    this.load.path = 'assets/';

    // We don't load actual graphics yet
    // Instead, we'll simulate loading for graphics system
    this.loadDevelopmentAssets();

    // Load audio assets if audio is enabled
    if (ConfigManager.getConfig().audioEnabled) {
      this.loadAudioAssets();
    }
  }

  /**
   * Creates the loading screen user interface.
   * Sets up progress bar, text elements, and loading tips.
   * @private
   * @returns {void}
   */
  createLoadingUI() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Background
    this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x000011);

    // Title
    this.add
      .text(centerX, centerY - 150, 'SPACE SHOOTER', {
        fontSize: '48px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5);

    // Loading text
    this.#loadingText = this.add
      .text(centerX, centerY - 50, 'LOADING ASSETS...', {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5);

    // Progress text
    this.#progressText = this.add
      .text(centerX, centerY + 50, '0%', {
        fontSize: '18px',
        color: '#888888',
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5);

    // Loading bar background
    const barWidth = 400;
    const barHeight = 20;
    this.add.rectangle(centerX, centerY, barWidth, barHeight, 0x333333).setStrokeStyle(2, 0x666666);

    // Loading bar fill
    this.#loadingBar = this.add
      .rectangle(centerX - barWidth / 2, centerY, 0, barHeight - 4, 0x00ff00)
      .setOrigin(0, 0.5);

    // Development mode indicator
    if (ConfigManager.getConfig().debugMode) {
      this.add.text(10, 10, 'DEVELOPMENT MODE - USING COLORED RECTANGLES', {
        fontSize: '12px',
        color: '#ffff00',
        fontFamily: 'monospace',
      });
    }

    // Loading tips
    const tips = [
      'Use WASD or Arrow Keys to move',
      'Hold SPACE to shoot',
      'Collect power-ups for upgrades',
      'Survive enemy levels to advance',
    ];

    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    this.add
      .text(centerX, this.scale.height - 80, `TIP: ${randomTip}`, {
        fontSize: '14px',
        color: '#888888',
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5);
  }

  /**
   * Sets up event listeners for asset loading progress.
   * Handles progress updates, file loading, completion, and errors.
   * @private
   * @returns {void}
   */
  setupLoadingEvents() {
    // Update progress bar
    this.load.on('progress', progress => {
      const barWidth = 400;
      this.#loadingBar.width = barWidth * progress;
      this.#progressText.setText(`${Math.round(progress * 100)}%`);
    });

    // Handle individual file loading
    this.load.on('fileprogress', file => {});

    // Handle loading completion
    this.load.on('complete', () => {
      this.onLoadComplete();
    });

    // Handle loading errors
    this.load.on('loaderror', file => {
      this.#logger.error(`PreloaderScene: Failed to load asset: ${file.key}`);
    });
  }

  /**
   * Loads simulated assets.
   * Creates fake loading progress for graphics system.
   * @private
   * @returns {void}
   */
  loadDevelopmentAssets() {
    // Simulate loading various asset types
    const simulatedAssets = [
      { key: 'dev-player', type: 'rectangle', color: 0x0099ff },
      { key: 'dev-enemy-basic', type: 'rectangle', color: 0xff0000 },
      { key: 'dev-enemy-fast', type: 'rectangle', color: 0xff4444 },
      { key: 'dev-enemy-boss', type: 'rectangle', color: 0xcc0000 },
      { key: 'dev-projectile-player', type: 'rectangle', color: 0xffff00 },
      { key: 'dev-projectile-enemy', type: 'rectangle', color: 0xff8800 },
      { key: 'dev-powerup-health', type: 'rectangle', color: 0x00ff00 },
      { key: 'dev-powerup-weapon', type: 'rectangle', color: 0x8800ff },
    ];

    // Create fake loading entries to demonstrate loading progress
    simulatedAssets.forEach((asset, index) => {
      this.time.delayedCall(100 * (index + 1), () => {
        // Simulate file loading progress
        this.load.emit('fileprogress', { key: asset.key });
        this.load.emit('progress', (index + 1) / simulatedAssets.length);

        if (index === simulatedAssets.length - 1) {
          this.load.emit('complete');
        }
      });
    });
  }

  /**
   * Loads audio assets if enabled in configuration.
   * Currently simulates audio loading for development.
   * @private
   * @returns {void}
   */
  loadAudioAssets() {
    // Audio loading will be implemented when we add actual audio files
    // For now, we'll simulate audio loading
  }

  /**
   * Handles loading completion.
   * Updates UI, enables input, and sets up game start transitions.
   * @private
   * @returns {void}
   */
  onLoadComplete() {
    this.#loadingText.setText('LOADING COMPLETE!');
    this.#progressText.setText('100%');

    // Add completion indicator
    this.add
      .text(this.scale.width / 2, this.scale.height / 2 + 100, 'PRESS ANY KEY TO START', {
        fontSize: '16px',
        color: '#00ff00',
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5);

    // Animate the completion text
    this.tweens.add({
      targets: this.#loadingText,
      alpha: { from: 1, to: 0.5 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    // Enable input to proceed
    this.input.keyboard.once('keydown', () => {
      this.startGame();
    });

    this.input.once('pointerdown', () => {
      this.startGame();
    });

    // Auto-start after delay if in debug mode
    if (ConfigManager.getConfig().debugMode) {
      this.time.delayedCall(500, () => {
        this.startGame();
      });
    }
  }

  /**
   * Starts the game transition to main menu.
   * Performs fade out transition and scene change.
   * @private
   * @returns {void}
   */
  startGame() {
    // Fade out transition
    this.cameras.main.fadeOut(500, 0, 0, 0);

    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('MainMenuScene');
    });
  }
}
