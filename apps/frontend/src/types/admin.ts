// Admin-specific types

export interface AdminMetrics {
  revenue: {
    total: number
    thisMonth: number
    thisYear: number
    percentChange: number
  }
  orders: {
    total: number
    pending: number
    processing: number
    completed: number
    cancelled: number
  }
  clients: {
    total: number
    active: number
    newThisMonth: number
    newThisYear: number
  }
  vps: {
    total: number
    active: number
    provisioning: number
    suspended: number
  }
  tickets: {
    open: number
    pending: number
    resolved: number
  }
}

export interface AnalyticsData {
  period: '7d' | '30d' | '90d' | '1y' | 'all'
  revenue: {
    date: string
    amount: number
    orders: number
  }[]
  orders: {
    date: string
    count: number
    completed: number
    cancelled: number
  }[]
  clients: {
    date: string
    count: number
    new: number
  }[]
  vps: {
    date: string
    active: number
    provisioned: number
  }[]
}

export interface ClientDetail {
  id: string
  name: string
  email: string
  createdAt: string
  lastActiveAt?: string
  metrics: {
    totalOrders: number
    activeVps: number
    totalSpent: number
    openTickets: number
  }
  vpsInstances: Array<{
    id: string
    name: string
    status: string
    ipAddress: string
    createdAt: string
  }>
}

export interface SystemAlert {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  actionUrl?: string
  createdAt: string
  read: boolean
}
