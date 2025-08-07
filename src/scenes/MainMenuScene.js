import ConfigManager from '@/config/ConfigManager.js';
import Logger from '@/utils/Logger.js';

/**
 * Main Menu Scene - Game entry point and navigation
 * Displays game title, menu options, and handles navigation
 */
export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });

    this.menuItems = [];
    this.selectedIndex = 0;
    this.menuActive = true;

    this.logger = Logger.scope('MainMenuScene');
  }

  init() {
    this.logger.debug('Init MainMenuScene');

    this.selectedIndex = 0;
    this.menuActive = true;
  }

  create() {
    this.logger.debug('Create MainMenuScene');

    this.createBackground();
    this.createTitle();
    this.createMenu();
    this.createInfoPanels();

    this.setupInput();

    this.animateEntrance();

    // Fade in from black
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  /**
   * Update main menu scene
   * @param {number} time - Current time
   * @param {number} delta - Time delta
   */
  update(time, delta) {
    // Update star animation or other background effects
  }

  createBackground() {
    this.logger.debug('Create Background');

    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Dark space background
    this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x000011);

    // Add some animated stars (simple white dots)
    this.stars = [];
    for (let i = 0; i < 50; i++) {
      const star = this.add.circle(
        Math.random() * this.scale.width,
        Math.random() * this.scale.height,
        Math.random() * 2 + 1,
        0xffffff,
        Math.random() * 0.8 + 0.2,
      );

      // Animate star twinkling
      this.tweens.add({
        targets: star,
        alpha: Math.random() * 0.5 + 0.3,
        duration: Math.random() * 2000 + 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.stars.push(star);
    }
  }

  createTitle() {
    const centerX = this.scale.width / 2;

    // Main title
    this.titleText = this.add
      .text(centerX, 120, 'SPACE SHOOTER', {
        fontSize: '32px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        stroke: '#0099ff',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    // Subtitle
    this.subtitleText = this.add
      .text(centerX, 180, 'Defend the Galaxy', {
        fontSize: '20px',
        color: '#888888',
        fontFamily: 'Arial, sans-serif',
        style: 'italic',
      })
      .setOrigin(0.5);

    // Version info (development)
    if (ConfigManager.getConfig().debugMode) {
      this.add
        .text(centerX, 210, 'Development Build - Colored Rectangle Graphics', {
          fontSize: '12px',
          color: '#ffff00',
          fontFamily: 'monospace',
        })
        .setOrigin(0.5);
    }
  }

  createMenu() {
    const centerX = this.scale.width / 2;
    const startY = 280;
    const itemSpacing = 60;

    const menuOptions = [
      { text: 'START GAME', action: 'startGame' },
      { text: 'INSTRUCTIONS', action: 'showInstructions' },
      { text: 'SETTINGS', action: 'showSettings' },
    ];

    this.menuItems = [];

    menuOptions.forEach((option, index) => {
      const y = startY + index * itemSpacing;

      // Menu item background (selection indicator)
      const background = this.add
        .rectangle(centerX, y, 300, 40, 0x333333, 0)
        .setStrokeStyle(2, 0x0099ff, 0);

      // Menu text
      const text = this.add
        .text(centerX, y, option.text, {
          fontSize: '24px',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
        })
        .setOrigin(0.5);

      const menuItem = {
        background,
        text,
        action: option.action,
        index,
      };

      this.menuItems.push(menuItem);

      // Add hover effects for mouse
      text
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          if (this.menuActive) {
            this.selectMenuItem(index);
          }
        })
        .on('pointerdown', () => {
          if (this.menuActive) {
            this.activateMenuItem(index);
          }
        });
    });

    // Set initial selection
    this.updateMenuSelection();
  }

  createInfoPanels() {
    // Controls info
    const controlsText = [
      'CONTROLS:',
      'WASD / Arrow Keys - Move',
      'SPACE - Shoot',
      'ESC - Pause',
    ].join('\n');

    this.add.text(50, this.scale.height - 120, controlsText, {
      fontSize: '12px',
      color: '#888888',
      fontFamily: 'monospace',
      lineSpacing: 4,
    });

    // Game info
    const gameInfoText = [
      'OBJECTIVE:',
      'Destroy enemies and survive waves',
      'Collect power-ups for upgrades',
      'Achieve the highest score!',
    ].join('\n');

    this.add.text(this.scale.width - 250, this.scale.height - 120, gameInfoText, {
      fontSize: '12px',
      color: '#888888',
      fontFamily: 'monospace',
      lineSpacing: 4,
    });

    // Development info
    if (ConfigManager.getConfig().showDebugInfo) {
      const debugInfo = [
        'DEBUG INFO:',
        `Environment: ${ConfigManager.getConfig().isDevelopment ? 'Development' : 'Production'}`,
        `Log Level: ${ConfigManager.getConfig().logLevel}`,
        `Physics Debug: ${ConfigManager.getConfig().physicsDebug}`,
        `Audio: ${ConfigManager.getConfig().audioEnabled}`,
      ].join('\n');

      this.add.text(this.scale.width - 200, 50, debugInfo, {
        fontSize: '10px',
        color: '#00ff00',
        fontFamily: 'monospace',
        lineSpacing: 2,
      });
    }
  }

  setupInput() {
    // Keyboard navigation
    this.input.keyboard.on('keydown-UP', () => {
      if (this.menuActive) {
        this.navigateMenu(-1);
      }
    });

    this.input.keyboard.on('keydown-DOWN', () => {
      if (this.menuActive) {
        this.navigateMenu(1);
      }
    });

    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.menuActive) {
        this.activateMenuItem(this.selectedIndex);
      }
    });

    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.menuActive) {
        this.activateMenuItem(this.selectedIndex);
      }
    });

    // Quick start for development
    if (ConfigManager.getConfig().debugMode) {
      this.input.keyboard.on('keydown-F1', () => {
        this.startGame();
      });
    }
  }

  navigateMenu(direction) {
    this.selectedIndex += direction;

    if (this.selectedIndex < 0) {
      this.selectedIndex = this.menuItems.length - 1;
    } else if (this.selectedIndex >= this.menuItems.length) {
      this.selectedIndex = 0;
    }

    this.updateMenuSelection();
  }

  selectMenuItem(index) {
    if (index >= 0 && index < this.menuItems.length) {
      this.selectedIndex = index;
      this.updateMenuSelection();
    }
  }

  updateMenuSelection() {
    this.menuItems.forEach((item, index) => {
      const isSelected = index === this.selectedIndex;

      // Update background
      item.background.setAlpha(isSelected ? 0.3 : 0);
      item.background.setStrokeStyle(2, 0x0099ff, isSelected ? 1 : 0);

      // Update text color
      item.text.setColor(isSelected ? '#00ff00' : '#ffffff');
      item.text.setScale(isSelected ? 1.1 : 1);
    });
  }

  activateMenuItem(index) {
    if (!this.menuActive || index < 0 || index >= this.menuItems.length) {
      return;
    }

    this.menuActive = false;
    const item = this.menuItems[index];

    // Add activation animation
    this.tweens.add({
      targets: item.text,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        this.executeMenuAction(item.action);
      },
    });
  }

  executeMenuAction(action) {
    switch (action) {
      case 'startGame':
        this.startGame();
        break;

      case 'showInstructions':
        this.showInstructions();
        break;

      case 'showSettings':
        this.showSettings();
        break;

      default:
        this.menuActive = true;
        break;
    }
  }

  startGame() {
    this.cameras.main.fadeOut(500, 0, 0, 0);

    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('GameScene');
    });
  }

  showInstructions() {
    // For now, just show a simple message and return to menu
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    const instructionsText = this.add
      .text(
        centerX,
        centerY,
        'INSTRUCTIONS:\n\n' +
          'Use WASD or Arrow Keys to move your ship\n' +
          'Hold SPACE to shoot at enemies\n' +
          'Collect green power-ups for health\n' +
          'Collect purple power-ups for weapon upgrades\n' +
          'Survive as long as possible!\n\n' +
          'Press any key to return to menu',
        {
          fontSize: '18px',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          align: 'center',
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5);

    this.input.keyboard.once('keydown', () => {
      instructionsText.destroy();
      this.menuActive = true;
    });

    this.input.once('pointerdown', () => {
      instructionsText.destroy();
      this.menuActive = true;
    });
  }

  showSettings() {
    // Simple settings display - will be expanded later
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    const settingsText = this.add
      .text(
        centerX,
        centerY,
        'SETTINGS:\n\n' +
          `Audio: ${ConfigManager.getConfig().audioEnabled ? 'Enabled' : 'Disabled'}\n` +
          `Debug Mode: ${ConfigManager.getConfig().debugMode ? 'On' : 'Off'}\n` +
          `Physics Debug: ${ConfigManager.getConfig().physicsDebug ? 'On' : 'Off'}\n` +
          `Log Level: ${ConfigManager.getConfig().logLevel}\n\n` +
          'Settings can be modified in .env file\n\n' +
          'Press any key to return to menu',
        {
          fontSize: '16px',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          align: 'center',
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5);

    this.input.keyboard.once('keydown', () => {
      settingsText.destroy();
      this.menuActive = true;
    });

    this.input.once('pointerdown', () => {
      settingsText.destroy();
      this.menuActive = true;
    });
  }

  animateEntrance() {
    // Title entrance
    this.titleText.setAlpha(0).setScale(0.5);
    this.tweens.add({
      targets: this.titleText,
      alpha: 1,
      scale: 1,
      duration: 1000,
      ease: 'Back.easeOut',
    });

    // Subtitle entrance
    this.subtitleText.setAlpha(0);
    this.tweens.add({
      targets: this.subtitleText,
      alpha: 1,
      duration: 800,
      delay: 500,
    });

    // Menu items entrance
    this.menuItems.forEach((item, index) => {
      item.text.setAlpha(0).setX(item.text.x - 100);
      item.background.setAlpha(0);

      this.tweens.add({
        targets: [item.text, item.background],
        alpha: 1,
        duration: 600,
        delay: 800 + index * 100,
      });

      this.tweens.add({
        targets: item.text,
        x: this.scale.width / 2,
        duration: 600,
        delay: 800 + index * 100,
        ease: 'Power2.easeOut',
      });
    });
  }
}
