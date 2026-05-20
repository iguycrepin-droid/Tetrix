import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      // Capacitor plugins only exist on device — mark as external for web build
      external: [
        '@capacitor-community/admob',
        '@capacitor-community/in-app-purchases',
        '@capacitor/core',
      ]
    }
  }
})
