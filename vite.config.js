import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'Upstream Approach',
        short_name: 'Upstream',
        description: 'First Responder & Workforce Wellness',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/nyc\.cloud\.appwrite\.io\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'appwrite-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-cache' },
          },
        ],
      },
    }),
  ],
  build: {
    // Increase warning limit -- our app is intentionally large
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries
          'vendor-react': ['react', 'react-dom'],
          'vendor-appwrite': ['appwrite'],
          // Split large screen groups into chunks
          'screens-hospital': [
            './src/HospitalScreen.jsx',
          ],
          'screens-specialty': [
            './src/SchoolStaffScreen.jsx',
            './src/EntertainmentScreen.jsx',
            './src/MentalHealthProfScreen.jsx',
          ],
          'screens-pst': [
            './src/PSTDispatchBoard.jsx',
            './src/PSTPanelScreen.jsx',
            './src/PlatformInlineContent.jsx',
          ],
          'screens-vault': [
            './src/SafetyVaultScreen.jsx',
            './src/MedicalVaultSection.jsx',
            './src/AIMedicalChat.jsx',
          ],
          'screens-population': [
            './src/VeteransScreen.jsx',
            './src/HumanServicesScreen.jsx',
            './src/CivilianWorkforceScreen.jsx',
            './src/RetireesScreen.jsx',
            './src/TelecommunicationsScreen.jsx',
          ],
          'support-layers': [
            './src/SupportLayers.js',
            './src/ContinuumEngine.js',
            './src/AgeExperience.js',
          ],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
