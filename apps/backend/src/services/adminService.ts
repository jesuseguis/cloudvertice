import { PrismaClient, OrderStatus, VpsStatus, TicketStatus } from '@prisma/client'
import { NotFoundError, BadRequestError } from '../middleware/errorHandler'
import { orderService } from './orderService'
import { vpsService } from './vpsService'
import { contaboService } from './contaboService'

const prisma = new PrismaClient()

export interface DashboardMetrics {
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
  sales: {
    byMonth: Array<{ month: string; amount: number; count: number }>
    byProduct: Array<{ productName: string; amount: number; count: number }>
    byRegion: Array<{ region: string; amount: number; count: number }>
  }
  revenue: {
    gross: number
    refunds: number
    net: number
    growthRate: number
  }
  customers: {
    total: number
    newThisMonth: number
    churnRate: number
    averageLifetimeValue: number
  }
  vps: {
    total: number
    active: number
    utilizationRate: number
    averageMonthlyCost: number
  }
}

export interface ProvisionOrderData {
  contaboInstanceId: string
  ipAddress: string
  rootPassword: string
  region?: string
  notes?: string
  hostname?: string
}

export class AdminService {
  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const [
      totalOrders,
      totalClients,
      activeClients,
      newClientsThisMonth,
      newClientsThisYear,
      totalVps,
      activeVps,
      provisioningVps,
      suspendedVps,
      openTickets,
      pendingTickets,
      resolvedTickets,
      pendingOrders,
      processingOrders,
      completedOrders,
      cancelledOrders,
      revenueTotal,
      revenueThisMonth,
      revenueThisYear,
      revenueLastMonth,
    ] = await Promise.all([
      // Orders
      prisma.order.count(),
      // Clients
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({
        where: {
          role: 'CUSTOMER',
          vpsInstances: { some: { status: 'RUNNING' } },
        },
      }),
      prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: { gte: startOfYear },
        },
      }),
      // VPS
      prisma.vpsInstance.count(),
      prisma.vpsInstance.count({ where: { status: 'RUNNING' } }),
      prisma.vpsInstance.count({ where: { status: 'PROVISIONING' } }),
      prisma.vpsInstance.count({ where: { status: 'SUSPENDED' } }),
      // Tickets
      prisma.supportTicket.count({
        where: { status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] } },
      }),
      prisma.supportTicket.count({ where: { status: TicketStatus.WAITING_CUSTOMER } }),
      prisma.supportTicket.count({ where: { status: TicketStatus.RESOLVED } }),
      // Order counts
      prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      prisma.order.count({ where: { status: OrderStatus.PROCESSING } }),
      prisma.order.count({ where: { status: OrderStatus.COMPLETED } }),
      prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
      // Revenue
      this.getRevenueInPeriod(new Date(0), new Date()),
      this.getRevenueInPeriod(startOfMonth, new Date()),
      this.getRevenueInPeriod(startOfYear, new Date()),
      this.getRevenueInPeriod(startOfLastMonth, endOfLastMonth),
    ])

    // Calculate percent change
    const percentChange =
      revenueLastMonth > 0
        ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
        : 0

    return {
      revenue: {
        total: revenueTotal,
        thisMonth: revenueThisMonth,
        thisYear: revenueThisYear,
        percentChange,
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        processing: processingOrders,
        completed: completedOrders,
        cancelled: cancelledOrders,
      },
      clients: {
        total: totalClients,
        active: activeClients,
        newThisMonth: newClientsThisMonth,
        newThisYear: newClientsThisYear,
      },
      vps: {
        total: totalVps,
        active: activeVps,
        provisioning: provisioningVps,
        suspended: suspendedVps,
      },
      tickets: {
        open: openTickets,
        pending: pendingTickets,
        resolved: resolvedTickets,
      },
    }
  }

  /**
   * Get detailed analytics
   */
  async getAnalytics(period: 'week' | 'month' | 'year' = 'month'): Promise<AnalyticsData> {
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
    }

    const [salesByMonth, salesByProduct, salesByRegion, grossRevenue, refunds] = await Promise.all([
      this.getSalesByMonth(startDate, now),
      this.getSalesByProduct(startDate, now),
      this.getSalesByRegion(startDate, now),
      this.getRevenueInPeriod(startDate, now),
      this.getRefundsInPeriod(startDate, now),
    ])

    const [customerStats, vpsStats] = await Promise.all([
      this.getCustomerStats(startDate, now),
      this.getVpsStats(),
    ])

    return {
      sales: {
        byMonth: salesByMonth,
        byProduct: salesByProduct,
        byRegion: salesByRegion,
      },
      revenue: {
        gross: grossRevenue,
        refunds,
        net: grossRevenue - refunds,
        growthRate: await this.calculateGrowthRate(startDate, now),
      },
      customers: customerStats,
      vps: vpsStats,
    }
  }

  /**
   * Get pending orders for provisioning
   */
  async getPendingOrders() {
    return orderService.getPendingOrders()
  }

  /**
   * Provision an order (create VPS instance)
   */
  async provisionOrder(orderId: string, data: ProvisionOrderData) {
    console.log('[PROVISION SERVICE] Fetching order:', orderId)

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true },
    })

    console.log('[PROVISION SERVICE] Order found:', order ? { id: order.id, status: order.status, orderNumber: order.orderNumber } : null)

    if (!order) {
      throw NotFoundError('Order not found')
    }

    console.log('[PROVISION SERVICE] Order status:', order.status, 'Required: PAID, PROCESSING, or PROVISIONING')

    // Allow PAID, PROCESSING, or PROVISIONING (for retries)
    if (order.status !== OrderStatus.PAID && order.status !== OrderStatus.PROCESSING && order.status !== OrderStatus.PROVISIONING) {
      console.log('[PROVISION SERVICE] Status check FAILED')
      throw BadRequestError('Order must be PAID, PROCESSING, or PROVISIONING to provision')
    }

    console.log('[PROVISION SERVICE] Status check PASSED, updating to PROVISIONING')

    // Update order to PROVISIONING
    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PROVISIONING },
    })

    console.log('[PROVISION SERVICE] Creating VPS instance with data:', {
      orderId,
      contaboInstanceId: data.contaboInstanceId,
      ipAddress: data.ipAddress,
      hasRootPassword: !!data.rootPassword,
      region: data.region,
      notes: data.notes,
      hostname: data.hostname,
    })

    // Create VPS instance
    const vps = await vpsService.createVpsInstance({
      orderId,
      contaboInstanceId: data.contaboInstanceId,
      ipAddress: data.ipAddress,
      rootPassword: data.rootPassword,
      region: data.region,
      notes: data.notes,
    })

    console.log('[PROVISION SERVICE] VPS created successfully:', vps.id)
    return vps
  }

  /**
   * Get admin alerts
   */
  async getAlerts() {
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const monthFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    const [expiringThisWeek, expiringThisMonth, expired, pendingOrders, unpaidInvoices] =
      await Promise.all([
        prisma.vpsInstance.count({
          where: {
            expiresAt: { lte: weekFromNow, gte: new Date() },
            status: { notIn: ['EXPIRED', 'TERMINATED', 'SUSPENDED'] },
          },
        }),
        prisma.vpsInstance.count({
          where: {
            expiresAt: { lte: monthFromNow, gte: weekFromNow },
            status: { notIn: ['EXPIRED', 'TERMINATED', 'SUSPENDED'] },
          },
        }),
        prisma.vpsInstance.count({ where: { status: 'EXPIRED' } }),
        prisma.order.count({
          where: { status: { in: [OrderStatus.PAID, OrderStatus.PROCESSING] } },
        }),
        prisma.invoice.count({ where: { status: 'PENDING' } }),
      ])

    const openTickets = await prisma.supportTicket.count({
      where: { status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] } },
    })

    return {
      critical: [
        expired > 0 && { type: 'expired_vps', count: expired, message: `${expired} expired VPS instances` },
        expiringThisWeek > 0 && {
          type: 'expiring_soon',
          count: expiringThisWeek,
          message: `${expiringThisWeek} VPS expiring this week`,
        },
      ].filter(Boolean),
      warning: [
        expiringThisMonth > 0 && {
          type: 'expiring_month',
          count: expiringThisMonth,
          message: `${expiringThisMonth} VPS expiring this month`,
        },
        pendingOrders > 0 && {
          type: 'pending_orders',
          count: pendingOrders,
          message: `${pendingOrders} orders awaiting provisioning`,
        },
        openTickets > 0 && {
          type: 'open_tickets',
          count: openTickets,
          message: `${openTickets} support tickets open`,
        },
      ].filter(Boolean),
      info: [
        unpaidInvoices > 0 && {
          type: 'unpaid_invoices',
          count: unpaidInvoices,
          message: `${unpaidInvoices} unpaid invoices`,
        },
      ].filter(Boolean),
    }
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(limit = 20) {
    const activities: any[] = []

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        product: true,
      },
    })

    recentOrders.forEach((order) => {
      activities.push({
        type: 'order',
        id: order.id,
        status: order.status,
        user: order.user,
        amount: order.totalAmount,
        createdAt: order.createdAt,
      })
    })

    // Recent VPS actions
    const recentActions = await prisma.vpsAction.findMany({
      take: limit,
      orderBy: { requestedAt: 'desc' },
      include: {
        vpsInstance: {
          include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
      },
    })

    recentActions.forEach((action) => {
      activities.push({
        type: 'vps_action',
        id: action.id,
        action: action.actionType,
        user: action.vpsInstance.user,
        vpsId: action.vpsInstanceId,
        createdAt: action.requestedAt,
      })
    })

    // Sort by date and limit
    activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    return activities.slice(0, limit)
  }

  // ==================== Helper Methods ====================


  private async getTotalRevenue(): Promise<number> {
    const result = await prisma.order.aggregate({
      where: { status: { not: OrderStatus.CANCELLED } },
      _sum: { totalAmount: true },
    })
    return Number(result._sum.totalAmount) || 0
  }

  private async getRevenueInPeriod(startDate: Date, endDate: Date): Promise<number> {
    const result = await prisma.order.aggregate({
      where: {
        status: { not: OrderStatus.CANCELLED },
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { totalAmount: true },
    })
    return Number(result._sum.totalAmount) || 0
  }

  private async getRefundsInPeriod(startDate: Date, endDate: Date): Promise<number> {
    const result = await prisma.transaction.aggregate({
      where: {
        status: 'REFUNDED',
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    })
    return Number(result._sum.amount) || 0
  }

  private async getSalesByMonth(startDate: Date, endDate: Date) {
    const orders = await prisma.order.findMany({
      where: {
        status: { not: OrderStatus.CANCELLED },
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    })

    const byMonth = new Map<string, { amount: number; count: number }>()

    orders.forEach((order) => {
      const monthKey = `${order.createdAt.getFullYear()}-${String(
        order.createdAt.getMonth() + 1
      ).padStart(2, '0')}`

      if (!byMonth.has(monthKey)) {
        byMonth.set(monthKey, { amount: 0, count: 0 })
      }

      const current = byMonth.get(monthKey)!
      current.amount += Number(order.totalAmount)
      current.count++
    })

    return Array.from(byMonth.entries()).map(([month, data]) => ({
      month,
      amount: data.amount,
      count: data.count,
    }))
  }

  private async getSalesByProduct(startDate: Date, endDate: Date) {
    const result = await prisma.order.groupBy({
      by: ['productId'],
      where: {
        status: { not: OrderStatus.CANCELLED },
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { totalAmount: true },
      _count: true,
    })

    const products = await Promise.all(
      result.map(async (r) => {
        const product = await prisma.product.findUnique({
          where: { id: r.productId },
        })
        return {
          productName: product?.name || 'Unknown',
          amount: Number(r._sum.totalAmount || 0),
          count: r._count,
        }
      })
    )

    return products
  }

  private async getSalesByRegion(startDate: Date, endDate: Date) {
    const orders = await prisma.order.findMany({
      where: {
        status: { not: OrderStatus.CANCELLED },
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        region: true,
        totalAmount: true,
      },
    })

    const byRegion = new Map<string, { amount: number; count: number }>()

    orders.forEach((order) => {
      const region = order.region || 'Unknown'

      if (!byRegion.has(region)) {
        byRegion.set(region, { amount: 0, count: 0 })
      }

      const current = byRegion.get(region)!
      current.amount += Number(order.totalAmount)
      current.count++
    })

    return Array.from(byRegion.entries()).map(([region, data]) => ({
      region,
      amount: data.amount,
      count: data.count,
    }))
  }

  private async getCustomerStats(startDate: Date, endDate: Date) {
    const [total, newThisMonth] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
    ])

    // Simple LTV calculation
    const revenuePerUser = total > 0 ? (await this.getTotalRevenue()) / total : 0

    return {
      total,
      newThisMonth,
      churnRate: 0, // To be calculated based on cancellations
      averageLifetimeValue: revenuePerUser,
    }
  }

  private async getVpsStats() {
    const [total, active, allVps] = await Promise.all([
      prisma.vpsInstance.count(),
      prisma.vpsInstance.count({ where: { status: VpsStatus.RUNNING } }),
      prisma.vpsInstance.findMany({
        where: { status: VpsStatus.RUNNING },
        include: { order: { select: { totalAmount: true, periodMonths: true } } },
      }),
    ])

    const monthlyCost =
      allVps.length > 0
        ? allVps.reduce((sum, vps) => {
            const monthlyPrice = vps.order ? Number(vps.order.totalAmount) / vps.order.periodMonths : 0
            return sum + monthlyPrice
          }, 0)
        : 0

    return {
      total,
      active,
      utilizationRate: total > 0 ? (active / total) * 100 : 0,
      averageMonthlyCost: active > 0 ? monthlyCost / active : 0,
    }
  }

  private async calculateGrowthRate(startDate: Date, endDate: Date): Promise<number> {
    // Calculate revenue growth compared to previous period
    const currentPeriodRevenue = await this.getRevenueInPeriod(startDate, endDate)
    const periodLength = endDate.getTime() - startDate.getTime()
    const prevStartDate = new Date(startDate.getTime() - periodLength)
    const prevPeriodRevenue = await this.getRevenueInPeriod(prevStartDate, startDate)

    if (prevPeriodRevenue === 0) return 0
    return ((currentPeriodRevenue - prevPeriodRevenue) / prevPeriodRevenue) * 100
  }

  /**
   * Get available (unassigned) Contabo instances
   * Returns instances from Contabo that are not assigned to any VPS in the database
   */
  async getAvailableContaboInstances() {
    // Get all instances from Contabo
    const contaboInstances = await contaboService.listInstances()

    // Get all assigned contaboInstanceIds from database
    const assignedVps = await prisma.vpsInstance.findMany({
      where: {
        contaboInstanceId: { not: null },
      },
      select: {
        contaboInstanceId: true,
      },
    })

    // Create a Set of assigned IDs for efficient lookup
    const assignedIds = new Set(
      assignedVps
        .map((v) => v.contaboInstanceId?.toString())
        .filter((id): id is string => id !== null)
    )

    // Filter out assigned instances
    const availableInstances = contaboInstances.filter(
      (instance) => !assignedIds.has(instance.instanceId)
    )

    return availableInstances
  }
}

export const adminService = new AdminService()
