import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'
import { BadRequestError } from './errorHandler'

/**
 * Validation middleware factory
 */
export function validate(schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }))
      const err = BadRequestError('Validation failed')
      err.details = details
      return next(err)
    }

    // Replace request property with sanitized value
    req[property] = value
    next()
  }
}
