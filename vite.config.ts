import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Configuracao do Vite + PWA.
// O vite-plugin-pwa gera o service worker (offline) e o manifest de instalacao.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Meu Inglês, Repetição Espaçada',
        short_name: 'Meu Inglês',
        description: 'Estudo diário de vocabulário de inglês com repetição espaçada.',
        lang: 'pt-BR',
        dir: 'ltr',
        theme_color: '#2563eb',
        background_color: '#0b1020',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true
      },
      devOptions: {
        // deixa o PWA ativo tambem em desenvolvimento (npm run dev)
        enabled: true
      }
    })
  ]
})
