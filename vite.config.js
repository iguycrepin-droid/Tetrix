import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  resolve: {
    alias: {
      // Native-only plugin that is not published to npm — resolve it to a web
      // stub so the dev server/browser can load it. On device (Capacitor build)
      // it is provided by the platform and marked external below.
      '@capacitor-community/in-app-purchases': fileURLToPath(
        new URL('./src/lib/iap-web-stub.js', import.meta.url)
      ),
    },
  },
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
