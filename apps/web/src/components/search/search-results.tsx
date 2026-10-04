import { useEffect, useRef } from 'react'
import { TILE_GRID } from '@/components/innovation/innovation-tile'
import type { Result, SearchResponse } from '@/lib/ai/client'
import { ResultCard } from './result-card'
import { useT, type Translate } from '@/lib/i18n'

export function summarize(data: SearchResponse, t: Translate) {
  if (data.noMatch) return t('search.noMatch')
  const parts = [
    data.solutions.length > 0 && t.count('search.solutions', data.solutions.length),
    data.related.length > 0 && t.count('search.related', data.related.length),
  ].filter(Boolean)
  return t('search.found', { parts: parts.join(t('search.and')) })
}

export function SearchResults({ data }: { data: SearchResponse }) {
  const t = useT()
  const containerRef = useRef<HTMLDivElement>(null)

  // Remounts per finished search, so [] focuses the results once each time.
  useEffect(() => {
    containerRef.current?.querySelector<HTMLElement>('h2')?.focus()
  }, [])

  if (data.noMatch) {
    return (
      <div ref={containerRef}>
        <section aria-labelledby="no-match-heading" className="flex flex-col gap-2 rounded-xl border p-4">
          <h2 id="no-match-heading" tabIndex={-1} className="text-xl font-semibold outline-none">
            {t('search.noMatchTitle')}
          </h2>
          <p>{t('search.noMatchHint')}</p>
        </section>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-8">
      {data.solutions.length > 0 && (
        <Tier id="solutions" title={t('search.solutionsTitle')} description={t('search.solutionsHint')} results={data.solutions} />
      )}
      {data.related.length > 0 && (
        <Tier
          id="related"
          title={t('search.relatedTitle')}
          description={t('search.relatedHint')}
          results={data.related}
          muted
        />
      )}
    </div>
  )
}

function Tier(props: { id: string; title: string; description: string; results: Result[]; muted?: boolean }) {
  const headingId = `${props.id}-heading`
  return (
    <section
      aria-labelledby={headingId}
      className={props.muted ? 'flex flex-col gap-3 rounded-2xl border-2 border-dashed p-4' : 'flex flex-col gap-3'}
    >
      <div>
        <h2 id={headingId} tabIndex={-1} className="text-xl font-semibold outline-none">
          {props.title}
        </h2>
        <p className="text-muted-foreground">{props.description}</p>
      </div>
      <ul className={TILE_GRID}>
        {props.results.map((result) => (
          <ResultCard key={result.id} result={result} />
        ))}
      </ul>
    </section>
  )
}
