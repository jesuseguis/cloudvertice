import { PrismaClient, OrderStatus, UserRole } from '@prisma/client'
import { NotFoundError, BadRequestError, ForbiddenError } from '../middleware/errorHandler'
import { productService } from './productService'

const prisma = new PrismaClient()

export interface CreateOrderData {
  productId: string
  periodMonths: number
  regionId?: string
  osId?: string
  region?: string
  imageId?: string
  sshKeyIds?: string[]
  userData?: string
}

export interface UpdateOrderStatusData {
  status: OrderStatus
  adminNotes?: string
}

export interface OrderFilters {
  status?: OrderStatus
  startDate?: Date
  endDate?: Date
}

export interface OrderInfo {
  id: string
  orderNumber: string
  userId: string
  productId: string
  status: OrderStatus
  totalAmount: number
  basePrice: number
  regionPriceAdj: number
  osPriceAdj: number
  currency: string
  periodMonths: number
  region: string
  imageId: string | null
  sshKeys: unknown | null
  userData: string | null
  paymentMethod: string | null
  paymentStatus: string
  adminNotes: string | null
  paidAt: Date | null
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
  product?: any
  vpsInstance?: any
  user?: any
}

// Valid status transitions
const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['PROVISIONING', 'CANCELLED'],
  PROVISIONING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
}

export class OrderService {
  /**
   * Create a new order
   */
  async createOrder(userId: string, data: CreateOrderData): Promise<OrderInfo> {
    // Validate product exists and is active
    const product = await productService.getProductById(data.productId)
    if (!product.isActive) {
      throw BadRequestError('Product is not available for purchase')
    }

    // Check if product is custom type
    if (product.productType === 'CUSTOM') {
      throw BadRequestError('Custom products require contact before purchase. Please use the contact form.')
    }

    // Validate billing period
    const validPeriods = [1, 3, 6, 12]
    if (!validPeriods.includes(data.periodMonths)) {
      throw BadRequestError(`Invalid billing period. Must be one of: ${validPeriods.join(', ')}`)
    }

    // Validate and resolve imageId if provided
    // Note: If image is not found, we allow the order to be created without image (null)
    // The administrator will assign the correct image when provisioning the VPS
    let resolvedImageId: string | null = null
    if (data.imageId) {
      // First try to find by UUID (id)
      let image = await prisma.image.findUnique({
        where: { id: data.imageId },
      })

      // If not found, try to find by contaboImageId
      if (!image) {
        image = await prisma.image.findUnique({
          where: { contaboImageId: data.imageId },
        })
      }

      // If image found and is active, use it; otherwise leave as null
      if (image) {
        if (!image.isActive) {
          console.warn(`[OrderService] Image "${data.imageId}" is not active, creating order without image`)
        } else {
          resolvedImageId = image.id
        }
      } else {
        console.warn(`[OrderService] Image "${data.imageId}" not found in database, creating order without image. Admin will assign it during provisioning.`)
      }
    }

    // Validate SSH keys belong to user
    if (data.sshKeyIds && data.sshKeyIds.length > 0) {
      const sshKeys = await prisma.sshKey.findMany({
        where: {
          id: { in: data.sshKeyIds },
          userId,
        },
      })

      if (sshKeys.length !== data.sshKeyIds.length) {
        throw BadRequestError('One or more SSH keys do not belong to you')
      }
    }

    // Calculate price breakdown
    const priceBreakdown = await productService.calculatePrice(
      data.productId,
      data.periodMonths,
      data.regionId,
      data.osId
    )

    // Get region code if regionId provided
    let regionCode = data.region || 'EU'
    if (data.regionId) {
      const { regionService } = await import('./regionService')
      const region = await regionService.getRegionById(data.regionId).catch(() => null)
      if (region) {
        regionCode = region.code
      }
    }

    // Generate unique order number
    const orderNumber = await this.generateOrderNumber()

    // Create order
    const order = await prisma.order.create({
      data: {
        userId,
        productId: data.productId,
        orderNumber,
        status: 'PENDING',
        totalAmount: priceBreakdown.totalPrice,
        basePrice: priceBreakdown.basePrice,
        regionPriceAdj: priceBreakdown.regionPriceAdj,
        osPriceAdj: priceBreakdown.osPriceAdj,
        periodMonths: data.periodMonths,
        region: regionCode,
        imageId: resolvedImageId,
        sshKeys: data.sshKeyIds ?? undefined,
        userData: data.userData || null,
      },
      include: {
        product: true,
      },
    })

    return this.sanitizeOrder(order)
  }

  /**
   * Get user's orders with filters
   */
  async getUserOrders(userId: string, filters: OrderFilters = {}): Promise<OrderInfo[]> {
    const where: any = { userId }

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) where.createdAt.gte = filters.startDate
      if (filters.endDate) where.createdAt.lte = filters.endDate
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        product: true,
        vpsInstance: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return orders.map((o) => this.sanitizeOrder(o))
  }

  /**
   * Get all orders (admin only)
   */
  async getAllOrders(filters: OrderFilters = {}): Promise<OrderInfo[]> {
    const where: any = {}

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) where.createdAt.gte = filters.startDate
      if (filters.endDate) where.createdAt.lte = filters.endDate
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        product: true,
        vpsInstance: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return orders.map((o) => this.sanitizeOrder(o))
  }

  /**
   * Get order by ID
   */
  async getOrderById(id: string, userId?: string, userRole?: UserRole): Promise<OrderInfo> {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        product: true,
        vpsInstance: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!order) {
      throw NotFoundError('Order not found')
    }

    // Check access: admin can see all, users can only see their own
    if (userRole !== 'ADMIN' && order.userId !== userId) {
      throw ForbiddenError('You do not have permission to view this order')
    }

    return this.sanitizeOrder(order)
  }

  /**
   * Update order status (admin only)
   */
  async updateOrderStatus(id: string, data: UpdateOrderStatusData): Promise<OrderInfo> {
    const order = await prisma.order.findUnique({
      where: { id },
    })

    if (!order) {
      throw NotFoundError('Order not found')
    }

    // Validate status transition
    const validTransitions = STATUS_TRANSITIONS[order.status]
    if (!validTransitions.includes(data.status)) {
      throw BadRequestError(
        `Invalid status transition. Cannot go from ${order.status} to ${data.status}`
      )
    }

    // Check if we should generate an invoice (when transitioning to PAID or COMPLETED)
    const shouldGenerateInvoice =
      (data.status === 'PAID' || data.status === 'COMPLETED') &&
      order.status !== 'PAID' &&
      order.status !== 'COMPLETED'

    // Update order
    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: data.status,
        adminNotes: data.adminNotes,
        // Set paidAt when transitioning to PAID
        ...(data.status === 'PAID' && { paidAt: new Date() }),
        // Update paymentStatus when order is paid or completed
        ...(data.status === 'PAID' && { paymentStatus: 'PROCESSING' }),
        ...(data.status === 'COMPLETED' && {
          paymentStatus: 'COMPLETED',
          completedAt: new Date(),
        }),
      },
      include: {
        product: true,
        vpsInstance: true,
      },
    })

    // Auto-generate invoice when order is paid or completed
    if (shouldGenerateInvoice) {
      try {
        const { invoiceService } = await import('./invoiceService')

        // Check if invoice already exists
        const existingInvoice = await prisma.invoice.findFirst({
          where: { orderId: id },
        })

        if (!existingInvoice) {
          // Generate invoice number
          const invoiceNumber = await (invoiceService as any).generateInvoiceNumber()

          // Calculate tax (10%)
          const totalAmount = Number(updated.totalAmount)
          const taxAmount = totalAmount * 0.1
          const total = totalAmount + taxAmount

          // Due date (30 days from now)
          const dueDate = new Date()
          dueDate.setDate(dueDate.getDate() + 30)

          // Create invoice
          await prisma.invoice.create({
            data: {
              userId: updated.userId,
              orderId: updated.id,
              invoiceNumber,
              amount: totalAmount,
              taxAmount,
              total,
              status: data.status === 'PAID' ? 'PAID' : 'PENDING',
              dueDate,
              paidAt: data.status === 'PAID' ? new Date() : null,
            },
          })

          console.log(`[OrderService] Auto-generated invoice ${invoiceNumber} for order ${updated.orderNumber}`)
        }
      } catch (error) {
        console.error(`[OrderService] Failed to auto-generate invoice for order ${id}:`, error)
        // Don't fail the order update if invoice generation fails
      }
    }

    return this.sanitizeOrder(updated)
  }

  /**
   * Cancel order (customer)
   */
  async cancelOrder(id: string, userId: string): Promise<OrderInfo> {
    const order = await prisma.order.findUnique({
      where: { id },
    })

    if (!order) {
      throw NotFoundError('Order not found')
    }

    // Check ownership
    if (order.userId !== userId) {
      throw ForbiddenError('You can only cancel your own orders')
    }

    // Can only cancel pending orders
    if (order.status !== 'PENDING') {
      throw BadRequestError('Order can no longer be cancelled')
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        product: true,
        vpsInstance: true,
      },
    })

    return this.sanitizeOrder(updated)
  }

  /**
   * Get pending orders (admin only)
   */
  async getPendingOrders(): Promise<OrderInfo[]> {
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ['PENDING', 'PAID', 'PROCESSING', 'PROVISIONING'] },
      },
      include: {
        product: true,
        vpsInstance: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return orders.map((o) => this.sanitizeOrder(o))
  }

  /**
   * Assign VPS instance to order (admin only)
   */
  async assignVpsInstance(orderId: string, vpsInstanceId: string): Promise<OrderInfo> {
    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      throw NotFoundError('Order not found')
    }

    // Verify VPS instance exists
    const vps = await prisma.vpsInstance.findUnique({
      where: { id: vpsInstanceId },
    })

    if (!vps) {
      throw NotFoundError('VPS instance not found')
    }

    // Check if VPS is already assigned to another order
    if (vps.orderId && vps.orderId !== orderId) {
      throw BadRequestError('VPS instance is already assigned to another order')
    }

    // Update VPS with order reference
    await prisma.vpsInstance.update({
      where: { id: vpsInstanceId },
      data: { orderId },
    })

    // Update order status to COMPLETED
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        paymentStatus: 'COMPLETED',
      },
      include: {
        product: true,
        vpsInstance: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Auto-generate invoice when order is completed
    if (order.status !== 'COMPLETED' && order.status !== 'PAID') {
      try {
        // Check if invoice already exists
        const existingInvoice = await prisma.invoice.findFirst({
          where: { orderId },
        })

        if (!existingInvoice) {
          const { invoiceService } = await import('./invoiceService')

          // Generate invoice number
          const invoiceNumber = await (invoiceService as any).generateInvoiceNumber()

          // Calculate tax (10%)
          const totalAmount = Number(updated.totalAmount)
          const taxAmount = totalAmount * 0.1
          const total = totalAmount + taxAmount

          // Due date (30 days from now)
          const dueDate = new Date()
          dueDate.setDate(dueDate.getDate() + 30)

          // Create invoice (PAID since order is completed)
          await prisma.invoice.create({
            data: {
              userId: updated.userId,
              orderId: updated.id,
              invoiceNumber,
              amount: totalAmount,
              taxAmount,
              total,
              status: 'PAID',
              dueDate,
              paidAt: new Date(),
            },
          })

          console.log(`[OrderService] Auto-generated invoice ${invoiceNumber} for completed order ${updated.orderNumber}`)
        }
      } catch (error) {
        console.error(`[OrderService] Failed to auto-generate invoice for order ${orderId}:`, error)
        // Don't fail the order update if invoice generation fails
      }
    }

    // Send VPS provisioned email if VPS has a password
    if (vps.rootPasswordEncrypted && updated.user) {
      try {
        const { emailService } = await import('./emailService')
        const { decryptVpsPassword } = await import('../utils/encryption')

        const rootPassword = decryptVpsPassword(vps.rootPasswordEncrypted)

        await emailService.sendVpsProvisionedEmail({
          email: updated.user.email,
          firstName: updated.user.firstName || 'Customer',
          vpsName: vps.displayName || vps.name || 'VPS',
          ipAddress: vps.ipAddress || 'N/A',
          rootPassword,
          region: vps.region,
          dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/servers`,
        })
        console.log(`[OrderService] VPS provisioned email sent to: ${updated.user.email}`)
      } catch (error) {
        console.error(`[OrderService] Failed to send VPS provisioned email:`, error)
        // Don't fail the order update if email sending fails
      }
    }

    return this.sanitizeOrder(updated)
  }

  /**
   * Get order statistics for admin
   */
  async getOrderStatistics(): Promise<{
    total: number
    byStatus: Record<string, number>
    revenue: {
      total: number
      thisMonth: number
    }
  }> {
    const [total, byStatus, revenue] = await Promise.all([
      prisma.order.count(),
      prisma.order.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { not: 'CANCELLED' } },
      }),
    ])

    // Get this month's revenue
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const thisMonthRevenue = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: { not: 'CANCELLED' },
        createdAt: { gte: startOfMonth },
      },
    })

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count
        return acc
      }, {} as Record<string, number>),
      revenue: {
        total: Number(revenue._sum.totalAmount || 0),
        thisMonth: Number(thisMonthRevenue._sum.totalAmount || 0),
      },
    }
  }

  /**
   * Generate unique order number
   */
  private async generateOrderNumber(): Promise<string> {
    const prefix = 'ORD'
    const date = new Date()
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`

    // Find last order for this month
    const lastOrder = await prisma.order.findFirst({
      where: {
        orderNumber: { startsWith: `${prefix}-${dateStr}` },
      },
      orderBy: { orderNumber: 'desc' },
    })

    let sequence = 1
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2] || '0')
      sequence = lastSequence + 1
    }

    return `${prefix}-${dateStr}-${String(sequence).padStart(5, '0')}`
  }

  /**
   * Convert BigInt values to numbers in an object
   */
  private convertBigInts(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj
    }
    if (typeof obj === 'bigint') {
      return Number(obj)
    }
    if (obj instanceof Date) {
      return obj
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.convertBigInts(item))
    }
    if (typeof obj === 'object') {
      const result: any = {}
      for (const key in obj) {
        result[key] = this.convertBigInts(obj[key])
      }
      return result
    }
    return obj
  }

  /**
   * Remove sensitive data from order object
   */
  private sanitizeOrder(order: any): OrderInfo {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      productId: order.productId,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      basePrice: Number(order.basePrice || 0),
      regionPriceAdj: Number(order.regionPriceAdj || 0),
      osPriceAdj: Number(order.osPriceAdj || 0),
      currency: order.currency,
      periodMonths: order.periodMonths,
      region: order.region,
      imageId: order.imageId,
      sshKeys: order.sshKeys,
      userData: order.userData,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      adminNotes: order.adminNotes,
      paidAt: order.paidAt,
      completedAt: order.completedAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      ...(order.product && { product: this.convertBigInts(order.product) }),
      ...(order.vpsInstance && { vpsInstance: this.convertBigInts(order.vpsInstance) }),
      ...(order.user && { user: this.convertBigInts(order.user) }),
    }
  }
}

export const orderService = new OrderService()
