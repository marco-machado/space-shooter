import Logger from '@/utils/Logger.js';
import ConfigManager from '@/config/ConfigManager.js';

/**
 * Preloader Scene - Asset loading with development graphics
 * Handles loading of all game assets and displays progress
 */
class PreloaderScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloaderScene' });

    this.loadingBar = null;
    this.loadingText = null;
    this.progressText = null;
  }

  /**
   * Initialize preloader scene
   */
  init() {
    Logger.debug('PreloaderScene.init()');
  }

  preload() {
    Logger.debug('PreloaderScene.preload() begin');

    // Create loading UI first
    // this.createLoadingUI();

    // Set up loading event handlers
    // this.setupLoadingEvents();

    // Set loading path
    this.load.path = 'assets/';

    // In development phase, we don't load actual graphics
    // Instead, we'll simulate loading for development graphics scopeName
    // this.loadDevelopmentAssets();

    // Load audio assets if audio is enabled
    if (ConfigManager.getConfig().audioEnabled) {
      this.loadAudioAssets();
    }

    Logger.debug('PreloaderScene.preload() end');
  }

  /**
   * Create the scene after loading
   */
  create() {
    Logger.debug('PreloaderScene.create()');

    this.startGame();
  }

  /**
   * Update preloader scene
   * @param {number} time - Current time
   * @param {number} delta - Time delta
   */
  update(time, delta) {
    // Performance monitoring in debug mode
    if (ConfigManager.getConfig().showDebugInfo && time % 1000 < delta) {
      Logger.debug('PreloaderScene.update(): FPS ~', Math.round(1000 / delta));
    }
  }

  /**
   * Create loading UI elements
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
    this.loadingText = this.add
      .text(centerX, centerY - 50, 'LOADING ASSETS...', {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5);

    // Progress text
    this.progressText = this.add
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
    this.loadingBar = this.add
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
      'Survive enemy waves to level up',
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
   * Set up loading progress event handlers
   */
  setupLoadingEvents() {
    // Update progress bar
    this.load.on('progress', progress => {
      const barWidth = 400;
      this.loadingBar.width = barWidth * progress;
      this.progressText.setText(`${Math.round(progress * 100)}%`);

      Logger.debug(`PreloaderScene: Loading progress: ${Math.round(progress * 100)}%`);
    });

    // Handle individual file loading
    this.load.on('fileprogress', file => {
      Logger.debug(`PreloaderScene: Loading file: ${file.key}`);
    });

    // Handle loading completion
    this.load.on('complete', () => {
      Logger.debug('PreloaderScene: All assets loaded successfully');
      this.onLoadComplete();
    });

    // Handle loading errors
    this.load.on('loaderror', file => {
      Logger.error(`PreloaderScene: Failed to load asset: ${file.key}`);
    });
  }

  /**
   * Load development phase assets (simulated)
   */
  loadDevelopmentAssets() {
    // In development phase, we simulate loading to show the loading screen
    // This helps test the loading UI and timing

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

    Logger.debug('PreloaderScene: Development assets simulation started');
  }

  /**
   * Load audio assets
   */
  loadAudioAssets() {
    // Audio loading will be implemented when we add actual audio files
    // For now, we'll simulate audio loading

    Logger.debug('PreloaderScene.loadAudioAssets()');
  }

  /**
   * Handle loading completion
   */
  onLoadComplete() {
    this.loadingText.setText('LOADING COMPLETE!');
    this.progressText.setText('100%');

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
      targets: this.loadingText,
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
      this.time.delayedCall(2000, () => {
        this.startGame();
      });
    }
  }

  /**
   * Start the game (transition to main menu)
   */
  startGame() {
    Logger.debug('PreloaderScene.startGame()');

    // Fade out transition
    this.cameras.main.fadeOut(500, 0, 0, 0);

    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('MainMenuScene');
    });
  }

  /**
   * Clean up preloader scene
   */
  shutdown() {
    Logger.debug('PreloaderScene: Shutting down');

    // Clean up timers and tweens
    this.time.removeAllEvents();
    this.tweens.killAll();

    // Remove event listeners
    this.load.removeAllListeners();
    this.input.keyboard.removeAllListeners();
    this.input.removeAllListeners();
  }
}

export default PreloaderScene;
