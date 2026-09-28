#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { mkdir, open, readFile, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillDir = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(skillDir, '../../..');
const runDir = path.join(skillDir, 'run');
const statePath = path.join(runDir, 'session.json');
const logPath = path.join(runDir, 'vite.log');
const configPath = path.join(scriptDir, 'vite.verify.config.js');
const viteBin = path.join(repoRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const portStart = 5210;

const verifyEnv = {
  NODE_ENV: 'development',
  VITE_DEBUG_MODE: 'true',
  VITE_LOG_LEVEL: 'info',
  VITE_PHYSICS_DEBUG: 'false',
  VITE_AUDIO_ENABLED: 'false',
  VITE_SHOW_FPS: 'false',
  VITE_SHOW_DEBUG_INFO: 'false',
  VITE_STARTING_LIVES: '3',
};

function usage() {
  console.error('Usage: node .cursor/skills/verify-space-shooter/scripts/session.mjs <start|doctor|stop>');
  process.exit(2);
}

async function readState() {
  try {
    return JSON.parse(await readFile(statePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

function pidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function findPort(start) {
  for (let port = start; port < start + 20; port += 1) {
    const free = await new Promise(resolve => {
      const server = net.createServer();
      server.once('error', () => resolve(false));
      server.once('listening', () => {
        server.close(() => resolve(true));
      });
      server.listen(port, '127.0.0.1');
    });
    if (free) return port;
  }
  throw new Error(`No free port from ${start} to ${start + 19}`);
}

async function waitForPage(origin) {
  const deadline = Date.now() + 20000;
  let lastError = 'no response';
  while (Date.now() < deadline) {
    try {
      const response = await fetch(origin);
      const body = await response.text();
      if (response.ok && body.includes('Space Shooter') && body.includes('id="game-container"')) {
        return;
      }
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error.message;
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error(`Vite did not serve the game: ${lastError}`);
}

async function start() {
  const existing = await readState();
  if (existing && pidAlive(existing.pid)) {
    console.error(
      `A verification server is already running (pid ${existing.pid}, ${existing.url}). Run stop before start.`
    );
    process.exit(1);
  }

  await mkdir(runDir, { recursive: true });
  const port = await findPort(portStart);
  const origin = `http://127.0.0.1:${port}`;
  const url = `${origin}/?dev=true`;
  const logHandle = await open(logPath, 'w');
  const child = spawn(process.execPath, [viteBin, '--config', configPath, '--port', String(port)], {
    cwd: repoRoot,
    env: { ...process.env, ...verifyEnv },
    detached: true,
    stdio: ['ignore', logHandle.fd, logHandle.fd],
  });
  child.unref();
  await logHandle.close();

  const state = {
    pid: child.pid,
    port,
    origin,
    url,
    startedAt: new Date().toISOString(),
  };
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);

  try {
    await waitForPage(origin);
  } catch (error) {
    if (pidAlive(child.pid)) process.kill(child.pid, 'SIGTERM');
    await rm(statePath, { force: true });
    throw error;
  }

  console.log(`verify-space-shooter ready`);
  console.log(`url=${url}`);
  console.log(`pid=${child.pid}`);
  console.log(`port=${port}`);
}

async function doctor() {
  const state = await readState();
  if (!state) {
    console.error('No verification session. Run start first.');
    process.exit(1);
  }
  if (!pidAlive(state.pid)) {
    console.error(`Verification pid ${state.pid} is not running.`);
    process.exit(1);
  }

  const { execFileSync } = await import('node:child_process');
  let command = '';
  try {
    command = execFileSync('ps', ['-p', String(state.pid), '-o', 'command='], {
      encoding: 'utf8',
    }).trim();
  } catch {
    command = '';
  }
  if (!command.includes('vite.verify.config.js')) {
    console.error(`Pid ${state.pid} is not the verification Vite process: ${command}`);
    process.exit(1);
  }

  const response = await fetch(state.origin);
  const body = await response.text();
  if (!response.ok || !body.includes('id="game-container"') || !body.includes('Space Shooter')) {
    console.error(`Origin ${state.origin} did not serve the game page (HTTP ${response.status}).`);
    process.exit(1);
  }

  console.log(
    JSON.stringify({
      ok: true,
      url: state.url,
      origin: state.origin,
      pid: state.pid,
      port: state.port,
    })
  );
}

async function stop() {
  const state = await readState();
  if (!state) {
    console.log('no session');
    return;
  }
  if (pidAlive(state.pid)) {
    process.kill(state.pid, 'SIGTERM');
    const deadline = Date.now() + 3000;
    while (pidAlive(state.pid) && Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (pidAlive(state.pid)) process.kill(state.pid, 'SIGKILL');
  }
  await rm(statePath, { force: true });
  await rm(logPath, { force: true });
  console.log(`stopped pid=${state.pid}`);
}

const command = process.argv[2];
try {
  if (command === 'start') await start();
  else if (command === 'doctor') await doctor();
  else if (command === 'stop') await stop();
  else usage();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
