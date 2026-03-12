'use strict';

/**
 * graphql/resolvers/forex.resolver.js
 * Forex Transfer CRUD — real exchange rates via static table + 0.5% fee.
 */

const { v4: uuidv4 } = require('uuid');
const { extractIdentity } = require('../../core/auth');
const { connectDB } = require('../../core/db');
const { createLogger } = require('../../core/logger');
const { handleError, NotFoundError, ForbiddenError, ValidationError } = require('../../core/errorHandler');
const { paginatedResponse } = require('../../core/response');
const ForexTransfer = require('../../models/ForexTransfer');

const logger = createLogger('resolvers:forex');

// ─── Static Exchange Rate Table ───────────────────────────────────────────────
// Base rates (approximate market rates — update periodically)

const RATES = {
  'USD-EUR': 0.92, 'USD-GBP': 0.79, 'USD-INR': 83.50, 'USD-JPY': 149.50, 'USD-AUD': 1.52, 'USD-CAD': 1.35, 'USD-SGD': 1.34, 'USD-AED': 3.67,
  'EUR-USD': 1.09, 'EUR-GBP': 0.86, 'EUR-INR': 90.80, 'EUR-JPY': 162.80,
  'GBP-USD': 1.27, 'GBP-EUR': 1.17, 'GBP-INR': 105.70,
  'INR-USD': 0.012, 'INR-EUR': 0.011, 'INR-GBP': 0.0095, 'INR-JPY': 1.79, 'INR-AED': 0.044,
  'JPY-USD': 0.0067, 'JPY-INR': 0.56,
  'AUD-USD': 0.66, 'AUD-INR': 55.10,
  'CAD-USD': 0.74, 'CAD-INR': 61.90,
  'SGD-USD': 0.75, 'SGD-INR': 62.50,
  'AED-USD': 0.27, 'AED-INR': 22.75,
};

const FEE_RATE = 0.005; // 0.5%

function getExchangeRate(from, to) {
  if (from === to) return 1;
  const key = `${from.toUpperCase()}-${to.toUpperCase()}`;
  if (RATES[key]) return RATES[key];
  // Try via USD as intermediate
  const toUSD   = RATES[`${from.toUpperCase()}-USD`];
  const fromUSD = RATES[`USD-${to.toUpperCase()}`];
  if (toUSD && fromUSD) return +(toUSD * fromUSD).toFixed(6);
  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getIdentity(context) {
  const identity = extractIdentity(context.identity);
  if (!identity) throw new Error('Authentication required');
  return identity;
}

function throwErr(err) {
  const f = handleError(err);
  throw Object.assign(new Error(f.message), { extensions: f.extensions });
}

// ─── Resolvers ────────────────────────────────────────────────────────────────

const forexResolver = {
  Query: {
    listForexTransfers: async (_parent, args, context) => {
      try {
        const identity = getIdentity(context);
        const page  = Math.max(1, args.page  || 1);
        const limit = Math.min(100, Math.max(1, args.limit || 20));

        await connectDB();

        const filter = identity.role === 'ADMIN' ? {} : { userId: identity.userId };
        const [items, total] = await Promise.all([
          ForexTransfer.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
          ForexTransfer.countDocuments(filter),
        ]);

        logger.info('listForexTransfers resolved', { userId: identity.userId, total });
        return paginatedResponse(items, total, page, limit);
      } catch (err) { throwErr(err); }
    },

    getForexTransfer: async (_parent, { transferId }, context) => {
      try {
        const identity = getIdentity(context);
        await connectDB();

        const transfer = await ForexTransfer.findOne({ transferId }).lean();
        if (!transfer) throw new NotFoundError('ForexTransfer', transferId);
        if (identity.role !== 'ADMIN' && transfer.userId !== identity.userId) throw new ForbiddenError();

        return transfer;
      } catch (err) { throwErr(err); }
    },
  },

  Mutation: {
    createForexTransfer: async (_parent, { input }, context) => {
      try {
        const identity = getIdentity(context);

        const from = input.fromCurrency.toUpperCase();
        const to   = input.toCurrency.toUpperCase();

        if (input.amount <= 0) throw new ValidationError('Amount must be greater than 0');

        const rate = getExchangeRate(from, to);
        if (!rate) {
          throw new ValidationError(`Exchange rate not available for ${from} → ${to}`);
        }

        const convertedAmount = +(input.amount * rate).toFixed(4);
        const fee = +(convertedAmount * FEE_RATE).toFixed(4);

        await connectDB();

        const transfer = await ForexTransfer.create({
          transferId:       uuidv4(),
          userId:           identity.userId,
          fromCurrency:     from,
          toCurrency:       to,
          amount:           input.amount,
          convertedAmount,
          exchangeRate:     rate,
          fee,
          status:           'PENDING',
          purpose:          input.purpose,
          recipientName:    input.recipientName,
          recipientAccount: input.recipientAccount,
          recipientBank:    input.recipientBank,
        });

        logger.info('createForexTransfer resolved', { transferId: transfer.transferId, userId: identity.userId });
        return transfer.toObject();
      } catch (err) { throwErr(err); }
    },

    cancelForexTransfer: async (_parent, { transferId }, context) => {
      try {
        const identity = getIdentity(context);
        await connectDB();

        const transfer = await ForexTransfer.findOne({ transferId }).lean();
        if (!transfer) throw new NotFoundError('ForexTransfer', transferId);
        if (identity.role !== 'ADMIN' && transfer.userId !== identity.userId) throw new ForbiddenError();

        if (!['PENDING', 'PROCESSING'].includes(transfer.status)) {
          throw new ValidationError(`Cannot cancel a transfer with status: ${transfer.status}`);
        }

        const updated = await ForexTransfer.findOneAndUpdate(
          { transferId },
          { $set: { status: 'CANCELLED' } },
          { new: true }
        ).lean();

        logger.info('cancelForexTransfer resolved', { transferId });
        return updated;
      } catch (err) { throwErr(err); }
    },
  },

  // Field resolvers
  ForexTransfer: {
    id: (parent) => parent._id?.toString() || parent.id,
  },
};

module.exports = forexResolver;
