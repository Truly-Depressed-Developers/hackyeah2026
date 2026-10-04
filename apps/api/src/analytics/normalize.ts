/** Groups Zapytania that differ only in case, Polish diacritics or spacing. */
export function normalizeQuery(text: string): string {
  return text
    .toLowerCase()
    .replaceAll('ł', 'l')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}
