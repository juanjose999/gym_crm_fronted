import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// El proxy reenvía /api/... a la API de Spring Boot (puerto 8080).
// Así el navegador no tiene problemas de CORS durante el desarrollo.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
