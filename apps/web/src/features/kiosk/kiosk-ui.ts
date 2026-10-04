/**
 * Klasy współdzielone przez ekrany kiosku - ten sam idiom co `TILE`
 * w `components/innovation/innovation-tile.tsx`.
 *
 * Rozmiary są w pikselach, bo design kiosku jest zaprojektowany pod konkretny
 * ekran dotykowy: 60–80 px to fizyczna wielkość palca, a nie skalowalna typografia.
 * Skaluje się tylko treść, przez `--hub-skala` (klasy `.hub-tekst-*`).
 */

/**
 * Offset 3 px jest nośny, nie kosmetyczny: #0f1b2d na primary #2263ad daje ~2,3:1,
 * czyli poniżej 3:1 wymaganych dla elementów nietekstowych. Przerwa kładzie pierścień
 * na jasnym tle (~16:1).
 */
export const FOCUS = 'focus-visible:outline-3 focus-visible:outline-offset-[3px] focus-visible:outline-[#0f1b2d]'

const BASE = `hub-dotyk inline-flex shrink-0 items-center justify-center gap-3 rounded-full font-semibold ${FOCUS}`

/** Główne wezwanie do działania - „Szukaj rozwiązania", „Spróbuj ponownie". */
export const CTA = `${BASE} h-[72px] bg-primary px-10 text-[26px] text-primary-foreground`

/** Akcja drugorzędna z obwódką - „Wróć i opisz inaczej", „Zatrzymaj". */
export const CTA_OUTLINE = `${BASE} h-16 border-2 border-[#cfd7e3] bg-white px-8 text-[22px] text-foreground`

/** Akcja cicha na szarym tle - „Opisz inaczej", „Wróć do opisu". */
export const CTA_MUTED = `${BASE} h-16 bg-muted px-8 text-[22px] text-foreground`

/** Pigułka w pasku nagłówka i przy powrocie. */
export const PILL = `${BASE} h-15 border-2 border-foreground bg-white px-6 text-[22px] text-foreground`

/** Duży kafelek wyboru - „Napisz" / „Powiedz", sposób odbioru. */
export const TILE = `hub-dotyk flex flex-col items-center gap-3 rounded-3xl border border-border bg-[#f8fafd] p-6 text-center ${FOCUS}`

/** Karta wyniku; cała karta jest jednym przyciskiem, bez zagnieżdżonych akcji. */
export const CARD = `hub-dotyk flex w-full flex-col gap-3 rounded-[28px] border border-border bg-card p-6 text-left ${FOCUS}`

/** Pole tekstowe i input - 2 px obwódki, żeby było widać je z odległości ręki. */
export const FIELD = `w-full rounded-[20px] border-2 border-input bg-white px-6 text-foreground outline-none focus-visible:border-primary ${FOCUS}`
