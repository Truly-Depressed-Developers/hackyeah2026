import { createHash } from 'node:crypto'
import { createRateLimiter } from '../analytics/rate-limit.js'
import { env } from '../env.js'

// Optional caps on the public SMS endpoint, all off unless set in env (HAC-21). Counts live in memory like the
// other limiters: one API instance, and a restart forgets them.

const TEN_MINUTES = 10 * 60_000
const DAY = 24 * 60 * 60_000

const limiter = (limit: number | undefined, windowMs: number) => (limit ? createRateLimiter({ limit, windowMs }) : () => true)

const perIp = limiter(env.SMS_LIMIT_PER_IP, TEN_MINUTES)
const perNumber = limiter(env.SMS_LIMIT_PER_NUMBER, TEN_MINUTES)
const daily = limiter(env.SMS_DAILY_LIMIT, DAY)

// The limiter keys by number, so keep only a hash in memory: the number itself is never stored.
const numberKey = (phone: string) => createHash('sha256').update(phone).digest('hex')

/** True if this SMS may go out; counts it against every enabled limit. */
export function allowSms(ip: string, phone: string) {
  return perIp(ip) && perNumber(numberKey(phone)) && daily('all')
}
