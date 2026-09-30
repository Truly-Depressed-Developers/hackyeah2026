export interface DecideInput {
  state: string
  question: string
  options: string[]
}

export interface DecideResult {
  answer: string
  confidence: number
}

export interface DecideClient {
  decide(input: DecideInput): Promise<DecideResult>
}
