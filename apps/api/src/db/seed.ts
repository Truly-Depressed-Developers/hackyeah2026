import { auth } from '../auth.js'
import { seedAnalytics } from './seed-analytics.js'
import { seedNeeds } from './seed-needs.js'

// Creates the predefined Pracownik ROPS account (ADMIN_EMAIL / ADMIN_PASSWORD) and fictional Potrzeby and Pomysły. Safe to re-run.
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
const password = process.env.ADMIN_PASSWORD
if (!email || !password) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before seeding.')

// Public sign-up is disabled, so go through better-auth's internals the same way its sign-up route does.
const ctx = await auth.$context
const existing = await ctx.internalAdapter.findUserByEmail(email)

if (existing) {
  console.log(`Account ${email} already exists, skipping.`)
} else {
  const user = await ctx.internalAdapter.createUser(
    { email, name: 'Pracownik ROPS', emailVerified: true },
    { method: 'email-password' },
  )
  await ctx.internalAdapter.linkAccount({
    userId: user.id,
    providerId: 'credential',
    accountId: user.id,
    password: await ctx.password.hash(password),
  })
  console.log(`Created account ${email}.`)
}

await seedNeeds()
await seedAnalytics()

process.exit(0)
