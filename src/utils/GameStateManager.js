import ConfigManager from '@/config/ConfigManager.js';
import { getEventBus } from '@/event-bus/EventBus.js';
import { EventPriority, EventTypes } from '@/event-bus/EventTypes.js';
import { makeScoreUpdatedEvent } from '@/event-bus/GameEvents.js';
import Logger from './Logger.js';

/**
 * Game State Manager
 * @class
 * @classdesc Manages overall game state, score, lives, progression, and persistence.
 * Handles game over conditions, state transitions, achievements, and save/load functionality.
 * Integrates with EventBus for reactive state management and ConfigManager for configuration.
 */
class GameStateManager {
  // Private internal fields
  #logger;
  #eventBus;
  #eventListenerIds;
  #saveKey = 'space-shooter-save';
  #autoSaveInterval = 30000;
  #lastAutoSave = 0;

  /**
   * Create a new GameStateManager instance
   * @param {Phaser.Scene} [scene=null] - Optional Phaser scene reference
   */
  constructor(scene = null) {
    // Input validation
    if (scene !== null && (!scene || typeof scene.scene === 'undefined')) {
      throw new TypeError('scene parameter must be null or a valid Phaser.Scene instance');
    }

    this.#logger = Logger.scope('GameStateManager');
    this.#eventBus = getEventBus();
    this.#eventListenerIds = new Map();

    const config = ConfigManager.getConfig();

    this.scene = scene;

    // Game state
    this.isPlaying = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.gameStartTime = 0;
    this.gameEndTime = 0;
    this.totalPlayTime = 0;

    // Player statistics
    // TODO: This should be somewhere else, like level system, health system
    this.score = 0;
    this.lives = config.startingLives || 3;
    this.maxLives = 5;
    this.characterLevel = 1;
    this.experience = 0;
    this.experienceToNextLevel = 1000;

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
    this.scoreMultiplier = config.baseScoreMultiplier || 1.0; // TODO: Double check all configs
    this.experienceMultiplier = 1.0;
    this.consecutiveHits = 0;
    this.maxConsecutiveHits = 0;

    // Game progression
    this.enemiesDestroyed = 0;
    this.totalEnemiesDestroyed = 0;
    this.levelsCompleted = 0;
    this.highestLevel = 1;

    // Achievements and milestones
    this.achievements = new Set();
    this.milestones = new Map();
    this.initializeMilestones();

    // Event listeners
    this.setupEventListeners();
  }

  /**
   * Initialize achievement milestones with targets and rewards
   * @private
   * @returns {void}
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
    this.milestones.set('levelmaster', {
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
   * Setup EventBus listeners for game events
   * @private
   * @returns {void}
   */
  setupEventListeners() {
    if (!this.#eventBus) {
      throw new Error('EventBus not available');
    }

    try {
      // Enemy destruction events - HIGH priority for immediate score updates
      const enemyDestroyedId = this.#eventBus.on(
        EventTypes.ENEMY_DESTROYED,
        this.onEnemyDestroyed,
        this,
        EventPriority.HIGH,
      );
      this.#eventListenerIds.set('enemyDeath', enemyDestroyedId);

      const playerDamageId = this.#eventBus.on(
        EventTypes.PLAYER_DAMAGED,
        this.onPlayerDamage,
        this,
        EventPriority.HIGH,
      );
      this.#eventListenerIds.set('playerDamage', playerDamageId);

      const playerDeathId = this.#eventBus.on(
        EventTypes.PLAYER_DESTROYED,
        this.onPlayerDestroyed,
        this,
        EventPriority.HIGH,
      );
      this.#eventListenerIds.set('playerDeath', playerDeathId);

      // Weapon events - HIGH priority for accuracy tracking
      const weaponFiredId = this.#eventBus.on(
        EventTypes.WEAPON_FIRED,
        this.onWeaponFired,
        this,
        EventPriority.HIGH,
      );
      this.#eventListenerIds.set('weaponFire', weaponFiredId);

      const weaponHitId = this.#eventBus.on(
        EventTypes.WEAPON_HIT,
        this.onWeaponHit,
        this,
        EventPriority.HIGH,
      );
      this.#eventListenerIds.set('weaponHit', weaponHitId);

      const weaponUnlockedId = this.#eventBus.on(
        EventTypes.WEAPON_UNLOCKED,
        this.onWeaponUnlocked,
        this,
        EventPriority.NORMAL,
      );
      this.#eventListenerIds.set('weaponUnlocked', weaponUnlockedId);

      // Power-up events - NORMAL priority
      const powerUpId = this.#eventBus.on(
        EventTypes.POWERUP_COLLECTED,
        this.onPowerUpCollected,
        this,
        EventPriority.NORMAL,
      );
      this.#eventListenerIds.set('powerUpCollected', powerUpId);

      // Level progression events - HIGH priority for immediate updates
      const levelStartedId = this.#eventBus.on(
        EventTypes.LEVEL_STARTED,
        this.onLevelStarted,
        this,
        EventPriority.HIGH,
      );
      this.#eventListenerIds.set('levelStarted', levelStartedId);

      const levelCompletedId = this.#eventBus.on(
        EventTypes.LEVEL_COMPLETED,
        this.onLevelCompleted,
        this,
        EventPriority.HIGH,
      );
      this.#eventListenerIds.set('levelCompleted', levelCompletedId);
    } catch (error) {
      this.#logger.error('Failed to setup EventBus listeners:', error);
    }
  }

  /**
   * Start a new game session
   * @returns {void}
   */
  startGame() {
    this.isPlaying = true;
    this.isPaused = false;
    this.isGameOver = false;
    this.gameStartTime = Date.now();
    this.enemiesDestroyed = 0;

    this.#eventBus.emit(EventTypes.GAME_STARTED, this.getGameState());
  }

  /**
   * Pause the current game
   * @returns {void}
   */
  pauseGame() {
    if (!this.isPlaying || this.isGameOver) return;

    this.isPaused = true;

    this.#eventBus.emit(EventTypes.GAME_PAUSED, this.getGameState());
    this.#eventBus.emit(EventTypes.GAME_PAUSE_TOGGLE, { paused: true }); // TODO: Do we really need this? Move to PAUSE/RESUME only?
  }

  /**
   * Resume the paused game
   * @returns {void}
   */
  resumeGame() {
    if (!this.isPlaying || this.isGameOver) return;

    this.isPaused = false;

    this.#eventBus.emit(EventTypes.GAME_RESUMED, this.getGameState());
    this.#eventBus.emit(EventTypes.GAME_PAUSE_TOGGLE, { paused: false });
  }

  /**
   * Toggle game pause state
   * @returns {void}
   */
  togglePause() {
    if (!this.isPlaying || this.isGameOver) return;

    if (this.isPaused) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }
  }

  /**
   * End the current game session
   * @param {string} [reason='player_death'] - Reason for game end
   * @returns {void}
   */
  endGame(reason = 'player_death') {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    this.isGameOver = true;
    this.gameEndTime = Date.now();
    this.totalPlayTime += this.gameEndTime - this.gameStartTime;

    // Update high scores
    this.updateHighScores();

    this.#eventBus.emit(EventTypes.GAME_OVER, {
      reason,
      ...this.getGameState(),
    });

    // Auto-save final state
    this.saveGame();
  }

  /**
   * Restart the game with a fresh session while keeping permanent progress
   * @returns {void}
   */
  restartGame() {
    const config = ConfigManager.getConfig();

    // Reset game progress
    this.score = 0;
    this.lives = config.startingLives || 3;
    this.currentLevel = 1;
    this.enemiesDestroyed = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.consecutiveHits = 0;
    this.powerUpsCollected = 0;
    this.powerUpTypes = {};

    // Keep permanent progress
    // (level, weapons unlocked, achievements remain)

    this.startGame();
  }

  /**
   * Handle enemy destroyed event
   * @param {Object} eventData - Event data containing enemy
   * @param {number} eventData.enemy
   * @param {number} eventData.enemy.score
   * @returns {void}
   */
  onEnemyDestroyed(eventData) {
    const { enemy } = eventData;

    // Add score with multiplier
    const points = Math.floor(enemy.score * this.scoreMultiplier);
    this.addScore(points);

    // Add experience
    const exp = Math.floor(enemy.score * 0.1 * this.experienceMultiplier);
    this.addExperience(exp);

    // Update statistics
    this.enemiesDestroyed++;
    this.totalEnemiesDestroyed++;
    this.consecutiveHits++;
    this.maxConsecutiveHits = Math.max(this.maxConsecutiveHits, this.consecutiveHits);

    // Check achievements
    this.checkAchievements();
  }

  /**
   * Handle level start event
   * @param {Object} eventData - Event data containing level information
   * @param {number} eventData.level - The level number that started
   * @returns {void}
   */
  onLevelStarted(eventData) {
    this.currentLevel = eventData.level;
    this.enemiesDestroyed = 0;

    // Increase score multiplier slightly each level
    this.scoreMultiplier = 1.0 + (this.currentLevel - 1) * 0.05;

    this.#logger.info(`Level ${this.currentLevel} started`, {
      scoreMultiplier: this.scoreMultiplier.toFixed(2),
    });
  }

  /**
   * Handle level complete event
   * @param {Object} _eventData - Level complete data (unused)
   * @returns {void}
   */
  onLevelCompleted(_eventData) {
    this.levelsCompleted++;
    this.highestLevel = Math.max(this.highestLevel, this.currentLevel);

    // Level completion bonus
    const levelBonus = Math.floor(1000 * this.currentLevel * this.scoreMultiplier);
    this.addScore(levelBonus);

    // Experience bonus
    const expBonus = Math.floor(200 * this.currentLevel);
    this.addExperience(expBonus);

    this.#logger.info(`Level ${this.currentLevel} completed`, {
      levelBonus,
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
  }

  /**
   * Handle player death event
   * @returns {void}
   */
  onPlayerDestroyed() {
    this.consecutiveHits = 0;

    this.endGame('no_lives');
  }

  /**
   * Handle weapon fire event
   * @returns {void}
   */
  onWeaponFired() {
    this.shotsFired++;
    this.updateAccuracy();
  }

  /**
   * Handle weapon hit event
   * @returns {void}
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
    this.#logger.info(`Weapon unlocked: ${eventData.weaponName}`);
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
  }

  /**
   * Add score with validation
   * @param {number} points - Points to add
   */
  addScore(points) {
    if (typeof points !== 'number' || isNaN(points)) {
      throw new TypeError('Score points must be a valid number');
    }
    if (points <= 0) return;

    this.score += points;

    // Check for extra life milestones
    const extraLifeThreshold = 50000;
    const previousThreshold = Math.floor((this.score - points) / extraLifeThreshold);
    const currentThreshold = Math.floor(this.score / extraLifeThreshold);

    if (currentThreshold > previousThreshold && this.lives < this.maxLives) {
      this.addLife();
      this.#logger.info(`Extra life earned at ${this.score} points!`);
    }

    const event = makeScoreUpdatedEvent(this.score);
    this.#eventBus.emit(event.type, event.data, event.priority);
  }

  /**
   * Add experience and handle level ups
   * @param {number} exp - Experience to add
   */
  addExperience(exp) {
    if (typeof exp !== 'number' || isNaN(exp)) {
      throw new TypeError('exp must be a valid number');
    }
    if (exp <= 0) return;

    this.experience += exp;

    while (this.experience >= this.experienceToNextLevel) {
      this.levelUp();
    }
  }

  /**
   * Handle level up
   * @returns {void}
   */
  levelUp() {
    this.experience -= this.experienceToNextLevel;
    this.characterLevel++;

    // Increase XP requirement for next level
    this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.2);

    // Level up rewards
    this.addScore(1000 * this.characterLevel);

    // Check for weapon unlocks
    this.checkWeaponUnlocks();

    this.#logger.info(`Character level up! Now level ${this.characterLevel}`, {
      nextLevelXP: this.experienceToNextLevel,
      currentXP: this.experience,
    });

    this.#eventBus.emit(EventTypes.LEVEL_UP, {
      level: this.characterLevel,
      nextLevelXP: this.experienceToNextLevel,
    });
  }

  /**
   * Check for weapon unlocks based on level
   * @private
   * @returns {void}
   */
  checkWeaponUnlocks() {
    const weaponUnlocks = {
      3: 'plasma',
      7: 'missile',
    };

    const unlockedWeapon = weaponUnlocks[this.characterLevel];
    if (unlockedWeapon && !this.weaponsUnlocked.has(unlockedWeapon)) {
      this.weaponsUnlocked.add(unlockedWeapon);
      this.#eventBus.emit(EventTypes.WEAPON_UNLOCKED, {
        weaponType: unlockedWeapon,
        level: this.characterLevel,
      });
    }
  }

  /**
   * Add extra life
   * @returns {void}
   */
  addLife() {
    if (this.lives < this.maxLives) {
      this.lives++;
      this.#eventBus.emit(EventTypes.EXTRA_LIFE, { lives: this.lives });
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
   * @private
   * @returns {void}
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
          currentValue = this.levelsCompleted;
          break;
        case 'destroyer':
          currentValue = this.totalEnemiesDestroyed;
          break;
        case 'levelmaster':
          currentValue = this.levelsCompleted;
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
        this.#eventBus.emit(EventTypes.WEAPON_UNLOCKED, {
          weaponType: milestone.value,
          source: 'achievement',
        });
        break;
    }

    this.#logger.info(`Achievement unlocked: ${name}`, {
      reward: milestone.reward,
      value: milestone.value,
    });

    this.#eventBus.emit(EventTypes.ACHIEVEMENT_UNLOCKED, {
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
    if (typeof fps !== 'number' || isNaN(fps) || fps < 0) {
      throw new TypeError('fps must be a valid non-negative number');
    }
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
   * @private
   * @returns {void}
   */
  updateHighScores() {
    const savedData = this.loadGame();
    if (!savedData.highScores) {
      savedData.highScores = [];
    }

    const gameRecord = {
      score: this.score,
      level: this.currentLevel,
      characterLevel: this.characterLevel,
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
      characterLevel: this.characterLevel,
      experience: this.experience,
      experienceToNextLevel: this.experienceToNextLevel,

      // Progress
      currentLevel: this.currentLevel,
      enemiesDestroyed: this.enemiesDestroyed,
      totalEnemiesDestroyed: this.totalEnemiesDestroyed,
      levelsCompleted: this.levelsCompleted,

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
   * Update game state
   * @param {number} delta - Time delta in milliseconds
   */
  update(delta) {
    if (!this.isPlaying || this.isPaused) return;

    // Update performance metrics (approximate FPS)
    const fps = 1000 / delta;
    this.updatePerformance(fps);

    // Auto-save periodically
    // TODO: Move to a separate system using EventBus
    // const now = Date.now();
    // if (now - this.lastAutoSave >= this.autoSaveInterval) {
    //   this.saveGame();
    //   this.lastAutoSave = now;
    // }

    this.#eventBus.emit(EventTypes.GAME_CYCLE, delta);
  }

  /**
   * Save game data to localStorage
   * @returns {void}
   */
  saveGame() {
    const gameData = {
      // Persistent progress
      characterLevel: this.characterLevel,
      totalEnemiesDestroyed: this.totalEnemiesDestroyed,
      weaponsUnlocked: Array.from(this.weaponsUnlocked),
      achievements: Array.from(this.achievements),
      highestLevel: this.highestLevel,
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
    if (!data || typeof data !== 'object') {
      throw new TypeError('data must be a valid object');
    }
    try {
      localStorage.setItem(this.saveKey, JSON.stringify(data));
    } catch (error) {
      this.#logger.error('Failed to save game:', error);
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
        if (data.characterLevel) this.characterLevel = data.characterLevel;
        if (data.level) this.characterLevel = data.level; // Backward compatibility
        if (data.totalEnemiesDestroyed) this.totalEnemiesDestroyed = data.totalEnemiesDestroyed;
        if (data.weaponsUnlocked) this.weaponsUnlocked = new Set(data.weaponsUnlocked);
        if (data.achievements) this.achievements = new Set(data.achievements);
        if (data.highestLevel) this.highestLevel = data.highestLevel;
        if (data.highestWave) this.highestLevel = data.highestWave; // Backward compatibility
        if (data.totalPlayTime) this.totalPlayTime = data.totalPlayTime;

        return data;
      }
    } catch (error) {
      this.#logger.error('Failed to load game:', error);
    }

    return {};
  }

  /**
   * Reset all progress (for debugging or new player)
   * @returns {void}
   */
  resetProgress() {
    localStorage.removeItem(this.saveKey);

    // Reset to initial state
    this.characterLevel = 1;
    this.totalEnemiesDestroyed = 0;
    this.weaponsUnlocked = new Set(['laser']);
    this.achievements = new Set();
    this.highestLevel = 1;
    this.totalPlayTime = 0;

    this.initializeMilestones();

    this.#logger.info('All progress reset');
  }

  /**
   * Get statistics for display
   * @returns {Object} Display statistics
   */
  getDisplayStats() {
    return {
      score: this.score.toLocaleString(),
      lives: this.lives,
      characterLevel: this.characterLevel,
      level: this.currentLevel,
      accuracy: `${this.accuracy.toFixed(1)}%`,
      consecutiveHits: this.consecutiveHits,
      powerUps: this.powerUpsCollected,
      fps: Math.round(this.performanceMetrics.averageFPS),
    };
  }

  /**
   * Clean up event listeners and save final state
   * @returns {void}
   */
  destroy() {
    // Clean up all EventBus listeners
    if (this.#eventBus && this.#eventListenerIds.size > 0) {
      for (const [eventName, listenerId] of this.#eventListenerIds) {
        try {
          const removed = this.#eventBus.off(listenerId);
          if (!removed) {
            this.#logger.warn(`Failed to remove listener for ${eventName}: ${listenerId}`);
          }
        } catch (error) {
          this.#logger.error(`Error removing listener for ${eventName}:`, error);
        }
      }

      this.#eventListenerIds.clear();
    }

    // Final save
    this.saveGame();

    // Clean up references
    this.#eventBus = null;
    this.scene = null;

    this.#logger.info('GameStateManager destroyed');
  }
}

export default GameStateManager;
