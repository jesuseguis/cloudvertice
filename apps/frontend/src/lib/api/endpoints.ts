// API endpoint URLs

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
const API_BASE_NO_API = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000'

export const API_ENDPOINTS = {
  // Base URL
  base: API_BASE,

  // Auth endpoints
  auth: {
    login: `${API_BASE}/auth/login`,
    register: `${API_BASE}/auth/register`,
    refresh: `${API_BASE}/auth/refresh`,
    logout: `${API_BASE}/auth/logout`,
    me: `${API_BASE}/auth/me`,
    updateProfile: `${API_BASE}/auth/profile`,
    changePassword: `${API_BASE}/auth/change-password`,
  },

  // Client endpoints
  client: {
    vps: {
      list: `${API_BASE}/vps`,
      byId: (id: string) => `${API_BASE}/vps/${id}`,
      history: (id: string) => `${API_BASE}/vps/${id}/history`,
      password: (id: string) => `${API_BASE}/vps/${id}/password`,
      actions: (id: string, action: string) => `${API_BASE}/vps/${id}/${action}`,
      rescueMode: (id: string) => `${API_BASE}/vps/${id}/rescue`,
      resetPassword: (id: string) => `${API_BASE}/vps/${id}/reset-password`,
      snapshots: (id: string) => `${API_BASE}/vps/${id}/snapshots`,
      snapshotById: (id: string, snapId: string) => `${API_BASE}/vps/${id}/snapshots/${snapId}`,
      createSnapshot: (id: string) => `${API_BASE}/vps/${id}/snapshots`,
      restoreSnapshot: (id: string, snapshotId: string) => `${API_BASE}/vps/${id}/snapshots/${snapshotId}/restore`,
      deleteSnapshot: (id: string, snapshotId: string) => `${API_BASE}/vps/${id}/snapshots/${snapshotId}`,
      syncSnapshots: (id: string) => `${API_BASE}/vps/${id}/snapshots/sync`,
      snapshotStatistics: (id: string) => `${API_BASE}/vps/${id}/snapshots/statistics`,
    },
    orders: {
      list: `${API_BASE}/orders`,
      byId: (id: string) => `${API_BASE}/orders/${id}`,
      cancel: (id: string) => `${API_BASE}/orders/${id}/cancel`,
      create: `${API_BASE}/orders`,
    },
    invoices: {
      list: `${API_BASE}/invoices`,
      byId: (id: string) => `${API_BASE}/invoices/${id}`,
      downloadPdf: (id: string) => `${API_BASE}/invoices/${id}/pdf`,
      pay: (id: string) => `${API_BASE}/invoices/${id}/pay`,
    },
    tickets: {
      list: `${API_BASE}/tickets`,
      byId: (id: string) => `${API_BASE}/tickets/${id}`,
      categories: `${API_BASE}/tickets/categories`,
      create: `${API_BASE}/tickets`,
      addMessage: (id: string) => `${API_BASE}/tickets/${id}/messages`,
      close: (id: string) => `${API_BASE}/tickets/${id}/close`,
    },
  },

  // Admin endpoints
  admin: {
    metrics: `${API_BASE}/admin/dashboard`,
    analytics: `${API_BASE}/admin/analytics`,
    orders: {
      list: `${API_BASE}/orders/admin/all`,
      pending: `${API_BASE}/orders/admin/pending`,
      statistics: `${API_BASE}/orders/admin/statistics`,
      byId: (id: string) => `${API_BASE}/orders/${id}`,
      updateStatus: (id: string) => `${API_BASE}/orders/admin/${id}/status`,
      provision: (id: string) => `${API_BASE}/admin/orders/${id}/provision`,
      assign: (id: string) => `${API_BASE}/orders/admin/${id}/assign`,
    },
    products: {
      list: `${API_BASE}/products`,
      byId: (id: string) => `${API_BASE}/products/${id}`,
      price: (id: string) => `${API_BASE}/products/${id}/price`,
      create: `${API_BASE}/admin/products`,
      update: (id: string) => `${API_BASE}/admin/products/${id}`,
      delete: (id: string) => `${API_BASE}/admin/products/${id}`,
      custom: `${API_BASE}/admin/products/custom`,
      sync: `${API_BASE}/products/sync`,
    },
    regions: {
      list: `${API_BASE}/regions`,
      byId: (id: string) => `${API_BASE}/regions/${id}`,
      byCode: (code: string) => `${API_BASE}/regions/code/${code}`,
      create: `${API_BASE}/regions`,
      update: (id: string) => `${API_BASE}/regions/${id}`,
      delete: (id: string) => `${API_BASE}/regions/${id}`,
      toggleActive: (id: string) => `${API_BASE}/regions/${id}/toggle`,
      sync: `${API_BASE}/regions/sync`,
    },
    operatingSystems: {
      list: `${API_BASE}/operating-systems`,
      byId: (id: string) => `${API_BASE}/operating-systems/${id}`,
      byImageId: (imageId: string) => `${API_BASE}/operating-systems/image/${imageId}`,
      create: `${API_BASE}/operating-systems`,
      update: (id: string) => `${API_BASE}/operating-systems/${id}`,
      delete: (id: string) => `${API_BASE}/operating-systems/${id}`,
      updatePrice: (id: string) => `${API_BASE}/operating-systems/${id}/price`,
      toggleActive: (id: string) => `${API_BASE}/operating-systems/${id}/toggle`,
      sync: `${API_BASE}/operating-systems/sync`,
    },
    users: {
      list: `${API_BASE}/users/admin/all`,
      statistics: `${API_BASE}/users/admin/statistics`,
      byId: (id: string) => `${API_BASE}/users/admin/${id}`,
      update: (id: string) => `${API_BASE}/users/admin/${id}`,
    },
    vps: {
      list: `${API_BASE}/vps/admin/all`,
      statistics: `${API_BASE}/vps/statistics`,
      byId: (id: string) => `${API_BASE}/vps/${id}`,
      suspend: (id: string) => `${API_BASE}/vps/admin/${id}/suspend`,
      restore: (id: string) => `${API_BASE}/vps/admin/${id}/restore`,
      updateSuspension: (id: string) => `${API_BASE}/vps/admin/${id}/suspension`,
      sync: (id: string) => `${API_BASE}/vps/${id}/sync`,
    },
    tickets: {
      list: `${API_BASE}/tickets/admin/all`,
      statistics: `${API_BASE}/tickets/admin/statistics`,
      byId: (id: string) => `${API_BASE}/tickets/${id}`,
      update: (id: string) => `${API_BASE}/tickets/admin/${id}`,
    },
    invoices: {
      list: `${API_BASE}/invoices/admin/all`,
      statistics: `${API_BASE}/invoices/admin/statistics`,
      overdue: `${API_BASE}/invoices/admin/overdue`,
      create: `${API_BASE}/invoices/admin`,
      updateStatus: (id: string) => `${API_BASE}/invoices/admin/${id}/status`,
    },
    alerts: `${API_BASE}/admin/alerts`,
    activity: `${API_BASE}/admin/activity`,
    contaboInstances: `${API_BASE}/admin/contabo/instances`,
    contaboInstancesAvailable: `${API_BASE}/admin/contabo/instances/available`,
    images: `${API_BASE}/images`, // Asumo endpoint de imágenes
    syncImages: `${API_BASE}/images/sync`, // Asumo endpoint de sync
  },

  // Public endpoints
  public: {
    products: `${API_BASE}/products`,
    productsFeatured: `${API_BASE}/products/featured`,
    images: `${API_BASE}/images`,
    regions: `${API_BASE}/regions`,
    config: `${API_BASE_NO_API}/health/config`,
  },

  // Payments endpoints
  payments: {
    createIntent: `${API_BASE}/payments/create-intent`,
    confirm: `${API_BASE}/payments/confirm`,
    getIntent: (intentId: string) => `${API_BASE}/payments/intent/${intentId}`,
    getByOrder: (orderId: string) => `${API_BASE}/payments/order/${orderId}`,
    transactions: `${API_BASE}/payments/transactions`,
    refund: (transactionId: string) => `${API_BASE}/payments/admin/refund/${transactionId}`,
  },
} as const
