import Stripe from 'stripe'
import { PrismaClient, PaymentStatus } from '@prisma/client'
import { NotFoundError, BadRequestError } from '../middleware/errorHandler'
import { orderService } from './orderService'

const prisma = new PrismaClient()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

export interface CreatePaymentIntentData {
  orderId: string
}

export interface PaymentIntentResult {
  clientSecret: string
  paymentIntentId: string
  amount: number
  currency: string
}

export class StripeService {
  private readonly webhookSecret: string

  constructor() {
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''
  }

  /**
   * Create a PaymentIntent for an order
   */
  async createPaymentIntent(data: CreatePaymentIntentData): Promise<PaymentIntentResult> {
    console.log('[StripeService] Creating PaymentIntent for order:', data.orderId)

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: { product: true },
    })

    if (!order) {
      console.error('[StripeService] Order not found:', data.orderId)
      throw NotFoundError('Order not found')
    }

    console.log('[StripeService] Order found:', { id: order.id, status: order.status, totalAmount: order.totalAmount })

    // Check if order is in correct status
    if (order.status !== 'PENDING') {
      console.error('[StripeService] Order not in PENDING status:', order.status)
      throw BadRequestError('Order must be in PENDING status to create payment')
    }

    // Check if there's already a payment for this order
    const existingPayment = await prisma.transaction.findFirst({
      where: {
        orderId: data.orderId,
        status: { in: ['PROCESSING', 'COMPLETED'] },
      },
    })

    if (existingPayment) {
      throw BadRequestError('Payment already exists for this order')
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalAmount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order.id,
        userId: order.userId,
      },
      description: `VPS Order: ${order.product.name} (${order.periodMonths} months)`,
    })

    // Create transaction record
    await prisma.transaction.create({
      data: {
        orderId: order.id,
        userId: order.userId,
        providerTxId: paymentIntent.id,
        amount: order.totalAmount,
        currency: 'usd',
        status: 'PROCESSING',
        paymentProvider: 'stripe',
      },
    })

    return {
      clientSecret: paymentIntent.client_secret || '',
      paymentIntentId: paymentIntent.id,
      amount: order.totalAmount,
      currency: 'usd',
    }
  }

  /**
   * Get payment intent status
   */
  async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntentResult & { status: string }> {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    return {
      clientSecret: paymentIntent.client_secret || '',
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    }
  }

  /**
   * Handle Stripe webhook
   */
  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    console.log('[StripeService] handleWebhook called')
    console.log('[StripeService] webhookSecret exists:', !!this.webhookSecret)
    console.log('[StripeService] signature exists:', !!signature)

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret)
      console.log('[StripeService] Webhook event constructed:', event.type)
    } catch (err) {
      console.error('[StripeService] Webhook signature verification failed:', err)
      throw BadRequestError('Invalid webhook signature')
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('[StripeService] Handling payment_intent.succeeded')
        await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        console.log('[StripeService] Handling payment_intent.payment_failed')
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.canceled':
        console.log('[StripeService] Handling payment_intent.canceled')
        await this.handlePaymentCanceled(event.data.object as Stripe.PaymentIntent)
        break

      default:
        console.log(`[StripeService] Unhandled event type: ${event.type}`)
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const orderId = paymentIntent.metadata.orderId
    const userId = paymentIntent.metadata.userId

    console.log('[StripeService] handlePaymentSucceeded called with:', { orderId, userId, paymentIntentId: paymentIntent.id })

    if (!orderId) {
      console.error('[StripeService] PaymentIntent missing orderId metadata')
      return
    }

    // Update transaction
    console.log('[StripeService] Updating transaction to COMPLETED')
    await prisma.transaction.updateMany({
      where: { providerTxId: paymentIntent.id },
      data: {
        status: 'COMPLETED',
      },
    })

    // Update order status to PAID
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PAID' },
    })

    // TODO: Send confirmation email
    console.log(`Payment succeeded for order ${orderId}`)
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const orderId = paymentIntent.metadata.orderId

    if (!orderId) {
      console.error('PaymentIntent missing orderId metadata')
      return
    }

    // Update transaction
    await prisma.transaction.updateMany({
      where: { providerTxId: paymentIntent.id },
      data: {
        status: 'FAILED',
      },
    })

    // TODO: Send payment failed email
    console.log(`Payment failed for order ${orderId}`)
  }

  /**
   * Handle canceled payment
   */
  private async handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const orderId = paymentIntent.metadata.orderId

    if (!orderId) {
      console.error('PaymentIntent missing orderId metadata')
      return
    }

    // Update transaction
    await prisma.transaction.updateMany({
      where: { providerTxId: paymentIntent.id },
      data: {
        status: 'FAILED',
      },
    })

    // TODO: Send payment canceled email
    console.log(`Payment canceled for order ${orderId}`)
  }

  /**
   * Refund a payment
   */
  async refundPayment(transactionId: string, amount?: number): Promise<void> {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { order: true },
    })

    if (!transaction) {
      throw NotFoundError('Transaction not found')
    }

    if (!transaction.providerTxId) {
      throw BadRequestError('Transaction does not have a valid Stripe PaymentIntent')
    }

    if (transaction.status !== 'COMPLETED') {
      throw BadRequestError('Can only refund completed transactions')
    }

    // Create refund
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: transaction.providerTxId,
    }

    if (amount) {
      refundParams.amount = Math.round(amount * 100) // Convert to cents
    }

    await stripe.refunds.create(refundParams)

    // Update transaction status
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: 'REFUNDED' },
    })

    // TODO: Send refund confirmation email
  }

  /**
   * Get transaction by order ID
   */
  async getTransactionByOrderId(orderId: string) {
    const transaction = await prisma.transaction.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    })

    if (!transaction) {
      throw NotFoundError('Transaction not found')
    }

    return transaction
  }

  /**
   * Get user's transactions
   */
  async getUserTransactions(userId: string) {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: {
        order: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return transactions
  }

  /**
   * Ensure order is marked as PAID after successful payment
   * This is called by the confirmPayment endpoint as a fallback
   */
  async ensureOrderPaid(orderId: string, paymentIntentId: string): Promise<void> {
    console.log('[StripeService] ensureOrderPaid called:', { orderId, paymentIntentId })

    // Update transaction to COMPLETED
    await prisma.transaction.updateMany({
      where: {
        orderId,
        providerTxId: paymentIntentId,
      },
      data: {
        status: 'COMPLETED',
      },
    })

    // Update order status to PAID
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    })

    console.log('[StripeService] Order marked as PAID:', orderId)
  }
}

export const stripeService = new StripeService()
