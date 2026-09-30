import { env } from '../env.js'
import { createHttpDecideClient } from './http.js'
import { mockDecideClient } from './mock.js'
import type { DecideClient } from './types.js'

export type { DecideClient, DecideInput, DecideResult } from './types.js'

export const decideClient: DecideClient =
  env.DECIDE_MODE === 'http' ? createHttpDecideClient(env.DECIDE_URL) : mockDecideClient
