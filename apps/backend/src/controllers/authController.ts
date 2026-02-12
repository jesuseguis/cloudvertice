import { Request, Response, NextFunction } from 'express'
import { authService } from '../services/authService'
import {
  UnauthorizedError,
} from '../middleware/errorHandler'

/**
 * Register new user
 */
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, firstName, lastName, phone } = req.body

    const result = await authService.register({
      email,
      password,
      firstName,
      lastName,
      phone,
    })

    res.status(201).json({
      success: true,
      data: result,
      message: 'Registration successful. Please check your email to verify your account.',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Login user
 */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body

    const result = await authService.login(email, password)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get current user profile
 */
export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw UnauthorizedError('Not authenticated')
    }

    const user = await authService.getUserById(req.user.userId)

    if (!user) {
      throw NotFoundError('User not found')
    }

    res.json({
      success: true,
      data: user,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Refresh access token
 */
export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body

    const result = await authService.refreshTokens(refreshToken)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Logout user (client-side token invalidation)
 */
export async function logout(_req: Request, res: Response) {
  // In a stateless JWT system, logout is handled client-side
  // by deleting the tokens. If using refresh token rotation,
  // you would invalidate the refresh token here.

  res.json({
    success: true,
    message: 'Logged out successfully',
  })
}

/**
 * Change password (authenticated user)
 */
export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw UnauthorizedError('Not authenticated')
    }

    const { currentPassword, newPassword } = req.body

    await authService.changePassword(req.user.userId, currentPassword, newPassword)

    res.json({
      success: true,
      message: 'Password changed successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Request password reset
 */
export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body

    await authService.forgotPassword(email)

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body

    await authService.resetPassword(token, password)

    res.json({
      success: true,
      message: 'Password has been reset successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Verify email
 */
export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.query

    if (typeof token !== 'string') {
      throw BadRequestError('Invalid verification token')
    }

    await authService.verifyEmail(token)

    res.json({
      success: true,
      message: 'Email verified successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Resend verification email
 */
export async function resendVerification(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw UnauthorizedError('Not authenticated')
    }

    await authService.resendVerification(req.user.userId)

    res.json({
      success: true,
      message: 'Verification email sent',
    })
  } catch (error) {
    next(error)
  }
}
