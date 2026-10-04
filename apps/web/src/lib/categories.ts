import {
  IconBlind,
  IconBrain,
  IconBriefcase,
  IconClipboardHeart,
  IconFriends,
  IconHomeHand,
  IconLayoutGrid,
  IconOld,
  IconWheelchair,
  IconWorld,
  type Icon,
} from '@tabler/icons-react'

export type Category = {
  slug: string
  label: string
  icon: Icon
  gradient: [string, string]
  onGradient: string
  tint: string
}

export const ALL_CATEGORIES: Category = {
  slug: 'all',
  label: 'Wszystkie',
  icon: IconLayoutGrid,
  gradient: ['#E2E8F0', '#A8B5C7'],
  onGradient: '#0F1B2D',
  tint: '#E3EDF9',
}

export const CATEGORIES: Category[] = [
  { slug: 'dla-seniorow', label: 'Seniorzy', icon: IconOld, gradient: ['#FF8A7A', '#FF8A4C'], onGradient: '#0F1B2D', tint: '#FDE7E0' },
  { slug: 'dla-dzieci-mlodziezy-i-rodziny', label: 'Dzieci, młodzież i rodzina', icon: IconFriends, gradient: ['#D9E84B', '#2FDDE2'], onGradient: '#0F1B2D', tint: '#DDF5EC' },
  { slug: 'dla-rynku-pracy', label: 'Rynek pracy', icon: IconBriefcase, gradient: ['#8C0AA6', '#A80033'], onGradient: '#FFFFFF', tint: '#F7DFF0' },
  { slug: 'dla-osob-o-ograniczonej-mobilnosci', label: 'Ograniczona mobilność', icon: IconWheelchair, gradient: ['#EE8AF2', '#A9A1FC'], onGradient: '#0F1B2D', tint: '#ECE5FD' },
  { slug: 'dla-osob-z-niepelnosprawnoscia-sensoryczna', label: 'Niepełnosprawność sensoryczna', icon: IconBlind, gradient: ['#FFC64F', '#FF8F40'], onGradient: '#0F1B2D', tint: '#FFF0D6' },
  { slug: 'dla-cudzoziemcow', label: 'Cudzoziemcy', icon: IconWorld, gradient: ['#4CC774', '#A6E635'], onGradient: '#0F1B2D', tint: '#E2F5DA' },
  { slug: 'dla-osob-z-niepelnosprawnoscia-intelektualna', label: 'Niepełnosprawność intelektualna', icon: IconBrain, gradient: ['#FFF34A', '#F2D600'], onGradient: '#0F1B2D', tint: '#FBF6C7' },
  { slug: 'dla-osob-w-kryzysie-bezdomnosci', label: 'Kryzys bezdomności', icon: IconHomeHand, gradient: ['#FF7DBB', '#FFDC4D'], onGradient: '#0F1B2D', tint: '#FFE4EF' },
  { slug: 'dla-zdrowia-i-medycyny', label: 'Zdrowie i medycyna', icon: IconClipboardHeart, gradient: ['#40D9F2', '#6FB3F0'], onGradient: '#0F1B2D', tint: '#DCEFFB' },
]

const bySlug = new Map(CATEGORIES.map((category) => [category.slug, category]))

export function categoryFor(slug: string | undefined) {
  return slug ? bySlug.get(slug) : undefined
}

/**
 * First Kategoria named in a free-text list of labels, as the Pomysł form stores them (joined with
 * ", "). Labels may themselves contain a comma — "Dzieci, młodzież i rodzina" — so this searches for
 * the labels rather than splitting the text apart.
 */
export function firstCategoryIn(text: string | undefined) {
  if (!text) return undefined
  let best: { category: Category; at: number } | undefined
  for (const category of CATEGORIES) {
    const at = text.indexOf(category.label)
    if (at >= 0 && (!best || at < best.at)) best = { category, at }
  }
  return best?.category
}
