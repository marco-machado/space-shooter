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

- Vitest loads `vitest.config.js` and reads `resolve.alias` from `vite.config.js`. Keep the `@` path in `vite.config.js` only.
- `npm run lint <files>` appends files to `src/`, so it still lints all of `src/`.
- `src/config/` has both `ConfigManager.js` and the older `Environment.js`/`GameConfig.js`. New code should use `ConfigManager`.
- `tests/setup.js` forces `VITE_LOG_LEVEL=error`, `VITE_DEBUG_MODE=false`, and silences `console.log`, `console.debug`, and `console.info`.
- `.serena/memories/` holds notes from another agent tool. Treat them as history, not as the current tree.
