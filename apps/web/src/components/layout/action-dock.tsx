import { Link } from '@tanstack/react-router'
import { IconClipboardCheck, IconPlus } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

/**
 * The two standing offers on the start screen: test someone's Pomysł, or add your own.
 * Sticky rather than fixed, so the dock rides above the content and stops at the footer instead of
 * covering it - the whole page still works when it scrolls past.
 */
export function ActionDock() {
  return (
    <div className="pointer-events-none sticky bottom-0 z-40 -mt-12 flex justify-end px-4 pt-6 pb-6 sm:px-6">
      <div className="pointer-events-auto flex flex-col items-stretch gap-3">
        <Link to="/testy" search={{}} className={fab}>
          <span aria-hidden="true" className={cn(fabIcon, 'bg-primary-soft text-primary shadow-[inset_0_0_0_1px_#CFDDF0]')}>
            <IconClipboardCheck className="size-[1.375rem]" stroke={2.25} />
          </span>
          Zostań testerem
        </Link>

        <Link to="/pomysl" search={{ krok: 1 }} className={fab}>
          <span aria-hidden="true" className={cn(fabIcon, 'bg-primary text-white')}>
            <IconPlus className="size-[1.375rem]" stroke={2.5} />
          </span>
          Zgłoś pomysł
        </Link>
      </div>
    </div>
  )
}

const fab =
  'inline-flex h-13 items-center gap-2.5 rounded-full border border-[#C9D3DF] bg-white py-0 pr-5 pl-1.5 text-base font-semibold text-foreground shadow-[0_0_0_4px_rgb(255_255_255/0.85),0_4px_10px_rgb(15_27_45/0.14),0_20px_44px_-10px_rgb(15_27_45/0.40)] transition-colors hover:bg-[#F6F8FB] focus-visible:outline-3 focus-visible:outline-offset-[3px] focus-visible:outline-ring'

const fabIcon = 'flex size-10 shrink-0 items-center justify-center rounded-full'
