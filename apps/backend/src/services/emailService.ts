import nodemailer from 'nodemailer'
import { BadRequestError } from '../middleware/errorHandler'

/**
 * Email service using SendGrid (or SMTP fallback)
 */

// Email templates
export interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

// Email data types
export interface VerificationEmailData {
  email: string
  firstName: string
  verificationUrl: string
}

export interface PasswordResetEmailData {
  email: string
  firstName: string
  resetUrl: string
}

export interface OrderConfirmationEmailData {
  email: string
  firstName: string
  orderNumber: string
  productName: string
  amount: number
  orderUrl: string
}

export interface VpsProvisionedEmailData {
  email: string
  firstName: string
  vpsName: string
  ipAddress: string
  rootPassword: string
  region: string
  dashboardUrl: string
}

export interface InvoiceEmailData {
  email: string
  firstName: string
  invoiceNumber: string
  amount: number
  dueDate: Date
  invoiceUrl: string
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null
  private fromAddress: string
  private fromName: string

  constructor() {
    this.fromAddress = process.env.EMAIL_FROM || 'noreply@cloudvertice.com'
    this.fromName = process.env.EMAIL_FROM_NAME || 'Cloud Vertice'

    this.initializeTransporter()
  }

  /**
   * Initialize email transporter
   */
  private initializeTransporter() {
    const sendgridApiKey = process.env.SENDGRID_API_KEY

    if (sendgridApiKey) {
      // Use SendGrid
      this.transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: sendgridApiKey,
        },
      })
    } else if (process.env.SMTP_HOST) {
      // Fallback to SMTP
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    } else {
      console.warn('No email service configured. Emails will be logged only.')
      this.transporter = null
    }
  }

  /**
   * Send an email
   */
  async sendEmail(to: string, template: EmailTemplate): Promise<void> {
    const mailOptions = {
      from: `${this.fromName} <${this.fromAddress}>`,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text || this.stripHtml(template.html),
    }

    // If no transporter configured, just log
    if (!this.transporter) {
      console.log('Email would be sent:', JSON.stringify(mailOptions, null, 2))
      return
    }

    try {
      await this.transporter.sendMail(mailOptions)
      console.log(`Email sent to ${to}: ${template.subject}`)
    } catch (error) {
      console.error('Failed to send email:', error)
      // Don't throw - email failures shouldn't break the application
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(data: VerificationEmailData): Promise<void> {
    const template = this.getVerificationTemplate(data)
    await this.sendEmail(data.email, template)
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
    const template = this.getPasswordResetTemplate(data)
    await this.sendEmail(data.email, template)
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmationEmail(data: OrderConfirmationEmailData): Promise<void> {
    const template = this.getOrderConfirmationTemplate(data)
    await this.sendEmail(data.email, template)
  }

  /**
   * Send VPS provisioned email
   */
  async sendVpsProvisionedEmail(data: VpsProvisionedEmailData): Promise<void> {
    const template = this.getVpsProvisionedTemplate(data)
    await this.sendEmail(data.email, template)
  }

  /**
   * Send invoice email
   */
  async sendInvoiceEmail(data: InvoiceEmailData): Promise<void> {
    const template = this.getInvoiceTemplate(data)
    await this.sendEmail(data.email, template)
  }

  // ==================== Email Templates ====================

  private getVerificationTemplate(data: VerificationEmailData): EmailTemplate {
    return {
      subject: 'Verify your email address',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3c83f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; background: #3c83f6; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Cloud Vertice</h1>
            </div>
            <div class="content">
              <h2>Welcome, ${data.firstName}!</h2>
              <p>Thank you for registering with Cloud Vertice. Please verify your email address by clicking the button below:</p>
              <center><a href="${data.verificationUrl}" class="button">Verify Email</a></center>
              <p>Or copy and paste this link into your browser:</p>
              <p>${data.verificationUrl}</p>
              <p>This link will expire in 24 hours.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Cloud Vertice. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }
  }

  private getPasswordResetTemplate(data: PasswordResetEmailData): EmailTemplate {
    return {
      subject: 'Reset your password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3c83f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; background: #3c83f6; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Cloud Vertice</h1>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>Hi ${data.firstName},</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <center><a href="${data.resetUrl}" class="button">Reset Password</a></center>
              <p>Or copy and paste this link into your browser:</p>
              <p>${data.resetUrl}</p>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Cloud Vertice. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }
  }

  private getOrderConfirmationTemplate(data: OrderConfirmationEmailData): EmailTemplate {
    return {
      subject: `Order Confirmation - ${data.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3c83f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; background: #3c83f6; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Cloud Vertice</h1>
            </div>
            <div class="content">
              <h2>Order Confirmed!</h2>
              <p>Hi ${data.firstName},</p>
              <p>Your order has been confirmed. Here are the details:</p>
              <p><strong>Order Number:</strong> ${data.orderNumber}</p>
              <p><strong>Product:</strong> ${data.productName}</p>
              <p><strong>Amount:</strong> $${data.amount.toFixed(2)}</p>
              <center><a href="${data.orderUrl}" class="button">View Order</a></center>
              <p>We'll notify you when your VPS is ready.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Cloud Vertice. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }
  }

  private getVpsProvisionedTemplate(data: VpsProvisionedEmailData): EmailTemplate {
    return {
      subject: `Your VPS is ready! - ${data.vpsName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3c83f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .info-box { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin: 15px 0; }
            .info-box p { margin: 8px 0; }
            .info-box strong { color: #3c83f6; }
            .password-box { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 15px 0; }
            .password-box code { background: #fff; padding: 8px 12px; border-radius: 4px; font-size: 16px; font-weight: bold; color: #d63384; display: inline-block; }
            .button { display: inline-block; padding: 12px 30px; background: #3c83f6; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .warning { color: #856404; background: #fff3cd; padding: 10px; border-radius: 4px; margin: 15px 0; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Cloud Vertice</h1>
            </div>
            <div class="content">
              <h2>Your VPS is Ready!</h2>
              <p>Hi <strong>${data.firstName}</strong>,</p>
              <p>Your VPS <strong>${data.vpsName}</strong> has been provisioned and is ready to use.</p>

              <div class="info-box">
                <p><strong>Server Details:</strong></p>
                <p>IP Address: <code>${data.ipAddress}</code></p>
                <p>Region: ${data.region}</p>
              </div>

              <div class="password-box">
                <p><strong>Root Password:</strong></p>
                <code>${data.rootPassword}</code>
                <div class="warning">
                  ⚠️ Save this password now! You won't be able to see it in future emails for security reasons.
                </div>
              </div>

              <p><strong>Connection Instructions:</strong></p>
              <p style="font-size: 14px; font-family: monospace; background: #f0f0f0; padding: 10px; border-radius: 4px;">
                ssh root@${data.ipAddress}
              </p>

              <center><a href="${data.dashboardUrl}" class="button">Go to Dashboard</a></center>

              <p>You can also manage your VPS from your dashboard where you can start, stop, restart, and view more details.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Cloud Vertice. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }
  }

  private getInvoiceTemplate(data: InvoiceEmailData): EmailTemplate {
    const dueDateStr = data.dueDate.toLocaleDateString()
    return {
      subject: `Invoice ${data.invoiceNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3c83f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; background: #3c83f6; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Cloud Vertice</h1>
            </div>
            <div class="content">
              <h2>Invoice ${data.invoiceNumber}</h2>
              <p>Hi ${data.firstName},</p>
              <p>A new invoice is available:</p>
              <p><strong>Amount:</strong> $${data.amount.toFixed(2)}</p>
              <p><strong>Due Date:</strong> ${dueDateStr}</p>
              <center><a href="${data.invoiceUrl}" class="button">View Invoice</a></center>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Cloud Vertice. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }
  }

  /**
   * Strip HTML tags (for text version)
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '')
  }
}

export const emailService = new EmailService()
