import { cn } from 'cn'
import type { Category } from '@/lib/categories'
import { useT } from '@/lib/i18n'

export function CategoryIcon({ category, size = 'md' }: { category: Category; size?: 'sm' | 'md' }) {
  const Icon = category.icon
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full',
        size === 'sm' ? 'size-6 [&_svg]:size-[15px]' : 'size-8 [&_svg]:size-[19px]',
      )}
      style={{
        background: `linear-gradient(135deg, ${category.gradient[0]}, ${category.gradient[1]})`,
        color: category.onGradient,
      }}
    >
      <Icon stroke={2.25} />
    </span>
  )
}

export function CategoryBadge({ category }: { category: Category }) {
  const t = useT()
  return (
    <span className="inline-flex h-8 w-fit items-center gap-2 rounded-full bg-muted py-0 pr-3 pl-1 text-[0.8125rem] font-medium">
      <CategoryIcon category={category} size="sm" />
      {t(category.label, category.labelEn)}
    </span>
  )
}
