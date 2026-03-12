'use strict';

/**
 * functions/investment/createInvestment.js
 * Lambda handler: Create a new investment record.
 * Triggered by AppSync Mutation.createInvestment
 */

const { v4: uuidv4 } = require('uuid');

const { connectDB } = require('../../core/db');
const { createLogger } = require('../../core/logger');
const { handleError, ForbiddenError } = require('../../core/errorHandler');
const { validateCreateInvestment } = require('../../core/validation');
const { publishInvestmentCreatedEvent } = require('../../core/events');
const { extractIdentity } = require('../../core/auth');

const logger = createLogger('functions:investment:createInvestment');

let InvestmentModel;
function getModel() {
  if (InvestmentModel) return InvestmentModel;
  const mongoose = require('mongoose');
  const s = new mongoose.Schema(
    { investmentId: { type: String, unique: true }, userId: String, investmentType: String,
      amount: Number, expectedReturn: Number, currentValue: Number,
      status: { type: String, default: 'ACTIVE' }, investedAt: { type: Date, default: Date.now }, notes: String },
    { timestamps: true }
  );
  InvestmentModel = mongoose.models.Investment || mongoose.model('Investment', s);
  return InvestmentModel;
}

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  logger.logEvent(event);

  try {
    const identity = extractIdentity(event.identity);
    if (!identity) throw new ForbiddenError('Authentication required');

    const input = event.arguments?.input || event.arguments || {};
    const data = validateCreateInvestment(input);

    await connectDB();
    const Investment = getModel();

    const inv = await Investment.create({
      ...data,
      userId: identity.userId,
      investmentId: uuidv4(),
      currentValue: data.currentValue ?? data.amount,
      investedAt: new Date(),
    });

    const invObj = inv.toObject();
    invObj.gainLoss = 0;
    invObj.gainLossPercent = 0;

    publishInvestmentCreatedEvent(invObj).catch((e) =>
      logger.error('Investment event publish failed', { error: e.message })
    );

    logger.info('createInvestment resolved', { investmentId: invObj.investmentId, userId: identity.userId });
    return invObj;
  } catch (err) {
    const f = handleError(err);
    throw Object.assign(new Error(f.message), { extensions: f.extensions });
  }
};
