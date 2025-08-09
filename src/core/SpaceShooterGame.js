import ConfigManager from '@/config/ConfigManager.js';
import { getEventBus } from '@/event-bus/EventBus.js';
import { EventTypes } from '@/event-bus/EventTypes.js';
import { BootScene, GameScene, MainMenuScene, PreloaderScene, UIScene } from '@/scenes';
import Logger from '@/utils/Logger.js';
import Phaser from 'phaser';

/**
 * Main game class for the space shooter game.
 * @class
 * @classdesc Manages the Phaser.js game instance, configuration, error handling, and global events.
 */
export default class SpaceShooterGame {
  #game = null;
  #isInitialized = false;
  #eventBus;
  #logger;

  /**
   * Create a new SpaceShooterGame instance.
   */
  constructor() {
    this.#eventBus = getEventBus();
    this.#logger = Logger.scope('SpaceShooterGame');
  }

  /**
   * Initialize the game with configuration, scenes, and event handling.
   * @returns {Promise<void>}
   * @throws {Error} When configuration is invalid or initialization fails
   */
  async init() {
    try {
      ConfigManager.init();

      // Validate configuration
      if (!ConfigManager.validate()) {
        throw new Error('Invalid configuration');
      }

      // Register scenes with ConfigManager
      ConfigManager.registerScenes([BootScene, PreloaderScene, MainMenuScene, GameScene, UIScene]);

      // Get Phaser game configuration
      const config = ConfigManager.getPhaserConfig();

      // Create Phaser game instance
      this.#game = new Phaser.Game(config);

      // Set up error handling
      this.#setupErrorHandling();

      // Set up global game event listeners
      this.#setupGameEvents();

      this.#isInitialized = true;
    } catch (error) {
      this.#logger.error('Game failed to initialize:', error.message);
      this.#showErrorMessage(error.message);
      throw error;
    }
  }

  /**
   * Sets up error handling for uncaught errors and unhandled promise rejections.
   * This method listens for global error events and logs them using a scoped logger,
   * while also invoking an internal game error handler.
   * @private
   * @returns {void}
   */
  #setupErrorHandling() {
    // Handle uncaught errors
    window.addEventListener('error', event => {
      this.#logger.error('Uncaught error', event.error);
      this.#handleGameError(event.error);
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', event => {
      this.#logger.error('Unhandled promise rejection', event.reason);
      this.#handleGameError(event.reason);
    });
  }

  /**
   * Sets up game-related events to handle various scenarios such as errors,
   * window focus/blur, resize events, and document visibility changes.
   * These events are emitted through the eventBus for further processing.
   * @private
   * @returns {void}
   */
  #setupGameEvents() {
    if (!this.#game) return;

    // Handle Phaser game errors
    this.#game.events.on('error', error => {
      this.#eventBus.emit(EventTypes.GAME_ERROR, error);
    });

    // Game ready event
    this.#game.events.once('ready', () => {
      this.#eventBus.emit(EventTypes.GAME_READY);
    });

    // Handle window focus/blur for pause functionality
    window.addEventListener('focus', () => {
      this.#eventBus.emit(EventTypes.WINDOW_FOCUS);
    });

    window.addEventListener('blur', () => {
      this.#eventBus.emit(EventTypes.WINDOW_BLUR);
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      this.#eventBus.emit(EventTypes.WINDOW_RESIZE);
    });

    // Handle visibility change (mobile support)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.#eventBus.emit(EventTypes.WINDOW_HIDDEN);
      } else {
        this.#eventBus.emit(EventTypes.WINDOW_VISIBLE);
      }
    });
  }

  /**
   * Handles game-related errors by displaying appropriate error messages based on the application's configuration.
   * @private
   * @param {Error} error - The error object containing details of the game error
   * @returns {void}
   */
  #handleGameError(error) {
    // In development mode, show detailed error info
    if (ConfigManager.getConfig().debugMode) {
      this.#showErrorMessage(`Game Error: ${error.message}`, error.stack);
    } else {
      // In production, show user-friendly message
      this.#showErrorMessage('A game error occurred. Please refresh the page to continue.');
    }
  }

  /**
   * Displays an error message overlay on the game container element.
   * @private
   * @param {string} message - The main error message to be displayed
   * @param {string|null} [details=null] - Optional detailed technical information about the error, primarily displayed when debugging mode is enabled
   * @returns {void}
   */
  #showErrorMessage(message, details = null) {
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

    if (details && ConfigManager.getConfig().debugMode) {
      errorHTML += `<details><summary>Technical Details</summary><pre style="text-align: left; font-size: 10px; margin-top: 10px;">${details}</pre></details>`;
    }

    errorHTML += `<button onclick="window.location.reload()" style="margin-top: 15px; padding: 8px 16px; background: #ff4444; color: white; border: none; border-radius: 4px; cursor: pointer;">Reload Game</button>`;

    errorDiv.innerHTML = errorHTML;
    gameContainer.appendChild(errorDiv);
  }

  /**
   * Destroys the current game instance, freeing associated resources and resetting the game state.
   * If a game instance exists, it will be destroyed and set to null, and the initialization flag will be reset.
   * @returns {void}
   */
  destroy() {
    if (this.#game) {
      this.#logger.info('Destroying game instance');

      this.#game.destroy(true);
      this.#game = null;
      this.#isInitialized = false;
    }
  }

  /**
   * Retrieves the current game instance.
   * @returns {Phaser.Game|null} The game instance associated with this object
   */
  getGame() {
    return this.#game;
  }
}
