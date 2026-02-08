import { Router } from 'express'
import * as vpsController from '../controllers/vpsController'
import * as snapshotController from '../controllers/snapshotController'
import { authenticate, requireAdmin } from '../middleware/auth'
import { requireVpsAccess, requireVpsReady } from '../middleware/vpsAccess'
import { validate } from '../middleware/validate'
import {
  createVpsSchema,
  updateVpsSchema,
  createSnapshotSchema,
} from '../utils/validators'

const router = Router()

/**
 * @route   GET /api/vps
 * @desc    Get user's VPS instances
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  vpsController.getUserVpsInstances
)

/**
 * @route   GET /api/vps/statistics
 * @desc    Get VPS statistics
 * @access  Admin
 */
router.get(
  '/statistics',
  authenticate,
  requireAdmin,
  vpsController.getVpsStatistics
)

/**
 * Admin VPS management routes (must come before :id routes)
 */

/**
 * @route   GET /api/vps/admin/all
 * @desc    Get all VPS instances (admin only)
 * @access  Admin
 */
router.get(
  '/admin/all',
  authenticate,
  requireAdmin,
  vpsController.getAllVpsInstances
)

/**
 * @route   POST /api/vps/admin
 * @desc    Create VPS instance
 * @access  Admin
 */
router.post(
  '/admin',
  authenticate,
  requireAdmin,
  validate(createVpsSchema),
  vpsController.createVpsInstance
)

/**
 * @route   PUT /api/vps/admin/:id
 * @desc    Update VPS instance
 * @access  Admin
 */
router.put(
  '/admin/:id',
  authenticate,
  requireAdmin,
  validate(updateVpsSchema),
  vpsController.updateVpsInstance
)

/**
 * @route   DELETE /api/vps/admin/:id
 * @desc    Mark VPS as terminated (actual deletion from Contabo panel)
 * @access  Admin
 */
router.delete(
  '/admin/:id',
  authenticate,
  requireAdmin,
  vpsController.deleteVpsInstance
)

/**
 * @route   POST /api/vps/admin/:id/suspend
 * @desc    Suspend VPS instance (sends shutdown to provider)
 * @access  Admin
 */
router.post(
  '/admin/:id/suspend',
  authenticate,
  requireAdmin,
  vpsController.suspendVps
)

/**
 * @route   POST /api/vps/admin/:id/restore
 * @desc    Restore/reactivate a suspended VPS instance
 * @access  Admin
 */
router.post(
  '/admin/:id/restore',
  authenticate,
  requireAdmin,
  vpsController.restoreVps
)

/**
 * @route   PUT /api/vps/admin/:id/suspension
 * @desc    Update suspension details (expiration, auto-renew, status)
 * @access  Admin
 */
router.put(
  '/admin/:id/suspension',
  authenticate,
  requireAdmin,
  vpsController.updateVpsSuspension
)

/**
 * VPS instance routes
 */

/**
 * @route   GET /api/vps/:id
 * @desc    Get VPS by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  requireVpsAccess,
  vpsController.getVpsById
)

/**
 * @route   GET /api/vps/:id/history
 * @desc    Get VPS action history
 * @access  Private
 */
router.get(
  '/:id/history',
  authenticate,
  requireVpsAccess,
  vpsController.getActionHistory
)

/**
 * @route   GET /api/vps/:id/password
 * @desc    Get root password (show once)
 * @access  Private
 */
router.get(
  '/:id/password',
  authenticate,
  requireVpsAccess,
  vpsController.getRootPassword
)

/**
 * @route   POST /api/vps/:id/start
 * @desc    Start VPS
 * @access  Private
 */
router.post(
  '/:id/start',
  authenticate,
  requireVpsAccess,
  requireVpsReady,
  vpsController.startVps
)

/**
 * @route   POST /api/vps/:id/stop
 * @desc    Stop VPS
 * @access  Private
 */
router.post(
  '/:id/stop',
  authenticate,
  requireVpsAccess,
  requireVpsReady,
  vpsController.stopVps
)

/**
 * @route   POST /api/vps/:id/restart
 * @desc    Restart VPS
 * @access  Private
 */
router.post(
  '/:id/restart',
  authenticate,
  requireVpsAccess,
  requireVpsReady,
  vpsController.restartVps
)

/**
 * @route   POST /api/vps/:id/shutdown
 * @desc    Shutdown VPS (ACPI)
 * @access  Private
 */
router.post(
  '/:id/shutdown',
  authenticate,
  requireVpsAccess,
  requireVpsReady,
  vpsController.shutdownVps
)

/**
 * @route   POST /api/vps/:id/rescue
 * @desc    Boot into rescue mode
 * @access  Private
 */
router.post(
  '/:id/rescue',
  authenticate,
  requireVpsAccess,
  requireVpsReady,
  vpsController.rescueVps
)

/**
 * @route   POST /api/vps/:id/reset-password
 * @desc    Reset root password
 * @access  Private
 */
router.post(
  '/:id/reset-password',
  authenticate,
  requireVpsAccess,
  requireVpsReady,
  vpsController.resetPassword
)

/**
 * @route   POST /api/vps/:id/sync
 * @desc    Sync VPS status from Contabo
 * @access  Admin
 */
router.post(
  '/:id/sync',
  authenticate,
  requireAdmin,
  vpsController.syncVpsStatus
)

/**
 * Snapshot routes for VPS
 */

/**
 * @route   GET /api/vps/:id/snapshots
 * @desc    Get snapshots for a VPS
 * @access  Private
 */
router.get(
  '/:id/snapshots',
  authenticate,
  requireVpsAccess,
  snapshotController.getSnapshots
)

/**
 * @route   GET /api/vps/:id/snapshots/statistics
 * @desc    Get snapshot statistics
 * @access  Private
 */
router.get(
  '/:id/snapshots/statistics',
  authenticate,
  requireVpsAccess,
  snapshotController.getSnapshotStatistics
)

/**
 * @route   POST /api/vps/:id/snapshots
 * @desc    Create a snapshot
 * @access  Private
 */
router.post(
  '/:id/snapshots',
  authenticate,
  requireVpsAccess,
  validate(createSnapshotSchema),
  snapshotController.createSnapshot
)

/**
 * @route   POST /api/vps/:id/snapshots/sync
 * @desc    Sync snapshots from Contabo
 * @access  Private
 */
router.post(
  '/:id/snapshots/sync',
  authenticate,
  requireVpsAccess,
  snapshotController.syncSnapshots
)

/**
 * @route   GET /api/vps/:id/snapshots/:snapId
 * @desc    Get snapshot by ID
 * @access  Private
 */
router.get(
  '/:id/snapshots/:snapId',
  authenticate,
  requireVpsAccess,
  snapshotController.getSnapshot
)

/**
 * @route   POST /api/vps/:id/snapshots/:snapId/restore
 * @desc    Restore a snapshot
 * @access  Private
 */
router.post(
  '/:id/snapshots/:snapId/restore',
  authenticate,
  requireVpsAccess,
  snapshotController.restoreSnapshot
)

/**
 * @route   DELETE /api/vps/:id/snapshots/:snapId
 * @desc    Delete a snapshot
 * @access  Private
 */
router.delete(
  '/:id/snapshots/:snapId',
  authenticate,
  requireVpsAccess,
  snapshotController.deleteSnapshot
)

export { router as vpsRouter }
