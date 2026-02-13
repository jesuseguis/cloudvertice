import { Request, Response, NextFunction } from 'express'
import PDFDocument from 'pdfkit'
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
 * Delete invoice (admin only)
 */
export async function deleteInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    await invoiceService.deleteInvoice(id)

    res.json({
      success: true,
      message: 'Invoice deleted successfully',
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
 * Download invoice as PDF
 */
export async function downloadInvoicePdf(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    const invoice = await invoiceService.getInvoiceById(id, req.user.userId, req.user.role === 'ADMIN')

    const doc = new PDFDocument({ size: 'A4', margin: 50 })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=factura-${invoice.invoiceNumber}.pdf`)
    doc.pipe(res)

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('Cloud Vertice', { align: 'left' })
    doc.fontSize(10).font('Helvetica').text('cloud.vertice.com.co', { align: 'left' })
    doc.moveDown(0.5)

    // Invoice title
    doc.fontSize(18).font('Helvetica-Bold').text('FACTURA', { align: 'right' })
    doc.fontSize(10).font('Helvetica').text(`N° ${invoice.invoiceNumber}`, { align: 'right' })
    doc.moveDown(1.5)

    // Line
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc')
    doc.moveDown(1)

    // Details
    const detailsY = doc.y
    doc.fontSize(10).font('Helvetica-Bold').text('Fecha de emisión:', 50, detailsY)
    doc.font('Helvetica').text(new Date(invoice.createdAt).toLocaleDateString('es-ES'), 180, detailsY)

    if (invoice.dueDate) {
      doc.font('Helvetica-Bold').text('Fecha de vencimiento:', 50, detailsY + 18)
      doc.font('Helvetica').text(new Date(invoice.dueDate).toLocaleDateString('es-ES'), 180, detailsY + 18)
    }

    doc.font('Helvetica-Bold').text('Estado:', 50, detailsY + 36)
    doc.font('Helvetica').text(invoice.status === 'PAID' ? 'Pagada' : invoice.status === 'PENDING' ? 'Pendiente' : 'Cancelada', 180, detailsY + 36)

    if (invoice.user) {
      doc.font('Helvetica-Bold').text('Cliente:', 350, detailsY)
      doc.font('Helvetica').text(`${invoice.user.firstName || ''} ${invoice.user.lastName || ''}`.trim(), 350, detailsY + 18)
      doc.font('Helvetica').text(invoice.user.email || '', 350, detailsY + 36)
    }

    doc.moveDown(4)

    // Table header
    const tableTop = doc.y
    doc.rect(50, tableTop, 495, 25).fill('#3c83f6')
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold')
    doc.text('Descripción', 60, tableTop + 7, { width: 250 })
    doc.text('Cantidad', 320, tableTop + 7, { width: 60, align: 'center' })
    doc.text('Precio', 390, tableTop + 7, { width: 80, align: 'right' })
    doc.text('Total', 475, tableTop + 7, { width: 60, align: 'right' })

    // Table row
    const rowTop = tableTop + 30
    doc.fillColor('#333333').font('Helvetica')
    const productName = invoice.order?.product?.name || 'Servicio VPS'
    doc.text(productName, 60, rowTop, { width: 250 })
    doc.text('1', 320, rowTop, { width: 60, align: 'center' })
    doc.text(`$${invoice.amount.toFixed(2)}`, 390, rowTop, { width: 80, align: 'right' })
    doc.text(`$${invoice.amount.toFixed(2)}`, 475, rowTop, { width: 60, align: 'right' })

    // Line
    doc.moveTo(50, rowTop + 25).lineTo(545, rowTop + 25).stroke('#cccccc')

    // Totals
    const totalsTop = rowTop + 40
    doc.fontSize(10).font('Helvetica')
    doc.text('Subtotal:', 380, totalsTop, { width: 80, align: 'right' })
    doc.text(`$${invoice.amount.toFixed(2)}`, 475, totalsTop, { width: 60, align: 'right' })

    if (invoice.taxAmount) {
      doc.text('Impuesto:', 380, totalsTop + 18, { width: 80, align: 'right' })
      doc.text(`$${invoice.taxAmount.toFixed(2)}`, 475, totalsTop + 18, { width: 60, align: 'right' })
    }

    doc.moveTo(380, totalsTop + 38).lineTo(545, totalsTop + 38).stroke('#cccccc')
    doc.fontSize(12).font('Helvetica-Bold')
    doc.text('Total:', 380, totalsTop + 45, { width: 80, align: 'right' })
    doc.text(`$${invoice.total.toFixed(2)}`, 465, totalsTop + 45, { width: 70, align: 'right' })

    // Footer
    doc.fontSize(8).font('Helvetica').fillColor('#999999')
    doc.text(
      `© ${new Date().getFullYear()} Cloud Vertice. Todos los derechos reservados.`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    )

    doc.end()
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
