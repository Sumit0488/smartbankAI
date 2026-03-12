'use strict';

/**
 * functions/bank/index.js
 * Lambda entry point — Bank catalog operations.
 * Handler path: functions/bank/index.handler
 */

const { v4: uuidv4 } = require('uuid');
const { connectDB } = require('../../core/db');
const { handleError, NotFoundError, ValidationError } = require('../../core/errorHandler');
const Bank = require('../../models/Bank');

function err(e) { const f = handleError(e); throw Object.assign(new Error(f.message), { extensions: f.extensions }); }

const SEED = [
  { bankName: 'HDFC Bank', bankCode: 'HDFC', country: 'India', interestRates: { savingsRate: 3.5, fdRate: 7.10, homeLoanRate: 8.75, carLoanRate: 7.50, personalLoanRate: 10.50 }, features: ['NetBanking 24x7', 'Mobile App', 'NRI Services', 'Wealth Management'], minDeposit: 10000, customerRating: 4.3, digitalBankingScore: 4.6 },
  { bankName: 'ICICI Bank', bankCode: 'ICIC', country: 'India', interestRates: { savingsRate: 3.5, fdRate: 7.00, homeLoanRate: 8.85, carLoanRate: 7.55, personalLoanRate: 10.65 }, features: ['iMobile Pay', 'IMPS 24x7', 'Forex Services', 'Insurance'], minDeposit: 10000, customerRating: 4.2, digitalBankingScore: 4.5 },
  { bankName: 'State Bank of India', bankCode: 'SBIN', country: 'India', interestRates: { savingsRate: 2.70, fdRate: 6.80, homeLoanRate: 8.50, carLoanRate: 7.45, personalLoanRate: 11.00 }, features: ['YONO App', 'Largest Branch Network', 'PM Jan Dhan'], minDeposit: 0, customerRating: 3.8, digitalBankingScore: 4.0 },
  { bankName: 'Axis Bank', bankCode: 'UTIB', country: 'India', interestRates: { savingsRate: 3.5, fdRate: 7.00, homeLoanRate: 8.90, carLoanRate: 7.60, personalLoanRate: 10.50 }, features: ['Burgundy Private Banking', 'Forex Cards', 'Open Banking API'], minDeposit: 10000, customerRating: 4.1, digitalBankingScore: 4.4 },
  { bankName: 'Kotak Mahindra Bank', bankCode: 'KKBK', country: 'India', interestRates: { savingsRate: 4.00, fdRate: 7.25, homeLoanRate: 8.70, carLoanRate: 7.50, personalLoanRate: 10.75 }, features: ['811 Zero Balance', '4% Savings Rate', 'Digital First'], minDeposit: 0, customerRating: 4.3, digitalBankingScore: 4.7 },
  { bankName: 'IndusInd Bank', bankCode: 'INDB', country: 'India', interestRates: { savingsRate: 4.00, fdRate: 7.50, homeLoanRate: 8.95, carLoanRate: 7.65, personalLoanRate: 11.00 }, features: ['Indus Mobile App', 'Video Banking', 'IndusMoments Rewards'], minDeposit: 10000, customerRating: 4.0, digitalBankingScore: 4.3 },
];

async function ensureSeeded() {
  const count = await Bank.countDocuments();
  if (count === 0) await Bank.insertMany(SEED.map(b => ({ ...b, bankId: uuidv4() })));
}

async function listBanks(event) {
  try {
    await connectDB(); await ensureSeeded();
    const filter = event.arguments?.country ? { country: event.arguments.country } : {};
    const items = await Bank.find(filter).sort({ customerRating: -1 }).lean();
    return { items, total: items.length };
  } catch (e) { err(e); }
}

async function getBank(event) {
  try {
    await connectDB();
    const bank = await Bank.findOne({ bankId: event.arguments.bankId }).lean();
    if (!bank) throw new NotFoundError('Bank', event.arguments.bankId);
    return bank;
  } catch (e) { err(e); }
}

async function compareBanks(event) {
  try {
    const { bankIds } = event.arguments || {};
    if (!bankIds || bankIds.length < 2) throw new ValidationError('Provide at least 2 bank IDs to compare');
    await connectDB();
    const banks = await Bank.find({ bankId: { $in: bankIds } }).lean();
    if (banks.length === 0) throw new NotFoundError('Banks', bankIds.join(', '));
    const bestSavingsRate    = banks.reduce((b, x) => x.interestRates.savingsRate    > b.interestRates.savingsRate    ? x : b, banks[0]);
    const lowestHomeLoanRate = banks.reduce((b, x) => x.interestRates.homeLoanRate   < b.interestRates.homeLoanRate   ? x : b, banks[0]);
    const lowestPersonalLoanRate = banks.reduce((b, x) => x.interestRates.personalLoanRate < b.interestRates.personalLoanRate ? x : b, banks[0]);
    return { banks, bestSavingsRate, lowestHomeLoanRate, lowestPersonalLoanRate };
  } catch (e) { err(e); }
}

const HANDLERS = { listBanks, getBank, compareBanks };

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const field = event.info?.fieldName;
  const handle = HANDLERS[field];
  if (!handle) throw new Error(`BankHandler: no handler for field "${field}"`);
  return handle(event, context);
};
