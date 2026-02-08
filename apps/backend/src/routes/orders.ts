import { Router } from 'express'
import * as orderController from '../controllers/orderController'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import {
  createOrderSchema,
  updateOrderStatusSchema,
  assignVpsSchema,
  orderFiltersSchema,
} from '../utils/validators'

const router = Router()

/**
 * @route   GET /api/orders
 * @desc    Get user's orders
 * @access  Private (Customer)
 */
router.get(
  '/',
  authenticate,
  validate(orderFiltersSchema, 'query'),
  orderController.getUserOrders
)

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Private (Customer)
 */
router.post(
  '/',
  authenticate,
  validate(createOrderSchema),
  orderController.createOrder
)

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  orderController.getOrder
)

/**
 * @route   PUT /api/orders/:id/cancel
 * @desc    Cancel order
 * @access  Private (Customer)
 */
router.put(
  '/:id/cancel',
  authenticate,
  orderController.cancelOrder
)

/**
 * @route   GET /api/admin/orders
 * @desc    Get all orders
 * @access  Admin
 */
router.get(
  '/admin/all',
  authenticate,
  requireAdmin,
  validate(orderFiltersSchema, 'query'),
  orderController.getAllOrders
)

/**
 * @route   GET /api/admin/orders/pending
 * @desc    Get pending orders
 * @access  Admin
 */
router.get(
  '/admin/pending',
  authenticate,
  requireAdmin,
  orderController.getPendingOrders
)

/**
 * @route   PUT /api/admin/orders/:id/status
 * @desc    Update order status
 * @access  Admin
 */
router.put(
  '/admin/:id/status',
  authenticate,
  requireAdmin,
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus
)

/**
 * @route   POST /api/admin/orders/:id/assign
 * @desc    Assign VPS instance to order
 * @access  Admin
 */
router.post(
  '/admin/:id/assign',
  authenticate,
  requireAdmin,
  validate(assignVpsSchema),
  orderController.assignVpsInstance
)

/**
 * @route   GET /api/admin/orders/statistics
 * @desc    Get order statistics
 * @access  Admin
 */
router.get(
  '/admin/statistics',
  authenticate,
  requireAdmin,
  orderController.getOrderStatistics
)

export { router as orderRouter }
