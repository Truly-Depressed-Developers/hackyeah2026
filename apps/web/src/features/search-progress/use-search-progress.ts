import { useEffect, useState } from 'react'

/**
 * Wyszukiwanie semantyczne potrafi trwać kilka sekund i bez słowa wyjaśnienia wygląda
 * jak zawieszenie. Zamiast jednego „Szukam…" mówimy, co się właściwie dzieje — te same
 * dwa kroki w kiosku i w wersji web, żeby mieszkaniec dostał tę samą obietnicę.
 */
export const SEARCH_PHASES = [
  'Analizuję Twoją historię…',
  'Przeszukuję bazę sprawdzonych innowacji społecznych…',
] as const

/**
 * Krócej niż typowa odpowiedź wyszukiwania (ok. 1,5–3 s), inaczej drugi komunikat
 * nigdy by się nie pokazał i cała narracja sprowadzałaby się do jednego zdania.
 */
const PHASE_MS = 1100

/**
 * Kolejny komunikat co `PHASE_MS`, zatrzymany na ostatnim — to narracja, a nie pasek
 * postępu, więc nie udajemy, że znamy procent ukończenia.
 *
 * Bez przełącznika „aktywne": hook żyje tylko wtedy, gdy żyje komponent szukania,
 * więc odmontowanie samo cofa narrację do pierwszego kroku.
 */
export function useSearchProgress() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => Math.min(i + 1, SEARCH_PHASES.length - 1)), PHASE_MS)
    return () => clearInterval(timer)
  }, [])

  return SEARCH_PHASES[index]!
}
