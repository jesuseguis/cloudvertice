import { Router } from 'express'
import * as imageController from '../controllers/imageController'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import {
  createImageSchema,
  updateImageSchema,
  imageFiltersSchema,
} from '../utils/validators'

const router = Router()

/**
 * @route   GET /api/images
 * @desc    Get all images with optional filters
 * @access  Public
 */
router.get(
  '/',
  validate(imageFiltersSchema, 'query'),
  imageController.getImages
)

/**
 * @route   GET /api/images/os-types
 * @desc    Get available OS types
 * @access  Public
 */
router.get(
  '/os-types',
  imageController.getOsTypes
)

/**
 * @route   GET /api/images/:id
 * @desc    Get image by ID
 * @access  Public
 */
router.get(
  '/:id',
  imageController.getImage
)

/**
 * @route   POST /api/admin/images/sync
 * @desc    Sync images from Contabo
 * @access  Admin
 */
router.post(
  '/sync',
  authenticate,
  requireAdmin,
  imageController.syncImages
)

/**
 * @route   POST /api/admin/images
 * @desc    Create a new image
 * @access  Admin
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate(createImageSchema),
  imageController.createImage
)

/**
 * @route   PUT /api/admin/images/:id
 * @desc    Update an image
 * @access  Admin
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validate(updateImageSchema),
  imageController.updateImage
)

/**
 * @route   DELETE /api/admin/images/:id
 * @desc    Delete an image
 * @access  Admin
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  imageController.deleteImage
)

export { router as imageRouter }
