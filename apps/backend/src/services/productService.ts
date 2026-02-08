import { PrismaClient, Product, DiskType } from '@prisma/client'
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../middleware/errorHandler'
import { contaboService } from './contaboService'

const prisma = new PrismaClient()

/**
 * Contabo product specifications mapping
 * Based on Contabo's public product catalog
 * Maps productId to technical specifications (CPU, RAM, disk type)
 * Only includes VPS products (no VDS)
 */
const CONTABO_PRODUCT_SPECS: Record<string, {
  name: string
  description: string
  ramMb: number
  cpuCores: number
  diskGb: number
  diskType: DiskType
  regions: string[]
  sortOrder: number
}> = {
  // Cloud VPS 10 Series
  'V91': {
    name: 'VPS 10 NVMe',
    description: 'VPS de entrada con almacenamiento NVMe ultra rápido',
    ramMb: 4096,
    cpuCores: 2,
    diskGb: 75,
    diskType: 'NVME',
    regions: ['EU-CENTRAL-1', 'US-EAST-1', 'AP-SOUTH-1', 'EU-WEST-1'],
    sortOrder: 1,
  },
  'V92': {
    name: 'VPS 10 SSD',
    description: 'VPS de entrada con almacenamiento SSD',
    ramMb: 4096,
    cpuCores: 2,
    diskGb: 150,
    diskType: 'SSD',
    regions: ['EU-CENTRAL-1', 'US-EAST-1', 'AP-SOUTH-1', 'EU-WEST-1'],
    sortOrder: 2,
  },
  'V93': {
    name: 'Storage VPS 10',
    description: 'VPS optimizado para almacenamiento con gran capacidad de disco',
    ramMb: 4096,
    cpuCores: 2,
    diskGb: 1000,
    diskType: 'SSD',
    regions: ['EU-CENTRAL-1'],
    sortOrder: 3,
  },
  // Cloud VPS 20 Series
  'V94': {
    name: 'VPS 20 NVMe',
    description: 'VPS de nivel medio con almacenamiento NVMe ultra rápido',
    ramMb: 8192,
    cpuCores: 4,
    diskGb: 100,
    diskType: 'NVME',
    regions: ['EU-CENTRAL-1', 'US-EAST-1', 'AP-SOUTH-1', 'EU-WEST-1'],
    sortOrder: 4,
  },
  'V95': {
    name: 'VPS 20 SSD',
    description: 'VPS de nivel medio con almacenamiento SSD',
    ramMb: 8192,
    cpuCores: 4,
    diskGb: 200,
    diskType: 'SSD',
    regions: ['EU-CENTRAL-1', 'US-EAST-1', 'AP-SOUTH-1', 'EU-WEST-1'],
    sortOrder: 5,
  },
  'V96': {
    name: 'Storage VPS 20',
    description: 'VPS optimizado para almacenamiento con gran capacidad de disco',
    ramMb: 8192,
    cpuCores: 4,
    diskGb: 2000,
    diskType: 'SSD',
    regions: ['EU-CENTRAL-1'],
    sortOrder: 6,
  },
  // Cloud VPS 30 Series
  'V97': {
    name: 'VPS 30 NVMe',
    description: 'VPS de alto rendimiento con almacenamiento NVMe ultra rápido',
    ramMb: 16384,
    cpuCores: 6,
    diskGb: 200,
    diskType: 'NVME',
    regions: ['EU-CENTRAL-1', 'US-EAST-1', 'AP-SOUTH-1', 'EU-WEST-1'],
    sortOrder: 7,
  },
  'V98': {
    name: 'VPS 30 SSD',
    description: 'VPS de alto rendimiento con almacenamiento SSD',
    ramMb: 16384,
    cpuCores: 6,
    diskGb: 400,
    diskType: 'SSD',
    regions: ['EU-CENTRAL-1', 'US-EAST-1', 'AP-SOUTH-1', 'EU-WEST-1'],
    sortOrder: 8,
  },
  // Cloud VPS 40 Series
  'V99': {
    name: 'VPS 40 NVMe',
    description: 'VPS premium con NVMe para cargas de trabajo exigentes',
    ramMb: 32768,
    cpuCores: 8,
    diskGb: 300,
    diskType: 'NVME',
    regions: ['EU-CENTRAL-1', 'US-EAST-1', 'AP-SOUTH-1'],
    sortOrder: 9,
  },
  // Cloud VPS 50 Series
  'V100': {
    name: 'VPS 50 NVMe',
    description: 'VPS premium de alto rendimiento con NVMe',
    ramMb: 65536,
    cpuCores: 12,
    diskGb: 400,
    diskType: 'NVME',
    regions: ['EU-CENTRAL-1', 'US-EAST-1'],
    sortOrder: 10,
  },
}

export interface CreateProductData {
  name: string
  description?: string
  contaboProductId: string
  ramMb: number
  cpuCores: number
  diskGb: number
  diskType: DiskType
  regions: string[]
  productType?: string
  contactEmail?: string
  basePrice: number
  sellingPrice: number
  sortOrder?: number
  isActive?: boolean
}

export interface UpdateProductData {
  name?: string
  description?: string
  contaboProductId?: string
  ramMb?: number
  cpuCores?: number
  diskGb?: number
  diskType?: DiskType
  regions?: string[]
  productType?: string
  contactEmail?: string
  basePrice?: number
  sellingPrice?: number
  sortOrder?: number
  isActive?: boolean
  showOnHome?: boolean
  homeOrder?: number
  isRecommended?: boolean
}

export interface ProductFilters {
  diskType?: DiskType
  minRam?: number
  maxRam?: number
  minCpu?: number
  maxCpu?: number
  isActive?: boolean
  search?: string
}

export interface ProductInfo {
  id: string
  name: string
  description: string | null
  contaboProductId: string
  ramMb: number
  cpuCores: number
  diskGb: number
  diskType: DiskType
  regions: string[]
  productType: string
  contactEmail: string | null
  basePrice: number
  sellingPrice: number
  sortOrder: number
  isActive: boolean
  showOnHome: boolean
  homeOrder: number
  isRecommended: boolean
  createdAt: Date
  updatedAt: Date
}

export class ProductService {
  /**
   * Get all products with optional filters
   */
  async getProducts(filters: ProductFilters = {}): Promise<ProductInfo[]> {
    const where: any = {}

    // Only show active products by default unless explicitly requested
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive
    } else {
      where.isActive = true
    }

    if (filters.diskType) {
      where.diskType = filters.diskType
    }

    if (filters.minRam || filters.maxRam) {
      where.ramMb = {}
      if (filters.minRam) where.ramMb.gte = filters.minRam
      if (filters.maxRam) where.ramMb.lte = filters.maxRam
    }

    if (filters.minCpu || filters.maxCpu) {
      where.cpuCores = {}
      if (filters.minCpu) where.cpuCores.gte = filters.minCpu
      if (filters.maxCpu) where.cpuCores.lte = filters.maxCpu
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { contaboProductId: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        priceRules: true,
      },
    })

    return products.map((p) => this.sanitizeProduct(p))
  }

  /**
   * Get products featured on home page
   * Returns products marked with showOnHome=true, ordered by homeOrder
   */
  async getFeaturedProducts(): Promise<ProductInfo[]> {
    const products = await prisma.product.findMany({
      where: {
        showOnHome: true,
        isActive: true,
      },
      orderBy: { homeOrder: 'asc' },
      include: {
        priceRules: true,
      },
    })

    return products.map((p) => this.sanitizeProduct(p))
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<ProductInfo> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        priceRules: true,
      },
    })

    if (!product) {
      throw NotFoundError('Product not found')
    }

    return this.sanitizeProduct(product)
  }

  /**
   * Get product by Contabo product ID
   */
  async getProductByContaboId(contaboProductId: string): Promise<ProductInfo | null> {
    const product = await prisma.product.findUnique({
      where: { contaboProductId },
      include: {
        priceRules: true,
      },
    })

    if (!product) {
      return null
    }

    return this.sanitizeProduct(product)
  }

  /**
   * Create a new product (admin only)
   */
  async createProduct(data: CreateProductData): Promise<ProductInfo> {
    // Check if product with same Contabo ID already exists
    const existing = await prisma.product.findUnique({
      where: { contaboProductId: data.contaboProductId },
    })

    if (existing) {
      throw ConflictError('Product with this Contabo ID already exists')
    }

    // Validate prices
    if (data.basePrice <= 0 || data.sellingPrice <= 0) {
      throw BadRequestError('Prices must be positive')
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        contaboProductId: data.contaboProductId,
        ramMb: data.ramMb,
        cpuCores: data.cpuCores,
        diskGb: data.diskGb,
        diskType: data.diskType,
        regions: data.regions,
        productType: data.productType || 'STANDARD',
        contactEmail: data.contactEmail,
        basePrice: data.basePrice,
        sellingPrice: data.sellingPrice,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
      include: {
        priceRules: true,
      },
    })

    return this.sanitizeProduct(product)
  }

  /**
   * Update a product (admin only)
   */
  async updateProduct(id: string, data: UpdateProductData): Promise<ProductInfo> {
    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      throw NotFoundError('Product not found')
    }

    // If updating Contabo ID, check it's not taken
    if (data.contaboProductId && data.contaboProductId !== product.contaboProductId) {
      const existing = await prisma.product.findUnique({
        where: { contaboProductId: data.contaboProductId },
      })

      if (existing) {
        throw ConflictError('Product with this Contabo ID already exists')
      }
    }

    // Validate prices if provided
    if (data.basePrice !== undefined && data.basePrice <= 0) {
      throw BadRequestError('Base price must be positive')
    }

    if (data.sellingPrice !== undefined && data.sellingPrice <= 0) {
      throw BadRequestError('Selling price must be positive')
    }

    const updated = await prisma.product.update({
      where: { id },
      data,
      include: {
        priceRules: true,
      },
    })

    return this.sanitizeProduct(updated)
  }

  /**
   * Delete a product (admin only)
   */
  async deleteProduct(id: string): Promise<void> {
    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      throw NotFoundError('Product not found')
    }

    // Check if product has active orders
    const activeOrders = await prisma.order.findFirst({
      where: {
        productId: id,
        status: { notIn: ['CANCELLED', 'COMPLETED'] },
      },
    })

    if (activeOrders) {
      throw BadRequestError('Cannot delete product with active orders')
    }

    await prisma.product.delete({
      where: { id },
    })
  }

  /**
   * Calculate price based on billing period using PriceRules
   * Returns price breakdown including base price, region adjustment, and OS adjustment
   */
  async calculatePrice(
    productId: string,
    periodMonths: number,
    regionId?: string,
    osId?: string
  ): Promise<{
    basePrice: number
    regionPriceAdj: number
    osPriceAdj: number
    totalPrice: number
  }> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        priceRules: {
          where: { isActive: true },
        },
      },
    })

    if (!product) {
      throw NotFoundError('Product not found')
    }

    // Calculate base price using price rules or base price * months
    let basePrice = 0
    const priceRule = product.priceRules.find((rule) => rule.periodMonths === periodMonths)

    if (priceRule) {
      basePrice = Number(priceRule.finalPrice)
    } else {
      // Use selling price (customer-facing price) instead of base price (cost)
      basePrice = Number(product.sellingPrice) * periodMonths
    }

    // Get region price adjustment if regionId provided
    let regionPriceAdj = 0
    if (regionId) {
      const { regionService } = await import('./regionService')
      const region = await regionService.getRegionById(regionId).catch(() => null)
      if (region) {
        regionPriceAdj = region.priceAdjustment
      }
    }

    // Get OS price adjustment if osId provided
    let osPriceAdj = 0
    if (osId) {
      const { operatingSystemService } = await import('./operatingSystemService')
      const os = await operatingSystemService.getOperatingSystemById(osId).catch(() => null)
      if (os) {
        osPriceAdj = os.priceAdjustment
      }
    }

    const totalPrice = basePrice + regionPriceAdj + osPriceAdj

    return {
      basePrice,
      regionPriceAdj,
      osPriceAdj,
      totalPrice,
    }
  }

  /**
   * Get custom products (requires contact before purchase)
   */
  async getCustomProducts(): Promise<ProductInfo[]> {
    const products = await prisma.product.findMany({
      where: {
        productType: 'CUSTOM',
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        priceRules: true,
      },
    })

    return products.map((p) => this.sanitizeProduct(p))
  }

  /**
   * Sync products from Contabo (admin only)
   * Fetches products from Contabo API and creates/updates them
   */
  async syncProductsFromContabo(): Promise<{ created: number; updated: number; failed: number }> {
    let created = 0
    let updated = 0
    let failed = 0

    try {
      // Fetch products from Contabo API
      const contaboProducts = await (contaboService as any).getProducts()

      // Filter only VPS/VDS products (itemId starts with V)
      const vpsProducts = contaboProducts.filter((p: any) => p.priceItem?.itemId?.startsWith('V'))

      console.log(`[Product Sync] Found ${vpsProducts.length} VPS/VDS products from Contabo`)

      for (const contaboProduct of vpsProducts) {
        try {
          const itemId = contaboProduct.priceItem?.itemId
          if (!itemId) continue

          // Find USD price
          const usdPrice = contaboProduct.priceItem?.price?.find((p: any) => p.currency === 'USD')
          if (!usdPrice) {
            console.log(`[Product Sync] Skipping ${itemId} - no USD price found`)
            continue
          }

          // Get specs from mapping
          const specs = CONTABO_PRODUCT_SPECS[itemId]

          // Skip products without specs (we don't have technical details for them)
          if (!specs) {
            console.log(`[Product Sync] Skipping ${itemId} - no specs defined (${contaboProduct.priceItem?.name})`)
            continue
          }

          const basePrice = usdPrice.amount
          // Apply 30% markup for selling price
          const sellingPrice = Math.ceil(basePrice * 1.3 * 100) / 100

          const existing = await prisma.product.findUnique({
            where: { contaboProductId: itemId },
          })

          if (existing) {
            // Update existing product (preserve isActive and custom settings)
            await prisma.product.update({
              where: { contaboProductId: itemId },
              data: {
                name: specs.name,
                description: specs.description,
                ramMb: specs.ramMb,
                cpuCores: specs.cpuCores,
                diskGb: specs.diskGb,
                diskType: specs.diskType,
                regions: specs.regions,
                basePrice: basePrice,
                sellingPrice: sellingPrice,
                sortOrder: specs.sortOrder,
              },
            })
            updated++
            console.log(`[Product Sync] Updated ${itemId} (${specs.name})`)
          } else {
            // Create new product
            await prisma.product.create({
              data: {
                contaboProductId: itemId,
                name: specs.name,
                description: specs.description,
                ramMb: specs.ramMb,
                cpuCores: specs.cpuCores,
                diskGb: specs.diskGb,
                diskType: specs.diskType,
                regions: specs.regions,
                productType: 'STANDARD',
                contactEmail: null,
                basePrice: basePrice,
                sellingPrice: sellingPrice,
                sortOrder: specs.sortOrder,
                isActive: true,
              },
            })
            created++
            console.log(`[Product Sync] Created ${itemId} (${specs.name})`)
          }
        } catch (error) {
          console.error(`[Product Sync] Failed to sync product ${contaboProduct.priceItem?.itemId}:`, error)
          failed++
        }
      }

      console.log(`[Product Sync] Completed: ${created} created, ${updated} updated, ${failed} failed`)
    } catch (error) {
      console.error('[Product Sync] Failed to fetch products from Contabo:', error)
      // If API call fails, return without making any changes
      throw error
    }

    return { created, updated, failed }
  }

  /**
   * Get or create price rule for a product
   */
  async setPriceRule(
    productId: string,
    periodMonths: number,
    discountPercent: number
  ): Promise<ProductInfo> {
    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      throw NotFoundError('Product not found')
    }

    // Calculate final price with discount (use selling price, not base price/cost)
    const sellingPrice = Number(product.sellingPrice)
    const monthlyPrice = sellingPrice * periodMonths
    const discountAmount = monthlyPrice * (discountPercent / 100)
    const finalPrice = monthlyPrice - discountAmount

    // Upsert price rule
    await prisma.priceRule.upsert({
      where: {
        productId_periodMonths: {
          productId,
          periodMonths,
        },
      },
      create: {
        productId,
        periodMonths,
        discountPercent,
        finalPrice,
      },
      update: {
        discountPercent,
        finalPrice,
      },
    })

    return this.getProductById(productId)
  }

  /**
   * Remove sensitive data from product object
   */
  private sanitizeProduct(product: any): ProductInfo {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      contaboProductId: product.contaboProductId,
      ramMb: product.ramMb,
      cpuCores: product.cpuCores,
      diskGb: product.diskGb,
      diskType: product.diskType,
      regions: product.regions,
      productType: product.productType,
      contactEmail: product.contactEmail,
      basePrice: Number(product.basePrice),
      sellingPrice: Number(product.sellingPrice),
      sortOrder: product.sortOrder,
      isActive: product.isActive,
      showOnHome: product.showOnHome ?? false,
      homeOrder: product.homeOrder ?? 0,
      isRecommended: product.isRecommended ?? false,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }
  }
}

export const productService = new ProductService()
