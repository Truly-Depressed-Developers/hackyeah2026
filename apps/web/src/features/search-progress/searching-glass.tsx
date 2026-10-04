import { IconSearch } from '@tabler/icons-react'
import { cn } from 'cn'

/** Szerokości „linijek tekstu" - stałe, żeby animacja wyglądała tak samo przy każdym szukaniu. */
const LINES = [82, 64, 74, 52, 68]

/**
 * Lupa wodząca po kartce z opisem - metafora przeszukiwania bazy. Czysto dekoracyjna
 * (`aria-hidden`), bo stan komunikuje tekst obok; czytnik ekranu nie ma tu czego oglądać.
 *
 * Rozmiar bierze z `className`, więc kiosk i wersja web składają własny layout zamiast
 * dostawać wariant przez propsa.
 */
export function SearchingGlass({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('relative overflow-hidden rounded-2xl border border-border bg-card', className)}
    >
      <div className="flex h-full flex-col justify-center gap-[9%] px-[8%]">
        {LINES.map((width, i) => (
          <span key={i} style={{ width: `${width}%` }} className="block h-[7%] min-h-1 rounded-full bg-muted" />
        ))}
      </div>

      <IconSearch
        className="absolute top-[8%] left-[10%] size-[28%] text-primary animate-[search-glass_4.5s_ease-in-out_infinite] motion-reduce:animate-none"
        stroke={2}
      />
    </div>
  )
}
