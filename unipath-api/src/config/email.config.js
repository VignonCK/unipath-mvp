/**
 * Email System Configuration
 * 
 * Centralizes all email-related configuration and validates environment variables
 */

class EmailConfig {
  constructor() {
    this.validateRequiredVars();
    this.loadConfig();
  }

  /**
   * Validate required environment variables
   */
  validateRequiredVars() {
    const required = [
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASS',
      'SMTP_FROM_EMAIL',
      'SMTP_FROM_NAME',
      'APP_URL',
    ];

    const missing = required.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables for email system: ${missing.join(', ')}\n` +
        'Please check your .env file and ensure all SMTP_* variables are set.'
      );
    }
  }

  /**
   * Load and parse configuration from environment variables
   */
  loadConfig() {
    // SMTP Configuration
    this.smtp = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      from: {
        email: process.env.SMTP_FROM_EMAIL,
        name: process.env.SMTP_FROM_NAME,
      },
    };

    // Application Configuration
    this.app = {
      url: process.env.APP_URL,
      academicYear: process.env.ACADEMIC_YEAR || new Date().getFullYear().toString(),
    };

    // Queue Configuration
    this.queue = {
      enabled: process.env.EMAIL_QUEUE_ENABLED !== 'false', // Default to true
      retryDelays: this.parseRetryDelays(process.env.EMAIL_RETRY_DELAYS),
      rateLimitPerUser: parseInt(process.env.EMAIL_RATE_LIMIT_PER_USER || '10'),
      rateLimitGlobal: parseInt(process.env.EMAIL_RATE_LIMIT_GLOBAL || '100'),
    };

    // Worker Configuration
    this.worker = {
      cronSchedule: '*/10 * * * * *', // Every 10 seconds
      batchSize: 5, // Process 5 emails per cycle
    };
  }

  /**
   * Parse retry delays from comma-separated string
   * @param {string} delaysStr - Comma-separated delays in minutes (e.g., "1,5,15,60,240")
   * @returns {number[]} Array of delays in minutes
   */
  parseRetryDelays(delaysStr) {
    const defaultDelays = [1, 5, 15, 60, 240]; // Default: 1min, 5min, 15min, 1h, 4h

    if (!delaysStr) {
      return defaultDelays;
    }

    try {
      const delays = delaysStr.split(',').map(d => parseInt(d.trim()));
      
      // Validate all delays are positive numbers
      if (delays.some(d => isNaN(d) || d <= 0)) {
        console.warn('Invalid EMAIL_RETRY_DELAYS format, using defaults');
        return defaultDelays;
      }

      return delays;
    } catch (error) {
      console.warn('Error parsing EMAIL_RETRY_DELAYS, using defaults:', error.message);
      return defaultDelays;
    }
  }

  /**
   * Get SMTP transporter configuration for Nodemailer
   */
  getTransporterConfig() {
    return {
      host: this.smtp.host,
      port: this.smtp.port,
      secure: this.smtp.secure,
      auth: this.smtp.auth,
    };
  }

  /**
   * Get formatted "from" address for emails
   */
  getFromAddress() {
    return `${this.smtp.from.name} <${this.smtp.from.email}>`;
  }

  /**
   * Check if queue is enabled
   */
  isQueueEnabled() {
    return this.queue.enabled;
  }

  /**
   * Get retry delay for a given attempt number
   * @param {number} attemptNumber - Current attempt number (0-indexed)
   * @returns {number|null} Delay in minutes, or null if max attempts reached
   */
  getRetryDelay(attemptNumber) {
    if (attemptNumber >= this.queue.retryDelays.length) {
      return null; // Max attempts reached
    }
    return this.queue.retryDelays[attemptNumber];
  }

  /**
   * Get maximum number of retry attempts
   */
  getMaxRetries() {
    return this.queue.retryDelays.length;
  }

  /**
   * Print configuration summary (for debugging)
   */
  printSummary() {
    console.log('[EmailConfig] Configuration loaded:');
    console.log(`  SMTP Host: ${this.smtp.host}:${this.smtp.port}`);
    console.log(`  SMTP User: ${this.smtp.auth.user}`);
    console.log(`  From: ${this.getFromAddress()}`);
    console.log(`  Queue Enabled: ${this.queue.enabled}`);
    console.log(`  Rate Limit (per user): ${this.queue.rateLimitPerUser}/hour`);
    console.log(`  Rate Limit (global): ${this.queue.rateLimitGlobal}/hour`);
    console.log(`  Max Retries: ${this.getMaxRetries()}`);
    console.log(`  Retry Delays: ${this.queue.retryDelays.join(', ')} minutes`);
  }
}

// Export singleton instance
module.exports = new EmailConfig();
