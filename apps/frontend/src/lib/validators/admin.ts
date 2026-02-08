import { z } from 'zod'

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'paid', 'processing', 'provisioning', 'completed', 'cancelled'], {
    required_error: 'El estado es requerido',
  }),
  vpsInstanceId: z.string().optional(),
  contaboInstanceId: z.string().optional(),
  ipAddress: z
    .string()
    .min(1, 'La dirección IP es requerida')
    .regex(/^(\d{1,3}\.){3}\d{1,3}$/, 'IP inválida')
    .optional(),
  rootPassword: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .optional(),
  region: z.string().optional(),
  provisioningNotes: z.string().max(1000).optional(),
})

export type UpdateOrderStatusFormData = z.infer<typeof updateOrderStatusSchema>

export const provisionVpsSchema = z.object({
  contaboInstanceId: z
    .string()
    .min(1, 'El ID de instancia de Contabo es requerido'),
  ipAddress: z
    .string()
    .min(1, 'La dirección IP es requerida')
    .regex(/^(\d{1,3}\.){3}\d{1,3}$/, 'IP inválida'),
  rootPassword: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
  region: z
    .string()
    .min(1, 'La región es requerida'),
  notes: z.string().max(1000).optional(),
})

export type ProvisionVpsFormData = z.infer<typeof provisionVpsSchema>

export const productSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  slug: z
    .string()
    .min(1, 'El slug es requerido')
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones')
    .max(100, 'El slug no puede exceder 100 caracteres'),
  description: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(500, 'La descripción no puede exceder 500 caracteres'),
  contaboProductId: z
    .string()
    .min(1, 'El ID de producto de Contabo es requerido'),
  cpuCores: z
    .number()
    .int('Los cores de CPU deben ser un número entero')
    .positive('Los cores de CPU deben ser positivos'),
  ramGB: z
    .number()
    .positive('La RAM debe ser positiva'),
  diskGB: z
    .number()
    .int('El disco debe ser un número entero')
    .positive('El disco debe ser positivo'),
  diskType: z.enum(['NVMe', 'SSD'], {
    required_error: 'El tipo de disco es requerido',
  }),
  baseCost: z
    .number()
    .positive('El costo base debe ser positivo'),
  margin: z
    .number()
    .min(0, 'El margen no puede ser negativo'),
  monthlyPrice: z
    .number()
    .positive('El precio mensual debe ser positivo'),
  quarterlyPrice: z.number().positive().optional(),
  semiannualPrice: z.number().positive().optional(),
  annualPrice: z.number().positive().optional(),
  currency: z
    .string()
    .min(1, 'La moneda es requerida')
    .default('USD'),
  regions: z
    .array(z.string())
    .min(1, 'Debe seleccionar al menos una región'),
  images: z
    .array(z.string())
    .min(1, 'Debe seleccionar al menos una imagen'),
  features: z
    .array(z.string())
    .min(1, 'Debe agregar al menos una característica'),
})

export type ProductFormData = z.infer<typeof productSchema>

export const adminTicketReplySchema = z.object({
  message: z
    .string()
    .min(1, 'El mensaje es requerido')
    .max(2000, 'El mensaje no puede exceder 2000 caracteres'),
})

export type AdminTicketReplyFormData = z.infer<typeof adminTicketReplySchema>

export const updateTicketStatusSchema = z.object({
  status: z.enum(['open', 'pending', 'resolved', 'closed'], {
    required_error: 'El estado es requerido',
  }),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
})

export type UpdateTicketStatusFormData = z.infer<typeof updateTicketStatusSchema>
