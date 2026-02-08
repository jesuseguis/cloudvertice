import { Request, Response, NextFunction } from 'express'
import { sshKeyService } from '../services/sshKeyService'
import { NotFoundError } from '../middleware/errorHandler'

/**
 * Get user's SSH keys
 */
export async function getUserSshKeys(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    const keys = await sshKeyService.getUserSshKeys(req.user.userId)

    res.json({
      success: true,
      data: keys,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get SSH key by ID
 */
export async function getSshKey(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    const key = await sshKeyService.getSshKeyById(
      id,
      req.user.userId,
      req.user.role === 'ADMIN'
    )

    res.json({
      success: true,
      data: key,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Create a new SSH key
 */
export async function createSshKey(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    const { name, publicKey } = req.body

    const key = await sshKeyService.createSshKey(req.user.userId, { name, publicKey })

    res.status(201).json({
      success: true,
      data: key,
      message: 'SSH key added successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Delete SSH key
 */
export async function deleteSshKey(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    await sshKeyService.deleteSshKey(id, req.user.userId, req.user.role === 'ADMIN')

    res.json({
      success: true,
      message: 'SSH key deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update SSH key name
 */
export async function updateSshKey(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { name } = req.body

    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    const key = await sshKeyService.updateSshKey(id, req.user.userId, name)

    res.json({
      success: true,
      data: key,
      message: 'SSH key updated successfully',
    })
  } catch (error) {
    next(error)
  }
}
