import { Request, Response, NextFunction } from 'express'
import { stripeService } from '../services/stripeService'
import { NotFoundError, BadRequestError } from '../middleware/errorHandler'

/**
 * Create a PaymentIntent for an order
 */
export async function createPaymentIntent(req: Request, res: Response, next: NextFunction) {
  try {
    const { orderId } = req.body

    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    const result = await stripeService.createPaymentIntent({ orderId })

    res.json({
      success: true,
      data: result,
      message: 'Payment intent created successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get payment intent status
 */
export async function getPaymentIntent(req: Request, res: Response, next: NextFunction) {
  try {
    const { intentId } = req.params

    const result = await stripeService.getPaymentIntent(intentId)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Handle Stripe webhook
 */
export async function handleWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const sig = req.headers['stripe-signature'] as string

    if (!sig) {
      return next(BadRequestError('Stripe signature is missing'))
    }

    await stripeService.handleWebhook(req.body, sig)

    res.json({
      success: true,
      message: 'Webhook processed successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get transaction by order ID
 */
export async function getTransactionByOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const { orderId } = req.params

    const transaction = await stripeService.getTransactionByOrderId(orderId)

    res.json({
      success: true,
      data: transaction,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get user's transactions
 */
export async function getUserTransactions(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(NotFoundError('User not found'))
    }

    const transactions = await stripeService.getUserTransactions(req.user.userId)

    res.json({
      success: true,
      data: transactions,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Refund a payment (admin only)
 */
export async function refundPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const { transactionId } = req.params
    const { amount } = req.body

    await stripeService.refundPayment(transactionId, amount)

    res.json({
      success: true,
      message: 'Payment refunded successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Confirm payment from client-side (fallback for development)
 * This endpoint verifies the payment intent status with Stripe
 * and updates the order accordingly
 */
export async function confirmPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const { paymentIntentId, orderId } = req.body

    if (!paymentIntentId || !orderId) {
      return next(BadRequestError('paymentIntentId and orderId are required'))
    }

    // Get payment intent status from Stripe
    const paymentIntent = await stripeService.getPaymentIntent(paymentIntentId)

    // If payment is successful, ensure order is updated to PAID
    if (paymentIntent.status === 'succeeded') {
      await stripeService.ensureOrderPaid(orderId, paymentIntentId)
    }

    res.json({
      success: true,
      data: {
        status: paymentIntent.status,
      },
      message: 'Payment confirmed successfully',
    })
  } catch (error) {
    next(error)
  }
}
