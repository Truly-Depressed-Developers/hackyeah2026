import { useSyncExternalStore } from 'react'
import en from '@/locales/en.json'
import pl from '@/locales/pl.json'

export type Lang = 'pl' | 'en'

type PluralSuffix = 'one' | 'few' | 'many' | 'other'
/** Keys in pl.json, minus the plural forms (`search.solutions_one`…), which go through `count`. */
export type MessageKey = Exclude<keyof typeof pl, `${string}_${PluralSuffix}`>
export type CountKey = keyof typeof pl extends infer K ? (K extends `${infer Base}_${PluralSuffix}` ? Base : never) : never

// Compile-time check: en.json must translate every key pl.json has (plural forms differ per language).
const english: Record<MessageKey, string> = en
const messages: Record<Lang, Record<string, string>> = { pl, en: english }

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

type Vars = Record<string, string | number>

const fill = (text: string, vars?: Vars) => (vars ? text.replace(/\{(\w+)\}/g, (match, name: string) => String(vars[name] ?? match)) : text)

export interface Translate {
  (key: MessageKey, vars?: Vars): string
  /** Polish needs one/few/many, English one/other; Intl.PluralRules picks the form for the language. */
  count: (key: CountKey, count: number) => string
  /** For keys built from data (category slugs); falls back when the key isn't in the dictionary. */
  dynamic: (key: string, fallback: string) => string
}

export function translator(lang: Lang): Translate {
  const dict = messages[lang]
  const rules = new Intl.PluralRules(lang)
  const t = ((key: MessageKey, vars?: Vars) => fill(dict[key] ?? pl[key], vars)) as Translate
  t.count = (key, count) => fill(dict[`${key}_${rules.select(count)}`] ?? dict[`${key}_other`] ?? dict[`${key}_many`] ?? key, { count })
  t.dynamic = (key, fallback) => dict[key] ?? fallback
  return t
}

/** Only the interface is translated; innovations and AI reports come from the AI service in Polish. */
export function useT() {
  return translator(useLang())
}
