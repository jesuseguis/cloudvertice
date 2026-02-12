import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'
import { Prisma } from '@prisma/client'

export interface AppError extends Error {
  statusCode?: number
  isOperational?: boolean
  details?: any
}

export const errorHandler = (
  err: AppError | Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = (err as AppError).statusCode || 500
  const isOperational = (err as AppError).isOperational
  const message = isOperational ? err.message : 'Internal server error'
  const details = (err as AppError).details

  // Log error
  console.error('[ERROR HANDLER]', {
    message: err.message,
    statusCode,
    stack: err.stack,
    details,
  })

  // Log validation details specifically
  if (statusCode === 400 && details) {
    console.error('[ERROR HANDLER] Validation details:', JSON.stringify(details, null, 2))
  }

  // Handle specific error types
  if (err instanceof Joi.ValidationError) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: err.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      },
    })
    return
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle unique constraint violation
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[])?.join(', ') || 'field'
      res.status(409).json({
        success: false,
        error: {
          message: `${field} already exists`,
          code: 'DUPLICATE',
        },
      })
      return
    }

    // Handle record not found
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: {
          message: 'Record not found',
          code: 'NOT_FOUND',
        },
      })
      return
    }
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(err as AppError).details && { details: (err as AppError).details },
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  })
}

/**
 * Create an operational error
 */
export function createError(message: string, statusCode: number = 500): AppError {
  const error = new Error(message) as AppError
  error.statusCode = statusCode
  error.isOperational = true
  return error
}

/**
 * Create a 404 Not Found error
 */
export function NotFoundError(message: string = 'Resource not found'): AppError {
  return createError(message, 404)
}

/**
 * Create a 401 Unauthorized error
 */
export function UnauthorizedError(message: string = 'Unauthorized'): AppError {
  return createError(message, 401)
}

/**
 * Create a 403 Forbidden error
 */
export function ForbiddenError(message: string = 'Forbidden'): AppError {
  return createError(message, 403)
}

/**
 * Create a 409 Conflict error
 */
export function ConflictError(message: string = 'Conflict'): AppError {
  return createError(message, 409)
}

/**
 * Create a 400 Bad Request error
 */
export function BadRequestError(message: string = 'Bad request'): AppError {
  return createError(message, 400)
}

/**
 * Create a 429 Too Many Requests error
 */
export function TooManyRequestsError(message: string = 'Too many requests'): AppError {
  return createError(message, 429)
}
