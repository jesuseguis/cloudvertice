const jwt = require('jsonwebtoken')

// Test with the same secret as .env
const JWT_SECRET = 'change-this-secret-in-production-min-32-chars'

const payload = {
  userId: '7e86d32f-e721-4812-b879-eae4bd7ef1de',
  email: 'admin@cloudvertice.com',
  role: 'ADMIN',
}

const token = jwt.sign(payload, JWT_SECRET, {
  expiresIn: '15m',
  issuer: 'cloudvertice',
  audience: 'cloudvertice-api',
})

console.log('Token:', token.substring(0, 50) + '...')

// Verify immediately
try {
  const decoded = jwt.verify(token, JWT_SECRET, {
    issuer: 'cloudvertice',
    audience: 'cloudvertice-api',
  })
  console.log('Verified successfully:', decoded.userId)
} catch (error) {
  console.error('Verification failed:', error.message)
}
