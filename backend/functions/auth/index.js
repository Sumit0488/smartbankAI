'use strict';

/**
 * functions/auth/index.js
 * Lambda entry point — handles registerUser and loginUser via API_KEY auth.
 * Handler path: functions/auth/index.handler
 *
 * Uses bcrypt + JWT (same as graphql/resolvers/auth.resolver.js).
 * Public mutations — no Cognito token required; AppSync uses API_KEY for these.
 */

const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { connectDB } = require('../../core/db');
const { handleError, ConflictError, AuthError, ValidationError } = require('../../core/errorHandler');
const { validateCreateUser } = require('../../core/validation');
const User = require('../../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'smartbank_fallback_secret';
const JWT_EXPIRY = process.env.JWT_EXPIRES_IN || '7d';

function buildToken(user) {
  return jwt.sign(
    { sub: user.userId, username: user.userId, name: user.name, email: user.email, 'custom:role': user.role || 'USER' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

function sanitize(doc) {
  const obj = { ...doc };
  delete obj.password;
  if (!obj.id && obj._id) obj.id = obj._id.toString();
  return obj;
}

function err(e) {
  const f = handleError(e);
  throw Object.assign(new Error(f.message), { extensions: f.extensions });
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function registerUser(event) {
  try {
    const input = event.arguments?.input || {};
    const data = validateCreateUser({ ...input, role: 'USER' });
    await connectDB();

    const existing = await User.findOne({ email: data.email }).lean();
    if (existing) throw new ConflictError(`Email '${data.email}' is already registered`);

    const passwordHash = await bcrypt.hash(data.password, 12);
    const newUser = await User.create({ ...data, password: passwordHash, userId: uuidv4() });
    const userObj = sanitize(newUser.toObject());
    return { token: buildToken(userObj), user: userObj };
  } catch (e) { err(e); }
}

async function loginUser(event) {
  try {
    const { email, password } = event.arguments || {};
    if (!email || !password) throw new ValidationError('email and password are required');
    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase().trim(), status: { $ne: 'DELETED' } }).select('+password').lean();
    if (!user) throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
    if (user.status === 'INACTIVE') throw new AuthError('Account suspended. Contact support.', 'ACCOUNT_SUSPENDED');

    const userObj = sanitize(user);
    return { token: buildToken(userObj), user: userObj };
  } catch (e) { err(e); }
}

// ─── Router ───────────────────────────────────────────────────────────────────

const HANDLERS = { registerUser, loginUser };

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const field = event.info?.fieldName;
  const handle = HANDLERS[field];
  if (!handle) throw new Error(`AuthHandler: no handler for field "${field}"`);
  return handle(event, context);
};
