'use strict';

/**
 * functions/user/getUser.js
 * Lambda handler: Get a user by userId.
 * Triggered by AppSync Query.getUser
 */

const { connectDB } = require('../../core/db');
const { createLogger } = require('../../core/logger');
const { handleError, NotFoundError, ForbiddenError } = require('../../core/errorHandler');
const { extractIdentity } = require('../../core/auth');

const logger = createLogger('functions:user:getUser');

let UserModel;
function getModel() {
  if (UserModel) return UserModel;
  const mongoose = require('mongoose');
  const s = new mongoose.Schema({ userId: String, name: String, email: String, role: String, salary: Number,
    profileType: String, isEmailVerified: Boolean, status: String, phone: String }, { timestamps: true, strict: false });
  UserModel = mongoose.models.User || mongoose.model('User', s);
  return UserModel;
}

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  logger.logEvent(event);

  try {
    const identity = extractIdentity(event.identity);
    if (!identity) throw new ForbiddenError('Authentication required');

    const { userId } = event.arguments;
    if (!userId) throw new Error('userId is required');

    // Non-admins may only retrieve their own record
    if (identity.role !== 'ADMIN' && identity.userId !== userId) {
      throw new ForbiddenError('You can only view your own profile');
    }

    await connectDB();
    const User = getModel();

    const user = await User.findOne({ userId, status: { $ne: 'DELETED' } }).lean();
    if (!user) throw new NotFoundError('User', userId);

    logger.info('getUser resolved', { userId, requestedBy: identity.userId });
    return user;
  } catch (err) {
    const f = handleError(err);
    throw Object.assign(new Error(f.message), { extensions: f.extensions });
  }
};
