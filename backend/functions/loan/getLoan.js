'use strict';

/**
 * functions/loan/getLoan.js
 * Lambda handler: Get a loan by loanId.
 * Triggered by AppSync Query.getLoan
 */

const { connectDB } = require('../../core/db');
const { createLogger } = require('../../core/logger');
const { handleError, NotFoundError, ForbiddenError } = require('../../core/errorHandler');
const { extractIdentity } = require('../../core/auth');

const logger = createLogger('functions:loan:getLoan');

let LoanModel;
function getModel() {
  if (LoanModel) return LoanModel;
  const mongoose = require('mongoose');
  const s = new mongoose.Schema({ loanId: String, userId: String }, { strict: false, timestamps: true });
  LoanModel = mongoose.models.Loan || mongoose.model('Loan', s);
  return LoanModel;
}

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  logger.logEvent(event);

  try {
    const identity = extractIdentity(event.identity);
    if (!identity) throw new ForbiddenError('Authentication required');

    const { loanId } = event.arguments;

    await connectDB();
    const Loan = getModel();

    const loan = await Loan.findOne({ loanId }).lean();
    if (!loan) throw new NotFoundError('Loan', loanId);

    if (identity.role !== 'ADMIN' && identity.userId !== loan.userId) {
      throw new ForbiddenError('You can only view your own loans');
    }

    logger.info('getLoan resolved', { loanId });
    return loan;
  } catch (err) {
    const f = handleError(err);
    throw Object.assign(new Error(f.message), { extensions: f.extensions });
  }
};
