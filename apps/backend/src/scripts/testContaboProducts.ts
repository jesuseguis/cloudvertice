import { contaboService } from '../services/contaboService'

async function testContaboProducts() {
  console.log('=== Probando endpoints de Contabo para productos ===\n')

  try {
    // Test 1: Try /compute/products endpoint
    console.log('1. Probando /compute/products...')
    try {
      const products1 = await (contaboService as any).getProducts()
      console.log('   ✅ /compute/products funciona:')
      console.log('   ', JSON.stringify(products1, null, 2))
    } catch (error: any) {
      console.log('   ❌ /compute/products falló:', error.message || error)
    }

    // Test 2: Try listing instances and extracting products
    console.log('\n2. Probando extraer productos desde instancias...')
    try {
      const productsFromInstances = await (contaboService as any).getProductsFromInstances()
      console.log(`   ✅ Encontrados ${productsFromInstances.length} productos únicos en instancias:`)
      console.log('   ', JSON.stringify(productsFromInstances, null, 2))
    } catch (error: any) {
      console.log('   ❌ Error al extraer productos:', error.message || error)
    }

    // Test 3: List all instances to see what products are being used
    console.log('\n3. Listando todas las instancias...')
    try {
      const instances = await contaboService.listInstances()
      console.log(`   ✅ ${instances.length} instancias encontradas`)

      // Group by product ID
      const productGroups = new Map<string, number>()
      for (const instance of instances) {
        const count = productGroups.get(instance.productId) || 0
        productGroups.set(instance.productId, count + 1)
      }

      console.log('   Productos encontrados en instancias:')
      for (const [productId, count] of productGroups.entries()) {
        console.log(`   - ${productId}: ${count} instancia(s)`)
      }

      // Show details of first instance of each product
      console.log('\n   Detalles de instancias por producto:')
      const seenProducts = new Set<string>()
      for (const instance of instances) {
        if (!seenProducts.has(instance.productId)) {
          seenProducts.add(instance.productId)
          console.log(`   \n${instance.productId}:`)
          console.log('   ', {
            productId: instance.productId,
            productName: instance.productName,
            cpuCores: instance.cpuCores,
            ramMb: instance.ramMb,
            diskMb: instance.diskMb,
            region: instance.region,
            monthlyPrice: instance.monthlyPrice,
          })
        }
      }
    } catch (error: any) {
      console.log('   ❌ Error al listar instancias:', error.message || error)
    }

  } catch (error: any) {
    console.error('Error en prueba:', error)
  }
}

testContaboProducts()
  .then(() => {
    console.log('\n=== Prueba completada ===')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
