import { VitePWA } from 'vite-plugin-pwa'

export const pwa = () =>
  VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'kiosk.webmanifest'],
    manifest: {
      name: 'Pomost – pomoc w Małopolsce',
      short_name: 'Pomost',
      description: 'Opisz problem i znajdź innowacje społeczne, które mogą pomóc. Projekt z ROPS w Krakowie.',
      theme_color: '#1E4B7A',
      icons: [
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    workbox: {
      // /kiosk must come from the server, which swaps in kiosk.webmanifest.
      navigateFallbackDenylist: [/^\/trpc/, /^\/ai/, /^\/kiosk/],
    },
  })
