import { Link } from '@tanstack/react-router'
import { IconCalendar, IconMail, IconProgressCheck, IconSearch, IconUsers } from '@tabler/icons-react'
import { CategoryBadge } from '@/components/category-badge'
import { storedStageLabel } from '@/features/idea/idea-form'
import { useLang, useT, type Lang } from '@/lib/i18n'
import { categoryOf, essenceOf, stageOf, type TestableIdea } from './tester-form'

const STEPS = [
  { icon: IconSearch, n: 'tester.steps.1.n', title: 'tester.steps.1.title', hint: 'tester.steps.1.hint' },
  { icon: IconMail, n: 'tester.steps.2.n', title: 'tester.steps.2.title', hint: 'tester.steps.2.hint' },
  { icon: IconCalendar, n: 'tester.steps.3.n', title: 'tester.steps.3.title', hint: 'tester.steps.3.hint' },
] as const

export const formatDate = (iso: string, lang: Lang) =>
  new Date(iso).toLocaleDateString(lang === 'en' ? 'en-GB' : 'pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })

/** The "how it works" strip; lives in the hero, above the list. */
export function TesterSteps() {
  const t = useT()
  // grid-cols-1 rather than the implicit auto track: at 200% text the min-content of a step would
  // otherwise widen the track past the viewport.
  return (
    <ol aria-label={t('tester.steps.label')} className="grid max-w-[57.5rem] grid-cols-1 gap-3 sm:grid-cols-3">
      {STEPS.map((step) => (
        <li
          key={step.n}
          className="flex min-w-0 items-center gap-3.5 rounded-[1.125rem] bg-white/80 p-4 shadow-[0_0_0_1px_rgb(207_221_240/0.9),0_6px_18px_-12px_rgb(15_27_45/0.25)]"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-[0.875rem] bg-primary-soft text-primary-strong">
            <step.icon aria-hidden="true" className="size-6" stroke={2} />
          </span>
          <span className="flex min-w-0 flex-col">
            {/* primary-strong, not primary: at 12px the lighter blue is 3.45:1 on this card, under AA. */}
            <span className="text-xs leading-4 font-bold tracking-[0.06em] text-primary-strong uppercase">{t(step.n)}</span>
            <span className="text-base leading-[1.375rem] font-semibold">{t(step.title)}</span>
            <span className="text-sm leading-5 text-muted-foreground">{t(step.hint)}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}

export function TesterList({ ideas }: { ideas: TestableIdea[] }) {
  const t = useT()
  return (
    <div className="mx-auto flex w-full max-w-[73.75rem] flex-col gap-5 px-4 pt-11 pb-16 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h2 className="text-2xl leading-8 font-[650] tracking-[-0.02em]">{t('tester.list.title')}</h2>
          <span className="text-[0.9375rem] text-muted-foreground">
            {t.count('tester.ideas', ideas.length)}
          </span>
        </div>

        {ideas.length === 0 ? (
          <p className="rounded-[1.25rem] border bg-white p-6 text-lg text-muted-foreground">
            {t('tester.list.empty')}
          </p>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(20.625rem,100%),1fr))] gap-4">
            {ideas.map((idea) => (
              <li key={idea.id} className="flex">
                <IdeaCard idea={idea} />
              </li>
            ))}
          </ul>
        )}
    </div>
  )
}

function IdeaCard({ idea }: { idea: TestableIdea }) {
  const t = useT()
  const lang = useLang()
  const category = categoryOf(idea)
  const stage = stageOf(idea)

  return (
    <Link
      to="/testy"
      search={{ pomysl: idea.id }}
      aria-label={t('tester.card.label', { title: idea.title })}
      className="flex w-full flex-col gap-3 rounded-[1.25rem] border bg-white px-[1.375rem] py-5 shadow-[0_1px_2px_0_rgb(15_27_45/0.05),0_4px_12px_-6px_rgb(15_27_45/0.08)] transition-shadow hover:border-input hover:shadow-[0_1px_2px_0_rgb(15_27_45/0.05),0_12px_28px_-10px_rgb(15_27_45/0.18)] focus-visible:outline-3 focus-visible:outline-offset-[3px] focus-visible:outline-ring"
    >
      {category && <CategoryBadge category={category} />}

      <span className="text-[1.1875rem] leading-[1.625rem] font-semibold tracking-[-0.01em]">{idea.title}</span>

      <span className="line-clamp-3 text-[0.9375rem] leading-[1.375rem] text-muted-foreground">{essenceOf(idea)}</span>

      <span className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm leading-5 text-[#3B4757]">
        {stage && (
          <span className="inline-flex items-center gap-1.5">
            <IconProgressCheck aria-hidden="true" className="size-[1.125rem] shrink-0" stroke={2} />
            {storedStageLabel(t, stage)}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <IconCalendar aria-hidden="true" className="size-[1.125rem] shrink-0" stroke={2} />
          {t('tester.submittedOn', { date: formatDate(idea.createdAt, lang) })}
        </span>
      </span>

      <span className="mt-auto flex items-center justify-between gap-4 pt-1">
        <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#E6F4EE] px-3 text-sm font-semibold text-[#0F5F45]">
          <IconUsers aria-hidden="true" className="size-4 shrink-0" stroke={2} />
          {t.count('tester.count', idea.signupCount)}
        </span>
        <span
          aria-hidden="true"
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-input bg-white px-5 text-[0.9375rem] font-semibold shadow-[0_1px_2px_0_rgb(15_27_45/0.05)]"
        >
          {t('tester.card.pick')}
        </span>
      </span>
    </Link>
  )
}
