'use strict';

/**
 * src/resolvers/transaction.resolver.js
 * Transaction module — full user-data isolation enforced via JWT identity.
 *
 * Rules:
 *   - createTransaction  : auth required; userId always taken from token (never client input)
 *   - myTransactions     : auth required; users see only their own records
 *   - myTransactions     : admin may pass userId arg to view any user's records
 *   - deleteTransaction  : auth required; users delete only their own; admin deletes any
 */

const { v4: uuidv4 }    = require('uuid');
const { connectDB }      = require('../config/db');
const { extractIdentity } = require('../utils/auth');
const { handleError, NotFoundError, ForbiddenError, ValidationError } = require('../utils/errorHandler');
const { paginatedResponse } = require('../utils/response');
const { createLogger }   = require('../utils/logger');
const Transaction        = require('../models/Transaction');

const logger = createLogger('resolvers:transaction');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function requireAuth(context) {
  const identity = extractIdentity(context.identity);
  if (!identity) throw new Error('Not authenticated');
  return identity;
}

// ─── Resolvers ────────────────────────────────────────────────────────────────

const transactionResolver = {
  Query: {
    /**
     * myTransactions — returns paginated transactions for the calling user.
     * Admins may pass `userId` to view any user's transactions.
     */
    myTransactions: async (_parent, args, context) => {
      try {
        const identity = requireAuth(context);
        await connectDB();

        // Determine whose records to fetch
        let targetUserId = identity.userId;
        if (args.userId) {
          if (identity.role !== 'ADMIN') {
            throw new ForbiddenError('Only admins can view other users\' transactions');
          }
          targetUserId = args.userId;
        }

        const page  = Math.max(1, args.page  || 1);
        const limit = Math.min(100, Math.max(1, args.limit || 20));

        const filter = { userId: targetUserId };
        if (args.type) filter.type = args.type;

        const [items, total] = await Promise.all([
          Transaction.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
          Transaction.countDocuments(filter),
        ]);

        logger.info('myTransactions resolved', { targetUserId, total, page });
        return paginatedResponse(items, total, page, limit);
      } catch (err) {
        const f = handleError(err);
        throw Object.assign(new Error(f.message), { extensions: f.extensions });
      }
    },
  },

  Mutation: {
    /**
     * createTransaction — userId is stamped from the JWT, never from client input.
     */
    createTransaction: async (_parent, { input }, context) => {
      try {
        const identity = requireAuth(context);

        const { amount, type, description } = input;

        if (!amount || amount <= 0) {
          throw new ValidationError('Validation failed', [
            { field: 'amount', message: 'Amount must be greater than 0' },
          ]);
        }
        if (!['CREDIT', 'DEBIT'].includes(type)) {
          throw new ValidationError('Validation failed', [
            { field: 'type', message: 'Type must be CREDIT or DEBIT' },
          ]);
        }

        await connectDB();

        const tx = await Transaction.create({
          transactionId: uuidv4(),
          userId:        identity.userId,   // always from JWT — never from client
          amount,
          type,
          description:   description || '',
        });

        logger.info('createTransaction resolved', {
          transactionId: tx.transactionId,
          userId: identity.userId,
          type,
          amount,
        });

        return tx.toObject();
      } catch (err) {
        const f = handleError(err);
        throw Object.assign(new Error(f.message), { extensions: f.extensions });
      }
    },

    /**
     * deleteTransaction — users can only delete their own; admins can delete any.
     */
    deleteTransaction: async (_parent, { transactionId }, context) => {
      try {
        const identity = requireAuth(context);
        await connectDB();

        const tx = await Transaction.findOne({ transactionId });
        if (!tx) throw new NotFoundError('Transaction', transactionId);

        if (identity.role !== 'ADMIN' && tx.userId !== identity.userId) {
          throw new ForbiddenError('You can only delete your own transactions');
        }

        await Transaction.deleteOne({ transactionId });
        logger.info('deleteTransaction resolved', { transactionId });
        return { success: true, message: 'Transaction deleted' };
      } catch (err) {
        const f = handleError(err);
        throw Object.assign(new Error(f.message), { extensions: f.extensions });
      }
    },
  },

  // Map MongoDB _id → GraphQL id
  Transaction: {
    id: (parent) => parent._id?.toString() || parent.id,
  },
};

module.exports = transactionResolver;
