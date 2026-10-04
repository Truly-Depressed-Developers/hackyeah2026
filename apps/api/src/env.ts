import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const rootEnvFile = fileURLToPath(new URL('../../../.env', import.meta.url))
if (existsSync(rootEnvFile)) process.loadEnvFile(rootEnvFile)

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env var ${name}. Copy .env.example to .env in the repo root.`)
  return value
}

/** A positive whole number from env, or undefined when unset or empty (= no limit). */
function optionalCount(name: string) {
  const value = Number(process.env[name]?.trim())
  return Number.isInteger(value) && value > 0 ? value : undefined
}

const aiUrl = (process.env.AI_URL ?? '').trim().replace(/\/+$/, '')

export const env = {
  DATABASE_URL: required('DATABASE_URL'),
  PORT: Number(process.env.PORT ?? process.env.API_PORT ?? 3000),
  AI_URL: aiUrl,
  AI_API_KEY: aiUrl ? required('AI_API_KEY').trim() : '',
  // Trimmed: a stray space in .env would silently point at a different (empty) collection.
  AI_COLLECTION: aiUrl ? required('AI_COLLECTION').trim() : '',
  AI_SHOW_AUTHORS: process.env.AI_SHOW_AUTHORS === 'true',
  BETTER_AUTH_SECRET: required('BETTER_AUTH_SECRET'),
  // Public URL the browser uses (Vite in dev, the Render URL in production).
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? 'http://localhost:5173',
  // Kiosk SMS (HAC-21). Without the key the kiosk shows an error instead of sending.
  TEXTBEE_API_KEY: process.env.TEXTBEE_API_KEY?.trim() ?? '',
  TEXTBEE_DEVICE_ID: process.env.TEXTBEE_DEVICE_ID?.trim() ?? '',
  // Optional caps; empty means no limit.
  SMS_LIMIT_PER_IP: optionalCount('SMS_LIMIT_PER_IP'),
  SMS_LIMIT_PER_NUMBER: optionalCount('SMS_LIMIT_PER_NUMBER'),
  SMS_DAILY_LIMIT: optionalCount('SMS_DAILY_LIMIT'),
  // Where links in SMS point: the deployed app, reachable from the resident's phone (not the kiosk's localhost).
  // The same variable as the kiosk QR code, so both send people to one place.
  PUBLIC_URL: (process.env.VITE_PUBLIC_URL?.trim() || 'https://hackyeah2026.onrender.com').replace(/\/+$/, ''),
}
