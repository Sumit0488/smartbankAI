'use strict';

/**
 * graphql/resolvers/user.resolver.js
 * GraphQL resolvers for the User module.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const { requireAuth, requireAdmin, extractIdentity } = require('../../core/auth');
const { connectDB } = require('../../core/db');
const { createLogger } = require('../../core/logger');
const { handleError, NotFoundError, ConflictError, ForbiddenError } = require('../../core/errorHandler');
const { validateCreateUser, validateUpdateUser, validatePagination } = require('../../core/validation');
const { paginatedResponse } = require('../../core/response');
const { sendWelcomeEmail } = require('../../core/notification');
const { publishUserCreatedEvent } = require('../../core/events');

const logger = createLogger('resolvers:user');

// ─── Mongoose Model ───────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema(
  {
    userId:          { type: String, default: uuidv4, unique: true, index: true },
    name:            { type: String, required: true, trim: true },
    email:           { type: String, required: true, unique: true, lowercase: true, index: true },
    password:        { type: String, required: true, select: false },
    phone:           { type: String },
    role:            { type: String, enum: ['ADMIN', 'USER'], default: 'USER' },
    salary:          { type: Number, min: 0, default: 0 },
    profileType:     { type: String, enum: ['STUDENT', 'WORKING_PROFESSIONAL', 'SELF_EMPLOYED', 'BUSINESS_OWNER', 'OTHER'], default: 'OTHER' },
    isEmailVerified: { type: Boolean, default: false },
    status:          { type: String, enum: ['ACTIVE', 'INACTIVE', 'DELETED'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

function getUserModel() {
  return mongoose.models.User || mongoose.model('User', userSchema);
}

// ─── Resolvers ────────────────────────────────────────────────────────────────

const userResolver = {
  Query: {
    /**
     * getUser(userId: ID!): User
     * Requires auth — users can only access their own record unless admin.
     */
    getUser: async (_parent, { userId }, context) => {
      try {
        const identity = extractIdentity(context.identity);
        if (!identity) throw new Error('Authentication required');

        await connectDB();
        const User = getUserModel();

        const user = await User.findOne({ userId, status: { $ne: 'DELETED' } }).lean();
        if (!user) throw new NotFoundError('User', userId);

        // Non-admins can only view their own record
        if (identity.role !== 'ADMIN' && identity.userId !== userId) {
          throw new ForbiddenError('You can only view your own profile');
        }

        logger.info('getUser resolved', { userId, requestedBy: identity.userId });
        return user;
      } catch (err) {
        const formatted = handleError(err);
        throw Object.assign(new Error(formatted.message), { extensions: formatted.extensions });
      }
    },
    getProfile: async (_parent, _args, context) => {
      try {
        const identity = extractIdentity(context.identity);
        if (!identity) throw new Error('Authentication required');
        await connectDB();
        const User = getUserModel();
        const user = await User.findOne({ userId: identity.userId, status: { $ne: 'DELETED' } }).lean();
        if (!user) throw new NotFoundError('User', identity.userId);
        logger.info('getProfile resolved', { userId: identity.userId });
        return user;
      } catch (err) {
        const formatted = handleError(err);
        throw Object.assign(new Error(formatted.message), { extensions: formatted.extensions });
      }
    },

    /**
     * listUsers: UserListResponse!
     * Admin only — returns paginated user list with filtering.
     */
    listUsers: async (_parent, args, context) => {
      try {
        const identity = extractIdentity(context.identity);
        if (!identity || identity.role !== 'ADMIN') throw new ForbiddenError();

        const { page, limit } = validatePagination({ page: args.page, limit: args.limit });
        await connectDB();
        const User = getUserModel();

        const filter = { status: { $ne: 'DELETED' } };
        if (args.role)   filter.role = args.role;
        if (args.status) filter.status = args.status;
        if (args.search) {
          const re = new RegExp(args.search, 'i');
          filter.$or = [{ name: re }, { email: re }];
        }

        const [items, total] = await Promise.all([
          User.find(filter).skip((page - 1) * limit).limit(limit).lean(),
          User.countDocuments(filter),
        ]);

        logger.info('listUsers resolved', { total, page, limit });
        return paginatedResponse(items, total, page, limit);
      } catch (err) {
        const formatted = handleError(err);
        throw Object.assign(new Error(formatted.message), { extensions: formatted.extensions });
      }
    },
  },

  Mutation: {
    /**
     * createUser(input: CreateUserInput!): User!
     * Public — creates a new user, hashes password, sends welcome email.
     */
    createUser: async (_parent, { input }) => {
      try {
        const data = validateCreateUser(input);
        await connectDB();
        const User = getUserModel();

        const existing = await User.findOne({ email: data.email });
        if (existing) throw new ConflictError(`Email '${data.email}' is already registered`);

        const passwordHash = await bcrypt.hash(data.password, 12);
        const user = await User.create({
          ...data,
          password: passwordHash,
          userId: uuidv4(),
        });

        const userObj = user.toObject();
        delete userObj.password;

        // Fire-and-forget: welcome email + event
        Promise.allSettled([
          sendWelcomeEmail(userObj),
          publishUserCreatedEvent(userObj),
        ]).catch((err) => logger.error('Post-create side-effects failed', { error: err.message }));

        logger.info('createUser resolved', { userId: userObj.userId, email: userObj.email });
        return userObj;
      } catch (err) {
        const formatted = handleError(err);
        throw Object.assign(new Error(formatted.message), { extensions: formatted.extensions });
      }
    },

    /**
     * updateUser(userId: ID!, input: UpdateUserInput!): User!
     * Requires auth — users update their own profile; admins can update any.
     */
    updateUser: async (_parent, { userId, input }, context) => {
      try {
        const identity = extractIdentity(context.identity);
        if (!identity) throw new Error('Authentication required');
        if (identity.role !== 'ADMIN' && identity.userId !== userId) throw new ForbiddenError();

        const data = validateUpdateUser(input);
        await connectDB();
        const User = getUserModel();

        const user = await User.findOneAndUpdate(
          { userId, status: { $ne: 'DELETED' } },
          { $set: data },
          { new: true, runValidators: true }
        ).lean();

        if (!user) throw new NotFoundError('User', userId);

        logger.info('updateUser resolved', { userId });
        return user;
      } catch (err) {
        const formatted = handleError(err);
        throw Object.assign(new Error(formatted.message), { extensions: formatted.extensions });
      }
    },

    /**
     * deleteUser(userId: ID!): DeleteResult!
     * Admin only — hard delete.
     */
    deleteUser: async (_parent, { userId }, context) => {
      try {
        const identity = extractIdentity(context.identity);
        if (!identity || identity.role !== 'ADMIN') throw new ForbiddenError();

        await connectDB();
        const User = getUserModel();

        const result = await User.deleteOne({ userId });
        if (result.deletedCount === 0) throw new NotFoundError('User', userId);

        logger.info('deleteUser resolved', { userId });
        return { success: true, message: 'User deleted successfully' };
      } catch (err) {
        const formatted = handleError(err);
        throw Object.assign(new Error(formatted.message), { extensions: formatted.extensions });
      }
    },

    /**
     * softDeleteUser(userId: ID!): User!
     * Requires auth — marks user as DELETED without removing from DB.
     */
    softDeleteUser: async (_parent, { userId }, context) => {
      try {
        const identity = extractIdentity(context.identity);
        if (!identity) throw new Error('Authentication required');
        if (identity.role !== 'ADMIN' && identity.userId !== userId) throw new ForbiddenError();

        await connectDB();
        const User = getUserModel();

        const user = await User.findOneAndUpdate(
          { userId, status: { $ne: 'DELETED' } },
          { $set: { status: 'DELETED' } },
          { new: true }
        ).lean();

        if (!user) throw new NotFoundError('User', userId);


        logger.info('softDeleteUser resolved', { userId });
        return user;
      } catch (err) {
        const formatted = handleError(err);
        throw Object.assign(new Error(formatted.message), { extensions: formatted.extensions });
      }
    },

    updateProfile: async (_parent, { input }, context) => {
      try {
        const identity = extractIdentity(context.identity);
        if (!identity) throw new Error('Authentication required');
        const data = validateUpdateUser(input);
        await connectDB();
        const User = getUserModel();
        const user = await User.findOneAndUpdate(
          { userId: identity.userId, status: { $ne: 'DELETED' } },
          { $set: data },
          { new: true, runValidators: true }
        ).lean();
        if (!user) throw new NotFoundError('User', identity.userId);
        logger.info('updateProfile resolved', { userId: identity.userId });
        return user;
      } catch (err) {
        const formatted = handleError(err);
        throw Object.assign(new Error(formatted.message), { extensions: formatted.extensions });
      }
    },
  },

  // Field resolvers: _id → id mapping + safe defaults for legacy docs missing non-null fields
  User: {
    id:              (parent) => parent._id?.toString() || parent.id,
    userId:          (parent) => parent.userId          || parent._id?.toString(),
    status:          (parent) => parent.status          || 'ACTIVE',
    role:            (parent) => parent.role            || 'USER',
    profileType:     (parent) => parent.profileType     || 'OTHER',
    salary:          (parent) => parent.salary          ?? 0,
    isEmailVerified: (parent) => parent.isEmailVerified ?? false,
  },
};

module.exports = userResolver;
