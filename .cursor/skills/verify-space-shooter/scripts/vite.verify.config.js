import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeConfig } from 'vite';
import base from '../../../../vite.config.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

export default mergeConfig(base, {
  root: repoRoot,
  server: {
    open: false,
    host: '127.0.0.1',
    strictPort: true,
  },
});
