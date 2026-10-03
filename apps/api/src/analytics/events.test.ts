import { describe, expect, it } from 'vitest'
import { clampTime, parseBatch } from './events.js'

const visitId = '7d0f8a52-3c1e-4c55-9a51-4f3a2b1c0d9e'
const searchId = '0b6c1a1e-5a0e-4c7b-8a5f-2d1f0e9c8b7a'
const at = '2026-10-03T10:00:00.000Z'

describe('parseBatch', () => {
  it('accepts a Wyszukiwanie with its shown Wyniki and an Użycie Akcji', () => {
    const batch = parseBatch({
      visitId,
      events: [
        { type: 'visit_started', at, mode: 'kiosk', entry: 'search', screen: 'tablet' },
        { type: 'search_submitted', at, searchId, query: 'samotny sąsiad', inputMode: 'voice' },
        {
          type: 'results_shown',
          at,
          searchId,
          latencyMs: 1830,
          noMatch: false,
          results: [{ id: 'dla-seniorow__bawita', title: 'BaWita', tier: 'related', position: 1, category: 'Innowacje dla seniorów' }],
        },
        { type: 'action_used', at, searchId, innovationId: 'dla-seniorow__bawita', action: 'video', position: 1 },
      ],
    })
    expect(batch.success).toBe(true)
    expect(batch.data?.events.map((event) => event.type)).toEqual(['visit_started', 'search_submitted', 'results_shown', 'action_used'])
  })

  it('rejects an unknown event type', () => {
    expect(parseBatch({ visitId, events: [{ type: 'mouse_moved', at }] }).success).toBe(false)
  })

  it('rejects a search_submitted without its searchId', () => {
    expect(parseBatch({ visitId, events: [{ type: 'search_submitted', at, query: 'opał', inputMode: 'text' }] }).success).toBe(false)
  })

  it('rejects an Akcja that is not in the catalog', () => {
    const event = { type: 'action_used', at, innovationId: 'x', action: 'share' }
    expect(parseBatch({ visitId, events: [event] }).success).toBe(false)
  })

  it('caps a batch at 50 events', () => {
    const heartbeat = { type: 'visit_heartbeat', at }
    expect(parseBatch({ visitId, events: Array(50).fill(heartbeat) }).success).toBe(true)
    expect(parseBatch({ visitId, events: Array(51).fill(heartbeat) }).success).toBe(false)
  })

  it('rejects a batch whose Wizyta id is not a UUID', () => {
    expect(parseBatch({ visitId: 'user-42', events: [{ type: 'visit_heartbeat', at }] }).success).toBe(false)
  })
})

describe('clampTime', () => {
  const now = new Date('2026-10-03T12:00:00.000Z')

  it('keeps a client time within five minutes of the server', () => {
    expect(clampTime('2026-10-03T11:57:00.000Z', now).toISOString()).toBe('2026-10-03T11:57:00.000Z')
  })

  it('pulls a skewed client clock back to the five-minute edge', () => {
    expect(clampTime('2026-10-03T13:00:00.000Z', now).toISOString()).toBe('2026-10-03T12:05:00.000Z')
    expect(clampTime('2025-01-01T00:00:00.000Z', now).toISOString()).toBe('2026-10-03T11:55:00.000Z')
  })
})
