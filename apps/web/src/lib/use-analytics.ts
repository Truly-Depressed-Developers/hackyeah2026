import { useEffect, useRef } from 'react'
import type { SearchResponse } from '@/lib/ai/client'
import { resultsShown, startSearch, track, viewInnovation } from '@/lib/analytics'

type SearchState = { isSuccess: boolean; isError: boolean; isFetching: boolean; data?: SearchResponse }

/** One Wyszukiwanie per submitted Zapytanie: search_submitted on submit, results_shown once the Wyniki are on screen. */
export function useSearchTracking(q: string | undefined, search: SearchState) {
  const current = useRef<{ q: string; id: string; startedAt: number; shown: boolean } | null>(null)

  useEffect(() => {
    // StrictMode runs effects twice; one Zapytanie is still one Wyszukiwanie.
    if (!q || current.current?.q === q) return
    current.current = { q, id: startSearch(q), startedAt: performance.now(), shown: false }
  }, [q])

  const settled = !search.isFetching && (search.isSuccess || search.isError)
  useEffect(() => {
    const active = current.current
    if (!q || !active || active.q !== q || active.shown || !settled) return
    active.shown = true
    const latencyMs = performance.now() - active.startedAt
    if (!search.isSuccess || !search.data) {
      resultsShown(active.id, latencyMs, { noMatch: false, results: [], error: true })
      return
    }
    const { solutions, related, noMatch } = search.data
    const toShown = (tier: 'solution' | 'related') => (result: SearchResponse['solutions'][number]) => ({
      id: result.id,
      title: result.title,
      tier,
      category: result.category ?? undefined,
    })
    resultsShown(active.id, latencyMs, { noMatch, results: [...solutions.map(toShown('solution')), ...related.map(toShown('related'))] })
  }, [q, settled, search.isSuccess, search.data])

}

/** innovation_viewed on mount, innovation_left with the reading time on unmount or page hide. */
export function useInnovationTracking(innovationId: string) {
  // Deferred a tick: StrictMode's mount → unmount → mount would otherwise record a zero-second view.
  useEffect(() => {
    let leave: (() => void) | undefined
    const timer = setTimeout(() => (leave = viewInnovation(innovationId)))
    return () => {
      clearTimeout(timer)
      leave?.()
    }
  }, [innovationId])
}

/** idea_step for each step shown, idea_abandoned if the wizard is left before sending. */
export function useIdeaTracking(step: number, stepCount: number, done: boolean, searchId: string | undefined) {
  const last = useRef({ step, done })
  useEffect(() => {
    last.current = { step, done }
  }, [step, done])
  const mounted = useRef(false)

  useEffect(() => {
    if (done) return
    const timer = setTimeout(() => track({ type: 'idea_step', step, stepCount, searchId }))
    return () => clearTimeout(timer)
  }, [step, stepCount, done, searchId])

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      setTimeout(() => {
        if (!mounted.current && !last.current.done) track({ type: 'idea_abandoned', lastStep: last.current.step })
      })
    }
  }, [])
}
