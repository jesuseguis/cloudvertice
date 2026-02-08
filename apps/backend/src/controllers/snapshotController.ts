import { Request, Response, NextFunction } from 'express'
import { snapshotService } from '../services/snapshotService'
import { NotFoundError } from '../middleware/errorHandler'

/**
 * Get snapshots for a VPS
 */
export async function getSnapshots(req: Request, res: Response, next: NextFunction) {
  try {
    const vpsId = req.vpsInstance?.id || req.params.vpsId
    const paramsId = req.params.id || req.params.vpsId

    const snapshots = await snapshotService.getSnapshots(vpsId || paramsId)

    res.json({
      success: true,
      data: snapshots,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get snapshot by ID
 */
export async function getSnapshot(req: Request, res: Response, next: NextFunction) {
  try {
    const { snapId } = req.params

    const snapshot = await snapshotService.getSnapshotById(snapId)

    res.json({
      success: true,
      data: snapshot,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Create a snapshot
 */
export async function createSnapshot(req: Request, res: Response, next: NextFunction) {
  try {
    const vpsId = req.vpsInstance?.id || req.params.vpsId
    const { name, description } = req.body

    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    const snapshot = await snapshotService.createSnapshot(vpsId, req.user.userId, {
      name,
      description,
    })

    res.status(201).json({
      success: true,
      data: snapshot,
      message: 'Snapshot creation initiated',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Restore a snapshot
 */
export async function restoreSnapshot(req: Request, res: Response, next: NextFunction) {
  try {
    const { snapId } = req.params

    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    await snapshotService.restoreSnapshot(snapId, req.user.userId)

    res.json({
      success: true,
      message: 'Snapshot restoration initiated',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Delete a snapshot
 */
export async function deleteSnapshot(req: Request, res: Response, next: NextFunction) {
  try {
    const { snapId } = req.params

    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    await snapshotService.deleteSnapshot(snapId, req.user.userId)

    res.json({
      success: true,
      message: 'Snapshot deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Sync snapshots from Contabo
 */
export async function syncSnapshots(req: Request, res: Response, next: NextFunction) {
  try {
    const vpsId = req.vpsInstance?.id || req.params.vpsId

    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    const result = await snapshotService.syncSnapshots(vpsId, req.user.userId)

    res.json({
      success: true,
      data: result,
      message: `Snapshots synced: ${result.created} created, ${result.updated} updated, ${result.deleted} deleted`,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get snapshot statistics
 */
export async function getSnapshotStatistics(req: Request, res: Response, next: NextFunction) {
  try {
    const vpsId = req.vpsInstance?.id || req.params.vpsId

    const stats = await snapshotService.getSnapshotStatistics(vpsId)

    res.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    next(error)
  }
}
