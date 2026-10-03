import { useState } from 'react'
import { cn } from 'cn'

const SIZES = [
  { id: 'small', label: 'Mniejszy tekst', rootSize: '87.5%', glyph: 'text-[0.8125rem]' },
  { id: 'normal', label: 'Standardowy tekst', rootSize: '100%', glyph: 'text-base' },
  { id: 'large', label: 'Większy tekst', rootSize: '125%', glyph: 'text-xl' },
] as const

type SizeId = (typeof SIZES)[number]['id']

const STORAGE_KEY = 'hubmi:text-size'

function readStored(): SizeId {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return SIZES.some((size) => size.id === value) ? (value as SizeId) : 'normal'
  } catch {
    return 'normal'
  }
}

function apply(id: SizeId) {
  document.documentElement.style.fontSize = SIZES.find((size) => size.id === id)!.rootSize
}

export function applyStoredTextSize() {
  apply(readStored())
}

export function TextSizeSwitch() {
  const [current, setCurrent] = useState<SizeId>(readStored)

  function choose(id: SizeId) {
    setCurrent(id)
    apply(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      // Private mode or blocked storage: the size still applies for this visit.
    }
  }

  return (
    <div role="group" aria-labelledby="text-size-label" className="flex h-[2.875rem] items-center gap-0.5 rounded-full bg-muted p-[3px]">
      <span id="text-size-label" className="pr-2 pl-3 text-sm text-secondary-foreground">
        Tekst
      </span>
      {SIZES.map((size) => (
        <button
          key={size.id}
          type="button"
          aria-label={size.label}
          aria-pressed={current === size.id}
          onClick={() => choose(size.id)}
          className={cn(
            'inline-flex h-10 min-w-11 items-center justify-center rounded-full px-3 leading-none font-semibold text-secondary-foreground transition-colors hover:text-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring',
            'aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm aria-pressed:ring-1 aria-pressed:ring-ring/40',
            size.glyph,
          )}
        >
          A
        </button>
      ))}
    </div>
  )
}
