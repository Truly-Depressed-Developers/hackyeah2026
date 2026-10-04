import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { findInnovation } from '../ai/catalog.js'
import { env } from '../env.js'
import { publicProcedure, router } from '../trpc.js'
import { allowSms } from './limits.js'
import { normalizePolishPhone, resultSmsText } from './message.js'
import { SmsError, sendSms } from './sender.js'

// Odbiór wyniku by SMS from the kiosk (HAC-21). Public like the kiosk itself; the text is built here from the
// Innowacja id, so the endpoint cannot be used to send arbitrary messages. The number is used once and never stored.

// One message for every failure: the kiosk offers the QR code instead, the reason goes to the server log.
const FAILED = 'Nie udało się wysłać SMS-a.'

export const kioskRouter = router({
  sendResultSms: publicProcedure
    .input(z.object({ innovationId: z.string().min(1).max(500), phone: z.string().max(30) }))
    .mutation(async ({ ctx, input }) => {
      const phone = normalizePolishPhone(input.phone)
      if (!phone) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nieprawidłowy numer telefonu.' })

      const innovation = await findInnovation(input.innovationId)
      if (!innovation) throw new TRPCError({ code: 'NOT_FOUND', message: FAILED })

      if (!allowSms(ctx.ip, phone)) {
        console.warn('Kiosk SMS refused: limit reached')
        throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: FAILED })
      }

      const url = `${env.PUBLIC_URL}/innowacja/${encodeURIComponent(innovation.id)}`
      try {
        await sendSms(phone, resultSmsText(innovation.title, url))
      } catch (err) {
        // SmsError never carries the number; anything else is logged by its message only.
        console.error('Kiosk SMS failed:', err instanceof SmsError ? `${err.reason}: ${err.message}` : String(err))
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: FAILED })
      }
      return { sent: true }
    }),
})
