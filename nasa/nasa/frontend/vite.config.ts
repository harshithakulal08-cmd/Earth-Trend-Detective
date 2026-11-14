import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  root: 'zenvyra_site',
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  },
})
