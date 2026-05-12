/**
 * Email Worker Service
 * 
 * Processes the email queue using a cron job integrated into the Express process
 * Runs every 10 seconds to send queued emails with retry logic
 */

const cron = require('node-cron');
const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');
const emailConfig = require('../config/email.config');
const logger = require('../config/logger');

const prisma = new PrismaClient();

class EmailWorker {
  constructor() {
    // Create SMTP transporter
    this.transporter = nodemailer.createTransport(emailConfig.getTransporterConfig());
    
    this.isProcessing = false;
    this.cronJob = null;
  }

  /**
   * Start the email worker
   */
  start() {
    logger.workerStarted();
    console.log('[EmailWorker] Starting email worker...');

    // Run every 10 seconds
    this.cronJob = cron.schedule('*/10 * * * * *', async () => {
      if (this.isProcessing) {
        console.log('[EmailWorker] Already processing, skipping this cycle');
        return;
      }

      this.isProcessing = true;
      try {
        await this.processQueue();
      } catch (error) {
        console.error('[EmailWorker] Error processing queue:', error);
        logger.error('Queue processing error', { error: error.message, stack: error.stack });
      } finally {
        this.isProcessing = false;
      }
    });

    console.log('[EmailWorker] Email worker started successfully');
  }

  /**
   * Stop the email worker gracefully
   */
  stop() {
    logger.workerStopped();
    console.log('[EmailWorker] Stopping email worker...');
    
    if (this.cronJob) {
      this.cronJob.stop();
    }
    
    console.log('[EmailWorker] Email worker stopped');
  }

  /**
   * Process the email queue
   */
  async processQueue() {
    // Fetch up to 5 emails to process
    // Note: This query is not fully atomic. For multi-instance deployments,
    // use distributed locks (Redis, PG advisory locks) in production.
    const emails = await prisma.emailDelivery.findMany({
      where: {
        OR: [
          { status: 'QUEUED' },
          {
            status: 'FAILED',
            nextRetryAt: { lte: new Date() },  // Retry scheduled in the past or now
          },
        ],
      },
      take: 5,
      orderBy: { createdAt: 'asc' },
    });

    if (emails.length === 0) {
      return;
    }

    console.log(`[EmailWorker] Processing ${emails.length} emails`);

    // Process each email (in parallel for efficiency)
    await Promise.allSettled(
      emails.map(email => this.processEmail(email))
    );
  }

  /**
   * Process a single email
   * @param {Object} email - Email record from database
   */
  async processEmail(email) {
    try {
      // 1. Mark email as PROCESSING atomically (optimistic lock)
      // This prevents double processing within the same instance
      const updated = await prisma.emailDelivery.updateMany({
        where: {
          id: email.id,
          status: { in: ['QUEUED', 'FAILED'] },  // Only if not already processing
        },
        data: { status: 'PROCESSING' },
      });

      // If no rows updated, email is already being processed by another cycle
      if (updated.count === 0) {
        console.log(`[EmailWorker] Email ${email.id} already being processed, skipping`);
        return;
      }

      // 2. Prepare email content
      const mailOptions = {
        from: emailConfig.getFromAddress(),
        to: email.recipient,
        subject: email.subject,
        html: email.htmlBody || '<p>Email content</p>',
        text: email.textBody || '',
      };

      // 3. Add attachments if present
      if (email.attachments && Array.isArray(email.attachments)) {
        mailOptions.attachments = email.attachments;
      }

      // 4. Send the email
      const info = await this.transporter.sendMail(mailOptions);

      // 5. Update status to SENT
      await prisma.emailDelivery.update({
        where: { id: email.id },
        data: {
          status: 'SENT',
          messageId: info.messageId,
          sentAt: new Date(),
          attempts: email.attempts + 1,
          lastAttemptAt: new Date(),
          nextRetryAt: null,  // No more retries needed
        },
      });

      logger.emailSent(email.id, email.recipient, email.subject, info.messageId);
      console.log(`[EmailWorker] ✅ Email ${email.id} sent successfully (messageId: ${info.messageId})`);

    } catch (error) {
      console.error(`[EmailWorker] ❌ Error sending email ${email.id}:`, error.message);

      // Calculate next retry
      const nextRetry = this.calculateNextRetry(email.attempts);

      if (nextRetry) {
        // Retry scheduled
        await prisma.emailDelivery.update({
          where: { id: email.id },
          data: {
            status: 'FAILED',
            attempts: email.attempts + 1,
            lastAttemptAt: new Date(),
            nextRetryAt: nextRetry,
            errorMessage: error.message,
            smtpCode: error.code || null,
          },
        });

        logger.emailRetry(email.id, email.recipient, email.attempts + 1, nextRetry);
        console.log(`[EmailWorker] ⚠️ Email ${email.id} failed, retry scheduled at ${nextRetry}`);
      } else {
        // Permanent failure
        await prisma.emailDelivery.update({
          where: { id: email.id },
          data: {
            status: 'FAILED',
            attempts: email.attempts + 1,
            lastAttemptAt: new Date(),
            nextRetryAt: null,
            errorMessage: error.message,
            smtpCode: error.code || null,
          },
        });

        // Create alert for permanent failure
        await prisma.systemAlert.create({
          data: {
            type: 'DELIVERY_ISSUE',
            severity: 'ERROR',
            title: 'Email delivery failed permanently',
            message: `Email ${email.id} to ${email.recipient} failed after ${email.attempts + 1} attempts`,
            data: {
              emailId: email.id,
              recipient: email.recipient,
              subject: email.subject,
              error: error.message,
              smtpCode: error.code,
            },
          },
        });

        logger.emailFailed(email.id, email.recipient, email.subject, error, email.attempts + 1);
        console.error(`[EmailWorker] 🚨 Email ${email.id} failed permanently after ${email.attempts + 1} attempts`);
      }
    }
  }

  /**
   * Calculate next retry time using exponential backoff
   * @param {number} attempts - Current number of attempts
   * @returns {Date|null} Next retry date or null if max attempts reached
   */
  calculateNextRetry(attempts) {
    const maxRetries = emailConfig.getMaxRetries();

    if (attempts >= maxRetries) {
      return null;  // Permanent failure
    }

    const delayMinutes = emailConfig.getRetryDelay(attempts);
    
    if (delayMinutes === null) {
      return null;
    }

    return new Date(Date.now() + delayMinutes * 60 * 1000);
  }
}

// Export singleton instance
module.exports = new EmailWorker();
