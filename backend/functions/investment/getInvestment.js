'use strict';

/**
 * functions/investment/getInvestment.js
 * Lambda handler: Get an investment by investmentId.
 * Triggered by AppSync Query.getInvestment
 */

const { connectDB } = require('../../core/db');
const { createLogger } = require('../../core/logger');
const { handleError, NotFoundError, ForbiddenError } = require('../../core/errorHandler');
const { extractIdentity } = require('../../core/auth');

const logger = createLogger('functions:investment:getInvestment');

let InvestmentModel;
function getModel() {
  if (InvestmentModel) return InvestmentModel;
  const mongoose = require('mongoose');
  const s = new mongoose.Schema({ investmentId: String, userId: String }, { strict: false, timestamps: true });
  InvestmentModel = mongoose.models.Investment || mongoose.model('Investment', s);
  return InvestmentModel;
}

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  logger.logEvent(event);

  try {
    const identity = extractIdentity(event.identity);
    if (!identity) throw new ForbiddenError('Authentication required');

    const { investmentId } = event.arguments;

    await connectDB();
    const Investment = getModel();

    const inv = await Investment.findOne({ investmentId }).lean();
    if (!inv) throw new NotFoundError('Investment', investmentId);

    if (identity.role !== 'ADMIN' && identity.userId !== inv.userId) throw new ForbiddenError();

    const current = inv.currentValue ?? inv.amount;
    inv.gainLoss = +(current - inv.amount).toFixed(2);
    inv.gainLossPercent = inv.amount > 0 ? +((inv.gainLoss / inv.amount) * 100).toFixed(2) : 0;

    logger.info('getInvestment resolved', { investmentId });
    return inv;
  } catch (err) {
    const f = handleError(err);
    throw Object.assign(new Error(f.message), { extensions: f.extensions });
  }
};
