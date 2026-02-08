import { PrismaClient, User, UserRole } from '@prisma/client'
import {
  hashPassword,
  comparePassword,
} from '../utils/password'
import {
  generateTokens,
  verifyRefreshToken,
} from '../utils/jwt'
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} from '../middleware/errorHandler'

const prisma = new PrismaClient()

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

export interface LoginResult {
  user: UserInfo
  tokens: {
    accessToken: string
    refreshToken: string
  }
}

export interface UserInfo {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: UserRole
  emailVerified: boolean
}

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<LoginResult> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      throw ConflictError('Email already registered')
    }

    // Hash password
    const passwordHash = await hashPassword(data.password)

    // Generate verification token
    const verificationToken = this.generateVerificationToken()

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        verificationToken,
        role: 'CUSTOMER',
      },
    })

    // TODO: Send verification email

    // Generate tokens
    const tokens = this.generateUserTokens(user)

    return {
      user: this.sanitizeUser(user),
      tokens,
    }
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<LoginResult> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw UnauthorizedError('Invalid credentials')
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash)

    if (!isPasswordValid) {
      throw UnauthorizedError('Invalid credentials')
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    // Generate tokens
    const tokens = this.generateUserTokens(user)

    return {
      user: this.sanitizeUser(user),
      tokens,
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken)

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      })

      if (!user) {
        throw NotFoundError('User not found')
      }

      // Generate new access token
      const accessToken = generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
      }).accessToken

      return { accessToken }
    } catch (error) {
      throw UnauthorizedError('Invalid or expired refresh token')
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return
    }

    // Generate reset token
    const resetPasswordToken = this.generateVerificationToken()
    const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Save token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken,
        resetPasswordExpires,
      },
    })

    // TODO: Send reset email
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gte: new Date(),
        },
      },
    })

    if (!user) {
      throw BadRequestError('Invalid or expired reset token')
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword)

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    })
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
      },
    })

    if (!user) {
      throw BadRequestError('Invalid verification token')
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
      },
    })
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserInfo | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return null
    }

    return this.sanitizeUser(user)
  }

  /**
   * Generate tokens for user
   */
  private generateUserTokens(user: User) {
    return generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    })
  }

  /**
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: User): UserInfo {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      emailVerified: user.emailVerified,
    }
  }

  /**
   * Generate a random verification token
   */
  private generateVerificationToken(): string {
    return Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64')
  }
}

export const authService = new AuthService()
