import { PrismaClient, Region } from '@prisma/client'
import { NotFoundError, ConflictError, BadRequestError } from '../middleware/errorHandler'
import { contaboService } from './contaboService'

const prisma = new PrismaClient()

/**
 * Contabo region definitions
 * Based on Contabo's available regions
 */
const CONTABO_REGIONS: Array<{
  code: string
  name: string
  description: string
  sortOrder: number
}> = [
  {
    code: 'EU-CENTRAL-1',
    name: 'Europa Central',
    description: 'Frankfurt, Alemania - Centro de datos de alta disponibilidad en Europa Central',
    sortOrder: 1,
  },
  {
    code: 'US-EAST-1',
    name: 'Norteamérica Este',
    description: 'Virginia, Estados Unidos - Centro de datos en la costa este de EE.UU.',
    sortOrder: 2,
  },
  {
    code: 'AP-SOUTH-1',
    name: 'Asia Pacífico Sur',
    description: 'Singapur - Centro de datos en el sudeste asiático',
    sortOrder: 3,
  },
  {
    code: 'EU-WEST-1',
    name: 'Europa Oeste',
    description: 'Londres, Reino Unido - Centro de datos en Europa Occidental',
    sortOrder: 4,
  },
]

export interface CreateRegionData {
  code: string
  name: string
  description?: string
  priceAdjustment?: number
  sortOrder?: number
  isActive?: boolean
}

export interface UpdateRegionData {
  code?: string
  name?: string
  description?: string
  priceAdjustment?: number
  sortOrder?: number
  isActive?: boolean
}

export interface RegionFilters {
  isActive?: boolean
}

export interface RegionInfo {
  id: string
  code: string
  name: string
  description: string | null
  priceAdjustment: number
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export class RegionService {
  /**
   * Get all regions with optional filters
   */
  async getRegions(filters: RegionFilters = {}): Promise<RegionInfo[]> {
    const where: any = {}

    // Only show active regions by default
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive
    } else {
      where.isActive = true
    }

    const regions = await prisma.region.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    })

    return regions.map((r) => this.sanitizeRegion(r))
  }

  /**
   * Get region by ID
   */
  async getRegionById(id: string): Promise<RegionInfo> {
    const region = await prisma.region.findUnique({
      where: { id },
    })

    if (!region) {
      throw NotFoundError('Region not found')
    }

    return this.sanitizeRegion(region)
  }

  /**
   * Get region by code
   */
  async getRegionByCode(code: string): Promise<RegionInfo | null> {
    const region = await prisma.region.findUnique({
      where: { code },
    })

    if (!region) {
      return null
    }

    return this.sanitizeRegion(region)
  }

  /**
   * Create a new region (admin only)
   */
  async createRegion(data: CreateRegionData): Promise<RegionInfo> {
    // Check if region with same code already exists
    const existing = await prisma.region.findUnique({
      where: { code: data.code },
    })

    if (existing) {
      throw ConflictError('Region with this code already exists')
    }

    // Validate price adjustment
    if (data.priceAdjustment !== undefined && data.priceAdjustment < 0) {
      throw BadRequestError('Price adjustment cannot be negative')
    }

    const region = await prisma.region.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        priceAdjustment: data.priceAdjustment ?? 0,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    })

    return this.sanitizeRegion(region)
  }

  /**
   * Update a region (admin only)
   */
  async updateRegion(id: string, data: UpdateRegionData): Promise<RegionInfo> {
    const region = await prisma.region.findUnique({
      where: { id },
    })

    if (!region) {
      throw NotFoundError('Region not found')
    }

    // If updating code, check it's not taken
    if (data.code && data.code !== region.code) {
      const existing = await prisma.region.findUnique({
        where: { code: data.code },
      })

      if (existing) {
        throw ConflictError('Region with this code already exists')
      }
    }

    // Validate price adjustment if provided
    if (data.priceAdjustment !== undefined && data.priceAdjustment < 0) {
      throw BadRequestError('Price adjustment cannot be negative')
    }

    const updated = await prisma.region.update({
      where: { id },
      data,
    })

    return this.sanitizeRegion(updated)
  }

  /**
   * Delete a region (admin only)
   */
  async deleteRegion(id: string): Promise<void> {
    const region = await prisma.region.findUnique({
      where: { id },
    })

    if (!region) {
      throw NotFoundError('Region not found')
    }

    // Check if region is being used in active orders
    const activeOrders = await prisma.order.findFirst({
      where: {
        region: region.code,
        status: { notIn: ['CANCELLED', 'COMPLETED'] },
      },
    })

    if (activeOrders) {
      throw BadRequestError('Cannot delete region with active orders')
    }

    await prisma.region.delete({
      where: { id },
    })
  }

  /**
   * Toggle region active status (admin only)
   */
  async toggleRegionActive(id: string): Promise<RegionInfo> {
    const region = await prisma.region.findUnique({
      where: { id },
    })

    if (!region) {
      throw NotFoundError('Region not found')
    }

    const updated = await prisma.region.update({
      where: { id },
      data: { isActive: !region.isActive },
    })

    return this.sanitizeRegion(updated)
  }

  /**
   * Sync regions from Contabo (admin only)
   * Creates or updates regions based on Contabo's available regions
   */
  async syncRegionsFromContabo(): Promise<{ created: number; updated: number; failed: number }> {
    let created = 0
    let updated = 0
    let failed = 0

    for (const regionData of CONTABO_REGIONS) {
      try {
        const existing = await prisma.region.findUnique({
          where: { code: regionData.code },
        })

        if (existing) {
          // Update existing region (preserve price adjustment and isActive)
          await prisma.region.update({
            where: { id: existing.id },
            data: {
              name: regionData.name,
              description: regionData.description,
              sortOrder: regionData.sortOrder,
            },
          })
          updated++
        } else {
          // Create new region
          await prisma.region.create({
            data: {
              code: regionData.code,
              name: regionData.name,
              description: regionData.description,
              priceAdjustment: 0,
              sortOrder: regionData.sortOrder,
              isActive: true,
            },
          })
          created++
        }
      } catch (error) {
        console.error(`[Region Sync] Failed to sync region ${regionData.code}:`, error)
        failed++
      }
    }

    return { created, updated, failed }
  }

  /**
   * Remove sensitive data from region object
   */
  private sanitizeRegion(region: Region): RegionInfo {
    return {
      id: region.id,
      code: region.code,
      name: region.name,
      description: region.description,
      priceAdjustment: Number(region.priceAdjustment),
      isActive: region.isActive,
      sortOrder: region.sortOrder,
      createdAt: region.createdAt,
      updatedAt: region.updatedAt,
    }
  }
}

export const regionService = new RegionService()
