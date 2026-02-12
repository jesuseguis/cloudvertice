import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import dotenv from 'dotenv'
import path from 'path'
import { errorHandler } from './middleware/errorHandler'
import { notFoundHandler } from './middleware/notFoundHandler'
import { ipRateLimiter } from './middleware/rateLimiter'
import { authRouter } from './routes/auth'
import { healthRouter } from './routes/health'
import { productRouter } from './routes/products'
import { imageRouter } from './routes/images'
import { orderRouter } from './routes/orders'
import { paymentRouter } from './routes/payments'
import { vpsRouter } from './routes/vps'
import { sshKeyRouter } from './routes/sshKeys'
import { adminRouter } from './routes/admin'
import { usersRouter } from './routes/users'
import { invoiceRouter } from './routes/invoices'
import { ticketRouter } from './routes/tickets'
import { regionRouter } from './routes/regions'
import { operatingSystemRouter } from './routes/operating-systems'

// Load environment variables from explicit path
dotenv.config({ path: path.join(__dirname, '../.env') })

const app = express()
const PORT = process.env.PORT || 4000

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))
app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(compression())

// IMPORTANT: Webhook route must be BEFORE express.json() middleware
// Stripe needs raw body to verify signature
const webhookRouter = express.Router()
// Import controller inside the route to avoid circular dependency
webhookRouter.post('/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    const { handleWebhook } = await import('./controllers/paymentController')
    handleWebhook(req, res, next)
  } catch (err) {
    next(err)
  }
})
app.use('/api/payments', webhookRouter)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('combined'))

// Apply rate limiting to all routes
app.use(ipRateLimiter)

// Routes
app.use('/health', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/products', productRouter)
app.use('/api/images', imageRouter)
app.use('/api/orders', orderRouter)
app.use('/api/payments', paymentRouter)  // Other payment routes (create-intent, confirm, etc)
app.use('/api/vps', vpsRouter)
app.use('/api/ssh-keys', sshKeyRouter)
app.use('/api/admin', adminRouter)
app.use('/api/users', usersRouter)
app.use('/api/invoices', invoiceRouter)
app.use('/api/tickets', ticketRouter)
app.use('/api/regions', regionRouter)
app.use('/api/operating-systems', operatingSystemRouter)

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
})

export default app
