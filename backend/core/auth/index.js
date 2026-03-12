'use strict';

/**
 * core/auth/index.js
 * AWS Cognito JWT authentication helper.
 * Verifies tokens using Cognito JWKS endpoint and extracts user identity.
 */

const https = require('https');
const { createLogger } = require('../logger');

const logger = createLogger('core:auth');

// Cache JWKS keys to avoid fetching on every request
let cachedKeys = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const REGION = process.env.AWS_REGION || 'ap-south-1';
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';

/**
 * Fetch JWKS from Cognito
 * @returns {Promise<object>} JWKS key set
 */
async function fetchJWKS() {
  if (cachedKeys && Date.now() < cacheExpiry) {
    return cachedKeys;
  }

  const url = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json`;

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          cachedKeys = parsed;
          cacheExpiry = Date.now() + CACHE_TTL_MS;
          resolve(parsed);
        } catch (e) {
          reject(new Error('Failed to parse JWKS response'));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Base64url decode
 * @param {string} str
 * @returns {Buffer}
 */
function base64UrlDecode(str) {
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

/**
 * Decode JWT without verifying signature (for header extraction)
 * @param {string} token
 * @returns {{ header: object, payload: object, signature: string }}
 */
function decodeJWT(token) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }
  const header = JSON.parse(base64UrlDecode(parts[0]).toString('utf8'));
  const payload = JSON.parse(base64UrlDecode(parts[1]).toString('utf8'));
  return { header, payload, signature: parts[2], raw: token };
}

/**
 * Convert a JWK to PEM format for crypto verification
 * @param {object} jwk
 * @returns {string} PEM public key
 */
function jwkToPem(jwk) {
  // For RSA keys used by Cognito
  const crypto = require('crypto');
  const key = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  return key.export({ type: 'spki', format: 'pem' });
}

/**
 * Verify a JWT token against Cognito JWKS
 * @param {string} token - Raw JWT token string
 * @returns {Promise<object>} Decoded and verified payload
 */
async function verifyToken(token) {
  if (!token) {
    throw Object.assign(new Error('No token provided'), { code: 'MISSING_TOKEN', statusCode: 401 });
  }

  const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

  let decoded;
  try {
    decoded = decodeJWT(cleanToken);
  } catch (e) {
    throw Object.assign(new Error('Malformed token'), { code: 'MALFORMED_TOKEN', statusCode: 401 });
  }

  const { header, payload } = decoded;

  // Check expiry
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw Object.assign(new Error('Token has expired'), { code: 'TOKEN_EXPIRED', statusCode: 401 });
  }

  // Fetch JWKS and find matching key
  const jwks = await fetchJWKS();
  const key = jwks.keys.find((k) => k.kid === header.kid);
  if (!key) {
    throw Object.assign(new Error('Token signing key not found'), { code: 'INVALID_KEY', statusCode: 401 });
  }

  // Verify signature
  const crypto = require('crypto');
  const pem = jwkToPem(key);
  const parts = cleanToken.split('.');
  const signatureInput = `${parts[0]}.${parts[1]}`;
  const signature = base64UrlDecode(parts[2]);

  const verify = crypto.createVerify('SHA256');
  verify.update(signatureInput);
  const isValid = verify.verify(pem, signature);

  if (!isValid) {
    throw Object.assign(new Error('Invalid token signature'), { code: 'INVALID_SIGNATURE', statusCode: 401 });
  }

  // Validate issuer
  const expectedIssuer = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;
  if (payload.iss !== expectedIssuer) {
    throw Object.assign(new Error('Token issuer mismatch'), { code: 'INVALID_ISSUER', statusCode: 401 });
  }

  logger.info('Token verified successfully', { sub: payload.sub, email: payload.email });
  return payload;
}

/**
 * Extract and verify auth token from AppSync Lambda event
 * @param {object} event - AppSync Lambda event
 * @returns {Promise<object>} Verified user payload
 */
async function requireAuth(event) {
  const token =
    (event.request && event.request.headers && event.request.headers.authorization) ||
    (event.identity && event.identity.token) ||
    (event.headers && (event.headers.Authorization || event.headers.authorization));

  if (!token) {
    throw Object.assign(new Error('Authentication required'), { code: 'UNAUTHENTICATED', statusCode: 401 });
  }

  return verifyToken(token);
}

/**
 * Require admin role — verifies token and checks custom:role claim
 * @param {object} event - AppSync Lambda event
 * @returns {Promise<object>} Verified admin user payload
 */
async function requireAdmin(event) {
  const user = await requireAuth(event);
  const role = user['custom:role'] || user['cognito:groups']?.[0] || user.role;

  if (role !== 'ADMIN') {
    logger.warn('Admin access denied', { sub: user.sub, role });
    throw Object.assign(new Error('Admin access required'), { code: 'FORBIDDEN', statusCode: 403 });
  }

  return user;
}

/**
 * Extract user info from AppSync identity (when using Cognito auth mode)
 * @param {object} identity - AppSync identity object
 * @returns {{ userId: string, email: string, role: string, sub: string }}
 */
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

module.exports = { verifyToken, requireAuth, requireAdmin, extractIdentity, decodeJWT };
