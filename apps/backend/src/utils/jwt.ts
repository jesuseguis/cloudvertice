import jwt from 'jsonwebtoken'
import { UnauthorizedError } from '../middleware/errorHandler'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-min-32-chars'

export interface TokenPayload {
  userId: string
  email: string
  role: string
}

export interface Tokens {
  accessToken: string
  refreshToken: string
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    issuer: 'cloudvertice',
    audience: 'cloudvertice-api',
  })
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: 'cloudvertice',
    audience: 'cloudvertice-refresh',
  })
}

export function generateTokens(payload: TokenPayload): Tokens {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  }
}

export function verifyAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'cloudvertice',
      audience: 'cloudvertice-api',
    }) as TokenPayload
  } catch (error) {
    throw UnauthorizedError('Invalid or expired access token')
  }
}

export function verifyRefreshToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'cloudvertice',
      audience: 'cloudvertice-refresh',
    }) as TokenPayload
  } catch (error) {
    throw UnauthorizedError('Invalid or expired refresh token')
  }
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload
  } catch {
    return null
  }
}
