import { PrismaClient, VpsStatus, VpsActionType, OrderStatus } from '@prisma/client'
import { NotFoundError, BadRequestError, ForbiddenError } from '../middleware/errorHandler'
import { contaboService } from './contaboService'
import { encryptVpsPassword, decryptVpsPassword } from '../utils/encryption'

const prisma = new PrismaClient()

export interface CreateVPSData {
  orderId: string
  contaboInstanceId: string
  ipAddress: string
  rootPassword: string
  displayName?: string
  region?: string
  notes?: string
}

export interface VPSInfo {
  id: string
  userId: string
  orderId: string | null
  contaboInstanceId: bigint | null
  status: VpsStatus
  ipAddress: string | null
  displayName: string | null
  region: string
  rootPasswordEncrypted: string | null
  expiresAt: Date | null
  createdAt: Date
  updatedAt: Date
  suspendedAt: Date | null
  suspensionReason: string | null
  name: string | null
  netmaskCidr: number | null
  order?: any
  product?: any
  user?: any
  specs?: {
    cpuCores: number
    ramGB: number
    diskGB: number
    diskType: string
  }
}

export interface VpsActionHistory {
  id: string
  vpsInstanceId: string
  actionType: VpsActionType
  status: string
  errorMessage: string | null
  requestedAt: Date
  completedAt: Date | null
}

export class VpsService {
  /**
   * Get user's VPS instances
   */
  async getUserVpsInstances(userId: string): Promise<VPSInfo[]> {
    const instances = await prisma.vpsInstance.findMany({
      where: { userId },
      include: {
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return instances.map((i) => this.sanitizeVps(i))
  }

  /**
   * Get all VPS instances (admin only)
   */
  async getAllVpsInstances(): Promise<VPSInfo[]> {
    const instances = await prisma.vpsInstance.findMany({
      include: {
        product: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return instances.map((i) => this.sanitizeVps(i))
  }

  /**
   * Get VPS by ID
   */
  async getVpsById(id: string): Promise<VPSInfo> {
    const vps = await prisma.vpsInstance.findUnique({
      where: { id },
      include: {
        product: true,
      },
    })

    if (!vps) {
      throw NotFoundError('VPS instance not found')
    }

    return this.sanitizeVps(vps)
  }

  /**
   * Get VPS by Contabo instance ID
   */
  async getVpsByContaboId(contaboInstanceId: bigint): Promise<VPSInfo | null> {
    const vps = await prisma.vpsInstance.findUnique({
      where: { contaboInstanceId },
      include: {
        product: true,
      },
    })

    if (!vps) {
      return null
    }

    return this.sanitizeVps(vps)
  }

  /**
   * Create VPS instance (usually after Contabo provisioning)
   */
  async createVpsInstance(data: CreateVPSData): Promise<VPSInfo> {
    console.log('[VPS SERVICE] createVpsInstance called with orderId:', data.orderId)

    // Verify order exists and is in correct state
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: { product: true },
    })

    if (!order) {
      throw NotFoundError('Order not found')
    }

    // Allow PROVISIONING, PAID, or PROCESSING for retry scenarios
    if (order.status !== OrderStatus.PROVISIONING && order.status !== OrderStatus.PAID && order.status !== OrderStatus.PROCESSING) {
      throw BadRequestError('Order must be in PROVISIONING, PAID, or PROCESSING status')
    }

    // Get user for email notification
    const user = await prisma.user.findUnique({
      where: { id: order.userId },
      select: { id: true, email: true, firstName: true },
    })

    // Convert contaboInstanceId to BigInt
    const contaboIdBigInt = BigInt(data.contaboInstanceId)

    // Check if Contabo instance is already assigned to this order (retry scenario)
    const existing = await prisma.vpsInstance.findUnique({
      where: { contaboInstanceId: contaboIdBigInt },
    })

    if (existing) {
      console.log('[VPS SERVICE] VPS already exists for contaboInstanceId:', existing.id)

      // If it's assigned to the same order, just update it (retry scenario)
      if (existing.orderId === data.orderId) {
        console.log('[VPS SERVICE] Updating existing VPS for same order')

        // Calculate expiration date based on order period
        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + order.periodMonths)

        // Update VPS with new data
        const updated = await prisma.vpsInstance.update({
          where: { id: existing.id },
          data: {
            ipAddress: data.ipAddress,
            ...(data.rootPassword && {
              rootPasswordEncrypted: encryptVpsPassword(data.rootPassword)
            }),
            region: data.region || order.region,
            status: VpsStatus.RUNNING,
          },
          include: { product: true },
        })

        // Update order status to COMPLETED
        await prisma.order.update({
          where: { id: data.orderId },
          data: {
            status: OrderStatus.COMPLETED,
            paymentStatus: 'COMPLETED',
            completedAt: new Date(),
            ...(data.notes && { adminNotes: data.notes }),
          },
        })

        // Send email notification (only on first provisioning, not retries)
        if (user && data.rootPassword) {
          try {
            const { emailService } = await import('./emailService')
            await emailService.sendVpsProvisionedEmail({
              email: user.email,
              firstName: user.firstName || 'Customer',
              vpsName: updated.displayName || updated.name || 'VPS',
              ipAddress: data.ipAddress,
              rootPassword: data.rootPassword,
              region: data.region || order.region,
              dashboardUrl: `${process.env.APP_URL || 'http://localhost:3000'}/servers`,
            })
            console.log('[VPS SERVICE] VPS provisioned email sent to:', user.email)
          } catch (error) {
            console.error('[VPS SERVICE] Failed to send VPS provisioned email:', error)
          }
        }

        return this.sanitizeVps(updated)
      }

      // Instance is assigned to a different order
      console.log('[VPS SERVICE] Instance assigned to different order:', existing.orderId)
      throw BadRequestError('Contabo instance is already assigned to a different order')
    }

    console.log('[VPS SERVICE] Creating new VPS instance')

    // Calculate expiration date based on order period
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + order.periodMonths)

    // Encrypt root password
    const encryptedPassword = encryptVpsPassword(data.rootPassword)

    // Generate VPS name (e.g., vmd12345)
    const name = `vmd${Math.floor(Math.random() * 100000)}`

    // Create VPS instance
    const vps = await prisma.vpsInstance.create({
      data: {
        userId: order.userId,
        orderId: data.orderId,
        productId: order.productId,
        contaboInstanceId: contaboIdBigInt,
        status: VpsStatus.RUNNING,
        ipAddress: data.ipAddress,
        rootPasswordEncrypted: encryptedPassword,
        displayName: data.displayName || name,
        region: data.region || order.region,
        expiresAt,
        name,
      },
      include: {
        product: true,
      },
    })

    console.log('[VPS SERVICE] VPS created with ID:', vps.id)

    // Update order status to COMPLETED and save provisioning notes
    await prisma.order.update({
      where: { id: data.orderId },
      data: {
        status: OrderStatus.COMPLETED,
        completedAt: new Date(),
        ...(data.notes && { adminNotes: data.notes }),
      },
    })

    // Send email notification
    if (user) {
      try {
        const { emailService } = await import('./emailService')
        await emailService.sendVpsProvisionedEmail({
          email: user.email,
          firstName: user.firstName || 'Customer',
          vpsName: vps.displayName || vps.name || 'VPS',
          ipAddress: data.ipAddress,
          rootPassword: data.rootPassword,
          region: data.region || order.region,
          dashboardUrl: `${process.env.APP_URL || 'http://localhost:3000'}/servers`,
        })
        console.log('[VPS SERVICE] VPS provisioned email sent to:', user.email)
      } catch (error) {
        console.error('[VPS SERVICE] Failed to send VPS provisioned email:', error)
      }
    }

    return this.sanitizeVps(vps)
  }

  /**
   * Update VPS instance details
   */
  async updateVpsInstance(id: string, data: Partial<CreateVPSData>): Promise<VPSInfo> {
    const vps = await prisma.vpsInstance.findUnique({
      where: { id },
    })

    if (!vps) {
      throw NotFoundError('VPS instance not found')
    }

    // If updating root password, encrypt it
    let updateData: any = {}
    if (data.rootPassword) {
      updateData.rootPasswordEncrypted = encryptVpsPassword(data.rootPassword)
    }
    if (data.ipAddress) {
      updateData.ipAddress = data.ipAddress
    }
    if (data.displayName) {
      updateData.displayName = data.displayName
    }
    if (data.region) {
      updateData.region = data.region
    }
    if (data.contaboInstanceId) {
      updateData.contaboInstanceId = BigInt(data.contaboInstanceId)
    }

    const updated = await prisma.vpsInstance.update({
      where: { id },
      data: updateData,
      include: {
        product: true,
      },
    })

    return this.sanitizeVps(updated)
  }

  /**
   * Suspend VPS instance (admin only)
   * Sends shutdown command to provider and marks as SUSPENDED
   */
  async suspendVpsInstance(id: string, reason: 'PAYMENT_ISSUE' | 'ADMIN_ACTION' | 'EXPIRED' = 'ADMIN_ACTION'): Promise<void> {
    const vps = await prisma.vpsInstance.findUnique({
      where: { id },
    })

    if (!vps) {
      throw NotFoundError('VPS instance not found')
    }

    // Send shutdown command to provider API if instance is running/active
    if (vps.contaboInstanceId && ['RUNNING', 'STOPPED', 'PROVISIONING'].includes(vps.status)) {
      try {
        await contaboService.shutdownInstance(vps.contaboInstanceId.toString())
      } catch (error) {
        console.error('Failed to shutdown instance:', error)
        // Continue with suspension even if shutdown fails
      }
    }

    // Mark as suspended with reason
    await prisma.vpsInstance.update({
      where: { id },
      data: {
        status: 'SUSPENDED',
        suspendedAt: new Date(),
        suspensionReason: reason,
      },
    })
  }

  /**
   * Mark VPS instance as terminated (admin only)
   * This is final deletion, should only be done after actual deletion from provider
   */
  async terminateVpsInstance(id: string): Promise<void> {
    const vps = await prisma.vpsInstance.findUnique({
      where: { id },
    })

    if (!vps) {
      throw NotFoundError('VPS instance not found')
    }

    // Mark as terminated (keeps history but blocks all actions)
    await prisma.vpsInstance.update({
      where: { id },
      data: {
        status: 'TERMINATED',
        suspendedAt: new Date(),
        suspensionReason: 'ADMIN_ACTION',
      },
    })
  }

  /**
   * Restore/reactivate a suspended VPS instance (admin only)
   * Clears suspension status and optionally starts the instance
   */
  async restoreVpsInstance(id: string, autoStart: boolean = false): Promise<VPSInfo> {
    const vps = await prisma.vpsInstance.findUnique({
      where: { id },
    })

    if (!vps) {
      throw NotFoundError('VPS instance not found')
    }

    if (vps.status !== 'SUSPENDED' && vps.status !== 'EXPIRED') {
      throw BadRequestError('Only suspended or expired instances can be restored')
    }

    // Determine new status
    let newStatus: VpsStatus = 'STOPPED'
    if (autoStart && vps.contaboInstanceId) {
      try {
        // Try to start the instance via provider API
        await contaboService.startInstance(vps.contaboInstanceId.toString())
        newStatus = 'RUNNING'
      } catch (error) {
        console.error('Failed to start instance:', error)
        // Continue with restoration even if start fails
      }
    }

    // Clear suspension and update status
    const restored = await prisma.vpsInstance.update({
      where: { id },
      data: {
        status: newStatus,
        suspendedAt: null,
        suspensionReason: null,
      },
      include: {
        product: true,
      },
    })

    return this.sanitizeVps(restored)
  }

  /**
   * Update suspension details manually (admin only)
   * Allows admin to set custom expiration dates or suspension periods
   */
  async updateSuspensionDetails(
    id: string,
    data: {
      expiresAt?: Date
      autoRenew?: boolean
      status?: VpsStatus
    }
  ): Promise<VPSInfo> {
    const vps = await prisma.vpsInstance.findUnique({
      where: { id },
    })

    if (!vps) {
      throw NotFoundError('VPS instance not found')
    }

    const updated = await prisma.vpsInstance.update({
      where: { id },
      data: {
        ...(data.expiresAt && { expiresAt: data.expiresAt }),
        ...(data.autoRenew !== undefined && { autoRenew: data.autoRenew }),
        ...(data.status && { status: data.status }),
      },
      include: {
        product: true,
      },
    })

    return this.sanitizeVps(updated)
  }

  // ==================== VPS Actions (proxied to Contabo) ====================

  /**
   * Start VPS
   */
  async startVps(vpsId: string, userId: string): Promise<{ requestId: string }> {
    const vps = await this.getVpsById(vpsId)

    // Verify ownership
    if (vps.userId !== userId) {
      throw ForbiddenError('You do not own this VPS')
    }

    if (!vps.contaboInstanceId) {
      throw BadRequestError('VPS not provisioned yet')
    }

    // Execute action - convert BigInt to string
    const result = await contaboService.startInstance(vps.contaboInstanceId.toString())

    // Record action
    await this.recordAction(vpsId, VpsActionType.START, userId, result.requestId)

    // Update VPS status
    await prisma.vpsInstance.update({
      where: { id: vpsId },
      data: { status: VpsStatus.RUNNING },
    })

    return { requestId: result.requestId }
  }

  /**
   * Stop VPS
   */
  async stopVps(vpsId: string, userId: string): Promise<{ requestId: string }> {
    const vps = await this.getVpsById(vpsId)

    if (vps.userId !== userId) {
      throw ForbiddenError('You do not own this VPS')
    }

    if (!vps.contaboInstanceId) {
      throw BadRequestError('VPS not provisioned yet')
    }

    const result = await contaboService.stopInstance(vps.contaboInstanceId.toString())

    await this.recordAction(vpsId, VpsActionType.STOP, userId, result.requestId)

    await prisma.vpsInstance.update({
      where: { id: vpsId },
      data: { status: VpsStatus.STOPPED },
    })

    return { requestId: result.requestId }
  }

  /**
   * Restart VPS
   */
  async restartVps(vpsId: string, userId: string): Promise<{ requestId: string }> {
    const vps = await this.getVpsById(vpsId)

    if (vps.userId !== userId) {
      throw ForbiddenError('You do not own this VPS')
    }

    if (!vps.contaboInstanceId) {
      throw BadRequestError('VPS not provisioned yet')
    }

    const result = await contaboService.restartInstance(vps.contaboInstanceId.toString())

    await this.recordAction(vpsId, VpsActionType.RESTART, userId, result.requestId)

    await prisma.vpsInstance.update({
      where: { id: vpsId },
      data: { status: VpsStatus.RUNNING },
    })

    return { requestId: result.requestId }
  }

  /**
   * Shutdown VPS (ACPI)
   */
  async shutdownVps(vpsId: string, userId: string): Promise<{ requestId: string }> {
    const vps = await this.getVpsById(vpsId)

    if (vps.userId !== userId) {
      throw ForbiddenError('You do not own this VPS')
    }

    if (!vps.contaboInstanceId) {
      throw BadRequestError('VPS not provisioned yet')
    }

    const result = await contaboService.shutdownInstance(vps.contaboInstanceId.toString())

    await this.recordAction(vpsId, VpsActionType.SHUTDOWN, userId, result.requestId)

    await prisma.vpsInstance.update({
      where: { id: vpsId },
      data: { status: VpsStatus.STOPPED },
    })

    return { requestId: result.requestId }
  }

  /**
   * Boot into rescue mode
   */
  async rescueVps(vpsId: string, userId: string): Promise<{ requestId: string }> {
    const vps = await this.getVpsById(vpsId)

    if (vps.userId !== userId) {
      throw ForbiddenError('You do not own this VPS')
    }

    if (!vps.contaboInstanceId) {
      throw BadRequestError('VPS not provisioned yet')
    }

    const result = await contaboService.rescueMode(vps.contaboInstanceId.toString())

    await this.recordAction(vpsId, VpsActionType.RESCUE, userId, result.requestId)

    return { requestId: result.requestId }
  }

  /**
   * Reset root password
   */
  async resetPassword(vpsId: string, userId: string): Promise<{ password: string }> {
    const vps = await this.getVpsById(vpsId)

    if (vps.userId !== userId) {
      throw ForbiddenError('You do not own this VPS')
    }

    if (!vps.contaboInstanceId) {
      throw BadRequestError('VPS not provisioned yet')
    }

    // Get new password from Contabo
    const result = await contaboService.resetPassword(vps.contaboInstanceId.toString())

    // Encrypt and store new password
    const encryptedPassword = encryptVpsPassword(result.password)

    await prisma.vpsInstance.update({
      where: { id: vpsId },
      data: { rootPasswordEncrypted: encryptedPassword },
    })

    await this.recordAction(vpsId, VpsActionType.RESET_PASSWORD, userId, null)

    return { password: result.password }
  }

  /**
   * Get decrypted root password (show once)
   */
  async getRootPassword(vpsId: string, userId: string): Promise<{ password: string }> {
    const vps = await this.getVpsById(vpsId)

    if (vps.userId !== userId) {
      throw ForbiddenError('You do not own this VPS')
    }

    if (!vps.rootPasswordEncrypted) {
      throw NotFoundError('Root password not available')
    }

    const password = decryptVpsPassword(vps.rootPasswordEncrypted)

    return { password }
  }

  /**
   * Get action history for a VPS
   */
  async getActionHistory(vpsId: string): Promise<VpsActionHistory[]> {
    const actions = await prisma.vpsAction.findMany({
      where: { vpsInstanceId: vpsId },
      orderBy: { requestedAt: 'desc' },
    })

    return actions.map((a) => ({
      id: a.id,
      vpsInstanceId: a.vpsInstanceId,
      actionType: a.actionType,
      status: a.status,
      errorMessage: a.errorMessage,
      requestedAt: a.requestedAt,
      completedAt: a.completedAt,
    }))
  }

  /**
   * Record a VPS action
   */
  private async recordAction(
    vpsId: string,
    actionType: VpsActionType,
    _userId: string,
    _requestId: string | null
  ): Promise<void> {
    await prisma.vpsAction.create({
      data: {
        vpsInstanceId: vpsId,
        actionType,
        status: 'PENDING',
      },
    })
  }

  /**
   * Get VPS statistics for admin
   */
  async getVpsStatistics(): Promise<{
    total: number
    byStatus: Record<string, number>
    expiringSoon: number
  }> {
    const [total, byStatus] = await Promise.all([
      prisma.vpsInstance.count(),
      prisma.vpsInstance.groupBy({
        by: ['status'],
        _count: true,
      }),
    ])

    // Count VPS expiring in next 7 days
    const weekFromNow = new Date()
    weekFromNow.setDate(weekFromNow.getDate() + 7)

    const expiringSoon = await prisma.vpsInstance.count({
      where: {
        expiresAt: {
          lte: weekFromNow,
          gte: new Date(),
        },
        status: { notIn: ['EXPIRED', 'TERMINATED', 'SUSPENDED'] },
      },
    })

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count
        return acc
      }, {} as Record<string, number>),
      expiringSoon,
    }
  }

  /**
   * Remove sensitive data from VPS object (password is encrypted)
   */
  private sanitizeVps(vps: any): VPSInfo {
    const sanitized: any = {
      id: vps.id,
      userId: vps.userId,
      orderId: vps.orderId,
      contaboInstanceId: vps.contaboInstanceId?.toString() || null,
      status: vps.status,
      ipAddress: vps.ipAddress,
      displayName: vps.displayName,
      region: vps.region,
      rootPasswordEncrypted: null, // Never return password in list views
      expiresAt: vps.expiresAt,
      createdAt: vps.createdAt,
      updatedAt: vps.updatedAt,
      suspendedAt: vps.suspendedAt,
      suspensionReason: vps.suspensionReason,
      name: vps.name,
      netmaskCidr: vps.netmaskCidr,
      ...(vps.product && { product: vps.product }),
      ...(vps.user && { user: vps.user }),
    }

    // Add specs computed from product for frontend compatibility
    if (vps.product) {
      sanitized.specs = {
        cpuCores: vps.product.cpuCores,
        ramGB: Math.round(vps.product.ramMb / 1024),
        diskGB: vps.product.diskGb,
        diskType: vps.product.diskType,
      }
    }

    return sanitized
  }
}

export const vpsService = new VpsService()
