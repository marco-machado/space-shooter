import Phaser from 'phaser';
import { getEventBus } from '@/event-bus/EventBus.js';
import { EventTypes } from '@/event-bus/EventTypes.js';
import Logger from '@/utils/Logger.js';
import { createBackground, updateBackground } from '@/entities/Background.js';

/**
 * Game Over Scene
 * @class
 * @classdesc Displays final game results, statistics, and handles restart/menu navigation.
 * Shows score, accuracy, achievements, and provides options to restart or return to main menu.
 */
export default class GameOverScene extends Phaser.Scene {
  #logger;
  #eventBus;

  #menuItems;
  #selectedIndex;
  #menuActive;

  #stars;
  #titleText;
  #scoreText;
  #statsText;
  #menuTexts;

  #gameData;
  #isHighScore;

  constructor() {
    super({ key: 'GameOverScene' });

    this.#logger = Logger.scope('GameOverScene');
    this.#eventBus = getEventBus();

    this.#menuItems = [
      { text: 'RESTART GAME', action: 'restart' },
      { text: 'MAIN MENU', action: 'menu' },
      { text: 'QUIT', action: 'quit' }
    ];
    this.#selectedIndex = 0;
    this.#menuActive = false;

    this.#stars = null;
    this.#titleText = null;
    this.#scoreText = null;
    this.#statsText = null;
    this.#menuTexts = [];

    this.#gameData = null;
    this.#isHighScore = false;
  }

  /**
   * Initialize scene with game over data
   * @param {Object} data - Game state data from GAME_OVER event
   */
  init(data) {
    this.#logger.debug('GameOverScene initialized with data:', data);
    this.#gameData = data || {};
    this.#isHighScore = this.#checkIfHighScore();
  }

  /**
   * Create the game over scene
   */
  create() {
    this.#logger.debug('Creating GameOverScene');

    this.#createBackground();
    this.#createTitle();
    this.#createStats();
    this.#createMenu();
    this.#setupInput();
    this.#animateEntrance();

    this.#menuActive = false;
    
    // Enable menu after entrance animation
    this.time.delayedCall(2000, () => {
      this.#menuActive = true;
      this.#updateMenuSelection();
    });
  }

  /**
   * Update scene
   */
  update() {
    if (this.#stars) {
      updateBackground(this.#stars);
    }
  }

  /**
   * Create animated background
   * @private
   */
  #createBackground() {
    this.cameras.main.setBackgroundColor('#000814');
    
    this.#stars = createBackground(this);
  }

  /**
   * Create title and game over text
   * @private
   */
  #createTitle() {
    const centerX = this.cameras.main.width / 2;
    
    this.#titleText = this.add.text(centerX, 100, 'GAME OVER', {
      fontFamily: 'Arial Black',
      fontSize: '64px',
      color: '#ff0000',
      stroke: '#ffffff',
      strokeThickness: 2,
      shadow: {
        offsetX: 4,
        offsetY: 4,
        color: '#000000',
        blur: 8,
        fill: true
      }
    }).setOrigin(0.5).setAlpha(0);

    if (this.#isHighScore) {
      this.add.text(centerX, 160, 'NEW HIGH SCORE!', {
        fontFamily: 'Arial Black',
        fontSize: '32px',
        color: '#ffd700',
        stroke: '#ffffff',
        strokeThickness: 1
      }).setOrigin(0.5).setAlpha(0);
    }
  }

  /**
   * Create statistics display
   * @private
   */
  #createStats() {
    const centerX = this.cameras.main.width / 2;
    const data = this.#gameData;

    // Final Score
    this.#scoreText = this.add.text(centerX, 220, `FINAL SCORE: ${data.score || 0}`, {
      fontFamily: 'Arial',
      fontSize: '36px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setAlpha(0);

    // Game Statistics
    const stats = [
      `Enemies Destroyed: ${data.enemiesDestroyed || 0}`,
      `Accuracy: ${data.accuracy ? Math.round(data.accuracy) : 0}%`,
      `Time Played: ${this.#formatTime(data.totalPlayTime || 0)}`,
      `Lives Remaining: ${data.lives || 0}`,
      `Level Reached: ${data.currentLevel || 1}`
    ];

    this.#statsText = this.add.text(centerX, 320, stats.join('\n'), {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#cccccc',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5).setAlpha(0);

    // Achievements
    if (data.achievements && data.achievements.size > 0) {
      const achievementText = `Achievements Unlocked: ${Array.from(data.achievements).join(', ')}`;
      this.add.text(centerX, 450, achievementText, {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#ffd700',
        align: 'center',
        wordWrap: { width: 600 }
      }).setOrigin(0.5).setAlpha(0);
    }
  }

  /**
   * Create menu options
   * @private
   */
  #createMenu() {
    const centerX = this.cameras.main.width / 2;
    const startY = 550;
    const spacing = 60;

    this.#menuTexts = [];

    this.#menuItems.forEach((item, index) => {
      const menuText = this.add.text(centerX, startY + (index * spacing), item.text, {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1
      }).setOrigin(0.5).setAlpha(0);

      this.#menuTexts.push(menuText);
    });
  }

  /**
   * Setup input handling
   * @private
   */
  #setupInput() {
    // Keyboard input
    const _cursors = this.input.keyboard.createCursorKeys();
    const _wasd = this.input.keyboard.addKeys('W,S,A,D,ENTER,ESC,SPACE');

    this.input.keyboard.on('keydown', (event) => {
      if (!this.#menuActive) return;

      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.#navigateMenu(-1);
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.#navigateMenu(1);
          break;
        case 'Enter':
        case 'Space':
          this.#executeMenuAction();
          break;
        case 'Escape':
          this.#executeAction('menu');
          break;
      }
    });

    // Mouse input
    this.#menuTexts.forEach((menuText, index) => {
      menuText.setInteractive();
      
      menuText.on('pointerover', () => {
        if (this.#menuActive) {
          this.#selectedIndex = index;
          this.#updateMenuSelection();
        }
      });

      menuText.on('pointerdown', () => {
        if (this.#menuActive) {
          this.#selectedIndex = index;
          this.#executeMenuAction();
        }
      });
    });
  }

  /**
   * Navigate menu selection
   * @private
   * @param {number} direction - Direction to navigate (-1 up, 1 down)
   */
  #navigateMenu(direction) {
    this.#selectedIndex = (this.#selectedIndex + direction + this.#menuItems.length) % this.#menuItems.length;
    this.#updateMenuSelection();
  }

  /**
   * Update menu selection visual feedback
   * @private
   */
  #updateMenuSelection() {
    this.#menuTexts.forEach((menuText, index) => {
      if (index === this.#selectedIndex) {
        menuText.setColor('#ffff00');
        menuText.setScale(1.2);
      } else {
        menuText.setColor('#ffffff');
        menuText.setScale(1.0);
      }
    });
  }

  /**
   * Execute selected menu action
   * @private
   */
  #executeMenuAction() {
    if (!this.#menuActive) return;

    const selectedItem = this.#menuItems[this.#selectedIndex];
    this.#executeAction(selectedItem.action);
  }

  /**
   * Execute specific action
   * @private
   * @param {string} action - Action to execute
   */
  #executeAction(action) {
    this.#logger.debug('Executing action:', action);
    this.#menuActive = false;

    this.cameras.main.fadeOut(500);
    
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      switch (action) {
        case 'restart':
          this.scene.start('GameScene');
          break;
        case 'menu':
          this.scene.start('MainMenuScene');
          break;
        case 'quit':
          this.#eventBus.emit(EventTypes.GAME_ERROR, { 
            message: 'Game quit by user', 
            type: 'user_quit' 
          });
          break;
        default:
          this.#logger.warn('Unknown action:', action);
          this.scene.start('MainMenuScene');
      }
    });
  }

  /**
   * Animate entrance effects
   * @private
   */
  #animateEntrance() {
    // Fade in camera
    this.cameras.main.fadeIn(1000);

    // Animate title
    this.tweens.add({
      targets: this.#titleText,
      alpha: 1,
      scale: { from: 1.5, to: 1 },
      duration: 1000,
      ease: 'Bounce.easeOut',
      delay: 500
    });

    // Animate score
    this.tweens.add({
      targets: this.#scoreText,
      alpha: 1,
      y: { from: this.#scoreText.y - 50, to: this.#scoreText.y },
      duration: 800,
      ease: 'Back.easeOut',
      delay: 1000
    });

    // Animate stats
    this.tweens.add({
      targets: this.#statsText,
      alpha: 1,
      duration: 1000,
      delay: 1200
    });

    // Animate menu items
    this.#menuTexts.forEach((menuText, index) => {
      this.tweens.add({
        targets: menuText,
        alpha: 1,
        x: { from: menuText.x - 100, to: menuText.x },
        duration: 600,
        ease: 'Power2.easeOut',
        delay: 1500 + (index * 100)
      });
    });
  }

  /**
   * Check if current score is a high score
   * @private
   * @returns {boolean} True if high score
   */
  #checkIfHighScore() {
    // Simple high score check - could be enhanced with persistent storage
    const currentScore = this.#gameData.score || 0;
    const savedHighScore = localStorage.getItem('space-shooter-high-score') || 0;
    
    if (currentScore > parseInt(savedHighScore)) {
      localStorage.setItem('space-shooter-high-score', currentScore.toString());
      return true;
    }
    
    return false;
  }

  /**
   * Format time in milliseconds to readable string
   * @private
   * @param {number} timeMs - Time in milliseconds
   * @returns {string} Formatted time string
   */
  #formatTime(timeMs) {
    const seconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}