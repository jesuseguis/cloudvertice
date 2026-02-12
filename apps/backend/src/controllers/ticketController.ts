import { Request, Response, NextFunction } from 'express'
import { ticketService } from '../services/ticketService'
import { NotFoundError } from '../middleware/errorHandler'

/**
 * Get user's tickets
 */
export async function getUserTickets(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    const tickets = await ticketService.getUserTickets(req.user.userId)

    // Return paginated response format expected by frontend
    res.json({
      success: true,
      data: {
        data: tickets,
        total: tickets.length,
        page: 1,
        limit: tickets.length,
        totalPages: 1,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get all tickets (admin only)
 */
export async function getAllTickets(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, priority, page = 1, limit = 10 } = req.query

    const filters = {
      status: status as any,
      priority: priority as any,
    }

    const { data, total } = await ticketService.getAllTickets(filters)

    // Return paginated response format expected by frontend
    const pageNum = Number(page)
    const limitNum = Number(limit)
    const totalPages = Math.ceil(total / limitNum)

    res.json({
      success: true,
      data: {
        data,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get ticket by ID with messages
 */
export async function getTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    const ticket = await ticketService.getTicketById(id, req.user.userId, req.user.role as any)

    res.json({
      success: true,
      data: ticket,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Create a new ticket
 */
export async function createTicket(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    const { subject, message, priority, vpsInstanceId } = req.body

    const ticket = await ticketService.createTicket(req.user.userId, {
      subject,
      message,
      priority,
      vpsInstanceId,
    })

    res.status(201).json({
      success: true,
      data: ticket,
      message: 'Support ticket created successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update ticket (admin only)
 */
export async function updateTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { status, priority } = req.body

    const ticket = await ticketService.updateTicket(id, {
      status,
      priority,
    })

    res.json({
      success: true,
      data: ticket,
      message: 'Ticket updated successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Add message to ticket
 */
export async function addMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { message } = req.body

    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    // Determine isAdmin based on user role, not from request body
    const isAdmin = req.user.role === 'ADMIN'

    const msg = await ticketService.addMessage(
      id,
      req.user.userId,
      req.user.role as any,
      {
        message,
        isAdmin,
      }
    )

    res.status(201).json({
      success: true,
      data: msg,
      message: 'Message added successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Close ticket
 */
export async function closeTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    const ticket = await ticketService.closeTicket(id, req.user.userId, req.user.role as any)

    res.json({
      success: true,
      data: ticket,
      message: 'Ticket closed successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get ticket statistics (admin only)
 */
export async function getTicketStatistics(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await ticketService.getTicketStatistics()

    res.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get available categories
 */
export async function getCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await ticketService.getCategories()

    res.json({
      success: true,
      data: categories,
    })
  } catch (error) {
    next(error)
  }
}
