'use strict';

/**
 * utils/authGuard.js
 * Lightweight authorization helpers for GraphQL resolvers.
 *
 * Usage (new resolvers using context.user):
 *   const { requireAuth, requireAdmin } = require('../../utils/authGuard');
 *   const user = requireAuth(context);   // throws if not logged in
 *   requireAdmin(context);               // throws if not ADMIN
 *
 * Also works with legacy context.identity via extractIdentity() shape.
 */

/**
 * Extract the active user from context.
 * Supports both context.user (new shape) and context.identity (legacy shape).
 * @param {object} context - Apollo GraphQL context
 * @returns {{ userId, name, email, role }}
 */
function getUser(context) {
  // Prefer the new context.user set by graphql/context.js
  if (context.user) return context.user;

  // Fall back to legacy context.identity (Cognito/AppSync shape)
  const id = context.identity;
  if (id) {
    return {
      userId: id.username || id.sub,
      name:   id.claims?.name   || '',
      email:  id.claims?.email  || '',
      role:   id.claims?.['custom:role'] || 'USER',
    };
  }

  return null;
}

/**
 * Require authentication. Throws if the request has no valid token.
 * @param {object} context - Apollo GraphQL context
 * @returns {{ userId, name, email, role }} The current user
 */
function requireAuth(context) {
  const user = getUser(context);
  if (!user || !user.userId) {
    const err = new Error('Authentication required. Please login and include Authorization: Bearer <token>.');
    err.extensions = { code: 'UNAUTHENTICATED', statusCode: 401 };
    throw err;
  }
  return user;
}

/**
 * Require ADMIN role. Throws if not authenticated or not an admin.
 * @param {object} context - Apollo GraphQL context
 * @returns {{ userId, name, email, role }} The current admin user
 */
function requireAdmin(context) {
  const user = requireAuth(context);
  if (user.role !== 'ADMIN') {
    const err = new Error('Admin access required. This operation is restricted to administrators.');
    err.extensions = { code: 'FORBIDDEN', statusCode: 403 };
    throw err;
  }
  return user;
}

/**
 * Require ownership OR admin role.
 * Throws if the current user is neither the owner nor an admin.
 * @param {object} context
 * @param {string} ownerUserId - The userId field on the resource
 * @returns {{ userId, name, email, role }}
 */
function requireOwnerOrAdmin(context, ownerUserId) {
  const user = requireAuth(context);
  if (user.role !== 'ADMIN' && user.userId !== ownerUserId) {
    const err = new Error('Access denied. You can only access your own resources.');
    err.extensions = { code: 'FORBIDDEN', statusCode: 403 };
    throw err;
  }
  return user;
}

module.exports = { requireAuth, requireAdmin, requireOwnerOrAdmin, getUser };
