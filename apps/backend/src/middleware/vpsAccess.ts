import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import { NotFoundError, ForbiddenError } from './errorHandler'

const prisma = new PrismaClient()

// Extend Express Request type to include vpsInstance
declare global {
  namespace Express {
    interface Request {
      vpsInstance?: any
    }
  }
}

/**
 * Middleware to verify VPS access and ownership
 * Validates that:
 * 1. VPS exists
 * 2. VPS belongs to the authenticated user (or user is admin)
 * 3. VPS service is active (not expired/cancelled/suspended)
 */
export function requireVpsAccess(req: Request, _res: Response, next: NextFunction) {
  (async () => {
    if (!req.user) {
      return next(NotFoundError('Authentication required'))
    }

    const vpsId = req.params.id || req.params.vpsId

    if (!vpsId) {
      return next(NotFoundError('VPS ID is required'))
    }

    // Get VPS instance
    const vps = await prisma.vpsInstance.findUnique({
      where: { id: vpsId },
      include: {
        order: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!vps) {
      return next(NotFoundError('VPS instance not found'))
    }

    // Check ownership (admin can access all VPS)
    if (req.user.role !== 'ADMIN' && vps.userId !== req.user.userId) {
      return next(ForbiddenError('You do not have permission to access this VPS'))
    }

    // Check service status - only allow actions on active services
    // Admin can always view suspended/expired instances for monitoring
    const isReadOnlyEndpoint = req.path.includes('/history') || req.path.includes('/password') || req.method === 'GET'
    const inactiveStatuses = ['EXPIRED', 'TERMINATED', 'SUSPENDED']
    if (inactiveStatuses.includes(vps.status) && !isReadOnlyEndpoint) {
      // Specific message for suspended instances
      if (vps.status === 'SUSPENDED') {
        const reason = vps.suspensionReason || 'ADMIN_ACTION'
        const reasonMessages: Record<string, string> = {
          PAYMENT_ISSUE: 'VPS is suspended due to payment issues. Please update your payment method to reactivate.',
          ADMIN_ACTION: 'VPS has been suspended by administrator. Please contact support.',
          EXPIRED: 'VPS service has expired. Please renew to continue.',
        }
        return next(ForbiddenError(reasonMessages[reason] || 'VPS is suspended. Please contact support.'))
      }
      return next(
        ForbiddenError(`VPS is ${vps.status.toLowerCase()}. Please contact support.`)
      )
    }

    // Check if VPS has expired
    if (vps.expiresAt && vps.expiresAt < new Date()) {
      // Auto-update status to expired
      await prisma.vpsInstance.update({
        where: { id: vps.id },
        data: { status: 'EXPIRED' },
      })
      return next(ForbiddenError('VPS service has expired. Please renew to continue.'))
    }

    // Attach VPS to request
    req.vpsInstance = vps

    next()
  })().catch(next)
}

/**
 * Middleware to verify VPS is in a valid state for actions
 * Only allows actions on VPS that are RUNNING, STOPPED, or PROVISIONING
 */
export function requireVpsReady(req: Request, _res: Response, next: NextFunction) {
  if (!req.vpsInstance) {
    return next(NotFoundError('VPS instance not found'))
  }

  const readyStatuses = ['RUNNING', 'STOPPED', 'PROVISIONING']
  if (!readyStatuses.includes(req.vpsInstance.status)) {
    return next(
      ForbiddenError(
        `VPS is currently ${req.vpsInstance.status.toLowerCase()}. Please wait for it to be ready.`
      )
    )
  }

  next()
}

/**
 * Middleware to verify VPS is in a valid state for management
 * Allows actions on VPS that are RUNNING, STOPPED, PROVISIONING, or SUSPENDED
 */
export function requireVpsManageable(req: Request, _res: Response, next: NextFunction) {
  if (!req.vpsInstance) {
    return next(NotFoundError('VPS instance not found'))
  }

  const manageableStatuses = ['RUNNING', 'STOPPED', 'PROVISIONING', 'SUSPENDED']
  if (!manageableStatuses.includes(req.vpsInstance.status)) {
    return next(
      ForbiddenError(
        `VPS is currently ${req.vpsInstance.status.toLowerCase()} and cannot be managed.`
      )
    )
  }

  next()
}
