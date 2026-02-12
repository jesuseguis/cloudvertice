import { Router } from 'express'
import * as paymentController from '../controllers/paymentController'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import {
  createPaymentIntentSchema,
  refundPaymentSchema,
} from '../utils/validators'

const router = Router()

/**
 * @route   POST /api/payments/create-intent
 * @desc    Create a PaymentIntent for an order
 * @access  Private
 */
router.post(
  '/create-intent',
  authenticate,
  validate(createPaymentIntentSchema),
  paymentController.createPaymentIntent
)

/**
 * @route   POST /api/payments/confirm
 * @desc    Confirm payment from client-side (fallback for development)
 * @access  Private
 */
router.post(
  '/confirm',
  authenticate,
  paymentController.confirmPayment
)

/**
 * @route   GET /api/payments/intent/:intentId
 * @desc    Get payment intent status
 * @access  Private
 */
router.get(
  '/intent/:intentId',
  authenticate,
  paymentController.getPaymentIntent
)

/**
 * @route   GET /api/payments/order/:orderId
 * @desc    Get transaction by order ID
 * @access  Private
 */
router.get(
  '/order/:orderId',
  authenticate,
  paymentController.getTransactionByOrder
)

/**
 * @route   GET /api/payments/transactions
 * @desc    Get user's transactions
 * @access  Private
 */
router.get(
  '/transactions',
  authenticate,
  paymentController.getUserTransactions
)

/**
 * @route   POST /api/payments/admin/refund/:transactionId
 * @desc    Refund a payment
 * @access  Admin
 */
router.post(
  '/admin/refund/:transactionId',
  authenticate,
  requireAdmin,
  validate(refundPaymentSchema),
  paymentController.refundPayment
)

export { router as paymentRouter }
