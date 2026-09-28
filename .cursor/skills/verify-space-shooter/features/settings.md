# Settings

Settings opens a centered overlay that shows the audio, debug, physics, and log values for this run, then returns to the menu.

## Sub-features

- `settings-open` shows the overlay from the menu.
- `settings-audio` shows audio disabled for a verification session.
- `settings-close` removes the overlay and leaves the menu selectable.

## How to get to it (user POV)

- On the main menu, move the green selection to `SETTINGS` and press Enter.
- On the main menu, click the `SETTINGS` label.

## Driving it with verify-space-shooter

Preconditions:

- The main menu is up: `readScene().scene` is `MainMenuScene`, `error` is null, and a menu label has `alpha` 1.
- This run was started with `session.mjs start`, which sets `VITE_AUDIO_ENABLED=false` and `VITE_DEBUG_MODE=true`.

- **Select settings.** Press `ArrowDown` until `SETTINGS` has `color` `#00ff00`. From a fresh menu that is two `ArrowDown` presses. Run `browser_press_key` with key `ArrowDown` for each press.
- **Open overlay.** Press `Enter`. Run `browser_press_key` with key `Enter`. Poll `readScene()` until some `text` contains `Audio: Disabled`, `Debug Mode: On`, `Physics Debug: Off`, `Log Level: info`, and `Press any key to return to menu`.
- **Close overlay.** Press `a`. Run `browser_press_key` with key `a`. Poll until no text contains `Audio: Disabled`. `SETTINGS` is still in `texts`.
- **Proof.** Save the open-overlay `readScene()` JSON to `artifacts/settings/open.json` and a screenshot to `artifacts/settings/open.png`. The screenshot shows `Audio: Disabled` and `DEVELOPMENT MODE`.

## Gotchas

- The audio line follows the verification process environment. A normal `npm run dev` without those variables defaults audio to enabled. Do not expect `Audio: Disabled` on that server.
- Close the overlay with `a`. `Enter` or `Space` can activate `SETTINGS` again after dismissing it.
- The overlay says settings are changed in `.env`. Verification does not read or write `.env`.
