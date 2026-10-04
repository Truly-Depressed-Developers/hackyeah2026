import { useSyncExternalStore } from 'react'

export type Lang = 'pl' | 'en'

const STORAGE_KEY = 'pomost:lang'
const listeners = new Set<() => void>()

function read(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'pl'
  } catch {
    return 'pl'
  }
}

let current: Lang = read()

export function setLang(lang: Lang) {
  current = lang
  document.documentElement.lang = lang
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // Private mode: the choice lasts until reload.
  }
  for (const listener of listeners) listener()
}

export function applyStoredLang() {
  document.documentElement.lang = current
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useLang = () => useSyncExternalStore(subscribe, () => current)

/**
 * Inline pairs instead of key files: the copy stays next to its markup. Only the interface is
 * translated; innovations and AI reports come from the AI service in Polish.
 */
export function useT() {
  const lang = useLang()
  return (pl: string, en: string) => (lang === 'en' ? en : pl)
}
