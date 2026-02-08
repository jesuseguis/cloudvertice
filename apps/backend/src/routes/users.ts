import { Router } from 'express'
import * as userController from '../controllers/userController'
import { authenticate, requireAdmin } from '../middleware/auth'

const router = Router()

/**
 * @route   GET /api/users/admin/all
 * @desc    Get all users (admin only)
 * @access  Admin
 */
router.get(
  '/admin/all',
  authenticate,
  requireAdmin,
  userController.getAllUsers
)

/**
 * @route   GET /api/users/admin/statistics
 * @desc    Get user statistics (admin only)
 * @access  Admin
 */
router.get(
  '/admin/statistics',
  authenticate,
  requireAdmin,
  userController.getUserStatistics
)

/**
 * @route   GET /api/users/admin/:id
 * @desc    Get user by ID (admin only)
 * @access  Admin
 */
router.get(
  '/admin/:id',
  authenticate,
  requireAdmin,
  userController.getUserById
)

/**
 * @route   PUT /api/users/admin/:id
 * @desc    Update user (admin only)
 * @access  Admin
 */
router.put(
  '/admin/:id',
  authenticate,
  requireAdmin,
  userController.updateUser
)

export { router as usersRouter }
