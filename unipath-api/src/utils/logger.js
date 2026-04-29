/**
 * Logger simple pour l'application
 * En production, remplacer par Winston ou Pino
 */

const config = require('../config');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

class Logger {
  constructor() {
    this.isDevelopment = config.isDevelopment;
  }

  _log(level, color, ...args) {
    const timestamp = new Date().toISOString();
    const prefix = this.isDevelopment
      ? `${color}[${level}]${colors.reset} ${timestamp}`
      : `[${level}] ${timestamp}`;
    
    console.log(prefix, ...args);
  }

  info(...args) {
    this._log('INFO', colors.blue, ...args);
  }

  success(...args) {
    this._log('SUCCESS', colors.green, ...args);
  }

  warn(...args) {
    this._log('WARN', colors.yellow, ...args);
  }

  error(...args) {
    this._log('ERROR', colors.red, ...args);
  }

  debug(...args) {
    if (this.isDevelopment) {
      this._log('DEBUG', colors.magenta, ...args);
    }
  }
}

module.exports = new Logger();
