import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxied instead of using CORS: the backend runs inside `committee daemon
// run --web-port`, a separate process/port from this dev server. Set
// COMMITTEE_API_PORT if you started the daemon on something other than the
// default 4317.
const apiPort = process.env.COMMITTEE_API_PORT ?? '4317';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': `http://localhost:${apiPort}`,
      '/ws': { target: `ws://localhost:${apiPort}`, ws: true },
    },
  },
});
