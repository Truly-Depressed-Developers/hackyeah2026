import { cn } from 'cn'

export const panel = 'flex flex-col gap-4 rounded-3xl border bg-white px-5 py-6 sm:px-7 sm:py-[1.625rem]'
export const panelTitle = 'text-[1.375rem] leading-[1.8125rem] font-[650] tracking-[-0.02em]'

export const aiBadge = 'inline-flex h-[1.875rem] w-fit items-center gap-1.5 rounded-full bg-[#F1EDFF] px-3 text-[0.8125rem] font-semibold text-[#3F2D9C] [&_svg]:size-[0.9375rem]'

export const smallButton =
  'inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full px-5 py-2 text-[0.9375rem] font-semibold focus-visible:outline-3 focus-visible:outline-offset-[3px] focus-visible:outline-ring [&_svg]:size-5'
export const whiteButton = cn(smallButton, 'bg-white text-foreground shadow-[inset_0_0_0_1px_var(--input)] hover:bg-muted')
export const primarySmallButton = cn(smallButton, 'bg-primary text-primary-foreground shadow-[0_6px_14px_-6px_rgb(34_99_173/0.55)] hover:bg-primary-hover')

export const formatPoints = (value: number) => value.toLocaleString('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
export const formatPln = (value: number) => `${Math.round(value).toLocaleString('pl-PL')} zł`
