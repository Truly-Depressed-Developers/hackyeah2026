import createClient from 'openapi-fetch'
import type { paths } from './schema.js'
import type { DecideClient } from './types.js'

// TODO(ai-service): schema.d.ts is a placeholder. Run `pnpm gen:decide` once the real service
// exists, then adjust the mapping below if its path or fields differ.
export function createHttpDecideClient(baseUrl: string): DecideClient {
  const client = createClient<paths>({ baseUrl })

  return {
    async decide(input) {
      const { data, error, response } = await client.POST('/decide', { body: input })
      if (error || !data) {
        throw new Error(`AI decision service failed: HTTP ${response.status} ${JSON.stringify(error)}`)
      }
      return { answer: data.answer, confidence: data.confidence }
    },
  }
}
