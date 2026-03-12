'use strict';

/**
 * functions/user/listUsers.js
 * Lambda handler: List users with pagination and filters (admin only).
 * Triggered by AppSync Query.listUsers
 */

const { connectDB } = require('../../core/db');
const { createLogger } = require('../../core/logger');
const { handleError, ForbiddenError } = require('../../core/errorHandler');
const { validatePagination } = require('../../core/validation');
const { paginatedResponse } = require('../../core/response');
const { extractIdentity } = require('../../core/auth');

const logger = createLogger('functions:user:listUsers');

let UserModel;
function getModel() {
  if (UserModel) return UserModel;
  const mongoose = require('mongoose');
  const s = new mongoose.Schema({ userId: String, name: String, email: String, role: String,
    status: String, profileType: String, salary: Number, isEmailVerified: Boolean }, { timestamps: true, strict: false });
  UserModel = mongoose.models.User || mongoose.model('User', s);
  return UserModel;
}

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  logger.logEvent(event);

  try {
    const identity = extractIdentity(event.identity);
    if (!identity || identity.role !== 'ADMIN') throw new ForbiddenError('Admin role required');

    const args = event.arguments || {};
    const { page, limit } = validatePagination({ page: args.page, limit: args.limit });

    await connectDB();
    const User = getModel();

    const filter = { status: { $ne: 'DELETED' } };
    if (args.role)   filter.role = args.role;
    if (args.status) filter.status = args.status;
    if (args.search) {
      const re = new RegExp(args.search, 'i');
      filter.$or = [{ name: re }, { email: re }];
    }

    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    logger.info('listUsers resolved', { total, page, limit });
    return paginatedResponse(items, total, page, limit);
  } catch (err) {
    const f = handleError(err);
    throw Object.assign(new Error(f.message), { extensions: f.extensions });
  }
};
