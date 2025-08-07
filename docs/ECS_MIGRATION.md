# BitECS Migration Plan for Space Shooter Game

## Overview
Complete migration from current BaseEntity/BaseComponent/BaseSystem architecture to bitECS. This will replace all existing ECS code with bitECS for better performance and data-oriented design.

## Phase 1: Setup & Core Infrastructure

### 1.1 Install bitECS and Dependencies ✅ COMPLETED
```bash
npm install bitecs
```
**Status**: bitECS v0.3.40 installed and added to package.json dependencies

### 1.2 Create ECS Directory Structure ✅ COMPLETED
```
src/ecs/
├── components/
├── systems/
├── entities/
├── world.js
└── index.js
```
**Status**: Directory structure created with placeholder files for world.js and index.js

### 1.3 World Management
- Create `src/ecs/world.js` for world creation and management
- Initialize bitECS world in GameScene.create()
- Set up entity-sprite mapping system (Map<entityId, Phaser.GameObject>)
- Create world time management integration

### 1.4 Component Definitions ✅ COMPLETED
Create in `src/ecs/components/`:

**Status**: All 11 components implemented with proper bitECS integration, Logger scoping, and JSDoc documentation

```javascript
// Position.js
const Position = defineComponent({ x: Types.f32, y: Types.f32 })

// Velocity.js  
const Velocity = defineComponent({ x: Types.f32, y: Types.f32 })

// Health.js
const Health = defineComponent({ current: Types.i32, max: Types.i32 })

// Weapon.js
const Weapon = defineComponent({ 
  fireRate: Types.f32, 
  lastFired: Types.f32, 
  damage: Types.i32,
  projectileSpeed: Types.f32,
  weaponType: Types.ui8
})

// Render.js
const Render = defineComponent({ 
  spriteId: Types.ui32, 
  visible: Types.ui8,
  layer: Types.ui8 
})

// Physics.js
const Physics = defineComponent({ 
  bodyType: Types.ui8,
  collisionGroup: Types.ui8 
})

// AI.js
const AI = defineComponent({
  pattern: Types.ui8,
  targetEntity: Types.eid,
  patternData: [Types.f32, 8] // Array for pattern-specific data
})

// Tags
const Player = defineComponent()
const Enemy = defineComponent() 
const Projectile = defineComponent()
const PowerUp = defineComponent()
```

## Phase 2: System Implementation

### 2.1 Create System Functions
Create in `src/ecs/systems/`:

```javascript
// MovementSystem.js
const movementSystem = (world) => {
  const { time: { delta } } = world
  const entities = movementQuery(world)
  
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i]
    Position.x[eid] += Velocity.x[eid] * delta
    Position.y[eid] += Velocity.y[eid] * delta
  }
  
  return world
}

// RenderSystem.js - Sync Phaser sprites with entity positions
const renderSystem = (world, spriteMap) => {
  const entities = renderQuery(world)
  
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i]
    const sprite = spriteMap.get(eid)
    
    if (sprite && Render.visible[eid]) {
      sprite.x = Position.x[eid]
      sprite.y = Position.y[eid]
      sprite.visible = true
    }
  }
  
  return world
}
```

### 2.2 Query Definitions
```javascript
const movementQuery = defineQuery([Position, Velocity])
const renderQuery = defineQuery([Position, Render])
const weaponQuery = defineQuery([Position, Weapon])
const enemyQuery = defineQuery([Enemy, Position])
const playerQuery = defineQuery([Player, Position])
```

### 2.3 System Pipeline
```javascript
const pipeline = pipe(
  movementSystem,
  aiSystem,
  weaponSystem,
  collisionSystem,
  renderSystem,
  timeSystem
)
```

## Phase 3: Entity Management

### 3.1 Entity Creation Functions
Create in `src/ecs/entities/`:

```javascript
// createPlayer.js
export const createPlayer = (world, scene, x, y) => {
  const eid = addEntity(world)
  
  addComponent(world, Position, eid)
  addComponent(world, Velocity, eid)
  addComponent(world, Health, eid)
  addComponent(world, Weapon, eid)
  addComponent(world, Render, eid)
  addComponent(world, Physics, eid)
  addComponent(world, Player, eid)
  
  // Set initial values
  Position.x[eid] = x
  Position.y[eid] = y
  Health.current[eid] = 100
  Health.max[eid] = 100
  Weapon.fireRate[eid] = 0.2
  
  // Create Phaser sprite and map it
  const sprite = scene.add.rectangle(x, y, 64, 64, 0x0099ff)
  scene.spriteMap.set(eid, sprite)
  
  return eid
}
```

### 3.2 Replace Existing Entity Classes
- Convert Player.js to createPlayer() function
- Convert Enemy.js to createEnemy() function  
- Convert Projectile.js to createProjectile() function
- Remove all BaseEntity inheritance and component storage

### 3.3 Entity Lifecycle Management
```javascript
// Deactivate entity (for pooling)
export const deactivateEntity = (world, eid) => {
  if (hasComponent(world, Render, eid)) {
    Render.visible[eid] = 0
  }
  Position.x[eid] = -1000
  Position.y[eid] = -1000
}

// Reactivate entity
export const reactivateEntity = (world, eid, x, y) => {
  Position.x[eid] = x
  Position.y[eid] = y
  if (hasComponent(world, Render, eid)) {
    Render.visible[eid] = 1
  }
}
```

## Phase 4: Scene Integration

### 4.1 GameScene Updates
```javascript
// In GameScene.create()
this.world = createWorld()
this.world.time = { delta: 0, elapsed: 0, then: performance.now() }
this.spriteMap = new Map()

// Create systems pipeline
this.pipeline = pipe(
  movementSystem,
  aiSystem, 
  weaponSystem,
  collisionSystem,
  renderSystem.bind(null, this.spriteMap),
  timeSystem
)

// In GameScene.update()
update(time, delta) {
  this.world.time.delta = delta
  this.world.time.elapsed += delta
  
  this.pipeline(this.world)
}
```

### 4.2 Collision Detection Integration
```javascript
// Update collision detection to use ECS queries
const playerEntities = playerQuery(this.world)
const enemyEntities = enemyQuery(this.world) 

// Use existing Phaser physics but reference entities by ECS queries
```

### 4.3 Preserve Existing Integrations
- Keep Logger system calls within systems
- Maintain ConfigManager usage for constants
- Preserve EventBus integration for game events
- Keep collision callbacks functional with entity IDs

## Phase 5: Cleanup & Optimization

### 5.1 Remove Old Architecture Files
Delete these files completely:
- `src/entities/BaseEntity.js`
- `src/components/BaseComponent.js`
- `src/systems/BaseSystem.js`
- `src/components/MovementComponent.js`
- `src/components/HealthComponent.js`
- `src/components/WeaponComponent.js`

### 5.2 Update Imports Across Codebase
- Remove all BaseEntity imports
- Remove component class imports
- Update to use new ECS entity creation functions
- Clean up unused system imports

### 5.3 Performance Optimization
```javascript
// Use enter/exit queries for lifecycle events
const enteredEnemies = enterQuery(enemyQuery)
const exitedEnemies = exitQuery(enemyQuery)

// Optimize hot path queries
const movingEntities = defineQuery([Position, Velocity, Not(Static)])
```

### 5.4 Object Pooling with bitECS
```javascript
// Implement efficient entity pooling
const entityPool = []

export const getPooledEntity = (world) => {
  return entityPool.pop() || addEntity(world)
}

export const returnToPool = (world, eid) => {
  // Reset components
  deactivateEntity(world, eid)
  entityPool.push(eid)
}
```

## Phase 6: Testing Strategy

### 6.1 Unit Tests
- Test individual systems with mock world data
- Test component operations and queries
- Test entity creation and lifecycle functions

### 6.2 Integration Tests
- Test system interactions and data flow
- Test Phaser sprite synchronization
- Test collision detection with ECS entities

### 6.3 Human Testing Checkpoints
After each phase:
1. Verify game launches without errors
2. Test player movement and controls
3. Test enemy spawning and AI
4. Test weapon firing and projectiles
5. Test collision detection
6. Verify performance maintains 60 FPS

### 6.4 Performance Benchmarks
- Measure frame times before and after migration
- Monitor memory usage improvements
- Validate entity count scalability

## Expected Benefits

### Performance Improvements
- **Cache Efficiency**: SoA layout improves CPU cache utilization
- **Memory Usage**: More efficient memory allocation patterns
- **Scalability**: Better performance with large entity counts
- **Iteration Speed**: Faster iteration over component arrays

### Development Benefits
- **Serialization**: Built-in world serialization for save/load
- **Debugging**: Better introspection of entity/component state
- **Maintainability**: Clear separation of data and behavior
- **Composability**: Easy to add new component combinations

### Architecture Benefits
- **Data-Oriented**: Components are pure data, systems are pure logic
- **Modularity**: Systems can be easily added, removed, or reordered
- **Testability**: Systems are functions, easier to unit test
- **Performance Predictability**: More predictable performance characteristics

## Migration Timeline

1. **Phase 1** (1-2 days): Setup infrastructure and basic components
2. **Phase 2** (2-3 days): Implement core systems and pipeline
3. **Phase 3** (2-3 days): Convert entity creation and management
4. **Phase 4** (1-2 days): Integrate with GameScene and Phaser
5. **Phase 5** (1 day): Cleanup old code and optimize
6. **Phase 6** (1-2 days): Testing and validation

**Total Estimated Time: 8-13 days**

## Risk Mitigation

### Technical Risks
- **Phaser Integration**: Ensure sprite mapping works correctly
- **Performance**: Validate that bitECS improves rather than degrades performance
- **Feature Parity**: Ensure all existing functionality is preserved

### Mitigation Strategies
- Test each phase thoroughly before proceeding
- Keep detailed logs of changes for rollback if needed
- Use git branches for each major phase
- Manual testing after each significant change

## Implementation Notes

### Key Decisions
- **Complete Replacement**: No backward compatibility, clean migration
- **Preserve Features**: All current gameplay mechanics must work identically
- **Phaser Integration**: Keep existing sprite/physics integration patterns
- **Testing Focus**: Emphasize unit tests and manual verification

### Technical Considerations
- Entity IDs are integers, maintain mapping to Phaser objects
- Component data is stored in typed arrays for performance
- Systems are pure functions that operate on world data
- Queries are cached and optimized by bitECS internally

This migration will modernize the codebase architecture while maintaining all existing functionality and improving performance characteristics.