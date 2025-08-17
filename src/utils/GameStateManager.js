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
    this.currentLevel = 1; // Game progression level (separate from character XP level)
    this.experience = 0;
    this.experienceToNextLevel = this.calculateXPRequired(2) - this.calculateXPRequired(1); // XP needed to reach level 2

    // Points system for progression upgrades
    this.availablePoints = 0; // Points available to spend
    this.spentPoints = 0; // Points already spent
    this.pointsHistory = []; // History of point transactions for debugging

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
    this.currentLevel = 1; // Reset game level
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

    // Add experience with scaling based on enemy type and level
    const baseExp = Math.floor(enemy.score * 0.15); // Increased base XP rate
    const levelScaling = 1 + ((this.currentLevel || 1) - 1) * 0.1; // Scale with current level, default to 1
    const exp = Math.floor(baseExp * levelScaling * this.experienceMultiplier);
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

    // Experience bonus - scales with level and has multiplier support
    const baseExpBonus = 200;
    const levelMultiplier = Math.pow(this.currentLevel, 0.8); // Gradual scaling
    const expBonus = Math.floor(baseExpBonus * levelMultiplier * this.experienceMultiplier);
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
   * Add experience and handle level ups with proper overflow handling
   * @param {number} exp - Experience to add
   */
  addExperience(exp) {
    if (typeof exp !== 'number' || isNaN(exp)) {
      throw new TypeError('exp must be a valid number');
    }
    if (exp <= 0) return;

    this.experience += exp;

    // Emit XP gained event for UI feedback
    this.#eventBus.emit(EventTypes.XP_GAINED, {
      amount: exp,
      currentXP: this.experience,
      requiredXP: this.experienceToNextLevel,
      level: this.characterLevel,
      progress: Math.min(1, this.experience / this.experienceToNextLevel),
    });

    // Handle multiple level-ups with proper overflow
    while (this.experience >= this.experienceToNextLevel) {
      this.levelUp();
    }
  }

  /**
   * Calculate XP required to reach a specific level using the mathematical formula
   * Formula: XP_required = 100 * level^1.5 + 50 * (level - 1)
   * When fast progression is enabled, requirements are divided by 5 for easier testing
   * @param {number} level - Target level
   * @returns {number} XP required to reach that level
   */
  calculateXPRequired(level) {
    if (typeof level !== 'number' || level < 1) {
      throw new TypeError('level must be a number >= 1');
    }

    const config = ConfigManager.getConfig();
    const baseXP = Math.floor(100 * Math.pow(level, 1.5) + 50 * (level - 1));

    // Apply fast progression divisor for testing/development
    if (config.fastProgression) {
      return Math.floor(baseXP / 5);
    }

    return baseXP;
  }

  /**
   * Calculate points awarded for reaching a specific level
   * Point allocation based on level ranges:
   * - Levels 1-5: 3 points per level
   * - Levels 6-10: 4 points per level
   * - Levels 11-15: 5 points per level
   * - Levels 16-20: 6 points per level
   * - Levels 21+: 7 points per level
   * @param {number} level - Target level
   * @returns {number} Points awarded for reaching that level
   */
  calculatePointsForLevel(level) {
    if (typeof level !== 'number' || level < 1) {
      throw new TypeError('level must be a number >= 1');
    }

    if (level <= 5) {
      return 3;
    } else if (level <= 10) {
      return 4;
    } else if (level <= 15) {
      return 5;
    } else if (level <= 20) {
      return 6;
    } else {
      return 7;
    }
  }

  /**
   * Handle level up
   * @returns {void}
   */
  levelUp() {
    this.experience -= this.experienceToNextLevel;
    this.characterLevel++;

    // Calculate XP requirement for next level using the mathematical formula
    this.experienceToNextLevel = this.calculateXPRequired(this.characterLevel + 1) - this.calculateXPRequired(this.characterLevel);

    // Level up rewards
    this.addScore(1000 * this.characterLevel);

    // Award points based on level
    const pointsAwarded = this.calculatePointsForLevel(this.characterLevel);
    this.awardPoints(pointsAwarded, `Level ${this.characterLevel} reached`);

    // Check for weapon unlocks
    this.checkWeaponUnlocks();

    this.#logger.info(`Character level up! Now level ${this.characterLevel}`, {
      nextLevelXP: this.experienceToNextLevel,
      currentXP: this.experience,
      pointsAwarded,
      availablePoints: this.availablePoints,
    });

    this.#eventBus.emit(EventTypes.LEVEL_UP, {
      level: this.characterLevel,
      nextLevelXP: this.experienceToNextLevel,
      totalXPForLevel: this.calculateXPRequired(this.characterLevel),
      totalXPForNextLevel: this.calculateXPRequired(this.characterLevel + 1),
      pointsAwarded,
      availablePoints: this.availablePoints,
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
   * Award points to the player with transaction tracking
   * @param {number} points - Points to award (must be positive)
   * @param {string} reason - Reason for awarding points
   * @returns {void}
   */
  awardPoints(points, reason) {
    if (typeof points !== 'number' || isNaN(points)) {
      throw new TypeError('Points must be a valid number');
    }
    if (points <= 0) {
      throw new Error('Points awarded must be positive');
    }
    if (typeof reason !== 'string' || reason.trim() === '') {
      throw new TypeError('Reason must be a non-empty string');
    }

    this.availablePoints += points;

    // Track transaction history
    const transaction = {
      type: 'earned',
      amount: points,
      reason: reason.trim(),
      timestamp: Date.now(),
      availableAfter: this.availablePoints,
      spentAfter: this.spentPoints,
    };
    this.pointsHistory.push(transaction);

    // Keep history reasonable (last 100 transactions)
    if (this.pointsHistory.length > 100) {
      this.pointsHistory.shift();
    }

    this.#logger.info(`Points awarded: ${points} (${reason})`, {
      availablePoints: this.availablePoints,
      spentPoints: this.spentPoints,
    });

    this.#eventBus.emit(EventTypes.POINTS_EARNED, {
      amount: points,
      reason,
      availablePoints: this.availablePoints,
      spentPoints: this.spentPoints,
      transaction,
    });
  }

  /**
   * Spend points with validation and transaction tracking
   * @param {number} amount - Points to spend (must be positive and <= available)
   * @param {string} reason - Reason for spending points
   * @returns {boolean} True if points were successfully spent, false otherwise
   */
  spendPoints(amount, reason) {
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new TypeError('Amount must be a valid number');
    }
    if (amount <= 0) {
      throw new Error('Amount to spend must be positive');
    }
    if (typeof reason !== 'string' || reason.trim() === '') {
      throw new TypeError('Reason must be a non-empty string');
    }

    // Validation: Can't spend more than available
    if (amount > this.availablePoints) {
      this.#logger.warn(`Cannot spend ${amount} points - only ${this.availablePoints} available`, {
        requested: amount,
        available: this.availablePoints,
        reason: reason.trim(),
      });
      return false;
    }

    this.availablePoints -= amount;
    this.spentPoints += amount;

    // Track transaction history
    const transaction = {
      type: 'spent',
      amount,
      reason: reason.trim(),
      timestamp: Date.now(),
      availableAfter: this.availablePoints,
      spentAfter: this.spentPoints,
    };
    this.pointsHistory.push(transaction);

    // Keep history reasonable (last 100 transactions)
    if (this.pointsHistory.length > 100) {
      this.pointsHistory.shift();
    }

    this.#logger.info(`Points spent: ${amount} (${reason})`, {
      availablePoints: this.availablePoints,
      spentPoints: this.spentPoints,
    });

    this.#eventBus.emit(EventTypes.POINTS_SPENT, {
      amount,
      reason,
      availablePoints: this.availablePoints,
      spentPoints: this.spentPoints,
      transaction,
    });

    return true;
  }

  /**
   * Refund points (for respec functionality)
   * @param {number} amount - Points to refund (must be positive and <= spent)
   * @param {string} reason - Reason for refunding points
   * @returns {boolean} True if points were successfully refunded, false otherwise
   */
  refundPoints(amount, reason) {
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new TypeError('Amount must be a valid number');
    }
    if (amount <= 0) {
      throw new Error('Amount to refund must be positive');
    }
    if (typeof reason !== 'string' || reason.trim() === '') {
      throw new TypeError('Reason must be a non-empty string');
    }

    // Validation: Can't refund more than spent
    if (amount > this.spentPoints) {
      this.#logger.warn(`Cannot refund ${amount} points - only ${this.spentPoints} spent`, {
        requested: amount,
        spent: this.spentPoints,
        reason: reason.trim(),
      });
      return false;
    }

    this.availablePoints += amount;
    this.spentPoints -= amount;

    // Track transaction history
    const transaction = {
      type: 'refunded',
      amount,
      reason: reason.trim(),
      timestamp: Date.now(),
      availableAfter: this.availablePoints,
      spentAfter: this.spentPoints,
    };
    this.pointsHistory.push(transaction);

    // Keep history reasonable (last 100 transactions)
    if (this.pointsHistory.length > 100) {
      this.pointsHistory.shift();
    }

    this.#logger.info(`Points refunded: ${amount} (${reason})`, {
      availablePoints: this.availablePoints,
      spentPoints: this.spentPoints,
    });

    this.#eventBus.emit(EventTypes.POINTS_EARNED, {
      amount,
      reason: `Refund: ${reason}`,
      availablePoints: this.availablePoints,
      spentPoints: this.spentPoints,
      transaction,
    });

    return true;
  }

  /**
   * Get total points earned across all levels
   * @returns {number} Total points that have been earned
   */
  getTotalPointsEarned() {
    return this.availablePoints + this.spentPoints;
  }

  /**
   * Get points breakdown for debugging
   * @returns {Object} Points summary and transaction history
   */
  getPointsDebugInfo() {
    return {
      availablePoints: this.availablePoints,
      spentPoints: this.spentPoints,
      totalEarned: this.getTotalPointsEarned(),
      transactionHistory: [...this.pointsHistory], // Copy to prevent external modification
    };
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

      // Points system
      availablePoints: this.availablePoints,
      spentPoints: this.spentPoints,
      totalPointsEarned: this.getTotalPointsEarned(),

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

      // Points system data
      availablePoints: this.availablePoints,
      spentPoints: this.spentPoints,
      pointsHistory: this.pointsHistory.slice(-50), // Save last 50 transactions

      // Settings and preferences
      lastPlayed: Date.now(),
      version: '1.1.0', // Increment version for points system
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
      localStorage.setItem(this.#saveKey, JSON.stringify(data));
    } catch (error) {
      this.#logger.error('Failed to save game:', error);
    }
  }

  /**
   * Load game data from localStorage with migration and validation
   * @returns {Object} Loaded game data
   */
  loadGame() {
    try {
      const savedData = localStorage.getItem(this.#saveKey);
      if (savedData) {
        const data = JSON.parse(savedData);

        // Data migration for points system
        const migratedData = this.migrateGameData(data);

        // Apply loaded data
        if (migratedData.characterLevel) this.characterLevel = migratedData.characterLevel;
        if (migratedData.level) this.characterLevel = migratedData.level; // Backward compatibility
        if (migratedData.totalEnemiesDestroyed) this.totalEnemiesDestroyed = migratedData.totalEnemiesDestroyed;
        if (migratedData.weaponsUnlocked) this.weaponsUnlocked = new Set(migratedData.weaponsUnlocked);
        if (migratedData.achievements) this.achievements = new Set(migratedData.achievements);
        if (migratedData.highestLevel) this.highestLevel = migratedData.highestLevel;
        if (migratedData.highestWave) this.highestLevel = migratedData.highestWave; // Backward compatibility
        if (migratedData.totalPlayTime) this.totalPlayTime = migratedData.totalPlayTime;

        // Load points system data
        if (migratedData.availablePoints !== undefined) this.availablePoints = 20;
        // if (migratedData.availablePoints !== undefined) this.availablePoints = migratedData.availablePoints;
        if (migratedData.spentPoints !== undefined) this.spentPoints = migratedData.spentPoints;
        if (migratedData.pointsHistory && Array.isArray(migratedData.pointsHistory)) {
          this.pointsHistory = migratedData.pointsHistory;
        }

        // Validate points data consistency
        this.validatePointsData();

        // Apply development starting points if configured
        this.applyDevelopmentStartingPoints();

        return migratedData;
      }
    } catch (error) {
      this.#logger.error('Failed to load game:', error);
    }

    // For new players (no saved data), apply development starting points
    this.applyDevelopmentStartingPoints();

    return {};
  }

  /**
   * Migrate game data to current version with points system
   * @param {Object} data - Raw save data
   * @returns {Object} Migrated data
   */
  migrateGameData(data) {
    const currentVersion = '1.1.0';
    const dataVersion = data.version || '1.0.0';

    // No migration needed for current version
    if (dataVersion === currentVersion) {
      return data;
    }

    this.#logger.info(`Migrating save data from version ${dataVersion} to ${currentVersion}`);

    // Migration from 1.0.0 to 1.1.0 - Add points system
    if (dataVersion === '1.0.0') {
      // Calculate total points that should have been earned based on character level
      const characterLevel = data.characterLevel || data.level || 1;
      let totalPointsEarned = 0;

      // Calculate cumulative points for all levels reached
      for (let level = 2; level <= characterLevel; level++) {
        totalPointsEarned += this.calculatePointsForLevel(level);
      }

      // For existing players, award all points as available (nothing spent yet)
      data.availablePoints = totalPointsEarned;
      data.spentPoints = 0;
      data.pointsHistory = [{
        type: 'migration',
        amount: totalPointsEarned,
        reason: 'Migration from v1.0.0 - retroactive points for existing levels',
        timestamp: Date.now(),
        availableAfter: totalPointsEarned,
        spentAfter: 0,
      }];

      data.version = '1.1.0';

      this.#logger.info(`Migration complete: awarded ${totalPointsEarned} retroactive points for level ${characterLevel}`);
    }

    return data;
  }

  /**
   * Validate points data for corruption detection and recovery
   * @private
   * @returns {void}
   */
  validatePointsData() {
    const expectedTotal = this.getTotalPointsEarned();
    const actualTotal = this.availablePoints + this.spentPoints;

    // Check for negative values
    if (this.availablePoints < 0 || this.spentPoints < 0) {
      this.#logger.warn('Detected negative points values, resetting points system');
      this.resetPointsData();
      return;
    }

    // Check for reasonable values (no more than 1000 total points expected)
    if (actualTotal > 1000) {
      this.#logger.warn('Detected unreasonably high points values, possible corruption');
      this.resetPointsData();
      return;
    }

    // Calculate what points should be based on character level
    let expectedPointsFromLevels = 0;
    for (let level = 2; level <= this.characterLevel; level++) {
      expectedPointsFromLevels += this.calculatePointsForLevel(level);
    }

    // Allow some tolerance for edge cases and manual awards
    const tolerance = 50;
    if (actualTotal > expectedPointsFromLevels + tolerance) {
      this.#logger.warn('Points total exceeds expected value, possible corruption detected');
      // Don't auto-reset in this case, just log for investigation
    }

    this.#logger.debug('Points validation passed', {
      availablePoints: this.availablePoints,
      spentPoints: this.spentPoints,
      totalPoints: actualTotal,
      expectedFromLevels: expectedPointsFromLevels,
      characterLevel: this.characterLevel,
    });
  }

  /**
   * Apply development starting points for easier upgrade testing
   * This method awards bonus points in development mode when certain conditions are met:
   * - Only runs in development environment
   * - Only awards points if the configured amount is positive
   * - Will not duplicate points if already awarded (checks transaction history)
   * - Safe for existing players - won't disrupt their progression
   * @private
   * @returns {void}
   */
  applyDevelopmentStartingPoints() {
    const config = ConfigManager.getConfig();

    // Only apply in development mode and if configured
    if (!config.isDevelopment || !config.devStartingPoints || config.devStartingPoints <= 0) {
      return;
    }

    // Check if development points have already been awarded (avoid duplicating on multiple loadGame calls)
    const hasDevPointsTransaction = this.pointsHistory.some(transaction =>
      transaction.type === 'dev_bonus' || transaction.reason.includes('Development starting points')
    );

    if (hasDevPointsTransaction) {
      this.#logger.debug('Development starting points already awarded, skipping');
      return;
    }

    // Award the development starting points
    this.availablePoints += config.devStartingPoints;

    // Track transaction history
    const transaction = {
      type: 'dev_bonus',
      amount: config.devStartingPoints,
      reason: 'Development starting points for upgrade testing',
      timestamp: Date.now(),
      availableAfter: this.availablePoints,
      spentAfter: this.spentPoints,
    };
    this.pointsHistory.push(transaction);

    // Keep history reasonable (last 100 transactions)
    if (this.pointsHistory.length > 100) {
      this.pointsHistory.shift();
    }

    this.#logger.info(`Development starting points awarded: ${config.devStartingPoints} points`, {
      availablePoints: this.availablePoints,
      spentPoints: this.spentPoints,
      reason: 'Development upgrade testing',
    });

    // Emit event for UI updates
    this.#eventBus.emit(EventTypes.POINTS_EARNED, {
      amount: config.devStartingPoints,
      reason: 'Development starting points',
      availablePoints: this.availablePoints,
      spentPoints: this.spentPoints,
      transaction,
    });
  }

  /**
   * Reset points data in case of corruption
   * @private
   * @returns {void}
   */
  resetPointsData() {
    // Recalculate points based on character level
    let totalPointsEarned = 0;
    for (let level = 2; level <= this.characterLevel; level++) {
      totalPointsEarned += this.calculatePointsForLevel(level);
    }

    this.availablePoints = totalPointsEarned;
    this.spentPoints = 0;
    this.pointsHistory = [{
      type: 'reset',
      amount: totalPointsEarned,
      reason: 'Points data reset due to corruption detection',
      timestamp: Date.now(),
      availableAfter: totalPointsEarned,
      spentAfter: 0,
    }];

    this.#logger.info(`Points data reset: awarded ${totalPointsEarned} points for level ${this.characterLevel}`);
  }

  /**
   * Reset all progress (for debugging or new player)
   * @returns {void}
   */
  resetProgress() {
    localStorage.removeItem(this.#saveKey);

    // Reset to initial state
    this.characterLevel = 1;
    this.totalEnemiesDestroyed = 0;
    this.weaponsUnlocked = new Set(['laser']);
    this.achievements = new Set();
    this.highestLevel = 1;
    this.totalPlayTime = 0;

    // Reset points system
    this.availablePoints = 0;
    this.spentPoints = 0;
    this.pointsHistory = [];

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
      availablePoints: this.availablePoints,
      spentPoints: this.spentPoints,
      totalPoints: this.getTotalPointsEarned(),
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
