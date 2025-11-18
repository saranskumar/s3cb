import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: "S3 Study Tracker",
        short_name: "S3 Tracker",
        description: "My personal study tracker for the S3 comeback.",
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
            src: "icon.jpg",
            sizes: "any",
            type: "image/jpeg",
            purpose: "any"
          },
          {
            src: "icon.jpg",
            sizes: "any",
            type: "image/jpeg",
            purpose: "maskable"
          }
        ]
      }
    })
  ]
})