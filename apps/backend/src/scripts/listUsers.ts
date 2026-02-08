import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function listUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      emailVerified: true,
      firstName: true,
      lastName: true,
      createdAt: true,
    },
  })

  console.log('=== Usuarios Registrados ===')
  console.log(JSON.stringify(users, null, 2))

  await prisma.$disconnect()
}

listUsers().catch(console.error)
