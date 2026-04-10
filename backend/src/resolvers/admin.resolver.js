'use strict';

/**
 * src/resolvers/admin.resolver.js
 * Admin-only GraphQL resolvers. All operations require ADMIN role.
 */

const mongoose = require('mongoose');

const { extractIdentity } = require('../utils/auth');
const { connectDB } = require('../config/db');
const { createLogger } = require('../utils/logger');
const { handleError, NotFoundError, ForbiddenError } = require('../utils/errorHandler');
const { validatePagination } = require('../utils/validation');
const { paginatedResponse } = require('../utils/response');

const logger = createLogger('resolvers:admin');

function getUserModel() {
  const s = new mongoose.Schema(
    { userId: String, name: String, email: String, phone: String, role: String, salary: Number,
      profileType: String, isEmailVerified: Boolean, status: String },
    { timestamps: true, strict: false }
  );
  return mongoose.models.User || mongoose.model('User', s);
}

function getLoanModel() {
  const s = new mongoose.Schema({ status: String, userId: String }, { strict: false });
  return mongoose.models.Loan || mongoose.model('Loan', s);
}

function getInvestmentModel() {
  const s = new mongoose.Schema({ status: String, userId: String }, { strict: false });
  return mongoose.models.Investment || mongoose.model('Investment', s);
}

function requireAdminIdentity(context) {
  const identity = extractIdentity(context.identity);
  if (!identity || identity.role !== 'ADMIN') throw new ForbiddenError('Admin role required');
  return identity;
}

const adminResolver = {
  Query: {
    adminListUsers: async (_parent, { page: p, limit: l, filter = {}, sort }, context) => {
      try {
        requireAdminIdentity(context);
        const { page, limit } = validatePagination({ page: p, limit: l });
        await connectDB();
        const User = getUserModel();

        const query = {};
        if (filter.role)            query.role = filter.role;
        if (filter.status)          query.status = filter.status;
        if (filter.profileType)     query.profileType = filter.profileType;
        if (filter.isEmailVerified !== undefined) query.isEmailVerified = filter.isEmailVerified;
        if (filter.createdAfter || filter.createdBefore) {
          query.createdAt = {};
          if (filter.createdAfter)  query.createdAt.$gte = new Date(filter.createdAfter);
          if (filter.createdBefore) query.createdAt.$lte = new Date(filter.createdBefore);
        }
        if (filter.search) {
          const re = new RegExp(filter.search, 'i');
          query.$or = [{ name: re }, { email: re }];
        }

        const sortObj = sort ? { [sort.field]: sort.direction === 'ASC' ? 1 : -1 } : { createdAt: -1 };

        const [items, total] = await Promise.all([
          User.find(query).sort(sortObj).skip((page - 1) * limit).limit(limit).lean(),
          User.countDocuments(query),
        ]);

        logger.info('adminListUsers', { total, page, filter });
        return paginatedResponse(items, total, page, limit);
      } catch (err) {
        const f = handleError(err);
        throw Object.assign(new Error(f.message), { extensions: f.extensions });
      }
    },

    adminGetUser: async (_parent, { userId }, context) => {
      try {
        requireAdminIdentity(context);
        await connectDB();
        const User = getUserModel();
        const user = await User.findOne({ userId }).lean();
        if (!user) throw new NotFoundError('User', userId);
        logger.info('adminGetUser', { userId });
        return user;
      } catch (err) {
        const f = handleError(err);
        throw Object.assign(new Error(f.message), { extensions: f.extensions });
      }
    },

    adminGetStats: async (_parent, _args, context) => {
      try {
        requireAdminIdentity(context);
        await connectDB();
        const User = getUserModel();
        const Loan = getLoanModel();
        const Investment = getInvestmentModel();

        const [totalUsers, activeUsers, totalLoans, pendingLoans, approvedLoans, totalInvestments, activeInvestments] =
          await Promise.all([
            User.countDocuments({}),
            User.countDocuments({ status: 'ACTIVE' }),
            Loan.countDocuments({}),
            Loan.countDocuments({ status: 'PENDING' }),
            Loan.countDocuments({ status: 'APPROVED' }),
            Investment.countDocuments({}),
            Investment.countDocuments({ status: 'ACTIVE' }),
          ]);

        return { totalUsers, activeUsers, totalLoans, pendingLoans, approvedLoans, totalInvestments, activeInvestments };
      } catch (err) {
        const f = handleError(err);
        throw Object.assign(new Error(f.message), { extensions: f.extensions });
      }
    },
  },

  Mutation: {
    adminDeleteUser: async (_parent, { userId }, context) => {
      try {
        requireAdminIdentity(context);
        await connectDB();
        const User = getUserModel();
        const result = await User.deleteOne({ userId });
        if (result.deletedCount === 0) throw new NotFoundError('User', userId);
        logger.info('adminDeleteUser', { userId });
        return { success: true, message: 'User permanently deleted' };
      } catch (err) {
        const f = handleError(err);
        throw Object.assign(new Error(f.message), { extensions: f.extensions });
      }
    },

    adminUpdateUser: async (_parent, { userId, input }, context) => {
      try {
        requireAdminIdentity(context);
        await connectDB();
        const User = getUserModel();
        const user = await User.findOneAndUpdate(
          { userId },
          { $set: input },
          { new: true, runValidators: true }
        ).lean();
        if (!user) throw new NotFoundError('User', userId);
        logger.info('adminUpdateUser', { userId });
        return user;
      } catch (err) {
        const f = handleError(err);
        throw Object.assign(new Error(f.message), { extensions: f.extensions });
      }
    },

    adminEditUser: async (_parent, { userId, input, reason }, context) => {
      try {
        const admin = requireAdminIdentity(context);
        await connectDB();
        const User = getUserModel();
        const user = await User.findOneAndUpdate(
          { userId },
          { $set: { ...input, _lastEditedBy: admin.userId, _lastEditReason: reason } },
          { new: true, runValidators: true }
        ).lean();
        if (!user) throw new NotFoundError('User', userId);
        logger.info('adminEditUser', { userId, reason, editedBy: admin.userId });
        return user;
      } catch (err) {
        const f = handleError(err);
        throw Object.assign(new Error(f.message), { extensions: f.extensions });
      }
    },

    adminSoftDeleteUser: async (_parent, { userId }, context) => {
      try {
        requireAdminIdentity(context);
        await connectDB();
        const User = getUserModel();
        const user = await User.findOneAndUpdate(
          { userId },
          { $set: { status: 'DELETED' } },
          { new: true }
        ).lean();
        if (!user) throw new NotFoundError('User', userId);
        logger.info('adminSoftDeleteUser', { userId });
        return user;
      } catch (err) {
        const f = handleError(err);
        throw Object.assign(new Error(f.message), { extensions: f.extensions });
      }
    },

    adminBulkDeleteUsers: async (_parent, { userIds }, context) => {
      try {
        requireAdminIdentity(context);
        await connectDB();
        const User = getUserModel();
        const result = await User.deleteMany({ userId: { $in: userIds } });
        logger.info('adminBulkDeleteUsers', { affected: result.deletedCount });
        return { success: result.deletedCount > 0, affected: result.deletedCount, message: `${result.deletedCount} user(s) deleted` };
      } catch (err) {
        const f = handleError(err);
        throw Object.assign(new Error(f.message), { extensions: f.extensions });
      }
    },

    adminSuspendUser: async (_parent, { userId, reason }, context) => {
      try {
        requireAdminIdentity(context);
        await connectDB();
        const User = getUserModel();
        const user = await User.findOneAndUpdate(
          { userId },
          { $set: { status: 'INACTIVE', _suspendReason: reason } },
          { new: true }
        ).lean();
        if (!user) throw new NotFoundError('User', userId);
        logger.info('adminSuspendUser', { userId });
        return user;
      } catch (err) {
        const f = handleError(err);
        throw Object.assign(new Error(f.message), { extensions: f.extensions });
      }
    },

    adminReactivateUser: async (_parent, { userId }, context) => {
      try {
        requireAdminIdentity(context);
        await connectDB();
        const User = getUserModel();
        const user = await User.findOneAndUpdate(
          { userId },
          { $set: { status: 'ACTIVE' } },
          { new: true }
        ).lean();
        if (!user) throw new NotFoundError('User', userId);
        logger.info('adminReactivateUser', { userId });
        return user;
      } catch (err) {
        const f = handleError(err);
        throw Object.assign(new Error(f.message), { extensions: f.extensions });
      }
    },
  },
};

module.exports = adminResolver;
