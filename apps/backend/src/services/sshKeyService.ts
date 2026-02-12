import { PrismaClient, SshKey } from '@prisma/client'
import { NotFoundError, BadRequestError, ForbiddenError } from '../middleware/errorHandler'
import { validateSshPublicKey } from '../utils/validators'

const prisma = new PrismaClient()

export interface CreateSshKeyData {
  name: string
  publicKey: string
}

export interface SshKeyInfo {
  id: string
  userId: string
  name: string
  publicKey: string
  fingerprint: string
  createdAt: Date
}

export class SshKeyService {
  /**
   * Get user's SSH keys
   */
  async getUserSshKeys(userId: string): Promise<SshKeyInfo[]> {
    const keys = await prisma.sshKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return keys.map((k) => this.sanitizeSshKey(k))
  }

  /**
   * Get SSH key by ID
   */
  async getSshKeyById(id: string, userId: string, isAdmin = false): Promise<SshKeyInfo> {
    const key = await prisma.sshKey.findUnique({
      where: { id },
    })

    if (!key) {
      throw NotFoundError('SSH key not found')
    }

    // Check ownership (admin can see all)
    if (!isAdmin && key.userId !== userId) {
      throw ForbiddenError('You do not have permission to access this SSH key')
    }

    return this.sanitizeSshKey(key)
  }

  /**
   * Create a new SSH key
   */
  async createSshKey(userId: string, data: CreateSshKeyData): Promise<SshKeyInfo> {
    // Validate SSH public key format
    const validation = validateSshPublicKey(data.publicKey)
    if (!validation.valid) {
      throw BadRequestError(validation.error || 'Invalid SSH public key format')
    }

    // Check for duplicate key (same fingerprint)
    const fingerprint = validation.fingerprint || this.generateFingerprint(data.publicKey)

    const existing = await prisma.sshKey.findFirst({
      where: {
        userId,
        fingerprint,
      },
    })

    if (existing) {
      throw BadRequestError('This SSH key already exists in your account')
    }

    // Check for duplicate name
    const existingName = await prisma.sshKey.findFirst({
      where: {
        userId,
        name: data.name,
      },
    })

    if (existingName) {
      throw BadRequestError('You already have an SSH key with this name')
    }

    // Create key
    const key = await prisma.sshKey.create({
      data: {
        userId,
        name: data.name,
        publicKey: data.publicKey,
        fingerprint,
      },
    })

    return this.sanitizeSshKey(key)
  }

  /**
   * Delete SSH key
   */
  async deleteSshKey(id: string, userId: string, isAdmin = false): Promise<void> {
    const key = await prisma.sshKey.findUnique({
      where: { id },
    })

    if (!key) {
      throw NotFoundError('SSH key not found')
    }

    // Check ownership
    if (!isAdmin && key.userId !== userId) {
      throw ForbiddenError('You do not have permission to delete this SSH key')
    }

    // Check if key is in use by active orders
    // sshKeys is a JSON field containing an array of SSH key IDs
    const activeOrders = await prisma.order.findFirst({
      where: {
        status: { notIn: ['CANCELLED', 'COMPLETED'] },
        sshKeys: {
          not: null as any,
        },
      },
    })

    // Check if any active order contains this SSH key ID
    if (activeOrders && activeOrders.sshKeys) {
      const sshKeysArray = Array.isArray(activeOrders.sshKeys)
        ? activeOrders.sshKeys
        : JSON.parse(activeOrders.sshKeys as string)

      if (sshKeysArray.includes(id)) {
        throw BadRequestError('Cannot delete SSH key that is in use by active orders')
      }
    }

    await prisma.sshKey.delete({
      where: { id },
    })
  }

  /**
   * Update SSH key name
   */
  async updateSshKey(
    id: string,
    userId: string,
    name: string
  ): Promise<SshKeyInfo> {
    const key = await prisma.sshKey.findUnique({
      where: { id },
    })

    if (!key) {
      throw NotFoundError('SSH key not found')
    }

    if (key.userId !== userId) {
      throw ForbiddenError('You do not have permission to update this SSH key')
    }

    // Check for duplicate name
    const existingName = await prisma.sshKey.findFirst({
      where: {
        userId,
        name,
        id: { not: id },
      },
    })

    if (existingName) {
      throw BadRequestError('You already have an SSH key with this name')
    }

    const updated = await prisma.sshKey.update({
      where: { id },
      data: { name },
    })

    return this.sanitizeSshKey(updated)
  }

  /**
   * Get SSH keys by IDs
   */
  async getSshKeysByIds(ids: string[]): Promise<SshKey[]> {
    return prisma.sshKey.findMany({
      where: { id: { in: ids } },
    })
  }

  /**
   * Generate fingerprint from SSH public key
   * This is a simplified version - production should use proper SSH key parsing
   */
  private generateFingerprint(publicKey: string): string {
    // Remove comment and extract key data
    const parts = publicKey.trim().split(' ')
    const keyData = parts[1] || parts[0]

    // Simple hash for demo - use crypto.createHash in production
    const crypto = require('crypto')
    return crypto
      .createHash('sha256')
      .update(keyData)
      .digest('hex')
      .substring(0, 16)
  }

  /**
   * Remove sensitive data from SSH key object
   */
  private sanitizeSshKey(key: SshKey): SshKeyInfo {
    return {
      id: key.id,
      userId: key.userId,
      name: key.name,
      publicKey: key.publicKey,
      fingerprint: key.fingerprint ?? '',
      createdAt: key.createdAt,
    }
  }
}

export const sshKeyService = new SshKeyService()
