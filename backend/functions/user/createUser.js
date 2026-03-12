'use strict';

/**
 * functions/user/createUser.js
 * Lambda handler: Create a new SmartBankAI user.
 * Triggered by AppSync Mutation.createUser
 */

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const { connectDB } = require('../../core/db');
const { createLogger } = require('../../core/logger');
const { handleError, ConflictError } = require('../../core/errorHandler');
const { validateCreateUser } = require('../../core/validation');
const { sendWelcomeEmail } = require('../../core/notification');
const { publishUserCreatedEvent } = require('../../core/events');

const logger = createLogger('functions:user:createUser');

let User;
function getUserModel() {
  if (User) return User;
  const mongoose = require('mongoose');
  const schema = new mongoose.Schema(
    { userId: { type: String, default: uuidv4, unique: true }, name: String, email: { type: String, unique: true, lowercase: true },
      password: { type: String, select: false }, phone: String, role: { type: String, default: 'USER' },
      salary: { type: Number, default: 0 }, profileType: { type: String, default: 'Other' },
      isEmailVerified: { type: Boolean, default: false }, status: { type: String, default: 'ACTIVE' } },
    { timestamps: true }
  );
  User = mongoose.models.User || mongoose.model('User', schema);
  return User;
}

/**
 * @param {object} event - AppSync Lambda event
 * @param {object} context - Lambda context
 */
module.exports.handler = async (event, context) => {
  // Keep Lambda container warm between invocations
  context.callbackWaitsForEmptyEventLoop = false;
  const requestId = context.awsRequestId;

  logger.logEvent(event);
  logger.info('createUser invoked', { requestId });

  try {
    const input = event.arguments?.input || event.arguments || {};

    // 1. Validate input
    const data = validateCreateUser(input);

    // 2. Connect to DB
    await connectDB();
    const UserModel = getUserModel();

    // 3. Check duplicate email
    const existing = await UserModel.findOne({ email: data.email }).lean();
    if (existing) throw new ConflictError(`Email '${data.email}' is already registered`);

    // 4. Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // 5. Create user
    const user = await UserModel.create({
      ...data,
      password: passwordHash,
      userId: uuidv4(),
    });

    const userObj = user.toObject();
    delete userObj.password;

    logger.info('User created', { userId: userObj.userId, email: userObj.email, requestId });

    // 6. Fire-and-forget side effects
    Promise.allSettled([
      sendWelcomeEmail(userObj),
      publishUserCreatedEvent(userObj),
    ]).then((results) => {
      results.forEach((r, i) => {
        if (r.status === 'rejected') logger.error(`Side effect ${i} failed`, { error: r.reason?.message });
      });
    });

    return userObj;
  } catch (err) {
    const formatted = handleError(err);
    const error = new Error(formatted.message);
    error.extensions = formatted.extensions;
    throw error;
  }
};
