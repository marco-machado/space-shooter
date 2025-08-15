import { scoutFactory } from '@/entities/Enemy.js';
import { getEventBus } from '@/event-bus/EventBus.js';
import { EventTypes } from '@/event-bus/EventTypes.js';
import Logger from '@/utils/Logger.js';

/**
 * Enemy spawning system that manages continuous enemy spawning
 * Uses composition pattern rather than inheritance
 */
export default class EnemySpawner {
  #logger;
  #eventBus;

  #scene;
  #enemyGroup;
  #isActive;
  #spawnTimer;
  #activeEnemies;
  #spawnConfig;

  /**
   * Create a new EnemySpawner.
   * @param {Phaser.Scene} scene - The scene this spawner belongs to
   * @param {Phaser.Physics.Arcade.Group} enemyGroup - Physics group for enemies
   * @param {Object} [config={}] - Spawner configuration
   * @param {number} [config.minSpawnInterval=1500] - Minimum time between spawns (ms)
   * @param {number} [config.maxSpawnInterval=3000] - Maximum time between spawns (ms)
   * @param {number} [config.maxActiveEnemies=10] - Maximum active enemies at once
   * @param {number} [config.spawnMarginX=50] - Horizontal margin from screen edges
   * @param {number} [config.spawnOffsetY=50] - How far above screen to spawn
   */
  constructor(scene, enemyGroup, config = {}) {
    this.#logger = Logger.scope('EnemySpawner');
    this.#eventBus = getEventBus();

    this.#scene = scene;
    this.#enemyGroup = enemyGroup;

    this.#isActive = false;
    this.#spawnTimer = 0;
    this.#activeEnemies = [];

    // Default spawn configuration
    // TODO: This will change with the level
    this.#spawnConfig = {
      minSpawnInterval: config.minSpawnInterval || 500,
      maxSpawnInterval: config.maxSpawnInterval || 2000,
      maxActiveEnemies: config.maxActiveEnemies || 10,
      spawnMarginX: config.spawnMarginX || 50,
      spawnOffsetY: config.spawnOffsetY || 50,
    };

    // Set initial spawn timer
    this.#resetSpawnTimer();

    // TODO: Move to a separate method which should save the listener ids so destroy() can clean up
    this.#eventBus.on(EventTypes.ENEMY_DEATH, this.#onEnemyDeath, this);

    this.#eventBus.on(EventTypes.GAME_STARTED, this.start, this);
    this.#eventBus.on(EventTypes.GAME_RESUMED, this.start, this);

    this.#eventBus.on(EventTypes.GAME_OVER, this.stop, this);
    this.#eventBus.on(EventTypes.GAME_PAUSED, this.stop, this);

    this.#eventBus.on(EventTypes.GAME_CYCLE, this.#onGameCycle, this);
  }

  /**
   * Start spawning enemies.
   * @returns {void}
   */
  start() {
    this.#isActive = true;
    this.#resetSpawnTimer();
  }

  /**
   * Stop spawning enemies.
   * @returns {void}
   */
  stop() {
    this.#isActive = false;
  }

  /**
   * Spawn a new enemy.
   * @private
   * @returns {void}
   */
  #spawnEnemy() {
    // For now, only spawn scouts
    // Future: Add logic to choose different enemy types
    const scout = scoutFactory(this.#enemyGroup);

    this.#activeEnemies.push(scout);
  }

  /**
   * @param {number} delta - Time delta in milliseconds
   * @returns {void}
   */
  #onGameCycle(delta) {
    if (!this.#isActive) return;

    // Clean up destroyed enemies from tracking
    this.#cleanupDestroyedEnemies();

    // Update spawn timer
    this.#spawnTimer -= delta;

    // Check if it's time to spawn and we haven't exceeded max enemies
    if (this.#spawnTimer <= 0 && this.#activeEnemies.length < this.#spawnConfig.maxActiveEnemies) {
      this.#logger.debug('Spawning', {
        time: this.#spawnTimer,
        active: this.#activeEnemies.length,
        max: this.#spawnConfig.maxActiveEnemies,
      });
      this.#spawnEnemy();
      this.#resetSpawnTimer();
    }

    // Update all active enemies
    this.#activeEnemies.forEach(enemy => {
      if (enemy && enemy.update && enemy.isActive && enemy.isActive()) {
        enemy.update(delta);
      }
    });
  }

  /**
   * Reset spawn timer to random interval.
   * @private
   * @returns {void}
   */
  #resetSpawnTimer() {
    const min = this.#spawnConfig.minSpawnInterval;
    const max = this.#spawnConfig.maxSpawnInterval;
    this.#spawnTimer = Math.random() * (max - min) + min;
  }

  /**
   * Clean up destroyed enemies from active tracking.
   * @private
   * @returns {void}
   */
  #cleanupDestroyedEnemies() {
    this.#activeEnemies = this.#activeEnemies.filter(enemy => {
      if (!enemy) {
        this.#logger.error('This is not an enemy!');
        return false;
      }

      // Removed from the scene. Probably by collision.
      if (enemy.scene === null || enemy.scene === undefined) {
        return false;
      }

      try {
        if (
          enemy.scene &&
          enemy.scene.sys &&
          enemy.scene.sys.displayList &&
          !enemy.scene.sys.displayList.exists(enemy)
        ) {
          this.#logger.debug('NO SCENE DISPLAY');
          return false;
        }
      } catch {
        this.#logger.debug('ASSUMING DESTROYED');
        return false;
      }

      try {
        return enemy.active;
      } catch {
        this.#logger.debug('ASSUMING INACTIVE');
      }

      return true;
    });

    // const cleanedCount = originalLength - this.#activeEnemies.length;
    // if (cleanedCount > 0) {
    //   this.#logger.debug(`Cleaned up ${cleanedCount} destroyed enemies`, {
    //     activeEnemies: this.#activeEnemies.length,
    //   });
    // }
  }

  /**
   * Handle enemy death events from the event bus.
   * @private
   * @param {Object} data - Event data
   * @returns {void}
   */
  #onEnemyDeath(data) {
    // Remove from active tracking when enemy dies
    // This is a backup cleanup in case the regular cleanup misses anything
    if (data && data.position) {
      this.#logger.debug('Enemy death event received', {
        type: data.enemyType,
        score: data.scoreValue,
        position: data.position,
      });
    }
  }

  /**
   * Destroy all active enemies and clean up.
   * @returns {void}
   */
  destroyAllEnemies() {
    this.#logger.debug(`Destroying ${this.#activeEnemies.length} active enemies`);

    this.#activeEnemies.forEach(enemy => {
      if (enemy && enemy.destroy) {
        enemy.destroy();
      }
    });

    this.#activeEnemies = [];
    this.#enemyGroup.clear(true, true);
  }

  /**
   * Clean up spawner and remove event listeners.
   * @returns {void}
   */
  destroy() {
    this.stop();
    this.destroyAllEnemies();
    this.#eventBus.off(EventTypes.ENEMY_DEATH, this.#onEnemyDeath, this);

    this.#logger.debug('EnemySpawner destroyed');
  }
}
