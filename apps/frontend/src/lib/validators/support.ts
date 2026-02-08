import { z } from 'zod'

export const createTicketSchema = z.object({
  subject: z
    .string()
    .min(1, 'El asunto es requerido')
    .min(5, 'El asunto debe tener al menos 5 caracteres')
    .max(200, 'El asunto no puede exceder 200 caracteres'),
  category: z.enum(['technical', 'billing', 'general'], {
    required_error: 'La categoría es requerida',
  }),
  orderId: z.string().optional(),
  vpsInstanceId: z.string().optional(),
  message: z
    .string()
    .min(1, 'El mensaje es requerido')
    .min(10, 'El mensaje debe tener al menos 10 caracteres')
    .max(2000, 'El mensaje no puede exceder 2000 caracteres'),
})

export type CreateTicketFormData = z.infer<typeof createTicketSchema>

export const ticketReplySchema = z.object({
  message: z
    .string()
    .min(1, 'El mensaje es requerido')
    .min(1, 'El mensaje debe tener al menos 1 carácter')
    .max(2000, 'El mensaje no puede exceder 2000 caracteres'),
})

export type TicketReplyFormData = z.infer<typeof ticketReplySchema>
