import { describe, expect, it } from 'vitest'
import { normalizeQuery } from './normalize.js'

describe('normalizeQuery', () => {
  it('groups Zapytania that differ only in case, Polish diacritics and spacing', () => {
    expect(normalizeQuery('  Samotny   SĄSIAD nie wychodzi z domu ')).toBe('samotny sasiad nie wychodzi z domu')
    expect(normalizeQuery('samotny sasiad nie wychodzi z domu')).toBe('samotny sasiad nie wychodzi z domu')
  })

  it('folds every Polish letter, including ł which has no combining form', () => {
    expect(normalizeQuery('Żółć gęślą jaźń, Łódź')).toBe('zolc gesla jazn, lodz')
  })
})
