import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from 'cn'

/**
 * Jedyny prymityw zarządzania fokusem w kiosku: każdy ekran ma dokładnie jeden
 * taki nagłówek i przejmuje on fokus przy montażu. Ekrany są kluczowane nazwą
 * widoku w `kiosk-app.tsx`, więc efekt odpala się przy każdym przejściu.
 *
 * Celowo NIE używamy tego przy zmianach podstanów wewnątrz ekranu (kafelki →
 * przełącznik, słuchanie → potwierdzenie) - tam informują live regions, a
 * kradzież fokusu w trakcie dyktowania dezorientuje.
 *
 * Ten sam wzorzec co `no-result.tsx` i `innovation-page.tsx` w wersji web.
 */
export function ScreenTitle({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    ref.current?.focus()
  }, [])

  return (
    <h1 ref={ref} tabIndex={-1} className={cn('text-[44px] leading-[1.1] font-bold tracking-[-0.02em] outline-none', className)}>
      {children}
    </h1>
  )
}
