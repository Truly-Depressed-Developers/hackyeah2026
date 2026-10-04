import { CategoryIcon } from '@/components/category-badge'
import { categoryFor } from '@/lib/categories'

/**
 * Pigułka kategorii w skali kiosku. `CategoryBadge` z wersji web ma zaszyte h-8
 * i 13 px tekstu — za mało z odległości wyciągniętej ręki — ale sam `CategoryIcon`
 * to goły gradientowy krążek bez opinii o layoucie, więc reużywamy jego.
 *
 * Nieznany slug nie jest błędem: API może zwrócić kategorię, której UI jeszcze nie
 * zna, i wtedy pokazujemy samą nazwę zamiast gubić informację.
 */
export function CategoryPill({ slug, label }: { slug: string | undefined; label: string | undefined }) {
  const category = categoryFor(slug)
  if (!category && !label) return null

  return (
    <span className="inline-flex w-fit items-center gap-2 text-[18px] font-medium text-[var(--hub-tekst-2)]">
      {category && <CategoryIcon category={category} />}
      {category?.label ?? label}
    </span>
  )
}
