import { IconArrowLeft } from '@tabler/icons-react'
import { summarize } from '@/components/search/search-results'
import type { Result, SearchResponse } from '@/lib/ai/client'
import { KioskResultCard } from '../components/kiosk-result-card'
import { CTA_OUTLINE } from '../kiosk-ui'
import { ScreenTitle } from '../screen-title'
import type { CarriedResult } from '../use-kiosk-session'

interface ResultsScreenProps {
  data: SearchResponse
  query: string
  onOpen: (result: CarriedResult) => void
  onBack: () => void
}

export function ResultsScreen({ data, query, onOpen, onBack }: ResultsScreenProps) {
  return (
    <div className="flex flex-col gap-8 pt-4">
      <div className="flex flex-col gap-3">
        <ScreenTitle>Znalazłem coś dla Ciebie</ScreenTitle>
        <p className="hub-tekst-s text-[var(--hub-tekst-2)]">
          <span className="font-semibold text-foreground">Szukałem dla: </span>„{query}”
        </p>
        {/* Liczba wyników po polsku - ta sama funkcja, której używa wersja web. */}
        <p role="status" className="sr-only">
          {summarize(data)}
        </p>
      </div>

      {data.solutions.length > 0 && (
        <Tier id="pasuje" title="Pasuje do Twojej sprawy" results={data.solutions} tier="solution" onOpen={onOpen} />
      )}

      {data.related.length > 0 && (
        <Tier
          id="moze"
          title="Może też pomóc"
          description="Nie dotyczy wprost Twojej sprawy, ale warto o tym wiedzieć."
          results={data.related}
          tier="related"
          onOpen={onOpen}
        />
      )}

      {/* Przyklejony do dołu panelu, żeby wyjście było zawsze pod ręką przy długiej liście. */}
      <div className="sticky -bottom-12 -mx-14 mt-4 flex justify-center bg-linear-to-t from-[var(--hub-tlo)] from-60% to-transparent px-14 pt-8 pb-12">
        <button type="button" onClick={onBack} className={CTA_OUTLINE}>
          <IconArrowLeft aria-hidden="true" className="size-7" />
          Wróć i opisz inaczej
        </button>
      </div>
    </div>
  )
}

function Tier(props: {
  id: string
  title: string
  description?: string
  results: Result[]
  tier: 'solution' | 'related'
  onOpen: (result: CarriedResult) => void
}) {
  const headingId = `kiosk-${props.id}`

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="text-[calc(26px*var(--hub-skala))] font-bold">
          {props.title}
        </h2>
        {props.description && <p className="hub-tekst-xs text-[var(--hub-tekst-2)]">{props.description}</p>}
      </div>

      <ul className="flex flex-col gap-4">
        {props.results.map((result) => (
          <KioskResultCard
            key={result.id}
            result={result}
            tier={props.tier}
            // `why` nie istnieje na `Innovation` z /catalog/{id}, więc uzasadnienie
            // musi pojechać razem z kliknięciem - inaczej ekran szczegółu by je zgubił.
            onOpen={() =>
              props.onOpen({
                id: result.id,
                title: result.title,
                why: result.why,
                whyGenerated: result.whyGenerated,
              })
            }
          />
        ))}
      </ul>
    </section>
  )
}
