import { PrismaClient, TicketStatus, TicketPriority, UserRole } from '@prisma/client'
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler'

const prisma = new PrismaClient()

export interface CreateTicketData {
  subject: string
  message: string
  priority?: TicketPriority
  vpsInstanceId?: string
}

export interface UpdateTicketData {
  status?: TicketStatus
  priority?: TicketPriority
}

export interface CreateMessageData {
  message: string
  isAdmin?: boolean
}

export interface TicketInfo {
  id: string
  userId: string
  subject: string
  status: string // Converted to lowercase for frontend
  priority: string // Converted to lowercase for frontend
  vpsInstanceId: string | null
  category?: string // 'technical' | 'billing' | 'general'
  createdAt: Date
  updatedAt: Date
  closedAt: Date | null
  user?: any
  messages?: TicketMessageInfo[]
  _count?: {
    messages: number
  }
}

export interface TicketMessageInfo {
  id: string
  ticketId: string
  userId: string
  content: string
  isAdmin: boolean
  createdAt: Date
  user?: any
}

export class TicketService {
  /**
   * Get user's tickets
   */
  async getUserTickets(userId: string): Promise<TicketInfo[]> {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        messages: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return tickets.map((t) => this.sanitizeTicket(t))
  }

  /**
   * Get all tickets (admin only)
   */
  async getAllTickets(
    filters: {
      status?: TicketStatus
      priority?: TicketPriority
    } = {}
  ): Promise<{
    data: TicketInfo[]
    total: number
  }> {
    const where: any = {}

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.priority) {
      where.priority = filters.priority
    }

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          messages: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.supportTicket.count({ where }),
    ])

    return {
      data: tickets.map((t) => this.sanitizeTicket(t)),
      total,
    }
  }

  /**
   * Get ticket by ID with messages
   */
  async getTicketById(
    id: string,
    userId: string,
    userRole: UserRole
  ): Promise<TicketInfo & { messages: TicketMessageInfo[] }> {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        messages: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { messages: true },
        },
      },
    })

    if (!ticket) {
      throw NotFoundError('Ticket not found')
    }

    // Check access: admin can see all, users can only see their own
    if (userRole !== 'ADMIN' && ticket.userId !== userId) {
      throw ForbiddenError('You do not have permission to view this ticket')
    }

    const sanitized = this.sanitizeTicket(ticket)
    const messages = ticket.messages.map((m) => this.sanitizeMessage(m))

    return { ...sanitized, messages }
  }

  /**
   * Create a new ticket
   */
  async createTicket(userId: string, data: CreateTicketData): Promise<TicketInfo> {
    // If VPS instance is specified, verify ownership
    if (data.vpsInstanceId) {
      const vps = await prisma.vpsInstance.findUnique({
        where: { id: data.vpsInstanceId },
      })

      if (!vps) {
        throw NotFoundError('VPS instance not found')
      }

      if (vps.userId !== userId) {
        throw ForbiddenError('You do not own this VPS instance')
      }
    }

    // Create ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subject: data.subject,
        priority: data.priority || TicketPriority.NORMAL,
        vpsInstanceId: data.vpsInstanceId,
        status: TicketStatus.OPEN,
      },
      include: {
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

    // Create initial message from ticket description
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        userId,
        message: data.message,
        isAdmin: false,
      },
    })

    // Fetch ticket with messages to return complete data
    const ticketWithMessages = await prisma.supportTicket.findUnique({
      where: { id: ticket.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        messages: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    return this.sanitizeTicket(ticketWithMessages)
  }

  /**
   * Update ticket (admin only)
   */
  async updateTicket(id: string, data: UpdateTicketData): Promise<TicketInfo> {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
    })

    if (!ticket) {
      throw NotFoundError('Ticket not found')
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        messages: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    return this.sanitizeTicket(updated)
  }

  /**
   * Add message to ticket
   */
  async addMessage(
    ticketId: string,
    userId: string,
    userRole: UserRole,
    data: CreateMessageData
  ): Promise<TicketMessageInfo> {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    })

    if (!ticket) {
      throw NotFoundError('Ticket not found')
    }

    // Only admins can add admin messages
    if (data.isAdmin && userRole !== 'ADMIN') {
      throw ForbiddenError('Only admins can add admin messages')
    }

    // Regular users can only add messages to their own tickets
    if (userRole !== 'ADMIN' && ticket.userId !== userId) {
      throw ForbiddenError('You do not have permission to add messages to this ticket')
    }

    // If ticket is closed, reopen it when user adds a message
    if (ticket.status === TicketStatus.CLOSED && !data.isAdmin) {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.OPEN },
      })
    }

    const message = await prisma.ticketMessage.create({
      data: {
        ticketId,
        userId,
        message: data.message,
        isAdmin: data.isAdmin || false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    })

    return this.sanitizeMessage(message)
  }

  /**
   * Close ticket
   */
  async closeTicket(id: string, userId: string, userRole: UserRole): Promise<TicketInfo> {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
    })

    if (!ticket) {
      throw NotFoundError('Ticket not found')
    }

    // Users can only close their own tickets
    if (userRole !== 'ADMIN' && ticket.userId !== userId) {
      throw ForbiddenError('You do not have permission to close this ticket')
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: {
        status: TicketStatus.CLOSED,
        closedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        messages: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    return this.sanitizeTicket(updated)
  }

  /**
   * Get ticket statistics
   */
  async getTicketStatistics(): Promise<{
    total: number
    byStatus: Record<string, number>
    byPriority: Record<string, number>
    open: number
    averageResponseTime: number
  }> {
    const [total, byStatus, byPriority, open] = await Promise.all([
      prisma.supportTicket.count(),
      prisma.supportTicket.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.supportTicket.groupBy({
        by: ['priority'],
        _count: true,
      }),
      prisma.supportTicket.count({
        where: {
          status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.WAITING_CUSTOMER] },
        },
      }),
    ])

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count
        return acc
      }, {} as Record<string, number>),
      byPriority: byPriority.reduce((acc, item) => {
        acc[item.priority] = item._count
        return acc
      }, {} as Record<string, number>),
      open,
      averageResponseTime: 0, // To be calculated based on first response time
    }
  }

  /**
   * Get available categories
   */
  async getCategories(): Promise<string[]> {
    // Return predefined categories
    return [
      'Billing',
      'Technical',
      'Sales',
      'Account',
      'VPS Management',
      'Network',
      'Other',
    ]
  }

  /**
   * Convert Prisma status to frontend format (lowercase)
   */
  private mapStatus(status: TicketStatus): string {
    const statusMap: Record<TicketStatus, string> = {
      OPEN: 'open',
      IN_PROGRESS: 'pending',
      WAITING_CUSTOMER: 'pending',
      RESOLVED: 'resolved',
      CLOSED: 'closed',
    }
    return statusMap[status] || 'open'
  }

  /**
   * Convert Prisma priority to frontend format (lowercase)
   */
  private mapPriority(priority: TicketPriority): string {
    // NORMAL -> medium, LOW -> low, HIGH -> high, URGENT -> urgent
    const priorityMap: Record<TicketPriority, string> = {
      LOW: 'low',
      NORMAL: 'medium',
      HIGH: 'high',
      URGENT: 'urgent',
    }
    return priorityMap[priority] || 'medium'
  }

  /**
   * Derive category from ticket subject or VPS association
   */
  private deriveCategory(ticket: any): string {
    const subject = (ticket.subject || '').toLowerCase()
    if (subject.includes('factura') || subject.includes('pago') || subject.includes('billing') || subject.includes('payment')) {
      return 'billing'
    }
    if (ticket.vpsInstanceId || subject.includes('vps') || subject.includes('servidor') || subject.includes('server')) {
      return 'technical'
    }
    return 'general'
  }

  /**
   * Remove sensitive data from ticket object
   */
  private sanitizeTicket(ticket: any): TicketInfo {
    return {
      id: ticket.id,
      userId: ticket.userId,
      subject: ticket.subject,
      status: this.mapStatus(ticket.status) as any,
      priority: this.mapPriority(ticket.priority) as any,
      vpsInstanceId: ticket.vpsInstanceId,
      category: this.deriveCategory(ticket),
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      closedAt: ticket.closedAt,
      ...(ticket.user && { user: ticket.user }),
      ...(ticket.messages && { messages: ticket.messages.map((m: any) => this.sanitizeMessage(m)) }),
      ...(ticket._count && { _count: ticket._count }),
    }
  }

  /**
   * Remove sensitive data from message object
   */
  private sanitizeMessage(message: any): TicketMessageInfo {
    return {
      id: message.id,
      ticketId: message.ticketId,
      userId: message.userId,
      content: message.message,
      isAdmin: message.isAdmin,
      createdAt: message.createdAt,
      ...(message.user && { user: message.user }),
    }
  }
}

export const ticketService = new TicketService()
