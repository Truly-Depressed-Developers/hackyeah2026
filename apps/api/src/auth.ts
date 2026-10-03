import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db/index.js'
import { account, session, user, verification } from './db/schema.js'
import { env } from './env.js'

const TWELVE_HOURS = 60 * 60 * 12

// Login for the Panel administratora. Accounts come from `pnpm db:seed`; public sign-up is off.
export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: 'pg', schema: { user, session, account, verification } }),
  emailAndPassword: { enabled: true, disableSignUp: true },
  session: { expiresIn: TWELVE_HOURS, updateAge: 60 * 60 },
  // Render sits behind a proxy; without the client IP, login rate limiting would share one bucket for everyone.
  advanced: { ipAddress: { ipAddressHeaders: ['x-forwarded-for'] } },
})

export type AuthSession = typeof auth.$Infer.Session
