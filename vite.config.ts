import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(() => {
  const isGithubPages = process.env.GITHUB_PAGES === 'true'
  const base = isGithubPages ? '/netjesflashcards/' : '/'

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'],
        manifest: {
          name: 'Netjes Nederlands',
          short_name: 'Netjes',
          description: 'Learn Dutch with spaced-repetition flashcards',
          theme_color: '#58cc02',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: base,
          icons: [
            { src: `${base}icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
            { src: `${base}icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico}', 'favicon.png', 'icons/*.png'],
          runtimeCaching: [
            {
              urlPattern: /\/media\/.*\.(mp3|png)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'media-cache',
                expiration: { maxEntries: 3000, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
          ],
        },
      }),
    ],
  }
})
