import ConfigManager from '@/config/ConfigManager.js';
import Logger from '@/utils/Logger.js';
import SpaceShooterGame from '@/core/SpaceShooterGame.js';

const spaceShooterGame = new SpaceShooterGame();

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    spaceShooterGame.init().catch(error => {
      console.error('Failed to start Space Shooter game:', error);
    });
  });
} else {
  spaceShooterGame.init().catch(error => {
    console.error('Failed to start Space Shooter game:', error);
  });
}

// Make game instance available globally for debugging
if (ConfigManager.getConfig().debugMode) {
  window.spaceShooterGame = spaceShooterGame;
  window.phaser = Phaser;
  Logger.debug('main: Debug mode - Game instance available as window.spaceShooterGame');
}
