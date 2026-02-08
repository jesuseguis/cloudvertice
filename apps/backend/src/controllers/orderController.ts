import { Request, Response, NextFunction } from 'express'
import { orderService } from '../services/orderService'
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler'

/**
 * Get user's orders
 */
export async function getUserOrders(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    const { status, startDate, endDate } = req.query

    const filters = {
      status: status as any,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    }

    const orders = await orderService.getUserOrders(req.user.userId, filters)

    // Return paginated response format expected by frontend
    res.json({
      success: true,
      data: {
        data: orders,
        total: orders.length,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get order by ID
 */
export async function getOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    const order = await orderService.getOrderById(id, req.user?.userId, req.user?.role)

    res.json({
      success: true,
      data: order,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Create a new order
 */
export async function createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    const data = req.body

    const order = await orderService.createOrder(req.user.userId, data)

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Cancel order
 */
export async function cancelOrder(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    const { id } = req.params

    const order = await orderService.cancelOrder(id, req.user.userId)

    res.json({
      success: true,
      data: order,
      message: 'Order cancelled successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get all orders (admin only)
 */
export async function getAllOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, startDate, endDate, page = '1', limit = '50' } = req.query

    const filters = {
      status: status as any,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    }

    const orders = await orderService.getAllOrders(filters)

    // Return paginated response format expected by frontend
    res.json({
      success: true,
      data: {
        data: orders,
        total: orders.length,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update order status (admin only)
 */
export async function updateOrderStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const data = req.body

    const order = await orderService.updateOrderStatus(id, data)

    res.json({
      success: true,
      data: order,
      message: 'Order status updated successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get pending orders (admin only)
 */
export async function getPendingOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const orders = await orderService.getPendingOrders()

    res.json({
      success: true,
      data: orders,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Assign VPS instance to order (admin only)
 */
export async function assignVpsInstance(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { vpsInstanceId } = req.body

    if (!vpsInstanceId) {
      return next(NotFoundError('VPS instance ID is required'))
    }

    const order = await orderService.assignVpsInstance(id, vpsInstanceId)

    res.json({
      success: true,
      data: order,
      message: 'VPS instance assigned successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get order statistics (admin only)
 */
export async function getOrderStatistics(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await orderService.getOrderStatistics()

    res.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    next(error)
  }
}
