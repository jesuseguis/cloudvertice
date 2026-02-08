// Order and billing types

export type OrderStatus = 'PENDING' | 'PAID' | 'PROCESSING' | 'PROVISIONING' | 'COMPLETED' | 'CANCELLED'

export type BillingPeriod = 'monthly' | 'quarterly' | 'semiannual' | 'annual'

export interface Order {
  id: string
  userId: string
  orderNumber: string
  status: OrderStatus
  product?: {
    id: string
    name: string
    cpuCores: number
    ramMb: number
    diskGb: number
    diskType: string
  }
  totalAmount: number
  basePrice: number
  regionPriceAdj: number
  osPriceAdj: number
  currency: string
  periodMonths: number
  region: string
  imageId?: string | null
  createdAt: string
  updatedAt: string
  paidAt?: string | null
  completedAt?: string | null
}

export interface OrderItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  specs: {
    cpuCores: number
    ramGB: number
    diskGB: number
  }
  config: {
    region: string
    imageName: string
  }
}

export interface OrderMetadata {
  vpsInstanceId?: string
  contaboInstanceId?: string
  ipAddress?: string
  rootPassword?: string
  provisioningNotes?: string
}

export interface CreateOrderRequest {
  items: {
    productId: string
    quantity: number
    config: {
      region: string
      imageDataId: string
      imageName: string
    }
  }[]
  billingPeriod: BillingPeriod
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus
  vpsInstanceId?: string
  contaboInstanceId?: string
  ipAddress?: string
  rootPassword?: string
  provisioningNotes?: string
}

export interface Invoice {
  id: string
  userId: string
  orderId: string | null
  invoiceNumber: string
  amount: number
  taxAmount: number | null
  total: number
  status: 'PAID' | 'PENDING' | 'CANCELLED' | 'paid' | 'pending' | 'cancelled'
  dueDate: string | null
  paidAt: string | null
  createdAt: string
  order?: any
}

export interface Transaction {
  id: string
  orderId: string
  invoiceId?: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  paymentMethod: string
  paymentId?: string
  createdAt: string
}
