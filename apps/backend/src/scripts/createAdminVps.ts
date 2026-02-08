import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../utils/password'

const prisma = new PrismaClient()

async function createAdmin() {
  const email = 'admin@vpsreseller.com'
  const password = 'Admin123!'

  const existing = await prisma.user.findUnique({
    where: { email },
  })

  if (existing) {
    console.log('User already exists, updating password...')
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash: await hashPassword(password),
        role: 'ADMIN',
      },
    })
    console.log('Password updated!')
  } else {
    await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        role: 'ADMIN',
        emailVerified: true,
      },
    })
    console.log('Admin created!')
  }

  console.log('Email:', email)
  console.log('Password:', password)
}

createAdmin()
  .catch((err) => {
    console.error('Error:', err)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
