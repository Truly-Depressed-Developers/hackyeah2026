import type { DecideClient } from './types.js'

function hash(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0
  return h
}

export const mockDecideClient: DecideClient = {
  async decide({ state, question, options }) {
    const h = hash(`${state}\n${question}\n${options.join('\n')}`)
    return {
      answer: options[h % options.length] ?? 'no options given',
      confidence: (50 + (h % 50)) / 100,
    }
  },
}
