'use strict';

/**
 * functions/user/updateUser.js
 * Lambda handler: Update a user profile.
 * Triggered by AppSync Mutation.updateUser
 */

const { connectDB } = require('../../core/db');
const { createLogger } = require('../../core/logger');
const { handleError, NotFoundError, ForbiddenError } = require('../../core/errorHandler');
const { validateUpdateUser } = require('../../core/validation');
const { extractIdentity } = require('../../core/auth');

const logger = createLogger('functions:user:updateUser');

let UserModel;
function getModel() {
  if (UserModel) return UserModel;
  const mongoose = require('mongoose');
  const s = new mongoose.Schema({ userId: String, name: String, email: String, phone: String, salary: Number,
    profileType: String, isEmailVerified: Boolean, status: String, role: String }, { timestamps: true, strict: false });
  UserModel = mongoose.models.User || mongoose.model('User', s);
  return UserModel;
}

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  logger.logEvent(event);

  try {
    const identity = extractIdentity(event.identity);
    if (!identity) throw new ForbiddenError('Authentication required');

    const { userId, input } = event.arguments;
    if (identity.role !== 'ADMIN' && identity.userId !== userId) throw new ForbiddenError();

    const data = validateUpdateUser(input);

    await connectDB();
    const User = getModel();

    const user = await User.findOneAndUpdate(
      { userId, status: { $ne: 'DELETED' } },
      { $set: data },
      { new: true, runValidators: true }
    ).lean();

    if (!user) throw new NotFoundError('User', userId);

    logger.info('updateUser resolved', { userId });
    return user;
  } catch (err) {
    const f = handleError(err);
    throw Object.assign(new Error(f.message), { extensions: f.extensions });
  }
};
