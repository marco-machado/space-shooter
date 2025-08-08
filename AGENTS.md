# Repository Guidelines

## Project Structure & Module Organization
- Source: `src/` with domains like `components/`, `systems/`, `entities/`, `scenes/`, `utils/`, `ecs/`, `adapters/`, `config/`.
- Tests: `tests/` mirrors source paths; test files end with `*.test.js` (e.g., `tests/systems/MovementSystem.test.js`).
- Static assets: `public/` (copied by Vite). Build output: `dist/`.
- Entry: `index.html`, app bootstrap in `src/main.js`.

## Build, Test, and Development Commands
- `npm run dev`: Start Vite dev server.
- `npm run build`: Production build to `dist/`.
- `npm run preview`: Serve the built app locally.
- `npm test` / `npm run test:watch`: Run unit tests with Vitest (jsdom env).
- `npm run test:coverage`: Generate coverage (global thresholds 50%).
- `npm run lint`: Lint JavaScript. Prefer targeting files or folders, e.g. `eslint src/utils/MathUtils.js`.
- `npm run lint:fix`: Autofix issues (scope to specific paths where possible).
- `npm run format` / `npm run format:check`: Apply or check Prettier formatting.
- Safety: Do not auto-refactor or mass-lint Phaser scenes/systems; avoid altering `GameScene.js` for testing.

## Coding Style & Naming Conventions
- Language: ES2022 modules. Indent 2 spaces; single quotes; semicolons.
- Use arrow functions, `const`/`let` (no `var`), template literals, object shorthand.
- Naming: Classes and files for gameplay types use `PascalCase` (e.g., `BaseEntity.js`, `WeaponSystem.js`); directories are lowercase/kebab-case.
- Logging: Use `Logger.scope(name)`; only `console.error` allowed outside logger.
- Tools: ESLint (with Prettier) config in `eslint.config.js`; Prettier in `.prettierrc`.

## Testing Guidelines
- Framework: Vitest with `jsdom`; setup at `tests/setup.js`.
- Location: Place tests under `tests/` mirroring `src/` structure; name `*.test.js`.
- Coverage: Scenes/graphics/config are excluded; target ≥50% global coverage. Run `npm run test:coverage`.
- Mocks: Use `tests/__mocks__` and provided globals; do not unit test Phaser scenes directly.

## Commit & Pull Request Guidelines
- Commits: Follow Conventional Commits (e.g., `feat: add plasma weapon`, `fix: correct movement bounds`).
- PRs: Include purpose, linked issues, testing steps, and screenshots/GIFs of gameplay where relevant.
- Scope PRs narrowly; keep refactors separate from features. Respect safety rules above.

## Security & Configuration Tips
- Copy `.env.example` to `.env`. Only `VITE_*` vars are read (e.g., `VITE_DEBUG_MODE`, `VITE_LOG_LEVEL`).
- Don’t commit secrets or `.env`. Validate config via `ConfigManager.getValidationStatus()` during development.
