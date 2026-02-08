import { Router } from 'express'
import * as invoiceController from '../controllers/invoiceController'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import {
  createInvoiceSchema,
  updateInvoiceStatusSchema,
} from '../utils/validators'

const router = Router()

/**
 * @route   GET /api/invoices
 * @desc    Get user's invoices
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  invoiceController.getUserInvoices
)

/**
 * @route   GET /api/invoices/:id
 * @desc    Get invoice by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  invoiceController.getInvoice
)

/**
 * @route   GET /api/invoices/:id/pdf
 * @desc    Download invoice as PDF
 * @access  Private
 */
router.get(
  '/:id/pdf',
  authenticate,
  invoiceController.downloadInvoicePdf
)

/**
 * @route   POST /api/invoices/:id/pay
 * @desc    Pay invoice
 * @access  Private
 */
router.post(
  '/:id/pay',
  authenticate,
  invoiceController.payInvoice
)

/**
 * @route   GET /api/admin/invoices
 * @desc    Get all invoices
 * @access  Admin
 */
router.get(
  '/admin/all',
  authenticate,
  requireAdmin,
  invoiceController.getAllInvoices
)

/**
 * @route   GET /api/admin/invoices/statistics
 * @desc    Get invoice statistics
 * @access  Admin
 */
router.get(
  '/admin/statistics',
  authenticate,
  requireAdmin,
  invoiceController.getInvoiceStatistics
)

/**
 * @route   GET /api/admin/invoices/overdue
 * @desc    Get overdue invoices
 * @access  Admin
 */
router.get(
  '/admin/overdue',
  authenticate,
  requireAdmin,
  invoiceController.getOverdueInvoices
)

/**
 * @route   POST /api/admin/invoices
 * @desc    Create invoice from order
 * @access  Admin
 */
router.post(
  '/admin',
  authenticate,
  requireAdmin,
  validate(createInvoiceSchema),
  invoiceController.createInvoice
)

/**
 * @route   PUT /api/admin/invoices/:id/status
 * @desc    Update invoice status
 * @access  Admin
 */
router.put(
  '/admin/:id/status',
  authenticate,
  requireAdmin,
  validate(updateInvoiceStatusSchema),
  invoiceController.updateInvoiceStatus
)

/**
 * @route   POST /api/admin/invoices/generate
 * @desc    Generate invoices for all paid orders without invoice (development)
 * @access  Admin
 */
router.post(
  '/admin/generate',
  authenticate,
  requireAdmin,
  invoiceController.generateInvoicesForPaidOrders
)

/**
 * @route   POST /api/invoices/generate-dev
 * @desc    TEMPORARY: Generate invoices for paid orders (for development only)
 * @access  Private (no admin required for now)
 */
router.post(
  '/generate-dev',
  authenticate,
  invoiceController.generateInvoicesForPaidOrders
)

export { router as invoiceRouter }
