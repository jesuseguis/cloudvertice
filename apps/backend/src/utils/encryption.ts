import crypto from 'crypto'

/**
 * Encryption utility for VPS root passwords
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const TAG_POSITION = SALT_LENGTH + IV_LENGTH
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH

/**
 * Get encryption key from environment
 * Falls back to a default key for development (NOT for production)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY

  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY environment variable must be set in production')
    }
    // Development fallback - NEVER use in production
    console.warn('Using default encryption key - DO NOT use in production!')
    return Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex')
  }

  // Ensure key is 32 bytes (256 bits) for AES-256
  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
  }

  return Buffer.from(key, 'hex')
}

/**
 * Encrypt a VPS root password
 * @param password - Plain text password to encrypt
 * @returns Encrypted password (salt + iv + tag + encrypted data as hex string)
 */
export function encryptVpsPassword(password: string): string {
  try {
    const key = getEncryptionKey()

    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH)
    const iv = crypto.randomBytes(IV_LENGTH)

    // Derive key using PBKDF2
    const derivedKey = crypto.pbkdf2Sync(
      key,
      salt,
      100000,
      32,
      'sha256'
    )

    // Encrypt
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv)
    const encrypted = Buffer.concat([
      cipher.update(password, 'utf8'),
      cipher.final(),
    ])

    // Get auth tag
    const tag = cipher.getAuthTag()

    // Combine: salt + iv + tag + encrypted
    const combined = Buffer.concat([salt, iv, tag, encrypted])

    return combined.toString('hex')
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt password')
  }
}

/**
 * Decrypt a VPS root password
 * @param encryptedPassword - Encrypted password (hex string)
 * @returns Decrypted plain text password
 */
export function decryptVpsPassword(encryptedPassword: string): string {
  try {
    const key = getEncryptionKey()

    // Parse combined data
    const combined = Buffer.from(encryptedPassword, 'hex')

    const salt = combined.subarray(0, SALT_LENGTH)
    const iv = combined.subarray(SALT_LENGTH, TAG_POSITION)
    const tag = combined.subarray(TAG_POSITION, ENCRYPTED_POSITION)
    const encrypted = combined.subarray(ENCRYPTED_POSITION)

    // Derive key using PBKDF2
    const derivedKey = crypto.pbkdf2Sync(
      key,
      salt,
      100000,
      32,
      'sha256'
    )

    // Decrypt
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv)
    decipher.setAuthTag(tag)

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ])

    return decrypted.toString('utf8')
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt password')
  }
}

/**
 * Generate a secure random password
 * @param length - Password length (default 16)
 * @returns Random password string
 */
export function generateRandomPassword(length: number = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()'
  const randomBytes = crypto.randomBytes(length)

  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length]
  }

  return password
}

/**
 * Hash a value for comparison (e.g., for checking if password matches without storing)
 * @param value - Value to hash
 * @returns Hashed value
 */
export function hashValue(value: string): string {
  return crypto
    .createHash('sha256')
    .update(value)
    .digest('hex')
}
