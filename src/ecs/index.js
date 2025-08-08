// BitECS Main Entry Point
// This file exports all ECS components, systems, and utilities

// World Management
export { 
  initializeWorld, 
  updateWorldTime, 
  addSpriteMapping, 
  removeSpriteMapping, 
  getSpriteForEntity, 
  cleanupWorld 
} from './world.js';

// Components
export {
  // Data Components
  Position,
  Velocity, 
  Health,
  Weapon,
  Render,
  Physics,
  AI,
  // Tag Components
  Player,
  Enemy,
  Projectile,
  PowerUp,
  // Default Exports (alternative names)
  PositionComponent,
  VelocityComponent,
  HealthComponent,
  WeaponComponent,
  RenderComponent,
  PhysicsComponent,
  AIComponent,
  PlayerTag,
  EnemyTag,
  ProjectileTag,
  PowerUpTag
} from './components/index.js';

// Systems
export {
  // Individual Systems
  movementSystem,
  renderSystem,
  weaponSystem,
  aiSystem,
  timeSystem,
  
  // System Pipeline
  systemPipeline,
  runSystemPipeline,
  debugSystemPipeline,
  testPipeline,
  createCustomPipeline,
  getPipelineForMode,
  PIPELINE_MODES,
  
  // System Utilities
  setVelocity,
  getVelocity,
  stopEntity,
  setVisibility,
  setLayer,
  hideEntity,
  showEntity,
  isVisible,
  triggerWeaponFire,
  setWeaponConfig,
  getWeaponCooldown,
  canWeaponFire,
  AI_PATTERNS,
  setAIPattern,
  setAITarget,
  getAIState,
  getCurrentFPS,
  getElapsedSeconds,
  getDeltaSeconds,
  hasTimeElapsed,
  getTimeRemaining,
  createTimer,
  performanceMonitor,
  interpolation,
  
  // Queries
  playerQuery,
  enemyQuery,
  projectileQuery,
  powerUpQuery,
  weaponQuery,
  healthQuery,
  damageableQuery,
  aiQuery,
  enemyAIQuery,
  physicsQuery,
  collidableQuery,
  projectilePhysicsQuery,
  playerCombatQuery,
  enemyCombatQuery,
  movingEnemiesQuery,
  renderableEnemiesQuery,
  executeQuery,
  getQueryStats,
  
  // System Registry
  getSystem,
  getQuery,
  getSystemNames,
  getQueryNames,
  getSystemInfo,
  validateSystems
} from './systems/index.js';

// Future exports for entity creation functions will be added here
// Entities: createPlayer, createEnemy, createProjectile, etc.