import axios, { AxiosInstance } from 'axios'
import { BadRequestError } from '../middleware/errorHandler'
import type {
  ContaboTokenResponse,
  ContaboInstance,
  ContaboInstanceResponse,
  ContaboActionResponse,
  ContaboSnapshot,
  ContaboSnapshotResponse,
  ContaboImage,
  ContaboImageResponse,
  VpsActionResult,
} from '../utils/contaboTypes'

export class ContaboService {
  private readonly API_BASE = 'https://api.contabo.com/v1'
  private readonly AUTH_BASE = 'https://auth.contabo.com/auth/realms/contabo/protocol/openid-connect/token'

  private tokenCache: string | null = null
  private tokenExpiry: number = 0
  private axiosInstance: AxiosInstance

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: this.API_BASE,
      timeout: 30000,
    })
  }

  /**
   * Get OAuth2 access token
   */
  private async getToken(): Promise<string> {
    // Return cached token if still valid
    if (this.tokenCache && Date.now() < this.tokenExpiry) {
      return this.tokenCache
    }

    // Get credentials from environment
    const clientId = process.env.CONTABO_CLIENT_ID
    const clientSecret = process.env.CONTABO_CLIENT_SECRET
    const apiUser = process.env.CONTABO_API_USER
    const apiPassword = process.env.CONTABO_API_PASSWORD

    if (!clientId || !clientSecret || !apiUser || !apiPassword) {
      throw BadRequestError('Provider API credentials not configured')
    }

    try {
      const response = await axios.post<ContaboTokenResponse>(
        this.AUTH_BASE,
        new URLSearchParams({
          grant_type: 'password',
          client_id: clientId,
          client_secret: clientSecret,
          username: apiUser,
          password: apiPassword,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      const tokenData = response.data

      // Cache token (subtract 60 seconds for safety margin)
      this.tokenCache = tokenData.access_token
      this.tokenExpiry = Date.now() + (tokenData.expires_in - 60) * 1000

      return this.tokenCache
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Provide more specific error message
        let errorMessage = 'Failed to authenticate with Contabo API'
        if (error.response?.status === 401) {
          errorMessage = 'Invalid Contabo credentials. Please verify CLIENT_ID, CLIENT_SECRET, API_USER and API_PASSWORD in .env file.'
        } else if (error.response?.status === 400) {
          errorMessage = `Bad request to Contabo API: ${JSON.stringify(error.response?.data)}`
        } else if (error.response?.data?.error_description) {
          errorMessage = `Contabo auth error: ${error.response.data.error_description}`
        }
        throw BadRequestError(errorMessage)
      }
      throw BadRequestError('Failed to authenticate with provider API')
    }
  }

  /**
   * Make authenticated request to Contabo API with automatic token renewal on 401
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    params?: any,
    retryCount: number = 0
  ): Promise<T> {
    const token = await this.getToken()

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        'x-request-id': this.generateRequestId(),
      }

      // Only set Content-Type for requests with a body (POST, PUT, PATCH)
      if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        headers['Content-Type'] = 'application/json'
      }

      const response = await this.axiosInstance.request<T>({
        method,
        url: endpoint,
        data,
        params,
        headers,
      })

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const message = error.response?.data?.message || error.message

        // If we get a 401 (Unauthorized) and haven't retried yet, invalidate token and retry
        if (status === 401 && retryCount === 0) {
          this.invalidateToken()
          return this.request<T>(method, endpoint, data, params, retryCount + 1)
        }

        throw BadRequestError(`Provider API error: ${message}`)
      }
      throw error
    }
  }

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

  // ==================== Instances ====================

  /**
   * Get all instances
   */
  async listInstances(): Promise<ContaboInstance[]> {
    const response = await this.request<ContaboInstanceResponse>(
      'GET',
      '/compute/instances'
    )
    return response.data
  }

  /**
   * Get specific instance by ID
   */
  async getInstance(instanceId: string): Promise<ContaboInstance> {
    const response = await this.request<ContaboInstance>(
      'GET',
      `/compute/instances/${instanceId}`
    )
    return response
  }

  /**
   * Get instance details with full configuration
   */
  async getInstanceDetails(instanceId: string): Promise<ContaboInstance> {
    return this.getInstance(instanceId)
  }

  // ==================== Instance Actions ====================

  /**
   * Start instance
   */
  async startInstance(instanceId: string): Promise<VpsActionResult> {
    const response = await this.request<ContaboActionResponse>(
      'POST',
      `/compute/instances/${instanceId}/actions/start`,
      {}  // Empty body for Contabo API
    )
    return {
      requestId: response.data.requestId,
      status: response.data.status,
    }
  }

  /**
   * Stop instance
   */
  async stopInstance(instanceId: string): Promise<VpsActionResult> {
    const response = await this.request<ContaboActionResponse>(
      'POST',
      `/compute/instances/${instanceId}/actions/stop`,
      {}  // Empty body for Contabo API
    )
    return {
      requestId: response.data.requestId,
      status: response.data.status,
    }
  }

  /**
   * Restart instance
   */
  async restartInstance(instanceId: string): Promise<VpsActionResult> {
    const response = await this.request<ContaboActionResponse>(
      'POST',
      `/compute/instances/${instanceId}/actions/restart`,
      {}  // Empty body for Contabo API
    )
    return {
      requestId: response.data.requestId,
      status: response.data.status,
    }
  }

  /**
   * ACPI shutdown instance
   */
  async shutdownInstance(instanceId: string): Promise<VpsActionResult> {
    const response = await this.request<ContaboActionResponse>(
      'POST',
      `/compute/instances/${instanceId}/actions/shutdown`,
      {}  // Empty body for Contabo API
    )
    return {
      requestId: response.data.requestId,
      status: response.data.status,
    }
  }

  /**
   * Boot into rescue mode
   */
  async rescueMode(instanceId: string): Promise<VpsActionResult> {
    const response = await this.request<ContaboActionResponse>(
      'POST',
      `/compute/instances/${instanceId}/actions/rescue`,
      {}  // Empty body for Contabo API
    )
    return {
      requestId: response.data.requestId,
      status: response.data.status,
    }
  }

  /**
   * Reset root password
   */
  async resetPassword(instanceId: string): Promise<{ password: string }> {
    const response = await this.request<{ data: { rootPassword: string } }>(
      'POST',
      `/compute/instances/${instanceId}/actions/resetPassword`,
      {}  // Empty body for Contabo API
    )
    return {
      password: response.data.rootPassword,
    }
  }

  // ==================== Snapshots ====================

  /**
   * Get snapshots for an instance
   */
  async getSnapshots(instanceId: string): Promise<ContaboSnapshot[]> {
    const response = await this.request<ContaboSnapshotResponse>(
      'GET',
      `/compute/instances/${instanceId}/snapshots`
    )
    return response.data
  }

  /**
   * Create a snapshot
   */
  async createSnapshot(
    instanceId: string,
    name: string,
    description?: string
  ): Promise<ContaboSnapshot> {
    const response = await this.request<{ data: ContaboSnapshot }>(
      'POST',
      `/compute/instances/${instanceId}/snapshots`,
      { description: description || name, name }
    )
    return response.data
  }

  /**
   * Restore a snapshot
   */
  async restoreSnapshot(instanceId: string, snapshotId: string): Promise<VpsActionResult> {
    const response = await this.request<ContaboActionResponse>(
      'POST',
      `/compute/instances/${instanceId}/snapshots/${snapshotId}/restore`
    )
    return {
      requestId: response.data.requestId,
      status: response.data.status,
    }
  }

  /**
   * Delete a snapshot
   */
  async deleteSnapshot(instanceId: string, snapshotId: string): Promise<void> {
    await this.request<void>(
      'DELETE',
      `/compute/instances/${instanceId}/snapshots/${snapshotId}`
    )
  }

  // ==================== Images ====================

  /**
   * Get all available images
   */
  async getImages(): Promise<ContaboImage[]> {
    const response = await this.request<ContaboImageResponse>(
      'GET',
      '/compute/images'
    )
    return response.data
  }

  /**
   * Get specific image by ID
   */
  async getImage(imageId: string): Promise<ContaboImage> {
    const response = await this.request<ContaboImage>(
      'GET',
      `/compute/images/${imageId}`
    )
    return response
  }

  // ==================== Products ====================

  /**
   * Get all available products/instance types
   * This returns the available VPS/VDS plans that can be ordered
   */
  async getProducts(): Promise<any[]> {
    try {
      // Try the standard products endpoint
      const response = await this.request<any>(
        'GET',
        '/compute/products'
      )
      return response.data || response
    } catch (error) {
      // If that fails, try alternative endpoints
      try {
        const response = await this.request<any>(
          'GET',
          '/products'
        )
        return response.data || response
      } catch (error2) {
        // If both fail, return empty array - will fall back to static list
        console.error('Failed to fetch products from Contabo API:', error)
        return []
      }
    }
  }

  /**
   * Get instances and extract unique product types from them
   * This is a fallback method to determine available products
   */
  async getProductsFromInstances(): Promise<any[]> {
    const instances = await this.listInstances()

    // Extract unique product configurations from existing instances
    const productMap = new Map<string, any>()

    for (const instance of instances) {
      const key = `${instance.productId}-${instance.cpuCores}-${instance.ramMb}-${instance.diskMb}`
      if (!productMap.has(key)) {
        productMap.set(key, {
          productId: instance.productId,
          productName: instance.productName || instance.productId,
          cpuCores: instance.cpuCores,
          ramMb: instance.ramMb,
          diskMb: instance.diskMb,
          monthlyPrice: instance.monthlyPrice,
          region: instance.region,
        })
      }
    }

    return Array.from(productMap.values())
  }

  /**
   * Invalidate cached token (use after credential changes)
   */
  invalidateToken(): void {
    this.tokenCache = null
    this.tokenExpiry = 0
  }
}

export const contaboService = new ContaboService()
