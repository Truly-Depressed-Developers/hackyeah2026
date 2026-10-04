import { useEffect, useRef } from 'react'
import { TILE_GRID } from '@/components/innovation/innovation-tile'
import type { Result, SearchResponse } from '@/lib/ai/client'
import { countLabel } from '@/lib/plural'
import { ResultCard } from './result-card'

export function summarize(data: SearchResponse) {
  if (data.noMatch) return 'Nie znaleźliśmy pasujących rozwiązań.'
  const parts = [
    data.solutions.length > 0 &&
      countLabel(data.solutions.length, { one: 'rozwiązanie', few: 'rozwiązania', many: 'rozwiązań' }),
    data.related.length > 0 &&
      countLabel(data.related.length, { one: 'rozwiązanie pokrewne', few: 'rozwiązania pokrewne', many: 'rozwiązań pokrewnych' }),
  ].filter(Boolean)
  return `Znaleźliśmy ${parts.join(' i ')}.`
}

export function SearchResults({ data }: { data: SearchResponse }) {
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
            Nie znaleźliśmy pasujących rozwiązań
          </h2>
          <p>Spróbuj opisać problem innymi słowami.</p>
        </section>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-8">
      {data.solutions.length > 0 && (
        <Tier id="solutions" title="Rozwiązania" description="Najlepiej pasują do Twojego problemu." results={data.solutions} />
      )}
      {data.related.length > 0 && (
        <Tier
          id="related"
          title="Rozwiązania pokrewne"
          description="Pasują częściowo - mogą się przydać."
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
