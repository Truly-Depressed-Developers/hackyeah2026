import { useEffect, useRef, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import {
  IconArrowLeft,
  IconArrowRight,
  IconCircleCheck,
  IconCoins,
  IconDeviceMobile,
  IconDownload,
  IconExternalLink,
  IconFileTypePdf,
  IconFileZip,
  IconInfoCircle,
  IconPlayerPlayFilled,
  IconPlayerStop,
  IconRosetteDiscountCheck,
  IconUser,
  IconVolume,
} from '@tabler/icons-react'
import { cn } from 'cn'
import { CategoryIcon } from '@/components/category-badge'
import { VideoDialog, youtubeId } from '@/components/search/video-dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { $ai, type Innovation } from '@/lib/ai/client'
import { trackAction } from '@/lib/analytics'
import { categoryFor } from '@/lib/categories'
import { translator, useLang, useT } from '@/lib/i18n'
import { useInnovationTracking } from '@/lib/use-analytics'
import { useSpeech } from '@/lib/use-speech'
import { QrCode } from './qr-code'

const pillButton = 'inline-flex h-14 items-center justify-center gap-2.5 rounded-full px-6 text-base leading-none font-semibold transition-[background,box-shadow] focus-visible:outline-3 focus-visible:outline-offset-[3px] focus-visible:outline-ring [&_svg]:size-5'
const lightButton = cn(pillButton, 'bg-white text-foreground shadow-[0_0_0_1px_var(--border),0_1px_2px_rgb(15_27_45/0.05)] hover:shadow-[0_0_0_1px_var(--input),0_6px_14px_-8px_rgb(15_27_45/0.2)]')
const primaryButton = cn(pillButton, 'bg-primary text-primary-foreground shadow-[0_6px_14px_-6px_rgb(34_99_173/0.55)] hover:bg-primary-hover')
const panel = 'flex flex-col gap-3.5 rounded-[1.25rem] border bg-white p-[1.375rem] shadow-[0_1px_2px_0_rgb(15_27_45/0.05),0_4px_12px_-6px_rgb(15_27_45/0.08)]'
export function InnovationPage({ id }: { id: string }) {
  const t = useT()
  const query = $ai.useQuery('get', '/catalog/{id}', { params: { path: { id } } }, { staleTime: 10 * 60_000, retry: false })

  if (query.isPending) {
    return (
      <p role="status" className="flex items-center justify-center gap-2 px-4 py-24 text-muted-foreground">
        <Spinner />
        {t('innovation.loading')}
      </p>
    )
  }

  if (query.isError || !query.data) {
    return (
      <div role="alert" className="mx-auto flex w-full max-w-3xl flex-col items-start gap-4 px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-semibold">{t('innovation.errorTitle')}</h1>
        <p className="text-muted-foreground">{t('innovation.errorHint')}</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="h-11 px-4" onClick={() => query.refetch()}>
            {t('common.retry')}
          </Button>
          <BackLink />
        </div>
      </div>
    )
  }

  return <InnovationView item={query.data} />
}

function InnovationView({ item }: { item: Innovation }) {
  const t = useT()
  const lang = useLang()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const category = categoryFor(item.categorySlug)
  const videoId = item.links?.video ? youtubeId(item.links.video) : null
  const speech = useSpeech(readAloudText(item))
  const shareUrl = `${window.location.origin}/innowacja/${encodeURIComponent(item.id)}`
  useInnovationTracking(item.id)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  // Keyed on `lang`, not `t`: `t` is a new function every render.
  useEffect(() => {
    const tr = translator(lang)
    document.title = tr('innovation.documentTitle', { title: item.title })
    return () => {
      document.title = tr('innovation.defaultDocumentTitle')
    }
  }, [item.title, lang])

  return (
    <>
      <section aria-labelledby="innovation-title" className="border-b bg-hero">
        <div className="mx-auto flex w-full max-w-[73.75rem] flex-col gap-7 px-4 pt-6 pb-11 sm:px-6">
          <div>
            <BackLink />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {category && (
                <span className="inline-flex h-9 items-center gap-2 rounded-full bg-white py-0 pr-3.5 pl-1 text-sm font-medium text-[#1F2A3A] shadow-[0_0_0_1px_var(--border)]">
                  <CategoryIcon category={category} size="sm" />
                  {t.dynamic(`category.${category.slug}`, category.label)}
                </span>
              )}
              {item.featured && (
                <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#FFF3D6] py-0 pr-3.5 pl-2.5 text-sm font-semibold text-[#7A4300]">
                  <IconRosetteDiscountCheck aria-hidden="true" className="size-[1.125rem]" />
                  {t('innovation.featured')}
                </span>
              )}
            </div>
            <h1
              id="innovation-title"
              ref={titleRef}
              tabIndex={-1}
              className="text-4xl leading-[1.08] font-[650] tracking-[-0.035em] outline-none sm:text-[3.25rem]"
            >
              {item.title}
            </h1>
            {item.subtitle && <p className="max-w-[47.5rem] text-lg leading-[1.875rem] text-[#3B4757] sm:text-xl">{item.subtitle}</p>}
          </div>

          <div className="flex flex-wrap gap-3">
            {speech.supported && (
              <button type="button" className={lightButton} aria-pressed={speech.speaking} onClick={speech.toggle}>
                {speech.speaking ? <IconPlayerStop aria-hidden="true" /> : <IconVolume aria-hidden="true" />}
                {speech.speaking ? t('innovation.stopReading') : t('innovation.readAloud')}
              </button>
            )}
            <a href="#zabierz-na-telefon" className={primaryButton}>
              <IconDeviceMobile aria-hidden="true" />
              {t('innovation.takeToPhone')}
            </a>
            {item.links?.download && (
              <a href={item.links.download} onClick={() => trackAction(item.id, 'download')} className={lightButton} download>
                <IconDownload aria-hidden="true" />
                {t('innovation.download')}
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-[73.75rem] flex-wrap items-start gap-10 px-4 pt-11 pb-18 sm:px-6">
        <article className="flex min-w-0 flex-[999_1_35rem] flex-col">
          {item.solution && <ContentSection title={t('innovation.solution')}>{item.solution}</ContentSection>}
          {item.problem && <ContentSection title={t('innovation.problem')}>{item.problem}</ContentSection>}
          {item.targetGroup && <ContentSection title={t('innovation.targetGroup')}>{item.targetGroup}</ContentSection>}
          {item.beneficiaries.length > 0 && (
            <ContentSection title={t('innovation.beneficiaries')}>
              <ul className="flex flex-wrap gap-2">
                {item.beneficiaries.map((beneficiary) => (
                  <li key={beneficiary} className="inline-flex min-h-9 items-center rounded-full bg-muted px-3.5 py-1.5 text-[0.9375rem] leading-5 text-[#26303D]">
                    {beneficiary}
                  </li>
                ))}
              </ul>
            </ContentSection>
          )}
          <ContentSection title={t('innovation.effectiveness')}>
            {item.effectiveness ? (
              <div className="flex gap-3.5 rounded-[1.125rem] bg-[#EDF7F1] px-[1.375rem] py-5">
                <IconCircleCheck aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-[#0F6B4F]" />
                <div className="flex flex-col gap-1">
                  <span className="text-sm leading-5 font-[650] text-[#0F6B4F]">{t('innovation.testResults')}</span>
                  <p className="text-lg leading-[1.875rem] text-[#1F2A3A]">{item.effectiveness}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-[1.125rem] bg-muted px-5 py-4 text-[#3B4757]">
                <IconInfoCircle aria-hidden="true" className="size-6 shrink-0" />
                <p className="text-base leading-6">
                  {t('innovation.noTestResults')}
                </p>
              </div>
            )}
          </ContentSection>

          <section
            aria-labelledby="grant-cta-title"
            className="mt-3 flex flex-wrap items-center gap-x-[1.375rem] gap-y-[1.125rem] rounded-3xl border border-[#CFDDF0] bg-[linear-gradient(135deg,#EAF1FA,#F7FAFE_60%)] px-6 py-6"
          >
            <span aria-hidden="true" className="flex size-[3.25rem] shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-[0_0_0_1px_#CFDDF0]">
              <IconCoins className="size-6" />
            </span>
            <div className="flex min-w-0 flex-[1_1_20rem] flex-col gap-1.5">
              <span className="text-[0.8125rem] font-bold tracking-[0.06em] text-primary uppercase">{t('innovation.grantCta.eyebrow')}</span>
              <h2 id="grant-cta-title" className="text-[1.375rem] leading-[1.8125rem] font-[650] tracking-[-0.015em]">
                {t('innovation.grantCta.title')}
              </h2>
              <p className="text-base leading-6 text-[#3B4757]">
                {t('innovation.grantCta.text')}
              </p>
            </div>
            <Link to="/doradca" search={{ q: [item.title, item.subtitle].filter(Boolean).join(' - ') }} className={cn(primaryButton, 'shrink-0')}>
              {t('innovation.grantCta.button')}
              <IconArrowRight aria-hidden="true" />
            </Link>
          </section>
        </article>

        <aside aria-label={t('innovation.asideLabel')} className="flex max-w-[23.75rem] min-w-0 flex-[1_1_20rem] flex-col gap-4">
          {videoId && (
            <div className={panel}>
              <VideoDialog
                videoId={videoId}
                title={item.title}
                onOpen={() => trackAction(item.id, 'video')}
                trigger={
                  <button
                    type="button"
                    aria-label={t('innovation.watchVideo', { title: item.title })}
                    className="relative block aspect-video w-full overflow-hidden rounded-[0.875rem] bg-[radial-gradient(120%_120%_at_20%_10%,#2C4A73_0%,#13243D_60%,#0B1626_100%)] focus-visible:outline-3 focus-visible:outline-offset-[3px] focus-visible:outline-ring"
                  />
                }
              >
                <span aria-hidden="true" className="absolute top-1/2 left-1/2 flex size-[4.25rem] -translate-1/2 items-center justify-center rounded-full bg-white text-foreground shadow-[0_10px_24px_-8px_rgb(0_0_0/0.5)]">
                  <IconPlayerPlayFilled className="ml-[3px] size-7" />
                </span>
              </VideoDialog>
              <div className="flex flex-col gap-0.5">
                <h2 className="text-[1.0625rem] leading-6 font-[650]">{t('innovation.video')}</h2>
                <span className="text-sm text-muted-foreground">{t('innovation.videoHint')}</span>
              </div>
            </div>
          )}

          <div id="zabierz-na-telefon" className={cn(panel, 'scroll-mt-6')}>
            <h2 className="text-[1.0625rem] leading-6 font-[650]">{t('innovation.takeToPhone')}</h2>
            <div className="flex items-center gap-4">
              <QrCode value={shareUrl} label={t('innovation.qrLabel', { url: shareUrl })} />
              <p className="text-[0.9375rem] leading-[1.375rem] text-[#3B4757]">{t('innovation.qrHint')}</p>
            </div>
          </div>

          {item.authors && item.authors.length > 0 && (
            <div className={panel}>
              <h2 className="text-[1.0625rem] leading-6 font-[650]">{item.authors.length > 1 ? t('innovation.authors') : t('innovation.author')}</h2>
              <ul className="flex flex-col gap-2.5">
                {item.authors.map((author) => (
                  <li key={author} className="flex items-center gap-3">
                    <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-strong">
                      <IconUser className="size-5" />
                    </span>
                    {author}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={panel}>
            <h2 className="text-[1.0625rem] leading-6 font-[650]">{t('innovation.materials')}</h2>
            <ul className="flex flex-col">
              {item.links?.download && (
                <MaterialRow
                  href={item.links.download}
                  icon={<IconFileZip />}
                  title={t('innovation.materialsZip')}
                  hint={t('innovation.materialsZipHint')}
                  download
                  onClick={() => trackAction(item.id, 'download')}
                />
              )}
              {item.links?.pdf && (
                <MaterialRow href={item.links.pdf} icon={<IconFileTypePdf />} title={t('innovation.materialsPdf')} hint={t('innovation.materialsPdfHint')} onClick={() => trackAction(item.id, 'pdf')} />
              )}
              {item.source.url && (
                <MaterialRow
                  href={item.source.url}
                  icon={<IconExternalLink />}
                  title={t('innovation.materialsPage')}
                  hint="rops.krakow.pl"
                  onClick={() => trackAction(item.id, 'source')}
                />
              )}
            </ul>
          </div>

          <p className="px-1 text-[0.8125rem] leading-[1.125rem] text-muted-foreground">{t('innovation.source')}</p>
        </aside>
      </div>
    </>
  )
}

function BackLink() {
  const t = useT()
  return (
    <Link
      to="/"
      className="inline-flex h-11 items-center gap-2 rounded-full bg-white py-0 pr-[1.125rem] pl-3.5 text-[0.9375rem] font-semibold text-foreground shadow-[0_0_0_1px_var(--border)] hover:bg-[#F6F8FB] focus-visible:outline-3 focus-visible:outline-offset-[3px] focus-visible:outline-ring"
    >
      <IconArrowLeft aria-hidden="true" className="size-[1.125rem]" />
      {t('start.back')}
    </Link>
  )
}

function ContentSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t py-7 first:border-t-0 first:pt-0">
      <h2 className="text-[1.375rem] leading-[1.875rem] font-[650] tracking-[-0.015em]">{title}</h2>
      {typeof children === 'string' ? <p className="max-w-[68ch] text-lg leading-[1.875rem] text-[#26303D]">{children}</p> : children}
    </section>
  )
}

type MaterialRowProps = { href: string; icon: ReactNode; title: string; hint: string; download?: boolean; onClick?: () => void }

function MaterialRow({ href, icon, title, hint, download, onClick }: MaterialRowProps) {
  const t = useT()
  return (
    <li>
      <a
        href={href}
        onClick={onClick}
        {...(download ? { download: true } : { target: '_blank', rel: 'noopener noreferrer' })}
        className="-mx-3 flex min-h-13 items-center gap-3 rounded-[0.875rem] px-3 py-2 text-foreground hover:bg-[#F6F8FB] focus-visible:outline-3 focus-visible:outline-offset-[3px] focus-visible:outline-ring"
      >
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-[#3B4757] [&_svg]:size-5">
          {icon}
        </span>
        <span className="flex flex-col">
          <span className="font-medium">{title}</span>
          <span className="text-[0.8125rem] text-muted-foreground">{hint}</span>
        </span>
        {!download && <span className="sr-only">{t('common.newTab')}</span>}
      </a>
    </li>
  )
}

// Stays Polish whatever the UI language: the content it introduces comes from the AI service in Polish.
function readAloudText(item: Innovation) {
  return [
    item.title,
    item.subtitle,
    item.solution && `Na czym polega rozwiązanie? ${item.solution}`,
    item.problem && `Jaki problem rozwiązuje? ${item.problem}`,
    item.targetGroup && `Dla kogo? ${item.targetGroup}`,
    item.effectiveness && `Czy to działa? ${item.effectiveness}`,
  ]
    .filter(Boolean)
    .join('. ')
}
