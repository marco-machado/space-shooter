# Space Shooter – Evidence-Based Development Status

Date: 2025-08-09

This document summarizes the current state of the project based on direct evidence from build output, test execution, linters, and repository inspection.

## Overview
- Tooling: Vite v7, Vitest v3, ESLint + Prettier.
- Structure: `src/` domains present and mirrored under `tests/` per guidelines.
- Env: `.env.example` provided with `VITE_*` flags; scenes/graphics/config excluded from coverage in `vitest.config.js`.

## Build
- Command: `npm run build`
- Result: Success
  - `dist/assets/index-*.js`: ~1.60 MB (gzip ~358 kB), map ~10.7 MB
  - `dist/index.html`: ~2.60 kB (gzip ~0.92 kB)
- Notes: Bundle is on the heavier side; consider code-splitting/vendor chunking later.

## Tests
- Coverage: Blocked — missing `@vitest/coverage-v8`. `vitest config` requests provider `v8`.
- Execution approach: To avoid sandbox worker-kill EPERM, used `vitest run --pool=threads --maxWorkers=1`.
- Sample results and themes:
  - Passing: `tests/config/ConfigManager.test.js` (1/1) → configuration plumbing works.
  - Failing suites highlight contract mismatches rather than pure logic bugs:
    - `tests/systems/BaseSystem.test.js` (several failures):
      - Expected log text differs (tests use “scopeName”, code logs “system”).
      - Some performance warnings around 16.67ms threshold not emitted as tests expect.
      - Reset message text mismatch.
    - `tests/entities/BaseEntity.test.js`:
      - Missing expected error logs on fallback creation (sprite/image failure cases).
      - `recreateGameObject()` contains an intentional hard-throw making the rest unreachable.
    - `tests/components/MovementComponent.test.js`:
      - Pattern creators expect `boundaryBehavior: 'destroy'`; code returns `'offscreen-deactivate'`.
    - `tests/components/WeaponComponent.test.js`:
      - Tests sometimes assert global `Logger.info/warn` while code uses scoped `Logger.scope('WeaponComponent')...`.
    - `tests/components/BaseComponent.test.js`:
      - Tests expect lenient `deserialize` for odd types; code enforces strict type checks and throws.
    - `tests/utils/GameStateManager.test.js`:
      - Constructor validates `scene`; tests pass non-Phaser objects or expect implicit `null` handling.
      - Tests attempt to mutate `eventBus` but class exposes it via a getter only → `Cannot set property eventBus...`.

### Commands used
- `npm test` (baseline) — runs but may trigger EPERM worker termination in restricted envs.
- `./node_modules/.bin/vitest run --pool=threads --maxWorkers=1` — reliable in sandbox.
- Coverage attempt: `npm run test:coverage` → fails due to missing `@vitest/coverage-v8`.

## Linters & Formatting
- ESLint: 20 errors.
  - Unused vars: `PlayerInputSystem.js`, `TimeSystem.js`, `ecs/systems/WeaponSystem.js`, `ecs/systems/index.js`, `ecs/systems/test-systems.js`, `systems/WeaponSystem.js`.
  - Illegal assignment: `no-const-assign` in `TimeSystem.js`.
  - Parameter mutation: `no-param-reassign` in `TimeSystem.js`, `event-bus/EventBus.js`.
  - Unreachable code: `entities/BaseEntity.js` (`recreateGameObject()`).
- Prettier: 53 files reported with code style issues; `npm run format` will autofix.

## Notable Code–Test Contract Mismatches
- Logging API:
  - Code: primarily `Logger.scope(name).method()`.
  - Tests: mixed — some check scoped logs, others call global `Logger.method()`.
- Log text:
  - `BaseSystem` logs “system …”; tests expect “scopeName …”.
- Behavior values:
  - `MovementComponent.create*Pattern()` → `'offscreen-deactivate'` vs tests’ `'destroy'`.
- Validation strictness:
  - `BaseComponent.deserialize()` is strict (throws on invalid types); tests expect graceful handling.
- Encapsulation:
  - `GameStateManager` exposes `eventBus` as getter (immutable); tests try to assign to it.

## Risks and Code Smells
- `BaseEntity.recreateGameObject()` starts with `throw new Error('NO GAMEOBJECT RECREATION');` → unreachable logic beyond this point and ESLint `no-unreachable`.
- `TimeSystem.js` reassigns const and function parameters.
- Test fragility from text-level log assertions.

## What’s Working
- Production build pipeline is healthy (Vite v7).
- Config manager behavior validated by tests.
- Logger subsystem initializes and validates levels; tests capture invalid level fallback.

## Recommendations
1. Decide test vs code alignment strategy and apply consistently:
   - Pick logging convention (scoped vs global). Either update tests to scoped or add a thin shim to forward key scoped logs to global where tests expect it.
   - Standardize log message text in `BaseSystem` or update tests to match the new wording.
   - Align `MovementComponent` pattern `boundaryBehavior` with PRD and tests (confirm desired gameplay: `'destroy'` vs `'offscreen-deactivate'`).
   - Choose strict vs lenient `BaseComponent.deserialize()`; update the opposite side accordingly.
   - Clarify `GameStateManager` constructor semantics and `eventBus` immutability in tests.
2. Fix code smells & lint errors:
   - Remove or gate the hard-throw in `BaseEntity.recreateGameObject()`; if feature is intentionally disabled, guard with an env flag and skip the remaining logic.
   - Address `TimeSystem.js` (`no-const-assign`, parameter reassigns) and other unused variables.
   - Run `npm run format` to clear Prettier issues.
3. Restore coverage reporting:
   - Add `@vitest/coverage-v8` to devDependencies and re-run `npm run test:coverage` to validate 50% thresholds (scenes/graphics/config excluded).
4. CI/test stability:
   - Use `vitest run --pool=threads --maxWorkers=1` in constrained environments to avoid EPERM worker termination.
5. Performance/build follow-ups (optional):
   - Evaluate code splitting and vendor chunking to reduce initial bundle size.

## Suggested Next Steps (Checklist)
- [ ] Add `@vitest/coverage-v8` and generate coverage.
- [ ] Resolve ESLint errors (targeted fixes; avoid mass refactors, esp. scenes/systems).
- [ ] Run `npm run format` to apply Prettier.
- [ ] Choose and enforce a single logging convention; update tests or code.
- [ ] Decide on AI pattern `boundaryBehavior` semantics and align code/tests.
- [ ] Remove/gate `recreateGameObject()` early throw; reassess related tests.
- [ ] Re-run tests with threads pool and capture updated results.

## Reproduction Notes
- Build: `npm run build`
- Tests (stable in sandbox): `./node_modules/.bin/vitest run --pool=threads --maxWorkers=1`
- Lint: `npm run lint -- src`
- Format check: `npm run format:check` (then `npm run format` to fix)
- Coverage (after installing plugin): `npm run test:coverage`

***
If you want, I can implement the minimal, surgical changes to align logs and pattern defaults, add the coverage plugin, and fix the flagged lint errors in a small PR.

