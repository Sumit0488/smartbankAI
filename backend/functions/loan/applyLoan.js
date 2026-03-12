'use strict';

/**
 * functions/loan/applyLoan.js
 * Lambda handler: Apply for a new loan.
 * Triggered by AppSync Mutation.applyLoan
 */

const { v4: uuidv4 } = require('uuid');

const { connectDB } = require('../../core/db');
const { createLogger } = require('../../core/logger');
const { handleError, ForbiddenError } = require('../../core/errorHandler');
const { validateApplyLoan } = require('../../core/validation');
const { extractIdentity } = require('../../core/auth');

const logger = createLogger('functions:loan:applyLoan');

/**
 * EMI = P × r × (1+r)^n / ((1+r)^n - 1)
 */
function calcEMI(principal, annualRate, months) {
  if (annualRate === 0) {
    const emi = +(principal / months).toFixed(2);
    return { emi, totalPayable: +principal.toFixed(2), totalInterest: 0 };
  }
  const r = annualRate / 12 / 100;
  const factor = Math.pow(1 + r, months);
  const emi = +(principal * r * factor / (factor - 1)).toFixed(2);
  const totalPayable = +(emi * months).toFixed(2);
  return { emi, totalPayable, totalInterest: +(totalPayable - principal).toFixed(2) };
}

let LoanModel;
function getModel() {
  if (LoanModel) return LoanModel;
  const mongoose = require('mongoose');
  const s = new mongoose.Schema(
    { loanId: { type: String, unique: true }, userId: String, loanType: String,
      loanAmount: Number, interestRate: Number, tenure: Number, emi: Number,
      totalPayable: Number, totalInterest: Number, status: { type: String, default: 'PENDING' },
      bankName: String, appliedAt: { type: Date, default: Date.now }, notes: String },
    { timestamps: true }
  );
  LoanModel = mongoose.models.Loan || mongoose.model('Loan', s);
  return LoanModel;
}

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  logger.logEvent(event);

  try {
    const identity = extractIdentity(event.identity);
    if (!identity) throw new ForbiddenError('Authentication required');

    const input = event.arguments?.input || event.arguments || {};
    const data = validateApplyLoan(input);
    const { emi, totalPayable, totalInterest } = calcEMI(data.loanAmount, data.interestRate, data.tenure);

    await connectDB();
    const Loan = getModel();

    const loan = await Loan.create({
      ...data,
      userId: identity.userId,
      loanId: uuidv4(),
      emi, totalPayable, totalInterest,
      status: 'PENDING',
      appliedAt: new Date(),
    });

    const loanObj = loan.toObject();
    logger.info('applyLoan resolved', { loanId: loanObj.loanId, userId: identity.userId });
    return loanObj;
  } catch (err) {
    const f = handleError(err);
    throw Object.assign(new Error(f.message), { extensions: f.extensions });
  }
};
