import Logger from './Logger.js';
import { getEventBus } from '@/event-bus/EventBus.js';
import { EventPriority, EventTypes } from '@/event-bus/EventTypes.js';

/**
 * Game State Manager
 * Manages overall game state, score, lives, progression, and persistence
 * Handles game over conditions and state transitions
 */
class GameStateManager {
  constructor(scene = null) {
    // EventBus integration - framework independent
    this.eventBus = getEventBus();
    this.eventListenerIds = new Map(); // Track listener IDs for cleanup

    // Optional scene reference for compatibility (not required for EventBus)
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

    Logger.scope('GameStateManager').debug('GameStateManager constructed', {
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
   * Setup event listeners for game events using EventBus
   */
  setupEventListeners() {
    if (!this.eventBus) {
      throw new Error('EventBus not available');
    }

    try {
      // Enemy destruction events - HIGH priority for immediate score updates
      const enemyDeathId = this.eventBus.on(
        'enemyDeath',
        this.onEnemyDestroyed,
        this,
        EventPriority.HIGH
      );
      this.eventListenerIds.set('enemyDeath', enemyDeathId);

      // Wave events - NORMAL priority
      const waveStartId = this.eventBus.on(
        'waveStart',
        this.onWaveStart,
        this,
        EventPriority.NORMAL
      );
      this.eventListenerIds.set('waveStart', waveStartId);

      const waveCompleteId = this.eventBus.on(
        'waveComplete',
        this.onWaveComplete,
        this,
        EventPriority.NORMAL
      );
      this.eventListenerIds.set('waveComplete', waveCompleteId);

      // Player events - HIGH priority for immediate response
      const playerDamageId = this.eventBus.on(
        'playerDamage',
        this.onPlayerDamage,
        this,
        EventPriority.HIGH
      );
      this.eventListenerIds.set('playerDamage', playerDamageId);

      const playerDeathId = this.eventBus.on(
        'playerDeath',
        this.onPlayerDeath,
        this,
        EventPriority.HIGH
      );
      this.eventListenerIds.set('playerDeath', playerDeathId);

      // Weapon events - HIGH priority for accuracy tracking
      const weaponFireId = this.eventBus.on(
        EventTypes.WEAPON_FIRED,
        this.onWeaponFire,
        this,
        EventPriority.HIGH
      );
      this.eventListenerIds.set('weaponFire', weaponFireId);

      const weaponHitId = this.eventBus.on('weaponHit', this.onWeaponHit, this, EventPriority.HIGH);
      this.eventListenerIds.set('weaponHit', weaponHitId);

      const weaponUnlockedId = this.eventBus.on(
        EventTypes.WEAPON_UNLOCKED,
        this.onWeaponUnlocked,
        this,
        EventPriority.NORMAL
      );
      this.eventListenerIds.set('weaponUnlocked', weaponUnlockedId);

      // Power-up events - NORMAL priority
      const powerUpId = this.eventBus.on(
        'powerUpCollected',
        this.onPowerUpCollected,
        this,
        EventPriority.NORMAL
      );
      this.eventListenerIds.set('powerUpCollected', powerUpId);

      // Game state events - NORMAL priority (self-emitted events for logging/consistency)
      const gameStartId = this.eventBus.on(
        EventTypes.GAME_STARTED,
        this.onGameStart,
        this,
        EventPriority.LOW
      );
      this.eventListenerIds.set('gameStart', gameStartId);

      const gamePauseToggleId = this.eventBus.on(
        EventTypes.GAME_PAUSE_TOGGLE,
        this.onGamePauseToggle,
        this,
        EventPriority.LOW
      );
      this.eventListenerIds.set('gamePauseToggle', gamePauseToggleId);

      const gamePauseId = this.eventBus.on(
        EventTypes.GAME_PAUSED,
        this.onGamePause,
        this,
        EventPriority.LOW
      );
      this.eventListenerIds.set('gamePause', gamePauseId);

      const gameResumeId = this.eventBus.on(
        EventTypes.GAME_RESUMED,
        this.onGameResume,
        this,
        EventPriority.LOW
      );
      this.eventListenerIds.set('gameResume', gameResumeId);

      Logger.scope('GameStateManager').debug('EventBus listeners set up successfully', {
        listenerCount: this.eventListenerIds.size,
      });
    } catch (error) {
      Logger.scope('GameStateManager').error('Failed to setup EventBus listeners:', error);
    }
  }

  /**
   * Initializes and starts the game by setting up the initial game state,
   * logging the start event, and emitting the game start event to the scene.
   *
   * @return {void} No return value.
   */
  startGame() {
    this.isPlaying = true;
    this.isPaused = false;
    this.isGameOver = false;
    this.gameStartTime = Date.now();
    this.currentWave = 1;
    this.enemiesDestroyed = 0;

    Logger.scope('GameStateManager').debug('Game started', {
      lives: this.lives,
      level: this.currentLevel,
      startTime: this.gameStartTime,
    });

    this.eventBus.emit(EventTypes.GAME_STARTED, this.getGameState());
  }

  /**
   * Pause game
   */
  pauseGame() {
    if (!this.isPlaying || this.isGameOver) return;

    this.isPaused = true;
    Logger.scope('GameStateManager').info('Game paused');

    this.eventBus.emit(EventTypes.GAME_PAUSED, this.getGameState());
  }

  /**
   * Resume game
   */
  resumeGame() {
    if (!this.isPlaying || this.isGameOver) return;

    this.isPaused = false;
    Logger.scope('GameStateManager').info('Game resumed');

    this.eventBus.emit(EventTypes.GAME_RESUMED, this.getGameState());
  }

  /**
   * Toggle pause state (convenience method for input handlers)
   */
  togglePause() {
    if (!this.isPlaying || this.isGameOver) return;

    if (this.isPaused) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }

    Logger.scope('GameStateManager').debug('Pause toggled', {
      isPaused: this.isPaused,
    });
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

    Logger.scope('GameStateManager').info('Game ended', {
      reason,
      score: this.score,
      wave: this.currentWave,
      playTime: this.gameEndTime - this.gameStartTime,
    });

    this.eventBus.emit(EventTypes.GAME_OVER, {
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
    Logger.scope('GameStateManager').info('Game restarted');
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

    Logger.scope('GameStateManager').debug(`Enemy destroyed: +${points} score, +${exp} XP`, {
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

    Logger.scope('GameStateManager').info(`Wave ${this.currentWave} started`, {
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

    Logger.scope('GameStateManager').info(`Wave ${this.currentWave} completed`, {
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

    Logger.scope('GameStateManager').debug('Player took damage', { damage: eventData.damage });
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
      Logger.scope('GameStateManager').info(`Player died, ${this.lives} lives remaining`);

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
    Logger.scope('GameStateManager').info(`Weapon unlocked: ${eventData.weaponName}`);
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

    Logger.scope('GameStateManager').debug(`Power-up collected: ${powerUpType}`);
  }

  /**
   * Handle game start event
   * @param {Object} eventData - Game start data
   */
  onGameStart(eventData) {
    Logger.scope('GameStateManager').debug('received game start event', eventData);
  }

  onGamePauseToggle(eventData) {
    if (!this.isPlaying || this.isGameOver) return;

    if (this.isPaused) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }

    Logger.scope('GameStateManager').debug('Pause toggled', eventData);
  }

  /**
   * Handle game pause event
   * @param {Object} eventData - Game pause data
   */
  onGamePause(eventData) {
    Logger.scope('GameStateManager').debug('received game pause event', eventData);
  }

  /**
   * Handle game resume event
   * @param {Object} eventData - Game resume data
   */
  onGameResume(eventData) {
    Logger.scope('GameStateManager').debug('received game resume event', eventData);
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
      Logger.scope('GameStateManager').info(`Extra life earned at ${this.score} points!`);
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

    Logger.scope('GameStateManager').info(`Level up! Now level ${this.currentLevel}`, {
      nextLevelXP: this.experienceToNextLevel,
      currentXP: this.experience,
    });

    this.eventBus.emit(EventTypes.LEVEL_UP, {
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
      this.eventBus.emit(EventTypes.WEAPON_UNLOCKED, {
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
      this.eventBus.emit(EventTypes.EXTRA_LIFE, { lives: this.lives });
    }
  }

  /**
   * Updates the accuracy based on the number of shots hit and shots fired.
   *
   * @return {void} Does not return a value.
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
        this.eventBus.emit(EventTypes.WEAPON_UNLOCKED, {
          weaponType: milestone.value,
          source: 'achievement',
        });
        break;
    }

    Logger.scope('GameStateManager').info(`Achievement unlocked: ${name}`, {
      reward: milestone.reward,
      value: milestone.value,
    });

    this.eventBus.emit(EventTypes.ACHIEVEMENT_UNLOCKED, {
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
      Logger.scope('GameStateManager').debug('Game saved successfully');
    } catch (error) {
      Logger.scope('GameStateManager').error('Failed to save game:', error);
    }
  }

  /**
   * Load game data from localStorage
   * @returns {Object} Loaded game data
   */
  loadGame() {
    Logger.scope('GameStateManager').debug('loadGame()');

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

        Logger.scope('GameStateManager').debug('Saved data loaded successfully', {
          level: this.currentLevel,
          weapons: this.weaponsUnlocked.size,
          achievements: this.achievements.size,
        });

        return data;
      }
    } catch (error) {
      Logger.scope('GameStateManager').error('Failed to load game:', error);
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

    Logger.scope('GameStateManager').info('All progress reset');
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
   * Clean up event listeners and save final state
   */
  destroy() {
    // Clean up all EventBus listeners
    if (this.eventBus && this.eventListenerIds.size > 0) {
      Logger.scope('GameStateManager').debug('Cleaning up EventBus listeners', {
        listenerCount: this.eventListenerIds.size,
      });

      for (const [eventName, listenerId] of this.eventListenerIds) {
        try {
          const removed = this.eventBus.off(listenerId);
          if (!removed) {
            Logger.scope('GameStateManager').warn(
              `Failed to remove listener for ${eventName}: ${listenerId}`
            );
          }
        } catch (error) {
          Logger.scope('GameStateManager').error(
            `Error removing listener for ${eventName}:`,
            error
          );
        }
      }

      this.eventListenerIds.clear();
    }

    // Final save
    this.saveGame();

    // Clean up references
    this.eventBus = null;
    this.scene = null;

    Logger.scope('GameStateManager').info('GameStateManager destroyed');
  }
}

export default GameStateManager;
