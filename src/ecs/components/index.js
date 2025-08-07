// bitECS Component Definitions
// Central export point for all ECS components

import Logger from '@/utils/Logger.js';

// Data Components
export { Position } from './Position.js';
export { Velocity } from './Velocity.js';
export { Health } from './Health.js';
export { Weapon } from './Weapon.js';
export { Render } from './Render.js';
export { Physics } from './Physics.js';
export { AI } from './AI.js';

// Tag Components  
export { Player } from './Player.js';
export { Enemy } from './Enemy.js';
export { Projectile } from './Projectile.js';
export { PowerUp } from './PowerUp.js';

// Default exports for convenience
export { default as PositionComponent } from './Position.js';
export { default as VelocityComponent } from './Velocity.js';
export { default as HealthComponent } from './Health.js';
export { default as WeaponComponent } from './Weapon.js';
export { default as RenderComponent } from './Render.js';
export { default as PhysicsComponent } from './Physics.js';
export { default as AIComponent } from './AI.js';
export { default as PlayerTag } from './Player.js';
export { default as EnemyTag } from './Enemy.js';
export { default as ProjectileTag } from './Projectile.js';
export { default as PowerUpTag } from './PowerUp.js';

const logger = Logger.scope('ECS:Components');
logger.debug('All bitECS components exported');