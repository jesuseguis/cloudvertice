import { Router } from 'express'
import * as settingsController from '../controllers/settingsController'
import { authenticate, requireAdmin } from '../middleware/auth'

const router = Router()

/**
 * @route   GET /api/admin/settings
 * @desc    Get all settings
 * @access  Admin
 */
router.get(
  '/',
  authenticate,
  requireAdmin,
  settingsController.getSettings
)

/**
 * @route   PUT /api/admin/settings
 * @desc    Update settings
 * @access  Admin
 */
router.put(
  '/',
  authenticate,
  requireAdmin,
  settingsController.updateSettings
)

export { router as settingsRouter }
