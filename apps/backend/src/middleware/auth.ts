import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, type TokenPayload } from '../utils/jwt'
import { UnauthorizedError, ForbiddenError } from './errorHandler'

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

/**
 * Authentication middleware - verifies JWT token
 */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw UnauthorizedError('Authentication required')
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify token
    const payload = verifyAccessToken(token)

    // Attach user to request
    req.user = payload

    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const payload = verifyAccessToken(token)
      req.user = payload
    }

    next()
  } catch {
    // Continue without user
    next()
  }
}

/**
 * Require admin role
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(UnauthorizedError('Authentication required'))
  }

  if (req.user.role !== 'ADMIN') {
    return next(ForbiddenError('Admin access required'))
  }

  next()
}

/**
 * Require customer role
 */
export function requireCustomer(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(UnauthorizedError('Authentication required'))
  }

  if (req.user.role !== 'CUSTOMER') {
    return next(ForbiddenError('Customer access required'))
  }

  next()
}
