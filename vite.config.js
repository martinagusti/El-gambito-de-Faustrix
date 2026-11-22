import { defineConfig, loadEnv } from 'vite';
export default defineConfig(({ mode }) => ({
  esbuild: { jsx: 'automatic' },
  server: { host: '127.0.0.1', proxy: { '/api': 'http://127.0.0.1:' + (loadEnv(mode, process.cwd(), '').PORT || 3001) } },
  test: { include: ['tests/**/*.test.js'] },
}));
