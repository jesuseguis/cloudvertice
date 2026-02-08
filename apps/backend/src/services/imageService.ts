import { PrismaClient, Image } from '@prisma/client'
import { NotFoundError, BadRequestError } from '../middleware/errorHandler'
import axios from 'axios'

const prisma = new PrismaClient()

export interface SyncImageData {
  contaboImageId: string
  name: string
  description?: string
  osType: string
  osVersion: string
  defaultUser?: string
  minDisk?: number
  size?: number
  isActive?: boolean
}

export interface ImageFilters {
  osType?: string
  isActive?: boolean
  search?: string
}

export interface ImageInfo {
  id: string
  contaboImageId: string
  name: string
  description: string | null
  osType: string
  osVersion: string
  defaultUser: string | null
  minDisk: number | null
  size: number | null
  isActive: boolean
  lastSyncedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export class ImageService {
  private readonly CONTABO_API_BASE = 'https://api.contabo.com/v1'

  /**
   * Generate unique request ID for Contabo API (must be UUID4)
   */
  private generateRequestId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  /**
   * Get all images with optional filters
   */
  async getImages(filters: ImageFilters = {}): Promise<ImageInfo[]> {
    const where: any = {}

    // Only show active images by default
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive
    } else {
      where.isActive = true
    }

    if (filters.osType) {
      where.osType = filters.osType
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { osType: { contains: filters.search, mode: 'insensitive' } },
        { osVersion: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const images = await prisma.image.findMany({
      where,
      orderBy: [{ osType: 'asc' }, { name: 'asc' }],
    })

    return images.map((i) => this.sanitizeImage(i))
  }

  /**
   * Get image by ID
   */
  async getImageById(id: string): Promise<ImageInfo> {
    const image = await prisma.image.findUnique({
      where: { id },
    })

    if (!image) {
      throw NotFoundError('Image not found')
    }

    return this.sanitizeImage(image)
  }

  /**
   * Get image by Contabo image ID
   */
  async getImageByContaboId(contaboImageId: string): Promise<ImageInfo | null> {
    const image = await prisma.image.findUnique({
      where: { contaboImageId },
    })

    if (!image) {
      return null
    }

    return this.sanitizeImage(image)
  }

  /**
   * Get available OS types
   */
  async getOsTypes(): Promise<string[]> {
    const result = await prisma.image.findMany({
      where: { isActive: true },
      select: { osType: true },
      distinct: ['osType'],
      orderBy: { osType: 'asc' },
    })

    return result.map((r) => r.osType)
  }

  /**
   * Sync images from Contabo API
   */
  async syncImagesFromContabo(): Promise<{ created: number; updated: number; failed: number }> {
    // Get Contabo credentials from environment
    const clientId = process.env.CONTABO_CLIENT_ID
    const clientSecret = process.env.CONTABO_CLIENT_SECRET
    const apiUser = process.env.CONTABO_API_USER
    const apiPassword = process.env.CONTABO_API_PASSWORD

    console.log('[Contabo Sync] Credentials loaded:', {
      clientId,
      clientSecret: clientSecret ? `${clientSecret.substring(0, 5)}...` : 'MISSING',
      apiUser,
      apiPassword: apiPassword ? `${apiPassword.substring(0, 3)}... (${apiPassword.length} chars)` : 'MISSING'
    })

    if (!clientId || !clientSecret || !apiUser || !apiPassword) {
      throw BadRequestError('Provider API credentials not configured')
    }

    // Get OAuth2 token
    const token = await this.getContaboToken(clientId, clientSecret, apiUser, apiPassword)

    console.log('[Contabo Sync] Token obtained, fetching images...')
    console.log('[Contabo Sync] Request:', {
      url: `${this.CONTABO_API_BASE}/compute/images`,
      token_preview: token ? `${token.substring(0, 20)}...` : 'MISSING'
    })

    // Fetch images from Contabo
    let response
    try {
      response = await axios.get(
        `${this.CONTABO_API_BASE}/compute/images`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'x-request-id': this.generateRequestId(),
          },
        }
      )
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('[Contabo Sync] Error fetching images:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        })
      }
      throw error
    }

    console.log('[Contabo Sync] Images fetched successfully!')

    if (!response.data || !response.data.data) {
      throw BadRequestError('Invalid response from provider API')
    }

    const contaboImages = response.data.data
    let created = 0
    let updated = 0
    let failed = 0

    // Process each image
    for (const img of contaboImages) {
      try {
        console.log('[Contabo Sync] Processing image:', {
          imageId: img.imageId || img.id,
          name: img.name || img.displayName,
          osType: img.osType,
          rawData: JSON.stringify(img)
        })

        const imageData: SyncImageData = {
          contaboImageId: img.imageId || img.id,
          name: img.name || img.displayName || 'Unknown',
          description: img.description || null,
          osType: img.osType || 'Unknown',
          osVersion: img.osVersion || 'Unknown',
          defaultUser: img.defaultUser || null,
          minDisk: img.minDisk ? Number(img.minDisk) : null,
          size: img.size ? Number(img.size) : null,
          isActive: true,
        }

        const existing = await prisma.image.findUnique({
          where: { contaboImageId: imageData.contaboImageId },
        })

        if (existing) {
          // Update existing image
          await prisma.image.update({
            where: { id: existing.id },
            data: {
              ...imageData,
              lastSyncedAt: new Date(),
            },
          })
          updated++
        } else {
          // Create new image
          await prisma.image.create({
            data: {
              ...imageData,
              lastSyncedAt: new Date(),
            },
          })
          created++
        }
      } catch (error) {
        console.error(`[Contabo Sync] Failed to sync image ${img.imageId || img.id}:`, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        })
        failed++
      }
    }

    return { created, updated, failed }
  }

  /**
   * Create a new image manually (admin only)
   */
  async createImage(data: SyncImageData): Promise<ImageInfo> {
    // Check if image with same Contabo ID already exists
    const existing = await prisma.image.findUnique({
      where: { contaboImageId: data.contaboImageId },
    })

    if (existing) {
      throw BadRequestError('Image with this Contabo ID already exists')
    }

    const image = await prisma.image.create({
      data: {
        ...data,
        isActive: data.isActive ?? true,
        lastSyncedAt: new Date(),
      },
    })

    return this.sanitizeImage(image)
  }

  /**
   * Update an image (admin only)
   */
  async updateImage(id: string, data: Partial<SyncImageData>): Promise<ImageInfo> {
    const image = await prisma.image.findUnique({
      where: { id },
    })

    if (!image) {
      throw NotFoundError('Image not found')
    }

    // If updating Contabo ID, check it's not taken
    if (data.contaboImageId && data.contaboImageId !== image.contaboImageId) {
      const existing = await prisma.image.findUnique({
        where: { contaboImageId: data.contaboImageId },
      })

      if (existing) {
        throw BadRequestError('Image with this Contabo ID already exists')
      }
    }

    const updated = await prisma.image.update({
      where: { id },
      data,
    })

    return this.sanitizeImage(updated)
  }

  /**
   * Delete an image (admin only)
   */
  async deleteImage(id: string): Promise<void> {
    const image = await prisma.image.findUnique({
      where: { id },
    })

    if (!image) {
      throw NotFoundError('Image not found')
    }

    await prisma.image.delete({
      where: { id },
    })
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

      console.log('[Contabo Auth] Request params:', {
        url: 'https://auth.contabo.com/auth/realms/contabo/protocol/openid-connect/token',
        grant_type: 'password',
        client_id: clientId,
        client_secret: clientSecret ? `${clientSecret.substring(0, 5)}...` : 'MISSING',
        username: apiUser,
        password: apiPassword ? `${apiPassword.substring(0, 3)}... (${apiPassword.length} chars)` : 'MISSING',
        body_preview: params.toString().substring(0, 100) + '...'
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

      console.log('[Contabo Auth] Success!')

      if (!response.data || !response.data.access_token) {
        throw BadRequestError('Failed to get Contabo access token')
      }

      return response.data.access_token
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Contabo auth error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        })
      }
      throw error
    }
  }

  /**
   * Remove sensitive data from image object
   */
  private sanitizeImage(image: Image): ImageInfo {
    return {
      id: image.id,
      contaboImageId: image.contaboImageId,
      name: image.name,
      description: image.description,
      osType: image.osType,
      osVersion: image.osVersion,
      defaultUser: image.defaultUser,
      minDisk: image.minDisk,
      size: image.size,
      isActive: image.isActive,
      lastSyncedAt: image.lastSyncedAt,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
    }
  }
}

export const imageService = new ImageService()
