import { Router } from 'express'
import * as productController from '../controllers/productController'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import {
  createProductSchema,
  updateProductSchema,
  productFiltersSchema,
  priceCalculationSchema,
} from '../utils/validators'

const router = Router()

/**
 * @route   GET /api/products
 * @desc    Get all products with optional filters
 * @access  Public
 */
router.get(
  '/',
  validate(productFiltersSchema, 'query'),
  productController.getProducts
)

/**
 * @route   GET /api/products/featured
 * @desc    Get products featured on home page
 * @access  Public
 */
router.get(
  '/featured',
  productController.getFeaturedProducts
)

/**
 * @route   GET /api/products/sync
 * @desc    Sync products from Contabo
 * @access  Admin
 * @note    Must come before /:id to avoid route conflicts
 */
router.post(
  '/sync',
  authenticate,
  requireAdmin,
  productController.syncProducts
)

/**
 * @route   GET /api/products/:id/price
 * @desc    Calculate price for billing period
 * @access  Public
 * @note    Must come before /:id to avoid route conflicts
 */
router.get(
  '/:id/price',
  validate(priceCalculationSchema, 'query'),
  productController.calculatePrice
)

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get(
  '/:id',
  productController.getProduct
)

/**
 * @route   POST /api/admin/products
 * @desc    Create a new product
 * @access  Admin
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate(createProductSchema),
  productController.createProduct
)

/**
 * @route   PUT /api/admin/products/:id
 * @desc    Update a product
 * @access  Admin
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validate(updateProductSchema),
  productController.updateProduct
)

/**
 * @route   DELETE /api/admin/products/:id
 * @desc    Delete a product
 * @access  Admin
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  productController.deleteProduct
)

export { router as productRouter }
