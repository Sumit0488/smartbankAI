'use strict';

/**
 * functions/loan/index.js
 * Lambda entry point — routes AppSync field calls to the correct loan handler.
 * Handler path: functions/loan/index.handler
 */

const { extractIdentity } = require('../../core/auth');
const { connectDB } = require('../../core/db');
const { handleError, NotFoundError, ForbiddenError, ValidationError } = require('../../core/errorHandler');
const Loan = require('../../models/Loan');

// ─── Shared helpers ───────────────────────────────────────────────────────────

function id(identity) {
  const { extractIdentity } = require('../../core/auth');
  const i = extractIdentity(identity);
  if (!i) throw Object.assign(new Error('Authentication required'), { extensions: { code: 'UNAUTHENTICATED', statusCode: 401 } });
  return i;
}

function err(e) {
  const f = handleError(e);
  throw Object.assign(new Error(f.message), { extensions: f.extensions });
}

// ─── Field handlers ───────────────────────────────────────────────────────────

const HANDLERS = {
  // ── Delegated to individual files ─────────────────────────────────────────
  applyLoan:    (event, ctx) => require('./applyLoan').handler(event, ctx),
  getLoan:      (event, ctx) => require('./getLoan').handler(event, ctx),
  listLoans:    (event, ctx) => require('./listLoans') ? require('./listLoans').handler(event, ctx) : listLoansInline(event),
  approveLoan:  (event, ctx) => require('./approveLoan').handler(event, ctx),
  rejectLoan:   (event, ctx) => require('./rejectLoan').handler(event, ctx),
  updateLoan:   (event, ctx) => require('./updateLoan') ? require('./updateLoan').handler(event, ctx) : updateLoanInline(event),

  // ── cancelLoan — new, defined inline ──────────────────────────────────────
  cancelLoan: async (event) => {
    try {
      const identity = id(event.identity);
      const { loanId, reason } = event.arguments || {};

      await connectDB();
      const loan = await Loan.findOne({ loanId }).lean();
      if (!loan) throw new NotFoundError('Loan', loanId);
      if (identity.role !== 'ADMIN' && identity.userId !== loan.userId) throw new ForbiddenError();
      if (loan.status !== 'PENDING') throw new ValidationError('Only PENDING loans can be cancelled');

      const updated = await Loan.findOneAndUpdate(
        { loanId },
        { $set: { status: 'CANCELLED', rejectionReason: reason || 'Cancelled by applicant' } },
        { new: true }
      ).lean();
      return updated;
    } catch (e) { err(e); }
  },

  // ── disburseLoan ───────────────────────────────────────────────────────────
  disburseLoan: async (event) => {
    try {
      const identity = id(event.identity);
      if (identity.role !== 'ADMIN') throw new ForbiddenError('Admin required');
      await connectDB();
      const loan = await Loan.findOneAndUpdate(
        { loanId: event.arguments.loanId, status: 'APPROVED' },
        { $set: { status: 'DISBURSED' } },
        { new: true }
      ).lean();
      if (!loan) throw new NotFoundError('Approved loan', event.arguments.loanId);
      return loan;
    } catch (e) { err(e); }
  },

  // ── closeLoan ─────────────────────────────────────────────────────────────
  closeLoan: async (event) => {
    try {
      const identity = id(event.identity);
      await connectDB();
      const loan = await Loan.findOneAndUpdate(
        { loanId: event.arguments.loanId, status: 'DISBURSED' },
        { $set: { status: 'CLOSED' } },
        { new: true }
      ).lean();
      if (!loan) throw new NotFoundError('Disbursed loan', event.arguments.loanId);
      return loan;
    } catch (e) { err(e); }
  },
};

// ─── Lambda entry point ───────────────────────────────────────────────────────

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const field = event.info?.fieldName;
  const handle = HANDLERS[field];
  if (!handle) throw new Error(`LoanHandler: no handler for field "${field}"`);
  return handle(event, context);
};
