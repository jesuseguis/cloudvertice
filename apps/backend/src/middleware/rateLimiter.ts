import { Request, Response, NextFunction } from 'express'

/**
 * Rate limiter using in-memory storage
 * For production, use Redis-based rate limiting
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory storage (use Redis in production)
const limitStore = new Map<string, RateLimitEntry>()

// Cleanup interval (remove expired entries every minute)
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of limitStore.entries()) {
    if (entry.resetTime < now) {
      limitStore.delete(key)
    }
  }
}, 60000)

/**
 * Create a rate limiter middleware
 * @param windowMs - Time window in milliseconds
 * @param maxRequests - Maximum requests per window
 * @param keyGenerator - Function to generate rate limit key from request
 */
export function createRateLimiter(
  windowMs: number = 60000,
  maxRequests: number = 100,
  keyGenerator: (req: Request) => string = (req) => {
    // Use IP address as default key
    const ip = req.headers['x-forwarded-for'] as string ||
              req.headers['x-real-ip'] as string ||
              req.socket.remoteAddress ||
              'unknown'
    return ip
  }
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req)
    const now = Date.now()

    let entry = limitStore.get(key)

    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired
      entry = {
        count: 1,
        resetTime: now + windowMs,
      }
      limitStore.set(key, entry)
      return next()
    }

    // Increment counter
    entry.count++

    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
      res.setHeader('Retry-After', retryAfter.toString())
      return next(TooManyRequestsError(
        `Too many requests. Please try again in ${retryAfter} seconds.`
      ))
    }

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString())
    res.setHeader('X-RateLimit-Remaining', (maxRequests - entry.count).toString())
    res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime).toISOString())

    next()
  }
}

/**
 * Rate limiter by IP address
 */
export const ipRateLimiter = createRateLimiter(
  60000, // 1 minute
  300     // 300 requests per minute (increased for development)
)

/**
 * Stricter rate limiter for authentication endpoints
 */
export const authRateLimiter = createRateLimiter(
  60000, // 1 minute
  5      // 5 requests per minute
)

/**
 * Rate limiter for API endpoints by user
 */
export const userRateLimiter = createRateLimiter(
  60000,   // 1 minute
  100,     // 100 requests per minute
  (req) => {
    // Use user ID if authenticated, otherwise IP
    if (req.user) {
      return `user:${req.user.userId}`
    }
    const ip = req.headers['x-forwarded-for'] as string ||
              req.headers['x-real-ip'] as string ||
              req.socket.remoteAddress ||
              'unknown'
    return `ip:${ip}`
  }
)

/**
 * Rate limiter for VPS actions (prevent abuse)
 */
export const vpsActionRateLimiter = createRateLimiter(
  300000, // 5 minutes
  10,     // 10 actions per 5 minutes
  (req) => {
    if (req.user) {
      return `vps-action:${req.user.userId}`
    }
    const ip = req.headers['x-forwarded-for'] as string ||
              req.headers['x-real-ip'] as string ||
              req.socket.remoteAddress ||
              'unknown'
    return `vps-action:ip:${ip}`
  }
)

/**
 * Custom TooManyRequests error
 */
function TooManyRequestsError(message: string) {
  const error: any = new Error(message)
  error.statusCode = 429
  error.isOperational = true
  return error
}
