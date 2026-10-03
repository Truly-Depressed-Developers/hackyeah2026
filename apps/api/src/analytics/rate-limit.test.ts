import { describe, expect, it } from 'vitest'
import { clientIp, createRateLimiter } from './rate-limit.js'

describe('createRateLimiter', () => {
  it('refuses the request over the limit and allows again once the window has passed', () => {
    const allow = createRateLimiter({ limit: 2, windowMs: 60_000 })
    expect(allow('1.2.3.4', 0)).toBe(true)
    expect(allow('1.2.3.4', 1_000)).toBe(true)
    expect(allow('1.2.3.4', 2_000)).toBe(false)
    expect(allow('5.6.7.8', 2_000)).toBe(true)
    expect(allow('1.2.3.4', 60_500)).toBe(true)
  })
})

describe('clientIp', () => {
  it('takes the first address of x-forwarded-for', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))).toBe('203.0.113.7')
    expect(clientIp(new Headers())).toBe('unknown')
  })
})
