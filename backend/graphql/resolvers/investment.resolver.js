'use strict';

/**
 * graphql/resolvers/investment.resolver.js
 * GraphQL resolvers for the Investment module.
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const { extractIdentity } = require('../../core/auth');
const { connectDB } = require('../../core/db');
const { createLogger } = require('../../core/logger');
const { handleError, NotFoundError, ForbiddenError } = require('../../core/errorHandler');
const { validateCreateInvestment, validateUpdateInvestment, validatePagination } = require('../../core/validation');
const { paginatedResponse } = require('../../core/response');
const { publishInvestmentCreatedEvent } = require('../../core/events');

const logger = createLogger('resolvers:investment');

// ─── Mongoose Model ───────────────────────────────────────────────────────────

const investmentSchema = new mongoose.Schema(
  {
    investmentId:   { type: String, default: uuidv4, unique: true, index: true },
    userId:         { type: String, required: true, index: true },
    investmentType: { type: String, enum: ['STOCK', 'MUTUAL_FUND', 'FIXED_DEPOSIT'], required: true },
    amount:         { type: Number, required: true, min: 1 },
    expectedReturn: { type: Number, min: 0 },
    currentValue:   { type: Number, min: 0 },
    status:         { type: String, enum: ['ACTIVE', 'CLOSED', 'PENDING'], default: 'ACTIVE' },
    investedAt:     { type: Date, default: Date.now },
    notes:          { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

function getInvestmentModel() {
  return mongoose.models.Investment || mongoose.model('Investment', investmentSchema);
}

function getUserModel() {
  const s = new mongoose.Schema({ userId: String, email: String, name: String }, { strict: false });
  return mongoose.models.User || mongoose.model('User', s);
}

// ─── Virtual Fields ───────────────────────────────────────────────────────────

function addVirtualFields(inv) {
  const obj = { ...inv };
  const current = obj.currentValue ?? obj.amount;
  obj.gainLoss = +(current - obj.amount).toFixed(2);
  obj.gainLossPercent = obj.amount > 0 ? +((obj.gainLoss / obj.amount) * 100).toFixed(2) : 0;
  return obj;
}

// ─── Resolvers ────────────────────────────────────────────────────────────────

const investmentResolver = {
  Query: {
    getInvestment: async (_parent, { investmentId }, context) => {
      try {
        const identity = extractIdentity(context.identity);
        if (!identity) throw new Error('Authentication required');

        await connectDB();
        const Investment = getInvestmentModel();

        const inv = await Investment.findOne({ investmentId }).lean();
        if (!inv) throw new NotFoundError('Investment', investmentId);

        if (identity.role !== 'ADMIN' && identity.userId !== inv.userId) throw new ForbiddenError();

        logger.info('getInvestment resolved', { investmentId });
        return addVirtualFields(inv);
      } catch (err) {
        const formatted = handleError(err);
        throw Object.assign(new Error(formatted.message), { extensions: formatted.extensions });
      }
    },

    listInvestments: async (_parent, args, context) => {
      try {
        const identity = extractIdentity(context.identity);
        if (!identity) throw new Error('Authentication required');

        const { page, limit } = validatePagination({ page: args.page, limit: args.limit });
        await connectDB();
        const Investment = getInvestmentModel();

        const filter = {};
        if (identity.role !== 'ADMIN') filter.userId = identity.userId;
        else if (args.userId) filter.userId = args.userId;
        if (args.investmentType) filter.investmentType = args.investmentType;
        if (args.status) filter.status = args.status;

        const [items, total] = await Promise.all([
          Investment.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
          Investment.countDocuments(filter),
        ]);

        logger.info('listInvestments resolved', { total, page, limit });
        return paginatedResponse(items.map(addVirtualFields), total, page, limit);
      } catch (err) {
        const formatted = handleError(err);
        throw Object.assign(new Error(formatted.message), { extensions: formatted.extensions });
      }
    },

    getPortfolioSummary: async (_parent, { userId }, context) => {
      try {
        const identity = extractIdentity(context.identity);
        if (!identity) throw new Error('Authentication required');
        if (identity.role !== 'ADMIN' && identity.userId !== userId) throw new ForbiddenError();

        await connectDB();
        const Investment = getInvestmentModel();

        const investments = await Investment.find({ userId }).lean();
        const active = investments.filter((i) => i.status === 'ACTIVE');
        const closed = investments.filter((i) => i.status === 'CLOSED');

        const totalInvested = investments.reduce((s, i) => s + i.amount, 0);
        const totalCurrentValue = investments.reduce((s, i) => s + (i.currentValue ?? i.amount), 0);
        const totalGainLoss = totalCurrentValue - totalInvested;
        const gainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

        // Group by type
        const typeMap = {};
        for (const inv of investments) {
          if (!typeMap[inv.investmentType]) typeMap[inv.investmentType] = { count: 0, totalInvested: 0, totalCurrentValue: 0 };
          typeMap[inv.investmentType].count++;
          typeMap[inv.investmentType].totalInvested += inv.amount;
          typeMap[inv.investmentType].totalCurrentValue += inv.currentValue ?? inv.amount;
        }

        const byType = Object.entries(typeMap).map(([investmentType, v]) => ({ investmentType, ...v }));

        logger.info('getPortfolioSummary resolved', { userId, totalInvested });
        return {
          userId,
          totalInvested: +totalInvested.toFixed(2),
          totalCurrentValue: +totalCurrentValue.toFixed(2),
          totalGainLoss: +totalGainLoss.toFixed(2),
          gainLossPercent: +gainLossPercent.toFixed(2),
          activeInvestments: active.length,
          closedInvestments: closed.length,
          byType,
        };
      } catch (err) {
        const formatted = handleError(err);
        throw Object.assign(new Error(formatted.message), { extensions: formatted.extensions });
      }
    },
  },

  Mutation: {
    createInvestment: async (_parent, { input }, context) => {
      try {
        const identity = extractIdentity(context.identity);
        if (!identity) throw new Error('Authentication required');

        const data = validateCreateInvestment(input);
        await connectDB();
        const Investment = getInvestmentModel();

        const inv = await Investment.create({
          ...data,
          userId: identity.userId,
          investmentId: uuidv4(),
          currentValue: data.currentValue ?? data.amount,
          investedAt: new Date(),
        });

        const invObj = inv.toObject();
        publishInvestmentCreatedEvent(invObj).catch((e) =>
          logger.error('Investment event publish failed', { error: e.message })
        );

        logger.info('createInvestment resolved', { investmentId: invObj.investmentId });
        return addVirtualFields(invObj);
      } catch (err) {
        const formatted = handleError(err);
        throw Object.assign(new Error(formatted.message), { extensions: formatted.extensions });
      }
    },

    updateInvestment: async (_parent, { investmentId, input }, context) => {
      try {
        const identity = extractIdentity(context.identity);
        if (!identity) throw new Error('Authentication required');

        const data = validateUpdateInvestment(input);
        await connectDB();
        const Investment = getInvestmentModel();

        const existing = await Investment.findOne({ investmentId });
        if (!existing) throw new NotFoundError('Investment', investmentId);
        if (identity.role !== 'ADMIN' && identity.userId !== existing.userId) throw new ForbiddenError();

        const inv = await Investment.findOneAndUpdate(
          { investmentId },
          { $set: data },
          { new: true, runValidators: true }
        ).lean();

        logger.info('updateInvestment resolved', { investmentId });
        return addVirtualFields(inv);
      } catch (err) {
        const formatted = handleError(err);
        throw Object.assign(new Error(formatted.message), { extensions: formatted.extensions });
      }
    },

    closeInvestment: async (_parent, { investmentId, finalValue }, context) => {
      try {
        const identity = extractIdentity(context.identity);
        if (!identity) throw new Error('Authentication required');

        await connectDB();
        const Investment = getInvestmentModel();

        const existing = await Investment.findOne({ investmentId });
        if (!existing) throw new NotFoundError('Investment', investmentId);
        if (identity.role !== 'ADMIN' && identity.userId !== existing.userId) throw new ForbiddenError();

        const inv = await Investment.findOneAndUpdate(
          { investmentId },
          { $set: { status: 'CLOSED', ...(finalValue !== undefined ? { currentValue: finalValue } : {}) } },
          { new: true }
        ).lean();

        logger.info('closeInvestment resolved', { investmentId });
        return addVirtualFields(inv);
      } catch (err) {
        const formatted = handleError(err);
        throw Object.assign(new Error(formatted.message), { extensions: formatted.extensions });
      }
    },
  },

  // Field resolvers for Investment
  Investment: {
    id: (parent) => parent._id?.toString() || parent.id,
    user: async (inv) => {
      try {
        await connectDB();
        const User = getUserModel();
        return User.findOne({ userId: inv.userId }).lean();
      } catch {
        return null;
      }
    },
  },
};

module.exports = investmentResolver;
