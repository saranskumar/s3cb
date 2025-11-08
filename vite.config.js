import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // This will create the manifest.json file for you
      manifest: {
        name: 'S3 Comeback Tracker',
        short_name: 'S3 Tracker',
        description: 'My personal study tracker for the S3 comeback.',
        theme_color: '#16a34a', // Green
        background_color: '#f9fafb', // Light Gray
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          // --- UPDATED ---
          // Pointing to the icon.jpg you provided.
          // Make sure you've saved it as 'icon.jpg' in your /public folder.
          {
            src: 'icon.jpg',
            sizes: 'any',
            type: 'image/jpeg',
            purpose: 'any'
          },
          {
            src: 'icon.jpg',
            sizes: 'any',
            type: 'image/jpeg',
            purpose: 'maskable'
          }
        ]
      }
    })
  ]
})