import { PrismaClient } from '@prisma/client'
import { NotFoundError, BadRequestError } from '../middleware/errorHandler'

const prisma = new PrismaClient()

export interface InvoiceInfo {
  id: string
  userId: string
  orderId: string | null
  invoiceNumber: string
  amount: number
  taxAmount: number | null
  total: number
  status: string
  dueDate: Date | null
  paidAt: Date | null
  createdAt: Date
  order?: any
  user?: any
}

export class InvoiceService {
  /**
   * Get user's invoices
   */
  async getUserInvoices(userId: string): Promise<InvoiceInfo[]> {
    console.log('[InvoiceService] getUserInvoices called for userId:', userId)

    const invoices = await prisma.invoice.findMany({
      where: { userId },
      include: {
        order: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    console.log('[InvoiceService] Found invoices:', invoices.length)

    return invoices.map((i) => this.sanitizeInvoice(i))
  }

  /**
   * Get all invoices (admin only)
   */
  async getAllInvoices(): Promise<InvoiceInfo[]> {
    const invoices = await prisma.invoice.findMany({
      include: {
        order: {
          include: {
            product: true,
          },
        },
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

    return invoices.map((i) => this.sanitizeInvoice(i))
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(id: string, userId?: string, isAdmin = false): Promise<InvoiceInfo> {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            product: true,
          },
        },
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

    if (!invoice) {
      throw NotFoundError('Invoice not found')
    }

    // Check access (admin can see all, users can only see their own)
    if (!isAdmin && invoice.userId !== userId) {
      throw BadRequestError('You do not have permission to view this invoice')
    }

    return this.sanitizeInvoice(invoice)
  }

  /**
   * Create an invoice from an order
   */
  async createInvoiceFromOrder(orderId: string): Promise<InvoiceInfo> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true },
    })

    if (!order) {
      throw NotFoundError('Order not found')
    }

    // Check if invoice already exists
    const existing = await prisma.invoice.findFirst({
      where: { orderId },
    })

    if (existing) {
      throw BadRequestError('Invoice already exists for this order')
    }

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber()

    // Calculate tax (10% for example)
    const totalAmount = Number(order.totalAmount)
    const taxAmount = totalAmount * 0.1
    const total = totalAmount + taxAmount

    // If order is already paid/completed, mark invoice as paid
    const isPaid = ['PAID', 'PROCESSING', 'PROVISIONING', 'COMPLETED'].includes(order.status)
    const now = new Date()

    // Due date (30 days from now, or now if already paid)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        userId: order.userId,
        orderId: order.id,
        invoiceNumber,
        amount: totalAmount,
        taxAmount,
        total,
        status: isPaid ? 'PAID' : 'PENDING',
        dueDate,
        paidAt: isPaid ? (order.paidAt || now) : null,
      },
      include: {
        order: {
          include: {
            product: true,
          },
        },
      },
    })

    return this.sanitizeInvoice(invoice)
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(
    id: string,
    status: string,
    paidAt?: Date
  ): Promise<InvoiceInfo> {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
    })

    if (!invoice) {
      throw NotFoundError('Invoice not found')
    }

    const updateData: any = { status }

    if (status === 'PAID') {
      updateData.paidAt = paidAt || new Date()
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        order: {
          include: {
            product: true,
          },
        },
      },
    })

    return this.sanitizeInvoice(updated)
  }

  /**
   * Delete an invoice (admin only)
   */
  async deleteInvoice(id: string): Promise<void> {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
    })

    if (!invoice) {
      throw NotFoundError('Invoice not found')
    }

    await prisma.invoice.delete({
      where: { id },
    })
  }

  /**
   * Pay an invoice
   */
  async payInvoice(id: string, userId: string): Promise<InvoiceInfo> {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { order: true },
    })

    if (!invoice) {
      throw NotFoundError('Invoice not found')
    }

    if (invoice.userId !== userId) {
      throw BadRequestError('You do not have permission to pay this invoice')
    }

    if (invoice.status !== 'PENDING') {
      throw BadRequestError('Invoice is not in pending status')
    }

    // Mark as paid
    return this.updateInvoiceStatus(id, 'PAID', new Date())
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(): Promise<InvoiceInfo[]> {
    const now = new Date()

    const invoices = await prisma.invoice.findMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: now },
      },
      include: {
        order: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    })

    return invoices.map((i) => this.sanitizeInvoice(i))
  }

  /**
   * Get invoice statistics
   */
  async getInvoiceStatistics(): Promise<{
    total: number
    pending: number
    paid: number
    overdue: number
    totalRevenue: number
    pendingRevenue: number
  }> {
    const [total, pending, paid, overdue, pendingInv, paidInv] = await Promise.all([
      prisma.invoice.count(),
      prisma.invoice.count({ where: { status: 'PENDING' } }),
      prisma.invoice.count({ where: { status: 'PAID' } }),
      prisma.invoice.count({
        where: {
          status: 'PENDING',
          dueDate: { lt: new Date() },
        },
      }),
      prisma.invoice.aggregate({
        where: { status: 'PENDING' },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: { status: 'PAID' },
        _sum: { total: true },
      }),
    ])

    return {
      total,
      pending,
      paid,
      overdue,
      totalRevenue: Number(paidInv._sum.total || 0),
      pendingRevenue: Number(pendingInv._sum.total || 0),
    }
  }

  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(): Promise<string> {
    const prefix = 'INV'
    const date = new Date()
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`

    // Find last invoice for this month
    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: { startsWith: `${prefix}-${dateStr}` },
      },
      orderBy: { invoiceNumber: 'desc' },
    })

    let sequence = 1
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2] || '0')
      sequence = lastSequence + 1
    }

    return `${prefix}-${dateStr}-${String(sequence).padStart(4, '0')}`
  }

  /**
   * Remove sensitive data from invoice object
   */
  private sanitizeInvoice(invoice: any): InvoiceInfo {
    return {
      id: invoice.id,
      userId: invoice.userId,
      orderId: invoice.orderId,
      invoiceNumber: invoice.invoiceNumber,
      amount: Number(invoice.amount),
      taxAmount: invoice.taxAmount ? Number(invoice.taxAmount) : null,
      total: Number(invoice.total),
      status: invoice.status,
      dueDate: invoice.dueDate,
      paidAt: invoice.paidAt,
      createdAt: invoice.createdAt,
      ...(invoice.order && { order: invoice.order }),
      ...(invoice.user && { user: invoice.user }),
    }
  }

  /**
   * Generate invoices for all paid orders without invoice (for development)
   */
  async generateInvoicesForPaidOrders(): Promise<{
    created: number
    skipped: number
    errors: string[]
  }> {
    console.log('[InvoiceService] generateInvoicesForPaidOrders called')

    // Get all completed/paid orders that don't have an invoice
    // Since Order has a 1:1 relation with Invoice, we look for orders without invoice
    const ordersWithoutInvoices = await prisma.order.findMany({
      where: {
        status: {
          in: ['COMPLETED', 'PAID'],
        },
        invoice: {
          is: null, // No invoice associated
        },
      },
      include: {
        product: true,
      },
    })

    console.log(`[InvoiceService] Found ${ordersWithoutInvoices.length} orders without invoices`)

    const errors: string[] = []
    let created = 0
    let skipped = 0

    for (const order of ordersWithoutInvoices) {
      try {
        // Check if invoice already exists for this order (double check)
        const existing = await prisma.invoice.findFirst({
          where: { orderId: order.id },
        })

        if (existing) {
          console.log(`[InvoiceService] Invoice already exists for order ${order.id}`)
          skipped++
          continue
        }

        // Generate invoice number
        const invoiceNumber = await this.generateInvoiceNumber()

        // Calculate tax (10% for example)
        const totalAmount = Number(order.totalAmount)
        const taxAmount = totalAmount * 0.1
        const total = totalAmount + taxAmount

        // Due date (30 days from order creation)
        const dueDate = new Date(order.createdAt)
        dueDate.setDate(dueDate.getDate() + 30)

        // Create invoice
        const invoice = await prisma.invoice.create({
          data: {
            userId: order.userId,
            orderId: order.id,
            invoiceNumber,
            amount: totalAmount,
            taxAmount,
            total,
            status: 'PAID', // Mark as paid since order is already completed
            dueDate,
            paidAt: order.createdAt || new Date(), // Set paid date to order completion date
          },
        })

        console.log(`[InvoiceService] Created invoice ${invoice.invoiceNumber} for order ${order.id}`)
        created++
      } catch (error) {
        const errorMsg = `Failed to create invoice for order ${order.id}: ${error}`
        console.error(`[InvoiceService] ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    return { created, skipped, errors }
  }
}

export const invoiceService = new InvoiceService()
