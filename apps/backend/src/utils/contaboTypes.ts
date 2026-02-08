/**
 * Contabo API Types
 */

export interface ContaboTokenResponse {
  access_token: string
  expires_in: number
  refresh_expires_in: number
  refresh_token: string
  token_type: string
  session_state: string
  scope: string
}

export interface ContaboInstance {
  tenantId?: string
  customerId?: string
  instanceId: string
  name?: string
  displayName: string
  description?: string
  status: string
  productId: string
  productName?: string
  imageName?: string
  imageId?: string
  sshPublicKeyIds?: string[]
  rootPassword?: string
  sshPasswordEnabled?: boolean
  // Actual Contabo API structure - specs are directly on instance, not nested
  cpuCores: number
  ramMb: number
  diskMb: number
  // Legacy compatibility
  configuration?: {
    cpu: number
    ram: number
    disk: number
  }
  dataCenter?: string
  region: string
  regionName?: string
  availabilityZone?: string
  ipConfig?: {
    v4?: { ip?: string; gateway?: string }
    v6?: { ip?: string; gateway?: string }
  }
  macAddress?: string
  privateNetworkIds?: string[]
  defaultUser?: string
  monthlyPrice: number
  contractPeriod: number
  nextBillingDate?: string
  cancelDate?: string
  creationDate: string
  updateDate: string
  createdDate?: string
}

export interface ContaboInstanceResponse {
  data: ContaboInstance[]
  pages: number
  currentPage: number
  pageSize: number
  totalCount: number
}

export interface ContaboActionResponse {
  data: {
    requestId: string
    status: string
  }
}

export interface ContaboSnapshot {
  snapshotId: string
  instanceId: string
  name: string
  description?: string
  size?: number
  createdDate: string
  status: string
}

export interface ContaboSnapshotResponse {
  data: ContaboSnapshot[]
  pages: number
  currentPage: number
  pageSize: number
  totalCount: number
}

export interface ContaboImage {
  imageId: string
  name: string
  description?: string
  osType: string
  osVersion: string
  defaultUser?: string
  minDisk?: number
  size?: number
  status: string
}

export interface ContaboImageResponse {
  data: ContaboImage[]
  pages: number
  currentPage: number
  pageSize: number
  totalCount: number
}

export interface ContaboErrorResponse {
  error: string
  error_description?: string
  message?: string
  details?: any
}

// VPS Action types
export type VpsAction = 'start' | 'stop' | 'restart' | 'shutdown' | 'rescue' | 'resetPassword'

export interface VpsActionResult {
  requestId: string
  status: string
}
