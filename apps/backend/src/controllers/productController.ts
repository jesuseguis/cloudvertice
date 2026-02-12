import { Request, Response, NextFunction } from 'express'
import { productService } from '../services/productService'
import { BadRequestError } from '../middleware/errorHandler'

/**
 * Get all products with optional filters
 */
export async function getProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      diskType,
      minRam,
      maxRam,
      minCpu,
      maxCpu,
      isActive,
      search,
    } = req.query

    const filters = {
      diskType: diskType as any,
      minRam: minRam ? Number(minRam) : undefined,
      maxRam: maxRam ? Number(maxRam) : undefined,
      minCpu: minCpu ? Number(minCpu) : undefined,
      maxCpu: maxCpu ? Number(maxCpu) : undefined,
      isActive: isActive ? isActive === 'true' : undefined,
      search: search as string,
    }

    const products = await productService.getProducts(filters)

    res.json({
      success: true,
      data: products,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get products featured on home page
 */
export async function getFeaturedProducts(_req: Request, res: Response, next: NextFunction) {
  try {
    const products = await productService.getFeaturedProducts()

    res.json({
      success: true,
      data: products,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get product by ID
 */
export async function getProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    const product = await productService.getProductById(id)

    res.json({
      success: true,
      data: product,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Calculate price for a product with billing period
 */
export async function calculatePrice(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { periodMonths } = req.query

    if (!periodMonths || isNaN(Number(periodMonths))) {
      throw BadRequestError('Valid periodMonths is required')
    }

    const price = await productService.calculatePrice(id, Number(periodMonths))

    res.json({
      success: true,
      data: {
        productId: id,
        periodMonths: Number(periodMonths),
        price,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Create a new product (admin only)
 */
export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body

    const product = await productService.createProduct(data)

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update a product (admin only)
 */
export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const data = req.body

    const product = await productService.updateProduct(id, data)

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Delete a product (admin only)
 */
export async function deleteProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    await productService.deleteProduct(id)

    res.json({
      success: true,
      message: 'Product deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Sync products from Contabo (admin only)
 */
export async function syncProducts(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await productService.syncProductsFromContabo()

    res.json({
      success: true,
      data: result,
      message: `Sync completed: ${result.created} created, ${result.updated} updated, ${result.failed} failed`,
    })
  } catch (error) {
    next(error)
  }
}
