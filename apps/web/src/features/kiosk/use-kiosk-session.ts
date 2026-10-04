import { useReducer } from 'react'

export type KioskMode = 'napisz' | 'powiedz'

/**
 * `GET /catalog/{id}` zwraca `Innovation`, które nie ma `why` ani `whyGenerated` —
 * uzasadnienie dopasowania żyje tylko na `Result`. Dlatego jedzie razem z kliknięciem
 * w kartę, zamiast być dociągane na ekranie szczegółu.
 *
 * `why` jest opcjonalne, bo do szczegółu można też wejść z katalogu na ekranie
 * startowym — tam nie ma żadnego zapytania, więc nie ma czego uzasadniać.
 */
export type CarriedResult = { id: string; title: string; why?: string; whyGenerated?: boolean }

/**
 * To, do czego mieszkaniec się zobowiązał. Ekrany `results` / `noResult` / `error` /
 * `loading` są POCHODNE od zapytania React Query, nie dispatchowane — inaczej refetch
 * mógłby się udać, a maszyna zostałaby na `error`.
 */
export type KioskStage =
  | { name: 'entry' }
  | { name: 'search'; query: string }
  /** `query` puste = weszliśmy z katalogu, więc powrót prowadzi na ekran startowy. */
  | { name: 'detail'; query?: string; result: CarriedResult }

export interface KioskSession {
  stage: KioskStage
  /** null dopóki mieszkaniec nie wybierze kafelka — to steruje kafelki-vs-przełącznik. */
  mode: KioskMode | null
  /** Przeżywa entry → wyniki → entry, żeby „Wróć i opisz inaczej" wracało wypełnione. */
  draft: string
  /** Mnożnik treści zapisywany na powłoce jako `--hub-skala`. */
  skala: number
}

export const SKALE = [1, 1.25, 1.5] as const

export type KioskAction =
  | { type: 'chooseMode'; mode: KioskMode }
  | { type: 'setDraft'; text: string }
  | { type: 'submit'; query: string }
  | { type: 'openDetail'; result: CarriedResult }
  | { type: 'back' }
  | { type: 'setSkala'; skala: number }
  | { type: 'end' }

const INITIAL: KioskSession = { stage: { name: 'entry' }, mode: null, draft: '', skala: 1 }

/**
 * Czy po mieszkańcu został jakikolwiek ślad do wyczyszczenia. Steruje dostępnością
 * „Zakończ": na świeżym ekranie startowym ten przycisk nie miałby co zrobić.
 *
 * Porównujemy z całym stanem wyjściowym, a nie z listą wybranych pól — dzięki temu
 * nowe pole w sesji samo wejdzie do warunku, zamiast cicho go ominąć. Powiększony
 * tekst też liczy się jako ślad: następna osoba ma zacząć od ustawień domyślnych.
 */
export function hasSomethingToClear(session: KioskSession) {
  return (
    session.stage.name !== INITIAL.stage.name ||
    session.mode !== INITIAL.mode ||
    session.draft !== INITIAL.draft ||
    session.skala !== INITIAL.skala
  )
}

function reducer(state: KioskSession, action: KioskAction): KioskSession {
  switch (action.type) {
    case 'chooseMode':
      return { ...state, mode: action.mode }

    case 'setDraft':
      return { ...state, draft: action.text }

    case 'submit': {
      const query = action.query.trim()
      if (query.length === 0) return state
      return { ...state, stage: { name: 'search', query }, draft: query }
    }

    // Wejście w szczegół z wyników niesie zapytanie, wejście z katalogu nie —
    // to ono decyduje, dokąd wróci „wstecz".
    case 'openDetail':
      if (state.stage.name === 'detail') return state
      return {
        ...state,
        stage: {
          name: 'detail',
          query: state.stage.name === 'search' ? state.stage.query : undefined,
          result: action.result,
        },
      }

    case 'back':
      switch (state.stage.name) {
        case 'detail':
          return { ...state, stage: state.stage.query ? { name: 'search', query: state.stage.query } : { name: 'entry' } }
        case 'search':
          return { ...state, stage: { name: 'entry' } }
        case 'entry':
          return state
      }
      break

    case 'setSkala':
      return { ...state, skala: action.skala }

    /*
     * „Zakończ": pełny wipe. To jedyne miejsce, w które wejdzie później czyszczenie
     * sesji (queryClient.clear() + usunięcie `pomost:gaps`), gdy dojdzie ekran
     * bezczynności — stan komponentów to za mało, bo cache i sessionStorage trzymają
     * tekst poprzedniego mieszkańca do zamknięcia karty.
     */
    case 'end':
      return INITIAL
  }

  return state
}

export function useKioskSession() {
  return useReducer(reducer, INITIAL)
}
