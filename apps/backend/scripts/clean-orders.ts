/**
 * Script to clean all orders and VPS instances from the database
 *
 * Run with: npm run clean-orders
 * Or directly: npx tsx scripts/clean-orders.ts
 *
 * WARNING: This will DELETE all orders, VPS instances, and related data!
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanOrdersAndVPS() {
  console.log('🗑️  Starting cleanup of orders and VPS instances...')
  console.log('')

  try {
    // Count records before deletion
    const ordersCount = await prisma.order.count()
    const vpsCount = await prisma.vpsInstance.count()
    const snapshotsCount = await prisma.snapshot.count()
    const transactionsCount = await prisma.transaction.count()
    const invoicesCount = await prisma.invoice.count()

    console.log('📊 Current records:')
    console.log(`   - Orders: ${ordersCount}`)
    console.log(`   - VPS Instances: ${vpsCount}`)
    console.log(`   - Snapshots: ${snapshotsCount}`)
    console.log(`   - Transactions: ${transactionsCount}`)
    console.log(`   - Invoices: ${invoicesCount}`)
    console.log('')

    if (ordersCount === 0 && vpsCount === 0) {
      console.log('✅ No records to delete. Database is already clean.')
      return
    }

    // Confirm deletion
    console.log('⚠️  WARNING: This will permanently delete all the above records!')
    console.log('👉 Press Ctrl+C to cancel, or wait 5 seconds to continue...')

    await new Promise(resolve => setTimeout(resolve, 5000))
    console.log('')
    console.log('🚀 Proceeding with deletion...')
    console.log('')

    // Delete in correct order due to foreign key constraints
    // 1. Delete snapshots (depend on vps instances)
    const deletedSnapshots = await prisma.snapshot.deleteMany({})
    console.log(`   ✅ Deleted ${deletedSnapshots.count} snapshots`)

    // 2. Delete transactions (depend on orders)
    const deletedTransactions = await prisma.transaction.deleteMany({})
    console.log(`   ✅ Deleted ${deletedTransactions.count} transactions`)

    // 3. Delete invoices (depend on orders)
    const deletedInvoices = await prisma.invoice.deleteMany({})
    console.log(`   ✅ Deleted ${deletedInvoices.count} invoices`)

    // 4. Delete VPS instances
    const deletedVps = await prisma.vpsInstance.deleteMany({})
    console.log(`   ✅ Deleted ${deletedVps.count} VPS instances`)

    // 5. Delete orders
    const deletedOrders = await prisma.order.deleteMany({})
    console.log(`   ✅ Deleted ${deletedOrders.count} orders`)

    console.log('')
    console.log('✨ Cleanup completed successfully!')
    console.log('')
    console.log('📊 Deletion summary:')
    console.log(`   - Orders deleted: ${deletedOrders.count}`)
    console.log(`   - VPS instances deleted: ${deletedVps.count}`)
    console.log(`   - Snapshots deleted: ${deletedSnapshots.count}`)
    console.log(`   - Transactions deleted: ${deletedTransactions.count}`)
    console.log(`   - Invoices deleted: ${deletedInvoices.count}`)

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the cleanup
cleanOrdersAndVPS()
  .then(() => {
    console.log('')
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
