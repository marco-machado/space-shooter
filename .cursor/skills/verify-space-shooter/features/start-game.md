# Start game

Choosing `START GAME` leaves the menu and attempts to begin a run. The run does not start. The player sees a game-error dialog and a `Reload Game` button.

## Sub-features

- `start-activate` leaves the menu by activating `START GAME`.
- `start-error` shows the game-error dialog instead of the playfield.
- `start-hud` would show `SCORE`, `LIVES`, `LEVEL`, `WAVE`, and `WEAPON: LASER`. That state is unreachable.
- `start-pause` would show `PAUSED` after Escape during play. That state is unreachable.

## How to get to it (user POV)

- On the main menu, leave `START GAME` selected and press Enter or Space.
- On the main menu, click the `START GAME` label.
- In debug mode, press F1 on the main menu.

## Driving it with verify-space-shooter

Preconditions:

- The main menu is up: `readScene().scene` is `MainMenuScene`, `error` is null, and `START GAME` has `color` `#00ff00` and `alpha` 1.
- `doctor` reports this run's url. Debug mode is on, so the dialog includes the exception text.

- **Activate start.** Press `Enter`. Run `browser_press_key` with key `Enter`. Poll `readScene()` until `error` is `Game Error`.
- **Error dialog.** `errorBody` is `Game Error: enemy.setActive is not a function`. The DOM button name is `Reload Game`. `scene` is not a running playfield, and `texts` does not include `SCORE:` or `PAUSED`.
- **Unreachable HUD.** Do not press `Escape` or `Space` and report pause or shooting. The playfield was never created. Record `start-hud` and `start-pause` as unreachable because `error` is `Game Error`.
- **Proof.** Save `readScene()` to `artifacts/start-game/error.json` and a screenshot to `artifacts/start-game/error.png`. The screenshot shows `Game Error`, `enemy.setActive is not a function`, `Reload Game`, and `DEVELOPMENT MODE`.

## Gotchas

- `EnemySpawnSystem.initializeEnemyPools` calls `enemy.setActive(false)` while creating the pool (`src/systems/EnemySpawnSystem.js`). `BaseEntity` has no `setActive`, so `GameScene.create` throws before the HUD exists.
- Without `VITE_DEBUG_MODE=true`, the same failure shows only `A game error occurred. Please refresh the page to continue.` Verification runs with debug mode, so assert the `enemy.setActive` sentence.
- `Reload Game` reloads the page and returns to the preloader. It does not resume a run.
- Proving the menu is not proof of this feature.
