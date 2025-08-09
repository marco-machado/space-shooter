1. Confirm Phase 3 scope and success criteria from docs/ECS_MIGRATION.md
- Open docs/ECS_MIGRATION.md and extract the explicit Phase 3 deliverables and acceptance criteria, especially around ECS enemies in GameScene and the collision bridge.
- Produce a concise checklist in docs/migration/phase3_checklist.md with each criterion mapped to verifiable tests.
- Identify any ambiguities or missing criteria and add clarifying notes and assumptions in the checklist.
- Deliverables: updated docs/ECS_MIGRATION.md cross-referenced checklist, issue list for any gaps.
2. Establish controlled test harness and debug tooling for GameScene and ECS enemies
- Add runtime toggles to GameScene to enable or disable ECS enemies and the collision bridge independently.
- Add a debug overlay for ECS: entity count by archetype, system timings, collision event counts per frame, and a toggle to draw collider bounds.
- Ensure logs can be filtered by ECS tag, enemy ID, and collision pairs; add sampling toggles to keep logs manageable under load.
- Deliverables: GameScene debug panel entries, debug overlay drawing, log filters, documentation in docs/devtools/ECS_debugging.md.
3. Inventory current enemy pipeline and legacy codepaths in GameScene
- Code-search for Enemy, Spawner, CollisionBridge, and GameScene integrations; diagram current data flow from spawn to despawn.
- List all legacy dependencies still active in GameScene for enemies, including any Mono/OOP proxies, and mark candidates for removal or gating.
- Deliverables: docs/migration/enemy_pipeline_inventory.md with a diagram and a table of dependencies and their migration status.
4. Finalize enemy ECS component model and data contracts
- Standardize the component set for enemies and their interactions:
    - Identity and state: EnemyTag, TeamTag, AIState, TargetRef.
    - Spatial: Transform or LocalToWorld, Velocity, DesiredVelocity, SteeringParams.
    - Health and combat: HitPoints, DamageBuffer or PendingDamage, Hurtbox, Hitbox or DamageOnHit, Invulnerability/IFrames.
    - Physics interface: ColliderDef, PhysicsBodyRef or PhysicsLink, CollisionMask.
    - Lifecycle: SpawnRequest, Lifetime or DespawnConditions, PendingDestroy.
    - Presentation: RenderRef, AnimatorRef, AudioRef.
- Document each component’s purpose, ownership, and which systems read or write it.
- Deliverables: src/ecs/components finalized, docs/ecs/components/enemy.md updated, archetype definitions for common enemy types.
5. Define and enforce the enemy systems execution order and world grouping
- Establish explicit update groups and ordering to avoid race conditions:
    - BeginFrameBarrier
    - EnemySpawnSystem and EnemyInitSystem
    - TargetingSystem and AIStateSystem
    - Navigation and SteeringSystem
    - MovementIntegrationSystem
    - PhysicsSyncOutSystem and ColliderCreateSystem
    - PhysicsStep
    - CollisionBridgeInSystem and CollisionEventAggregationSystem
    - DamageResolutionSystem and KnockbackSystem
    - Death and DespawnSystem including PhysicsReleaseSystem
    - RenderSyncSystem and AudioTriggerSystem
    - EndFrameBarrier
- Encode this ordering using the engine’s group and dependency annotations; add a unit test asserting system order where supported.
- Deliverables: system registrations with grouping, a diagram in docs/ecs/systems/enemy_pipeline.md.
6. Integrate ECS enemy spawning with GameScene data and content
- Replace or gate the legacy enemy spawn in GameScene with ECS spawn requests:
    - Convert wave or encounter data into SpawnRequest components or a SpawnQueue.
    - Prebuild enemy archetypes and shared data for zero-alloc spawn.
- Ensure pooling is used for transient presentation objects and physics bodies where applicable.
- Deliverables: ECS-driven spawn path in GameScene, SpawnRequest producers, pool manager hooks, parity tests for wave definitions.
7. Complete the collision bridge: ECS to physics world registration
- Implement a one-way sync that registers or updates physics colliders for entities with ColliderDef but without a PhysicsLink.
- Maintain a bidirectional map between Entity and PhysicsBodyID; ensure stable lifetimes and cleanup on despawn.
- Support shapes and configuration needed by enemies and projectiles; validate layer and mask mapping against legacy rules.
- Deliverables: ColliderCreateSystem, PhysicsLink map, unit tests for create, update, and free flows.
8. Complete the collision bridge: transform and velocity synchronization
- Push ECS transforms and velocities to physics before stepping; pull authoritative positions and contact info after stepping.
- Avoid feedback loops by clearly defining ownership per axis per frame; document whether physics or ECS owns the transform in each phase.
- Handle kinematic vs dynamic bodies consistently; provide CCD configuration for fast movers if supported.
- Deliverables: PhysicsSyncOutSystem and PhysicsSyncInSystem with ownership rules documented and tested.
9. Complete the collision bridge: events and filters back into ECS
- Convert physics contacts into ECS-friendly events:
    - Generate CollisionEnter, Stay, Exit as event components or into a dynamic buffer per entity.
    - Deduplicate and time-stamp events; filter by collision mask and TeamTag.
- Provide a thin translation layer to higher-level HitEvent for damage systems to consume.
- Deliverables: CollisionBridgeInSystem, CollisionEvent schema, tests for event generation, deduplication, and filtering.
10. Implement damage, death, and cleanup systems using collision events
- Read HitEvent or CollisionEvent to apply damage and status effects; respect i-frames and shields.
- Emit DeathEvent when HitPoints reach zero; trigger VFX, SFX, loot, and analytics.
- Ensure PhysicsReleaseSystem cleans up physics bodies when PendingDestroy is set; reclaim pooled resources.
- Deliverables: DamageResolutionSystem, DeathSystem, PhysicsReleaseSystem, end-to-end tests covering hit-to-despawn.
11. Ensure presentation sync and animation remains correct under ECS
- Update RenderSyncSystem to consume ECS transforms and state to drive render transforms, animator parameters, and effect triggers.
- Verify animation events still arrive in the right frame relative to damage windows and collisions.
- Deliverables: RenderSyncSystem updates, animation parameter mapping doc, visual parity captures.
12. Validate collision layers, masks, and gameplay rules
- Define and document the collision matrix for Player, Enemy, Projectile, Environment, and Triggers.
- Create an automated matrix test that spawns representative bodies and asserts which pairs collide and which do not.
- Deliverables: docs/physics/collision_matrix.md, automated mask tests, a debug scene or harness for manual verification.
13. E2E test scenarios for ECS enemies and collision bridge in GameScene
- Author deterministic scenarios:
    - Single enemy hit by a projectile; assert damage applied exactly once.
    - Enemy swarm pathfinding to player; assert no tunneling or stuck colliders.
    - Stress test with large enemy counts and high projectile throughput; assert no missed events.
- Capture authoritative results: frame-by-frame counts of collisions, damage totals, alive enemies, and timings.
- Deliverables: test harness scripts or playmode tests, golden outputs for regression, CI integration.
14. Performance and stability pass
- Profile system timings; aim for target frame budgets defined in docs/ECS_MIGRATION.md.
- Optimize hot paths: event aggregation, map lookups, and structural changes; use command buffers and chunk-friendly layouts.
- Add guardrails: failsafes for event floods, max entities per frame, and back-pressure for spawners.
- Deliverables: before-and-after profiling report, performance thresholds enforced in CI, config for rate limits.
15. Finalize gating, rollback, and feature flags
- Add feature flags: ECS_ENEMIES and COLLISION_BRIDGE; default them on in non-dev builds after validation.
- Implement a runtime kill-switch for both features to revert to legacy behavior if enabled.
- Document rollback steps and log breadcrumbs to detect when rollbacks occur.
- Deliverables: feature flags, rollback doc, smoke test to validate toggling at runtime.
16. Remove or quarantine legacy enemy and collision pathways
- Identify legacy classes and hooks superseded by ECS; remove or move behind dev-only flags.
- Update GameScene to call only ECS flows in normal operation; leave a minimal compatibility shim for dev testing.
- Deliverables: PR removing legacy code, migration notes, reduced tech debt list.
17. Documentation updates and developer onboarding
- Update docs/ECS_MIGRATION.md to reflect Phase 3 completion, known limitations, and remaining backlog.
- Add how-to guides:
    - Adding a new enemy type in ECS.
    - Using the collision bridge for new gameplay features.
    - Debugging collisions and damage.
- Deliverables: docs/ecs/howto_add_enemy.md, docs/bridge/collision_bridge.md, updated migration doc.
18. Phase 3 sign-off and release packaging
- Run the full CI suite including E2E and performance tests; export summary artifacts.
- Capture visual parity videos for key encounters in GameScene.
- Tag a release branch for Phase 3, update changelogs, and notify stakeholders.
- Deliverables: release branch and tag, changelog, sign-off checklist completion.
19. Phase 4 prep per docs/ECS_MIGRATION.md: scope, dependencies, and design spikes
- From docs/ECS_MIGRATION.md, extract the Phase 4 targets and produce:
    - Scope doc and acceptance criteria.
    - Dependency map on Phase 3 outputs and any external teams.
    - Design spikes for risky items, e.g., player input bridge, projectile unification, or UI bindings.
- Queue prerequisites discovered during Phase 3, such as shared event schemas or input abstraction.
- Deliverables: docs/migration/phase4_plan.md with milestones, risks, and spike outcomes.
20. Phase 5 prep per docs/ECS_MIGRATION.md: performance, content scale, and polish
- From docs/ECS_MIGRATION.md, extract Phase 5 outcomes and prepare:
    - Performance targets and profiling plan at scale.
    - Content conversion pipeline for remaining actors.
    - QA plan for long-run stability and save-load parity if relevant.
- Deliverables: docs/migration/phase5_plan.md, perf KPI dashboard plan, content conversion checklist.
21. Ownership, task breakdown, and timeline for AI agent execution
- Break the above steps into atomic tasks suitable for parallel AI agent execution with clear inputs, outputs, and acceptance criteria.
- Assign code owners per area: ECS components, systems, physics bridge, GameScene integration, tests, docs.
- Produce a Gantt-style timeline with dependencies and integration checkpoints.
- Deliverables: tasks.json or similar for agent orchestration, owners.md, timeline.md.
22. Risk register and mitigation plan
- Identify key risks: race conditions, double-hit events, physics-ECS drift, performance regressions, and content mismatches.
- Define mitigations and monitoring signals for each risk; add automated checks where possible.
- Deliverables: risk_register.md with owners and monitoring hooks, alerts for critical signals in CI or telemetry.
