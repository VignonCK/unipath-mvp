/**
 * Rate Limiter Service for Email System
 * 
 * Prevents email abuse by limiting the number of emails per user and globally
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class RateLimiter {
  constructor() {
    // Configuration from environment variables
    this.rateLimitPerUser = parseInt(process.env.EMAIL_RATE_LIMIT_PER_USER || '10');
    this.rateLimitGlobal = parseInt(process.env.EMAIL_RATE_LIMIT_GLOBAL || '100');
    this.queueAlertThreshold = 500;
  }

  /**
   * Check if user has exceeded rate limit
   * @param {string} userId - User ID to check
   * @throws {Error} If rate limit exceeded
   */
  async checkRateLimit(userId) {
    if (!userId) {
      // No rate limiting for emails without userId (e.g., confirmation emails)
      return;
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Check user-specific rate limit
    const userEmailCount = await prisma.emailDelivery.count({
      where: {
        userId,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (userEmailCount >= this.rateLimitPerUser) {
      throw new Error(
        `Rate limit exceeded for user ${userId}. ` +
        `Maximum ${this.rateLimitPerUser} emails per hour allowed. ` +
        `Current count: ${userEmailCount}`
      );
    }

    // Check global rate limit
    const globalEmailCount = await prisma.emailDelivery.count({
      where: {
        createdAt: { gte: oneHourAgo },
      },
    });

    if (globalEmailCount >= this.rateLimitGlobal) {
      throw new Error(
        `Global rate limit exceeded. ` +
        `Maximum ${this.rateLimitGlobal} emails per hour allowed. ` +
        `Current count: ${globalEmailCount}`
      );
    }

    // Check queue size and create alert if needed
    await this.checkQueueSize();
  }

  /**
   * Check queue size and create alert if threshold exceeded
   */
  async checkQueueSize() {
    const queueSize = await prisma.emailDelivery.count({
      where: {
        status: { in: ['QUEUED', 'PROCESSING'] },
      },
    });

    if (queueSize > this.queueAlertThreshold) {
      // Check if alert already exists (avoid duplicate alerts)
      const existingAlert = await prisma.systemAlert.findFirst({
        where: {
          type: 'QUEUE_OVERLOAD',
          resolved: false,
        },
      });

      if (!existingAlert) {
        await prisma.systemAlert.create({
          data: {
            type: 'QUEUE_OVERLOAD',
            severity: 'WARNING',
            title: 'Email Queue Overload',
            message: `Email queue size (${queueSize}) exceeds threshold (${this.queueAlertThreshold})`,
            data: {
              queueSize,
              threshold: this.queueAlertThreshold,
              timestamp: new Date().toISOString(),
            },
          },
        });

        console.warn(`[RateLimiter] Queue overload alert created: ${queueSize} emails in queue`);
      }
    }
  }

  /**
   * Get current rate limit status for a user
   * @param {string} userId - User ID to check
   * @returns {Object} Rate limit status
   */
  async getRateLimitStatus(userId) {
    if (!userId) {
      return {
        userLimit: this.rateLimitPerUser,
        userCount: 0,
        userRemaining: this.rateLimitPerUser,
        globalLimit: this.rateLimitGlobal,
        globalCount: 0,
        globalRemaining: this.rateLimitGlobal,
      };
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const [userEmailCount, globalEmailCount] = await Promise.all([
      prisma.emailDelivery.count({
        where: {
          userId,
          createdAt: { gte: oneHourAgo },
        },
      }),
      prisma.emailDelivery.count({
        where: {
          createdAt: { gte: oneHourAgo },
        },
      }),
    ]);

    return {
      userLimit: this.rateLimitPerUser,
      userCount: userEmailCount,
      userRemaining: Math.max(0, this.rateLimitPerUser - userEmailCount),
      globalLimit: this.rateLimitGlobal,
      globalCount: globalEmailCount,
      globalRemaining: Math.max(0, this.rateLimitGlobal - globalEmailCount),
    };
  }

  /**
   * Get queue statistics
   * @returns {Object} Queue statistics
   */
  async getQueueStats() {
    const [queuedCount, processingCount, failedCount, totalCount] = await Promise.all([
      prisma.emailDelivery.count({ where: { status: 'QUEUED' } }),
      prisma.emailDelivery.count({ where: { status: 'PROCESSING' } }),
      prisma.emailDelivery.count({ where: { status: 'FAILED' } }),
      prisma.emailDelivery.count(),
    ]);

    return {
      queued: queuedCount,
      processing: processingCount,
      failed: failedCount,
      total: totalCount,
      queueSize: queuedCount + processingCount,
      alertThreshold: this.queueAlertThreshold,
      isOverloaded: (queuedCount + processingCount) > this.queueAlertThreshold,
    };
  }
}

// Export singleton instance
module.exports = new RateLimiter();
