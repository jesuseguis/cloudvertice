// VPS instance types

import type { Product } from './product'

export type VPSStatus = 'PENDING' | 'PROVISIONING' | 'RUNNING' | 'STOPPED' | 'SUSPENDED' | 'TERMINATED' | 'EXPIRED'

export type VPSAction = 'start' | 'stop' | 'restart' | 'shutdown' | 'rescue' | 'reset-password'

// Backend VPS response structure (from Prisma)
export interface VPSInstance {
  id: string
  userId: string
  orderId: string | null
  contaboInstanceId: string | null
  name: string
  displayName: string | null
  status: VPSStatus
  ipAddress: string | null
  region: string
  rootPasswordEncrypted: string | null
  rootPassword?: string | null
  nextBillingDate?: string | null
  imageName?: string | null
  description?: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
  suspendedAt: string | null
  suspensionReason: string | null
  netmaskCidr: number | null
  product?: Product
  user?: VPSUser
  image?: VPSImage
  specs?: VPSSpecs
}

// User nested in VPS (admin view)
export interface VPSUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
}

// Image nested in VPS
export interface VPSImage {
  id: string
  contaboImageId: string
  name: string
  description: string | null
  osType: string
  osVersion: string | null
}

// Legacy specs interface (computed from product)
export interface VPSSpecs {
  cpuCores: number
  ramGB: number
  diskGB: number
  diskType: 'NVMe' | 'SSD'
}

export interface VPSMetrics {
  cpuPercent: number
  ramPercent: number
  diskPercent: number
  networkIn?: number
  networkOut?: number
}

export interface VPSActionResponse {
  success: boolean
  message: string
  action: VPSAction
  status?: VPSStatus
}

export interface Snapshot {
  id: string
  vpsInstanceId: string
  name: string
  description: string | null
  sizeMb: number | null
  createdAt: string
}

export interface CreateSnapshotRequest {
  name: string
  description?: string
}

export interface ResetPasswordRequest {
  newPassword: string
}

export interface RescueModeRequest {
  enable: boolean
}
