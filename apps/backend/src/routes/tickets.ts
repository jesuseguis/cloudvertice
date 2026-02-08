import { Router } from 'express'
import * as ticketController from '../controllers/ticketController'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import {
  createTicketSchema,
  updateTicketSchema,
  createMessageSchema,
  ticketFiltersSchema,
} from '../utils/validators'

const router = Router()

/**
 * @route   GET /api/tickets
 * @desc    Get user's tickets
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  ticketController.getUserTickets
)

/**
 * @route   GET /api/tickets/categories
 * @desc    Get available ticket categories
 * @access  Public
 */
router.get(
  '/categories',
  ticketController.getCategories
)

/**
 * @route   POST /api/tickets
 * @desc    Create a new ticket
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  validate(createTicketSchema),
  ticketController.createTicket
)

/**
 * @route   GET /api/tickets/:id
 * @desc    Get ticket by ID with messages
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  ticketController.getTicket
)

/**
 * @route   POST /api/tickets/:id/messages
 * @desc    Add message to ticket
 * @access  Private
 */
router.post(
  '/:id/messages',
  authenticate,
  validate(createMessageSchema),
  ticketController.addMessage
)

/**
 * @route   PUT /api/tickets/:id/close
 * @desc    Close ticket
 * @access  Private
 */
router.put(
  '/:id/close',
  authenticate,
  ticketController.closeTicket
)

/**
 * @route   GET /api/admin/tickets
 * @desc    Get all tickets
 * @access  Admin
 */
router.get(
  '/admin/all',
  authenticate,
  requireAdmin,
  validate(ticketFiltersSchema, 'query'),
  ticketController.getAllTickets
)

/**
 * @route   PUT /api/admin/tickets/:id
 * @desc    Update ticket
 * @access  Admin
 */
router.put(
  '/admin/:id',
  authenticate,
  requireAdmin,
  validate(updateTicketSchema),
  ticketController.updateTicket
)

/**
 * @route   GET /api/admin/tickets/statistics
 * @desc    Get ticket statistics
 * @access  Admin
 */
router.get(
  '/admin/statistics',
  authenticate,
  requireAdmin,
  ticketController.getTicketStatistics
)

export { router as ticketRouter }
