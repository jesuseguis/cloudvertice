import { Request, Response, NextFunction } from 'express'
import { regionService } from '../services/regionService'

/**
 * Get all regions with optional filters
 */
export async function getRegions(req: Request, res: Response, next: NextFunction) {
  try {
    const { isActive } = req.query

    const filters = {
      isActive: isActive ? isActive === 'true' : undefined,
    }

    const regions = await regionService.getRegions(filters)

    res.json({
      success: true,
      data: regions,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get region by ID
 */
export async function getRegion(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    const region = await regionService.getRegionById(id)

    res.json({
      success: true,
      data: region,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get region by code
 */
export async function getRegionByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code } = req.params

    const region = await regionService.getRegionByCode(code)

    if (!region) {
      res.status(404).json({
        success: false,
        message: 'Region not found',
      })
      return
    }

    res.json({
      success: true,
      data: region,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Create a new region (admin only)
 */
export async function createRegion(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body

    const region = await regionService.createRegion(data)

    res.status(201).json({
      success: true,
      data: region,
      message: 'Region created successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update a region (admin only)
 */
export async function updateRegion(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const data = req.body

    const region = await regionService.updateRegion(id, data)

    res.json({
      success: true,
      data: region,
      message: 'Region updated successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Delete a region (admin only)
 */
export async function deleteRegion(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    await regionService.deleteRegion(id)

    res.json({
      success: true,
      message: 'Region deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Toggle region active status (admin only)
 */
export async function toggleRegionActive(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    const region = await regionService.toggleRegionActive(id)

    res.json({
      success: true,
      data: region,
      message: `Region ${region.isActive ? 'activated' : 'deactivated'} successfully`,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Sync regions from Contabo (admin only)
 */
export async function syncRegions(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await regionService.syncRegionsFromContabo()

    res.json({
      success: true,
      data: result,
      message: `Sync completed: ${result.created} created, ${result.updated} updated, ${result.failed} failed`,
    })
  } catch (error) {
    next(error)
  }
}
