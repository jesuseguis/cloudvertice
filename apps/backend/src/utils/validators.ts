import Joi from 'joi'

// Auth schemas
export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email must be a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required',
    }),
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'First name must be at least 2 characters',
    'string.max': 'First name must not exceed 50 characters',
    'any.required': 'First name is required',
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Last name must be at least 2 characters',
    'string.max': 'Last name must not exceed 50 characters',
    'any.required': 'Last name is required',
  }),
  phone: Joi.string().optional(),
})

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email must be a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
})

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required',
  }),
})

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email must be a valid email address',
    'any.required': 'Email is required',
  }),
})

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required',
  }),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.pattern.base':
        'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'New password is required',
    }),
})

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Reset token is required',
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required',
    }),
})

export const verifyEmailSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Verification token is required',
  }),
})

// Product schemas
export const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Product name must be at least 2 characters',
    'string.max': 'Product name must not exceed 100 characters',
    'any.required': 'Product name is required',
  }),
  description: Joi.string().max(500).optional().messages({
    'string.max': 'Description must not exceed 500 characters',
  }),
  contaboProductId: Joi.string().required().messages({
    'any.required': 'Product ID is required',
  }),
  ramMb: Joi.number().integer().positive().required().messages({
    'any.required': 'RAM is required',
    'number.positive': 'RAM must be positive',
  }),
  cpuCores: Joi.number().integer().positive().required().messages({
    'any.required': 'CPU is required',
    'number.positive': 'CPU must be positive',
  }),
  diskGb: Joi.number().integer().positive().required().messages({
    'any.required': 'Disk is required',
    'number.positive': 'Disk must be positive',
  }),
  diskType: Joi.string().valid('NVMe', 'SSD', 'HDD').required().messages({
    'any.required': 'Disk type is required',
    'any.only': 'Disk type must be one of: NVME, SSD, HDD',
  }),
  regions: Joi.array().items(Joi.string()).required().messages({
    'any.required': 'Regions are required',
    'array.base': 'Regions must be an array',
  }),
  basePrice: Joi.number().positive().required().messages({
    'any.required': 'Base price is required',
    'number.positive': 'Base price must be positive',
  }),
  sellingPrice: Joi.number().positive().required().messages({
    'any.required': 'Selling price is required',
    'number.positive': 'Selling price must be positive',
  }),
  sortOrder: Joi.number().integer().optional(),
  isActive: Joi.boolean().optional(),
})

export const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Product name must be at least 2 characters',
    'string.max': 'Product name must not exceed 100 characters',
  }),
  description: Joi.string().max(500).optional().messages({
    'string.max': 'Description must not exceed 500 characters',
  }),
  contaboProductId: Joi.string().optional(),
  ramMb: Joi.number().integer().positive().optional().messages({
    'number.positive': 'RAM must be positive',
  }),
  cpuCores: Joi.number().integer().positive().optional().messages({
    'number.positive': 'CPU must be positive',
  }),
  diskGb: Joi.number().integer().positive().optional().messages({
    'number.positive': 'Disk must be positive',
  }),
  diskType: Joi.string().valid('NVMe', 'SSD', 'HDD').optional().messages({
    'any.only': 'Disk type must be one of: NVME, SSD, HDD',
  }),
  regions: Joi.array().items(Joi.string()).optional().messages({
    'array.base': 'Regions must be an array',
  }),
  basePrice: Joi.number().positive().optional().messages({
    'number.positive': 'Base price must be positive',
  }),
  sellingPrice: Joi.number().positive().optional().messages({
    'number.positive': 'Selling price must be positive',
  }),
  sortOrder: Joi.number().integer().optional(),
  isActive: Joi.boolean().optional(),
  showOnHome: Joi.boolean().optional(),
  homeOrder: Joi.number().integer().min(0).max(2).optional(),
  isRecommended: Joi.boolean().optional(),
})

export const productFiltersSchema = Joi.object({
  diskType: Joi.string().valid('NVMe', 'SSD', 'HDD').optional(),
  minRam: Joi.number().integer().positive().optional(),
  maxRam: Joi.number().integer().positive().optional(),
  minCpu: Joi.number().integer().positive().optional(),
  maxCpu: Joi.number().integer().positive().optional(),
  isActive: Joi.boolean().optional(),
  search: Joi.string().optional(),
})

export const priceCalculationSchema = Joi.object({
  periodMonths: Joi.number().integer().positive().valid(1, 3, 6, 12).required().messages({
    'any.required': 'Billing period is required',
    'any.only': 'Billing period must be 1, 3, 6, or 12 months',
  }),
})

// Image schemas
export const createImageSchema = Joi.object({
  contaboImageId: Joi.string().required().messages({
    'any.required': 'Image ID is required',
  }),
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Image name must be at least 2 characters',
    'string.max': 'Image name must not exceed 100 characters',
    'any.required': 'Image name is required',
  }),
  description: Joi.string().max(500).optional().messages({
    'string.max': 'Description must not exceed 500 characters',
  }),
  osType: Joi.string().required().messages({
    'any.required': 'OS type is required',
  }),
  osVersion: Joi.string().required().messages({
    'any.required': 'OS version is required',
  }),
  defaultUser: Joi.string().optional(),
  minDisk: Joi.number().integer().positive().optional().messages({
    'number.positive': 'Minimum disk must be positive',
  }),
  size: Joi.number().integer().positive().optional().messages({
    'number.positive': 'Size must be positive',
  }),
  isActive: Joi.boolean().optional(),
})

export const updateImageSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Image name must be at least 2 characters',
    'string.max': 'Image name must not exceed 100 characters',
  }),
  description: Joi.string().max(500).optional().messages({
    'string.max': 'Description must not exceed 500 characters',
  }),
  osType: Joi.string().optional(),
  osVersion: Joi.string().optional(),
  defaultUser: Joi.string().optional(),
  minDisk: Joi.number().integer().positive().optional().messages({
    'number.positive': 'Minimum disk must be positive',
  }),
  size: Joi.number().integer().positive().optional().messages({
    'number.positive': 'Size must be positive',
  }),
  isActive: Joi.boolean().optional(),
})

export const imageFiltersSchema = Joi.object({
  osType: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
  search: Joi.string().optional(),
})

// Order schemas
export const createOrderSchema = Joi.object({
  productId: Joi.string().required().messages({
    'any.required': 'Product ID is required',
  }),
  periodMonths: Joi.number().integer().valid(1, 3, 6, 12).required().messages({
    'any.required': 'Billing period is required',
    'any.only': 'Billing period must be 1, 3, 6, or 12 months',
  }),
  region: Joi.string().optional(),
  imageId: Joi.string().optional(),
  sshKeyIds: Joi.array().items(Joi.string()).optional().messages({
    'array.base': 'SSH keys must be an array',
  }),
  userData: Joi.string().optional().messages({
    'string.max': 'User data must not exceed 5000 characters',
  }),
})

export const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('PENDING', 'PAID', 'PROCESSING', 'PROVISIONING', 'COMPLETED', 'CANCELLED')
    .required()
    .messages({
      'any.required': 'Status is required',
      'any.only': 'Invalid status',
    }),
  adminNotes: Joi.string().max(500).optional().messages({
    'string.max': 'Admin notes must not exceed 500 characters',
  }),
})

export const assignVpsSchema = Joi.object({
  vpsInstanceId: Joi.string().required().messages({
    'any.required': 'VPS instance ID is required',
  }),
})

export const orderFiltersSchema = Joi.object({
  status: Joi.string().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
})

// Payment schemas
export const createPaymentIntentSchema = Joi.object({
  orderId: Joi.string().required().messages({
    'any.required': 'Order ID is required',
  }),
})

export const refundPaymentSchema = Joi.object({
  amount: Joi.number().positive().optional().messages({
    'number.positive': 'Refund amount must be positive',
  }),
})

// VPS schemas
export const createVpsSchema = Joi.object({
  orderId: Joi.string().required().messages({
    'any.required': 'Order ID is required',
  }),
  contaboInstanceId: Joi.string().required().messages({
    'any.required': 'Instance ID is required',
  }),
  ipAddress: Joi.string().ip().required().messages({
    'string.ip': 'Invalid IP address',
    'any.required': 'IP address is required',
  }),
  rootPassword: Joi.string().min(8).required().messages({
    'string.min': 'Root password must be at least 8 characters',
    'any.required': 'Root password is required',
  }),
  hostname: Joi.string().max(100).optional().messages({
    'string.max': 'Hostname must not exceed 100 characters',
  }),
  region: Joi.string().optional(),
})

export const updateVpsSchema = Joi.object({
  ipAddress: Joi.string().ip().optional().messages({
    'string.ip': 'Invalid IP address',
  }),
  rootPassword: Joi.string().min(8).optional().messages({
    'string.min': 'Root password must be at least 8 characters',
  }),
  hostname: Joi.string().max(100).optional().messages({
    'string.max': 'Hostname must not exceed 100 characters',
  }),
  region: Joi.string().optional(),
})

// SSH Key schemas
export const createSshKeySchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'SSH key name must be at least 2 characters',
    'string.max': 'SSH key name must not exceed 100 characters',
    'any.required': 'SSH key name is required',
  }),
  publicKey: Joi.string().required().messages({
    'any.required': 'Public key is required',
  }),
})

export const updateSshKeySchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'SSH key name must be at least 2 characters',
    'string.max': 'SSH key name must not exceed 100 characters',
    'any.required': 'SSH key name is required',
  }),
})

// Snapshot schemas
export const createSnapshotSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Snapshot name must be at least 2 characters',
    'string.max': 'Snapshot name must not exceed 100 characters',
    'any.required': 'Snapshot name is required',
  }),
  description: Joi.string().max(500).allow('').optional().messages({
    'string.max': 'Description must not exceed 500 characters',
  }),
})

// Admin schemas
export const provisionOrderSchema = Joi.object({
  contaboInstanceId: Joi.string().required().messages({
    'any.required': 'Instance ID is required',
  }),
  ipAddress: Joi.string().ip().required().messages({
    'string.ip': 'Invalid IP address',
    'any.required': 'IP address is required',
  }),
  rootPassword: Joi.string().min(8).required().messages({
    'string.min': 'Root password must be at least 8 characters',
    'any.required': 'Root password is required',
  }),
  region: Joi.string().allow('').optional().messages({
    'string.base': 'Region must be a string',
  }),
  notes: Joi.string().allow('').max(1000).optional().messages({
    'string.max': 'Notes must not exceed 1000 characters',
  }),
  hostname: Joi.string().max(100).optional().messages({
    'string.max': 'Hostname must not exceed 100 characters',
  }),
})

export const analyticsQuerySchema = Joi.object({
  period: Joi.string().valid('week', 'month', 'year').optional().messages({
    'any.only': 'Period must be one of: week, month, year',
  }),
})

// Invoice schemas
export const createInvoiceSchema = Joi.object({
  orderId: Joi.string().required().messages({
    'any.required': 'Order ID is required',
  }),
})

export const updateInvoiceStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'PAID', 'CANCELLED').optional().messages({
    'any.only': 'Invalid invoice status',
  }),
})

// Ticket schemas
export const createTicketSchema = Joi.object({
  subject: Joi.string().min(5).max(200).required().messages({
    'string.min': 'Subject must be at least 5 characters',
    'string.max': 'Subject must not exceed 200 characters',
    'any.required': 'Subject is required',
  }),
  message: Joi.string().min(10).required().messages({
    'string.min': 'Message must be at least 10 characters',
    'any.required': 'Message is required',
  }),
  priority: Joi.string().valid('LOW', 'NORMAL', 'HIGH', 'URGENT').optional().messages({
    'any.only': 'Priority must be one of: LOW, NORMAL, HIGH, URGENT',
  }),
  vpsInstanceId: Joi.string().optional(),
  category: Joi.string().valid('technical', 'billing', 'general').optional(),
})

export const updateTicketSchema = Joi.object({
  status: Joi.string().valid('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED').optional().messages({
    'any.only': 'Invalid ticket status',
  }),
  priority: Joi.string().valid('LOW', 'NORMAL', 'HIGH', 'URGENT').optional().messages({
    'any.only': 'Priority must be one of: LOW, NORMAL, HIGH, URGENT',
  }),
})

export const createMessageSchema = Joi.object({
  message: Joi.string().min(1).required().messages({
    'string.min': 'Message cannot be empty',
    'any.required': 'Message is required',
  }),
  isAdmin: Joi.boolean().optional(),
})

export const ticketFiltersSchema = Joi.object({
  status: Joi.string().optional(),
  priority: Joi.string().optional(),
})

/**
 * Validate SSH public key format
 * @param publicKey - SSH public key string
 * @returns Validation result with valid flag and optional error message
 */
export function validateSshPublicKey(publicKey: string): {
  valid: boolean
  error?: string
  fingerprint?: string
} {
  const trimmed = publicKey.trim()

  // SSH public key format: "ssh-rsa AAAAB3... comment" or similar
  const sshKeyPattern = /^(ssh-(rsa|ed25519|dss|ecdsa)|ecdsa-sha2-nistp(?:256|384|521))\s+[A-Za-z0-9+/=]+\s*/i

  if (!sshKeyPattern.test(trimmed)) {
    return {
      valid: false,
      error: 'Invalid SSH public key format. Expected format: ssh-rsa AAAAB3... comment',
    }
  }

  // Generate fingerprint
  const parts = trimmed.split(/\s+/)
  const keyData = parts[1]

  const crypto = require('crypto')
  const fingerprint = crypto
    .createHash('sha256')
    .update(Buffer.from(keyData, 'base64'))
    .digest('hex')
    .substring(0, 16)

  return { valid: true, fingerprint }
}
