import { describe, expect, it } from 'vitest'
import { maskPii } from './mask.js'

describe('maskPii', () => {
  it('replaces an e-mail address', () => {
    expect(maskPii('napiszcie na jan.kowalski@poczta.pl w sprawie mamy')).toBe('napiszcie na [email] w sprawie mamy')
  })

  it.each([
    ['zadzwońcie 600 123 456 po 16', 'zadzwońcie [telefon] po 16'],
    ['tel. 600-123-456', 'tel. [telefon]'],
    ['mój numer +48 600123456', 'mój numer [telefon]'],
    ['stacjonarny 12 345 67 89', 'stacjonarny [telefon]'],
  ])('replaces a phone number in %j', (input, masked) => {
    expect(maskPii(input)).toBe(masked)
  })

  it('replaces a PESEL', () => {
    expect(maskPii('pesel taty 44051401359 a on ma demencję')).toBe('pesel taty [pesel] a on ma demencję')
  })

  it.each([
    ['mieszkam na ul. Długiej 12/4 i nie mam windy', 'mieszkam na [adres] i nie mam windy'],
    ['os. Złotego Wieku 3a, Kraków', '[adres], Kraków'],
    ['al. Pokoju 7 m. 15 sąsiad pije', '[adres] sąsiad pije'],
  ])('replaces a street address in %j', (input, masked) => {
    expect(maskPii(input)).toBe(masked)
  })

  it('keeps everyday numbers that are not personal data', () => {
    const query = 'samotny sąsiad 80+ od 2019 roku, dzwonię o 16:30, kod 30-001'
    expect(maskPii(query)).toBe(query)
  })
})
