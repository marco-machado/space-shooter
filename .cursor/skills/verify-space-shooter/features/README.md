# Space Shooter verification map

This directory is the maintained source for verifying what a player can do in Space Shooter. Read this index, then follow the matching feature file.

## Baseline preconditions

- Start the game with `node .cursor/skills/verify-space-shooter/scripts/session.mjs start`.
- `doctor` reports `ok: true` and a `url` on `127.0.0.1` with `?dev=true`.
- Drive that url only. Do not drive port 5173 or a Vite process this session did not start.
- `readScene()` from the skill reports `ready: true` and `error: null` before menu actions.
- The verification origin starts with an empty `localStorage` key `space-shooter-save`.

## Driving conventions

- Start every recipe from the main menu unless its preconditions say otherwise.
- Reach the menu by the preloader prompt `PRESS ANY KEY TO START`, then poll until `scene` is `MainMenuScene` and `START GAME` has `alpha` 1.
- Press `ArrowUp` and `ArrowDown` to change the selection. Press `Enter` to activate it.
- Read canvas labels with `readScene()`, not from the accessibility tree.
- Record the feature id and the entry point with every artifact.
- Leave proof files in `artifacts/`. Cleanup removes only the verification server.

## Proof and skip reporting

- Save `readScene()` before the action and after the resulting state, plus a screenshot that shows `DEVELOPMENT MODE` and the canvas.
- Report an unreachable path with the command you ran and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 and one paragraph, then exactly four H2 sections: `Sub-features`, `How to get to it (user POV)`, `Driving it with verify-space-shooter`, and `Gotchas`.

## Features

- [Main menu](./main-menu.md) covers the preloader, the three menu labels, and keyboard selection.
- [Instructions](./instructions.md) covers opening and closing the instructions overlay.
- [Settings](./settings.md) covers the settings overlay and the audio line from this session's environment.
- [Start game](./start-game.md) covers choosing `START GAME`. Gameplay does not begin; the canvas shows a game error.
