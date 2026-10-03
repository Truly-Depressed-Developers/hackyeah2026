import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { msw } from 'msw/vite'
import { defineConfig, loadEnv } from 'vite'
import { pwa } from './pwa.config.ts'

const rootDir = path.resolve(import.meta.dirname, '../..')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '')

  return {
    envDir: rootDir,
    plugins: [
      // Must come before @vitejs/plugin-react.
      tanstackRouter({ target: 'react', autoCodeSplitting: true }),
      react(),
      tailwindcss(),
      pwa(),
      msw(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/trpc': `http://localhost:${env.API_PORT || 3000}`,
        '/ai': `http://localhost:${env.API_PORT || 3000}`,
      },
    },
  }
})
