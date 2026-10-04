import { IconBulb, IconFlask, IconListCheck, IconRocket } from '@tabler/icons-react'
import { z } from 'zod'
import { isEmail, isPhone } from '@/lib/contact'

export const OTHER_GROUP = 'Inna grupa'

export const STAGES = [
  { id: 'idea', title: 'To dopiero pomysł', description: 'Mam myśl, ale nic jeszcze nie zrobiłem/-am.', icon: IconBulb },
  { id: 'plan', title: 'Mam plan', description: 'Wiem, jak to zrobić, kto by pomógł i czego potrzeba.', icon: IconListCheck },
  { id: 'test', title: 'Pierwsze próby', description: 'Sprawdzam pomysł w małej skali, np. z sąsiadami.', icon: IconFlask },
  { id: 'live', title: 'To już działa', description: 'Rozwiązanie funkcjonuje i pomaga ludziom.', icon: IconRocket },
] as const

// Question texts are stored with the answers, so the Panel administratora reads like the form.
export const QUESTIONS = {
  title: 'Opisz krótko swój pomysł',
  essence: 'Na czym polega Twój pomysł?',
  groups: 'Komu ma pomóc Twój pomysł?',
  stage: 'Na jakim etapie jest Twój pomysł?',
  name: 'Imię',
} as const

export const ideaSchema = z.object({
  title: z.string().trim().min(1, 'Napisz choć jedno zdanie o swoim pomyśle.').max(300),
  essence: z.string().trim().min(1, 'Opisz, na czym polega pomysł - wystarczy kilka zdań.').max(1500),
  groups: z.array(z.string()).min(1, 'Wybierz przynajmniej jedną grupę.'),
  stage: z.string().refine((value) => STAGES.some((stage) => stage.id === value), 'Wybierz jeden etap.'),
  name: z.string().trim().max(100),
  contact: z
    .string()
    .trim()
    .refine((value) => isEmail(value) || isPhone(value), 'Wpisz poprawny e-mail (z @ i końcówką, np. .pl) albo 9-cyfrowy numer telefonu.'),
  consent: z.boolean().refine(Boolean, 'Zaznacz zgodę, abyśmy mogli się z Tobą skontaktować.'),
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

export function stageTitle(id: string) {
  return STAGES.find((stage) => stage.id === id)?.title
}

export function toAnswers(values: IdeaValues) {
  return [
    { question: QUESTIONS.essence, answer: values.essence },
    { question: QUESTIONS.groups, answer: values.groups.join(', ') },
    { question: QUESTIONS.stage, answer: stageTitle(values.stage) ?? values.stage },
    ...(values.name ? [{ question: QUESTIONS.name, answer: values.name }] : []),
  ]
}
