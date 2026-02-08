import { Request, Response, NextFunction } from 'express'
import { adminService } from '../services/adminService'
import { contaboService } from '../services/contaboService'
import { NotFoundError, BadRequestError } from '../middleware/errorHandler'

/**
 * Get dashboard metrics
 */
export async function getDashboardMetrics(req: Request, res: Response, next: NextFunction) {
  try {
    const metrics = await adminService.getDashboardMetrics()

    res.json({
      success: true,
      data: metrics,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get detailed analytics
 */
export async function getAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const { period = 'month' } = req.query

    const analytics = await adminService.getAnalytics(period as 'week' | 'month' | 'year')

    res.json({
      success: true,
      data: analytics,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get pending orders for provisioning
 */
export async function getPendingOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const orders = await adminService.getPendingOrders()

    res.json({
      success: true,
      data: orders,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Provision an order (create VPS instance)
 */
export async function provisionOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const { orderId } = req.params
    const data = req.body

    const vps = await adminService.provisionOrder(orderId, data)

    res.status(201).json({
      success: true,
      data: vps,
      message: 'Order provisioned successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get admin alerts
 */
export async function getAlerts(req: Request, res: Response, next: NextFunction) {
  try {
    const alerts = await adminService.getAlerts()

    res.json({
      success: true,
      data: alerts,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get recent activity
 */
export async function getRecentActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const { limit = 20 } = req.query

    const activity = await adminService.getRecentActivity(Number(limit))

    res.json({
      success: true,
      data: activity,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * List Contabo instances
 */
export async function listContaboInstances(req: Request, res: Response, next: NextFunction) {
  try {
    const instances = await contaboService.listInstances()

    res.json({
      success: true,
      data: instances,
      count: instances.length,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * List available (unassigned) Contabo instances
 */
export async function listAvailableContaboInstances(req: Request, res: Response, next: NextFunction) {
  try {
    const instances = await adminService.getAvailableContaboInstances()

    res.json({
      success: true,
      data: instances,
      count: instances.length,
    })
  } catch (error) {
    next(error)
  }
}
