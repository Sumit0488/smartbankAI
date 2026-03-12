'use strict';

/**
 * functions/user/index.js
 * Lambda entry point — routes AppSync field calls to the correct user handler.
 * Handler path: functions/user/index.handler
 */

const { extractIdentity } = require('../../core/auth');
const { connectDB } = require('../../core/db');
const { handleError, NotFoundError, ForbiddenError } = require('../../core/errorHandler');
const { validateUpdateUser, validatePagination } = require('../../core/validation');
const { paginatedResponse } = require('../../core/response');
const User = require('../../models/User');

// ─── Shared helpers ───────────────────────────────────────────────────────────

function id(identity) {
  const i = extractIdentity(identity);
  if (!i) throw Object.assign(new Error('Authentication required'), { extensions: { code: 'UNAUTHENTICATED', statusCode: 401 } });
  return i;
}

function err(e) {
  const f = handleError(e);
  throw Object.assign(new Error(f.message), { extensions: f.extensions });
}

// ─── Field handlers ───────────────────────────────────────────────────────────

const HANDLERS = {
  // ── Delegated to individual files ─────────────────────────────────────────
  createUser:    (event, ctx) => require('./createUser').handler(event, ctx),
  getUser:       (event, ctx) => require('./getUser').handler(event, ctx),
  listUsers:     (event, ctx) => require('./listUsers').handler(event, ctx),
  updateUser:    (event, ctx) => require('./updateUser').handler(event, ctx),
  deleteUser:    (event, ctx) => require('./deleteUser').handler(event, ctx),
  softDeleteUser:(event, ctx) => require('./softDeleteUser').handler(event, ctx),

  // ── Auth (registerUser / loginUser) ────────────────────────────────────────
  registerUser: (event, ctx) => require('../auth/index').handler(event, ctx),
  loginUser:    (event, ctx) => require('../auth/index').handler(event, ctx),

  // ── getProfile — return caller's own record ────────────────────────────────
  getProfile: async (event) => {
    try {
      const identity = id(event.identity);
      await connectDB();
      const user = await User.findOne({ userId: identity.userId, status: { $ne: 'DELETED' } }).lean();
      if (!user) throw new NotFoundError('User', identity.userId);
      return user;
    } catch (e) { err(e); }
  },

  // ── updateProfile — update caller's own record ────────────────────────────
  updateProfile: async (event) => {
    try {
      const identity = id(event.identity);
      const data = validateUpdateUser(event.arguments?.input || {});
      await connectDB();
      const user = await User.findOneAndUpdate(
        { userId: identity.userId, status: { $ne: 'DELETED' } },
        { $set: data },
        { new: true, runValidators: true }
      ).lean();
      if (!user) throw new NotFoundError('User', identity.userId);
      return user;
    } catch (e) { err(e); }
  },
};

// ─── Lambda entry point ───────────────────────────────────────────────────────

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const field = event.info?.fieldName;
  const handle = HANDLERS[field];
  if (!handle) throw new Error(`UserHandler: no handler for field "${field}"`);
  return handle(event, context);
};
