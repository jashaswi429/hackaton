import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Static, client-only build. No backend, no API keys.
// Output is a plain static bundle deployable to any free static host.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2020',
    sourcemap: false,
  },
});
