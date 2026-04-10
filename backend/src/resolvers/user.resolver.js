'use strict';

/**
 * src/resolvers/user.resolver.js
 * GraphQL resolvers for the User module.
 */

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const { extractIdentity } = require('../utils/auth');
const { connectDB } = require('../config/db');
const { createLogger } = require('../utils/logger');
const { handleError, NotFoundError, ConflictError, ForbiddenError } = require('../utils/errorHandler');
const { validateCreateUser, validateUpdateUser, validatePagination } = require('../utils/validation');
const { paginatedResponse } = require('../utils/response');
const { sendWelcomeEmail } = require('../utils/notification');
const { publishUserCreatedEvent } = require('../utils/events');

const logger = createLogger('resolvers:user');

// ─── Mongoose Model ───────────────────────────────────────────────────────────

const User = require('../models/User');

function getUserModel() {
  return User;
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
    // Core — non-null GraphQL fields need safe defaults for legacy documents
    id:              (p) => p._id?.toString() || p.id,
    userId:          (p) => p.userId          || p._id?.toString(),
    status:          (p) => p.status          || 'ACTIVE',
    role:            (p) => p.role            || 'USER',
    profileType:     (p) => p.profileType     || 'OTHER',
    salary:          (p) => p.salary          ?? 0,
    isEmailVerified: (p) => p.isEmailVerified ?? false,

    // Security
    accountLocked:    (p) => p.accountLocked    ?? false,
    twoFactorEnabled: (p) => p.twoFactorEnabled ?? false,

    // Financial Profile
    monthlyIncome:  (p) => p.monthlyIncome  ?? 0,
    monthlyBudget:  (p) => p.monthlyBudget  ?? 0,
    riskProfile:    (p) => p.riskProfile    || 'MODERATE',
    investmentGoal: (p) => p.investmentGoal || 'OTHER',

    // Banking Preferences
    defaultCurrency: (p) => p.defaultCurrency || 'INR',
    language:        (p) => p.language        || 'en',
    notificationPreferences: (p) => p.notificationPreferences ?? { email: true, sms: false, push: true },

    // AI Personalization
    aiInsightsEnabled: (p) => p.aiInsightsEnabled ?? true,

    // KYC
    kycStatus: (p) => p.kycStatus || 'PENDING',

    // Dates → ISO strings (Mongoose returns Date objects from lean())
    lastLogin:     (p) => p.lastLogin     ? new Date(p.lastLogin).toISOString()     : null,
    kycVerifiedAt: (p) => p.kycVerifiedAt ? new Date(p.kycVerifiedAt).toISOString() : null,
    dateOfBirth:   (p) => p.dateOfBirth   ? new Date(p.dateOfBirth).toISOString().split('T')[0] : null,

    // Financial analytics — return embedded doc or empty defaults (never null)
    userFinancialSummary: (p) => {
      const s = p.userFinancialSummary || {};
      return {
        totalIncome:          s.totalIncome          ?? 0,
        totalExpenses:        s.totalExpenses         ?? 0,
        totalInvestments:     s.totalInvestments      ?? 0,
        totalSavings:         s.totalSavings          ?? 0,
        monthlySavingsRate:   s.monthlySavingsRate    ?? 0,
        financialHealthScore: s.financialHealthScore  ?? 0,
        lastCalculated:       s.lastCalculated ? new Date(s.lastCalculated).toISOString() : null,
      };
    },

    aiInsights: (p) => {
      const a = p.aiInsights || {};
      return {
        topSpendingCategory: a.topSpendingCategory || null,
        highestExpenseMonth: a.highestExpenseMonth || null,
        savingsSuggestion:   a.savingsSuggestion   || null,
        riskAlert:           a.riskAlert            || null,
      };
    },

    budgetSettings: (p) => {
      const b = p.budgetSettings || {};
      const cats = b.categories || {};
      return {
        monthlyBudget: b.monthlyBudget ?? 0,
        categories: {
          food:          cats.food          ?? 0,
          travel:        cats.travel        ?? 0,
          entertainment: cats.entertainment ?? 0,
        },
      };
    },

    investmentProfile: (p) => {
      const ip = p.investmentProfile || {};
      return {
        riskLevel:         ip.riskLevel         || 'MODERATE',
        recommendedAssets: ip.recommendedAssets  || [],
        investmentGoal:    ip.investmentGoal     || 'OTHER',
      };
    },
  },
};

module.exports = userResolver;
