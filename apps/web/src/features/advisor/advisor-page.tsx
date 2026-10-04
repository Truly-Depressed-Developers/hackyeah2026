import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { IconArrowLeft, IconSparkles } from '@tabler/icons-react'
import { cn } from 'cn'
import { useT, type MessageKey } from '@/lib/i18n'
import { APPLICANT_TYPES, AdvisorForm, WHOLE_REGION, powiatLabel, type AdvisorFormValues } from './advisor-form'
import { AdvisorProgress } from './advisor-progress'
import { AdvisorResult } from './advisor-result'
import type { AdvisorInput } from './advisor-stream'
import { aiBadge } from './advisor-ui'
import { EmailDialog } from './email-dialog'
import { useAdvisor } from './use-advisor'

type Phase = 'form' | 'run' | 'result'

const LEAD: Record<Phase, MessageKey> = {
  form: 'advisor.lead.form',
  run: 'advisor.lead.run',
  result: 'advisor.lead.result',
}

const backButton =
  'inline-flex max-w-full min-h-11 w-fit items-center gap-2 rounded-full bg-white py-2 pr-[1.125rem] pl-3.5 text-left text-[0.9375rem] font-semibold text-wrap text-foreground shadow-[0_0_0_1px_var(--border)] hover:bg-[#F6F8FB] focus-visible:outline-3 focus-visible:outline-offset-[3px] focus-visible:outline-ring'

// The AI service takes the region as "małopolskie" and cities without the "m." prefix.
function toInput(values: AdvisorFormValues): AdvisorInput {
  const powiat = values.powiat === WHOLE_REGION ? 'małopolskie' : values.powiat.replace(/^m\.\s*/, '')
  return { query: values.query.trim(), powiat, applicantType: values.applicantType }
}

export function AdvisorPage({ initialQuery }: { initialQuery?: string }) {
  const t = useT()
  const [phase, setPhase] = useState<Phase>('form')
  const [values, setValues] = useState<AdvisorFormValues>({ query: initialQuery ?? '', powiat: WHOLE_REGION, applicantType: 'JST' })
  const [mailOpen, setMailOpen] = useState(false)
  const advisor = useAdvisor()

  function go(next: Phase) {
    setPhase(next)
    window.scrollTo(0, 0)
  }

  function run() {
    advisor.start(toInput(values))
    go('run')
  }

  function backToForm() {
    advisor.reset()
    go('form')
  }

  const applicant = APPLICANT_TYPES.find((type) => type.value === values.applicantType)
  const context = `${powiatLabel(values.powiat, t)} · ${applicant ? t(applicant.label) : values.applicantType}`

  return (
    <>
      <section aria-labelledby="advisor-title" className="overflow-hidden border-b bg-hero-gradient">
        <div className="mx-auto flex w-full max-w-[73.75rem] flex-col gap-[1.375rem] px-4 pt-8 pb-10 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {phase === 'form' ? (
              <Link to="/" search={{}} className={backButton}>
                <IconArrowLeft aria-hidden="true" className="size-5" />
                {t('advisor.back')}
              </Link>
            ) : (
              <button type="button" onClick={backToForm} className={backButton}>
                <IconArrowLeft aria-hidden="true" className="size-5" />
                {t('advisor.changeIdea')}
              </button>
            )}
            <span className={cn(aiBadge, 'bg-white shadow-[0_0_0_1px_#DCD3FF,0_4px_12px_-6px_rgb(63_45_156/0.25)]')}>
              <IconSparkles aria-hidden="true" />
              {t('advisor.badge')}
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            <h1 id="advisor-title" className="text-[2.25rem] leading-[2.75rem] font-[650] tracking-[-0.03em]">
              {phase === 'result' ? t('advisor.resultTitle') : t('advisor.title')}
            </h1>
            <p className="max-w-[47.5rem] text-lg leading-7 text-[#3B4757]">{t(LEAD[phase])}</p>
          </div>
        </div>
      </section>

      <div className="flex flex-1 flex-col px-4 pt-10 pb-18 sm:px-6">
        {phase === 'form' && <AdvisorForm values={values} onChange={setValues} onSubmit={run} />}
        {phase === 'run' && <AdvisorProgress state={advisor.state} onShowResult={() => go('result')} onCancel={backToForm} onRetry={run} />}
        {phase === 'result' && (
          <>
            <AdvisorResult
              state={advisor.state}
              query={values.query.trim()}
              context={context}
              onEmail={() => setMailOpen(true)}
              onAgain={() => {
                setValues({ query: '', powiat: WHOLE_REGION, applicantType: 'JST' })
                backToForm()
              }}
            />
            <EmailDialog open={mailOpen} onOpenChange={setMailOpen} query={values.query.trim()} markdown={advisor.state.markdown} />
          </>
        )}
      </div>
    </>
  )
}
