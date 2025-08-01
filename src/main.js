import Phaser from 'phaser';
import Environment from './config/Environment.js';
import Logger from './core/Logger.js';
import GameConfig from './config/GameConfig.js';

/**
 * Space Shooter Game Entry Point
 * Initializes the Phaser game with proper configuration and error handling
 */
class SpaceShooterGame {
  constructor() {
    this.game = null;
    this.isInitialized = false;
  }

  /**
   * Initialize and start the game
   */
  async init() {
    try {
      Logger.info('SpaceShooterGame: Starting game initialization');

      // Initialize environment configuration
      Environment.init();

      // Initialize logger with environment settings
      Logger.init();

      // Validate environment
      if (!Environment.validate()) {
        throw new Error('Invalid environment configuration');
      }

      // Get Phaser game configuration
      const config = GameConfig.getConfig();

      Logger.info('SpaceShooterGame: Creating Phaser game instance');
      Logger.debug('Game configuration:', {
        width: config.width,
        height: config.height,
        renderer:
          config.type === Phaser.AUTO ? 'AUTO' : config.type === Phaser.WEBGL ? 'WEBGL' : 'CANVAS',
        physics: config.physics?.default || 'none',
        scenes: config.scene?.length || 0,
      });

      // Create Phaser game instance
      this.game = new Phaser.Game(config);

      // Set up error handling
      this.setupErrorHandling();

      // Set up global game event listeners
      this.setupGameEvents();

      this.isInitialized = true;
      Logger.info('SpaceShooterGame: Game initialization complete');
    } catch (error) {
      Logger.error('SpaceShooterGame: Failed to initialize game:', error);
      this.showErrorMessage(error.message);
      throw error;
    }
  }

  /**
   * Set up error handling for the game
   */
  setupErrorHandling() {
    // Handle uncaught errors
    window.addEventListener('error', event => {
      Logger.error('Uncaught error:', event.error);
      this.handleGameError(event.error);
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', event => {
      Logger.error('Unhandled promise rejection:', event.reason);
      this.handleGameError(event.reason);
    });

    // Handle Phaser game errors
    if (this.game) {
      this.game.events.on('error', error => {
        Logger.error('Phaser game error:', error);
        this.handleGameError(error);
      });
    }
  }

  /**
   * Set up global game event listeners
   */
  setupGameEvents() {
    if (!this.game) return;

    // Game ready event
    this.game.events.once('ready', () => {
      Logger.info('SpaceShooterGame: Phaser game ready');
    });

    // Handle window focus/blur for pause functionality
    window.addEventListener('focus', () => {
      Logger.debug('Window focused - resuming game');
      if (this.game && this.game.scene && this.game.scene.isActive('GameScene')) {
        this.game.scene.resume('GameScene');
      }
    });

    window.addEventListener('blur', () => {
      Logger.debug('Window blurred - pausing game');
      if (this.game && this.game.scene && this.game.scene.isActive('GameScene')) {
        this.game.scene.pause('GameScene');
      }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      if (this.game && this.game.scale) {
        Logger.debug('Window resized - updating game scale');
        this.game.scale.refresh();
      }
    });

    // Handle visibility change (mobile support)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        Logger.debug('Page hidden - pausing game');
        if (this.game && this.game.scene && this.game.scene.isActive('GameScene')) {
          this.game.scene.pause('GameScene');
        }
      } else {
        Logger.debug('Page visible - resuming game');
        if (this.game && this.game.scene && this.game.scene.isActive('GameScene')) {
          this.game.scene.resume('GameScene');
        }
      }
    });
  }

  /**
   * Handle game errors gracefully
   * @param {Error} error - The error that occurred
   */
  handleGameError(error) {
    Logger.error('Game error occurred:', error);

    // In development mode, show detailed error info
    if (Environment.DEBUG_MODE) {
      this.showErrorMessage(`Game Error: ${error.message}`, error.stack);
    } else {
      // In production, show user-friendly message
      this.showErrorMessage('A game error occurred. Please refresh the page to continue.');
    }
  }

  /**
   * Show error message to user
   * @param {string} message - Error message
   * @param {string} details - Optional error details
   */
  showErrorMessage(message, details = null) {
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) return;

    // Create error display
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #1a1a1a;
      color: #ff4444;
      padding: 20px;
      border-radius: 8px;
      border: 2px solid #ff4444;
      text-align: center;
      font-family: monospace;
      z-index: 10000;
      max-width: 400px;
    `;

    let errorHTML = `<h3>Game Error</h3><p>${message}</p>`;

    if (details && Environment.DEBUG_MODE) {
      errorHTML += `<details><summary>Technical Details</summary><pre style="text-align: left; font-size: 10px; margin-top: 10px;">${details}</pre></details>`;
    }

    errorHTML += `<button onclick="window.location.reload()" style="margin-top: 15px; padding: 8px 16px; background: #ff4444; color: white; border: none; border-radius: 4px; cursor: pointer;">Reload Game</button>`;

    errorDiv.innerHTML = errorHTML;
    gameContainer.appendChild(errorDiv);
  }

  /**
   * Destroy the game instance
   */
  destroy() {
    if (this.game) {
      Logger.info('SpaceShooterGame: Destroying game instance');
      this.game.destroy(true);
      this.game = null;
      this.isInitialized = false;
    }
  }

  /**
   * Get the current game instance
   * @returns {Phaser.Game|null} Game instance
   */
  getGame() {
    return this.game;
  }

  /**
   * Check if game is initialized
   * @returns {boolean} True if initialized
   */
  isGameInitialized() {
    return this.isInitialized && this.game !== null;
  }
}

// Create and initialize the game
const spaceShooterGame = new SpaceShooterGame();

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    spaceShooterGame.init().catch(error => {
      console.error('Failed to start Space Shooter game:', error);
    });
  });
} else {
  // DOM is already ready
  spaceShooterGame.init().catch(error => {
    console.error('Failed to start Space Shooter game:', error);
  });
}

// Make game instance available globally for debugging
if (Environment.DEBUG_MODE) {
  window.spaceShooterGame = spaceShooterGame;
  window.phaser = Phaser;
  Logger.debug('SpaceShooterGame: Debug mode - Game instance available as window.spaceShooterGame');
}

// Export for potential module usage
export default spaceShooterGame;
