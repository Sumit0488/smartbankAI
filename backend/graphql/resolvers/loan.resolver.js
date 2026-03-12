'use strict';

/**
 * graphql/resolvers/loan.resolver.js
 * GraphQL resolvers for the Loan module.
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const { extractIdentity } = require('../../core/auth');
const { connectDB } = require('../../core/db');
const { createLogger } = require('../../core/logger');
const { handleError, NotFoundError, ForbiddenError, ValidationError } = require('../../core/errorHandler');
const { validateApplyLoan, validateUpdateLoan, validatePagination } = require('../../core/validation');
const { paginatedResponse } = require('../../core/response');
const { sendLoanApprovedNotification, sendLoanRejectedNotification } = require('../../core/notification');
const { publishLoanApprovedEvent, publishLoanRejectedEvent } = require('../../core/events');

const logger = createLogger('resolvers:loan');

// ─── EMI Calculator ───────────────────────────────────────────────────────────

/**
 * Calculate EMI using the standard formula
 * EMI = P × r × (1+r)^n / ((1+r)^n - 1)
 * @param {number} principal
 * @param {number} annualRate - Annual interest rate in %
 * @param {number} tenureMonths
 * @returns {{ emi: number, totalPayable: number, totalInterest: number }}
 */
function calculateEMI(principal, annualRate, tenureMonths) {
  if (annualRate === 0) {
    const emi = principal / tenureMonths;
    return { emi: +emi.toFixed(2), totalPayable: +principal.toFixed(2), totalInterest: 0 };
  }
  const r = annualRate / 12 / 100;
  const n = tenureMonths;
  const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalPayable = emi * n;
  const totalInterest = totalPayable - principal;
  return {
    emi: +emi.toFixed(2),
    totalPayable: +totalPayable.toFixed(2),
    totalInterest: +totalInterest.toFixed(2),
  };
}

// ─── Mongoose Model ───────────────────────────────────────────────────────────

const loanSchema = new mongoose.Schema(
  {
    loanId:          { type: String, default: uuidv4, unique: true, index: true },
    userId:          { type: String, required: true, index: true },
    loanType:        { type: String, enum: ['HOME', 'CAR', 'PERSONAL', 'EDUCATION'], required: true },
    loanAmount:      { type: Number, required: true, min: 1000 },
    interestRate:    { type: Number, required: true, min: 0 },
    tenure:          { type: Number, required: true, min: 1 },
    emi:             { type: Number, min: 0 },
    totalPayable:    { type: Number, min: 0 },
    totalInterest:   { type: Number, min: 0 },
    status:          { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'DISBURSED', 'CLOSED', 'CANCELLED'], default: 'PENDING' },
    bankName:        { type: String },
    appliedAt:       { type: Date, default: Date.now },
    notes:           { type: String, maxlength: 500 },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

function getLoanModel() {
  return mongoose.models.Loan || mongoose.model('Loan', loanSchema);
}

function getUserModel() {
  const userSchema = new mongoose.Schema({ userId: String, email: String, name: String, phone: String }, { strict: false });
  return mongoose.models.User || mongoose.model('User', userSchema);
}

// ─── Resolvers ────────────────────────────────────────────────────────────────

const loanResolver = {
  Query: {
    getLoan: async (_parent, { loanId }, context) => {
      try {
        const identity = extractIdentity(context.identity);
        if (!identity) throw new Error('Authentication required');

        await connectDB();
        const Loan = getLoanModel();

        const loan = await Loan.findOne({ loanId }).lean();
        if (!loan) throw new NotFoundError('Loan', loanId);

        if (identity.role !== 'ADMIN' && identity.userId !== loan.userId) {
          throw new ForbiddenError('You can only view your own loans');
        }

        logger.info('getLoan resolved', { loanId });
        return loan;
      } catch (err) {
        const formatted = handleError(err);
        throw Object.assign(new Error(formatted.message), { extensions: formatted.extensions });
      }
    },

    listLoans: async (_parent, args, context) => {
      try {
        const identity = extractIdentity(context.identity);
        if (!identity) throw new Error('Authentication required');

        const { page, limit } = validatePagination({ page: args.page, limit: args.limit });
        await connectDB();
        const Loan = getLoanModel();

        const filter = {};
        if (identity.role !== 'ADMIN') filter.userId = identity.userId;
        else if (args.userId) filter.userId = args.userId;
        if (args.status)   filter.status = args.status;
        if (args.loanType) filter.loanType = args.loanType;

        const [items, total] = await Promise.all([
          Loan.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
          Loan.countDocuments(filter),
        ]);

        logger.info('listLoans resolved', { total, userId: identity.userId });
        return paginatedResponse(items, total, page, limit);
      } catch (err) {
        const formatted = handleError(err);
        throw Object.assign(new Error(formatted.message), { extensions: formatted.extensions });
      }
    },
  },

  Mutation: {
    applyLoan: async (_parent, { input }, context) => {
      try {
        const identity = extractIdentity(context.identity);
        if (!identity) throw new Error('Authentication required');

        const data = validateApplyLoan(input);
        const { emi, totalPayable, totalInterest } = calculateEMI(data.loanAmount, data.interestRate, data.tenure);

        await connectDB();
        const Loan = getLoanModel();

        const loan = await Loan.create({
          ...data,
          userId: identity.userId,
          loanId: uuidv4(),
          emi,
          totalPayable,
          totalInterest,
          status: 'PENDING',
          appliedAt: new Date(),
        });

        logger.info('applyLoan resolved', { loanId: loan.loanId, userId: identity.userId });
        return loan.toObject();
      } catch (err) {
        const formatted = handleError(err);
        throw Object.assign(new Error(formatted.message), { extensions: formatted.extensions });
      }
    },

    updateLoan: async (_parent, { loanId, input }, context) => {
      try {
        const identity = extractIdentity(context.identity);
        if (!identity) throw new Error('Authentication required');

        const data = validateUpdateLoan(input);
        await connectDB();
        const Loan = getLoanModel();

        const existing = await Loan.findOne({ loanId });
        if (!existing) throw new NotFoundError('Loan', loanId);
        if (identity.role !== 'ADMIN' && identity.userId !== existing.userId) throw new ForbiddenError();
        if (existing.status !== 'PENDING') throw new ValidationError('Only PENDING loans can be updated');

        const newAmount = data.loanAmount || existing.loanAmount;
        const newRate = data.interestRate || existing.interestRate;
        const newTenure = data.tenure || existing.tenure;
        const { emi, totalPayable, totalInterest } = calculateEMI(newAmount, newRate, newTenure);

        const loan = await Loan.findOneAndUpdate(
          { loanId },
          { $set: { ...data, emi, totalPayable, totalInterest } },
          { new: true, runValidators: true }
        ).lean();

        logger.info('updateLoan resolved', { loanId });
        return loan;
      } catch (err) {
        const formatted = handleError(err);
        throw Object.assign(new Error(formatted.message), { extensions: formatted.extensions });
      }
    },

    approveLoan: async (_parent, { loanId }, context) => {
      try {
        const identity = extractIdentity(context.identity);
        if (!identity || identity.role !== 'ADMIN') throw new ForbiddenError('Admin required');

        await connectDB();
        const Loan = getLoanModel();
        const User = getUserModel();

        const loan = await Loan.findOneAndUpdate(
          { loanId, status: 'PENDING' },
          { $set: { status: 'APPROVED' } },
          { new: true }
        ).lean();

        if (!loan) throw new NotFoundError('Pending loan', loanId);

        const user = await User.findOne({ userId: loan.userId }).lean();
        if (user) {
          Promise.allSettled([
            sendLoanApprovedNotification(loan, user),
            publishLoanApprovedEvent(loan),
          ]).catch((e) => logger.error('Post-approval side-effects failed', { error: e.message }));
        }

        logger.info('approveLoan resolved', { loanId, approvedBy: identity.userId });
        return loan;
      } catch (err) {
        const formatted = handleError(err);
        throw Object.assign(new Error(formatted.message), { extensions: formatted.extensions });
      }
    },

    rejectLoan: async (_parent, { loanId, reason }, context) => {
      try {
        const identity = extractIdentity(context.identity);
        if (!identity || identity.role !== 'ADMIN') throw new ForbiddenError('Admin required');

        await connectDB();
        const Loan = getLoanModel();
        const User = getUserModel();

        const loan = await Loan.findOneAndUpdate(
          { loanId, status: 'PENDING' },
          { $set: { status: 'REJECTED', rejectionReason: reason || 'Application did not meet criteria' } },
          { new: true }
        ).lean();

        if (!loan) throw new NotFoundError('Pending loan', loanId);

        const user = await User.findOne({ userId: loan.userId }).lean();
        if (user) {
          Promise.allSettled([
            sendLoanRejectedNotification(loan, user),
            publishLoanRejectedEvent(loan),
          ]).catch((e) => logger.error('Post-rejection side-effects failed', { error: e.message }));
        }

        logger.info('rejectLoan resolved', { loanId, rejectedBy: identity.userId });
        return loan;
      } catch (err) {
        const formatted = handleError(err);
        throw Object.assign(new Error(formatted.message), { extensions: formatted.extensions });
      }
    },

    disburseLoan: async (_parent, { loanId }, context) => {
      try {
        const identity = extractIdentity(context.identity);
        if (!identity || identity.role !== 'ADMIN') throw new ForbiddenError();

        await connectDB();
        const Loan = getLoanModel();
        const loan = await Loan.findOneAndUpdate(
          { loanId, status: 'APPROVED' },
          { $set: { status: 'DISBURSED' } },
          { new: true }
        ).lean();

        if (!loan) throw new NotFoundError('Approved loan', loanId);
        logger.info('disburseLoan resolved', { loanId });
        return loan;
      } catch (err) {
        const formatted = handleError(err);
        throw Object.assign(new Error(formatted.message), { extensions: formatted.extensions });
      }
    },

    closeLoan: async (_parent, { loanId }, context) => {
      try {
        const identity = extractIdentity(context.identity);
        if (!identity) throw new Error('Authentication required');

        await connectDB();
        const Loan = getLoanModel();
        const loan = await Loan.findOneAndUpdate(
          { loanId, status: 'DISBURSED' },
          { $set: { status: 'CLOSED' } },
          { new: true }
        ).lean();

        if (!loan) throw new NotFoundError('Disbursed loan', loanId);
        logger.info('closeLoan resolved', { loanId });
        return loan;
      } catch (err) {
        const formatted = handleError(err);
        throw Object.assign(new Error(formatted.message), { extensions: formatted.extensions });
      }
    },

    cancelLoan: async (_parent, { loanId, reason }, context) => {
      try {
        const identity = extractIdentity(context.identity);
        if (!identity) throw new Error('Authentication required');

        await connectDB();
        const Loan = getLoanModel();

        const existing = await Loan.findOne({ loanId }).lean();
        if (!existing) throw new NotFoundError('Loan', loanId);
        if (identity.role !== 'ADMIN' && identity.userId !== existing.userId) throw new ForbiddenError();
        if (existing.status !== 'PENDING') {
          throw new ValidationError('Only PENDING loans can be cancelled');
        }

        const loan = await Loan.findOneAndUpdate(
          { loanId },
          { $set: { status: 'CANCELLED', rejectionReason: reason || 'Cancelled by applicant' } },
          { new: true }
        ).lean();

        logger.info('cancelLoan resolved', { loanId, cancelledBy: identity.userId });
        return loan;
      } catch (err) {
        const formatted = handleError(err);
        throw Object.assign(new Error(formatted.message), { extensions: formatted.extensions });
      }
    },
  },

  // Field resolvers for Loan
  Loan: {
    id: (parent) => parent._id?.toString() || parent.id,
    user: async (loan) => {
      try {
        await connectDB();
        const User = getUserModel();
        return User.findOne({ userId: loan.userId }).lean();
      } catch {
        return null;
      }
    },
  },
};

module.exports = loanResolver;
