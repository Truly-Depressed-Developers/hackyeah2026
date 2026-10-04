import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { IconCheck, IconDeviceMobileMessage, IconPrinter, IconQrcode } from '@tabler/icons-react'
import { cn } from 'cn'
import { QrCode } from '@/components/innovation/qr-code'
import { trackAction } from '@/lib/analytics'
import { isPhone } from '@/lib/contact'
import { trpc } from '@/lib/trpc'
import { CTA, CTA_MUTED, CTA_OUTLINE, FIELD, TILE } from '../kiosk-ui'

/**
 * Wdrożona aplikacja. To ona, a nie origin przeglądarki, jest domyślną bazą kodu QR:
 * kiosk chodzi pod adresem lokalnym albo w LAN-ie, a telefon mieszkańca takiego adresu
 * nie otworzy — `localhost` na telefonie to sam telefon.
 */
const DEFAULT_PUBLIC_URL = 'https://hackyeah2026.onrender.com'

/**
 * `||`, nie `??`: w .env zmienna bywa zadeklarowana pusta (`VITE_PUBLIC_URL=`), a to
 * jest pusty string, nie undefined. Przy `??` pusty string przechodził dalej i kod QR
 * zawierał goły path bez schematu i hosta — czyli nie link, tylko tekst, z którym
 * skaner telefonu robił co chciał (łącznie z podsuwaniem sklepu z aplikacjami).
 *
 * Ucinamy końcowe ukośniki, żeby `.../` nie dawało podwójnego slasha w adresie.
 */
const PUBLIC_URL = (import.meta.env.VITE_PUBLIC_URL?.trim() || DEFAULT_PUBLIC_URL).replace(/\/+$/, '')

/** Kod QR prowadzący na localhost otworzy się na telefonie jako „brak połączenia". */
const UNREACHABLE_FROM_PHONE = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|$)/i.test(PUBLIC_URL)

const SIMULATED_MS = 2200

type Takeaway =
  | { kind: 'none' }
  | { kind: 'print'; done: boolean }
  // After sending, `number` keeps only the last 3 digits for the confirmation.
  | { kind: 'sms'; phase: 'form' | 'sending' | 'sent' | 'failed'; number: string }
  | { kind: 'qr' }

export function Takeaway({ id, title }: { id: string; title: string }) {
  const [state, setState] = useState<Takeaway>({ kind: 'none' })
  const headingId = 'hub-odbior'

  return (
    /*
     * Etykieta sekcji to akapit, nie nagłówek. Odbiór stoi nad tytułem innowacji,
     * więc <h2> dałoby nagłówek przed <h1> i skok h1→h3 w panelach niżej.
     * `aria-labelledby` nadaje sekcji nazwę bez wchodzenia w hierarchię nagłówków.
     */
    <section aria-labelledby={headingId} className="flex flex-col gap-5">
      <p id={headingId} className="text-[calc(26px*var(--hub-skala))] font-bold">
        Jak chcesz odebrać szczegóły i adres?
      </p>

      {/*
        Wszystkie trzy sposoby odbioru są widoczne zawsze, też w buildzie produkcyjnym.
        Druk to na razie sam front — rozwiązuje się na timerze, bez backendu — więc jego
        panel niesie widoczną adnotację o trybie demonstracyjnym. SMS idzie naprawdę
        (HAC-21, textbee.dev), a gdy się nie uda, panel kieruje do kodu QR. Kod QR działa naprawdę.
      */}
      {state.kind === 'none' && (
        <div className="grid grid-cols-3 gap-4">
          <Option icon={IconPrinter} label="Wydrukuj" hint="Kartka z adresem i opisem" onClick={() => setState({ kind: 'print', done: false })} />
          <Option icon={IconDeviceMobileMessage} label="SMS" hint="Wyślę na Twój telefon" onClick={() => setState({ kind: 'sms', phase: 'form', number: '' })} />
          <Option icon={IconQrcode} label="Kod QR" hint="Zeskanujesz telefonem" onClick={() => setState({ kind: 'qr' })} />
        </div>
      )}

      {state.kind !== 'none' && (
        <p className="hub-tekst-s text-[var(--hub-tekst-2)]">
          <span className="font-semibold text-foreground">Wybrane rozwiązanie: </span>
          {title}
        </p>
      )}

      {state.kind === 'print' && <Print done={state.done} onDone={() => setState({ kind: 'print', done: true })} onBack={() => setState({ kind: 'none' })} />}
      {state.kind === 'sms' && <Sms id={id} state={state} setState={setState} onQr={() => setState({ kind: 'qr' })} />}
      {state.kind === 'qr' && <Qr id={id} onBack={() => setState({ kind: 'none' })} />}
    </section>
  )
}

function Option({ icon: Icon, label, hint, onClick }: { icon: typeof IconPrinter; label: string; hint: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn(TILE, 'min-h-[184px] justify-center rounded-[28px] bg-card')}>
      <Icon aria-hidden="true" className="size-12 text-[var(--hub-niebieski-ciemny)]" />
      <span className="hub-tekst-m font-bold">{label}</span>
      <span className="hub-tekst-xs text-[var(--hub-tekst-2)]">{hint}</span>
    </button>
  )
}

function Print({ done, onDone, onBack }: { done: boolean; onDone: () => void; onBack: () => void }) {
  useSimulatedDelay(!done, onDone)

  return (
    <div className="flex flex-col items-center gap-4 rounded-[28px] border border-border bg-card p-8 text-center">
      <IconPrinter aria-hidden="true" className="size-14 text-[var(--hub-niebieski-ciemny)]" />
      <p role="status" className="text-[32px] font-bold">
        {done ? 'Gotowe - kartka czeka' : 'Drukuję kartkę z adresem…'}
      </p>
      <p className="hub-tekst-s text-[var(--hub-tekst-2)]">Odbierz ją z drukarki pod ekranem.</p>
      <DemoNote />
      {done && (
        <button type="button" onClick={onBack} className={CTA_MUTED}>
          Wybierz inny sposób
        </button>
      )}
    </div>
  )
}

function Sms({ id, state, setState, onQr }: { id: string; state: Extract<Takeaway, { kind: 'sms' }>; setState: (next: Takeaway) => void; onQr: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const outcomeRef = useRef<HTMLParagraphElement>(null)
  const valid = isPhone(state.number)
  const send = useMutation(trpc.kiosk.sendResultSms.mutationOptions())

  // Panel zastąpił kafelek, który go otworzył, więc fokus musi za nim pójść —
  // inaczej czytnik ekranu zostałby na elemencie, którego już nie ma.
  // Tak samo po wysyłce: przycisk znika, więc fokus idzie na komunikat o wyniku.
  useEffect(() => {
    if (state.phase === 'form') inputRef.current?.focus()
    if (state.phase === 'sent' || state.phase === 'failed') outcomeRef.current?.focus()
  }, [state.phase])

  if (state.phase === 'sent') {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[28px] border border-border bg-card p-8 text-center">
        <IconCheck aria-hidden="true" className="size-14 text-[var(--hub-niebieski-ciemny)]" />
        <p ref={outcomeRef} tabIndex={-1} role="status" className="text-[calc(26px*var(--hub-skala))] font-bold outline-none">
          Wysłano SMS
        </p>
        <p className="hub-tekst-s text-[var(--hub-tekst-2)]">Link do opisu i adresu jest w drodze na numer kończący się na {state.number}.</p>
      </div>
    )
  }

  if (state.phase === 'failed') {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[28px] border border-border bg-card p-8 text-center">
        <p ref={outcomeRef} tabIndex={-1} role="alert" className="text-[calc(26px*var(--hub-skala))] font-bold outline-none">
          Nie udało się wysłać SMS-a
        </p>
        <p className="hub-tekst-s text-[var(--hub-tekst-2)]">Sprawdź numer albo zeskanuj kod QR telefonem.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <button type="button" onClick={() => setState({ ...state, phase: 'form' })} className={CTA_OUTLINE}>
            Popraw numer
          </button>
          <button type="button" onClick={onQr} className={cn(CTA, 'h-[72px] text-[22px]')}>
            Pokaż kod QR
          </button>
        </div>
      </div>
    )
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-[28px] border border-border bg-card p-8"
      onSubmit={(event) => {
        event.preventDefault()
        if (!valid || send.isPending) return
        setState({ ...state, phase: 'sending' })
        send.mutate(
          { innovationId: id, phone: state.number },
          {
            // Z kiosku znika cały numer; zostają tylko 3 ostatnie cyfry do potwierdzenia.
            onSuccess: () => {
              trackAction(id, 'sms')
              setState({ kind: 'sms', phase: 'sent', number: state.number.replace(/\D/g, '').slice(-3) })
            },
            onError: () => setState({ ...state, phase: 'failed' }),
          },
        )
      }}
    >
      <p className="text-[calc(26px*var(--hub-skala))] font-bold">Wyślę SMS z linkiem do opisu i adresu</p>

      <label htmlFor="hub-telefon" className="hub-tekst-s font-semibold">
        Numer telefonu
      </label>
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="text-[28px] font-semibold text-[var(--hub-tekst-2)]">
          +48
        </span>
        <input
          ref={inputRef}
          id="hub-telefon"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={state.number}
          onChange={(event) => setState({ ...state, number: event.target.value })}
          placeholder="np. 123 456 789"
          aria-describedby="hub-sms-info"
          className={cn(FIELD, 'h-[76px] text-[32px]')}
        />
      </div>
      <p id="hub-sms-info" className="hub-tekst-xs text-muted-foreground">
        Numer służy tylko do wysłania tej wiadomości. Nigdzie go nie zapisuję.
      </p>
      {state.phase === 'sending' && (
        <p role="status" className="sr-only">
          Wysyłam SMS…
        </p>
      )}

      <div className="flex flex-wrap gap-4">
        <button type="button" onClick={() => setState({ kind: 'none' })} className={CTA_OUTLINE}>
          Anuluj
        </button>
        <button type="submit" disabled={!valid || state.phase === 'sending'} className={cn(CTA, 'h-[72px] text-[22px] disabled:opacity-50')}>
          {state.phase === 'sending' ? 'Wysyłam…' : 'Wyślij SMS'}
        </button>
      </div>
    </form>
  )
}

function Qr({ id, onBack }: { id: string; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[28px] border border-border bg-card p-8 text-center">
      <p className="text-[calc(28px*var(--hub-skala))] font-bold">Zeskanuj kod aparatem w telefonie</p>
      <QrCode
        value={`${PUBLIC_URL}/innowacja/${encodeURIComponent(id)}`}
        label="Kod QR z adresem strony tej innowacji"
        className="size-64"
      />
      <p className="hub-tekst-s text-[var(--hub-tekst-2)]">
        Otworzysz opis i adres na swoim telefonie. Kod nie zawiera Twoich danych.
      </p>

      {/*
        Cichy kod QR prowadzący donikąd jest gorszy niż brak kodu: mieszkaniec skanuje,
        nic się nie otwiera i nie wie dlaczego. Ostrzegamy obsługę zawczasu.
      */}
      {UNREACHABLE_FROM_PHONE && (
        <p className="hub-tekst-xs rounded-2xl bg-[var(--hub-bursztyn-jasny)] px-4 py-2 text-[var(--hub-bursztyn)]">
          Kod prowadzi na <code>{PUBLIC_URL}</code>, czyli adres lokalny kiosku - telefon go nie otworzy.
          Ustaw <code>VITE_PUBLIC_URL</code> na publiczny adres aplikacji.
        </p>
      )}
      <button type="button" onClick={onBack} className={CTA_MUTED}>
        Wybierz inny sposób
      </button>
    </div>
  )
}

/** Żeby nikt nie wziął symulacji za działającą usługę — ani mieszkaniec, ani zespół. */
function DemoNote() {
  return (
    <p className="hub-tekst-xs rounded-2xl bg-[var(--hub-bursztyn-jasny)] px-4 py-2 text-[var(--hub-bursztyn)]">
      Tryb demonstracyjny - nic nie zostało naprawdę wydrukowane.
    </p>
  )
}

function useSimulatedDelay(active: boolean, onDone: () => void) {
  const latest = useRef(onDone)
  useEffect(() => {
    latest.current = onDone
  })

  useEffect(() => {
    if (!active) return
    const timer = setTimeout(() => latest.current(), SIMULATED_MS)
    return () => clearTimeout(timer)
  }, [active])
}
