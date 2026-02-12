import { Request, Response, NextFunction } from 'express'
import { imageService } from '../services/imageService'

/**
 * Get all images with optional filters
 */
export async function getImages(req: Request, res: Response, next: NextFunction) {
  try {
    const { osType, isActive, search } = req.query

    const filters = {
      osType: osType as string,
      isActive: isActive ? isActive === 'true' : undefined,
      search: search as string,
    }

    const images = await imageService.getImages(filters)

    res.json({
      success: true,
      data: images,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get image by ID
 */
export async function getImage(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    const image = await imageService.getImageById(id)

    res.json({
      success: true,
      data: image,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get available OS types
 */
export async function getOsTypes(_req: Request, res: Response, next: NextFunction) {
  try {
    const osTypes = await imageService.getOsTypes()

    res.json({
      success: true,
      data: osTypes,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Sync images from Contabo (admin only)
 */
export async function syncImages(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await imageService.syncImagesFromContabo()

    res.json({
      success: true,
      data: result,
      message: `Sync completed: ${result.created} created, ${result.updated} updated, ${result.failed} failed`,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Create a new image (admin only)
 */
export async function createImage(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body

    const image = await imageService.createImage(data)

    res.status(201).json({
      success: true,
      data: image,
      message: 'Image created successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update an image (admin only)
 */
export async function updateImage(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const data = req.body

    const image = await imageService.updateImage(id, data)

    res.json({
      success: true,
      data: image,
      message: 'Image updated successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Delete an image (admin only)
 */
export async function deleteImage(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    await imageService.deleteImage(id)

    res.json({
      success: true,
      message: 'Image deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}
