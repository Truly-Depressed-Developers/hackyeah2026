import { useEffect } from 'react'
import { IconSearch } from '@tabler/icons-react'
import { cn } from 'cn'
import { useVoiceQuery } from '@/hooks/use-voice-query'
import { ListeningPanel } from '../components/listening-panel'
import { ModeTiles } from '../components/mode-tiles'
import { CTA, FIELD } from '../kiosk-ui'
import { ScreenTitle } from '../screen-title'
import type { KioskMode } from '../use-kiosk-session'

/** Poniżej tego zapytanie to szum, nie opis sprawy — próg z `use-voice-query.ts`. */
const MIN_QUERY_LENGTH = 3

interface SearchScreenProps {
  mode: KioskMode | null
  draft: string
  onMode: (mode: KioskMode) => void
  onDraft: (text: string) => void
  onSubmit: (query: string) => void
}

export function SearchScreen({ mode, draft, onMode, onDraft, onSubmit }: SearchScreenProps) {
  const voice = useVoiceQuery()

  // Dyktowanie i pisanie prowadzą do jednego miejsca: gdy mowa się ustabilizuje,
  // transkrypcja staje się tym samym draftem, który edytuje klawiatura.
  const { draft: dictated } = voice
  useEffect(() => {
    if (dictated.length > 0) onDraft(dictated)
    // onDraft to stabilny dispatch z reducera.
  }, [dictated, onDraft])

  const canSubmit = draft.trim().length >= MIN_QUERY_LENGTH
  // W trakcie mówienia przycisk szukania tylko rozpraszałby — najpierw „Zatrzymaj”.
  const showSubmit = mode !== null && !voice.isListening

  return (
    <form
      className="flex flex-col gap-8 pt-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (canSubmit) onSubmit(draft)
      }}
    >
      <div className="flex flex-col gap-4">
        <ScreenTitle className="text-[48px]">W czym możemy Ci pomóc?</ScreenTitle>
        <p className="hub-tekst-m text-[var(--hub-tekst-2)]">
          Napisz lub powiedz, z czym masz kłopot. Podpowiemy, gdzie szukać pomocy w Małopolsce.
        </p>
      </div>

      <ModeTiles mode={mode} onChoose={onMode} />

      {mode === 'napisz' && (
        <div className="flex flex-col gap-3">
          {/* Etykieta widoczna, nie placeholder — placeholder znika przy pisaniu. */}
          <label htmlFor="hub-opis" className="hub-tekst-s font-semibold">
            Opisz swoją sprawę
          </label>
          <textarea
            id="hub-opis"
            value={draft}
            onChange={(event) => onDraft(event.target.value)}
            // iPadOS nie kurczy 100dvh przy otwarciu klawiatury programowej, więc pole
            // potrafi wylądować pod nią. Przewijamy je na środek panelu.
            onFocus={(event) => event.currentTarget.scrollIntoView({ block: 'center' })}
            placeholder="Np. mama po udarze potrzebuje opieki w domu"
            className={cn(FIELD, 'hub-tekst-m h-[300px] resize-none py-5')}
          />
        </div>
      )}

      {mode === 'powiedz' && (
        <>
          <ListeningPanel voice={voice} text={draft} onStart={voice.start} onEdit={() => onMode('napisz')} />
          {/* Stabilny komunikat dla czytnika — żywa transkrypcja celowo poza live region. */}
          <p role="status" className="sr-only">
            {voice.isListening ? 'Słucham.' : draft.length > 0 ? 'Gotowe. Sprawdź, czy dobrze Cię zrozumiałem.' : ''}
          </p>
        </>
      )}

      {showSubmit && (
        <button type="submit" disabled={!canSubmit} className={cn(CTA, 'self-center disabled:opacity-50')}>
          <IconSearch aria-hidden="true" className="size-8" />
          Szukaj rozwiązania
        </button>
      )}
    </form>
  )
}
