import { useRef, type ReactElement, type ReactNode } from 'react'
import { IconPlayerPlay } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useT } from '@/lib/i18n'

export function youtubeId(url: string) {
  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1) || null
    return parsed.searchParams.get('v') ?? parsed.pathname.match(/\/embed\/([^/?]+)/)?.[1] ?? null
  } catch {
    return null
  }
}

type Props = { videoId: string; title: string; primary?: boolean; trigger?: ReactElement; children?: ReactNode; onOpen?: () => void }

export function VideoDialog({ videoId, title, primary = false, trigger, children, onOpen }: Props) {
  const t = useT()
  const titleRef = useRef<HTMLHeadingElement>(null)

  return (
    <Dialog onOpenChange={(open) => open && onOpen?.()}>
      <DialogTrigger render={trigger ?? <Button variant={primary ? 'default' : 'outline'} className="h-11 px-4 text-base" />}>
        {children ?? (
          <>
            <IconPlayerPlay aria-hidden="true" />
            {t('search.watchVideo')}
          </>
        )}
      </DialogTrigger>
      {/* Focus the title, not the iframe: keys inside a cross-origin iframe never reach us, so Esc would not close. */}
      <DialogContent initialFocus={titleRef} className="gap-3 pt-14 sm:max-w-3xl">
        <DialogTitle ref={titleRef} tabIndex={-1} className="text-lg outline-none">
          {title}
        </DialogTitle>
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          <iframe
            className="size-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?cc_load_policy=1&cc_lang_pref=pl&hl=pl&rel=0`}
            title={t('search.videoTitle', { title })}
            allow="encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            // oxlint-disable-next-line react/iframe-missing-sandbox -- YouTube needs scripts + same-origin; safe because it's cross-origin
            sandbox="allow-scripts allow-same-origin allow-presentation"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
