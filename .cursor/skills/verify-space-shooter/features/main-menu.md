# Main menu

The main menu is the screen titled `SPACE SHOOTER` with `Defend the Galaxy`, a selected `START GAME` entry, and the labels `INSTRUCTIONS` and `SETTINGS`.

## Sub-features

- `menu-reach` shows the menu after the preloader prompt.
- `menu-select-start` shows `START GAME` in green when the menu first finishes its entrance.
- `menu-move` moves the green selection with the arrow keys and wraps at both ends.

## How to get to it (user POV)

- Wait on the preloader until it says `PRESS ANY KEY TO START`, then press any key.
- With this session's debug mode, wait about two seconds on that same prompt and the game advances by itself.

## Driving it with verify-space-shooter

Preconditions:

- `doctor` reports the verification url.
- The browser tab is locked on that url.
- `readScene()` reports `ready: true`, `error: null`, and `loadingHidden: true`.

- **Preloader prompt.** Poll `readScene()` until `scene` is `PreloaderScene` and some `text` is `PRESS ANY KEY TO START`. The canvas title is `SPACE SHOOTER`.
- **Key entry.** Press `Space` once. Run `browser_press_key` with key `Space`. Poll until `scene` is `MainMenuScene`, `texts` includes `START GAME`, `INSTRUCTIONS`, and `SETTINGS`, and `START GAME` has `alpha` 1.
- **Initial selection.** Read the `START GAME` entry. Its `color` is `#00ff00`. `INSTRUCTIONS` and `SETTINGS` are `#ffffff`.
- **Move down.** Press `ArrowDown`. Run `browser_press_key` with key `ArrowDown`. `INSTRUCTIONS` is `#00ff00` and `START GAME` is `#ffffff`.
- **Wrap upward.** Press `ArrowUp` three times. Run `browser_press_key` with key `ArrowUp` three times. The green label is `SETTINGS`, then `INSTRUCTIONS`, then `START GAME`.
- **Proof.** Save `readScene()` to `artifacts/main-menu/menu.json` and a screenshot to `artifacts/main-menu/menu.png`. Both show `SPACE SHOOTER`, `START GAME` in green, and the `DEVELOPMENT MODE` badge.

## Gotchas

- `VITE_DEBUG_MODE=true` also leaves the preloader after about two seconds. If that happens before the key, record the entry point as debug auto-advance. Do not press `Space` again on the menu or it activates `START GAME`.
- Menu labels stay at `alpha` 0 during the entrance. Wait until `START GAME` has `alpha` 1 before asserting color.
- The HTML loading screen covers the canvas until `#loading-screen` is `display: none`. Scene text can already be correct while the screenshot still shows the loader.
- Arrow keys do not change the DOM accessibility tree. Assert `readScene().texts`.
