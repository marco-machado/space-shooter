import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Vite configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    target: 'es2020',
  },
  define: {
    // Make environment variables available at build time
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },
  // Vitest configuration
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        'src/scenes/', // Don't test Phaser scenes
        'src/graphics/', // Don't test graphics
      ],
    },
  },
});
