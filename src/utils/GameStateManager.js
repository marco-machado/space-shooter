import Logger from '../core/Logger.js';

/**
 * Game State Manager
 * Manages overall game state, score, lives, progression, and persistence
 * Handles game over conditions and state transitions
 */
class GameStateManager {
  constructor(scene) {
    this.scene = scene;

    // Game state
    this.isPlaying = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.gameStartTime = 0;
    this.gameEndTime = 0;
    this.totalPlayTime = 0;

    // Player statistics
    this.score = 0;
    this.lives = 3;
    this.maxLives = 5;
    this.currentLevel = 1;
    this.experience = 0;
    this.experienceToNextLevel = 1000;

    // Wave statistics
    this.currentWave = 1;
    this.highestWave = 1;
    this.wavesCompleted = 0;
    this.enemiesDestroyed = 0;
    this.totalEnemiesDestroyed = 0;

    // Weapon statistics
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.accuracy = 0;
    this.weaponsUnlocked = new Set(['laser']);

    // Power-up statistics
    this.powerUpsCollected = 0;
    this.powerUpTypes = {};

    // Performance statistics
    this.performanceMetrics = {
      averageFPS: 60,
      minFPS: 60,
      maxFPS: 60,
      frameCount: 0,
      fpsHistory: [],
    };

    // Multipliers and bonuses
    this.scoreMultiplier = 1.0;
    this.experienceMultiplier = 1.0;
    this.consecutiveHits = 0;
    this.maxConsecutiveHits = 0;

    // Achievements and milestones
    this.achievements = new Set();
    this.milestones = new Map();
    this.initializeMilestones();

    // Save data management
    this.saveKey = 'space-shooter-save';
    this.autoSaveInterval = 30000; // 30 seconds
    this.lastAutoSave = 0;

    // Event listeners
    this.setupEventListeners();

    Logger.info('GameStateManager initialized', {
      lives: this.lives,
      level: this.currentLevel,
      saveKey: this.saveKey,
    });
  }

  /**
   * Initialize achievement milestones
   */
  initializeMilestones() {
    this.milestones.set('firstKill', {
      target: 1,
      current: 0,
      achieved: false,
      reward: 'score',
      value: 500,
    });
    this.milestones.set('sharpshooter', {
      target: 10,
      current: 0,
      achieved: false,
      reward: 'weapon',
      value: 'plasma',
    });
    this.milestones.set('survivor', {
      target: 5,
      current: 0,
      achieved: false,
      reward: 'life',
      value: 1,
    });
    this.milestones.set('destroyer', {
      target: 100,
      current: 0,
      achieved: false,
      reward: 'weapon',
      value: 'missile',
    });
    this.milestones.set('wavemaster', {
      target: 10,
      current: 0,
      achieved: false,
      reward: 'score',
      value: 5000,
    });
    this.milestones.set('accuracy', {
      target: 80,
      current: 0,
      achieved: false,
      reward: 'score',
      value: 2000,
    });
  }

  /**
   * Setup event listeners for game events
   */
  setupEventListeners() {
    if (!this.scene.events) {
      Logger.error('GameStateManager: Scene events not available');
      return;
    }

    try {
      // Enemy destruction events
      this.scene.events.on('enemyDeath', this.onEnemyDestroyed, this);

      // Wave events
      this.scene.events.on('waveStart', this.onWaveStart, this);
      this.scene.events.on('waveComplete', this.onWaveComplete, this);

      // Player events
      this.scene.events.on('playerDamage', this.onPlayerDamage, this);
      this.scene.events.on('playerDeath', this.onPlayerDeath, this);

      // Weapon events
      this.scene.events.on('weaponFire', this.onWeaponFire, this);
      this.scene.events.on('weaponHit', this.onWeaponHit, this);
      this.scene.events.on('weaponUnlocked', this.onWeaponUnlocked, this);

      // Power-up events
      this.scene.events.on('powerUpCollected', this.onPowerUpCollected, this);

      // Game state events
      this.scene.events.on('gameStart', this.onGameStart, this);
      this.scene.events.on('gamePause', this.onGamePause, this);
      this.scene.events.on('gameResume', this.onGameResume, this);

      Logger.debug('GameStateManager: Event listeners set up successfully');
    } catch (error) {
      Logger.error('GameStateManager: Failed to setup event listeners:', error);
    }
  }

  /**
   * Start new game
   */
  startGame() {
    this.isPlaying = true;
    this.isPaused = false;
    this.isGameOver = false;
    this.gameStartTime = Date.now();
    this.currentWave = 1;
    this.enemiesDestroyed = 0;

    Logger.info('Game started', {
      lives: this.lives,
      level: this.currentLevel,
      startTime: this.gameStartTime,
    });

    this.scene.events.emit('gameStart', this.getGameState());
  }

  /**
   * Pause game
   */
  pauseGame() {
    if (!this.isPlaying || this.isGameOver) return;

    this.isPaused = true;
    Logger.info('Game paused');

    this.scene.events.emit('gamePause', this.getGameState());
  }

  /**
   * Resume game
   */
  resumeGame() {
    if (!this.isPlaying || this.isGameOver) return;

    this.isPaused = false;
    Logger.info('Game resumed');

    this.scene.events.emit('gameResume', this.getGameState());
  }

  /**
   * End game
   * @param {string} reason - Reason for game over
   */
  endGame(reason = 'player_death') {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    this.isGameOver = true;
    this.gameEndTime = Date.now();
    this.totalPlayTime += this.gameEndTime - this.gameStartTime;

    // Update high scores
    this.updateHighScores();

    Logger.info('Game ended', {
      reason,
      score: this.score,
      wave: this.currentWave,
      playTime: this.gameEndTime - this.gameStartTime,
    });

    this.scene.events.emit('gameOver', {
      reason,
      ...this.getGameState(),
    });

    // Auto-save final state
    this.saveGame();
  }

  /**
   * Restart game (reset progress but keep unlocks)
   */
  restartGame() {
    // Reset game progress
    this.score = 0;
    this.lives = 3;
    this.currentWave = 1;
    this.enemiesDestroyed = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.consecutiveHits = 0;
    this.powerUpsCollected = 0;
    this.powerUpTypes = {};

    // Keep permanent progress
    // (level, weapons unlocked, achievements remain)

    this.startGame();
    Logger.info('Game restarted');
  }

  /**
   * Handle enemy destroyed event
   * @param {Object} eventData - Enemy death event data
   */
  onEnemyDestroyed(eventData) {
    const { enemy, scoreValue } = eventData;

    // Add score with multiplier
    const points = Math.floor(scoreValue * this.scoreMultiplier);
    this.addScore(points);

    // Add experience
    const exp = Math.floor(scoreValue * 0.1 * this.experienceMultiplier);
    this.addExperience(exp);

    // Update statistics
    this.enemiesDestroyed++;
    this.totalEnemiesDestroyed++;
    this.consecutiveHits++;
    this.maxConsecutiveHits = Math.max(this.maxConsecutiveHits, this.consecutiveHits);

    // Check achievements
    this.checkAchievements();

    Logger.debug(`Enemy destroyed: +${points} score, +${exp} XP`, {
      enemyType: enemy.enemyType,
      totalScore: this.score,
      consecutiveHits: this.consecutiveHits,
    });
  }

  /**
   * Handle wave start event
   * @param {Object} eventData - Wave start data
   */
  onWaveStart(eventData) {
    this.currentWave = eventData.wave;
    this.enemiesDestroyed = 0;

    // Increase score multiplier slightly each wave
    this.scoreMultiplier = 1.0 + (this.currentWave - 1) * 0.05;

    Logger.info(`Wave ${this.currentWave} started`, {
      scoreMultiplier: this.scoreMultiplier.toFixed(2),
    });
  }

  /**
   * Handle wave complete event
   * @param {Object} eventData - Wave complete data
   */
  onWaveComplete(_eventData) {
    this.wavesCompleted++;
    this.highestWave = Math.max(this.highestWave, this.currentWave);

    // Wave completion bonus
    const waveBonus = Math.floor(1000 * this.currentWave * this.scoreMultiplier);
    this.addScore(waveBonus);

    // Experience bonus
    const expBonus = Math.floor(200 * this.currentWave);
    this.addExperience(expBonus);

    Logger.info(`Wave ${this.currentWave} completed`, {
      waveBonus,
      expBonus,
      totalScore: this.score,
    });

    this.checkAchievements();
  }

  /**
   * Handle player damage event
   * @param {Object} eventData - Player damage data
   */
  onPlayerDamage(eventData) {
    // Reset consecutive hits on taking damage
    this.consecutiveHits = 0;

    Logger.debug('Player took damage', { damage: eventData.damage });
  }

  /**
   * Handle player death event
   */
  onPlayerDeath() {
    this.lives--;
    this.consecutiveHits = 0;

    if (this.lives <= 0) {
      this.endGame('no_lives');
    } else {
      Logger.info(`Player died, ${this.lives} lives remaining`);

      // Brief invulnerability bonus score
      this.addScore(100);
    }
  }

  /**
   * Handle weapon fire event
   */
  onWeaponFire() {
    this.shotsFired++;
    this.updateAccuracy();
  }

  /**
   * Handle weapon hit event
   */
  onWeaponHit() {
    this.shotsHit++;
    this.updateAccuracy();
  }

  /**
   * Handle weapon unlocked event
   * @param {Object} eventData - Weapon unlock data
   */
  onWeaponUnlocked(eventData) {
    this.weaponsUnlocked.add(eventData.weaponType);
    Logger.info(`Weapon unlocked: ${eventData.weaponName}`);
  }

  /**
   * Handle power-up collected event
   * @param {Object} eventData - Power-up collection data
   */
  onPowerUpCollected(eventData) {
    this.powerUpsCollected++;

    const powerUpType = eventData.type || 'unknown';
    this.powerUpTypes[powerUpType] = (this.powerUpTypes[powerUpType] || 0) + 1;

    // Power-up collection bonus
    this.addScore(250);

    Logger.debug(`Power-up collected: ${powerUpType}`);
  }

  /**
   * Handle game start event
   * @param {Object} eventData - Game start data
   */
  onGameStart(eventData) {
    Logger.debug('GameStateManager received game start event', eventData);
  }

  /**
   * Handle game pause event
   * @param {Object} eventData - Game pause data
   */
  onGamePause(eventData) {
    Logger.debug('GameStateManager received game pause event', eventData);
  }

  /**
   * Handle game resume event
   * @param {Object} eventData - Game resume data
   */
  onGameResume(eventData) {
    Logger.debug('GameStateManager received game resume event', eventData);
  }

  /**
   * Add score with validation
   * @param {number} points - Points to add
   */
  addScore(points) {
    if (points <= 0) return;

    this.score += points;

    // Check for extra life milestones
    const extraLifeThreshold = 50000;
    const previousThreshold = Math.floor((this.score - points) / extraLifeThreshold);
    const currentThreshold = Math.floor(this.score / extraLifeThreshold);

    if (currentThreshold > previousThreshold && this.lives < this.maxLives) {
      this.addLife();
      Logger.info(`Extra life earned at ${this.score} points!`);
    }
  }

  /**
   * Add experience and handle level ups
   * @param {number} exp - Experience to add
   */
  addExperience(exp) {
    if (exp <= 0) return;

    this.experience += exp;

    while (this.experience >= this.experienceToNextLevel) {
      this.levelUp();
    }
  }

  /**
   * Handle level up
   */
  levelUp() {
    this.experience -= this.experienceToNextLevel;
    this.currentLevel++;

    // Increase XP requirement for next level
    this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.2);

    // Level up rewards
    this.addScore(1000 * this.currentLevel);

    // Check for weapon unlocks
    this.checkWeaponUnlocks();

    Logger.info(`Level up! Now level ${this.currentLevel}`, {
      nextLevelXP: this.experienceToNextLevel,
      currentXP: this.experience,
    });

    this.scene.events.emit('levelUp', {
      level: this.currentLevel,
      nextLevelXP: this.experienceToNextLevel,
    });
  }

  /**
   * Check for weapon unlocks based on level
   */
  checkWeaponUnlocks() {
    const weaponUnlocks = {
      3: 'plasma',
      7: 'missile',
    };

    const unlockedWeapon = weaponUnlocks[this.currentLevel];
    if (unlockedWeapon && !this.weaponsUnlocked.has(unlockedWeapon)) {
      this.weaponsUnlocked.add(unlockedWeapon);
      this.scene.events.emit('weaponUnlocked', {
        weaponType: unlockedWeapon,
        level: this.currentLevel,
      });
    }
  }

  /**
   * Add extra life
   */
  addLife() {
    if (this.lives < this.maxLives) {
      this.lives++;
      this.scene.events.emit('extraLife', { lives: this.lives });
    }
  }

  /**
   * Update accuracy percentage
   */
  updateAccuracy() {
    this.accuracy = this.shotsFired > 0 ? (this.shotsHit / this.shotsFired) * 100 : 0;
  }

  /**
   * Check and unlock achievements
   */
  checkAchievements() {
    this.milestones.forEach((milestone, name) => {
      if (milestone.achieved) return;

      let currentValue = 0;

      switch (name) {
        case 'firstKill':
          currentValue = this.totalEnemiesDestroyed;
          break;
        case 'sharpshooter':
          currentValue = this.consecutiveHits;
          break;
        case 'survivor':
          currentValue = this.wavesCompleted;
          break;
        case 'destroyer':
          currentValue = this.totalEnemiesDestroyed;
          break;
        case 'wavemaster':
          currentValue = this.wavesCompleted;
          break;
        case 'accuracy':
          currentValue = this.accuracy;
          break;
      }

      milestone.current = currentValue;

      if (currentValue >= milestone.target) {
        this.unlockAchievement(name, milestone);
      }
    });
  }

  /**
   * Unlock achievement and give reward
   * @param {string} name - Achievement name
   * @param {Object} milestone - Achievement data
   */
  unlockAchievement(name, milestone) {
    milestone.achieved = true;
    this.achievements.add(name);

    // Give reward
    switch (milestone.reward) {
      case 'score':
        this.addScore(milestone.value);
        break;
      case 'life':
        this.addLife();
        break;
      case 'weapon':
        this.weaponsUnlocked.add(milestone.value);
        this.scene.events.emit('weaponUnlocked', {
          weaponType: milestone.value,
          source: 'achievement',
        });
        break;
    }

    Logger.info(`Achievement unlocked: ${name}`, {
      reward: milestone.reward,
      value: milestone.value,
    });

    this.scene.events.emit('achievementUnlocked', {
      name,
      milestone,
      totalAchievements: this.achievements.size,
    });
  }

  /**
   * Update performance metrics
   * @param {number} fps - Current FPS
   */
  updatePerformance(fps) {
    this.performanceMetrics.frameCount++;
    this.performanceMetrics.fpsHistory.push(fps);

    // Keep only recent FPS history (last 60 frames)
    if (this.performanceMetrics.fpsHistory.length > 60) {
      this.performanceMetrics.fpsHistory.shift();
    }

    // Update FPS statistics
    this.performanceMetrics.averageFPS =
      this.performanceMetrics.fpsHistory.reduce((a, b) => a + b, 0) /
      this.performanceMetrics.fpsHistory.length;
    this.performanceMetrics.minFPS = Math.min(this.performanceMetrics.minFPS, fps);
    this.performanceMetrics.maxFPS = Math.max(this.performanceMetrics.maxFPS, fps);
  }

  /**
   * Update high scores
   */
  updateHighScores() {
    const savedData = this.loadGame();
    if (!savedData.highScores) {
      savedData.highScores = [];
    }

    const gameRecord = {
      score: this.score,
      wave: this.currentWave,
      level: this.currentLevel,
      accuracy: this.accuracy,
      enemiesDestroyed: this.totalEnemiesDestroyed,
      playTime: this.totalPlayTime,
      date: new Date().toISOString(),
    };

    savedData.highScores.push(gameRecord);
    savedData.highScores.sort((a, b) => b.score - a.score);
    savedData.highScores = savedData.highScores.slice(0, 10); // Keep top 10

    this.saveGameData(savedData);
  }

  /**
   * Get current game state
   * @returns {Object} Current game state
   */
  getGameState() {
    return {
      // Game status
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      isGameOver: this.isGameOver,

      // Player stats
      score: this.score,
      lives: this.lives,
      level: this.currentLevel,
      experience: this.experience,
      experienceToNextLevel: this.experienceToNextLevel,

      // Progress
      currentWave: this.currentWave,
      enemiesDestroyed: this.enemiesDestroyed,
      totalEnemiesDestroyed: this.totalEnemiesDestroyed,
      wavesCompleted: this.wavesCompleted,

      // Weapon stats
      shotsFired: this.shotsFired,
      shotsHit: this.shotsHit,
      accuracy: this.accuracy,
      consecutiveHits: this.consecutiveHits,
      maxConsecutiveHits: this.maxConsecutiveHits,
      weaponsUnlocked: Array.from(this.weaponsUnlocked),

      // Power-ups
      powerUpsCollected: this.powerUpsCollected,
      powerUpTypes: { ...this.powerUpTypes },

      // Multipliers
      scoreMultiplier: this.scoreMultiplier,
      experienceMultiplier: this.experienceMultiplier,

      // Achievements
      achievements: Array.from(this.achievements),
      achievementProgress: Object.fromEntries(this.milestones),

      // Performance
      performance: { ...this.performanceMetrics },
    };
  }

  /**
   * Update game state (called each frame)
   * @param {number} delta - Time delta in milliseconds
   */
  update(delta) {
    if (!this.isPlaying || this.isPaused) return;

    // Update performance metrics (approximate FPS)
    const fps = 1000 / delta;
    this.updatePerformance(fps);

    // Auto-save periodically
    const now = Date.now();
    if (now - this.lastAutoSave >= this.autoSaveInterval) {
      this.saveGame();
      this.lastAutoSave = now;
    }
  }

  /**
   * Save game data to localStorage
   */
  saveGame() {
    const gameData = {
      // Persistent progress
      level: this.currentLevel,
      totalEnemiesDestroyed: this.totalEnemiesDestroyed,
      weaponsUnlocked: Array.from(this.weaponsUnlocked),
      achievements: Array.from(this.achievements),
      highestWave: this.highestWave,
      totalPlayTime: this.totalPlayTime,

      // Settings and preferences
      lastPlayed: Date.now(),
      version: '1.0.0',
    };

    this.saveGameData(gameData);
  }

  /**
   * Save data to localStorage with error handling
   * @param {Object} data - Data to save
   */
  saveGameData(data) {
    try {
      localStorage.setItem(this.saveKey, JSON.stringify(data));
      Logger.debug('Game saved successfully');
    } catch (error) {
      Logger.error('Failed to save game:', error);
    }
  }

  /**
   * Load game data from localStorage
   * @returns {Object} Loaded game data
   */
  loadGame() {
    try {
      const savedData = localStorage.getItem(this.saveKey);
      if (savedData) {
        const data = JSON.parse(savedData);

        // Apply loaded data
        if (data.level) this.currentLevel = data.level;
        if (data.totalEnemiesDestroyed) this.totalEnemiesDestroyed = data.totalEnemiesDestroyed;
        if (data.weaponsUnlocked) this.weaponsUnlocked = new Set(data.weaponsUnlocked);
        if (data.achievements) this.achievements = new Set(data.achievements);
        if (data.highestWave) this.highestWave = data.highestWave;
        if (data.totalPlayTime) this.totalPlayTime = data.totalPlayTime;

        Logger.info('Game loaded successfully', {
          level: this.currentLevel,
          weapons: this.weaponsUnlocked.size,
          achievements: this.achievements.size,
        });

        return data;
      }
    } catch (error) {
      Logger.error('Failed to load game:', error);
    }

    return {};
  }

  /**
   * Reset all progress (for debugging or new player)
   */
  resetProgress() {
    localStorage.removeItem(this.saveKey);

    // Reset to initial state
    this.currentLevel = 1;
    this.totalEnemiesDestroyed = 0;
    this.weaponsUnlocked = new Set(['laser']);
    this.achievements = new Set();
    this.highestWave = 1;
    this.totalPlayTime = 0;

    this.initializeMilestones();

    Logger.info('All progress reset');
  }

  /**
   * Get statistics for display
   * @returns {Object} Display statistics
   */
  getDisplayStats() {
    return {
      score: this.score.toLocaleString(),
      lives: this.lives,
      level: this.currentLevel,
      wave: this.currentWave,
      accuracy: `${this.accuracy.toFixed(1)}%`,
      consecutiveHits: this.consecutiveHits,
      powerUps: this.powerUpsCollected,
      fps: Math.round(this.performanceMetrics.averageFPS),
    };
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    if (this.scene.events) {
      this.scene.events.off('enemyDeath', this.onEnemyDestroyed, this);
      this.scene.events.off('waveStart', this.onWaveStart, this);
      this.scene.events.off('waveComplete', this.onWaveComplete, this);
      this.scene.events.off('playerDamage', this.onPlayerDamage, this);
      this.scene.events.off('playerDeath', this.onPlayerDeath, this);
      this.scene.events.off('weaponFire', this.onWeaponFire, this);
      this.scene.events.off('weaponHit', this.onWeaponHit, this);
      this.scene.events.off('weaponUnlocked', this.onWeaponUnlocked, this);
      this.scene.events.off('powerUpCollected', this.onPowerUpCollected, this);
    }

    // Final save
    this.saveGame();

    Logger.info('GameStateManager destroyed');
  }
}

export default GameStateManager;
