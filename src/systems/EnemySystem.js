import { scoutFactory } from '@/entities/Enemy.js';
import { makeEnemyDestroyedEvent } from '@/event-bus/EnemyEvents.js';
import { getEventBus } from '@/event-bus/EventBus.js';
import { EventTypes } from '@/event-bus/EventTypes.js';
import Logger from '@/utils/Logger.js';

/**
 * Enemy spawning system that manages continuous enemy spawning
 * Uses composition pattern rather than inheritance
 */
export default class EnemySystem {
  #logger;
  #eventBus;

  #scene;
  #enemyGroup;
  #isActive;
  #spawnTimer;
  #activeEnemies;
  #spawnConfig;

  /**
   * Create a new EnemySystem.
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
    this.#eventBus.on(EventTypes.GAME_STARTED, this.onGameStartedOrResumed, this);
    this.#eventBus.on(EventTypes.GAME_RESUMED, this.onGameStartedOrResumed, this);

    this.#eventBus.on(EventTypes.GAME_OVER, this.onGameOverOrPaused, this);
    this.#eventBus.on(EventTypes.GAME_PAUSED, this.onGameOverOrPaused, this);

    this.#eventBus.on(EventTypes.ENEMY_DAMAGED, this.#onEnemyDamaged, this);
    this.#eventBus.on(EventTypes.ENEMY_DESTROYED, this.#onEnemyDestroyed, this);

    this.#eventBus.on(EventTypes.GAME_CYCLE, this.#onGameCycle, this);
  }

  onGameStartedOrResumed() {
    this.#isActive = true;
    this.#resetSpawnTimer();
  }

  onGameOverOrPaused() {
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
   * Handle enemy damage events from the event bus.
   * @private
   * @param {Object} data - Event data
   * @param {Object} data.enemy - The enemy entity that took damage
   * @param {number} data.damage - Amount of damage dealt
   * @returns {void}
   */
  #onEnemyDamaged(data) {
    // Validate event data
    if (!data || !data.enemy || typeof data.damage !== 'number') {
      this.#logger.warn('Invalid enemy damage event data', data);
      return;
    }

    const { enemy, damage } = data;

    // Check if enemy has health component
    if (!enemy.health) {
      this.#logger.warn('Enemy does not have a valid health component', {
        enemyType: enemy.constructor?.name || 'unknown',
        hasHealth: !!enemy.health,
      });
      return;
    }

    if (enemy.health.isDead()) {
      this.#logger.warn('Attempted to damage dead enemy.');
      return;
    }

    let previousHealth = 0;
    let currentHealth = 0;

    // Apply damage to enemy via health component
    try {
      previousHealth = enemy.health.getCurrentHealth();
      currentHealth = Math.max(0, previousHealth - damage);

      enemy.health.setCurrentHealth(currentHealth);
    } catch (error) {
      this.#logger.error('Error applying damage to enemy', {
        error: error.message,
        damage,
        enemyType: enemy.constructor?.name || 'unknown',
      });
    }

    if (currentHealth === 0) {
      const event = makeEnemyDestroyedEvent(enemy);
      this.#eventBus.emit(event.type, event.data, event.priority);
    }
  }

  /**
   * Handle enemy death events from the event bus.
   * @private
   * @param {Object} data - Event data
   * @returns {void}
   */
  #onEnemyDestroyed(data) {
    // Remove from active tracking when enemy dies
    if (data && data.enemy) {
      data.enemy.destroy();
    }

    // This is a backup cleanup in case the regular cleanup misses anything
    if (data && data.position) {
      this.#logger.debug('Enemy destroyed event received', {
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
    this.onGameOverOrPaused();
    this.destroyAllEnemies();
    this.#eventBus.off(EventTypes.ENEMY_DESTROYED, this.#onEnemyDestroyed, this);

    this.#logger.debug('EnemySystem destroyed');
  }
}
