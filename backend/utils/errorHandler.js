'use strict';

/**
 * utils/errorHandler.js
 * Simple error formatter for GraphQL resolvers.
 *
 * Returns a consistent shape:
 *   { message: string, code: string }
 *
 * Usage:
 *   const { formatError, throwGqlError } = require('../../utils/errorHandler');
 *   throw throwGqlError('Not found', 'NOT_FOUND', 404);
 */

// ─── Known error codes ─────────────────────────────────────────────────────────

const ERROR_CODES = {
  UNAUTHENTICATED:   'UNAUTHENTICATED',
  FORBIDDEN:         'FORBIDDEN',
  NOT_FOUND:         'NOT_FOUND',
  CONFLICT:          'CONFLICT',
  VALIDATION_ERROR:  'VALIDATION_ERROR',
  INTERNAL_ERROR:    'INTERNAL_ERROR',
};

// ─── formatError ──────────────────────────────────────────────────────────────

/**
 * Normalise any thrown error into { message, code, statusCode, details? }.
 * @param {Error|unknown} err
 * @returns {{ message: string, code: string, statusCode: number, details?: any[] }}
 */
function formatError(err) {
  // Already formatted by core/errorHandler or authGuard
  if (err.extensions) {
    return {
      message:    err.message,
      code:       err.extensions.code       || ERROR_CODES.INTERNAL_ERROR,
      statusCode: err.extensions.statusCode || 500,
      details:    err.extensions.details,
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError' && err.errors) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return { message: 'Validation failed', code: ERROR_CODES.VALIDATION_ERROR, statusCode: 400, details };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return { message: `Duplicate value for ${field}`, code: ERROR_CODES.CONFLICT, statusCode: 409 };
  }

  // Mongoose cast error (bad ObjectId / type)
  if (err.name === 'CastError') {
    return { message: `Invalid value for ${err.path}`, code: ERROR_CODES.VALIDATION_ERROR, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return { message: 'Invalid token', code: ERROR_CODES.UNAUTHENTICATED, statusCode: 401 };
  }
  if (err.name === 'TokenExpiredError') {
    return { message: 'Token has expired', code: ERROR_CODES.UNAUTHENTICATED, statusCode: 401 };
  }

  // Generic fallback
  return {
    message:    err.message || 'An unexpected error occurred',
    code:       ERROR_CODES.INTERNAL_ERROR,
    statusCode: 500,
  };
}

// ─── throwGqlError ────────────────────────────────────────────────────────────

/**
 * Create and throw a GraphQL-compatible error with extensions.
 * @param {string} message
 * @param {string} [code]
 * @param {number} [statusCode]
 * @param {any[]}  [details]
 */
function throwGqlError(message, code = ERROR_CODES.INTERNAL_ERROR, statusCode = 500, details) {
  const err = new Error(message);
  err.extensions = { code, statusCode, ...(details ? { details } : {}) };
  throw err;
}

/**
 * Wrap an async resolver with automatic error formatting.
 * Useful for new resolvers that don't want boilerplate try/catch.
 *
 * @param {Function} fn - async resolver function
 * @returns {Function}
 */
function withErrorHandler(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      const formatted = formatError(err);
      const gqlErr = new Error(formatted.message);
      gqlErr.extensions = { code: formatted.code, statusCode: formatted.statusCode, details: formatted.details };
      throw gqlErr;
    }
  };
}

module.exports = { formatError, throwGqlError, withErrorHandler, ERROR_CODES };
