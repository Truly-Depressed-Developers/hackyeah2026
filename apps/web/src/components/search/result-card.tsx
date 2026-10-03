import { Sparkles } from 'lucide-react'
import type { Result, ResultKind } from '@/lib/ai/client'

const KIND_LABEL: Record<ResultKind, string> = {
  innovation: 'Sprawdzone rozwiązanie',
  helper: 'Kto może pomóc',
  fact: 'Fakt',
}

export function ResultCard({ result }: { result: Result }) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="rounded-md bg-muted px-2 py-1 font-medium">{KIND_LABEL[result.kind]}</span>
        {result.category && <span className="text-muted-foreground">{result.category}</span>}
      </p>
      <h3 className="text-lg font-semibold leading-snug">{result.title}</h3>
      <p>{result.summary}</p>
      <div className="flex flex-col gap-1 rounded-lg bg-muted/60 p-3">
        <p className="text-sm font-semibold">Dlaczego to pasuje</p>
        <p>{result.why}</p>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Sparkles aria-hidden="true" className="size-4" />
          <span>
            Wygenerowane przez AI na podstawie:{' '}
            {result.source.url ? (
              <a href={result.source.url} className="underline underline-offset-2 hover:text-foreground">
                {result.source.label}
              </a>
            ) : (
              result.source.label
            )}
          </span>
        </p>
      </div>
    </li>
  )
}
