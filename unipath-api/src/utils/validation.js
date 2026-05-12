/**
 * Validation Utilities for Email System
 * 
 * Provides validation functions for emails, parameters, and input sanitization
 */

/**
 * Validate email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate required parameters are present and non-empty
 * @param {Object} params - Object containing parameters to validate
 * @param {string[]} requiredFields - Array of required field names (optional, validates all if not provided)
 * @throws {Error} If validation fails
 */
function validateParams(params, requiredFields = null) {
  if (!params || typeof params !== 'object') {
    throw new Error('Parameters must be an object');
  }

  const fieldsToCheck = requiredFields || Object.keys(params);

  for (const field of fieldsToCheck) {
    const value = params[field];
    
    if (value === undefined || value === null || value === '') {
      throw new Error(`Missing required parameter: ${field}`);
    }

    // Additional type checks
    if (typeof value === 'string' && value.trim() === '') {
      throw new Error(`Parameter cannot be empty: ${field}`);
    }
  }
}

/**
 * Sanitize input to prevent XSS attacks
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    return input;
  }

  // Replace dangerous HTML characters
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate attachment object structure
 * @param {Object} attachment - Attachment object to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateAttachment(attachment) {
  if (!attachment || typeof attachment !== 'object') {
    return false;
  }

  // Required fields for attachment
  const requiredFields = ['filename', 'path'];
  
  for (const field of requiredFields) {
    if (!attachment[field] || typeof attachment[field] !== 'string') {
      return false;
    }
  }

  return true;
}

/**
 * Validate array of attachments
 * @param {Array} attachments - Array of attachment objects
 * @returns {boolean} True if all valid, false otherwise
 */
function validateAttachments(attachments) {
  if (!Array.isArray(attachments)) {
    return false;
  }

  return attachments.every(validateAttachment);
}

/**
 * Validate userId format (UUID)
 * @param {string} userId - User ID to validate
 * @returns {boolean} True if valid UUID, false otherwise
 */
function validateUserId(userId) {
  if (!userId || typeof userId !== 'string') {
    return false;
  }

  // UUID v4 regex
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  return uuidRegex.test(userId);
}

module.exports = {
  validateEmail,
  validateParams,
  sanitizeInput,
  validateAttachment,
  validateAttachments,
  validateUserId,
};
