'use strict';

/**
 * src/utils/logger.js
 * Structured JSON logger with support for log levels, request IDs, and module context.
 */

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL || 'info'] ?? 1;
const APP_NAME = process.env.APP_NAME || 'SmartBankAI';
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Format a log entry as structured JSON
 * @param {string} level
 * @param {string} module
 * @param {string} message
 * @param {object} [meta]
 * @returns {string}
 */
function formatEntry(level, module, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    app: APP_NAME,
    env: NODE_ENV,
    module,
    message,
    requestId: meta.requestId || undefined,
    ...meta,
  };
  // Remove undefined values
  Object.keys(entry).forEach((k) => entry[k] === undefined && delete entry[k]);
  return JSON.stringify(entry);
}

/**
 * Write log to appropriate stream
 * @param {string} level
 * @param {string} module
 * @param {string} message
 * @param {object} meta
 */
function write(level, module, message, meta) {
  if (LOG_LEVELS[level] < CURRENT_LEVEL) return;
  const line = formatEntry(level, module, message, meta);
  if (level === 'error' || level === 'warn') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
}

/**
 * Create a logger instance bound to a specific module name
 * @param {string} moduleName - e.g. 'utils:auth', 'resolvers:user'
 * @returns {{ debug, info, warn, error, child }}
 */
function createLogger(moduleName) {
  return {
    debug: (message, meta = {}) => write('debug', moduleName, message, meta),
    info:  (message, meta = {}) => write('info',  moduleName, message, meta),
    warn:  (message, meta = {}) => write('warn',  moduleName, message, meta),
    error: (message, meta = {}) => write('error', moduleName, message, meta),

    /**
     * Create a child logger with additional default metadata
     * @param {object} defaultMeta
     * @returns {object}
     */
    child: (defaultMeta = {}) => {
      const childModule = defaultMeta.module
        ? `${moduleName}:${defaultMeta.module}`
        : moduleName;
      const merged = { ...defaultMeta };
      delete merged.module;
      return {
        debug: (msg, m = {}) => write('debug', childModule, msg, { ...merged, ...m }),
        info:  (msg, m = {}) => write('info',  childModule, msg, { ...merged, ...m }),
        warn:  (msg, m = {}) => write('warn',  childModule, msg, { ...merged, ...m }),
        error: (msg, m = {}) => write('error', childModule, msg, { ...merged, ...m }),
      };
    },

    /**
     * Log an incoming event (sanitized)
     * @param {object} event
     */
    logEvent: (event) => {
      const sanitized = { ...event };
      // Remove sensitive fields before logging
      if (sanitized.arguments?.input?.password) sanitized.arguments.input.password = '[REDACTED]';
      if (sanitized.request?.headers?.authorization) sanitized.request.headers.authorization = '[REDACTED]';
      write('debug', moduleName, 'Event received', { event: sanitized });
    },
  };
}

module.exports = { createLogger };
