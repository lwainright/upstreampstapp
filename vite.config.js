import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
plugins: [
react(),
VitePWA({
registerType: 'autoUpdate',
includeAssets: ['icons/*.png', 'offline.html'],
manifest: {
name: 'Upstream Peer Support',
short_name: 'Upstream',
description: 'First Responder Peer Support & Wellness',
theme_color: '#060e1b',
background_color: '#060e1b',
display: 'standalone',
orientation: 'portrait',
scope: '/',
start_url: '/',
icons: [
{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
{ src: '/icons/maskable-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
]
},
workbox: {
globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
cleanupOutdatedCaches: true,
skipWaiting: true,
clientsClaim: true,
navigateFallback: null,
}
})
],
build: {
outDir: 'dist',
sourcemap: false,
rollupOptions: {
external: ['fsevents'],
output: {
manualChunks: {
react: ['react', 'react-dom']
}
}
}
}
})

