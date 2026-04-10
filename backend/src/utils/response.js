'use strict';

/**
 * src/utils/response.js
 * Standardized response formatter for GraphQL resolvers.
 */

/**
 * Build a successful response envelope
 * @param {any} data - Payload to return
 * @param {string} [message] - Optional human-readable message
 * @returns {{ success: true, message: string, data: any }}
 */
function successResponse(data, message = 'Success') {
  return { success: true, message, data };
}

/**
 * Build an error response envelope (for non-GraphQL contexts)
 * @param {string} message - Human-readable error message
 * @param {string} [code] - Machine-readable error code
 * @param {number} [statusCode] - HTTP status equivalent
 * @param {any} [details] - Additional error details
 * @returns {{ success: false, message: string, error: object }}
 */
function errorResponse(message, code = 'ERROR', statusCode = 500, details = null) {
  const error = { code, statusCode };
  if (details) error.details = details;
  return { success: false, message, error };
}

/**
 * Build a paginated list response
 * @param {any[]} items - Array of result items
 * @param {number} total - Total count of matching records
 * @param {number} page - Current page number (1-based)
 * @param {number} limit - Items per page
 * @returns {{ items: any[], total: number, page: number, limit: number, totalPages: number, hasNextPage: boolean, hasPrevPage: boolean }}
 */
function paginatedResponse(items, total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  return {
    items,
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Build a delete result response
 * @param {boolean} success
 * @param {string} [message]
 * @returns {{ success: boolean, message: string }}
 */
function deleteResponse(success, message) {
  return {
    success,
    message: message || (success ? 'Deleted successfully' : 'Delete failed'),
  };
}

/**
 * Build a bulk operation result
 * @param {number} affected - Number of records affected
 * @param {string} [message]
 * @returns {{ success: boolean, affected: number, message: string }}
 */
function bulkResponse(affected, message) {
  return {
    success: affected > 0,
    affected,
    message: message || `${affected} record(s) affected`,
  };
}

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
  deleteResponse,
  bulkResponse,
};
