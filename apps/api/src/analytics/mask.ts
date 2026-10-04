const EMAIL = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+/gu
const PESEL = /(?<!\d)\d{11}(?!\d)/g
// "ul. Długa 12/4", "os. Złotego Wieku 3a", "al. Pokoju 7 m. 15": a street word, up to three name words, a house number.
const ADDRESS = /(?<!\p{L})(?:ul|al|os|pl)\.?\s+(?:[\p{L}.-]+\s+){0,3}?\d+\p{L}?(?:\s*\/\s*\d+\p{L}?)?(?:\s+m\.?\s*\d+)?/giu
// Nine digits, optionally after +48, with spaces or dashes anywhere between them.
const PHONE = /(?:\+48[\s-]?)?(?<!\d)(?:\d[\s-]?){8}\d(?!\d)/g

/** Replaces personal data a Mieszkaniec may type into a Zapytanie before it is stored. */
export function maskPii(text: string): string {
  return text.replace(EMAIL, '[email]').replace(PESEL, '[pesel]').replace(PHONE, '[telefon]').replace(ADDRESS, '[adres]')
}
