import { useId, useState } from 'react'
import {
  IconArrowLeft,
  IconChevronDown,
  IconMovie,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerStop,
  IconRosetteDiscountCheck,
  IconSparkles,
  IconVolume,
} from '@tabler/icons-react'
import { cn } from 'cn'
import { Spinner } from '@/components/ui/spinner'
import { $ai, type Innovation } from '@/lib/ai/client'
import { useSpeech } from '@/lib/use-speech'
import { CategoryPill } from '../components/category-pill'
import { Takeaway } from '../components/takeaway'
import { CTA, CTA_MUTED, FOCUS, PILL } from '../kiosk-ui'
import { ScreenTitle } from '../screen-title'
import type { CarriedResult } from '../use-kiosk-session'

interface DetailScreenProps {
  result: CarriedResult
  /** Etykieta powrotu zależy od tego, skąd przyszliśmy: z wyników czy z katalogu. */
  backLabel: string
  onBack: () => void
}

export function DetailScreen({ result, backLabel, onBack }: DetailScreenProps) {
  const query = $ai.useQuery(
    'get',
    '/catalog/{id}',
    { params: { path: { id: result.id } } },
    { staleTime: 10 * 60_000, retry: false },
  )

  if (query.isPending) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5">
        <Spinner aria-hidden="true" className="size-12 text-primary" />
        <p role="status" className="hub-tekst-m">
          Wczytuję szczegóły…
        </p>
      </div>
    )
  }

  if (query.isError) {
    return (
      <div role="alert" className="flex flex-col gap-6 pt-4">
        <ScreenTitle>Nie udało się wczytać szczegółów</ScreenTitle>
        <p className="hub-tekst-m text-[var(--hub-tekst-2)]">Spróbuj jeszcze raz albo wróć do listy rozwiązań.</p>
        <div className="flex flex-wrap gap-4">
          <button type="button" onClick={() => query.refetch()} className={CTA}>
            Spróbuj ponownie
          </button>
          <button type="button" onClick={onBack} className={CTA_MUTED}>
            <IconArrowLeft aria-hidden="true" className="size-6" />
            {backLabel}
          </button>
        </div>
      </div>
    )
  }

  return <DetailView item={query.data} result={result} backLabel={backLabel} onBack={onBack} />
}

function DetailView({ item, result, backLabel, onBack }: { item: Innovation; result: CarriedResult; backLabel: string; onBack: () => void }) {
  const speech = useSpeech(readAloudText(item))

  /* Oba pola są opcjonalne w kontrakcie, więc sekcje renderujemy warunkowo. */
  const sections = [
    { title: 'Na czym to polega', text: item.solution },
    { title: 'Dla kogo', text: item.targetGroup },
  ].filter((section): section is { title: string; text: string } => Boolean(section.text))

  return (
    <div className="flex flex-col gap-8 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button type="button" onClick={onBack} className={cn(PILL, 'pr-7 pl-5')}>
          <IconArrowLeft aria-hidden="true" className="size-6" />
          {backLabel}
        </button>

        {speech.supported && !speech.speaking && (
          <button
            type="button"
            onClick={speech.speak}
            className={cn(
              'hub-dotyk inline-flex h-15 items-center gap-3 rounded-full bg-[var(--hub-niebieski-jasny)] pr-7 pl-5 text-[22px] font-semibold text-[var(--hub-niebieski-ciemny)]',
              FOCUS,
            )}
          >
            <IconVolume aria-hidden="true" className="size-7" />
            Odsłuchaj
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <CategoryPill slug={item.categorySlug} label={item.category} />
        {/* W przeciwieństwie do kart wyników tutaj `featured` istnieje w kontrakcie. */}
        {item.featured && (
          <span className="inline-flex items-center gap-2 text-[18px] font-semibold text-[#7a4300]">
            <IconRosetteDiscountCheck aria-hidden="true" className="size-6" />
            Polecana
          </span>
        )}
      </div>

      <ScreenTitle className="text-[40px]">{item.title}</ScreenTitle>

      {speech.speaking && <ReadAloudControls speech={speech} />}

      {/* Brak `why` = weszliśmy z katalogu, gdzie nie było zapytania do uzasadnienia. */}
      {result.why && (
        <div className="hub-tekst-xs flex flex-col gap-2 rounded-2xl bg-muted/60 px-5 py-4 text-[var(--hub-tekst-2)]">
          <span>
            <span className="font-bold text-foreground">Dlaczego to pasuje: </span>
            {result.why}
          </span>
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            {result.whyGenerated && <IconSparkles aria-hidden="true" className="size-5" />}
            {result.whyGenerated ? 'Uzasadnienie wygenerowane przez AI' : 'Uzasadnienie dopasowania'}
          </span>
        </div>
      )}

      {/*
        Odbiór tuż pod tytułem, przed długim opisem: po to mieszkaniec tu przyszedł —
        żeby zabrać adres na telefon. Opisy innowacji potrafią mieć kilka akapitów
        i spychały kod QR poza ekran, więc teraz to one czekają na rozwinięcie.
      */}
      <Takeaway id={item.id} title={item.title} />

      <Description sections={sections} />

      <p className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[calc(18px*var(--hub-skala))] text-muted-foreground">
        {item.links?.video && (
          <span className="inline-flex items-center gap-2">
            <IconMovie aria-hidden="true" className="size-5" />
            Film
          </span>
        )}
        <span>Źródło: {item.source.label}</span>
      </p>
    </div>
  )
}

/** Poniżej tego pierwszy akapit mieści się na ekranie i zwijanie go nic nie daje. */
const CLAMP_THRESHOLD = 280

/**
 * Opis innowacji ucięty do kilku linijek, z przyciskiem rozwijającym resztę — dzięki
 * temu akcje („Jak chcesz odebrać…") zostają w zasięgu wzroku bez przewijania.
 *
 * Przycisk pojawia się tylko wtedy, gdy faktycznie jest co odsłonić: przy jednej
 * krótkiej sekcji byłby kontrolką, która nic nie robi.
 */
function Description({ sections }: { sections: { title: string; text: string }[] }) {
  const [expanded, setExpanded] = useState(false)
  const detailsId = useId()

  if (sections.length === 0) return null

  const worthCollapsing = sections.length > 1 || sections[0]!.text.length > CLAMP_THRESHOLD
  const collapsed = worthCollapsing && !expanded

  return (
    <div className="flex flex-col gap-6">
      <div id={detailsId} className="flex flex-col gap-6">
        {sections.map(({ title, text }, i) => (
          // Pierwszą sekcję przycinamy, kolejne chowamy — `hidden` zamiast odmontowania,
          // żeby `aria-controls` zawsze wskazywało istniejący element.
          <section key={title} hidden={collapsed && i > 0} className="flex flex-col gap-2">
            <h2 className="hub-tekst-s font-bold">{title}</h2>
            <p className={cn('hub-tekst-s text-[var(--hub-tekst-2)]', collapsed && i === 0 && 'line-clamp-4')}>{text}</p>
          </section>
        ))}
      </div>

      {worthCollapsing && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={() => setExpanded((open) => !open)}
          className={cn(CTA_MUTED, 'self-start')}
        >
          <IconChevronDown aria-hidden="true" className={cn('size-6 transition-transform', expanded && 'rotate-180')} />
          {expanded ? 'Zwiń szczegóły' : 'Zobacz szczegóły'}
        </button>
      )}
    </div>
  )
}

function ReadAloudControls({ speech }: { speech: ReturnType<typeof useSpeech> }) {
  return (
    <div className="flex items-center gap-4 rounded-[28px] border border-border bg-card p-5">
      <button
        type="button"
        aria-label={speech.paused ? 'Wznów czytanie' : 'Wstrzymaj czytanie'}
        onClick={speech.paused ? speech.resume : speech.pause}
        className={cn('hub-dotyk flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground', FOCUS)}
      >
        {speech.paused ? <IconPlayerPlay aria-hidden="true" className="size-8" /> : <IconPlayerPause aria-hidden="true" className="size-8" />}
      </button>
      <button
        type="button"
        aria-label="Zatrzymaj czytanie"
        onClick={speech.stop}
        className={cn('hub-dotyk flex size-16 items-center justify-center rounded-full border-2 border-[#7a879a] bg-white', FOCUS)}
      >
        <IconPlayerStop aria-hidden="true" className="size-8" />
      </button>
      <span role="status" className="text-[20px] font-bold">
        {speech.paused ? 'Wstrzymano' : 'Czytam…'}
      </span>
    </div>
  )
}

/** Ten sam układ, którego używa strona innowacji — nagłówek pytania przed treścią. */
function readAloudText(item: Innovation) {
  return [
    item.title,
    item.subtitle,
    item.solution && `Na czym to polega. ${item.solution}`,
    item.targetGroup && `Dla kogo. ${item.targetGroup}`,
  ]
    .filter(Boolean)
    .join('. ')
}
