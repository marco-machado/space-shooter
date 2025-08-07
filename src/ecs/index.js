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

// Future exports for components, systems, and entity creation functions will be added here
// Components: Position, Velocity, Health, Weapon, etc.
// Systems: MovementSystem, WeaponSystem, CollisionSystem, etc.
// Entities: createPlayer, createEnemy, createProjectile, etc.