import { useEffect } from 'react'

/** Sets the tab title while the page is open and puts the previous one back after. */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title
    document.title = `${title} · Panel Pomost`
    return () => {
      document.title = previous
    }
  }, [title])
}
