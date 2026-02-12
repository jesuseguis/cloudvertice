import { Request, Response, NextFunction } from 'express'
import { vpsService } from '../services/vpsService'
import { contaboService } from '../services/contaboService'
import { NotFoundError } from '../middleware/errorHandler'

/**
 * Get user's VPS instances
 */
export async function getUserVpsInstances(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    const instances = await vpsService.getUserVpsInstances(req.user.userId)

    res.json({
      success: true,
      data: {
        data: instances,
        total: instances.length,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get all VPS instances (admin only)
 */
export async function getAllVpsInstances(_req: Request, res: Response, next: NextFunction) {
  try {
    const instances = await vpsService.getAllVpsInstances()

    res.json({
      success: true,
      data: instances,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get VPS by ID
 */
export async function getVpsById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    const vps = await vpsService.getVpsById(id)

    res.json({
      success: true,
      data: vps,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Create VPS instance (admin only, after Contabo provisioning)
 */
export async function createVpsInstance(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body

    const vps = await vpsService.createVpsInstance(data)

    res.status(201).json({
      success: true,
      data: vps,
      message: 'VPS instance created successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update VPS instance (admin only)
 */
export async function updateVpsInstance(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const data = req.body

    const vps = await vpsService.updateVpsInstance(id, data)

    res.json({
      success: true,
      data: vps,
      message: 'VPS instance updated successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Terminate VPS instance (admin only)
 * Note: This only marks the VPS as terminated. Actual deletion from Contabo should be done from Contabo panel.
 */
export async function deleteVpsInstance(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    await vpsService.terminateVpsInstance(id)

    res.json({
      success: true,
      message: 'VPS instance marked as terminated. The instance will be deactivated by the administrator.',
    })
  } catch (error) {
    next(error)
  }
}

// ==================== VPS Actions ====================

/**
 * Start VPS
 */
export async function startVps(req: Request, res: Response, next: NextFunction) {
  try {
    const vpsId = req.vpsInstance?.id || req.params.id

    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    const result = await vpsService.startVps(vpsId, req.user.userId)

    res.json({
      success: true,
      data: result,
      message: 'VPS start command sent',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Stop VPS
 */
export async function stopVps(req: Request, res: Response, next: NextFunction) {
  try {
    const vpsId = req.vpsInstance?.id || req.params.id

    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    const result = await vpsService.stopVps(vpsId, req.user.userId)

    res.json({
      success: true,
      data: result,
      message: 'VPS stop command sent',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Restart VPS
 */
export async function restartVps(req: Request, res: Response, next: NextFunction) {
  try {
    const vpsId = req.vpsInstance?.id || req.params.id

    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    const result = await vpsService.restartVps(vpsId, req.user.userId)

    res.json({
      success: true,
      data: result,
      message: 'VPS restart command sent',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Shutdown VPS (ACPI)
 */
export async function shutdownVps(req: Request, res: Response, next: NextFunction) {
  try {
    const vpsId = req.vpsInstance?.id || req.params.id

    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    const result = await vpsService.shutdownVps(vpsId, req.user.userId)

    res.json({
      success: true,
      data: result,
      message: 'VPS shutdown command sent',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Boot into rescue mode
 */
export async function rescueVps(req: Request, res: Response, next: NextFunction) {
  try {
    const vpsId = req.vpsInstance?.id || req.params.id

    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    const result = await vpsService.rescueVps(vpsId, req.user.userId)

    res.json({
      success: true,
      data: result,
      message: 'VPS rescue mode initiated',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Reset root password
 */
export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const vpsId = req.vpsInstance?.id || req.params.id

    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    const result = await vpsService.resetPassword(vpsId, req.user.userId)

    res.json({
      success: true,
      data: result,
      message: 'Root password reset successfully. Save it now, you will not be able to see it again.',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get root password (show once)
 */
export async function getRootPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const vpsId = req.vpsInstance?.id || req.params.id

    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    const result = await vpsService.getRootPassword(vpsId, req.user.userId)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get VPS action history
 */
export async function getActionHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    const history = await vpsService.getActionHistory(id)

    res.json({
      success: true,
      data: history,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Suspend VPS instance (admin only)
 */
export async function suspendVps(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params
    const { reason = 'ADMIN_ACTION' } = req.body

    if (!['PAYMENT_ISSUE', 'ADMIN_ACTION', 'EXPIRED'].includes(reason)) {
      res.status(400).json({
        success: false,
        message: 'Invalid suspension reason. Must be PAYMENT_ISSUE, ADMIN_ACTION, or EXPIRED',
      })
      return
    }

    await vpsService.suspendVpsInstance(id, reason)

    res.json({
      success: true,
      message: `VPS instance suspended successfully. Reason: ${reason}`,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Restore VPS instance (admin only)
 */
export async function restoreVps(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { autoStart = false } = req.body

    const vps = await vpsService.restoreVpsInstance(id, autoStart)

    res.json({
      success: true,
      data: vps,
      message: 'VPS instance restored successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update VPS suspension details (admin only)
 */
export async function updateVpsSuspension(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { expiresAt, autoRenew, status } = req.body

    const vps = await vpsService.updateSuspensionDetails(id, {
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      autoRenew,
      status,
    })

    res.json({
      success: true,
      data: vps,
      message: 'VPS suspension details updated successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get VPS statistics (admin only)
 */
export async function getVpsStatistics(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await vpsService.getVpsStatistics()

    res.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Sync VPS status from Contabo (admin only)
 */
export async function syncVpsStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    const vps = await vpsService.getVpsById(id)

    // Get fresh status from Contabo
    const contaboInstance = await contaboService.getInstance(vps.contaboInstanceId?.toString() || '')

    // Map Contabo status to our status
    const statusMap: Record<string, any> = {
      running: 'RUNNING',
      stopped: 'STOPPED',
      creating: 'PROVISIONING',
      deleting: 'TERMINATED',
    }

    const newStatus = statusMap[contaboInstance.status.toLowerCase()] || vps.status

    // Update VPS
    const updated = await vpsService.updateVpsInstance(id, {
      status: newStatus,
    } as any)

    res.json({
      success: true,
      data: {
        oldStatus: vps.status,
        newStatus: updated.status,
        contaboStatus: contaboInstance.status,
      },
      message: 'VPS status synced from Contabo',
    })
  } catch (error) {
    next(error)
  }
}
