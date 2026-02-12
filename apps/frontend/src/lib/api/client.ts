import { apiClient } from './axios'
import type {
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  AuthResponse,
  User,
  VPSInstance,
  VPSActionResponse,
  Snapshot,
  Order,
  Invoice,
  SupportTicket,
  Product,
  PaginatedResponse,
  PaginationParams,
  CreateOrderRequest,
  CreateTicketRequest,
  AdminMetrics,
  AnalyticsData,
} from '@/types'
import { API_ENDPOINTS } from './endpoints'

// Generic request wrapper that handles backend response format
async function request<T>(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
  data?: unknown,
  config?: { params?: Record<string, unknown>; headers?: Record<string, string> }
): Promise<T> {
  const response = await apiClient.request<{ success: boolean; data: T; message?: string }>({
    method,
    url,
    data,
    params: config?.params,
    headers: config?.headers,
  })
  // Backend returns { success: true, data: {...} }, so we extract the data field
  return response.data.data
}

interface RequestConfig {
  params?: Record<string, unknown>
  headers?: Record<string, string>
}

// Helper to extract data from paginated response
function extractData<T>(response: { data: PaginatedResponse<T> }): PaginatedResponse<T> {
  return response.data
}

// Auth API
export const authApi = {
  login: async (credentials: LoginRequest) => {
    const response = await request<{ user: User; tokens: { accessToken: string; refreshToken: string } }>(
      'post',
      API_ENDPOINTS.auth.login,
      credentials
    )

    // Transform backend response to frontend format
    const backendRole = response.user.role as unknown as string
    return {
      user: {
        ...response.user,
        role: backendRole === 'CUSTOMER' ? 'client' : backendRole.toLowerCase() as 'client' | 'admin',
        name: `${response.user.firstName || ''} ${response.user.lastName || ''}`.trim() || response.user.email,
      },
      token: response.tokens.accessToken,
      refreshToken: response.tokens.refreshToken,
    } as AuthResponse
  },

  register: async (data: RegisterRequest) => {
    const response = await request<{ user: User; tokens: { accessToken: string; refreshToken: string } }>(
      'post',
      API_ENDPOINTS.auth.register,
      data
    )

    const backendRole = response.user.role as unknown as string
    return {
      user: {
        ...response.user,
        role: backendRole === 'CUSTOMER' ? 'client' : backendRole.toLowerCase() as 'client' | 'admin',
        name: `${response.user.firstName || ''} ${response.user.lastName || ''}`.trim() || response.user.email,
      },
      token: response.tokens.accessToken,
      refreshToken: response.tokens.refreshToken,
    } as AuthResponse
  },

  logout: () => request<void>('post', API_ENDPOINTS.auth.logout),

  me: async () => {
    const response = await request<User>('get', API_ENDPOINTS.auth.me)
    const backendRole = response.role as unknown as string

    return {
      ...response,
      role: backendRole === 'CUSTOMER' ? 'client' : backendRole.toLowerCase() as 'client' | 'admin',
      name: `${response.firstName || ''} ${response.lastName || ''}`.trim() || response.email,
    }
  },

  updateProfile: (data: UpdateProfileRequest) =>
    request<User>('put', API_ENDPOINTS.auth.updateProfile, data),

  changePassword: (data: ChangePasswordRequest) =>
    request<void>('post', API_ENDPOINTS.auth.changePassword, data),

  forgotPassword: (email: string) =>
    request<void>('post', API_ENDPOINTS.auth.forgotPassword, { email }),

  resetPassword: (token: string, password: string) =>
    request<void>('post', API_ENDPOINTS.auth.resetPassword, { token, password }),
}

// Client VPS API
export const vpsApi = {
  list: (params?: PaginationParams) =>
    request<PaginatedResponse<VPSInstance>>('get', API_ENDPOINTS.client.vps.list, undefined, {
      params: params as Record<string, unknown>
    }),

  byId: (id: string) =>
    request<VPSInstance>('get', API_ENDPOINTS.client.vps.byId(id)),

  history: (id: string) =>
    request<unknown[]>('get', API_ENDPOINTS.client.vps.history(id)),

  getPassword: (id: string) =>
    request<{ password: string; showOnce: boolean }>('get', API_ENDPOINTS.client.vps.password(id)),

  start: (id: string) =>
    request<VPSActionResponse>('post', API_ENDPOINTS.client.vps.actions(id, 'start')),

  stop: (id: string) =>
    request<VPSActionResponse>('post', API_ENDPOINTS.client.vps.actions(id, 'stop')),

  restart: (id: string) =>
    request<VPSActionResponse>('post', API_ENDPOINTS.client.vps.actions(id, 'restart')),

  shutdown: (id: string) =>
    request<VPSActionResponse>('post', API_ENDPOINTS.client.vps.actions(id, 'shutdown')),

  rescueMode: (id: string, enable: boolean) =>
    request<VPSActionResponse>('post', API_ENDPOINTS.client.vps.rescueMode(id), { enable }),

  resetPassword: (id: string, newPassword: string) =>
    request<VPSActionResponse>('post', API_ENDPOINTS.client.vps.resetPassword(id), { newPassword }),

  snapshots: (id: string) =>
    request<Snapshot[]>('get', API_ENDPOINTS.client.vps.snapshots(id)),

  snapshotById: (id: string, snapshotId: string) =>
    request<Snapshot>('get', API_ENDPOINTS.client.vps.snapshotById(id, snapshotId)),

  createSnapshot: (id: string, data: { name: string; description?: string }) =>
    request<Snapshot>('post', API_ENDPOINTS.client.vps.createSnapshot(id), data),

  restoreSnapshot: (id: string, snapshotId: string) =>
    request<void>('post', API_ENDPOINTS.client.vps.restoreSnapshot(id, snapshotId)),

  deleteSnapshot: (id: string, snapshotId: string) =>
    request<void>('delete', API_ENDPOINTS.client.vps.deleteSnapshot(id, snapshotId)),

  syncSnapshots: (id: string) =>
    request<Snapshot[]>('post', API_ENDPOINTS.client.vps.syncSnapshots(id)),

  snapshotStatistics: (id: string) =>
    request<{ total: number; usedSpace: number; availableSpace: number }>(
      'get',
      API_ENDPOINTS.client.vps.snapshotStatistics(id)
    ),
}

// Client Orders API
export const ordersApi = {
  list: (params?: PaginationParams) =>
    request<PaginatedResponse<Order>>('get', API_ENDPOINTS.client.orders.list, undefined, {
      params: params as Record<string, unknown>
    }),

  byId: (id: string) =>
    request<Order>('get', API_ENDPOINTS.client.orders.byId(id)),

  create: (data: CreateOrderRequest) =>
    request<Order>('post', API_ENDPOINTS.client.orders.create, data),

  cancel: (id: string) =>
    request<Order>('put', API_ENDPOINTS.client.orders.cancel(id)),
}

// Client Invoices API
export const invoicesApi = {
  list: (params?: PaginationParams) =>
    request<PaginatedResponse<Invoice>>('get', API_ENDPOINTS.client.invoices.list, undefined, {
      params: params as Record<string, unknown>
    }),

  byId: (id: string) =>
    request<Invoice>('get', API_ENDPOINTS.client.invoices.byId(id)),

  downloadPdf: (id: string) => {
    window.open(API_ENDPOINTS.client.invoices.downloadPdf(id), '_blank')
  },

  pay: (id: string) =>
    request<{ invoiceId: string; paymentUrl?: string }>('post', API_ENDPOINTS.client.invoices.pay(id)),
}

// Client Support API
export const supportApi = {
  list: (params?: PaginationParams) =>
    request<PaginatedResponse<SupportTicket>>('get', API_ENDPOINTS.client.tickets.list, undefined, {
      params: params as Record<string, unknown>
    }),

  byId: (id: string) =>
    request<SupportTicket>('get', API_ENDPOINTS.client.tickets.byId(id)),

  categories: () =>
    request<string[]>('get', API_ENDPOINTS.client.tickets.categories),

  create: (data: CreateTicketRequest) =>
    request<SupportTicket>('post', API_ENDPOINTS.client.tickets.create, data),

  addMessage: (id: string, message: string) =>
    request<SupportTicket>('post', API_ENDPOINTS.client.tickets.addMessage(id), { message }),

  close: (id: string) =>
    request<SupportTicket>('put', API_ENDPOINTS.client.tickets.close(id)),
}

// Admin API
export const adminApi = {
  metrics: () =>
    request<AdminMetrics>('get', API_ENDPOINTS.admin.metrics),

  analytics: (period: 'week' | 'month' | 'year') =>
    request<AnalyticsData>('get', API_ENDPOINTS.admin.analytics, undefined, {
      params: { period }
    }),

  orders: {
    list: (params?: PaginationParams) =>
      request<PaginatedResponse<Order>>('get', API_ENDPOINTS.admin.orders.list, undefined, {
        params: params as Record<string, unknown>
      }),

    pending: () =>
      request<Order[]>('get', API_ENDPOINTS.admin.orders.pending),

    statistics: () =>
      request<{ total: number; paid: number; pending: number; cancelled: number }>(
        'get',
        API_ENDPOINTS.admin.orders.statistics
      ),

    byId: (id: string) =>
      request<Order>('get', API_ENDPOINTS.admin.orders.byId(id)),

    updateStatus: (id: string, status: string, data?: Record<string, unknown>) =>
      request<Order>('put', API_ENDPOINTS.admin.orders.updateStatus(id), { status, ...data }),

    provision: (id: string, data: {
      contaboInstanceId: string
      ipAddress: string
      rootPassword: string
      region: string
      notes?: string
    }) =>
      request<Order>('post', API_ENDPOINTS.admin.orders.provision(id), data),

    assign: (id: string, data: {
      contaboInstanceId: string
      ipAddress: string
      rootPassword: string
      region: string
      notes?: string
    }) =>
      request<Order>('post', API_ENDPOINTS.admin.orders.assign(id), data),
  },

  products: {
    list: () =>
      request<Product[]>('get', API_ENDPOINTS.admin.products.list),

    byId: (id: string) =>
      request<Product>('get', API_ENDPOINTS.admin.products.byId(id)),

    price: (id: string, billingPeriod: 'monthly' | 'annual', region?: string) =>
      request<{ price: number; currency: string }>('get', API_ENDPOINTS.admin.products.price(id), undefined, {
        params: { billingPeriod, region }
      }),

    create: (data: unknown) =>
      request<Product>('post', API_ENDPOINTS.admin.products.create, data),

    update: (id: string, data: unknown) =>
      request<Product>('put', API_ENDPOINTS.admin.products.update(id), data),

    delete: (id: string) =>
      request<void>('delete', API_ENDPOINTS.admin.products.delete(id)),

    custom: () =>
      request<Product[]>('get', API_ENDPOINTS.admin.products.custom),

    sync: () =>
      request<{ created: number; updated: number; failed: number }>(
        'post',
        API_ENDPOINTS.admin.products.sync
      ),
  },

  regions: {
    list: () =>
      request<any[]>('get', API_ENDPOINTS.admin.regions.list),

    byId: (id: string) =>
      request<any>('get', API_ENDPOINTS.admin.regions.byId(id)),

    byCode: (code: string) =>
      request<any>('get', API_ENDPOINTS.admin.regions.byCode(code)),

    create: (data: unknown) =>
      request<any>('post', API_ENDPOINTS.admin.regions.create, data),

    update: (id: string, data: unknown) =>
      request<any>('put', API_ENDPOINTS.admin.regions.update(id), data),

    delete: (id: string) =>
      request<void>('delete', API_ENDPOINTS.admin.regions.delete(id)),

    toggleActive: (id: string) =>
      request<any>('patch', API_ENDPOINTS.admin.regions.toggleActive(id)),

    sync: () =>
      request<{ created: number; updated: number; failed: number }>(
        'post',
        API_ENDPOINTS.admin.regions.sync
      ),
  },

  operatingSystems: {
    list: () =>
      request<any[]>('get', API_ENDPOINTS.admin.operatingSystems.list),

    byId: (id: string) =>
      request<any>('get', API_ENDPOINTS.admin.operatingSystems.byId(id)),

    byImageId: (imageId: string) =>
      request<any>('get', API_ENDPOINTS.admin.operatingSystems.byImageId(imageId)),

    create: (data: unknown) =>
      request<any>('post', API_ENDPOINTS.admin.operatingSystems.create, data),

    update: (id: string, data: unknown) =>
      request<any>('put', API_ENDPOINTS.admin.operatingSystems.update(id), data),

    delete: (id: string) =>
      request<void>('delete', API_ENDPOINTS.admin.operatingSystems.delete(id)),

    updatePrice: (id: string, priceAdjustment: number) =>
      request<any>('patch', API_ENDPOINTS.admin.operatingSystems.updatePrice(id), { priceAdjustment }),

    toggleActive: (id: string) =>
      request<any>('patch', API_ENDPOINTS.admin.operatingSystems.toggleActive(id)),

    sync: () =>
      request<{ created: number; updated: number; failed: number }>(
        'post',
        API_ENDPOINTS.admin.operatingSystems.sync
      ),
  },

  users: {
    list: async (params?: PaginationParams) => {
      const response = await apiClient.request<{
        success: boolean
        data: any[]
        pagination: {
          page: number
          limit: number
          total: number
          totalPages: number
        }
      }>({
        method: 'get',
        url: API_ENDPOINTS.admin.users.list,
        params: params as Record<string, unknown>,
      })
      // Return full response structure with data and pagination
      return { data: response.data.data, pagination: response.data.pagination }
    },

    statistics: () =>
      request<{ total: number; customers: number; admins: number; newThisMonth: number; activeCustomers: number }>(
        'get',
        API_ENDPOINTS.admin.users.statistics
      ),

    byId: (id: string) =>
      request<any>('get', API_ENDPOINTS.admin.users.byId(id)),

    update: (id: string, data: unknown) =>
      request<any>('put', API_ENDPOINTS.admin.users.update(id), data),
  },

  vps: {
    list: (params?: PaginationParams) =>
      request<PaginatedResponse<VPSInstance>>('get', API_ENDPOINTS.admin.vps.list, undefined, {
        params: params as Record<string, unknown>
      }),

    statistics: () =>
      request<{ total: number; active: number; suspended: number; provisioning: number }>(
        'get',
        API_ENDPOINTS.admin.vps.statistics
      ),

    byId: (id: string) =>
      request<VPSInstance>('get', API_ENDPOINTS.admin.vps.byId(id)),

    suspend: (id: string) =>
      request<VPSInstance>('post', API_ENDPOINTS.admin.vps.suspend(id)),

    restore: (id: string) =>
      request<VPSInstance>('post', API_ENDPOINTS.admin.vps.restore(id)),

    activate: (id: string) =>
      request<VPSInstance>('post', API_ENDPOINTS.admin.vps.restore(id)),

    updateSuspension: (id: string, data: {
      autoRenew?: boolean
      suspensionReason?: string
      suspensionExpiry?: string
      status?: string
    }) =>
      request<VPSInstance>('put', API_ENDPOINTS.admin.vps.updateSuspension(id), data),

    sync: (id: string) =>
      request<VPSInstance>('post', API_ENDPOINTS.admin.vps.sync(id)),
  },

  tickets: {
    list: (params?: PaginationParams) =>
      request<PaginatedResponse<SupportTicket>>('get', API_ENDPOINTS.admin.tickets.list, undefined, {
        params: params as Record<string, unknown>
      }),

    statistics: () =>
      request<{ total: number; open: number; pending: number; resolved: number }>(
        'get',
        API_ENDPOINTS.admin.tickets.statistics
      ),

    byId: (id: string) =>
      request<SupportTicket>('get', API_ENDPOINTS.admin.tickets.byId(id)),

    update: (id: string, data: {
      status?: string
      priority?: string
      assignedTo?: string
    }) => {
      // Transform frontend lowercase values to backend uppercase
      const transformedData: Record<string, unknown> = {}
      if (data.status) {
        const statusMap: Record<string, string> = {
          open: 'OPEN',
          pending: 'IN_PROGRESS',
          resolved: 'RESOLVED',
          closed: 'CLOSED',
        }
        transformedData.status = statusMap[data.status] || data.status.toUpperCase()
      }
      if (data.priority) {
        const priorityMap: Record<string, string> = {
          low: 'LOW',
          medium: 'NORMAL',
          high: 'HIGH',
          urgent: 'URGENT',
        }
        transformedData.priority = priorityMap[data.priority] || data.priority.toUpperCase()
      }
      if (data.assignedTo !== undefined) {
        transformedData.assignedTo = data.assignedTo
      }
      return request<SupportTicket>('put', API_ENDPOINTS.admin.tickets.update(id), transformedData)
    },

    reply: (id: string, message: string) =>
      request<SupportTicket>('post', API_ENDPOINTS.client.tickets.addMessage(id), { message }),
  },

  invoices: {
    list: (params?: PaginationParams) =>
      request<PaginatedResponse<Invoice>>('get', API_ENDPOINTS.admin.invoices.list, undefined, {
        params: params as Record<string, unknown>
      }),

    statistics: () =>
      request<{ total: number; paid: number; pending: number; overdue: number }>(
        'get',
        API_ENDPOINTS.admin.invoices.statistics
      ),

    overdue: () =>
      request<Invoice[]>('get', API_ENDPOINTS.admin.invoices.overdue),

    create: (data: unknown) =>
      request<Invoice>('post', API_ENDPOINTS.admin.invoices.create, data),

    updateStatus: (id: string, status: string) =>
      request<Invoice>('put', API_ENDPOINTS.admin.invoices.updateStatus(id), { status }),
  },

  alerts: () =>
    request<Array<{ type: string; message: string; severity: 'info' | 'warning' | 'error' }>>(
      'get',
      API_ENDPOINTS.admin.alerts
    ),

  activity: (limit = 20) =>
    request<Array<{ action: string; entity: string; timestamp: string; user: string }>>(
      'get',
      API_ENDPOINTS.admin.activity,
      undefined,
      { params: { limit } }
    ),

  contaboInstances: () =>
    request<any[]>('get', API_ENDPOINTS.admin.contaboInstances),

  contaboInstancesAvailable: () =>
    request<any[]>('get', API_ENDPOINTS.admin.contaboInstancesAvailable),

  images: () =>
    request<any[]>('get', API_ENDPOINTS.admin.images),

  syncImages: () =>
    request<any[]>('post', API_ENDPOINTS.admin.syncImages),
}

// Public API
export const publicApi = {
  products: () =>
    request<Product[]>('get', API_ENDPOINTS.public.products),

  productsFeatured: () =>
    request<Product[]>('get', API_ENDPOINTS.public.productsFeatured),

  images: () =>
    request<any[]>('get', API_ENDPOINTS.public.images),

  regions: () =>
    request<string[]>('get', API_ENDPOINTS.public.regions),

  config: () =>
    request<{ annualDiscountPercent: number; annualDiscountMultiplier: number }>(
      'get',
      API_ENDPOINTS.public.config
    ),
}

// Payments API
export const paymentsApi = {
  createIntent: (orderId: string) =>
    request<{ clientSecret: string; paymentIntentId: string; amount: number; currency: string }>(
      'post',
      API_ENDPOINTS.payments.createIntent,
      { orderId }
    ),

  confirm: (paymentIntentId: string, orderId: string) =>
    request<{ status: string }>(
      'post',
      API_ENDPOINTS.payments.confirm,
      { paymentIntentId, orderId }
    ),

  getIntent: (intentId: string) =>
    request<{ id: string; status: string; amount: number; currency: string }>(
      'get',
      API_ENDPOINTS.payments.getIntent(intentId)
    ),

  getTransactionByOrder: (orderId: string) =>
    request<{ id: string; orderId: string; stripePaymentIntentId: string; amount: number; currency: string; status: string; createdAt: string }>(
      'get',
      API_ENDPOINTS.payments.getByOrder(orderId)
    ),

  getTransactions: () =>
    request<Array<{ id: string; orderId: string; stripePaymentIntentId: string; amount: number; currency: string; status: string; createdAt: string }>>(
      'get',
      API_ENDPOINTS.payments.transactions
    ),

  refund: (transactionId: string, amount?: number) =>
    request<void>('post', API_ENDPOINTS.payments.refund(transactionId), { amount }),
}
