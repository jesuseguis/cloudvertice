import { Router } from 'express'
import * as adminController from '../controllers/adminController'
import * as productController from '../controllers/productController'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import {
  provisionOrderSchema,
  analyticsQuerySchema,
  createProductSchema,
  updateProductSchema,
} from '../utils/validators'

const router = Router()

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get dashboard metrics
 * @access  Admin
 */
router.get(
  '/dashboard',
  authenticate,
  requireAdmin,
  adminController.getDashboardMetrics
)

/**
 * @route   GET /api/admin/analytics
 * @desc    Get detailed analytics
 * @access  Admin
 */
router.get(
  '/analytics',
  authenticate,
  requireAdmin,
  validate(analyticsQuerySchema, 'query'),
  adminController.getAnalytics
)

/**
 * @route   GET /api/admin/orders/pending
 * @desc    Get pending orders for provisioning
 * @access  Admin
 */
router.get(
  '/orders/pending',
  authenticate,
  requireAdmin,
  adminController.getPendingOrders
)

/**
 * @route   POST /api/admin/orders/:orderId/provision
 * @desc    Provision an order (create VPS instance)
 * @access  Admin
 */
router.post(
  '/orders/:orderId/provision',
  authenticate,
  requireAdmin,
  validate(provisionOrderSchema),
  adminController.provisionOrder
)

/**
 * @route   GET /api/admin/alerts
 * @desc    Get admin alerts
 * @access  Admin
 */
router.get(
  '/alerts',
  authenticate,
  requireAdmin,
  adminController.getAlerts
)

/**
 * @route   GET /api/admin/activity
 * @desc    Get recent activity
 * @access  Admin
 */
router.get(
  '/activity',
  authenticate,
  requireAdmin,
  adminController.getRecentActivity
)

/**
 * @route   GET /api/admin/contabo/instances
 * @desc    List Contabo instances
 * @access  Admin
 */
router.get(
  '/contabo/instances',
  authenticate,
  requireAdmin,
  adminController.listContaboInstances
)

/**
 * @route   GET /api/admin/contabo/instances/available
 * @desc    List available (unassigned) Contabo instances
 * @access  Admin
 */
router.get(
  '/contabo/instances/available',
  authenticate,
  requireAdmin,
  adminController.listAvailableContaboInstances
)

/**
 * @route   POST /api/admin/products
 * @desc    Create a new product
 * @access  Admin
 */
router.post(
  '/products',
  authenticate,
  requireAdmin,
  validate(createProductSchema),
  productController.createProduct
)

/**
 * @route   PUT /api/admin/products/:id
 * @desc    Update a product
 * @access  Admin
 */
router.put(
  '/products/:id',
  authenticate,
  requireAdmin,
  validate(updateProductSchema),
  productController.updateProduct
)

/**
 * @route   DELETE /api/admin/products/:id
 * @desc    Delete a product
 * @access  Admin
 */
router.delete(
  '/products/:id',
  authenticate,
  requireAdmin,
  productController.deleteProduct
)

export { router as adminRouter }
