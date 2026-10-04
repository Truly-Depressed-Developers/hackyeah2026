import type { ReactNode } from 'react'
import { IconMovie, IconPhone, IconRosetteDiscountCheck } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { CategoryBadge } from '@/components/category-badge'
import { categoryFor } from '@/lib/categories'

const TILE =
  'flex h-full min-h-[12.25rem] flex-col gap-2 rounded-[1.125rem] border border-tile-border bg-tile px-5 py-[1.125rem] text-card-foreground shadow-[0_1px_2px_0_rgb(15_27_45/0.05),0_4px_12px_-6px_rgb(15_27_45/0.08)] transition-[box-shadow,border-color] hover:border-[#C9D3DF] hover:shadow-[0_10px_24px_-12px_rgb(15_27_45/0.18)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring'

export type TileContent = {
  title: string
  subtitle?: string
  /** Falls back to `kindLabel` in the top pill when the category is unknown (helpers, facts). */
  categorySlug?: string
  kindLabel?: string
  hasVideo?: boolean
  featured?: boolean
  phone?: string
  sourceLabel?: string
  /** Extra block above the meta row - the search uses it for the match rationale. */
  note?: ReactNode
}

/**
 * The resident-facing tile for one innovation, shared by the knowledge base and the
 * search results. The whole tile is a single link: every action lives on the detail
 * page, so the meta row only *signals* what is waiting there.
 */
export function InnovationTile({ id, href, newTab, ...content }: TileContent & { id?: string; href?: string; newTab?: boolean }) {
  if (id) {
    return (
      <li>
        <Link to="/innowacja/$id" params={{ id }} className={TILE}>
          <TileBody {...content} />
        </Link>
      </li>
    )
  }

  if (href) {
    return (
      <li>
        <a href={href} className={TILE} {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
          <TileBody {...content} />
          {newTab && <span className="sr-only">(otwiera się w nowej karcie)</span>}
        </a>
      </li>
    )
  }

  return (
    <li>
      <div className={TILE}>
        <TileBody {...content} />
      </div>
    </li>
  )
}

function TileBody({ title, subtitle, categorySlug, kindLabel, hasVideo, featured, phone, sourceLabel, note }: TileContent) {
  const category = categoryFor(categorySlug)

  return (
    <>
      {category ? (
        <CategoryBadge category={category} />
      ) : (
        kindLabel && (
          <span className="inline-flex h-8 w-fit items-center rounded-full bg-muted px-3 text-[0.8125rem] font-medium">{kindLabel}</span>
        )
      )}

      <span className="mt-1 text-[1.0625rem] leading-[1.4375rem] font-semibold tracking-[-0.01em]">{title}</span>
      {subtitle && <span className="line-clamp-3 text-[0.9375rem] leading-[1.3125rem] text-muted-foreground">{subtitle}</span>}

      {note}

      <span className="mt-auto flex flex-wrap items-center gap-x-3.5 gap-y-1.5 pt-1.5 text-[0.8125rem] leading-[1.125rem] text-muted-foreground">
        {hasVideo && (
          <span className="inline-flex items-center gap-1.5">
            <IconMovie aria-hidden="true" className="size-4" />
            Film
          </span>
        )}
        {featured && (
          <span className="inline-flex items-center gap-1.5 text-[#7A4300]">
            <IconRosetteDiscountCheck aria-hidden="true" className="size-4" />
            Polecana
          </span>
        )}
        {phone && (
          <span className="inline-flex items-center gap-1.5">
            <IconPhone aria-hidden="true" className="size-4" />
            {phone}
          </span>
        )}
        {sourceLabel && <span>{sourceLabel}</span>}
      </span>
    </>
  )
}

export const TILE_GRID = 'grid grid-cols-[repeat(auto-fill,minmax(min(18.75rem,100%),1fr))] gap-4'
