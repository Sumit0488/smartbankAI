'use strict';

/**
 * graphql/context.js
 * Builds the Apollo Server request context.
 *
 * Injects into every resolver:
 *   context.identity — AppSync-compatible identity object (used by existing resolvers)
 *   context.user     — { userId, name, email, role } convenience object
 *   context.req      — raw Express request
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'smartbank_fallback_secret';

/**
 * Parse a JWT from Authorization: Bearer <token>
 * 1. First tries jwt.verify() for locally-signed tokens (loginUser/registerUser)
 * 2. Falls back to raw base64-decode for Cognito/external tokens
 */
function parseToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  let payload = null;

  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (_verifyErr) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        payload = JSON.parse(
          Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
        );
      }
    } catch (_decodeErr) {
      // Completely malformed — ignore
    }
  }

  return payload;
}

/**
 * Build the GraphQL context object for every request.
 * @param {{ req: import('express').Request }} param
 */
function buildContext({ req }) {
  const payload = parseToken(req.headers.authorization || '');

  let identity = null;
  let user = null;

  if (payload) {
    // AppSync-compatible identity shape expected by extractIdentity() in core/auth
    identity = {
      sub:      payload.sub,
      username: payload['cognito:username'] || payload.username || payload.sub,
      groups:   payload['cognito:groups'] || [],
      claims: {
        sub:           payload.sub,
        email:         payload.email || '',
        'custom:role': payload['custom:role'] || 'USER',
      },
    };

    // Convenience object for new resolvers — context.user
    user = {
      userId: payload.username || payload.sub,
      name:   payload.name    || '',
      email:  payload.email   || '',
      role:   payload['custom:role'] || 'USER',
    };
  }

  return { req, identity, user };
}

module.exports = buildContext;
