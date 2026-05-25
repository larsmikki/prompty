import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  publicDir: 'public',
  server: {
    port: 3060,
    proxy: {
      '/api': 'http://localhost:3061',
      // Uploaded images are served by the API server, not by Vite. Without
      // this proxy, prompt images return 404 in dev.
      '/images': 'http://localhost:3061',
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
