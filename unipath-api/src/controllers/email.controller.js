/**
 * Email Controller
 * 
 * Provides monitoring and statistics endpoints for the email system
 */

const { PrismaClient } = require('@prisma/client');
const rateLimiter = require('../services/rate-limiter');
const emailWorker = require('../services/email.worker');

const prisma = new PrismaClient();

/**
 * GET /api/email/health
 * Health check endpoint for email system
 * Returns queue size, worker status, and recent statistics
 */
const getEmailHealth = async (req, res) => {
  try {
    // Get queue statistics
    const queueStats = await rateLimiter.getQueueStats();

    // Get statistics for last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const [sentCount, failedCount, queuedCount, processingCount] = await Promise.all([
      prisma.emailDelivery.count({
        where: {
          status: 'SENT',
          sentAt: { gte: twentyFourHoursAgo },
        },
      }),
      prisma.emailDelivery.count({
        where: {
          status: 'FAILED',
          lastAttemptAt: { gte: twentyFourHoursAgo },
        },
      }),
      prisma.emailDelivery.count({
        where: { status: 'QUEUED' },
      }),
      prisma.emailDelivery.count({
        where: { status: 'PROCESSING' },
      }),
    ]);

    // Get unresolved alerts
    const alerts = await prisma.systemAlert.findMany({
      where: {
        resolved: false,
        type: { in: ['HIGH_FAILURE_RATE', 'QUEUE_OVERLOAD', 'SMTP_ERROR', 'DELIVERY_ISSUE'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Calculate failure rate
    const totalLast24h = sentCount + failedCount;
    const failureRate = totalLast24h > 0 ? (failedCount / totalLast24h) * 100 : 0;

    // Determine overall health status
    let status = 'healthy';
    if (failureRate > 20 || queueStats.isOverloaded) {
      status = 'critical';
    } else if (failureRate > 10 || queueStats.queued > 100) {
      status = 'warning';
    }

    res.status(200).json({
      status,
      timestamp: new Date().toISOString(),
      worker: {
        running: emailWorker.cronJob !== null,
        isProcessing: emailWorker.isProcessing,
      },
      queue: {
        queued: queuedCount,
        processing: processingCount,
        size: queuedCount + processingCount,
        threshold: queueStats.alertThreshold,
        isOverloaded: queueStats.isOverloaded,
      },
      stats24h: {
        sent: sentCount,
        failed: failedCount,
        total: totalLast24h,
        failureRate: parseFloat(failureRate.toFixed(2)),
      },
      alerts: alerts.map(alert => ({
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        createdAt: alert.createdAt,
      })),
    });
  } catch (error) {
    console.error('[EmailController] Error getting health:', error);
    res.status(500).json({ 
      error: 'Failed to get email system health',
      message: error.message,
    });
  }
};

/**
 * GET /api/email/stats
 * Detailed statistics endpoint
 * Query params: period (hour, day, week, month)
 */
const getEmailStats = async (req, res) => {
  try {
    const { period = 'day' } = req.query;

    // Calculate time range based on period
    let startDate;
    switch (period) {
      case 'hour':
        startDate = new Date(Date.now() - 60 * 60 * 1000);
        break;
      case 'day':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }

    // Get counts by status
    const [sentCount, failedCount, queuedCount, processingCount, pendingCount] = await Promise.all([
      prisma.emailDelivery.count({
        where: {
          status: 'SENT',
          sentAt: { gte: startDate },
        },
      }),
      prisma.emailDelivery.count({
        where: {
          status: 'FAILED',
          createdAt: { gte: startDate },
        },
      }),
      prisma.emailDelivery.count({
        where: {
          status: 'QUEUED',
          createdAt: { gte: startDate },
        },
      }),
      prisma.emailDelivery.count({
        where: {
          status: 'PROCESSING',
          createdAt: { gte: startDate },
        },
      }),
      prisma.emailDelivery.count({
        where: {
          status: 'PENDING',
          createdAt: { gte: startDate },
        },
      }),
    ]);

    const total = sentCount + failedCount + queuedCount + processingCount + pendingCount;

    // Calculate average delivery time for sent emails
    const sentEmails = await prisma.emailDelivery.findMany({
      where: {
        status: 'SENT',
        sentAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        sentAt: true,
      },
    });

    let avgDeliveryTime = 0;
    if (sentEmails.length > 0) {
      const totalDeliveryTime = sentEmails.reduce((sum, email) => {
        const deliveryTime = email.sentAt.getTime() - email.createdAt.getTime();
        return sum + deliveryTime;
      }, 0);
      avgDeliveryTime = Math.round(totalDeliveryTime / sentEmails.length / 1000); // in seconds
    }

    // Calculate failure rate
    const failureRate = total > 0 ? (failedCount / total) * 100 : 0;

    // Get top failure reasons
    const failedEmails = await prisma.emailDelivery.findMany({
      where: {
        status: 'FAILED',
        createdAt: { gte: startDate },
      },
      select: {
        errorMessage: true,
        smtpCode: true,
      },
    });

    const errorCounts = {};
    failedEmails.forEach(email => {
      const key = email.smtpCode || 'Unknown';
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });

    const topErrors = Object.entries(errorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([code, count]) => ({ code, count }));

    res.status(200).json({
      period,
      startDate,
      endDate: new Date(),
      total,
      byStatus: {
        sent: sentCount,
        failed: failedCount,
        queued: queuedCount,
        processing: processingCount,
        pending: pendingCount,
      },
      metrics: {
        failureRate: parseFloat(failureRate.toFixed(2)),
        avgDeliveryTime: avgDeliveryTime, // in seconds
        successRate: parseFloat((100 - failureRate).toFixed(2)),
      },
      topErrors,
    });
  } catch (error) {
    console.error('[EmailController] Error getting stats:', error);
    res.status(500).json({ 
      error: 'Failed to get email statistics',
      message: error.message,
    });
  }
};

module.exports = {
  getEmailHealth,
  getEmailStats,
};
