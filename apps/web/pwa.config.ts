import { VitePWA } from 'vite-plugin-pwa'

export const pwa = () =>
  VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
    manifest: {
      name: 'Hackathon App',
      short_name: 'Hackathon',
      description: 'Hackathon decision app',
      theme_color: '#171717',
      icons: [
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    workbox: {
      navigateFallbackDenylist: [/^\/trpc/, /^\/ai/],
    },
  })
