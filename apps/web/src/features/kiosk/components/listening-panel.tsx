import { IconAlertTriangle, IconKeyboard, IconMicrophone, IconPlayerStop, IconRefresh } from '@tabler/icons-react'
import { cn } from 'cn'
import type { useVoiceQuery } from '@/hooks/use-voice-query'
import { CTA, CTA_OUTLINE, FOCUS } from '../kiosk-ui'
import { translator } from '@/lib/i18n'

/**
 * Deterministyczne słupki equalizera, jak w wersji web: Web Speech API nie udostępnia
 * amplitudy, więc animują się na timerze, a nie z mikrofonu.
 */
const BARS = Array.from({ length: 24 }, (_, i) => ({
  durationMs: (0.8 + ((i * 37) % 9) / 10) * 1000,
  delayMs: (-((i * 53) % 11) / 10) * 1000,
  heightPx: Math.round(64 * [0.55, 0.8, 1, 0.7, 0.9, 0.6][i % 6]!),
}))

type Voice = ReturnType<typeof useVoiceQuery>

interface ListeningPanelProps {
  voice: Voice
  /** Bieżący opis z reducera — po „Popraw tekst" może różnić się od transkrypcji. */
  text: string
  onStart: () => void
  onEdit: () => void
}

/**
 * Panel słuchania w treści ekranu, nie modal — inaczej niż `voice-dialog.tsx` w wersji
 * web. Na kiosku nie ma czego przykrywać, a nakładka zabierałaby kontekst sprawy.
 *
 * Faza jest wyliczana z `useVoiceQuery`, bez własnego stanu: jedno źródło prawdy
 * i brak szansy na rozjazd między UI a silnikiem mowy.
 */
export function ListeningPanel({ voice, text, onStart, onEdit }: ListeningPanelProps) {
  const unavailable = !voice.support.usable || voice.error !== null

  if (unavailable) return <Unavailable error={voice.error} onEdit={onEdit} />
  if (voice.isListening) return <Listening voice={voice} />
  if (text.length > 0) return <Confirm voice={voice} text={text} onStart={onStart} onEdit={onEdit} />
  return <Idle onStart={onStart} />
}

/**
 * Osiągalne tylko po zatrzymaniu nagrania bez rozpoznanego tekstu — wybór „Powiedz"
 * uruchamia mikrofon od razu, więc to nie jest pierwszy krok, tylko ponowienie.
 */
function Idle({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-[28px] border border-border bg-card p-10 text-center">
      <p className="hub-tekst-m font-bold">Nie usłyszałem nic wyraźnego</p>
      <p className="hub-tekst-s text-muted-foreground">Spróbuj jeszcze raz - mów spokojnie, swoimi słowami.</p>
      {/* start() wprost w handlerze kliknięcia — Safari wymaga gestu użytkownika. */}
      <button type="button" onClick={onStart} className={cn(CTA, 'h-20 px-12')}>
        <IconMicrophone aria-hidden="true" className="size-9" />
        Powiedz jeszcze raz
      </button>
    </div>
  )
}

function Listening({ voice }: { voice: Voice }) {
  return (
    <div className="flex flex-col items-center gap-6 rounded-[28px] border border-border bg-card p-10 text-center">
      <div aria-hidden="true" className="relative flex size-40 items-center justify-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{ animationDelay: `${i}s` }}
            className="absolute inset-6 rounded-full border-2 border-primary/35 motion-reduce:hidden animate-[kiosk-ring_3s_cubic-bezier(.15,.6,.35,1)_infinite]"
          />
        ))}
        <span className="relative flex size-28 items-center justify-center rounded-full bg-primary text-primary-foreground motion-reduce:animate-none animate-[kiosk-orb_1.6s_ease-in-out_infinite]">
          <IconMicrophone aria-hidden="true" className="size-14" />
        </span>
      </div>

      <div aria-hidden="true" className="flex h-16 items-center justify-center gap-[6px]">
        {BARS.map((bar, i) => (
          <span
            key={i}
            style={{ height: `${bar.heightPx}px`, animationDuration: `${bar.durationMs}ms`, animationDelay: `${bar.delayMs}ms` }}
            className="block w-[6px] origin-center scale-y-[0.22] rounded-full bg-primary motion-reduce:animate-none! animate-[kiosk-fala_ease-in-out_infinite]"
          />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <p className="hub-tekst-l font-bold">{voice.finalText || voice.interimText ? 'Zapisuję, co mówisz…' : 'Słucham…'}</p>
        <p className="hub-tekst-s text-muted-foreground">
          {voice.finalText || voice.interimText ? 'Gdy skończysz, dotknij „Zatrzymaj”.' : 'Mów spokojnie, swoimi słowami.'}
        </p>
      </div>

      {/* Nie jest to live region: wyniki pośrednie lecą kilka razy na sekundę
          i zalałyby czytnik ekranu. Stan ogłasza osobny, stabilny komunikat niżej. */}
      {(voice.finalText || voice.interimText) && (
        <p className="hub-tekst-m w-full rounded-2xl bg-muted/60 p-5 text-left">
          {voice.finalText}
          {voice.interimText && <span className="text-muted-foreground"> {voice.interimText}</span>}
          <span
            aria-hidden="true"
            className="ml-1 inline-block h-[1.1em] w-[3px] -translate-y-px bg-primary align-text-bottom motion-reduce:animate-none animate-[kiosk-kursor_1s_steps(1)_infinite]"
          />
        </p>
      )}

      <button type="button" onClick={voice.stop} className={CTA_OUTLINE}>
        <IconPlayerStop aria-hidden="true" className="size-7" />
        Zatrzymaj
      </button>
    </div>
  )
}

function Confirm({ voice, text, onStart, onEdit }: { voice: Voice; text: string; onStart: () => void; onEdit: () => void }) {
  return (
    <div className="flex flex-col gap-5 rounded-[28px] border border-border bg-card p-8">
      <p className="hub-tekst-m font-bold">Gotowe. Sprawdź, czy dobrze Cię zrozumiałem.</p>

      <div className="flex flex-col gap-2 rounded-2xl bg-muted/60 p-5">
        <span className="text-[20px] font-semibold text-[var(--hub-tekst-2)]">Twoje słowa</span>
        <p className="hub-tekst-m">{text}</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <button type="button" onClick={onEdit} className={CTA_OUTLINE}>
          <IconKeyboard aria-hidden="true" className="size-7" />
          Popraw tekst
        </button>
        <button
          type="button"
          onClick={() => {
            voice.reset()
            onStart()
          }}
          className={CTA_OUTLINE}
        >
          <IconRefresh aria-hidden="true" className="size-7" />
          Powiedz jeszcze raz
        </button>
      </div>
    </div>
  )
}

/**
 * Stan prawdopodobny, nie skrajny: rozpoznawanie mowy wymaga bezpiecznego kontekstu
 * (HTTPS), a Chrome wysyła audio do usługi Google — kiosk po gołym HTTP albo offline
 * nie ma dyktowania. Dlatego wyjście na klawiaturę jest tu głównym przyciskiem.
 */
function Unavailable({ error, onEdit }: { error: string | null; onEdit: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-5 rounded-[28px] border border-border bg-card p-10 text-center">
      <IconAlertTriangle aria-hidden="true" className="size-14 text-[var(--hub-bursztyn)]" />
      <h2 className="hub-tekst-l font-bold">Mikrofon jest teraz niedostępny</h2>
      <p className="hub-tekst-s text-muted-foreground">
        {error ? translator('pl').dynamic(error, error) : 'Opisz swoją sprawę na klawiaturze. Znajdę rozwiązanie tak samo dobrze.'}
      </p>
      <button type="button" onClick={onEdit} className={cn(CTA, 'h-[72px] px-10 text-[24px]', FOCUS)}>
        <IconKeyboard aria-hidden="true" className="size-8" />
        Napisz zamiast tego
      </button>
    </div>
  )
}
