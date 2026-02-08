import { Router } from 'express'
import * as regionController from '../controllers/regionController'
import { authenticate, requireAdmin } from '../middleware/auth'

const router = Router()

/**
 * @route   GET /api/regions
 * @desc    Get all regions with optional filters
 * @access  Public
 */
router.get(
  '/',
  regionController.getRegions
)

/**
 * @route   GET /api/regions/code/:code
 * @desc    Get region by code
 * @access  Public
 * @note    Must come before /:id to avoid route conflicts
 */
router.get(
  '/code/:code',
  regionController.getRegionByCode
)

/**
 * @route   GET /api/regions/:id
 * @desc    Get region by ID
 * @access  Public
 */
router.get(
  '/:id',
  regionController.getRegion
)

/**
 * @route   POST /api/regions
 * @desc    Create a new region
 * @access  Admin
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  regionController.createRegion
)

/**
 * @route   PUT /api/regions/:id
 * @desc    Update a region
 * @access  Admin
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  regionController.updateRegion
)

/**
 * @route   DELETE /api/regions/:id
 * @desc    Delete a region
 * @access  Admin
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  regionController.deleteRegion
)

/**
 * @route   PATCH /api/regions/:id/toggle
 * @desc    Toggle region active status
 * @access  Admin
 */
router.patch(
  '/:id/toggle',
  authenticate,
  requireAdmin,
  regionController.toggleRegionActive
)

/**
 * @route   POST /api/regions/sync
 * @desc    Sync regions from Contabo
 * @access  Admin
 */
router.post(
  '/sync',
  authenticate,
  requireAdmin,
  regionController.syncRegions
)

export { router as regionRouter }
