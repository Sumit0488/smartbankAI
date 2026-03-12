/**
 * scripts/generate-test-token.js
 * Generates a signed JWT token for local API testing (no Cognito needed).
 *
 * Usage:
 *   node scripts/generate-test-token.js                        → USER token  (test-user-001)
 *   node scripts/generate-test-token.js admin                  → ADMIN token (test-admin-001)
 *   node scripts/generate-test-token.js <userId> <role> <email>→ custom token
 *
 * Paste the printed token as:  Authorization: Bearer <token>
 */

'use strict';

require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'smartbank_fallback_secret';
const JWT_EXPIRY = process.env.JWT_EXPIRES_IN || '7d';

const isAdmin  = process.argv[2] === 'admin';
const userId   = (!isAdmin && process.argv[2]) ? process.argv[2] : (isAdmin ? 'test-admin-001' : 'test-user-001');
const role     = process.argv[3] || (isAdmin ? 'ADMIN' : 'USER');
const email    = process.argv[4] || (role === 'ADMIN' ? 'admin@smartbankai.com' : 'user@smartbankai.com');

// Payload shape matches server.js context parser (and loginUser resolver)
const payload = {
  sub:           userId,
  username:      userId,
  email,
  'custom:role': role,
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

console.log('\n══════════════════════════════════════════════════════════════════');
console.log(' SmartBankAI — Signed Test JWT Token');
console.log('══════════════════════════════════════════════════════════════════');
console.log(` Role    : ${role}`);
console.log(` UserId  : ${userId}`);
console.log(` Email   : ${email}`);
console.log(` Expiry  : ${JWT_EXPIRY}`);
console.log('──────────────────────────────────────────────────────────────────');
console.log(' Copy this header value:\n');
console.log(`Bearer ${token}`);
console.log('\n──────────────────────────────────────────────────────────────────');
console.log(' Apollo Sandbox → Headers tab (paste as-is):');
console.log(JSON.stringify({ Authorization: `Bearer ${token}` }, null, 2));
console.log('══════════════════════════════════════════════════════════════════\n');
