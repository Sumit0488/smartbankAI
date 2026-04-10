'use strict';
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'smartbank_fallback_secret';

function extractIdentity(identity) {
  if (!identity) return null;
  return {
    sub: identity.sub,
    userId: identity.username || identity.sub,
    email: identity.claims?.email,
    role: identity.claims?.['custom:role'] || 'USER',
    groups: identity.groups || [],
  };
}

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

module.exports = { extractIdentity, generateToken };
