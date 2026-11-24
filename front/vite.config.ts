import { fileURLToPath, URL } from 'node:url';

import { defineConfig, loadEnv, type ProxyOptions } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import vuetify from 'vite-plugin-vuetify';

// The API port comes from the root .env, shared with the API itself.
const { PORT = '3000' } = loadEnv(
  '',
  fileURLToPath(new URL('..', import.meta.url)),
  '',
);

// The front calls /api/...: forwarding it to the API avoids any CORS setup.
const proxy: Record<string, ProxyOptions> = {
  '/api': {
    target: `http://localhost:${PORT}`,
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vuetify(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: { proxy },
  preview: { proxy },
});
