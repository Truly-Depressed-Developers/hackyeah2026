const plural = new Intl.PluralRules('pl')

/** "1 rozwiązanie" / "2 rozwiązania" / "5 rozwiązań" — Polish needs three forms, not two. */
export function countLabel(n: number, forms: Record<'one' | 'few' | 'many', string>) {
  const rule = plural.select(n)
  return `${n} ${rule === 'one' || rule === 'few' ? forms[rule] : forms.many}`
}

export const TESTER_FORMS = { one: 'chętny', few: 'chętnych', many: 'chętnych' }

/** Testerzy signed up for a Pomysł, shown both on /testy and in the Panel administratora. */
export const testerCountLabel = (n: number) => countLabel(n, TESTER_FORMS)
