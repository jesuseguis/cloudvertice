import { Router } from 'express'
import * as sshKeyController from '../controllers/sshKeyController'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import {
  createSshKeySchema,
  updateSshKeySchema,
} from '../utils/validators'

const router = Router()

/**
 * @route   GET /api/ssh-keys
 * @desc    Get user's SSH keys
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  sshKeyController.getUserSshKeys
)

/**
 * @route   GET /api/ssh-keys/:id
 * @desc    Get SSH key by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  sshKeyController.getSshKey
)

/**
 * @route   POST /api/ssh-keys
 * @desc    Create a new SSH key
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  validate(createSshKeySchema),
  sshKeyController.createSshKey
)

/**
 * @route   PUT /api/ssh-keys/:id
 * @desc    Update SSH key name
 * @access  Private
 */
router.put(
  '/:id',
  authenticate,
  validate(updateSshKeySchema),
  sshKeyController.updateSshKey
)

/**
 * @route   DELETE /api/ssh-keys/:id
 * @desc    Delete SSH key
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  sshKeyController.deleteSshKey
)

export { router as sshKeyRouter }
