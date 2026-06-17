import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/battleship_net/',
  plugins: [react()],
  // Dev-only: mirrors nginx, forwards /battleship_api -> backend (strips the prefix).
  // Ignored by `vite build` (production uses nginx.conf).
  server: {
    proxy: {
      '/battleship_api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/battleship_api/, ''),
      },
    },
  },
})
