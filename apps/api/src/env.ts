import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const rootEnvFile = fileURLToPath(new URL('../../../.env', import.meta.url))
if (existsSync(rootEnvFile)) process.loadEnvFile(rootEnvFile)

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env var ${name}. Copy .env.example to .env in the repo root.`)
  return value
}

const decideMode = process.env.DECIDE_MODE ?? 'mock'
if (decideMode !== 'mock' && decideMode !== 'http') {
  throw new Error(`DECIDE_MODE must be "mock" or "http", got "${decideMode}".`)
}

export const env = {
  DATABASE_URL: required('DATABASE_URL'),
  PORT: Number(process.env.PORT ?? process.env.API_PORT ?? 3000),
  DECIDE_MODE: decideMode,
  DECIDE_URL: process.env.DECIDE_URL ?? 'http://localhost:8000',
  BETTER_AUTH_SECRET: required('BETTER_AUTH_SECRET'),
  // Public URL the browser uses (Vite in dev, the Render URL in production).
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? 'http://localhost:5173',
}
