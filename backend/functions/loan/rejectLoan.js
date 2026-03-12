'use strict';

/**
 * functions/loan/rejectLoan.js
 * Lambda handler: Reject a pending loan (admin only).
 * Triggered by AppSync Mutation.rejectLoan
 */

const { connectDB } = require('../../core/db');
const { createLogger } = require('../../core/logger');
const { handleError, NotFoundError, ForbiddenError } = require('../../core/errorHandler');
const { sendLoanRejectedNotification } = require('../../core/notification');
const { publishLoanRejectedEvent } = require('../../core/events');
const { extractIdentity } = require('../../core/auth');

const logger = createLogger('functions:loan:rejectLoan');

let LoanModel, UserModel;
function getLoan() {
  if (LoanModel) return LoanModel;
  const mongoose = require('mongoose');
  LoanModel = mongoose.models.Loan || mongoose.model('Loan', new mongoose.Schema({ loanId: String, userId: String, loanType: String, status: String, notes: String, rejectionReason: String }, { strict: false, timestamps: true }));
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

    const { loanId, reason } = event.arguments;

    await connectDB();
    const Loan = getLoan();
    const User = getUser();

    const loan = await Loan.findOneAndUpdate(
      { loanId, status: 'PENDING' },
      { $set: { status: 'REJECTED', rejectionReason: reason || 'Application did not meet approval criteria' } },
      { new: true }
    ).lean();

    if (!loan) throw new NotFoundError('Pending loan', loanId);

    logger.info('Loan rejected', { loanId, rejectedBy: identity.userId });

    const user = await User.findOne({ userId: loan.userId }).lean();
    if (user) {
      Promise.allSettled([
        sendLoanRejectedNotification(loan, user),
        publishLoanRejectedEvent(loan),
      ]).then((results) => {
        results.forEach((r, i) => {
          if (r.status === 'rejected') logger.error(`Rejection side-effect ${i} failed`, { error: r.reason?.message });
        });
      });
    }

    return loan;
  } catch (err) {
    const f = handleError(err);
    throw Object.assign(new Error(f.message), { extensions: f.extensions });
  }
};
