import { PrismaClient, Snapshot } from '@prisma/client'
import { NotFoundError, BadRequestError } from '../middleware/errorHandler'
import { contaboService } from './contaboService'
import { vpsService } from './vpsService'

const prisma = new PrismaClient()

export interface CreateSnapshotData {
  name: string
  description?: string
}

export interface SnapshotInfo {
  id: string
  vpsInstanceId: string
  contaboSnapId: string | null
  name: string
  description: string | null
  sizeMb: number | null
  createdAt: Date
}

export class SnapshotService {
  /**
   * Get snapshots for a VPS instance
   */
  async getSnapshots(vpsInstanceId: string): Promise<SnapshotInfo[]> {
    console.log('[SnapshotService] getSnapshots called for vpsInstanceId:', vpsInstanceId)

    const snapshots = await prisma.snapshot.findMany({
      where: { vpsInstanceId },
      orderBy: { createdAt: 'desc' },
    })

    console.log('[SnapshotService] Found snapshots:', snapshots.length)
    console.log('[SnapshotService] Snapshots data:', JSON.stringify(snapshots, null, 2))

    return snapshots.map((s) => this.sanitizeSnapshot(s))
  }

  /**
   * Get snapshot by ID
   */
  async getSnapshotById(id: string): Promise<SnapshotInfo> {
    const snapshot = await prisma.snapshot.findUnique({
      where: { id },
      include: {
        vpsInstance: true,
      },
    })

    if (!snapshot) {
      throw NotFoundError('Snapshot not found')
    }

    return this.sanitizeSnapshot(snapshot)
  }

  /**
   * Create a snapshot
   */
  async createSnapshot(
    vpsInstanceId: string,
    userId: string,
    data: CreateSnapshotData
  ): Promise<SnapshotInfo> {
    // Get VPS details
    const vps = await vpsService.getVpsById(vpsInstanceId)

    // Verify ownership
    if (vps.userId !== userId) {
      throw BadRequestError('You do not own this VPS')
    }

    // Check if VPS is in a valid state for snapshots
    const validStates = ['RUNNING', 'STOPPED']
    if (!validStates.includes(vps.status)) {
      throw BadRequestError(`Cannot create snapshot while VPS is ${vps.status}`)
    }

    // Check for duplicate name
    const existing = await prisma.snapshot.findFirst({
      where: {
        vpsInstanceId,
        name: data.name,
      },
    })

    if (existing) {
      throw BadRequestError('A snapshot with this name already exists for this VPS')
    }

    // Create snapshot via Contabo
    const contaboSnapshot = await contaboService.createSnapshot(
      vps.contaboInstanceId,
      data.name,
      data.description
    )

    // Store snapshot in database
    const snapshot = await prisma.snapshot.create({
      data: {
        vpsInstanceId,
        contaboSnapId: contaboSnapshot.snapshotId,
        name: data.name,
        description: data.description || null,
        sizeMb: contaboSnapshot.size || null,
      },
    })

    return this.sanitizeSnapshot(snapshot)
  }

  /**
   * Restore a snapshot
   */
  async restoreSnapshot(snapshotId: string, userId: string): Promise<void> {
    const snapshot = await prisma.snapshot.findUnique({
      where: { id: snapshotId },
      include: {
        vpsInstance: true,
      },
    })

    if (!snapshot) {
      throw NotFoundError('Snapshot not found')
    }

    // Verify ownership
    if (snapshot.vpsInstance.userId !== userId) {
      throw BadRequestError('You do not own this VPS')
    }

    // Check VPS state
    const vps = await vpsService.getVpsById(snapshot.vpsInstanceId)
    const validStates = ['STOPPED']
    if (!validStates.includes(vps.status)) {
      throw BadRequestError('VPS must be stopped before restoring a snapshot')
    }

    // Restore via Contabo
    await contaboService.restoreSnapshot(
      snapshot.vpsInstance.contaboInstanceId,
      snapshot.contaboSnapId!
    )
  }

  /**
   * Delete a snapshot
   */
  async deleteSnapshot(snapshotId: string, userId: string): Promise<void> {
    const snapshot = await prisma.snapshot.findUnique({
      where: { id: snapshotId },
      include: {
        vpsInstance: true,
      },
    })

    if (!snapshot) {
      throw NotFoundError('Snapshot not found')
    }

    // Verify ownership
    if (snapshot.vpsInstance.userId !== userId) {
      throw BadRequestError('You do not own this VPS')
    }

    // Delete via Contabo
    await contaboService.deleteSnapshot(
      snapshot.vpsInstance.contaboInstanceId,
      snapshot.contaboSnapId!
    )

    // Delete from database
    await prisma.snapshot.delete({
      where: { id: snapshotId },
    })
  }

  /**
   * Sync snapshots from Contabo
   */
  async syncSnapshots(vpsInstanceId: string, userId: string): Promise<{
    created: number
    updated: number
    deleted: number
  }> {
    const vps = await vpsService.getVpsById(vpsInstanceId)

    // Verify ownership
    if (vps.userId !== userId) {
      throw BadRequestError('You do not own this VPS')
    }

    // Get snapshots from Contabo
    const contaboSnapshots = await contaboService.getSnapshots(vps.contaboInstanceId)

    let created = 0
    let updated = 0
    let deleted = 0

    for (const cs of contaboSnapshots) {
      const existing = await prisma.snapshot.findFirst({
        where: {
          contaboSnapId: cs.snapshotId,
        },
      })

      if (existing) {
        // Update existing snapshot
        await prisma.snapshot.update({
          where: { id: existing.id },
          data: {
            sizeMb: cs.size || existing.sizeMb,
          },
        })
        updated++
      } else {
        // Create new snapshot record
        await prisma.snapshot.create({
          data: {
            vpsInstanceId,
            contaboSnapId: cs.snapshotId,
            name: cs.name,
            description: cs.description || null,
            sizeMb: cs.size || null,
            createdAt: new Date(cs.createdDate),
          },
        })
        created++
      }
    }

    // Delete snapshots that no longer exist in Contabo
    const localSnapshots = await prisma.snapshot.findMany({
      where: { vpsInstanceId },
    })

    for (const local of localSnapshots) {
      const existsInContabo = contaboSnapshots.some(
        (cs) => cs.snapshotId === local.contaboSnapId
      )

      if (!existsInContabo) {
        await prisma.snapshot.delete({
          where: { id: local.id },
        })
        deleted++
      }
    }

    return { created, updated, deleted }
  }

  /**
   * Get snapshot statistics for a VPS
   */
  async getSnapshotStatistics(vpsInstanceId: string) {
    const snapshots = await prisma.snapshot.findMany({
      where: { vpsInstanceId },
    })

    const totalSize = snapshots.reduce((sum, s) => sum + (s.sizeMb || 0), 0)

    return {
      count: snapshots.length,
      totalSize,
      snapshots: snapshots.map((s) => this.sanitizeSnapshot(s)),
    }
  }

  /**
   * Remove sensitive data from snapshot object
   */
  private sanitizeSnapshot(snapshot: Snapshot): SnapshotInfo {
    return {
      id: snapshot.id,
      vpsInstanceId: snapshot.vpsInstanceId,
      contaboSnapId: snapshot.contaboSnapId,
      name: snapshot.name,
      description: snapshot.description,
      sizeMb: snapshot.sizeMb,
      createdAt: snapshot.createdAt,
    }
  }
}

export const snapshotService = new SnapshotService()
