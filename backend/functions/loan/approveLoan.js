'use strict';

/**
 * functions/loan/approveLoan.js
 * Lambda handler: Approve a pending loan (admin only).
 * Triggered by AppSync Mutation.approveLoan
 * Side effects: sends email+SMS notification, publishes EventBridge event.
 */

const { connectDB } = require('../../core/db');
const { createLogger } = require('../../core/logger');
const { handleError, NotFoundError, ForbiddenError } = require('../../core/errorHandler');
const { sendLoanApprovedNotification } = require('../../core/notification');
const { publishLoanApprovedEvent } = require('../../core/events');
const { extractIdentity } = require('../../core/auth');

const logger = createLogger('functions:loan:approveLoan');

let LoanModel, UserModel;
function getLoan() {
  if (LoanModel) return LoanModel;
  const mongoose = require('mongoose');
  LoanModel = mongoose.models.Loan || mongoose.model('Loan', new mongoose.Schema({ loanId: String, userId: String, loanType: String, loanAmount: Number, emi: Number, bankName: String, status: String }, { strict: false, timestamps: true }));
  return LoanModel;
}
function getUser() {
  if (UserModel) return UserModel;
  const mongoose = require('mongoose');
  UserModel = mongoose.models.User || mongoose.model('User', new mongoose.Schema({ userId: String, name: String, email: String, phone: String }, { strict: false }));
  return UserModel;
}

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  logger.logEvent(event);

  try {
    const identity = extractIdentity(event.identity);
    if (!identity || identity.role !== 'ADMIN') throw new ForbiddenError('Admin role required');

    const { loanId } = event.arguments;

    await connectDB();
    const Loan = getLoan();
    const User = getUser();

    const loan = await Loan.findOneAndUpdate(
      { loanId, status: 'PENDING' },
      { $set: { status: 'APPROVED' } },
      { new: true }
    ).lean();

    if (!loan) throw new NotFoundError('Pending loan', loanId);

    logger.info('Loan approved', { loanId, approvedBy: identity.userId });

    // Non-blocking side effects
    const user = await User.findOne({ userId: loan.userId }).lean();
    if (user) {
      Promise.allSettled([
        sendLoanApprovedNotification(loan, user),
        publishLoanApprovedEvent(loan),
      ]).then((results) => {
        results.forEach((r, i) => {
          if (r.status === 'rejected') logger.error(`Approval side-effect ${i} failed`, { error: r.reason?.message });
        });
      });
    }

    return loan;
  } catch (err) {
    const f = handleError(err);
    throw Object.assign(new Error(f.message), { extensions: f.extensions });
  }
};
