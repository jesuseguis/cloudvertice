import { Router } from 'express'
import * as operatingSystemController from '../controllers/operatingSystemController'
import { authenticate, requireAdmin } from '../middleware/auth'

const router = Router()

/**
 * @route   GET /api/operating-systems
 * @desc    Get all operating systems with optional filters
 * @access  Public
 */
router.get(
  '/',
  operatingSystemController.getOperatingSystems
)

/**
 * @route   GET /api/operating-systems/image/:imageId
 * @desc    Get operating system by image ID
 * @access  Public
 * @note    Must come before /:id to avoid route conflicts
 */
router.get(
  '/image/:imageId',
  operatingSystemController.getOperatingSystemByImageId
)

/**
 * @route   GET /api/operating-systems/:id
 * @desc    Get operating system by ID
 * @access  Public
 */
router.get(
  '/:id',
  operatingSystemController.getOperatingSystem
)

/**
 * @route   POST /api/operating-systems
 * @desc    Create a new operating system
 * @access  Admin
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  operatingSystemController.createOperatingSystem
)

/**
 * @route   PUT /api/operating-systems/:id
 * @desc    Update an operating system
 * @access  Admin
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  operatingSystemController.updateOperatingSystem
)

/**
 * @route   DELETE /api/operating-systems/:id
 * @desc    Delete an operating system
 * @access  Admin
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  operatingSystemController.deleteOperatingSystem
)

/**
 * @route   PATCH /api/operating-systems/:id/price
 * @desc    Update price adjustment for an operating system
 * @access  Admin
 */
router.patch(
  '/:id/price',
  authenticate,
  requireAdmin,
  operatingSystemController.updateOperatingSystemPrice
)

/**
 * @route   PATCH /api/operating-systems/:id/toggle
 * @desc    Toggle operating system active status
 * @access  Admin
 */
router.patch(
  '/:id/toggle',
  authenticate,
  requireAdmin,
  operatingSystemController.toggleOperatingSystemActive
)

/**
 * @route   POST /api/operating-systems/sync
 * @desc    Sync operating systems from Contabo API
 * @access  Admin
 */
router.post(
  '/sync',
  authenticate,
  requireAdmin,
  operatingSystemController.syncOperatingSystems
)

export { router as operatingSystemRouter }
