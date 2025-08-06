# Collision System Refactor Plan: Custom → Phaser Arcade Physics

## Overview
Migrate from custom collision scopeName to Phaser's built-in Arcade Physics for better performance, reliability, and maintainability.

## Current State Analysis
- Custom CollisionSystem (500+ lines) with spatial grid optimization - **COMMENTED OUT**
- CollisionComponent with rich collision data structures - **PARTIALLY IMPLEMENTED**
- Arcade Physics already configured in ConfigManager but unused for collisions
- BaseEntity has physics support via `enablePhysics()` method
- Projectile entities have collision components implemented
- Enemy entities have collision code commented out

## Phase 1: Core Infrastructure Setup
### 1.1 Configure Collision Groups and Categories
- Create collision layer constants in ConfigManager
- Define collision group mappings (player, enemy, projectile, powerup, obstacle)
- Update physics configuration if needed

### 1.2 Create Physics Helper Utility
- Create `src/utils/PhysicsHelper.js` for collision setup utilities
- Implement collision group assignment functions
- Add physics body configuration helpers

## Phase 2: Entity Migration
### 2.1 Update BaseEntity Physics Integration
- Enhance `enablePhysics()` method with collision group support
- Add helper methods for collision callbacks
- Ensure physics body sizing matches visual representation

### 2.2 Migrate Projectile Entities
- Remove CollisionComponent usage from Projectile
- Use Phaser collision detection instead
- Implement collision callbacks for damage dealing
- Test projectile-enemy and projectile-obstacle collisions

### 2.3 Migrate Enemy Entities
- Uncomment and refactor enemy collision code
- Remove CollisionComponent dependency
- Implement physics-based collision detection
- Add enemy-player collision handling

### 2.4 Create Player Entity Collision
- Add physics body to player entity
- Implement player-enemy collision
- Add player-powerup collection
- Handle player-obstacle collision

## Phase 3: Collision Logic Implementation
### 3.1 Replace Collision System in GameScene
- Remove commented CollisionSystem instantiation
- Replace with Phaser collision/overlap setups:
  - `this.physics.add.collider()` for solid collisions
  - `this.physics.add.overlap()` for trigger collisions
- Implement collision callback functions

### 3.2 Implement Specific Collision Handlers
- `handleProjectileEnemyCollision(projectile, enemy)`
- `handlePlayerEnemyCollision(player, enemy)`
- `handlePlayerPowerupCollision(player, powerup)`
- `handleProjectileObstacleCollision(projectile, obstacle)`

### 3.3 Preserve Collision Features
- Damage dealing and receiving
- Destruction on collision
- Collision cooldowns (via component timers)
- Special collision effects

## Phase 4: Complete System Removal
### 4.1 Remove Custom Collision Files
- **DELETE**: `src/systems/CollisionSystem.js`
- **DELETE**: `src/components/CollisionComponent.js`
- Remove collision scopeName imports from all files

### 4.2 Clean Up Entity Code
- Remove all CollisionComponent references from entities
- Remove collision component initialization code
- Clean up commented collision code
- Update entity factory methods

### 4.3 Update Tests
- Remove collision scopeName tests
- Remove collision component tests
- Add physics integration tests if needed

## Phase 5: Testing & Validation
### 5.1 Functional Testing
- Test all collision scenarios work correctly
- Verify damage dealing/receiving
- Test object pooling with new physics
- Validate collision performance

### 5.2 Performance Validation
- Compare performance before/after migration
- Monitor physics world performance
- Verify no memory leaks from old scopeName

## Files to be Modified

### Core Configuration:
- `src/config/ConfigManager.js` - Add collision groups
- `src/core/SpaceShooterGame.js` - Remove collision scopeName references

### New Files:
- `src/utils/PhysicsHelper.js` - Physics utilities
- `COLLISION-TASKS.md` - This plan document

### Entity Updates:
- `src/entities/BaseEntity.js` - Enhanced physics integration
- `src/entities/Projectile.js` - Remove CollisionComponent, add physics callbacks
- `src/entities/Enemy.js` - Enable physics collision
- `src/entities/Player.js` - Add physics collision (if exists)

### Scene Updates:
- `src/scenes/GameScene.js` - Replace collision scopeName with Phaser physics

### Files to DELETE:
- `src/systems/CollisionSystem.js` ❌
- `src/components/CollisionComponent.js` ❌

### Test Updates:
- Remove collision scopeName/component tests
- Update entity tests for physics integration

## Benefits After Migration
- **Performance**: Native WebGL-optimized collision detection
- **Maintainability**: ~500 lines of complex code removed
- **Reliability**: Battle-tested Phaser physics scopeName
- **Features**: Built-in physics debugging and visualization
- **Future-proofing**: Leverages Phaser's continued optimization

## Risk Mitigation
- Implement in phases to catch issues early
- Preserve all existing collision behavior
- Maintain backward compatibility during transition
- Test thoroughly before removing old scopeName

## Estimated Effort
- **Phase 1-3**: 6-8 hours implementation
- **Phase 4**: 2 hours cleanup
- **Phase 5**: 2-3 hours testing
- **Total**: 10-13 hours

## Implementation Checklist

### Phase 1: Core Infrastructure Setup
- [ ] 1.1.1 Add collision group constants to ConfigManager
- [ ] 1.1.2 Define collision categories (PLAYER, ENEMY, PROJECTILE, POWERUP, OBSTACLE)
- [ ] 1.1.3 Update physics configuration with collision groups
- [ ] 1.2.1 Create PhysicsHelper utility class
- [ ] 1.2.2 Implement collision group assignment functions
- [ ] 1.2.3 Add physics body configuration helpers

### Phase 2: Entity Migration
- [ ] 2.1.1 Enhance BaseEntity enablePhysics() method
- [ ] 2.1.2 Add collision callback helper methods to BaseEntity
- [ ] 2.1.3 Ensure physics body sizing matches visual representation
- [ ] 2.2.1 Remove CollisionComponent from Projectile entities
- [ ] 2.2.2 Implement Phaser collision callbacks for projectiles
- [ ] 2.2.3 Test projectile collision detection
- [ ] 2.3.1 Uncomment enemy collision code
- [ ] 2.3.2 Remove CollisionComponent dependency from enemies
- [ ] 2.3.3 Implement enemy physics collision
- [ ] 2.4.1 Add physics body to player entity
- [ ] 2.4.2 Implement player collision handlers

### Phase 3: Collision Logic Implementation
- [ ] 3.1.1 Remove CollisionSystem from GameScene
- [ ] 3.1.2 Add Phaser collider/overlap setups
- [ ] 3.1.3 Implement collision callback functions
- [ ] 3.2.1 Create handleProjectileEnemyCollision
- [ ] 3.2.2 Create handlePlayerEnemyCollision
- [ ] 3.2.3 Create handlePlayerPowerupCollision
- [ ] 3.2.4 Create handleProjectileObstacleCollision
- [ ] 3.3.1 Preserve damage dealing functionality
- [ ] 3.3.2 Preserve destruction on collision
- [ ] 3.3.3 Implement collision cooldowns
- [ ] 3.3.4 Add special collision effects

### Phase 4: Complete System Removal
- [ ] 4.1.1 Delete CollisionSystem.js file
- [ ] 4.1.2 Delete CollisionComponent.js file
- [ ] 4.1.3 Remove collision scopeName imports
- [ ] 4.2.1 Clean up CollisionComponent references in entities
- [ ] 4.2.2 Remove collision component initialization code
- [ ] 4.2.3 Clean up commented collision code
- [ ] 4.2.4 Update entity factory methods
- [ ] 4.3.1 Remove collision scopeName tests
- [ ] 4.3.2 Remove collision component tests
- [ ] 4.3.3 Add physics integration tests

### Phase 5: Testing & Validation
- [ ] 5.1.1 Test projectile-enemy collisions
- [ ] 5.1.2 Test player-enemy collisions
- [ ] 5.1.3 Test player-powerup collection
- [ ] 5.1.4 Test object pooling with physics
- [ ] 5.1.5 Verify damage dealing/receiving
- [ ] 5.2.1 Performance comparison testing
- [ ] 5.2.2 Memory leak validation
- [ ] 5.2.3 Physics world performance monitoring

## Implementation Notes

### Collision Group Setup
```javascript
// In ConfigManager.js
const COLLISION_GROUPS = {
  PLAYER: 'player',
  ENEMY: 'enemy', 
  PLAYER_PROJECTILE: 'playerProjectile',
  ENEMY_PROJECTILE: 'enemyProjectile',
  POWERUP: 'powerup',
  OBSTACLE: 'obstacle'
};
```

### Physics Helper Pattern
```javascript
// In PhysicsHelper.js
export function setupCollisionGroups(physics) {
  // Create collision groups
  // Set collision rules
}

export function assignCollisionGroup(entity, groupName) {
  // Assign entity to collision group
}
```

### Collision Handler Pattern
```javascript
// In GameScene.js
handleProjectileEnemyCollision(projectile, enemy) {
  // Apply damage
  // Handle destruction
  // Create effects
}
```

This plan completely removes the custom collision scopeName while preserving all functionality through Phaser's proven physics engine.