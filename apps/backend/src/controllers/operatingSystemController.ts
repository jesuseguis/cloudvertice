import { Request, Response, NextFunction } from 'express'
import { operatingSystemService } from '../services/operatingSystemService'

/**
 * Get all operating systems with optional filters
 */
export async function getOperatingSystems(req: Request, res: Response, next: NextFunction) {
  try {
    const { isActive } = req.query

    const filters = {
      isActive: isActive ? isActive === 'true' : undefined,
    }

    const operatingSystems = await operatingSystemService.getOperatingSystems(filters)

    res.json({
      success: true,
      data: operatingSystems,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get operating system by ID
 */
export async function getOperatingSystem(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    const operatingSystem = await operatingSystemService.getOperatingSystemById(id)

    res.json({
      success: true,
      data: operatingSystem,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get operating system by image ID
 */
export async function getOperatingSystemByImageId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { imageId } = req.params

    const operatingSystem = await operatingSystemService.getOperatingSystemByImageId(imageId)

    if (!operatingSystem) {
      res.status(404).json({
        success: false,
        message: 'Operating system not found',
      })
      return
    }

    res.json({
      success: true,
      data: operatingSystem,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Create a new operating system (admin only)
 */
export async function createOperatingSystem(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body

    const operatingSystem = await operatingSystemService.createOperatingSystem(data)

    res.status(201).json({
      success: true,
      data: operatingSystem,
      message: 'Operating system created successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update an operating system (admin only)
 */
export async function updateOperatingSystem(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const data = req.body

    const operatingSystem = await operatingSystemService.updateOperatingSystem(id, data)

    res.json({
      success: true,
      data: operatingSystem,
      message: 'Operating system updated successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Delete an operating system (admin only)
 */
export async function deleteOperatingSystem(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    await operatingSystemService.deleteOperatingSystem(id)

    res.json({
      success: true,
      message: 'Operating system deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update price adjustment for an operating system (admin only)
 */
export async function updateOperatingSystemPrice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params
    const { priceAdjustment } = req.body

    if (priceAdjustment === undefined || isNaN(Number(priceAdjustment))) {
      res.status(400).json({
        success: false,
        message: 'Valid priceAdjustment is required',
      })
      return
    }

    const operatingSystem = await operatingSystemService.updatePrice(id, Number(priceAdjustment))

    res.json({
      success: true,
      data: operatingSystem,
      message: 'Operating system price updated successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Toggle operating system active status (admin only)
 */
export async function toggleOperatingSystemActive(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    const operatingSystem = await operatingSystemService.toggleOperatingSystemActive(id)

    res.json({
      success: true,
      data: operatingSystem,
      message: `Operating system ${operatingSystem.isActive ? 'activated' : 'deactivated'} successfully`,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Sync operating systems from Contabo API (admin only)
 */
export async function syncOperatingSystems(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await operatingSystemService.syncFromContabo()

    res.json({
      success: true,
      data: result,
      message: `Sync completed: ${result.created} created, ${result.updated} updated, ${result.failed} failed`,
    })
  } catch (error) {
    next(error)
  }
}
