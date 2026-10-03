import { Link } from '@tanstack/react-router'
import { buttonVariants } from '@/components/ui/button'
import { LanguageSwitch } from './language-switch'
import { TextSizeSwitch } from './text-size'

export function SiteHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b px-4 py-2 sm:px-8">
      <Link to="/" className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 rounded-md">
        <span className="text-xl leading-6 font-[650] tracking-[-0.02em]">HubMI</span>
        <span className="text-sm text-muted-foreground">Województwo Małopolskie · ROPS w Krakowie</span>
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <TextSizeSwitch />
        <LanguageSwitch />
        <Link to="/panel" className={buttonVariants({ variant: 'ghost', className: 'h-11 px-4' })}>
          Zaloguj się
        </Link>
      </div>
    </header>
  )
}
