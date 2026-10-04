import { IconSparkles } from '@tabler/icons-react'
import { InnovationTile } from '@/components/innovation/innovation-tile'
import type { Result, ResultKind } from '@/lib/ai/client'

const KIND_LABEL: Record<ResultKind, string> = {
  innovation: 'Sprawdzone rozwiązanie',
  helper: 'Kto może pomóc',
  fact: 'Fakt',
}

export function ResultCard({ result }: { result: Result }) {
  const phone = result.links?.phone

  // Innovations open their detail page; everything else falls back to its own
  // single Akcja — a phone number, or the record at its source.
  const target = result.kind === 'innovation' ? { id: result.id } : phone ? { href: `tel:${phone.replace(/\s/g, '')}` } : result.source.url ? { href: result.source.url, newTab: true } : {}

  return (
    <InnovationTile
      {...target}
      title={result.title}
      subtitle={result.summary}
      categorySlug={result.categorySlug}
      kindLabel={KIND_LABEL[result.kind]}
      hasVideo={Boolean(result.links?.video)}
      phone={phone}
      sourceLabel={result.source.label}
      note={<MatchRationale why={result.why} generated={result.whyGenerated} />}
    />
  )
}

function MatchRationale({ why, generated }: { why: string; generated: boolean }) {
  return (
    <span className="mt-0.5 flex flex-col gap-1 rounded-xl bg-muted/60 px-3 py-2 text-[0.8125rem] leading-[1.125rem]">
      <span className="line-clamp-3">{why}</span>
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        {generated && <IconSparkles aria-hidden="true" className="size-3.5" />}
        {generated ? 'Uzasadnienie wygenerowane przez AI' : 'Uzasadnienie dopasowania'}
      </span>
    </span>
  )
}
