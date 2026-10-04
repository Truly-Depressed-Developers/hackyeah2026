import { IconArrowRight, IconCheck, IconSparkles } from '@tabler/icons-react'
import { cn } from 'cn'
import { ghostButton, primaryButton } from '@/components/resident/controls'
import { STEP_IDS, type StepId } from './advisor-stream'
import { aiBadge, panel, panelTitle } from './advisor-ui'
import { LiveDraft } from './live-draft'
import type { AdvisorState } from './use-advisor'

// The design's wording rather than the AI service's step titles, which read like log lines.
const STEPS: Record<StepId, { title: string; hint: string }> = {
  step_parse: { title: 'Założenia', hint: 'Rozumiem, czego dotyczy pomysł' },
  step_diagnosis: { title: 'Raporty ROPS', hint: 'Szukam potrzeb w 51 badaniach regionalnych' },
  step_innovation: { title: 'Baza innowacji', hint: 'Dobieram przetestowany model spośród 114' },
  step_grant_check: { title: 'Nabór i finansowanie', hint: 'Sprawdzam, czy pomysł pasuje do naboru' },
  step_synthesis: { title: 'Szkic wniosku', hint: 'Przygotowuję ocenę, budżet i dokument' },
}

const LOG_SIZE = 4

const focusOnMount = (element: HTMLElement | null) => element?.focus()

interface AdvisorProgressProps {
  state: AdvisorState
  onShowResult: () => void
  onCancel: () => void
  onRetry: () => void
}

export function AdvisorProgress({ state, onShowResult, onCancel, onRetry }: AdvisorProgressProps) {
  const done = state.status === 'done'
  const activeIndex = state.active ? STEP_IDS.indexOf(state.active) : STEP_IDS.length - 1
  const log = done ? [...state.log, 'Gotowe. Wynik analizy czeka na Ciebie.'] : state.log

  const showDraft = state.markdown !== '' || state.active === 'step_synthesis'

  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto grid w-full max-w-[73.75rem] items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <section aria-labelledby="advisor-run-title" className={cn(panel, 'gap-[1.375rem]')}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="advisor-run-title" className={panelTitle}>
              {done ? 'Analiza zakończona' : 'Analizuję Twój pomysł'}
            </h2>
            <span role="status" className="text-[0.9375rem] font-semibold text-[#3B4757]">
              {done ? '5 z 5 kroków' : `Krok ${activeIndex + 1} z 5`}
            </span>
          </div>

          <ol className="flex flex-col">
            {STEP_IDS.map((id, i) => {
              const status = state.completed.includes(id) ? 'done' : id === state.active ? 'on' : 'wait'
              return (
                <li key={id} className="group relative flex gap-4 pb-[1.375rem] last:pb-0" data-status={status}>
                  {i < STEP_IDS.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute top-[2.875rem] bottom-1 left-[1.3125rem] w-0.5 rounded-sm bg-border group-data-[status=done]:bg-[#9ED7BF]"
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className="relative z-1 flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-[0.9375rem] font-bold text-muted-foreground shadow-[inset_0_0_0_2px_var(--border)] group-data-[status=done]:bg-[#E2F4EC] group-data-[status=done]:text-[#0F6B4F] group-data-[status=done]:shadow-none group-data-[status=on]:animate-pulse group-data-[status=on]:bg-primary group-data-[status=on]:text-white group-data-[status=on]:shadow-[0_0_0_6px_rgb(34_99_173/0.15)] motion-reduce:animate-none"
                  >
                    {status === 'done' ? <IconCheck className="size-5" /> : i + 1}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-[1.0625rem] leading-6 font-[650] group-data-[status=wait]:text-muted-foreground">{STEPS[id].title}</span>
                    <span className="text-sm leading-5 text-muted-foreground">{STEPS[id].hint}</span>
                    <span className="mt-1 inline-flex h-6 w-fit items-center rounded-full bg-muted px-2.5 text-xs font-semibold text-muted-foreground group-data-[status=done]:bg-[#E2F4EC] group-data-[status=done]:text-[#0F6B4F] group-data-[status=on]:bg-primary-soft group-data-[status=on]:text-primary-strong">
                      {status === 'done' ? 'Gotowe' : status === 'on' ? 'W toku…' : 'Czeka'}
                    </span>
                  </span>
                </li>
              )
            })}
          </ol>

          {state.status === 'error' && (
            <div role="alert" className="flex flex-col items-start gap-3 rounded-[1.125rem] border border-destructive p-5">
              <p className="font-semibold text-destructive">
                {state.error === 'rate-limit' ? 'Za dużo analiz w krótkim czasie. Spróbuj ponownie za kilka minut.' : 'Doradca przerwał analizę. Spróbuj jeszcze raz.'}
              </p>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={onRetry} className={primaryButton}>
                  Spróbuj ponownie
                </button>
                <button type="button" onClick={onCancel} className={ghostButton}>
                  Zmień pomysł
                </button>
              </div>
            </div>
          )}

          {done && (
            <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 rounded-[1.125rem] bg-[#F2FAF6] px-5 py-[1.125rem] shadow-[inset_0_0_0_1px_#BFE3D2]">
              <span className="flex flex-col gap-0.5">
                <span className="text-[1.0625rem] font-[650] text-[#0F5F45]">Analiza jest gotowa</span>
                <span className="text-[0.9375rem] text-[#3B4757]">Zobacz ocenę, dopasowany nabór i szkic wniosku.</span>
              </span>
              {/* Focused on mount: the step list the user was watching has nothing left to do. */}
              <button type="button" ref={focusOnMount} onClick={onShowResult} className={primaryButton}>
                Zobacz wynik analizy
                <IconArrowRight aria-hidden="true" />
              </button>
            </div>
          )}
        </section>

        <aside aria-label="Postęp analizy" className="flex flex-col gap-4">
          <div className={cn(panel, 'gap-3.5 px-6 py-[1.375rem]')}>
            <span className={aiBadge}>
              <IconSparkles aria-hidden="true" />
              Co teraz robi doradca
            </span>
            <ul className="flex flex-col gap-2.5">
              {log.slice(-LOG_SIZE).map((line, i) => (
                <li key={`${log.length}-${i}`} className="flex items-start gap-2.5 text-[0.9375rem] leading-[1.375rem] text-[#26303D]">
                  <IconSparkles aria-hidden="true" className="mt-0.5 size-[1.125rem] shrink-0 text-[#6A4FE0]" />
                  <span className="min-w-0 break-words">{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={cn(panel, 'gap-3.5 px-6 py-[1.375rem]')}>
            <span className="text-base font-[650]">Przeszukiwane zasoby ROPS</span>
            <dl className="grid grid-cols-3 gap-2.5">
              {[
                ['51', 'raportów badawczych'],
                ['114', 'innowacji'],
                ['31', 'regulaminów naborów'],
              ].map(([value, label]) => (
                <div key={label} className="flex flex-col-reverse gap-0.5 rounded-[0.875rem] bg-muted px-3 py-3">
                  <dt className="text-[0.8125rem] leading-[1.125rem] break-words text-muted-foreground">{label}</dt>
                  <dd className="text-lg font-[650]">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {state.status === 'running' && (
            <button type="button" onClick={onCancel} className={cn(ghostButton, 'self-start')}>
              Przerwij
            </button>
          )}
        </aside>
      </div>

      {showDraft && <LiveDraft markdown={state.markdown} writing={state.status === 'running'} />}
    </div>
  )
}
