'use strict';

/**
 * core/errorHandler/index.js
 * Centralized error handling with custom error classes.
 * Produces GraphQL-compatible error responses.
 */

const { createLogger } = require('../logger');
const logger = createLogger('core:errorHandler');

// ─── Custom Error Classes ────────────────────────────────────────────────────

class AppError extends Error {
  /**
   * @param {string} message
   * @param {string} code - Machine-readable error code
   * @param {number} statusCode - HTTP status equivalent
   */
  constructor(message, code = 'INTERNAL_ERROR', statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  /**
   * @param {string} message
   * @param {object[]} [details] - Array of field-level validation errors
   */
  constructor(message, details = []) {
    super(message, 'VALIDATION_ERROR', 400);
    this.details = details;
  }
}

class AuthError extends AppError {
  constructor(message = 'Authentication required', code = 'UNAUTHENTICATED') {
    super(message, code, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 'FORBIDDEN', 403);
  }
}

class NotFoundError extends AppError {
  /**
   * @param {string} resource - e.g. 'User', 'Loan'
   * @param {string} [id]
   */
  constructor(resource = 'Resource', id = '') {
    const msg = id ? `${resource} with ID '${id}' not found` : `${resource} not found`;
    super(msg, 'NOT_FOUND', 404);
    this.resource = resource;
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 'CONFLICT', 409);
  }
}

// ─── Error Formatter ─────────────────────────────────────────────────────────

/**
 * Translate any thrown error into a structured GraphQL-compatible error object.
 * Logs all errors with appropriate severity.
 *
 * @param {Error} err - The caught error
 * @returns {{ message: string, extensions: { code: string, statusCode: number, details?: any } }}
 */
function handleError(err) {
  // Known application errors — log at warn level
  if (err instanceof AppError) {
    logger.warn('Application error', {
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
      ...(err.details ? { details: err.details } : {}),
    });

    return {
      message: err.message,
      extensions: {
        code: err.code,
        statusCode: err.statusCode,
        ...(err instanceof ValidationError ? { details: err.details } : {}),
      },
    };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue?.[field];
    logger.warn('Duplicate key error', { field, value });
    return {
      message: `${field} '${value}' already exists`,
      extensions: { code: 'CONFLICT', statusCode: 409 },
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError' && err.errors) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    logger.warn('Mongoose validation error', { details });
    return {
      message: 'Validation failed',
      extensions: { code: 'VALIDATION_ERROR', statusCode: 400, details },
    };
  }

  // Mongoose cast error (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    logger.warn('Mongoose cast error', { path: err.path, value: err.value });
    return {
      message: `Invalid value for field '${err.path}'`,
      extensions: { code: 'VALIDATION_ERROR', statusCode: 400 },
    };
  }

  // JWT / auth errors passed as plain objects
  if (err.code === 'MISSING_TOKEN' || err.code === 'TOKEN_EXPIRED' || err.code === 'INVALID_SIGNATURE') {
    logger.warn('Auth error', { code: err.code, message: err.message });
    return {
      message: err.message,
      extensions: { code: err.code, statusCode: 401 },
    };
  }

  // Unknown / internal errors — log at error level, hide internals from client
  logger.error('Unhandled error', {
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  return {
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    extensions: { code: 'INTERNAL_ERROR', statusCode: 500 },
  };
}

/**
 * Wrap a Lambda/resolver handler with centralized error handling.
 * Re-throws as a formatted error so AppSync returns proper error shape.
 *
 * @param {Function} fn - Async handler function
 * @returns {Function}
 */
function withErrorHandler(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      const formatted = handleError(err);
      const error = new Error(formatted.message);
      error.extensions = formatted.extensions;
      throw error;
    }
  };
}

module.exports = {
  AppError,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  handleError,
  withErrorHandler,
};
