# AGENTS.md

Browser space shooter built with Phaser 3 (`phaser` ^3.90) and Vite 7, plain ES modules (`"type": "module"`), no TypeScript. Architecture is ECS-style: `BaseEntity` + `BaseComponent` (data) + `BaseSystem` (logic), with an `EventBus`, input adapters, and a `ConfigManager`. Graphics are placeholder colored shapes (`src/graphics/DevShapes.js`). Persistence is `localStorage`. Detailed docs live in `docs/` (ARCHITECTURE, DEVELOPMENT, EXAMPLES, REFERENCE); `CLAUDE.md` is the existing agent guide.

## Dev environment

- `npm ci --include=dev` first; `node_modules` is not checked in and scripts fail with `vitest: command not found` without it.
- Some agent runtimes (the Hermes TUI) export `NODE_ENV=production`, which makes plain `npm install`/`npm ci` skip devDependencies (no vitest, eslint, vite). Use `--include=dev`, and prefix commands with `NODE_ENV=development` when running tests or builds.
- `cp .env.example .env` for local settings. Variables are `VITE_*` (debug mode, log level, physics debug, lives, pool size, FPS display). `.env` is gitignored; do not read or edit it (or `.env.backup`) unless asked.
- `npm run dev` serves on port 5173 and auto-opens a browser (`vite.config.js`).

## Build & test

- `npm run test` runs `vitest run` (jsdom, setup in `tests/setup.js`, only `tests/**/*.test.js`).
- Single file: `npx vitest run tests/systems/MovementSystem.test.js`
- `npm run test:watch`, `npm run test:coverage` (v8; excludes `src/scenes/`, `src/graphics/`, `src/config/`).
- `npm run lint` / `npm run lint:fix` run `eslint src/ --ext .js`.
- Lint specific files: `npx eslint path/to/file.js` (CLAUDE.md prefers linting only files you touched).
- `npm run format` / `npm run format:check` (Prettier on `src/`, root `*.js *.json *.md`).
- `npm run validate` = lint + format:check + test.
- `npm run build` / `npm run preview`; `npm run clean` removes `dist/` and `coverage/`.

## Conventions

- Prettier: 2 spaces, single quotes, semicolons, `trailingComma: es5`, `printWidth: 100`, `arrowParens: avoid`.
- ESLint enforces `no-console` (only `console.error` allowed): log through `Logger` (`src/utils/Logger.js`: `Logger.debug/info/warn/error`).
- Unused vars/args must be prefixed `_`. `prefer-const`, `prefer-template`, `object-shorthand`, `prefer-arrow-callback` are errors.
- One default-exported class per file, PascalCase filename matching the class (`MovementSystem.js`, `WeaponComponent.js`). Subclasses extend `BaseEntity`, `BaseComponent`, `BaseSystem`, `BaseAdapter`.
- Event names/priorities come from `src/event-bus/EventTypes.js` (`EventTypes`, `EventPriority`); get the bus via `getEventBus()`.
- Tests mirror `src/` under `tests/<dir>/<Name>.test.js`; shared mocks in `tests/__mocks__/` (`PhaserScene.js`, `EventBus.js`, `localStorage.js`). Tests import from `vitest` explicitly.
- Commits use Conventional Commit prefixes: `feat:`, `fix:`, `docs:`, `test:`.

## Pitfalls

- The `@/` import alias is used in newer code and tests (`@/utils/Logger.js`), but no `resolve.alias` is defined in `vite.config.js` or `vitest.config.js`. Those imports will not resolve until an alias for `@` -> `src` is added. Relative imports (`../../src/...`) work. 7 of 9 test files fail to load because of this (#4).
- 12 older files import modules that do not exist: `../core/Logger.js` (Logger is in `src/utils/`), `./Entity.js`, `./Component.js`, `./System.js` (now `BaseEntity.js` / `BaseComponent.js` / `BaseSystem.js`). Affected: `src/main.js`, all of `src/scenes/`, `src/entities/Enemy.js`, `src/components/{Health,Collision}Component.js`, `src/systems/CollisionSystem.js`, `src/utils/GameStateManager.js`, `src/graphics/DevShapes.js`. `npm run build` fails on these (#5).
- The ESLint `no-console` override targets `src/core/Logger.js`, which does not exist; `src/utils/Logger.js` is not exempted, so `npm run lint` reports 8 errors there (#6).
- `npm run lint <files>` appends files to `src/`, so it still lints all of `src/`.
- `vite.config.js` sets `minify: 'terser'`, but `terser` is not in `devDependencies`; `npm run build` fails with `terser not found` until it is installed (#7).
- Test config is duplicated in `vite.config.js` and `vitest.config.js`; Vitest uses `vitest.config.js`. Edit that one.
- `src/config/` has both `ConfigManager.js` and the older `Environment.js`/`GameConfig.js`; new code should use `ConfigManager`.
- `tests/setup.js` forces `VITE_LOG_LEVEL=error`, `VITE_DEBUG_MODE=false`, and silences `console.log/debug/info`.
- `docs/DEVELOPMENT.md` mentions `npm run test:ui`; that script does not exist (#8).
- `.serena/memories/` holds notes from another agent tool; treat as history, not authoritative.
