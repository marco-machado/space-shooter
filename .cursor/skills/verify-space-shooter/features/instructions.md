# Instructions

Instructions opens a centered overlay that tells the player how to move and shoot, then returns to the menu when the player presses a key that is not a menu key.

## Sub-features

- `instructions-open` shows the overlay from the menu.
- `instructions-close` removes the overlay and leaves the menu selectable.

## How to get to it (user POV)

- On the main menu, move the green selection to `INSTRUCTIONS` and press Enter.
- On the main menu, click the `INSTRUCTIONS` label.

## Driving it with verify-space-shooter

Preconditions:

- The main menu is up: `readScene().scene` is `MainMenuScene`, `error` is null, and `START GAME` has `alpha` 1.
- `doctor` still reports this run's url.

- **Select instructions.** From `START GAME` selected, press `ArrowDown` once. Run `browser_press_key` with key `ArrowDown`. The `INSTRUCTIONS` entry has `color` `#00ff00`.
- **Open overlay.** Press `Enter`. Run `browser_press_key` with key `Enter`. Poll `readScene()` until some `text` contains `Press any key to return to menu` and `Hold SPACE to shoot at enemies`. `scene` stays `MainMenuScene`.
- **Close overlay.** Press `a`. Run `browser_press_key` with key `a`. Poll until no text contains `Press any key to return to menu`. `INSTRUCTIONS` and `START GAME` are still present.
- **Proof.** Save the open-overlay `readScene()` JSON to `artifacts/instructions/open.json` and a screenshot to `artifacts/instructions/open.png`. Save the closed state to `artifacts/instructions/closed.json`. The open screenshot shows the instructions copy and `DEVELOPMENT MODE`.

## Gotchas

- `Enter` and `Space` both activate the selected menu item. On the overlay, the same keys also close it and can activate the menu item in the same turn. Close the overlay with `a`.
- Clicking the canvas while the overlay is open closes it (`pointerdown`). Do not click the canvas between open and the proof screenshot.
- The click entry point needs a canvas hit on the `INSTRUCTIONS` text. Prefer the keyboard entry unless the task is specifically the pointer path.
- The overlay has no background panel. Menu labels stay visible behind the instructions copy. Assert the instructions string in `readScene().texts`.
