import { existsSync } from 'node:fs'
import { defineConfig } from 'drizzle-kit'

if (existsSync('../../.env')) process.loadEnvFile('../../.env')

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  // drizzle-kit 1.0 manages every schema by default and would drop Neon's own `auth` schema.
  schemaFilter: ['public'],
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
