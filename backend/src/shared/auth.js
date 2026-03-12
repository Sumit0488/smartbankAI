/**
 * backend/src/shared/auth.js
 * JWT authentication — sign, verify, and Express middleware.
 */

const jwt = require('jsonwebtoken');
const { AuthenticationError } = require('apollo-server-express');

const JWT_SECRET = process.env.JWT_SECRET || 'smartbank_fallback_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ── Token Management ─────────────────────────────────────────────────────────

/**
 * Generate a signed JWT token.
 * @param {{ id: string, email: string, role: string }} payload
 * @returns {string} signed JWT
 */
const signToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verify and decode a JWT token.
 * @param {string} token
 * @returns {{ id: string, email: string, role: string }}
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

// ── GraphQL Context Auth Helper ───────────────────────────────────────────────

/**
 * Extract user from Authorization header for Apollo context.
 * Returns null if not authenticated (public queries still work).
 * @param {import('express').Request} req
 * @returns {{ id: string, email: string, role: string } | null}
 */
const getUserFromRequest = (req) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
};

// ── Authorization Guards ──────────────────────────────────────────────────────

/**
 * Throw if user is not authenticated.
 * Use inside any GraphQL resolver that requires login.
 */
const requireAuth = (context) => {
  if (!context.user) {
    throw new AuthenticationError('You must be logged in to perform this action.');
  }
  return context.user;
};

/**
 * Throw if user is not ADMIN.
 */
const requireAdmin = (context) => {
  const user = requireAuth(context);
  if (user.role !== 'ADMIN') {
    throw new AuthenticationError('Admin access required.');
  }
  return user;
};

module.exports = { signToken, verifyToken, getUserFromRequest, requireAuth, requireAdmin };
