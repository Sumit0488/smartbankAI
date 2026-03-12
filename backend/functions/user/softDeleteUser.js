'use strict';

/**
 * functions/user/softDeleteUser.js
 * Lambda handler: Soft-delete a user (sets status=DELETED).
 * Triggered by AppSync Mutation.softDeleteUser
 */

const { connectDB } = require('../../core/db');
const { createLogger } = require('../../core/logger');
const { handleError, NotFoundError, ForbiddenError } = require('../../core/errorHandler');
const { extractIdentity } = require('../../core/auth');

const logger = createLogger('functions:user:softDeleteUser');

let UserModel;
function getModel() {
  if (UserModel) return UserModel;
  const mongoose = require('mongoose');
  const s = new mongoose.Schema({ userId: String, status: String }, { timestamps: true, strict: false });
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
    if (identity.role !== 'ADMIN' && identity.userId !== userId) throw new ForbiddenError();

    await connectDB();
    const User = getModel();

    const user = await User.findOneAndUpdate(
      { userId, status: { $ne: 'DELETED' } },
      { $set: { status: 'DELETED' } },
      { new: true }
    ).lean();

    if (!user) throw new NotFoundError('User', userId);

    logger.info('softDeleteUser resolved', { userId });
    return user;
  } catch (err) {
    const f = handleError(err);
    throw Object.assign(new Error(f.message), { extensions: f.extensions });
  }
};
