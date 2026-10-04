import { IconBulb, IconFlask, IconListCheck, IconRocket } from '@tabler/icons-react'
import { z } from 'zod'
import { CATEGORIES } from '@/lib/categories'
import { isEmail, isPhone } from '@/lib/contact'
import { translator, type Translate } from '@/lib/i18n'

// Stored with the answers in Polish, so the Panel administratora reads like the form whatever language the Mieszkaniec used.
const polish = translator('pl')

export const OTHER_GROUP = 'Inna grupa'

export const STAGES = [
  { id: 'idea', title: 'idea.stage.idea.title', description: 'idea.stage.idea.description', icon: IconBulb },
  { id: 'plan', title: 'idea.stage.plan.title', description: 'idea.stage.plan.description', icon: IconListCheck },
  { id: 'test', title: 'idea.stage.test.title', description: 'idea.stage.test.description', icon: IconFlask },
  { id: 'live', title: 'idea.stage.live.title', description: 'idea.stage.live.description', icon: IconRocket },
] as const

export const QUESTIONS = {
  title: 'idea.question.title',
  essence: 'idea.question.essence',
  groups: 'idea.question.groups',
  stage: 'idea.question.stage',
  name: 'idea.question.name',
} as const

export const ideaSchema = z.object({
  title: z.string().trim().min(1, 'idea.error.title').max(300),
  essence: z.string().trim().min(1, 'idea.error.essence').max(1500),
  groups: z.array(z.string()).min(1, 'idea.error.groups'),
  stage: z.string().refine((value) => STAGES.some((stage) => stage.id === value), 'idea.error.stage'),
  name: z.string().trim().max(100),
  contact: z
    .string()
    .trim()
    .refine((value) => isEmail(value) || isPhone(value), 'idea.error.contact'),
  consent: z.boolean().refine(Boolean, 'idea.error.consent'),
})

export type IdeaValues = z.infer<typeof ideaSchema>

export const TOTAL_STEPS = 6

export const STEP_FIELDS: Record<number, (keyof IdeaValues)[]> = {
  1: ['title'],
  2: ['essence'],
  3: ['groups'],
  4: ['stage'],
  5: ['name', 'contact', 'consent'],
}

export function stageTitle(t: Translate, id: string) {
  const stage = STAGES.find((item) => item.id === id)
  return stage ? t(stage.title) : undefined
}

/** Groups are stored as Polish Kategoria labels; this shows one in the current language. */
export function groupLabel(t: Translate, group: string) {
  if (group === OTHER_GROUP) return t('idea.otherGroup')
  const category = CATEGORIES.find((item) => item.label === group)
  return category ? t.dynamic(`category.${category.slug}`, group) : group
}

/** The stage is stored as its Polish title; this shows it in the current language. */
export function storedStageLabel(t: Translate, stored: string) {
  const stage = STAGES.find((item) => polish(item.title) === stored)
  return stage ? t(stage.title) : stored
}

export function toAnswers(values: IdeaValues) {
  return [
    { question: polish(QUESTIONS.essence), answer: values.essence },
    { question: polish(QUESTIONS.groups), answer: values.groups.join(', ') },
    { question: polish(QUESTIONS.stage), answer: stageTitle(polish, values.stage) ?? values.stage },
    ...(values.name ? [{ question: polish(QUESTIONS.name), answer: values.name }] : []),
  ]
}
