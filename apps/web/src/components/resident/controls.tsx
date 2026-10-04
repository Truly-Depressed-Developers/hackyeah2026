import { IconAlertCircle } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

// Shared look of the Mieszkaniec-facing forms (Zgłoś pomysł, Zostaw kontakt, Zostań testerem).
// Sizes are in rem on purpose: the A/A/A control scales the root font size, and px would not follow.

export const labelClass = 'text-[0.9375rem] leading-5 font-semibold'

export const fieldClass =
  'h-[3.75rem] w-full rounded-full border border-input bg-white px-[1.375rem] text-lg outline-none placeholder:text-muted-foreground focus:border-primary focus:shadow-[0_0_0_4px_rgb(34_99_173/0.18)] aria-invalid:border-[#D92D20] aria-invalid:bg-[#FFFBFA] aria-invalid:shadow-[0_0_0_4px_rgb(217_45_32/0.14)]'

// min-h plus wrapping text rather than a fixed height: at 200% a long label has to break onto a
// second line instead of pushing the page sideways on a 320 px screen.
export const pill =
  'inline-flex max-w-full min-h-14 items-center justify-center gap-2.5 rounded-full px-7 py-2 text-center text-base font-semibold text-balance focus-visible:outline-3 focus-visible:outline-offset-[3px] focus-visible:outline-ring [&_svg]:size-5'

export const primaryButton = cn(
  pill,
  'bg-primary text-primary-foreground shadow-[0_6px_14px_-6px_rgb(34_99_173/0.55)] hover:bg-primary-hover disabled:opacity-70',
)

export const ghostButton = cn(pill, 'bg-muted text-[#1F2A3A] hover:bg-border')

/** Structural, so both react-hook-form errors and hand-built ones fit. */
export type FieldMessage = { message?: string } | undefined

/** Field-level error. role="alert" so it is announced the moment validation fails. */
export function FieldErrorText({ id, error, className }: { id?: string; error: FieldMessage; className?: string }) {
  if (!error?.message) return null
  return (
    <span
      id={id}
      role="alert"
      className={cn('flex items-start gap-2 px-1.5 text-[0.9375rem] leading-[1.375rem] font-medium text-[#B42318]', className)}
    >
      <IconAlertCircle aria-hidden="true" className="mt-px size-5 shrink-0" />
      {error.message}
    </span>
  )
}
