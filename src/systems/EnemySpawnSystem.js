import BaseSystem from './BaseSystem.js';
import Logger from '@/utils/Logger.js';

// ECS enemy creation system
import { 
  createEnemy, 
  deactivateEntity, 
  reactivateEntity,
  isEntityActive,
  getEnemyConfig 
} from '../ecs/entities/index.js';

/**
 * Enemy Spawn BaseSystem
 * Handles enemy wave generation, formation patterns, and spawn timing
 * Manages difficulty progression and enemy variety
 */
export default class EnemySpawnSystem extends BaseSystem {
  constructor(scene, world) {
    super();
    this.scene = scene;
    this.world = world; // ECS world for enemy creation

    // Wave management
    this.currentWave = 1;
    this.enemiesInWave = 0;
    this.enemiesSpawned = 0;
    this.enemiesRemaining = 0;
    this.waveStartTime = Date.now();
    this.waveEndTime = 0;
    this.betweenWaves = false;
    this.waveDelay = 3000; // 3 seconds between waves

    // Spawn timing
    this.lastSpawnTime = Date.now(); // Initialize to current time for proper delay calculation
    this.baseSpawnDelay = 1500; // Base delay between spawns in ms
    this.currentSpawnDelay = this.baseSpawnDelay;
    this.spawnVariation = 500; // Random variation in spawn timing

    // Formation management
    this.activeFormations = [];
    this.formationSpawnChance = 0.3; // 30% chance for formation spawn

    // ECS Enemy pools for performance (stores entity IDs)
    this.enemyPool = {
      scout: [],
      fighter: [],
      bomber: [],
    };
    this.poolSize = 20; // Per enemy type

    // X-axis buffer to ensure enemies spawn completely on-screen
    this.SPAWN_BUFFER_X = 80; // Buffer for largest enemy (bomber 64px + 16px safety)

    // Spawn locations
    this.spawnZones = [];
    this.initializeSpawnZones();

    // Wave configuration
    this.waveTemplates = this.createWaveTemplates();

    // Statistics
    this.stats = {
      totalEnemiesSpawned: 0,
      totalWavesCompleted: 0,
      currentDifficultyMultiplier: 1.0,
      averageWaveTime: 0,
      enemiesDestroyedThisWave: 0,
    };

    this.initializeEnemyPools();
    this.generateWave();


    Logger.scope('EnemySpawnSystem').info('EnemySpawnSystem initialized', {
      currentWave: this.currentWave,
      baseSpawnDelay: this.baseSpawnDelay,
      poolSize: this.poolSize,
    });
  }

  /**
   * Initialize spawn zones across the top of the screen
   */
  initializeSpawnZones() {
    const sceneWidth = this.scene.scale.width;
    const availableWidth = sceneWidth - (2 * this.SPAWN_BUFFER_X);
    const zoneWidth = availableWidth / 5; // 5 spawn zones within safe area

    for (let i = 0; i < 5; i++) {
      this.spawnZones.push({
        x: this.SPAWN_BUFFER_X + (i * zoneWidth) + (zoneWidth / 2),
        y: -150, // Further above screen for proper lifecycle
        width: zoneWidth * 0.8,
        height: 100,
        active: true,
        lastUsed: 0,
        cooldown: 2000, // 2 second cooldown between uses
      });
    }

    Logger.scope('EnemySpawnSystem').debug(`Spawn zones initialized: ${this.spawnZones.length} zones with X-buffer ${this.SPAWN_BUFFER_X}px`);
  }

  /**
   * Initialize ECS enemy entity pools for performance
   */
  initializeEnemyPools() {
    Object.keys(this.enemyPool).forEach(enemyType => {
      for (let i = 0; i < this.poolSize; i++) {
        // Create ECS enemy entity
        const enemyEid = createEnemy(this.world, this.scene, -1000, -1000, enemyType);
        
        // Immediately deactivate for pooling
        deactivateEntity(this.world, enemyEid);
        
        // Store entity ID in pool
        this.enemyPool[enemyType].push(enemyEid);
      }
    });

    Logger.scope('EnemySpawnSystem').debug('ECS Enemy pools initialized', {
      scout: this.enemyPool.scout.length,
      fighter: this.enemyPool.fighter.length,
      bomber: this.enemyPool.bomber.length,
    });
  }

  /**
   * Create wave templates for different difficulty levels
   */
  createWaveTemplates() {
    return {
      // Early waves (1-5)
      early: [
        { scout: 3, fighter: 0, bomber: 0, formations: 0 },
        { scout: 5, fighter: 0, bomber: 0, formations: 0 },
        { scout: 4, fighter: 1, bomber: 0, formations: 0 },
        { scout: 6, fighter: 1, bomber: 0, formations: 1 },
        { scout: 3, fighter: 2, bomber: 0, formations: 1 },
      ],

      // Mid waves (6-15)
      mid: [
        { scout: 4, fighter: 3, bomber: 0, formations: 1 },
        { scout: 6, fighter: 2, bomber: 1, formations: 1 },
        { scout: 5, fighter: 4, bomber: 0, formations: 2 },
        { scout: 3, fighter: 3, bomber: 1, formations: 1 },
        { scout: 8, fighter: 2, bomber: 1, formations: 2 },
      ],

      // Late waves (16+)
      late: [
        { scout: 6, fighter: 4, bomber: 2, formations: 2 },
        { scout: 8, fighter: 6, bomber: 1, formations: 3 },
        { scout: 4, fighter: 6, bomber: 3, formations: 2 },
        { scout: 10, fighter: 4, bomber: 2, formations: 3 },
        { scout: 5, fighter: 8, bomber: 2, formations: 2 },
      ],
    };
  }

  /**
   * Update enemy spawn system
   * @param {Array} _entities - All entities in the scene (unused for ECS)
   * @param {number} delta - Time delta in milliseconds
   */
  update(_entities, delta) {
    // Update enemy count using ECS world
    this.updateEnemyCount();
    

    // Handle wave management
    if (this.betweenWaves) {
      this.handleBetweenWaves();
    } else {
      this.handleActiveWave(delta);
    }

    // Update formations
    this.updateFormations();

    // Update spawn zone cooldowns
    this.updateSpawnZones(delta);

    // Clean up inactive enemies (return to pool)
    this.cleanupInactiveEnemies();
  }

  /**
   * Update count of remaining ECS enemies
   */
  updateEnemyCount() {
    // Count active ECS enemies across all pools
    let activeCount = 0;
    const enemyPositions = [];
    
    Object.keys(this.enemyPool).forEach(enemyType => {
      this.enemyPool[enemyType].forEach(enemyEid => {
        if (isEntityActive(this.world, enemyEid)) {
          activeCount++;
          // Get enemy position for debugging
          if (this.world.spriteMap && this.world.spriteMap.get(enemyEid)) {
            const sprite = this.world.spriteMap.get(enemyEid);
            enemyPositions.push({
              eid: enemyEid,
              type: enemyType,
              x: sprite.x,
              y: sprite.y,
              visible: sprite.visible
            });
          }
        }
      });
    });


    this.enemiesRemaining = activeCount;
  }

  /**
   * Handle logic between waves
   */
  handleBetweenWaves() {
    const timeSinceWaveEnd = Date.now() - this.waveEndTime;

    if (timeSinceWaveEnd >= this.waveDelay) {
      this.startNextWave();
    }
  }

  /**
   * Handle active wave spawning
   * @param {number} delta - Time delta in milliseconds
   */
  handleActiveWave(_delta) {
    // Check if wave is complete
    if (this.enemiesSpawned >= this.enemiesInWave && this.enemiesRemaining === 0) {
      this.completeWave();
      return;
    }

    // Spawn enemies if needed
    if (this.enemiesSpawned < this.enemiesInWave) {
      this.updateSpawning();
    }
  }

  /**
   * Update enemy spawning logic
   * @param {number} delta - Time delta in milliseconds
   */
  updateSpawning() {
    const currentTime = Date.now();
    const timeSinceLastSpawn = currentTime - this.lastSpawnTime;

    if (timeSinceLastSpawn >= this.currentSpawnDelay) {
      Logger.scope('EnemySpawnSystem').info('Spawn delay reached, attempting to spawn enemy', {
        timeSinceLastSpawn,
        currentSpawnDelay: this.currentSpawnDelay
      });
      this.spawnNextEnemy();
      this.lastSpawnTime = currentTime;

      // Add some variation to spawn timing
      this.currentSpawnDelay = this.baseSpawnDelay + (Math.random() - 0.5) * this.spawnVariation;
      
      Logger.scope('EnemySpawnSystem').debug('Updated spawn timing', {
        newLastSpawnTime: this.lastSpawnTime,
        newCurrentSpawnDelay: this.currentSpawnDelay
      });
    }
  }

  /**
   * Spawn the next enemy in the wave
   */
  spawnNextEnemy() {
    const waveConfig = this.getCurrentWaveConfig();
    Logger.scope('EnemySpawnSystem').debug('spawnNextEnemy called', {
      currentWave: this.currentWave,
      waveConfig,
      enemiesSpawned: this.enemiesSpawned,
      enemiesInWave: this.enemiesInWave
    });

    const enemyType = this.selectEnemyType(waveConfig);
    Logger.scope('EnemySpawnSystem').debug('Enemy type selected', { enemyType });

    if (!enemyType) {
      Logger.scope('EnemySpawnSystem').warn('No enemy type selected for spawn');
      return;
    }

    // Decide between formation and individual spawn
    if (this.shouldSpawnFormation(waveConfig)) {
      Logger.scope('EnemySpawnSystem').info(`Spawning formation of ${enemyType}`);
      this.spawnFormation(enemyType);
    } else {
      Logger.scope('EnemySpawnSystem').info(`Spawning individual ${enemyType}`);
      this.spawnIndividualEnemy(enemyType);
    }
  }

  /**
   * Get current wave configuration
   * @returns {Object} Wave configuration
   */
  getCurrentWaveConfig() {
    let template;

    if (this.currentWave <= 5) {
      template = this.waveTemplates.early[(this.currentWave - 1) % this.waveTemplates.early.length];
    } else if (this.currentWave <= 15) {
      template = this.waveTemplates.mid[(this.currentWave - 6) % this.waveTemplates.mid.length];
    } else {
      template = this.waveTemplates.late[(this.currentWave - 16) % this.waveTemplates.late.length];
    }

    // Apply difficulty scaling
    const difficultyMultiplier = this.getDifficultyMultiplier();
    return {
      scout: Math.floor(template.scout * difficultyMultiplier),
      fighter: Math.floor(template.fighter * difficultyMultiplier),
      bomber: Math.floor(template.bomber * difficultyMultiplier),
      formations: template.formations,
    };
  }

  /**
   * Select enemy type based on wave configuration
   * @param {Object} waveConfig - Current wave configuration
   * @returns {string|null} Selected enemy type or null
   */
  selectEnemyType(waveConfig) {
    const remainingTypes = [];

    // Calculate remaining enemies of each type to spawn
    const spawnedCounts = this.getSpawnedCounts();

    if (spawnedCounts.scout < waveConfig.scout) {
      remainingTypes.push('scout');
    }
    if (spawnedCounts.fighter < waveConfig.fighter) {
      remainingTypes.push('fighter');
    }
    if (spawnedCounts.bomber < waveConfig.bomber) {
      remainingTypes.push('bomber');
    }

    if (remainingTypes.length === 0) return null;

    // Weighted selection (scouts more common early in wave)
    const weights = {
      scout: this.enemiesSpawned < this.enemiesInWave * 0.6 ? 3 : 1,
      fighter: 2,
      bomber: 1,
    };

    const weightedTypes = [];
    remainingTypes.forEach(type => {
      for (let i = 0; i < weights[type]; i++) {
        weightedTypes.push(type);
      }
    });

    return weightedTypes[Math.floor(Math.random() * weightedTypes.length)];
  }

  /**
   * Get count of spawned enemies by type in current wave
   * @returns {Object} Spawned counts
   */
  getSpawnedCounts() {
    // This would normally track spawned enemies by type
    // For simplicity, we'll estimate based on total spawned
    const totalSpawned = this.enemiesSpawned;
    const waveConfig = this.getCurrentWaveConfig();
    const totalInWave = waveConfig.scout + waveConfig.fighter + waveConfig.bomber;

    if (totalInWave === 0) return { scout: 0, fighter: 0, bomber: 0 };

    const progress = totalSpawned / totalInWave;

    return {
      scout: Math.floor(waveConfig.scout * progress),
      fighter: Math.floor(waveConfig.fighter * progress),
      bomber: Math.floor(waveConfig.bomber * progress),
    };
  }

  /**
   * Check if should spawn formation instead of individual enemy
   * @param {Object} waveConfig - Current wave configuration
   * @returns {boolean} True if should spawn formation
   */
  shouldSpawnFormation(waveConfig) {
    return (
      waveConfig.formations > this.activeFormations.length &&
      Math.random() < this.formationSpawnChance
    );
  }

  /**
   * Spawn individual ECS enemy
   * @param {string} enemyType - Type of enemy to spawn
   */
  spawnIndividualEnemy(enemyType) {
    const spawnZone = this.getAvailableSpawnZone();
    if (!spawnZone) {
      return;
    }

    const enemyEid = this.getEnemyFromPool(enemyType);
    if (enemyEid === null) {
      return;
    }

    // Position enemy in spawn zone with size awareness
    const enemyConfig = getEnemyConfig(enemyType);
    const enemyHalfWidth = enemyConfig.size.width / 2;
    const minSpawnX = this.SPAWN_BUFFER_X + enemyHalfWidth;
    const maxSpawnX = this.scene.scale.width - this.SPAWN_BUFFER_X - enemyHalfWidth;

    let spawnX = spawnZone.x + (Math.random() - 0.5) * spawnZone.width;
    spawnX = Math.max(minSpawnX, Math.min(maxSpawnX, spawnX)); // Clamp to safe bounds

    const spawnY = spawnZone.y + Math.random() * spawnZone.height;

    // Reactivate ECS entity at spawn position
    reactivateEntity(this.world, enemyEid, spawnX, spawnY, enemyType);

    // Get sprite for group management
    const sprite = this.world.spriteMap.get(enemyEid);
    if (sprite && this.scene.enemyGroup) {
      this.scene.enemyGroup.add(sprite);
    }

    // Mark spawn zone as used
    spawnZone.lastUsed = Date.now();

    this.enemiesSpawned++;
    this.stats.totalEnemiesSpawned++;

    Logger.scope('EnemySpawnSystem').debug(`ECS Enemy spawned: ${enemyType} entity ${enemyEid} at (${spawnX.toFixed(0)}, ${spawnY.toFixed(0)})`);
  }

  /**
   * Spawn ECS enemy formation
   * @param {string} enemyType - Type of enemies in formation
   */
  spawnFormation(enemyType) {
    const formationPatterns = this.getFormationPatterns();
    const pattern = formationPatterns[Math.floor(Math.random() * formationPatterns.length)];

    const spawnZone = this.getAvailableSpawnZone(true); // Prefer wider zones for formations
    if (!spawnZone) return;

    const formation = {
      id: `formation_${Date.now()}`,
      leader: null,
      members: [], // Will store entity IDs
      pattern: pattern.name,
      startTime: Date.now(),
    };

    // Spawn formation members with buffer validation
    const enemyConfig = getEnemyConfig(enemyType);
    const enemyHalfWidth = enemyConfig.size.width / 2;
    const minSpawnX = this.SPAWN_BUFFER_X + enemyHalfWidth;
    const maxSpawnX = this.scene.scale.width - this.SPAWN_BUFFER_X - enemyHalfWidth;

    pattern.positions.forEach((pos, index) => {
      const enemyEid = this.getEnemyFromPool(enemyType);
      if (enemyEid === null) return;

      let spawnX = spawnZone.x + pos.x;
      spawnX = Math.max(minSpawnX, Math.min(maxSpawnX, spawnX)); // Clamp to safe bounds
      const spawnY = spawnZone.y + pos.y;

      // Reactivate ECS entity at formation position
      reactivateEntity(this.world, enemyEid, spawnX, spawnY, enemyType);

      // Get sprite for group management
      const sprite = this.world.spriteMap.get(enemyEid);
      if (sprite && this.scene.enemyGroup) {
        this.scene.enemyGroup.add(sprite);
      }

      if (index === 0) {
        // First enemy is the leader
        formation.leader = enemyEid;
        // Note: Formation AI patterns will be handled by ECS AISystem
      }

      formation.members.push(enemyEid);
      this.enemiesSpawned++;
      this.stats.totalEnemiesSpawned++;
    });

    this.activeFormations.push(formation);
    spawnZone.lastUsed = Date.now();

    Logger.scope('EnemySpawnSystem').info(
      `ECS Formation spawned: ${pattern.name} with ${formation.members.length} ${enemyType}s`
    );
  }

  /**
   * Get formation patterns
   * @returns {Array} Available formation patterns
   */
  getFormationPatterns() {
    return [
      {
        name: 'V-formation',
        positions: [
          { x: 0, y: 0 }, // Leader
          { x: -40, y: 30 }, // Left wing
          { x: 40, y: 30 }, // Right wing
        ],
      },
      {
        name: 'Line',
        positions: [
          { x: -60, y: 0 }, // Left
          { x: 0, y: 0 }, // Center (leader)
          { x: 60, y: 0 }, // Right
        ],
      },
      {
        name: 'Diamond',
        positions: [
          { x: 0, y: 0 }, // Leader (front)
          { x: -30, y: 40 }, // Left
          { x: 30, y: 40 }, // Right
          { x: 0, y: 80 }, // Rear
        ],
      },
      {
        name: 'Wedge',
        positions: [
          { x: 0, y: 0 }, // Leader
          { x: -30, y: 50 }, // Left back
          { x: 30, y: 50 }, // Right back
          { x: -60, y: 100 }, // Far left
          { x: 60, y: 100 }, // Far right
        ],
      },
    ];
  }

  /**
   * Get available spawn zone
   * @param {boolean} preferWide - Prefer wider zones for formations
   * @returns {Object|null} Available spawn zone or null
   */
  getAvailableSpawnZone(preferWide = false) {
    const currentTime = Date.now();

    // Filter available zones (not on cooldown)
    const availableZones = this.spawnZones.filter(
      zone => zone.active && currentTime - zone.lastUsed >= zone.cooldown
    );

    if (availableZones.length === 0) {
      // If no zones available, use the one with the longest cooldown
      return this.spawnZones.reduce((oldest, zone) =>
        zone.lastUsed < oldest.lastUsed ? zone : oldest
      );
    }

    if (preferWide) {
      // For formations, prefer zones with more width
      return availableZones.reduce((widest, zone) => (zone.width > widest.width ? zone : widest));
    }

    // Random selection from available zones
    return availableZones[Math.floor(Math.random() * availableZones.length)];
  }

  /**
   * Get ECS enemy entity from pool
   * @param {string} enemyType - Type of enemy needed
   * @returns {number|null} Enemy entity ID from pool or null
   */
  getEnemyFromPool(enemyType) {
    const pool = this.enemyPool[enemyType];
    if (!pool) return null;

    // Find inactive entity in pool
    const enemyEid = pool.find(eid => !isEntityActive(this.world, eid));

    if (enemyEid === undefined) {
      Logger.scope('EnemySpawnSystem').warn(`ECS Enemy pool exhausted for type: ${enemyType}`);
      // Create new ECS enemy if pool exhausted
      const newEnemyEid = createEnemy(this.world, this.scene, -1000, -1000, enemyType);
      deactivateEntity(this.world, newEnemyEid);
      pool.push(newEnemyEid); // Add to pool
      return newEnemyEid;
    }

    return enemyEid;
  }

  /**
   * Update ECS formations (remove completed ones)
   */
  updateFormations() {
    this.activeFormations = this.activeFormations.filter(formation => {
      // Check if formation leader still exists and is active
      if (!formation.leader || !isEntityActive(this.world, formation.leader)) {
        Logger.scope('EnemySpawnSystem').debug(`ECS Formation disbanded: ${formation.pattern} (leader destroyed)`);
        return false;
      }

      // Remove destroyed members (filter to active entities only)
      formation.members = formation.members.filter(memberEid => isEntityActive(this.world, memberEid));

      // Disband if too few members remain
      if (formation.members.length < 2) {
        Logger.scope('EnemySpawnSystem').debug(`ECS Formation disbanded: ${formation.pattern} (too few members)`);
        return false;
      }

      return true;
    });
  }

  /**
   * Update spawn zone cooldowns
   * @param {number} delta - Time delta in milliseconds
   */
  updateSpawnZones(_delta) {
    // Spawn zones are updated based on lastUsed time, no need for delta updates
    // This method is here for potential future enhancements
  }

  /**
   * Clean up inactive ECS enemies and manage sprite groups
   */
  cleanupInactiveEnemies() {
    Object.keys(this.enemyPool).forEach(enemyType => {
      this.enemyPool[enemyType].forEach(enemyEid => {
        // Check if entity is inactive but sprite is still in groups
        if (!isEntityActive(this.world, enemyEid)) {
          const sprite = this.world.spriteMap.get(enemyEid);
          
          // Remove sprite from enemy group if still present
          if (sprite && this.scene.enemyGroup) {
            this.scene.enemyGroup.remove(sprite);
          }
        }
      });
    });
  }

  /**
   * Generate next wave configuration
   */
  generateWave() {
    const waveConfig = this.getCurrentWaveConfig();
    this.enemiesInWave = waveConfig.scout + waveConfig.fighter + waveConfig.bomber;
    this.enemiesSpawned = 0;
    this.stats.enemiesDestroyedThisWave = 0;

    // Adjust spawn delay based on wave number
    this.baseSpawnDelay = Math.max(500, 1500 - this.currentWave * 50);
    this.currentSpawnDelay = this.baseSpawnDelay;


    Logger.scope('EnemySpawnSystem').info(`Wave ${this.currentWave} generated`, {
      enemies: this.enemiesInWave,
      config: waveConfig,
      spawnDelay: this.baseSpawnDelay,
    });
  }

  /**
   * Start next wave
   */
  startNextWave() {
    this.currentWave++;
    this.betweenWaves = false;
    this.waveStartTime = Date.now();
    this.generateWave();

    // Emit wave start event
    if (this.scene.events) {
      this.scene.events.emit('waveStart', {
        wave: this.currentWave,
        enemiesInWave: this.enemiesInWave,
      });
    }
  }

  /**
   * Complete current wave
   */
  completeWave() {
    this.betweenWaves = true;
    this.waveEndTime = Date.now();
    this.stats.totalWavesCompleted++;

    // Calculate wave time
    const waveTime = this.waveEndTime - this.waveStartTime;
    this.stats.averageWaveTime =
      (this.stats.averageWaveTime * (this.stats.totalWavesCompleted - 1) + waveTime) /
      this.stats.totalWavesCompleted;

    Logger.scope('EnemySpawnSystem').info(`Wave ${this.currentWave} completed`, {
      waveTime: `${(waveTime / 1000).toFixed(1)}s`,
      enemiesDestroyed: this.stats.enemiesDestroyedThisWave,
    });

    // Emit wave complete event
    if (this.scene.events) {
      this.scene.events.emit('waveComplete', {
        wave: this.currentWave,
        waveTime,
        enemiesDestroyed: this.stats.enemiesDestroyedThisWave,
      });
    }
  }

  /**
   * Get difficulty multiplier based on current wave
   * @returns {number} Difficulty multiplier
   */
  getDifficultyMultiplier() {
    // Gradually increase difficulty
    const baseMultiplier = 1 + (this.currentWave - 1) * 0.1; // 10% increase per wave
    const maxMultiplier = 3.0; // Cap at 3x

    this.stats.currentDifficultyMultiplier = Math.min(maxMultiplier, baseMultiplier);
    return this.stats.currentDifficultyMultiplier;
  }

  /**
   * Get ECS spawn system statistics
   * @returns {Object} System statistics
   */
  getStats() {
    return {
      ...this.stats,
      currentWave: this.currentWave,
      enemiesInWave: this.enemiesInWave,
      enemiesSpawned: this.enemiesSpawned,
      enemiesRemaining: this.enemiesRemaining,
      activeFormations: this.activeFormations.length,
      poolUtilization: {
        scout: this.enemyPool.scout.filter(eid => isEntityActive(this.world, eid)).length,
        fighter: this.enemyPool.fighter.filter(eid => isEntityActive(this.world, eid)).length,
        bomber: this.enemyPool.bomber.filter(eid => isEntityActive(this.world, eid)).length,
      },
    };
  }

  /**
   * Force start next wave (for testing/debugging)
   */
  skipToNextWave() {
    // Deactivate all remaining ECS enemies
    Object.values(this.enemyPool).forEach(pool => {
      pool.forEach(enemyEid => {
        if (isEntityActive(this.world, enemyEid)) {
          deactivateEntity(this.world, enemyEid);
        }
      });
    });

    this.enemiesRemaining = 0;
    this.completeWave();

    Logger.scope('EnemySpawnSystem').debug('Skipped to next wave');
  }

  /**
   * Clean up ECS enemy spawn system
   */
  destroy() {
    // Note: ECS entities are managed by the world, sprites handled by world cleanup
    // We just clear our pools and formations
    this.enemyPool = { scout: [], fighter: [], bomber: [] };
    this.activeFormations = [];

    Logger.scope('EnemySpawnSystem').info('ECS EnemySpawnSystem destroyed');
  }
}
