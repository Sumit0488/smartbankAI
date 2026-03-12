'use strict';

/**
 * functions/investment/listInvestments.js
 * Lambda handler: List investments with pagination and filters.
 * Triggered by AppSync Query.listInvestments
 */

const { connectDB } = require('../../core/db');
const { createLogger } = require('../../core/logger');
const { handleError, ForbiddenError } = require('../../core/errorHandler');
const { validatePagination } = require('../../core/validation');
const { paginatedResponse } = require('../../core/response');
const { extractIdentity } = require('../../core/auth');

const logger = createLogger('functions:investment:listInvestments');

let InvestmentModel;
function getModel() {
  if (InvestmentModel) return InvestmentModel;
  const mongoose = require('mongoose');
  const s = new mongoose.Schema({ investmentId: String, userId: String, investmentType: String,
    amount: Number, currentValue: Number, expectedReturn: Number, status: String, investedAt: Date, notes: String },
    { timestamps: true, strict: false });
  InvestmentModel = mongoose.models.Investment || mongoose.model('Investment', s);
  return InvestmentModel;
}

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  logger.logEvent(event);

  try {
    const identity = extractIdentity(event.identity);
    if (!identity) throw new ForbiddenError('Authentication required');

    const args = event.arguments || {};
    const { page, limit } = validatePagination({ page: args.page, limit: args.limit });

    await connectDB();
    const Investment = getModel();

    const filter = {};
    if (identity.role !== 'ADMIN') filter.userId = identity.userId;
    else if (args.userId) filter.userId = args.userId;
    if (args.investmentType) filter.investmentType = args.investmentType;
    if (args.status) filter.status = args.status;

    const [rawItems, total] = await Promise.all([
      Investment.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Investment.countDocuments(filter),
    ]);

    const items = rawItems.map((inv) => {
      const current = inv.currentValue ?? inv.amount;
      return {
        ...inv,
        gainLoss: +(current - inv.amount).toFixed(2),
        gainLossPercent: inv.amount > 0 ? +((current - inv.amount) / inv.amount * 100).toFixed(2) : 0,
      };
    });

    logger.info('listInvestments resolved', { total, page, limit });
    return paginatedResponse(items, total, page, limit);
  } catch (err) {
    const f = handleError(err);
    throw Object.assign(new Error(f.message), { extensions: f.extensions });
  }
};
