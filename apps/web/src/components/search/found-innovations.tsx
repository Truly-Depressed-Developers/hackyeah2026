import { IconX } from '@tabler/icons-react'
import { TileBrowser, type TileItem } from '@/components/catalog/tile-browser'
import { Spinner } from '@/components/ui/spinner'
import type { SearchResponse } from '@/lib/ai/client'

const plural = new Intl.PluralRules('pl')

function innovationsLabel(n: number) {
  const rule = plural.select(n)
  return `${n} ${rule === 'one' ? 'innowację' : rule === 'few' ? 'innowacje' : 'innowacji'}`
}

type Props = {
  data: SearchResponse | undefined
  state: 'pending' | 'error' | 'success'
  onRetry: () => void
  onClear: () => void
}

/** Search results as catalog tiles, best match first (the design shows one list, not tiers). */
export function FoundInnovations({ data, state, onRetry, onClear }: Props) {
  if (state === 'pending') {
    return (
      <p role="status" className="flex items-center justify-center gap-2 px-4 py-16 text-muted-foreground">
        <Spinner />
        Szukamy rozwiązań…
      </p>
    )
  }

  const items: TileItem[] = [...(data?.solutions ?? []), ...(data?.related ?? [])].map((result) => ({
    id: result.id,
    title: result.title,
    summary: result.summary,
    subtitle: result.subtitle,
    featured: result.featured,
    hasVideo: Boolean(result.links?.video),
    category: result.category,
    categorySlug: result.categorySlug,
    source: result.source,
    opensPage: result.kind === 'innovation',
    phone: result.links?.phone,
  }))

  return (
    <>
      {state === 'success' && (
        <p role="status" className="sr-only">
          Znaleźliśmy {innovationsLabel(items.length)}.
        </p>
      )}
      <TileBrowser
        title="Znalezione innowacje"
        headerAction={
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-muted px-[1.125rem] text-[0.9375rem] font-semibold text-[#1F2A3A] hover:bg-border focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <IconX aria-hidden="true" className="size-[1.125rem]" />
            Wyczyść wyszukiwanie
          </button>
        }
        items={items}
        state={state}
        errorText="Coś poszło nie tak i nie udało się wyszukać."
        onRetry={onRetry}
        focusTitle
      />
    </>
  )
}
