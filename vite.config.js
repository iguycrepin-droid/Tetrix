import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const capacitorBuild = process.env.CAPACITOR === '1'

export default defineConfig({
  plugins: [
    react(),
    !capacitorBuild && VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icon.svg'],
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,ico,webmanifest}'],
        navigateFallback: '/index.html',
      },
      devOptions: { enabled: false },
    }),
  ].filter(Boolean),
  server: { port: 5173 },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
