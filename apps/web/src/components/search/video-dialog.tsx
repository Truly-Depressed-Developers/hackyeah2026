import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export function youtubeId(url: string) {
  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1) || null
    return parsed.searchParams.get('v') ?? parsed.pathname.match(/\/embed\/([^/?]+)/)?.[1] ?? null
  } catch {
    return null
  }
}

export function VideoDialog({ videoId, title, primary }: { videoId: string; title: string; primary: boolean }) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant={primary ? 'default' : 'outline'} className="h-11 px-4 text-base" />}>
        <Play aria-hidden="true" />
        Obejrzyj film
      </DialogTrigger>
      <DialogContent className="gap-3 pt-14 sm:max-w-3xl">
        <DialogTitle className="text-lg">{title}</DialogTitle>
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          <iframe
            className="size-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?cc_load_policy=1&cc_lang_pref=pl&hl=pl&rel=0`}
            title={`Film: ${title}`}
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
