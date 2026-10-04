import { useState, type ReactNode } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Navigate, useNavigate, useRouter } from '@tanstack/react-router'
import { IconAlertCircle, IconArrowLeft, IconArrowRight, IconCheck, IconDots } from '@tabler/icons-react'
import { cn } from 'cn'
import { CategoryIcon } from '@/components/category-badge'
import { VoiceButton } from '@/components/search/voice-button'
import { VoiceDialog } from '@/components/search/voice-dialog'
import { unavailableHint } from '@/components/search/voice-search'
import { storedGapId } from '@/features/no-result/use-gap'
import { currentSearchId, currentSearchQuery } from '@/lib/analytics'
import { useIdeaTracking } from '@/lib/use-analytics'
import { CATEGORIES, type Category } from '@/lib/categories'
import { probeVoiceSupport } from '@/lib/speech-recognition'
import { trpc } from '@/lib/trpc'
import { ideaSchema, OTHER_GROUP, QUESTIONS, STAGES, STEP_FIELDS, TOTAL_STEPS, stageTitle, toAnswers, type IdeaValues } from './idea-form'

const OTHER_CATEGORY: Category = { slug: 'other', label: OTHER_GROUP, icon: IconDots, gradient: ['#E2E8F0', '#A8B5C7'], onGradient: '#0F1B2D', tint: '' }

const voiceSupport = probeVoiceSupport()

// Consent is given at the moment the resident sends the form.
const consentGivenNow = () => new Date()

// Each step mounts a new heading; focusing it on mount moves screen-reader and keyboard users to the new question.
const focusOnMount = (element: HTMLHeadingElement | null) => element?.focus()

type FieldError = { message?: string } | undefined

type Props = { step: number; query: string | undefined }

export function IdeaWizard({ step, query }: Props) {
  const navigate = useNavigate({ from: '/pomysl' })
  const router = useRouter()
  // A refresh or deep link mid-way has no answers in memory, so it starts over at step 1.
  const [entered, setEntered] = useState(step === 1)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const submit = useMutation(trpc.ideas.submit.mutationOptions())

  const form = useForm<IdeaValues>({
    resolver: zodResolver(ideaSchema),
    defaultValues: { title: query ?? '', essence: '', groups: [], stage: '', name: '', contact: '', consent: false },
    reValidateMode: 'onChange',
  })
  const values = useWatch({ control: form.control })
  // Only link the Pomysł to the Wyszukiwanie it came from, not to an older one still in the session.
  const searchId = query && currentSearchQuery() === query ? currentSearchId() : undefined
  useIdeaTracking(step, TOTAL_STEPS, step > TOTAL_STEPS, searchId)
  const { errors } = form.formState

  if (!entered && step === 1) setEntered(true)

  if (!entered || (step > TOTAL_STEPS && !sentTo)) {
    return <Navigate to="/pomysl" search={{ q: query, krok: 1 }} replace />
  }

  const done = step > TOTAL_STEPS
  const leave = () => navigate({ to: '/', search: query ? { q: query } : {} })
  const goTo = (target: number) => navigate({ search: { q: query, krok: target } })

  async function next() {
    if (step < TOTAL_STEPS) {
      if (await form.trigger(STEP_FIELDS[step])) goTo(step + 1)
      return
    }
    const valid = await form.trigger()
    if (!valid) return
    const data = form.getValues()
    await submit.mutateAsync({
      title: data.title,
      answers: toAnswers(data),
      contact: data.contact,
      consentAt: consentGivenNow(),
      search: query ? { query, shownResults: [], gapId: storedGapId(query), searchId } : undefined,
    })
    setSentTo(data.contact)
    navigate({ search: { q: query, krok: TOTAL_STEPS + 1 }, replace: true })
  }

  function back() {
    if (step === 1) leave()
    else router.history.back()
  }

  return (
    <>
      <section aria-labelledby="idea-title" className="border-b bg-hero-gradient">
        <div className="mx-auto flex w-full max-w-[54.25rem] flex-col gap-7 px-4 py-8 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={leave} className={backButton}>
              <IconArrowLeft aria-hidden="true" className="size-[1.125rem]" />
              {query ? 'Wróć do wyników' : 'Wróć do strony głównej'}
            </button>
            {!done && (
              <span className="text-[0.9375rem] leading-5 font-semibold text-[#3B4757]">
                Krok {step} z {TOTAL_STEPS}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-[1.125rem]">
            <h1 id="idea-title" className="text-[1.375rem] leading-7 font-[650] tracking-[-0.02em]">
              Zgłoś pomysł na rozwiązanie
            </h1>
            {!done && (
              <div
                role="progressbar"
                aria-label="Postęp zgłoszenia"
                aria-valuemin={1}
                aria-valuemax={TOTAL_STEPS}
                aria-valuenow={step}
                aria-valuetext={`Krok ${step} z ${TOTAL_STEPS}`}
                className="flex gap-1.5"
              >
                {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                  <span key={i} className={cn('h-1.5 flex-1 rounded-full', i < step ? 'bg-primary' : 'bg-foreground/10')} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="flex flex-1 flex-col px-4 pt-12 pb-7 sm:px-6">
        {done ? (
          <div role="status" className={cn(card, 'items-center pt-8 text-center')}>
            <span aria-hidden="true" className="flex size-[5.25rem] items-center justify-center rounded-full bg-[#E2F4EC] text-[#0F6B4F]">
              <IconCheck className="size-10" />
            </span>
            <h2 ref={focusOnMount} tabIndex={-1} className={cn(questionClass, 'mt-1.5')}>
              Dziękujemy za Twój pomysł!
            </h2>
            <p className="max-w-[35rem] text-[1.0625rem] leading-[1.625rem] text-[#3B4757]">
              Zgłoszenie trafiło do zespołu ROPS w Krakowie. Gdy je przejrzymy, odezwiemy się na: <strong className="text-foreground">{sentTo}</strong>
            </p>
            <button type="button" onClick={() => navigate({ to: '/', search: {} })} className={cn(primaryButton, 'mt-2')}>
              Wróć do strony głównej
            </button>
          </div>
        ) : (
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              void next()
            }}
            className="flex flex-1 flex-col"
          >
            <div className={card}>
              {step === 1 && (
                <TextStep
                  question={QUESTIONS.title}
                  help="Jednym, dwoma zdaniami: co chcesz zmienić lub usprawnić?"
                  label="Krótki opis pomysłu"
                  max={300}
                  length={values.title?.length ?? 0}
                  placeholder="Np. Sąsiedzka grupa, która po wichurze pomaga seniorom zabezpieczyć dach i zgłosić szkodę."
                  error={errors.title}
                  field={form.register('title')}
                  voiceLabel="Powiedz krótki opis pomysłu zamiast pisać"
                  onDictated={(text) => form.setValue('title', text.slice(0, 300), { shouldValidate: true, shouldDirty: true })}
                />
              )}
              {step === 2 && (
                <TextStep
                  question={QUESTIONS.essence}
                  help="Opisz, co jest w nim najważniejsze: jak by działał i czym różni się od tego, co już jest."
                  label="Istota pomysłu"
                  max={1500}
                  length={values.essence?.length ?? 0}
                  placeholder="Np. Wolontariusze z osiedla mają listę sąsiadów 70+. Po burzy obdzwaniają ich, sprawdzają szkody i pomagają wypełnić wniosek o zasiłek celowy."
                  error={errors.essence}
                  field={form.register('essence')}
                  voiceLabel="Powiedz, na czym polega pomysł, zamiast pisać"
                  onDictated={(text) => form.setValue('essence', text.slice(0, 1500), { shouldValidate: true, shouldDirty: true })}
                />
              )}
              {step === 3 && (
                <>
                  <Question id="q-groups" help="Możesz wybrać kilka grup.">
                    {QUESTIONS.groups}
                  </Question>
                  <Controller
                    control={form.control}
                    name="groups"
                    render={({ field }) => (
                      <div role="group" aria-labelledby="q-groups" className="grid grid-cols-[repeat(auto-fill,minmax(min(15rem,100%),1fr))] gap-2.5">
                        {[...CATEGORIES, OTHER_CATEGORY].map((category) => {
                          const on = field.value.includes(category.label)
                          return (
                            <button
                              key={category.slug}
                              type="button"
                              aria-pressed={on}
                              onClick={() => field.onChange(on ? field.value.filter((g) => g !== category.label) : [...field.value, category.label])}
                              className="flex min-h-15 items-center gap-3 rounded-full bg-muted py-2 pr-4 pl-2.5 text-left text-base leading-5 font-medium text-[#1F2A3A] hover:bg-border focus-visible:outline-3 focus-visible:outline-offset-[3px] focus-visible:outline-ring aria-pressed:bg-[#E3EDF9] aria-pressed:text-foreground aria-pressed:shadow-[inset_0_0_0_2px_var(--primary)]"
                            >
                              <span className="[&>span]:size-10 [&_svg]:size-[1.375rem]">
                                <CategoryIcon category={category} />
                              </span>
                              {category.label}
                              {on && (
                                <span aria-hidden="true" className="ml-auto flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                                  <IconCheck className="size-[0.9375rem]" />
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  />
                  <FieldErrorText error={errors.groups} />
                </>
              )}
              {step === 4 && (
                <>
                  <Question id="q-stage" help="Wybierz to, co najlepiej pasuje. Każdy etap jest w porządku.">
                    {QUESTIONS.stage}
                  </Question>
                  <Controller
                    control={form.control}
                    name="stage"
                    render={({ field }) => (
                      <div role="radiogroup" aria-labelledby="q-stage" className="flex flex-col gap-2.5">
                        {STAGES.map((stage) => {
                          const checked = field.value === stage.id
                          const Icon = stage.icon
                          return (
                            <button
                              key={stage.id}
                              type="button"
                              role="radio"
                              aria-checked={checked}
                              onClick={() => field.onChange(stage.id)}
                              className="group flex min-h-19 items-center gap-4 rounded-[1.25rem] border bg-white py-3 pr-5 pl-3.5 text-left hover:border-input hover:bg-[#FAFBFD] focus-visible:outline-3 focus-visible:outline-offset-[3px] focus-visible:outline-ring aria-checked:border-primary aria-checked:bg-[#F5F9FE] aria-checked:shadow-[inset_0_0_0_1px_var(--primary)]"
                            >
                              <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-[0.875rem] bg-muted text-[#3B4757] group-aria-checked:bg-[#DCE8F6] group-aria-checked:text-primary-strong">
                                <Icon className="size-6" />
                              </span>
                              <span className="flex flex-col gap-0.5">
                                <span className="text-[1.0625rem] leading-6 font-semibold">{stage.title}</span>
                                <span className="text-[0.9375rem] leading-[1.375rem] text-[#3B4757]">{stage.description}</span>
                              </span>
                              <span aria-hidden="true" className="ml-auto size-6 shrink-0 rounded-full border-2 border-input group-aria-checked:border-[7px] group-aria-checked:border-primary" />
                            </button>
                          )
                        })}
                      </div>
                    )}
                  />
                  <FieldErrorText error={errors.stage} />
                </>
              )}
              {step === 5 && (
                <>
                  <Question help="Odezwiemy się, gdy zespół ROPS przejrzy Twój pomysł.">
                    Jak możemy się z Tobą skontaktować?
                  </Question>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="idea-name" className={labelClass}>
                      Imię <span className="font-normal text-muted-foreground">(opcjonalnie)</span>
                    </label>
                    <input id="idea-name" type="text" autoComplete="given-name" placeholder="np. Anna" {...form.register('name')} className={fieldClass} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="idea-contact" className={labelClass}>
                      E-mail lub numer telefonu
                    </label>
                    <input
                      id="idea-contact"
                      type="text"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="np. anna@poczta.pl albo 600 123 456"
                      aria-invalid={errors.contact ? true : undefined}
                      aria-describedby={errors.contact ? 'idea-contact-error' : undefined}
                      {...form.register('contact')}
                      className={fieldClass}
                    />
                    <FieldErrorText id="idea-contact-error" error={errors.contact} />
                  </div>
                  <label className="flex cursor-pointer items-start gap-3 text-[0.9375rem] leading-[1.375rem] text-[#3B4757]">
                    <input
                      type="checkbox"
                      aria-invalid={errors.consent ? true : undefined}
                      aria-describedby={errors.consent ? 'idea-consent-error' : undefined}
                      {...form.register('consent')}
                      className="size-6 shrink-0 cursor-pointer accent-primary"
                    />
                    <span>
                      Zgadzam się, aby ROPS w Krakowie skontaktował się ze mną w sprawie tego pomysłu.{' '}
                      <a href="#" className="text-primary underline underline-offset-2">
                        Informacja o danych osobowych
                      </a>
                    </span>
                  </label>
                  <FieldErrorText id="idea-consent-error" error={errors.consent} />
                </>
              )}
              {step === 6 && (
                <>
                  <Question help="Jeśli coś trzeba poprawić, wybierz „Zmień”.">
                    Sprawdź swoje zgłoszenie
                  </Question>
                  <dl className="flex flex-col overflow-hidden rounded-[1.25rem] border bg-white">
                    <SummaryRow label="Krótki opis" value={values.title} editLabel="Zmień krótki opis" onEdit={() => goTo(1)} />
                    <SummaryRow label="Na czym polega" value={values.essence} editLabel="Zmień opis pomysłu" onEdit={() => goTo(2)} />
                    <SummaryRow label="Dla kogo" value={values.groups?.join(', ')} editLabel="Zmień grupy" onEdit={() => goTo(3)} />
                    <SummaryRow label="Etap" value={stageTitle(values.stage ?? '')} editLabel="Zmień etap" onEdit={() => goTo(4)} />
                    <SummaryRow
                      label="Kontakt"
                      value={[values.name?.trim(), values.contact].filter(Boolean).join(' · ')}
                      editLabel="Zmień kontakt"
                      onEdit={() => goTo(5)}
                    />
                  </dl>
                  {submit.isError && (
                    <p role="alert" className="font-medium text-[#B42318]">
                      Nie udało się wysłać pomysłu. Spróbuj ponownie za chwilę.
                    </p>
                  )}
                </>
              )}
            </div>

            <nav aria-label="Nawigacja kroków" className="mx-auto mt-auto flex w-full max-w-[51.25rem] justify-between gap-3 pt-7">
              <button type="button" onClick={back} className={lightButton}>
                <IconArrowLeft aria-hidden="true" />
                {step === 1 ? 'Anuluj' : 'Wstecz'}
              </button>
              <button type="submit" disabled={submit.isPending} className={primaryButton}>
                {step === TOTAL_STEPS ? (submit.isPending ? 'Wysyłamy…' : 'Wyślij pomysł') : 'Dalej'}
                {step < TOTAL_STEPS && <IconArrowRight aria-hidden="true" />}
              </button>
            </nav>
          </form>
        )}
      </div>
    </>
  )
}

type QuestionProps = { id?: string; help: string; children: ReactNode }

function Question({ id, help, children }: QuestionProps) {
  return (
    <>
      <h2 id={id} ref={focusOnMount} tabIndex={-1} className={questionClass}>
        {children}
      </h2>
      <p className="-mt-2 text-[1.0625rem] leading-[1.625rem] text-[#3B4757]">{help}</p>
    </>
  )
}

type TextStepProps = {
  question: string
  help: string
  label: string
  max: number
  length: number
  placeholder: string
  error: FieldError
  field: ReturnType<ReturnType<typeof useForm<IdeaValues>>['register']>
  voiceLabel: string
  onDictated: (text: string) => void
}

function TextStep({ question, help, label, max, length, placeholder, error, field, voiceLabel, onDictated }: TextStepProps) {
  const errorId = `${field.name}-error`
  const [listening, setListening] = useState(false)
  return (
    <>
      <Question help={help}>
        {question}
      </Question>
      <label htmlFor={`idea-${field.name}`} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <textarea
          id={`idea-${field.name}`}
          maxLength={max}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...field}
          className="min-h-[9.375rem] w-full resize-none rounded-[1.25rem] border border-input bg-white py-[1.125rem] pr-[5.5rem] pl-5 text-lg leading-7 outline-none placeholder:text-muted-foreground focus:border-primary focus:shadow-[0_0_0_4px_rgb(34_99_173/0.18)] aria-invalid:border-[#D92D20] aria-invalid:bg-[#FFFBFA] aria-invalid:shadow-[0_0_0_4px_rgb(217_45_32/0.14)]"
        />
        <div className="absolute right-3.5 bottom-3.5">
          <VoiceButton
            label={voiceLabel}
            onClick={() => setListening(true)}
            unavailable={!voiceSupport.usable}
            unavailableHint={unavailableHint(voiceSupport.secureContext)}
          />
        </div>
      </div>
      <VoiceDialog
        open={listening}
        onOpenChange={setListening}
        title={question}
        confirmLabel="Gotowe"
        idleHint="Naciśnij mikrofon i opowiedz o swoim pomyśle."
        readyHint="Sprawdź, czy dobrze zrozumieliśmy, i naciśnij „Gotowe”."
        onConfirm={onDictated}
      />
      <span className="-mt-3 self-end text-[0.8125rem] text-muted-foreground">
        {length} / {max}
      </span>
      <FieldErrorText id={errorId} error={error} />
    </>
  )
}

function FieldErrorText({ id, error }: { id?: string; error: FieldError }) {
  if (!error?.message) return null
  return (
    <span id={id} role="alert" className="flex items-start gap-2 px-1.5 text-[0.9375rem] leading-[1.375rem] font-medium text-[#B42318]">
      <IconAlertCircle aria-hidden="true" className="mt-px size-5 shrink-0" />
      {error.message}
    </span>
  )
}

function SummaryRow({ label, value, editLabel, onEdit }: { label: string; value: string | undefined; editLabel: string; onEdit: () => void }) {
  return (
    <div className="flex flex-wrap items-start gap-x-4 gap-y-1 border-t px-5 py-4 first:border-t-0 sm:flex-nowrap">
      <dt className="w-full text-sm leading-[1.375rem] font-semibold text-muted-foreground sm:w-[10.625rem] sm:shrink-0">{label}</dt>
      <dd className="flex min-w-0 flex-1 items-start justify-between gap-4 text-base leading-6">
        <span className="min-w-0 break-words">{value || '—'}</span>
        <button
          type="button"
          onClick={onEdit}
          aria-label={editLabel}
          className="shrink-0 rounded-md px-1 text-[0.9375rem] font-semibold text-primary hover:text-primary-strong hover:underline focus-visible:outline-3 focus-visible:outline-offset-[3px] focus-visible:outline-ring"
        >
          Zmień
        </button>
      </dd>
    </div>
  )
}

const card = 'mx-auto flex w-full max-w-[51.25rem] flex-col gap-5'
const questionClass = 'text-[1.625rem] leading-[2.125rem] font-[650] tracking-[-0.03em] outline-none sm:text-[1.875rem] sm:leading-[2.375rem]'
const labelClass = 'text-[0.9375rem] leading-5 font-semibold'
const fieldClass =
  'h-[3.75rem] w-full rounded-full border border-input bg-white px-[1.375rem] text-lg outline-none placeholder:text-muted-foreground focus:border-primary focus:shadow-[0_0_0_4px_rgb(34_99_173/0.18)] aria-invalid:border-[#D92D20] aria-invalid:bg-[#FFFBFA] aria-invalid:shadow-[0_0_0_4px_rgb(217_45_32/0.14)]'
const pill = 'inline-flex h-14 items-center justify-center gap-2.5 rounded-full px-6 text-base font-semibold focus-visible:outline-3 focus-visible:outline-offset-[3px] focus-visible:outline-ring [&_svg]:size-5'
const primaryButton = cn(pill, 'bg-primary text-primary-foreground shadow-[0_6px_14px_-6px_rgb(34_99_173/0.55)] hover:bg-primary-hover disabled:opacity-70')
const lightButton = cn(pill, 'bg-white text-foreground shadow-[0_0_0_1px_var(--border),0_1px_2px_rgb(15_27_45/0.05)] hover:shadow-[0_0_0_1px_var(--input),0_6px_14px_-8px_rgb(15_27_45/0.2)]')
const backButton =
  'inline-flex h-11 items-center gap-2 rounded-full bg-white py-0 pr-[1.125rem] pl-3.5 text-[0.9375rem] font-semibold text-foreground shadow-[0_0_0_1px_var(--border)] hover:bg-[#F6F8FB] focus-visible:outline-3 focus-visible:outline-offset-[3px] focus-visible:outline-ring'
