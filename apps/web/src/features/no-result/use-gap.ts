import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { currentSearchId } from '@/lib/analytics'
import { trpc } from '@/lib/trpc'

const STORAGE_KEY = 'pomost:gaps'
// Shared across StrictMode's double effect run, so one Zapytanie never records two Luki.
const inFlight = new Map<string, Promise<string>>()

function readGaps(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, string>
  } catch {
    return {}
  }
}

function rememberGap(query: string, id: string) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readGaps(), [query]: id }))
  } catch {
    // Blocked storage: a refresh may record the Luka again, which is acceptable.
  }
}

export function storedGapId(query: string): string | undefined {
  return readGaps()[query]
}

/** Records a Luka once per Zapytanie (also across refreshes) and returns its id for upgrading it later. */
export function useGap(query: string) {
  const [gapId, setGapId] = useState<string | undefined>(() => readGaps()[query])
  const record = useMutation(trpc.needs.recordGap.mutationOptions())

  useEffect(() => {
    const stored = readGaps()[query]
    if (stored) {
      setGapId(stored)
      return
    }
    let active = true
    const pending =
      inFlight.get(query) ??
      record.mutateAsync({ query, searchId: currentSearchId() }).then(({ id }) => {
        rememberGap(query, id)
        return id
      })
    inFlight.set(query, pending)
    pending
      .then((id) => active && setGapId(id))
      .catch(() => inFlight.delete(query))
    return () => {
      active = false
    }
    // record is stable enough; re-running on its identity would re-record.
    // oxlint-disable-next-line react/exhaustive-deps
  }, [query])

  return gapId
}
