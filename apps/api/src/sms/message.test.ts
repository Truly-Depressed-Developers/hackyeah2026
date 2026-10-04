import { describe, expect, it } from 'vitest'
import { SMS_MAX_CHARS, normalizePolishPhone, resultSmsText, toGsm } from './message.js'

const URL = 'https://hackyeah2026.onrender.com/innowacja/dla-seniorow__mobilne-centrum-pomocy-dla-osob-starszych'

describe('toGsm', () => {
  it('replaces Polish letters and typographic marks', () => {
    expect(toGsm('Zażółć gęślą jaźń „cytat” – koniec…')).toBe('Zazolc gesla jazn "cytat" - koniec...')
  })

  it('drops characters that would cost two slots or switch to UCS-2', () => {
    expect(toGsm('A{b}[c]~|€\\^ 😀 é')).toBe('Abc e')
  })
})

describe('resultSmsText', () => {
  it('keeps a short title whole', () => {
    expect(resultSmsText('Obu – obuwie po domu', 'https://x.pl/i/1')).toBe('HubMI: Obu - obuwie po domu. Szczegoly: https://x.pl/i/1')
  })

  it('never exceeds one SMS, cutting the title first', () => {
    const text = resultSmsText('Mobilne centrum pomocy dla osób starszych '.repeat(5), URL)
    expect(text.length).toBeLessThanOrEqual(SMS_MAX_CHARS)
    expect(text).toContain('...')
    expect(text.endsWith(URL)).toBe(true)
  })

  it('cuts at the limit even when the link alone is too long', () => {
    const text = resultSmsText('Tytul', `https://x.pl/${'a'.repeat(300)}`)
    expect(text.length).toBe(SMS_MAX_CHARS)
  })

  it('uses only GSM-7 safe characters', () => {
    expect(resultSmsText('Pomoc „dla” seniorów — ŁÓDŹ', URL)).toMatch(/^[\x20-\x7e]+$/)
  })
})

describe('normalizePolishPhone', () => {
  it.each([
    ['600 123 456', '+48600123456'],
    ['600-123-456', '+48600123456'],
    ['+48 600123456', '+48600123456'],
    ['48600123456', '+48600123456'],
  ])('%s → %s', (input, expected) => expect(normalizePolishPhone(input)).toBe(expected))

  it.each(['60012345', '6001234567', '+44600123456', 'abc', ''])('rejects %s', (input) => expect(normalizePolishPhone(input)).toBeNull())
})
