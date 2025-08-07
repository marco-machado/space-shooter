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

// Future exports for systems and entity creation functions will be added here
// Systems: MovementSystem, WeaponSystem, CollisionSystem, etc.
// Entities: createPlayer, createEnemy, createProjectile, etc.