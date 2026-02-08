// Product and pricing types

export type ProductStatus = 'active' | 'inactive' | 'draft'

export type DiskType = 'NVMe' | 'SSD' | 'HDD'

export type ProductType = 'STANDARD' | 'CUSTOM'

export interface Product {
  id: string
  name: string
  description: string | null
  contaboProductId: string
  ramMb: number
  cpuCores: number
  diskGb: number
  diskType: DiskType
  regions: string[]
  productType: ProductType
  contactEmail: string | null
  basePrice: number
  sellingPrice: number
  sortOrder: number
  isActive: boolean
  showOnHome: boolean
  homeOrder: number
  isRecommended: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductSpecs {
  cpuCores: number
  ramGB: number
  ramMb: number
  diskGB: number
  diskGb: number
  diskType: 'NVMe' | 'SSD'
  networkSpeed?: string
  traffic?: string
}

export interface ProductPricing {
  baseCost: number // Cost from Contabo
  margin: number // Margin amount
  marginPercent: number
  prices: {
    monthly: number
    quarterly: number
    semiannual: number
    annual: number
  }
  currency: string
}

export interface CreateProductRequest {
  name: string
  description?: string
  contaboProductId: string
  ramMb: number
  cpuCores: number
  diskGb: number
  diskType: DiskType
  regions: string[]
  productType?: ProductType
  contactEmail?: string
  basePrice: number
  sellingPrice: number
  sortOrder?: number
  isActive?: boolean
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  status?: ProductStatus
}

export interface Image {
  id: string
  name: string
  description: string
  osType: 'linux' | 'windows'
  version: string
  minDiskGB: number
  createdAt: string
}
