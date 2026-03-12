'use strict';

/**
 * functions/user/deleteUser.js
 * Lambda handler: Permanently delete a user (admin only).
 * Triggered by AppSync Mutation.deleteUser
 */

const { connectDB } = require('../../core/db');
const { createLogger } = require('../../core/logger');
const { handleError, NotFoundError, ForbiddenError } = require('../../core/errorHandler');
const { extractIdentity } = require('../../core/auth');

const logger = createLogger('functions:user:deleteUser');

let UserModel;
function getModel() {
  if (UserModel) return UserModel;
  const mongoose = require('mongoose');
  const s = new mongoose.Schema({ userId: String }, { strict: false });
  UserModel = mongoose.models.User || mongoose.model('User', s);
  return UserModel;
}

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  logger.logEvent(event);

  try {
    const identity = extractIdentity(event.identity);
    if (!identity || identity.role !== 'ADMIN') throw new ForbiddenError('Admin role required');

    const { userId } = event.arguments;

    await connectDB();
    const User = getModel();

    const result = await User.deleteOne({ userId });
    if (result.deletedCount === 0) throw new NotFoundError('User', userId);

    logger.info('deleteUser resolved', { userId, deletedBy: identity.userId });
    return { success: true, message: 'User deleted successfully' };
  } catch (err) {
    const f = handleError(err);
    throw Object.assign(new Error(f.message), { extensions: f.extensions });
  }
};
