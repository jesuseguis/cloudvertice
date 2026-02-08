import { contaboService } from '../services/contaboService'

async function checkContaboEndpoints() {
  console.log('=== Verificando endpoints de Contabo ===\n')

  // Try to get instances and extract unique regions
  console.log('1. Obteniendo regiones desde instancias...')
  try {
    const instances = await contaboService.listInstances()
    const uniqueRegions = new Set<string>()
    for (const instance of instances) {
      uniqueRegions.add(instance.region)
    }
    console.log('   Regiones encontradas en instancias:', Array.from(uniqueRegions))
  } catch (error: any) {
    console.log('   Error:', error.message || error)
  }

  // Try regions endpoint
  console.log('\n2. Probando endpoint /regions...')
  try {
    const regions = await (contaboService as any).request('GET', '/regions')
    console.log('   ✅ /regions funciona:', JSON.stringify(regions, null, 2).substring(0, 500))
  } catch (error: any) {
    console.log('   ❌ /regions no existe:', error.message || 'Not found')
  }

  // Try compute/regions endpoint
  console.log('\n3. Probando endpoint /compute/regions...')
  try {
    const regions = await (contaboService as any).request('GET', '/compute/regions')
    console.log('   ✅ /compute/regions funciona:', JSON.stringify(regions, null, 2).substring(0, 500))
  } catch (error: any) {
    console.log('   ❌ /compute/regions no existe:', error.message || 'Not found')
  }

  // Check images response structure
  console.log('\n4. Verificando estructura de imágenes...')
  try {
    const images = await contaboService.getImages()
    console.log(`   ${images.length} imágenes encontradas`)
    console.log('   Ejemplo de imagen:', JSON.stringify(images[0], null, 2))
  } catch (error: any) {
    console.log('   Error:', error.message || error)
  }
}

checkContaboEndpoints()
  .then(() => {
    console.log('\n=== Completado ===')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
