import { useState, type FormEvent } from 'react'
import { IconChevronDown, IconSparkles } from '@tabler/icons-react'
import { FieldErrorText, labelClass, primaryButton } from '@/components/resident/controls'
import { VoiceButton } from '@/components/search/voice-button'
import { VoiceDialog } from '@/components/search/voice-dialog'
import { unavailableHint } from '@/components/search/voice-search'
import { useT, type MessageKey, type Translate } from '@/lib/i18n'
import { probeVoiceSupport } from '@/lib/speech-recognition'
import { cn } from '@/lib/utils'
import type { ApplicantType } from './advisor-stream'
import { panel, panelTitle } from './advisor-ui'

export const WHOLE_REGION = 'Cała Małopolska'

const POWIATY = [
  'bocheński', 'brzeski', 'chrzanowski', 'dąbrowski', 'gorlicki', 'krakowski', 'limanowski', 'miechowski', 'myślenicki', 'nowosądecki',
  'nowotarski', 'olkuski', 'oświęcimski', 'proszowicki', 'suski', 'tarnowski', 'tatrzański', 'wadowicki', 'wielicki',
]
const CITIES = ['m. Kraków', 'm. Nowy Sącz', 'm. Tarnów']

export const APPLICANT_TYPES: { value: ApplicantType; label: MessageKey; hint: MessageKey }[] = [
  { value: 'JST', label: 'advisor.applicant.jst', hint: 'advisor.applicant.jstHint' },
  { value: 'NGO', label: 'advisor.applicant.ngo', hint: 'advisor.applicant.ngoHint' },
  { value: 'PES', label: 'advisor.applicant.pes', hint: 'advisor.applicant.pesHint' },
]

// The example texts stay Polish in every UI language: they go to the AI service, which works on Polish data.
const EXAMPLES: { label: MessageKey; text: string }[] = [
  { label: 'advisor.form.exampleSeniors', text: 'Koordynator kompleksowej opieki w miejscu zamieszkania oraz wsparcie wytchnieniowe dla opiekunów niesamodzielnych seniorów.' },
  { label: 'advisor.form.exampleBathrooms', text: 'Mobilne łazienki dla osób starszych i z niepełnosprawnościami na terenach wiejskich.' },
  { label: 'advisor.form.exampleYouth', text: 'Wsparcie usamodzielnienia młodzieży opuszczającej pieczę zastępczą.' },
]

const MAX_LENGTH = 1500

const voiceSupport = probeVoiceSupport()

export interface AdvisorFormValues {
  query: string
  powiat: string
  applicantType: ApplicantType
}

export function powiatLabel(powiat: string, t: Translate) {
  if (powiat === WHOLE_REGION) return t('advisor.form.wholeRegion')
  if (CITIES.includes(powiat)) return t('advisor.form.city', { name: powiat.replace(/^m\.\s*/, '') })
  return t('advisor.form.powiat', { name: powiat })
}

export function AdvisorForm({ values, onChange, onSubmit }: { values: AdvisorFormValues; onChange: (values: AdvisorFormValues) => void; onSubmit: () => void }) {
  const t = useT()
  const [error, setError] = useState(false)
  const [listening, setListening] = useState(false)

  function setQuery(query: string) {
    setError(false)
    onChange({ ...values, query })
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!values.query.trim()) {
      setError(true)
      document.getElementById('advisor-query')?.focus()
      return
    }
    onSubmit()
  }

  return (
    <div className="mx-auto grid w-full max-w-[73.75rem] items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
      <form onSubmit={submit} noValidate aria-labelledby="advisor-form-title" className={cn(panel, 'gap-[1.375rem]')}>
        <h2 id="advisor-form-title" className={panelTitle}>
          {t('advisor.form.title')}
        </h2>

        <div className="flex flex-col gap-2.5">
          <label htmlFor="advisor-query" className={labelClass}>
            {t('advisor.form.queryLabel')}
          </label>
          <div className="relative">
            <textarea
              id="advisor-query"
              value={values.query}
              onChange={(event) => setQuery(event.target.value)}
              maxLength={MAX_LENGTH}
              placeholder={t('advisor.form.queryPlaceholder')}
              aria-invalid={error || undefined}
              aria-describedby={error ? 'advisor-query-error' : undefined}
              className="min-h-[9.375rem] w-full resize-none rounded-[1.25rem] border border-input bg-white py-[1.125rem] pr-[5.5rem] pl-5 text-lg leading-7 outline-none placeholder:text-muted-foreground focus:border-primary focus:shadow-[0_0_0_4px_rgb(34_99_173/0.18)] aria-invalid:border-[#D92D20] aria-invalid:bg-[#FFFBFA] aria-invalid:shadow-[0_0_0_4px_rgb(217_45_32/0.14)]"
            />
            <div className="absolute right-3.5 bottom-3.5">
              <VoiceButton
                label={t('advisor.form.voice')}
                onClick={() => setListening(true)}
                unavailable={!voiceSupport.usable}
                unavailableHint={unavailableHint(voiceSupport.secureContext)}
              />
            </div>
          </div>
          <VoiceDialog
            open={listening}
            onOpenChange={setListening}
            title={t('advisor.form.queryLabel')}
            confirmLabel={t('advisor.form.voiceConfirm')}
            idleHint={t('advisor.form.voiceIdle')}
            readyHint={t('advisor.form.voiceReady')}
            onConfirm={(text) => setQuery(values.query.trim() ? `${values.query.trim()} ${text}` : text)}
          />
          <FieldErrorText id="advisor-query-error" error={error ? { message: t('advisor.form.queryError') } : undefined} />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('advisor.form.examples')}</span>
            {EXAMPLES.map((example) => (
              <button
                key={example.label}
                type="button"
                onClick={() => setQuery(example.text)}
                className="inline-flex min-h-9 items-center rounded-full bg-muted px-3.5 py-1 text-sm font-medium text-[#1F2A3A] hover:bg-border focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {t(example.label)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <label htmlFor="advisor-powiat" className={labelClass}>
            {t('advisor.form.powiatLabel')}
          </label>
          <div className="relative">
            <select
              id="advisor-powiat"
              value={values.powiat}
              onChange={(event) => onChange({ ...values, powiat: event.target.value })}
              className="h-[3.75rem] w-full cursor-pointer appearance-none rounded-full border border-input bg-white pr-[3.25rem] pl-[1.375rem] text-lg outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgb(34_99_173/0.18)]"
            >
              {[WHOLE_REGION, ...POWIATY, ...CITIES].map((powiat) => (
                <option key={powiat} value={powiat}>
                  {powiatLabel(powiat, t)}
                </option>
              ))}
            </select>
            <IconChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-5 size-5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <fieldset className="flex flex-col gap-2.5">
          <legend className={cn(labelClass, 'mb-2.5')}>{t('advisor.form.applicantLabel')}</legend>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {APPLICANT_TYPES.map((type) => (
              <label
                key={type.value}
                className="flex cursor-pointer flex-col gap-1 rounded-[1.125rem] border bg-white px-4 py-3.5 hover:border-input hover:bg-[#FAFBFD] has-checked:border-primary has-checked:bg-[#F5F9FE] has-checked:shadow-[inset_0_0_0_1px_var(--primary)] has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring"
              >
                <span className="flex items-center justify-between gap-2 text-base font-[650]">
                  {t(type.label)}
                  <input
                    type="radio"
                    name="applicant-type"
                    value={type.value}
                    checked={values.applicantType === type.value}
                    onChange={() => onChange({ ...values, applicantType: type.value })}
                    className="size-6 shrink-0 cursor-pointer accent-primary outline-none"
                  />
                </span>
                <span className="text-sm leading-5 text-muted-foreground">{t(type.hint)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex justify-end pt-1">
          <button type="submit" className={primaryButton}>
            <IconSparkles aria-hidden="true" />
            {t('advisor.form.submit')}
          </button>
        </div>
      </form>

      <aside aria-label={t('advisor.form.aboutLabel')} className="flex flex-col gap-4">
        <div className="flex flex-col gap-3.5 rounded-3xl border border-[#CFDDF0] bg-[linear-gradient(135deg,#F3F7FD,#FFFFFF_60%)] px-6 py-6">
          <span className="text-[0.8125rem] font-bold tracking-[0.06em] text-primary uppercase">{t('advisor.form.currentCall')}</span>
          <span className="text-[1.375rem] leading-7 font-[650] tracking-[-0.02em]">Usługa Wrażliwa - II nabór</span>
          <dl className="grid grid-cols-2 gap-2.5">
            {[
              ['600 000 zł', t('advisor.form.maxAmount')],
              ['100%', t('advisor.form.coFinancing')],
            ].map(([value, label]) => (
              <div key={label} className="flex flex-col-reverse gap-0.5 rounded-[0.875rem] border bg-white px-3.5 py-3">
                <dt className="text-[0.8125rem] text-muted-foreground">{label}</dt>
                <dd className="text-lg leading-6 font-[650]">{value}</dd>
              </div>
            ))}
          </dl>
          <span className="text-sm leading-5 text-muted-foreground">{t('advisor.form.otherSources')}</span>
        </div>

        <div className={cn(panel, 'gap-3.5 px-6 py-[1.375rem]')}>
          <span className="text-base font-[650]">{t('advisor.form.checksTitle')}</span>
          <ol className="flex flex-col gap-3">
            {[
              t('advisor.form.check1'),
              t('advisor.form.check2'),
              t('advisor.form.check3'),
              t('advisor.form.check4'),
              t('advisor.form.check5'),
            ].map((item, i) => (
              <li key={item} className="flex items-start gap-3 text-[0.9375rem] leading-[1.375rem] text-[#26303D]">
                <span aria-hidden="true" className="flex size-[1.625rem] shrink-0 items-center justify-center rounded-full bg-primary-soft text-[0.8125rem] font-bold text-primary-strong">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </div>
  )
}
