/**
 * Winston Logger Configuration for Email System
 * 
 * Provides structured logging with file rotation and email masking
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Mask email addresses in log messages for privacy
 * @param {string} message - Log message
 * @returns {string} Message with masked emails
 */
function maskEmail(message) {
  if (!message || typeof message !== 'string') {
    return message;
  }

  // Regex to match email addresses
  const emailRegex = /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  
  return message.replace(emailRegex, (match, localPart, domain) => {
    // Keep first 2 characters of local part and first character of domain
    const maskedLocal = localPart.length > 2 
      ? localPart.substring(0, 2) + '***' 
      : '***';
    const maskedDomain = domain.charAt(0) + '***';
    return `${maskedLocal}@${maskedDomain}`;
  });
}

/**
 * Custom format to mask sensitive data
 */
const maskSensitiveData = winston.format((info) => {
  // Mask email in message
  if (info.message) {
    info.message = maskEmail(info.message);
  }

  // Mask email in metadata
  if (info.email) {
    info.email = maskEmail(info.email);
  }

  if (info.recipient) {
    info.recipient = maskEmail(info.recipient);
  }

  return info;
});

/**
 * Create Winston logger instance
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    maskSensitiveData(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'email-system' },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'email-error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Combined logs
    new winston.transports.File({
      filename: path.join(logsDir, 'email-combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

/**
 * Log email sent successfully
 */
logger.emailSent = (emailId, recipient, subject, messageId) => {
  logger.info('Email sent successfully', {
    emailId,
    recipient,
    subject,
    messageId,
    event: 'EMAIL_SENT',
  });
};

/**
 * Log email failed
 */
logger.emailFailed = (emailId, recipient, subject, error, attempts) => {
  logger.error('Email failed to send', {
    emailId,
    recipient,
    subject,
    error: error.message,
    errorCode: error.code,
    attempts,
    event: 'EMAIL_FAILED',
  });
};

/**
 * Log email retry scheduled
 */
logger.emailRetry = (emailId, recipient, attempts, nextRetryAt) => {
  logger.warn('Email retry scheduled', {
    emailId,
    recipient,
    attempts,
    nextRetryAt,
    event: 'EMAIL_RETRY',
  });
};

/**
 * Log email queued
 */
logger.emailQueued = (emailId, recipient, subject, userId) => {
  logger.info('Email queued', {
    emailId,
    recipient,
    subject,
    userId,
    event: 'EMAIL_QUEUED',
  });
};

/**
 * Log worker started
 */
logger.workerStarted = () => {
  logger.info('Email worker started', {
    event: 'WORKER_STARTED',
  });
};

/**
 * Log worker stopped
 */
logger.workerStopped = () => {
  logger.info('Email worker stopped', {
    event: 'WORKER_STOPPED',
  });
};

/**
 * Log rate limit exceeded
 */
logger.rateLimitExceeded = (userId, limit, count) => {
  logger.warn('Rate limit exceeded', {
    userId,
    limit,
    count,
    event: 'RATE_LIMIT_EXCEEDED',
  });
};

module.exports = logger;
module.exports.maskEmail = maskEmail;
