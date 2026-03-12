'use strict';

/**
 * functions/investment/updateInvestment.js
 * Lambda handler: Update an existing investment.
 * Triggered by AppSync Mutation.updateInvestment
 */

const { connectDB } = require('../../core/db');
const { createLogger } = require('../../core/logger');
const { handleError, NotFoundError, ForbiddenError } = require('../../core/errorHandler');
const { validateUpdateInvestment } = require('../../core/validation');
const { extractIdentity } = require('../../core/auth');

const logger = createLogger('functions:investment:updateInvestment');

let InvestmentModel;
function getModel() {
  if (InvestmentModel) return InvestmentModel;
  const mongoose = require('mongoose');
  const s = new mongoose.Schema({ investmentId: String, userId: String, amount: Number, currentValue: Number,
    expectedReturn: Number, status: String, notes: String }, { timestamps: true, strict: false });
  InvestmentModel = mongoose.models.Investment || mongoose.model('Investment', s);
  return InvestmentModel;
}

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  logger.logEvent(event);

  try {
    const identity = extractIdentity(event.identity);
    if (!identity) throw new ForbiddenError('Authentication required');

    const { investmentId, input } = event.arguments;
    const data = validateUpdateInvestment(input);

    await connectDB();
    const Investment = getModel();

    const existing = await Investment.findOne({ investmentId }).lean();
    if (!existing) throw new NotFoundError('Investment', investmentId);
    if (identity.role !== 'ADMIN' && identity.userId !== existing.userId) throw new ForbiddenError();

    const inv = await Investment.findOneAndUpdate(
      { investmentId },
      { $set: data },
      { new: true, runValidators: true }
    ).lean();

    const current = inv.currentValue ?? inv.amount;
    inv.gainLoss = +(current - inv.amount).toFixed(2);
    inv.gainLossPercent = inv.amount > 0 ? +((inv.gainLoss / inv.amount) * 100).toFixed(2) : 0;

    logger.info('updateInvestment resolved', { investmentId });
    return inv;
  } catch (err) {
    const f = handleError(err);
    throw Object.assign(new Error(f.message), { extensions: f.extensions });
  }
};
