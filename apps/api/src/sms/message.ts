// The SMS a Mieszkaniec gets from the kiosk (Odbiór wyniku). One SMS part, never more: 160 GSM-7 characters.

export const SMS_MAX_CHARS = 160

const POLISH: Record<string, string> = { ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z', Ą: 'A', Ć: 'C', Ę: 'E', Ł: 'L', Ń: 'N', Ó: 'O', Ś: 'S', Ź: 'Z', Ż: 'Z' }
const TYPOGRAPHY: Record<string, string> = { '„': '"', '”': '"', '“': '"', '‘': "'", '’': "'", '–': '-', '—': '-', '…': '...', ' ': ' ' }

// Plain characters that take one GSM-7 slot. Anything else would switch the SMS to UCS-2 (70 characters)
// or cost two slots (^{}[]~|€\), so it is dropped.
const GSM_SAFE = /[A-Za-z0-9 @$_!"#%&'()*+,\-./:;<=>?\n]/

/** Polish letters to ASCII, typographic quotes and dashes to plain ones, everything else outside GSM-7 dropped. */
export function toGsm(text: string) {
  const plain = [...text]
    .map((ch) => POLISH[ch] ?? TYPOGRAPHY[ch] ?? ch)
    .join('')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
  return [...plain]
    .filter((ch) => GSM_SAFE.test(ch))
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * `HubMI: {title}. Szczegoly: {url}`, cut to one SMS. The title gives way first; if even the link does not fit,
 * the whole text is cut at the limit, because a second part is never acceptable.
 */
export function resultSmsText(title: string, url: string) {
  const prefix = 'HubMI: '
  const suffix = `. Szczegoly: ${toGsm(url)}`
  const room = SMS_MAX_CHARS - prefix.length - suffix.length
  const cleanTitle = toGsm(title).replace(/\.+$/, '')
  const shortTitle = cleanTitle.length <= room ? cleanTitle : `${cleanTitle.slice(0, Math.max(0, room - 3)).trimEnd()}...`
  return `${prefix}${shortTitle}${suffix}`.slice(0, SMS_MAX_CHARS)
}

/** A Polish number as +48 and 9 digits, or null. Same rule as the kiosk form: spaces, dashes and an optional +48 / 48. */
export function normalizePolishPhone(value: string) {
  const digits = value.replace(/[\s-]/g, '').replace(/^\+?48(?=\d{9}$)/, '')
  return /^\d{9}$/.test(digits) ? `+48${digits}` : null
}
