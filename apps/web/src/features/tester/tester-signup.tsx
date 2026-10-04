import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { IconCalendar, IconProgressCheck, IconUsers, IconClipboardList } from '@tabler/icons-react'
import { useForm } from 'react-hook-form'
import { CategoryBadge } from '@/components/category-badge'
import { FieldErrorText, fieldClass, ghostButton, labelClass, primaryButton } from '@/components/resident/controls'
import { consentGivenNow } from '@/lib/contact'
import { groupLabel, storedStageLabel } from '@/features/idea/idea-form'
import { useLang, useT } from '@/lib/i18n'
import { trpc } from '@/lib/trpc'
import { categoryOf, essenceOf, groupsOf, stageOf, testerSchema, type TestableIdea, type TesterValues } from './tester-form'
import { formatDate } from './tester-list'

interface TesterSignupProps {
  idea: TestableIdea
  onSignedUp: (values: { name: string; contact: string; alreadySignedUp: boolean }) => void
  onBack: () => void
}

export function TesterSignup({ idea, onSignedUp, onBack }: TesterSignupProps) {
  const t = useT()
  const lang = useLang()
  const signUp = useMutation(trpc.ideas.signUpForTest.mutationOptions())
  const form = useForm<TesterValues>({
    resolver: zodResolver(testerSchema),
    defaultValues: { name: '', contact: '', consent: false },
    reValidateMode: 'onChange',
  })
  const { errors } = form.formState

  async function onSubmit(values: TesterValues) {
    const result = await signUp.mutateAsync({
      ideaId: idea.id,
      name: values.name,
      contact: values.contact,
      consentAt: consentGivenNow(),
    })
    onSignedUp({ name: values.name, contact: values.contact, alreadySignedUp: result.alreadySignedUp })
  }

  const category = categoryOf(idea)
  const stage = stageOf(idea)
  const groups = groupsOf(idea)

  // grid-cols-1 at the base width: the implicit auto track would be sized by the panel's min-content
  // and push past the viewport once the text is scaled up.
  return (
    <div className="mx-auto grid w-full max-w-[67.5rem] grid-cols-1 items-stretch gap-6 px-4 pt-11 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <section
        aria-labelledby="tester-idea-title"
        className="flex min-w-0 flex-col gap-4 rounded-3xl border border-[#CFDDF0] bg-linear-[135deg,#F3F7FD,#FFFFFF_60%] px-7 py-[1.625rem]"
      >
        {category && <CategoryBadge category={category} />}

        <h2 id="tester-idea-title" className="text-2xl leading-[1.9375rem] font-[650] tracking-[-0.02em]">
          {idea.title}
        </h2>

        <p className="text-[1.0625rem] leading-[1.625rem] text-[#26303D]">{essenceOf(idea)}</p>

        <dl className="flex flex-col border-t">
          <Fact icon={IconClipboardList} label={t('tester.fact.groups')} value={groups?.split(', ').map((group) => groupLabel(t, group)).join(', ')} />
          <Fact icon={IconProgressCheck} label={t('tester.fact.stage')} value={stage && storedStageLabel(t, stage)} />
          <Fact icon={IconCalendar} label={t('tester.fact.submitted')} value={formatDate(idea.createdAt, lang)} />
          <Fact icon={IconUsers} label={t('tester.fact.testers')} value={t.count('tester.count', idea.signupCount)} />
        </dl>
      </section>

      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        aria-labelledby="tester-form-title"
        className="flex min-w-0 flex-col gap-5 rounded-3xl border bg-white px-7 py-[1.625rem]"
      >
        <div className="flex flex-col gap-1.5">
          <h2 id="tester-form-title" className="text-2xl leading-[1.9375rem] font-[650] tracking-[-0.02em]">
            {t('tester.form.title')}
          </h2>
          <p className="text-base leading-6 text-[#3B4757]">{t('tester.form.hint')}</p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="tester-name" className={labelClass}>
            {t('tester.form.name')}
          </label>
          <input
            id="tester-name"
            type="text"
            autoComplete="given-name"
            placeholder={t('tester.form.namePlaceholder')}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? 'tester-name-error' : undefined}
            className={fieldClass}
            {...form.register('name')}
          />
          <FieldErrorText id="tester-name-error" error={errors.name} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="tester-contact" className={labelClass}>
            {t('tester.form.contact')}
          </label>
          <input
            id="tester-contact"
            type="text"
            inputMode="email"
            autoComplete="email"
            placeholder={t('tester.form.contactPlaceholder')}
            aria-invalid={errors.contact ? true : undefined}
            aria-describedby={errors.contact ? 'tester-contact-error' : undefined}
            className={fieldClass}
            {...form.register('contact')}
          />
          <FieldErrorText id="tester-contact-error" error={errors.contact} />
        </div>

        <div className="mt-3.5 flex flex-1 flex-col gap-5">
          <label className="flex cursor-pointer items-start gap-3 text-[0.9375rem] leading-[1.375rem] text-[#3B4757]">
            <input
              type="checkbox"
              aria-invalid={errors.consent ? true : undefined}
              aria-describedby={errors.consent ? 'tester-consent-error' : undefined}
              className="size-6 shrink-0 cursor-pointer accent-primary"
              {...form.register('consent')}
            />
            <span>
              {t('tester.form.consent')}
            </span>
          </label>
          <FieldErrorText id="tester-consent-error" error={errors.consent} className="-mt-3 pl-9" />

          {signUp.isError && (
            <p role="alert" className="font-medium text-[#B42318]">
              {t('tester.form.error')}
            </p>
          )}

          <div className="mt-auto flex flex-wrap justify-between gap-3 pt-1">
            <button type="button" onClick={onBack} className={ghostButton}>
              {t('tester.form.other')}
            </button>
            <button type="submit" disabled={form.formState.isSubmitting} className={primaryButton}>
              {form.formState.isSubmitting ? t('tester.form.saving') : t('tester.form.submit')}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

function Fact({ icon: Icon, label, value }: { icon: typeof IconUsers; label: string; value: string | undefined }) {
  if (!value) return null
  return (
    <div className="flex gap-3.5 border-b py-3.5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-strong">
        <Icon aria-hidden="true" className="size-[1.375rem]" stroke={2} />
      </span>
      <div className="min-w-0">
        <dt className="text-[0.8125rem] leading-[1.125rem] font-semibold text-muted-foreground">{label}</dt>
        <dd className="text-base leading-6 break-words">{value}</dd>
      </div>
    </div>
  )
}
