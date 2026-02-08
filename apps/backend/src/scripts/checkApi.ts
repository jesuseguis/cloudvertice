import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkApi() {
  console.log('=== Verificación de API ===\n')

  // Verificar si las tablas existen
  try {
    const regionCount = await prisma.region.count()
    console.log('✅ Tabla "regions" existe')
    console.log(`   Registros: ${regionCount}`)
  } catch {
    console.log('❌ Tabla "regions" NO existe - Ejecuta: npx prisma migrate dev')
  }

  try {
    const osCount = await prisma.operatingSystem.count()
    console.log('✅ Tabla "operating_systems" existe')
    console.log(`   Registros: ${osCount}`)
  } catch {
    console.log('❌ Tabla "operating_systems" NO existe - Ejecuta: npx prisma migrate dev')
  }

  // Verificar si hay datos de prueba
  try {
    const regions = await prisma.region.findMany()
    console.log('\n=== Regiones en BD ===')
    if (regions.length === 0) {
      console.log('   No hay regiones. Crea una desde /admin/regions/new')
    } else {
      console.log(JSON.stringify(regions, null, 2))
    }
  } catch (error) {
    console.log('   No se puede verificar regiones (tabla no existe)')
  }

  try {
    const operatingSystems = await prisma.operatingSystem.findMany()
    console.log('\n=== Sistemas Operativos en BD ===')
    if (operatingSystems.length === 0) {
      console.log('   No hay sistemas operativos. Sincroniza desde el botón o crea uno manualmente')
    } else {
      console.log(JSON.stringify(operatingSystems, null, 2))
    }
  } catch (error) {
    console.log('   No se puede verificar sistemas operativos (tabla no existe)')
  }

  // Verificar endpoints disponibles
  console.log('\n=== Endpoints Disponibles ===')
  console.log('GET  /api/regions - Listar regiones')
  console.log('POST /api/regions - Crear región')
  console.log('PUT  /api/regions/:id - Editar región')
  console.log('PATCH /api/regions/:id/toggle - Activar/desactivar región')
  console.log('')
  console.log('GET  /api/operating-systems - Listar sistemas operativos')
  console.log('POST /api/operating-systems - Crear sistema operativo')
  console.log('PUT  /api/operating-systems/:id - Editar sistema operativo')
  console.log('PATCH /api/operating-systems/:id/price - Editar precio')
  console.log('PATCH /api/operating-systems/:id/toggle - Activar/desactivar')
  console.log('POST /api/operating-systems/sync - Sincronizar desde Contabo')

  console.log('\n=== Pasos para Solucionar ===')
  console.log('1. Asegúrate de tener PostgreSQL corriendo')
  console.log('2. Aplica las migraciones:')
  console.log('   cd apps/backend')
  console.log('   npx prisma migrate dev')
  console.log('3. Reinicia el servidor backend')
  console.log('4. Accede a: http://localhost:3000/admin/operating-systems')

  await prisma.$disconnect()
}

checkApi().catch(console.error)
