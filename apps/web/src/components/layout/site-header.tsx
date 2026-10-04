import { Link } from '@tanstack/react-router'
import { PomostLogo } from '@/components/brand/pomost-logo'
import { buttonVariants } from '@/components/ui/button'
import { LanguageSwitch } from './language-switch'
import { TextSizeSwitch } from './text-size'

export function SiteHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b px-4 py-2 sm:px-8">
      <Link to="/" className="flex min-w-0 items-center rounded-md focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <PomostLogo size={2.75} />
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
