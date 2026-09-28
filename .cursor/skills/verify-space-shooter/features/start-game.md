# Start game

Choosing `START GAME` leaves the menu and begins a run. The playfield shows the HUD. Escape pauses the run.

## Sub-features

- `start-activate` leaves the menu by activating `START GAME`.
- `start-hud` shows `SCORE: 0`, `LIVES: 3`, `LEVEL: 1`, `WAVE: 1`, and `WEAPON: LASER`.
- `start-pause` shows `PAUSED` and `Press ESC to resume` after Escape during play.
- `start-error` is the game-error dialog. A healthy start does not show it. `error` stays null.

## How to get to it (user POV)

- On the main menu, leave `START GAME` selected and press Enter or Space.
- On the main menu, click the `START GAME` label.
- In debug mode, press F1 on the main menu.

## Driving it with verify-space-shooter

Preconditions:

- The main menu is up: `readScene().scene` is `MainMenuScene`, `error` is null, and `START GAME` has `color` `#00ff00` and `alpha` 1.
- `doctor` reports this run's url.

- **Activate start.** Press `Enter`. Poll `readScene()` until `texts` includes `SCORE: 0` and `error` is null.
- **HUD.** `scene` is `GameScene`. `texts` includes `LIVES: 3`, `LEVEL: 1`, `WAVE: 1`, and `WEAPON: LASER`.
- **Pause.** Press `Escape`. Poll until `texts` includes `PAUSED` and `Press ESC to resume`. Press `Escape` again and poll until `PAUSED` is gone and `SCORE: 0` remains.
- **Proof.** Save `readScene()` before Enter, after the HUD, and after pause. Save a screenshot of the HUD and a screenshot of `PAUSED`. Both screenshots show `DEVELOPMENT MODE`.

## Gotchas

- Proving the menu is not proof of this feature.
- `Enemy` calls `component.update` only when that method exists. `MovementComponent` is data and has no `update`. A throw of `movement.update is not a function` means that guard regressed.
- `BaseEntity.setActive` and `BaseEntity.setVisible` park pooled enemies. A throw of `enemy.setActive is not a function` means those methods regressed.
- The HUD can be up while enemies are still above the screen. Do not require a red enemy rectangle in the first screenshot.
