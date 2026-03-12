'use strict';

/**
 * functions/loan/updateLoan.js
 * Lambda handler: Update a pending loan application.
 * Triggered by AppSync Mutation.updateLoan
 */

const { connectDB } = require('../../core/db');
const { createLogger } = require('../../core/logger');
const { handleError, NotFoundError, ForbiddenError, ValidationError } = require('../../core/errorHandler');
const { validateUpdateLoan } = require('../../core/validation');
const { extractIdentity } = require('../../core/auth');

const logger = createLogger('functions:loan:updateLoan');

function calcEMI(p, r, n) {
  if (r === 0) return { emi: +(p/n).toFixed(2), totalPayable: +p.toFixed(2), totalInterest: 0 };
  const mr = r / 12 / 100;
  const f = Math.pow(1 + mr, n);
  const emi = +(p * mr * f / (f - 1)).toFixed(2);
  const tp = +(emi * n).toFixed(2);
  return { emi, totalPayable: tp, totalInterest: +(tp - p).toFixed(2) };
}

let LoanModel;
function getModel() {
  if (LoanModel) return LoanModel;
  const mongoose = require('mongoose');
  const s = new mongoose.Schema({ loanId: String, userId: String, loanAmount: Number, interestRate: Number,
    tenure: Number, emi: Number, totalPayable: Number, totalInterest: Number, status: String,
    bankName: String, notes: String }, { timestamps: true, strict: false });
  LoanModel = mongoose.models.Loan || mongoose.model('Loan', s);
  return LoanModel;
}

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  logger.logEvent(event);

  try {
    const identity = extractIdentity(event.identity);
    if (!identity) throw new ForbiddenError('Authentication required');

    const { loanId, input } = event.arguments;
    const data = validateUpdateLoan(input);

    await connectDB();
    const Loan = getModel();

    const existing = await Loan.findOne({ loanId }).lean();
    if (!existing) throw new NotFoundError('Loan', loanId);
    if (identity.role !== 'ADMIN' && identity.userId !== existing.userId) throw new ForbiddenError();
    if (existing.status !== 'PENDING') throw new ValidationError('Only PENDING loans can be updated');

    const newAmount = data.loanAmount ?? existing.loanAmount;
    const newRate   = data.interestRate ?? existing.interestRate;
    const newTenure = data.tenure ?? existing.tenure;
    const { emi, totalPayable, totalInterest } = calcEMI(newAmount, newRate, newTenure);

    const loan = await Loan.findOneAndUpdate(
      { loanId },
      { $set: { ...data, emi, totalPayable, totalInterest } },
      { new: true, runValidators: true }
    ).lean();

    logger.info('updateLoan resolved', { loanId });
    return loan;
  } catch (err) {
    const f = handleError(err);
    throw Object.assign(new Error(f.message), { extensions: f.extensions });
  }
};
