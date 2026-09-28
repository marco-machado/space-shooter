---
name: verify-space-shooter
description: "Drive the Space Shooter Phaser game in a browser and prove menu, instructions, settings, and start-game behavior. Use when a change can affect what the player sees, boots, or controls, or when asked to prove the game works."
---

# Verify Space Shooter

Space Shooter is a browser game. The player sees a Phaser canvas inside `#game-container`, not a DOM menu. Canvas labels are Phaser text objects. Read them with the scene expression below. Do not treat a unit test, a Vite HTML response, or a screenshot of the loading screen as proof of a feature.

The human dev command is `npm run dev`. It binds port 5173 and opens a browser (`vite.config.js` `server.open: true`). Verification does not use that command. It starts its own Vite process on `127.0.0.1` at port 5210 or the next free port, with the browser opener disabled, so it does not attach to a game the user already has open.

## Launch

From the repo root:

```bash
node .cursor/skills/verify-space-shooter/scripts/session.mjs start
```

Ready when stdout prints `verify-space-shooter ready` and `url=http://127.0.0.1:<port>/?dev=true`. The script waits until that origin returns the game HTML (`Space Shooter` and `id="game-container"`).

The process environment is set by the script, not by `.env`:

- `NODE_ENV=development`
- `VITE_DEBUG_MODE=true` so `window.spaceShooterGame` exists after boot
- `VITE_LOG_LEVEL=info`
- `VITE_PHYSICS_DEBUG=false`
- `VITE_AUDIO_ENABLED=false`
- `VITE_SHOW_FPS=false`
- `VITE_SHOW_DEBUG_INFO=false`
- `VITE_STARTING_LIVES=3`

`?dev=true` shows the DOM badge `#dev-indicator` (`DEVELOPMENT MODE`). `127.0.0.1` is not `localhost`, so the badge stays hidden without that query.

Teardown is `node .cursor/skills/verify-space-shooter/scripts/session.mjs stop`.

## Doctor

Run this before driving, and again whenever the page looks wrong:

```bash
node .cursor/skills/verify-space-shooter/scripts/session.mjs doctor
```

Stdout is one JSON object with `ok: true`, `url`, `origin`, `pid`, and `port`. Exit code 1 means this instance is not worth driving.

Then open `url` in the Cursor browser, lock the tab, and evaluate `readScene()` (below). A healthy boot has `ready: true`, a canvas, `error: null`, and `scene` of `BootScene`, `PreloaderScene`, or `MainMenuScene`. `#loading-screen` is hidden after the page's own fallback (about five seconds) or when `gameReady` fires. Wait until `document.getElementById('loading-screen').style.display === 'none'` before treating a screenshot as the game.

```javascript
() => {
  const handle = window.spaceShooterGame;
  const game = handle && handle.getGame ? handle.getGame() : null;
  const running = game ? game.scene.scenes.filter(scene => scene.sys.isActive()) : [];
  const active = running[0] || null;
  const texts = active
    ? active.children.list
        .filter(child => child.type === 'Text' && child.visible)
        .map(child => ({
          text: child.text,
          color: child.style && child.style.color,
          alpha: Math.round(child.alpha * 100) / 100,
        }))
    : [];
  const loading = document.getElementById('loading-screen');
  return {
    ready: !!(handle && handle.isGameInitialized() && game),
    scene: active ? active.sys.settings.key : null,
    texts,
    canvas: !!document.querySelector('#game-container canvas'),
    loadingHidden: !loading || loading.style.display === 'none',
    error: document.querySelector('#game-container h3')?.textContent || null,
    errorBody: document.querySelector('#game-container p')?.textContent || null,
    title: document.title,
    devIndicator: document.querySelector('#dev-indicator')?.innerText?.trim() || null,
  };
}
```

Call that function `readScene()`. Poll it until the expected `scene` and text appear. Do not use a fixed sleep as the only check.

## Drive

Use the Cursor browser on the `url` from doctor. Lock the tab first.

- `browser_navigate` to that url
- `browser_lock` with action `lock`
- `browser_press_key` for `Space`, `Enter`, `ArrowUp`, `ArrowDown`, `Escape`, or a single letter
- `browser_cdp` method `Runtime.evaluate` with `readScene()` and `returnByValue: true`
- `browser_snapshot` for the DOM accessibility tree
- `browser_take_screenshot` for the canvas

Phaser text is not in the accessibility tree. The DOM proof is the document title `Space Shooter - Defend the Galaxy`, `#dev-indicator`, and `#game-container canvas`. The canvas proof is `readScene().texts`.

Keys are delivered to the locked tab. If a key does not change `readScene()`, click the canvas inside `#game-container` and press the key again.

Saved games use `localStorage` key `space-shooter-save`. Each verification port is its own origin, so a new session does not see another port's save. Do not drive `http://localhost:5173` or any Vite process this session script did not start.

## Evidence

Write proof under `.cursor/skills/verify-space-shooter/artifacts/<feature-id>/`. Cleanup does not delete that directory.

For each proved step, save:

- the `readScene()` JSON from before the action and after the resulting state
- a screenshot that shows `DEVELOPMENT MODE` and the canvas result
- the feature id and the entry point used (preloader key, menu key, or debug auto-advance)

A final screenshot alone is not proof. Capture the key that was pressed and the scene text that changed. Do not prove a feature by calling scene methods, setting `menuActive`, or dispatching Phaser events from the console.

`VITE_AUDIO_ENABLED=false` only skips starting background music. Confirm the settings screen text says `Audio: Disabled` when that feature is under proof. Do not assume the flag's name.

## Cleanup

```bash
node .cursor/skills/verify-space-shooter/scripts/session.mjs stop
```

That sends `SIGTERM` to the pid in `.cursor/skills/verify-space-shooter/run/session.json`, then `SIGKILL` if it is still alive, and deletes `run/session.json` and `run/vite.log`. It does not delete `artifacts/`. Unlock the browser tab after the last screenshot has been copied into `artifacts/`.

If a drive fails halfway, run stop before starting another server.

## Helpers

`node .cursor/skills/verify-space-shooter/scripts/session.mjs start` launches Vite with `.cursor/skills/verify-space-shooter/scripts/vite.verify.config.js` (`open: false`, host `127.0.0.1`, strict port) and writes `run/session.json`.

`node .cursor/skills/verify-space-shooter/scripts/session.mjs doctor` checks that pid, the command line, and the HTML.

`node .cursor/skills/verify-space-shooter/scripts/session.mjs stop` tears the process down.

There is no browser helper. Drive the canvas with the browser tools and `readScene()`.

## Feature map

Read `.cursor/skills/verify-space-shooter/features/README.md` and the feature file before driving. A proof of one entry point does not cover the others listed there.
