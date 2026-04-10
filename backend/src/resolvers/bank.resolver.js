'use strict';

/**
 * src/resolvers/bank.resolver.js
 * Bank catalog — list, compare, and fetch banks. Auto-seeds sample data.
 */

const { v4: uuidv4 } = require('uuid');
const { connectDB } = require('../config/db');
const { createLogger } = require('../utils/logger');
const { handleError, NotFoundError, ValidationError } = require('../utils/errorHandler');
const { extractIdentity } = require('../utils/auth');
const Bank = require('../models/Bank');
const BankApplication = require('../models/BankApplication');

const logger = createLogger('resolvers:bank');

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_BANKS = [
  {
    bankName: 'HDFC Bank',
    bankCode: 'HDFC',
    country: 'India',
    interestRates: { savingsRate: 3.5, fdRate: 7.10, homeLoanRate: 8.75, carLoanRate: 7.50, personalLoanRate: 10.50 },
    features: ['NetBanking', 'Mobile App', 'NRI Services', 'Wealth Management', 'Lounge Access'],
    minDeposit: 10000,
    customerRating: 4.3,
    digitalBankingScore: 4.6,
  },
  {
    bankName: 'ICICI Bank',
    bankCode: 'ICIC',
    country: 'India',
    interestRates: { savingsRate: 3.5, fdRate: 7.00, homeLoanRate: 8.85, carLoanRate: 7.55, personalLoanRate: 10.65 },
    features: ['iMobile Pay', 'IMPS 24x7', 'Forex Services', 'Insurance', 'Demat Account'],
    minDeposit: 10000,
    customerRating: 4.2,
    digitalBankingScore: 4.5,
  },
  {
    bankName: 'State Bank of India',
    bankCode: 'SBIN',
    country: 'India',
    interestRates: { savingsRate: 2.70, fdRate: 6.80, homeLoanRate: 8.50, carLoanRate: 7.45, personalLoanRate: 11.00 },
    features: ['YONO App', 'Largest Branch Network', 'PM Jan Dhan', 'Senior Citizen FD', 'Kisan Credit Card'],
    minDeposit: 0,
    customerRating: 3.8,
    digitalBankingScore: 4.0,
  },
  {
    bankName: 'Axis Bank',
    bankCode: 'UTIB',
    country: 'India',
    interestRates: { savingsRate: 3.5, fdRate: 7.00, homeLoanRate: 8.90, carLoanRate: 7.60, personalLoanRate: 10.50 },
    features: ['Burgundy Private Banking', 'Forex Cards', 'Open Banking API', 'Neo Banking', '24x7 Support'],
    minDeposit: 10000,
    customerRating: 4.1,
    digitalBankingScore: 4.4,
  },
  {
    bankName: 'Kotak Mahindra Bank',
    bankCode: 'KKBK',
    country: 'India',
    interestRates: { savingsRate: 4.00, fdRate: 7.25, homeLoanRate: 8.70, carLoanRate: 7.50, personalLoanRate: 10.75 },
    features: ['811 Zero Balance', '4% Savings Rate', 'White Label Cards', 'Digital First', 'Instant Personal Loan'],
    minDeposit: 0,
    customerRating: 4.3,
    digitalBankingScore: 4.7,
  },
  {
    bankName: 'Yes Bank',
    bankCode: 'YESB',
    country: 'India',
    interestRates: { savingsRate: 5.00, fdRate: 7.50, homeLoanRate: 9.15, carLoanRate: 8.00, personalLoanRate: 11.25 },
    features: ['High Savings Rate', 'YES PAY Wallet', 'Trade Finance', 'Corporate Banking', 'API Banking'],
    minDeposit: 10000,
    customerRating: 3.9,
    digitalBankingScore: 4.2,
  },
];

async function seedBanksIfEmpty() {
  const count = await Bank.countDocuments();
  if (count === 0) {
    await Bank.insertMany(SEED_BANKS.map(b => ({ ...b, bankId: uuidv4() })));
    logger.info('Bank catalog seeded with sample banks');
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function throwErr(err) {
  const f = handleError(err);
  throw Object.assign(new Error(f.message), { extensions: f.extensions });
}

// ─── Resolvers ────────────────────────────────────────────────────────────────

const bankResolver = {
  Query: {
    listRegisteredBanks: async (_parent, { country }, _context) => {
      try {
        await connectDB();
        await seedBanksIfEmpty();

        const filter = country ? { country } : {};
        const items = await Bank.find(filter).sort({ customerRating: -1 }).lean();
        return { items, total: items.length };
      } catch (err) { throwErr(err); }
    },

    getBank: async (_parent, { bankId }, _context) => {
      try {
        await connectDB();
        const bank = await Bank.findOne({ bankId }).lean();
        if (!bank) throw new NotFoundError('Bank', bankId);
        return bank;
      } catch (err) { throwErr(err); }
    },

    compareBanks: async (_parent, { bankIds }, _context) => {
      try {
        if (!bankIds || bankIds.length < 2) {
          throw new ValidationError('Provide at least 2 bank IDs to compare');
        }
        await connectDB();

        const banks = await Bank.find({ bankId: { $in: bankIds } }).lean();
        if (banks.length === 0) throw new NotFoundError('Banks', bankIds.join(', '));

        const bestSavingsRate    = banks.reduce((best, b) => b.interestRates.savingsRate    > best.interestRates.savingsRate    ? b : best, banks[0]);
        const lowestHomeLoanRate = banks.reduce((best, b) => b.interestRates.homeLoanRate   < best.interestRates.homeLoanRate   ? b : best, banks[0]);
        const lowestPersonalLoanRate = banks.reduce((best, b) => b.interestRates.personalLoanRate < best.interestRates.personalLoanRate ? b : best, banks[0]);

        logger.info('compareBanks resolved', { bankIds, count: banks.length });
        return { banks, bestSavingsRate, lowestHomeLoanRate, lowestPersonalLoanRate };
      } catch (err) { throwErr(err); }
    },

    listBankApplications: async (_parent, _args, context) => {
      try {
        const identity = extractIdentity(context.identity);
        if (!identity) throw new Error('Authentication required');
        await connectDB();
        return BankApplication.find({ userId: identity.userId }).sort({ appliedAt: -1 }).lean();
      } catch (err) { throwErr(err); }
    },
  },

  Mutation: {
    createBankApplication: async (_parent, { input }, context) => {
      try {
        const identity = extractIdentity(context.identity);
        if (!identity) throw new Error('Authentication required');

        await connectDB();
        const app = await BankApplication.create({
          applicationId: uuidv4(),
          userId: identity.userId,
          bankName: input.bankName,
          accountType: input.accountType,
          status: 'PENDING',
          appliedAt: new Date(),
        });

        logger.info('createBankApplication resolved', { applicationId: app.applicationId, userId: identity.userId });
        return app.toObject();
      } catch (err) { throwErr(err); }
    },
  },

  // Field resolvers
  Bank: {
    id: (parent) => parent._id?.toString() || parent.id,
  },
};

module.exports = bankResolver;
