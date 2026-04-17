import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,jpg}']
      },
      manifest: {
        name: "KōA",
        short_name: "KōA",
        description: "My personal study tracker for the S4 comeback.",
        start_url: "/",
        display: "standalone",
        
        // --- SPLASH SCREEN & THEME COLORS ---
        // This changes the white splash screen to Dark Slate
        background_color: "#020617", 
        // This changes the browser bar color on mobile
        theme_color: "#0f172a",      
        
        lang: "en",
        scope: "/",
        icons: [
          {
            src: "icon.ico",
            sizes: "192x192",
            type: "image/x-icon",
            purpose: "any"
          },
          {
            src: "icon.ico",
            sizes: "512x512",
            type: "image/x-icon",
            purpose: "any maskable"
          }
        ]
      }
    })
  ]
})