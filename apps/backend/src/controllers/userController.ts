import { Request, Response, NextFunction } from 'express'
import { PrismaClient, UserRole } from '@prisma/client'
import { NotFoundError } from '../middleware/errorHandler'

const prisma = new PrismaClient()

/**
 * Get all users (admin only)
 */
export async function getAllUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '50', search = '', role = '' } = req.query

    const pageNumber = Number(page)
    const limitNumber = Number(limit)
    const skip = (pageNumber - 1) * limitNumber

    // Build where clause
    const where: any = {}

    // Filter by role if provided
    if (role && role !== 'all') {
      where.role = role.toUpperCase()
    }

    // Search by email or name
    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
      ]
    }

    // Get total count
    const total = await prisma.user.count({ where })

    // Get users with their VPS count and total spent
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limitNumber,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        lastLogin: true,
        _count: {
          select: {
            vpsInstances: true,
            orders: true,
          },
        },
      },
    })

    // Calculate metrics for each user
    const usersWithMetrics = await Promise.all(
      users.map(async (user) => {
        // Get active VPS count
        const activeVpsCount = await prisma.vpsInstance.count({
          where: {
            userId: user.id,
            status: { in: ['RUNNING', 'STOPPED'] },
          },
        })

        // Get total spent from paid orders
        const orders = await prisma.order.findMany({
          where: {
            userId: user.id,
            status: { in: ['PAID', 'COMPLETED'] },
          },
          select: {
            totalAmount: true,
          },
        })

        const totalSpent = orders.reduce((sum, order) => {
          return sum + Number(order.totalAmount)
        }, 0)

        return {
          ...user,
          metrics: {
            activeVps: activeVpsCount,
            totalOrders: user._count.orders,
            totalSpent,
          },
        }
      })
    )

    res.json({
      success: true,
      data: usersWithMetrics,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get user by ID (admin only)
 */
export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        emailVerified: true,
        createdAt: true,
        lastLogin: true,
        vpsInstances: {
          where: { status: { in: ['RUNNING', 'STOPPED', 'PROVISIONING', 'SUSPENDED', 'EXPIRED', 'TERMINATED'] } },
          select: {
            id: true,
            name: true,
            displayName: true,
            status: true,
            ipAddress: true,
            region: true,
            contaboInstanceId: true,
            expiresAt: true,
            createdAt: true,
            suspendedAt: true,
            suspensionReason: true,
            product: {
              select: {
                id: true,
                name: true,
                cpuCores: true,
                ramMb: true,
                diskGb: true,
                diskType: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            currency: true,
            periodMonths: true,
            region: true,
            createdAt: true,
            completedAt: true,
            product: {
              select: {
                id: true,
                name: true,
                cpuCores: true,
                ramMb: true,
                diskGb: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      throw NotFoundError('User not found')
    }

    // Sanitize vpsInstances to handle BigInt serialization
    const sanitizedVpsInstances = user.vpsInstances.map((vps: any) => ({
      ...vps,
      contaboInstanceId: vps.contaboInstanceId?.toString() || null,
      product: vps.product ? {
        ...vps.product,
        ramGb: Math.round((vps.product.ramMb || 0) / 1024),
      } : null,
    }))

    // Calculate metrics
    const activeVpsCount = await prisma.vpsInstance.count({
      where: {
        userId: id,
        status: { in: ['RUNNING', 'STOPPED'] },
      },
    })

    const totalSpent = await prisma.order.aggregate({
      where: {
        userId: id,
        status: { in: ['PAID', 'COMPLETED'] },
      },
      _sum: {
        totalAmount: true,
      },
    })

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        vpsInstances: sanitizedVpsInstances,
        orders: user.orders.map((order: any) => ({
          ...order,
          totalAmount: Number(order.totalAmount),
          product: order.product ? {
            ...order.product,
            ramGb: Math.round((order.product.ramMb || 0) / 1024),
          } : null,
        })),
        metrics: {
          activeVps: activeVpsCount,
          totalSpent: Number(totalSpent._sum.totalAmount) || 0,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get user statistics (admin only)
 */
export async function getUserStatistics(req: Request, res: Response, next: NextFunction) {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [total, totalCustomers, totalAdmins, newThisMonth] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: { gte: startOfMonth },
        },
      }),
    ])

    // Get active customers (customers with at least one active VPS)
    const activeCustomers = await prisma.user.count({
      where: {
        role: 'CUSTOMER',
        vpsInstances: {
          some: {
            status: { in: ['RUNNING', 'STOPPED'] },
          },
        },
      },
    })

    res.json({
      success: true,
      data: {
        total,
        customers: totalCustomers,
        admins: totalAdmins,
        newThisMonth,
        activeCustomers,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update user (admin only)
 */
export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { firstName, lastName, phone, role } = req.body

    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      throw NotFoundError('User not found')
    }

    // Update user
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(role !== undefined && { role: role.toUpperCase() }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        emailVerified: true,
        createdAt: true,
        lastLogin: true,
      },
    })

    res.json({
      success: true,
      data: updated,
      message: 'User updated successfully',
    })
  } catch (error) {
    next(error)
  }
}
