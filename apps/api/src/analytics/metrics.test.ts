import { describe, expect, it } from 'vitest'
import { deltaPct, fillDays, rangeFor, searchOutcome, share } from './metrics.js'

describe('searchOutcome', () => {
  it('counts a Wyszukiwanie that ended in a Potrzeba as unmet, even if an Akcja was used', () => {
    expect(searchOutcome({ noMatch: false, actions: 2, needs: 1 })).toBe('need')
  })

  it('counts Brak odpowiedzi without a Potrzeba as no_match', () => {
    expect(searchOutcome({ noMatch: true, actions: 0, needs: 0 })).toBe('no_match')
  })

  it('counts a Wyszukiwanie with an Użycie Akcji and no Potrzeba as helpful', () => {
    expect(searchOutcome({ noMatch: false, actions: 1, needs: 0 })).toBe('helpful')
  })

  it('counts shown Wyniki that nobody used as no_action', () => {
    expect(searchOutcome({ noMatch: false, actions: 0, needs: 0 })).toBe('no_action')
  })

  it('counts a Wyszukiwanie whose Wyniki never arrived as no_action', () => {
    expect(searchOutcome({ noMatch: null, actions: 0, needs: 0 })).toBe('no_action')
  })
})

describe('deltaPct', () => {
  it('gives the change against the previous period in percent', () => {
    expect(deltaPct(120, 100)).toBe(20)
    expect(deltaPct(75, 100)).toBe(-25)
  })

  it('has no delta when the previous period was empty', () => {
    expect(deltaPct(10, 0)).toBeNull()
  })
})

describe('share', () => {
  it('is a percentage with one decimal, 0 for an empty total', () => {
    expect(share(1, 3)).toBe(33.3)
    expect(share(0, 0)).toBe(0)
  })
})

describe('rangeFor', () => {
  it('covers the last n days including today, and the n days before as the previous period', () => {
    const range = rangeFor(7, new Date('2026-10-03T21:30:00.000Z'))
    expect(range).toEqual({
      from: '2026-09-27',
      to: '2026-10-03',
      previousFrom: '2026-09-20',
      previousTo: '2026-09-26',
    })
  })

  it('uses the Polish calendar day, not UTC', () => {
    expect(rangeFor(1, new Date('2026-10-03T22:30:00.000Z')).to).toBe('2026-10-04')
  })
})

describe('fillDays', () => {
  it('returns every day of the range, with zeros where nothing happened', () => {
    const rows = [{ day: '2026-10-02', searches: 4 }]
    expect(fillDays('2026-10-01', '2026-10-03', rows, { searches: 0 })).toEqual([
      { day: '2026-10-01', searches: 0 },
      { day: '2026-10-02', searches: 4 },
      { day: '2026-10-03', searches: 0 },
    ])
  })
})
