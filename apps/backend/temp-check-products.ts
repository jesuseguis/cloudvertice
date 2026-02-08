import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      showOnHome: true,
      homeOrder: true,
      isRecommended: true,
    },
    take: 5,
  })

  console.log('Productos:')
  console.table(products)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
