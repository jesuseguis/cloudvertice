import { PrismaClient, OperatingSystem } from '@prisma/client'
import { NotFoundError, ConflictError, BadRequestError } from '../middleware/errorHandler'
import axios from 'axios'

const prisma = new PrismaClient()

export interface CreateOperatingSystemData {
  imageId: string
  name: string
  priceAdjustment?: number
  sortOrder?: number
  isActive?: boolean
}

export interface UpdateOperatingSystemData {
  imageId?: string
  name?: string
  priceAdjustment?: number
  sortOrder?: number
  isActive?: boolean
}

export interface OperatingSystemFilters {
  isActive?: boolean
}

export interface OperatingSystemInfo {
  id: string
  imageId: string
  name: string
  priceAdjustment: number
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface ContaboImage {
  imageId: string
  name: string
  displayName?: string
  description?: string
  osType: string
  osVersion: string
  defaultUser?: string
  minDisk?: number
  size?: number
}

export class OperatingSystemService {
  private readonly CONTABO_API_BASE = 'https://api.contabo.com/v1'

  /**
   * Generate unique request ID for Contabo API (must be UUID4)
   */
  private generateRequestId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  /**
   * Get all operating systems with optional filters
   */
  async getOperatingSystems(filters: OperatingSystemFilters = {}): Promise<OperatingSystemInfo[]> {
    const where: any = {}

    // Only show active operating systems by default
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive
    } else {
      where.isActive = true
    }

    const operatingSystems = await prisma.operatingSystem.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    })

    return operatingSystems.map((os) => this.sanitizeOperatingSystem(os))
  }

  /**
   * Get operating system by ID
   */
  async getOperatingSystemById(id: string): Promise<OperatingSystemInfo> {
    const operatingSystem = await prisma.operatingSystem.findUnique({
      where: { id },
    })

    if (!operatingSystem) {
      throw NotFoundError('Operating system not found')
    }

    return this.sanitizeOperatingSystem(operatingSystem)
  }

  /**
   * Get operating system by image ID
   */
  async getOperatingSystemByImageId(imageId: string): Promise<OperatingSystemInfo | null> {
    const operatingSystem = await prisma.operatingSystem.findUnique({
      where: { imageId },
    })

    if (!operatingSystem) {
      return null
    }

    return this.sanitizeOperatingSystem(operatingSystem)
  }

  /**
   * Create a new operating system (admin only)
   */
  async createOperatingSystem(data: CreateOperatingSystemData): Promise<OperatingSystemInfo> {
    // Check if operating system with same imageId already exists
    const existing = await prisma.operatingSystem.findUnique({
      where: { imageId: data.imageId },
    })

    if (existing) {
      throw ConflictError('Operating system with this image ID already exists')
    }

    // Validate price adjustment
    if (data.priceAdjustment !== undefined && data.priceAdjustment < 0) {
      throw BadRequestError('Price adjustment cannot be negative')
    }

    const operatingSystem = await prisma.operatingSystem.create({
      data: {
        imageId: data.imageId,
        name: data.name,
        priceAdjustment: data.priceAdjustment ?? 0,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    })

    return this.sanitizeOperatingSystem(operatingSystem)
  }

  /**
   * Update an operating system (admin only)
   */
  async updateOperatingSystem(id: string, data: UpdateOperatingSystemData): Promise<OperatingSystemInfo> {
    const operatingSystem = await prisma.operatingSystem.findUnique({
      where: { id },
    })

    if (!operatingSystem) {
      throw NotFoundError('Operating system not found')
    }

    // If updating imageId, check it's not taken
    if (data.imageId && data.imageId !== operatingSystem.imageId) {
      const existing = await prisma.operatingSystem.findUnique({
        where: { imageId: data.imageId },
      })

      if (existing) {
        throw ConflictError('Operating system with this image ID already exists')
      }
    }

    // Validate price adjustment if provided
    if (data.priceAdjustment !== undefined && data.priceAdjustment < 0) {
      throw BadRequestError('Price adjustment cannot be negative')
    }

    const updated = await prisma.operatingSystem.update({
      where: { id },
      data,
    })

    return this.sanitizeOperatingSystem(updated)
  }

  /**
   * Delete an operating system (admin only)
   */
  async deleteOperatingSystem(id: string): Promise<void> {
    const operatingSystem = await prisma.operatingSystem.findUnique({
      where: { id },
    })

    if (!operatingSystem) {
      throw NotFoundError('Operating system not found')
    }

    await prisma.operatingSystem.delete({
      where: { id },
    })
  }

  /**
   * Update price adjustment for an operating system (admin only)
   */
  async updatePrice(id: string, priceAdjustment: number): Promise<OperatingSystemInfo> {
    if (priceAdjustment < 0) {
      throw BadRequestError('Price adjustment cannot be negative')
    }

    const operatingSystem = await prisma.operatingSystem.findUnique({
      where: { id },
    })

    if (!operatingSystem) {
      throw NotFoundError('Operating system not found')
    }

    const updated = await prisma.operatingSystem.update({
      where: { id },
      data: { priceAdjustment },
    })

    return this.sanitizeOperatingSystem(updated)
  }

  /**
   * Toggle operating system active status (admin only)
   */
  async toggleOperatingSystemActive(id: string): Promise<OperatingSystemInfo> {
    const operatingSystem = await prisma.operatingSystem.findUnique({
      where: { id },
    })

    if (!operatingSystem) {
      throw NotFoundError('Operating system not found')
    }

    const updated = await prisma.operatingSystem.update({
      where: { id },
      data: { isActive: !operatingSystem.isActive },
    })

    return this.sanitizeOperatingSystem(updated)
  }

  /**
   * Sync operating systems from Contabo API
   */
  async syncFromContabo(): Promise<{ created: number; updated: number; failed: number }> {
    // Get Contabo credentials from environment
    const clientId = process.env.CONTABO_CLIENT_ID
    const clientSecret = process.env.CONTABO_CLIENT_SECRET
    const apiUser = process.env.CONTABO_API_USER
    const apiPassword = process.env.CONTABO_API_PASSWORD

    if (!clientId || !clientSecret || !apiUser || !apiPassword) {
      throw BadRequestError('Provider API credentials not configured')
    }

    // Get OAuth2 token
    const token = await this.getContaboToken(clientId, clientSecret, apiUser, apiPassword)

    // Fetch images from Contabo
    const response = await axios.get(`${this.CONTABO_API_BASE}/compute/images`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-request-id': this.generateRequestId(),
      },
    })

    if (!response.data || !response.data.data) {
      throw BadRequestError('Invalid response from provider API')
    }

    const contaboImages = response.data.data as ContaboImage[]
    let created = 0
    let updated = 0
    let failed = 0

    // Process each image
    for (const img of contaboImages) {
      try {
        const imageId = img.imageId || (img as any).id
        const name = img.name || img.displayName || 'Unknown'

        const existing = await prisma.operatingSystem.findUnique({
          where: { imageId },
        })

        if (existing) {
          // Update existing operating system (preserve price adjustment)
          await prisma.operatingSystem.update({
            where: { id: existing.id },
            data: {
              name,
            },
          })
          updated++
        } else {
          // Create new operating system
          await prisma.operatingSystem.create({
            data: {
              imageId,
              name,
              priceAdjustment: 0,
              sortOrder: 0,
              isActive: true,
            },
          })
          created++
        }
      } catch (error) {
        console.error(`[Contabo Sync] Failed to sync OS ${img.imageId || (img as any).id}:`, error)
        failed++
      }
    }

    return { created, updated, failed }
  }

  /**
   * Get OAuth2 token from Contabo
   */
  private async getContaboToken(
    clientId: string,
    clientSecret: string,
    apiUser: string,
    apiPassword: string
  ): Promise<string> {
    try {
      const params = new URLSearchParams({
        grant_type: 'password',
        client_id: clientId,
        client_secret: clientSecret,
        username: apiUser,
        password: apiPassword,
      })

      const response = await axios.post(
        'https://auth.contabo.com/auth/realms/contabo/protocol/openid-connect/token',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      if (!response.data || !response.data.access_token) {
        throw BadRequestError('Failed to get Contabo access token')
      }

      return response.data.access_token
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Contabo auth error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        })
      }
      throw error
    }
  }

  /**
   * Remove sensitive data from operating system object
   */
  private sanitizeOperatingSystem(operatingSystem: OperatingSystem): OperatingSystemInfo {
    return {
      id: operatingSystem.id,
      imageId: operatingSystem.imageId,
      name: operatingSystem.name,
      priceAdjustment: Number(operatingSystem.priceAdjustment),
      isActive: operatingSystem.isActive,
      sortOrder: operatingSystem.sortOrder,
      createdAt: operatingSystem.createdAt,
      updatedAt: operatingSystem.updatedAt,
    }
  }
}

export const operatingSystemService = new OperatingSystemService()
