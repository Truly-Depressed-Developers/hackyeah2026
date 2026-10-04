import { useLayoutEffect, useSyncExternalStore } from 'react'

// Dark mode exists only in the Panel administratora (a desk tool used for hours); the resident app stays light.
// The choice is a per-browser convenience, so localStorage is enough; "system" follows the OS setting.

export type PanelTheme = 'light' | 'dark' | 'system'

const KEY = 'pomost.panel.theme'
const listeners = new Set<() => void>()
const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

function read(): PanelTheme {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

export function setPanelTheme(theme: PanelTheme) {
  try {
    if (theme === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, theme)
  } catch {
    // Storage blocked: the choice lasts until reload.
  }
  current = theme
  for (const notify of listeners) notify()
}

let current: PanelTheme | undefined

function subscribe(notify: () => void) {
  listeners.add(notify)
  const query = darkQuery()
  query.addEventListener('change', notify)
  return () => {
    listeners.delete(notify)
    query.removeEventListener('change', notify)
  }
}

/** The stored choice and what it resolves to right now. */
export function usePanelTheme() {
  const theme = useSyncExternalStore(subscribe, () => (current ??= read()))
  const dark = useSyncExternalStore(subscribe, () => theme === 'dark' || (theme === 'system' && darkQuery().matches))
  return { theme, dark }
}

/** Puts `.dark` on <html> while a panel page is mounted, and takes it off on the way out. */
export function useApplyPanelTheme() {
  const { dark } = usePanelTheme()
  useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', dark)
    return () => root.classList.remove('dark')
  }, [dark])
}
