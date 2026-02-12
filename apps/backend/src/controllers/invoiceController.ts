import { Request, Response, NextFunction } from 'express'
import { invoiceService } from '../services/invoiceService'
import { NotFoundError } from '../middleware/errorHandler'

/**
 * Get user's invoices
 */
export async function getUserInvoices(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    const invoices = await invoiceService.getUserInvoices(req.user.userId)

    // Return paginated response format
    res.json({
      success: true,
      data: {
        data: invoices,
        total: invoices.length,
        page: 1,
        limit: invoices.length,
        totalPages: 1,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get all invoices (admin only)
 */
export async function getAllInvoices(_req: Request, res: Response, next: NextFunction) {
  try {
    const invoices = await invoiceService.getAllInvoices()

    res.json({
      success: true,
      data: invoices,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get invoice by ID
 */
export async function getInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    const invoice = await invoiceService.getInvoiceById(
      id,
      req.user.userId,
      req.user.role === 'ADMIN'
    )

    res.json({
      success: true,
      data: invoice,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Create invoice from order (admin only)
 */
export async function createInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const { orderId } = req.body

    const invoice = await invoiceService.createInvoiceFromOrder(orderId)

    res.status(201).json({
      success: true,
      data: invoice,
      message: 'Invoice created successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update invoice status (admin only)
 */
export async function updateInvoiceStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { status } = req.body

    const invoice = await invoiceService.updateInvoiceStatus(id, status)

    res.json({
      success: true,
      data: invoice,
      message: 'Invoice status updated successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Pay invoice
 */
export async function payInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    const invoice = await invoiceService.payInvoice(id, req.user.userId)

    res.json({
      success: true,
      data: invoice,
      message: 'Invoice paid successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get overdue invoices (admin only)
 */
export async function getOverdueInvoices(_req: Request, res: Response, next: NextFunction) {
  try {
    const invoices = await invoiceService.getOverdueInvoices()

    res.json({
      success: true,
      data: invoices,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get invoice statistics (admin only)
 */
export async function getInvoiceStatistics(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await invoiceService.getInvoiceStatistics()

    res.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Download invoice as PDF (placeholder)
 */
export async function downloadInvoicePdf(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    // Verify access
    await invoiceService.getInvoiceById(id, req.user.userId, req.user.role === 'ADMIN')

    // TODO: Generate PDF using a library like PDFKit
    // For now, return a placeholder response
    res.json({
      success: false,
      message: 'PDF generation not yet implemented',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Generate invoices for all paid orders without invoice (admin only, for development)
 */
export async function generateInvoicesForPaidOrders(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await invoiceService.generateInvoicesForPaidOrders()

    res.json({
      success: true,
      data: result,
      message: `Generated ${result.created} invoices`,
    })
  } catch (error) {
    next(error)
  }
}
