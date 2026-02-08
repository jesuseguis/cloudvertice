/**
 * Script to fix existing price rules to use sellingPrice instead of basePrice
 *
 * Run with: npm run fix-price-rules
 * Or directly: npx ts-node scripts/fix-price-rules.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixPriceRules() {
  console.log('🔧 Starting price rules fix...')
  console.log('')

  let updatedCount = 0
  let errorCount = 0

  try {
    // Get all products with their price rules
    const products = await prisma.product.findMany({
      include: {
        priceRules: true,
      },
    })

    console.log(`📦 Found ${products.length} products`)

    for (const product of products) {
      if (product.priceRules.length === 0) {
        console.log(`  ⏭️  Skipping ${product.name} (${product.contaboProductId}) - no price rules`)
        continue
      }

      console.log(`  🔍 Processing ${product.name} (${product.contaboProductId})`)
      console.log(`     - basePrice (cost): $${product.basePrice}`)
      console.log(`     - sellingPrice: $${product.sellingPrice}`)

      for (const rule of product.priceRules) {
        // Recalculate using sellingPrice instead of basePrice
        const sellingPrice = Number(product.sellingPrice)
        const monthlyPrice = sellingPrice * rule.periodMonths
        const discountAmount = monthlyPrice * (rule.discountPercent / 100)
        const newFinalPrice = monthlyPrice - discountAmount

        const oldFinalPrice = Number(rule.finalPrice)

        console.log(`     - Rule: ${rule.periodMonths} months (${rule.discountPercent}% discount)`)
        console.log(`       Old finalPrice: $${oldFinalPrice.toFixed(2)}`)
        console.log(`       New finalPrice: $${newFinalPrice.toFixed(2)}`)

        if (Math.abs(oldFinalPrice - newFinalPrice) > 0.01) {
          // Update the price rule
          await prisma.priceRule.update({
            where: {
              id: rule.id,
            },
            data: {
              finalPrice: newFinalPrice,
            },
          })
          console.log(`       ✅ Updated (difference: $${(newFinalPrice - oldFinalPrice).toFixed(2)})`)
          updatedCount++
        } else {
          console.log(`       ℹ️  No change needed`)
        }
      }
    }

    console.log('')
    console.log('✨ Fix completed!')
    console.log(`📊 Summary:`)
    console.log(`   - Price rules updated: ${updatedCount}`)
    console.log(`   - Errors: ${errorCount}`)
  } catch (error) {
    console.error('❌ Error fixing price rules:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the fix
fixPriceRules()
  .then(() => {
    console.log('')
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
