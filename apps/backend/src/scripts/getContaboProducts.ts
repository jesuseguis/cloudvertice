import { contaboService } from '../services/contaboService'

// Mapping de especificaciones conocidas de Contabo
// Basado en la documentación pública de Contabo
const CONTABO_PRODUCT_SPECS: Record<string, {
  name: string
  ramMb: number
  cpuCores: number
  diskGb: number
  diskType: 'NVME' | 'SSD'
  regions: string[]
}> = {
  'V91': { name: 'VPS 10 NVMe', ramMb: 4096, cpuCores: 2, diskGb: 75, diskType: 'NVME', regions: ['EU-CENTRAL-1', 'US-EAST-1', 'AP-SOUTH-1', 'EU-WEST-1'] },
  'V92': { name: 'VPS 10 SSD', ramMb: 4096, cpuCores: 2, diskGb: 150, diskType: 'SSD', regions: ['EU-CENTRAL-1', 'US-EAST-1', 'AP-SOUTH-1', 'EU-WEST-1'] },
  'V94': { name: 'VPS 20 NVMe', ramMb: 8192, cpuCores: 4, diskGb: 100, diskType: 'NVME', regions: ['EU-CENTRAL-1', 'US-EAST-1', 'AP-SOUTH-1', 'EU-WEST-1'] },
  'V95': { name: 'VPS 20 SSD', ramMb: 8192, cpuCores: 4, diskGb: 200, diskType: 'SSD', regions: ['EU-CENTRAL-1', 'US-EAST-1', 'AP-SOUTH-1', 'EU-WEST-1'] },
  'V97': { name: 'VPS 30 NVMe', ramMb: 16384, cpuCores: 6, diskGb: 200, diskType: 'NVME', regions: ['EU-CENTRAL-1', 'US-EAST-1', 'AP-SOUTH-1', 'EU-WEST-1'] },
  'V98': { name: 'VPS 30 SSD', ramMb: 16384, cpuCores: 6, diskGb: 400, diskType: 'SSD', regions: ['EU-CENTRAL-1', 'US-EAST-1', 'AP-SOUTH-1', 'EU-WEST-1'] },
  'V8': { name: 'VDS S', ramMb: 24576, cpuCores: 4, diskGb: 180, diskType: 'NVME', regions: ['EU-CENTRAL-1', 'US-EAST-1'] },
  'V9': { name: 'VDS M', ramMb: 49152, cpuCores: 8, diskGb: 240, diskType: 'NVME', regions: ['EU-CENTRAL-1', 'US-EAST-1'] },
}

async function getContaboProducts() {
  console.log('=== Obteniendo productos desde Contabo API ===\n')

  try {
    // Get products from Contabo API
    console.log('1. Obteniendo lista de productos desde Contabo...')
    const products = await (contaboService as any).getProducts()

    // Filter only VPS/VDS products (itemId starts with V)
    const vpsProducts = products.filter((p: any) => p.priceItem?.itemId?.startsWith('V'))

    console.log(`   ✅ Encontrados ${vpsProducts.length} productos VPS/VDS`)

    // Get prices in USD
    const productMap = new Map<string, any>()

    for (const product of vpsProducts) {
      const itemId = product.priceItem?.itemId
      if (!itemId) continue

      // Find USD price
      const usdPrice = product.priceItem?.price?.find((p: any) => p.currency === 'USD')
      if (!usdPrice) continue

      // Get name from Contabo or use mapping
      const name = product.priceItem?.name || CONTABO_PRODUCT_SPECS[itemId]?.name || itemId

      // Get specs from mapping or default values
      const specs = CONTABO_PRODUCT_SPECS[itemId] || {
        name: itemId,
        ramMb: 0,
        cpuCores: 0,
        diskGb: 0,
        diskType: 'SSD' as const,
        regions: ['EU-CENTRAL-1'],
      }

      productMap.set(itemId, {
        contaboProductId: itemId,
        name: name,
        description: product.priceItem?.description || `${specs.name} - ${specs.ramMb / 1024}GB RAM, ${specs.cpuCores} vCPU, ${specs.diskGb}GB ${specs.diskType}`,
        ramMb: specs.ramMb,
        cpuCores: specs.cpuCores,
        diskGb: specs.diskGb,
        diskType: specs.diskType,
        regions: specs.regions,
        basePrice: usdPrice.amount,
        sellingPrice: Math.ceil(usdPrice.amount * 1.3 * 100) / 100, // 30% markup
        sortOrder: 0,
        isActive: true,
      })
    }

    // Sort by itemId
    const sortedProducts = Array.from(productMap.values()).sort((a, b) => a.contaboProductId.localeCompare(b.contaboProductId))

    console.log('\n2. Productos procesados:')
    console.log(JSON.stringify(sortedProducts, null, 2))

    console.log(`\n=== Total: ${sortedProducts.length} productos ===`)

    // Output as JSON for easy copy-paste
    console.log('\n=== JSON para copiar ===')
    console.log(JSON.stringify(sortedProducts, null, 2))

  } catch (error: any) {
    console.error('Error:', error.message || error)
  }
}

getContaboProducts()
  .then(() => {
    console.log('\n=== Completado ===')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
