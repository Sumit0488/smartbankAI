#!/usr/bin/env node
'use strict';

/**
 * scripts/seedBanks.js
 * Seeds the MongoDB `banks` collection with Indian bank reference data.
 *
 * Usage:
 *   node scripts/seedBanks.js            # insert only if collection is empty
 *   node scripts/seedBanks.js --force    # drop existing data and re-seed
 *
 * Run before starting the server or as part of a CI setup step.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// ─── Bank Data ─────────────────────────────────────────────────────────────────

const BANKS = [
  {
    bankName: 'HDFC Bank',
    bankCode: 'HDFC',
    country: 'India',
    interestRates: {
      savingsRate:      3.50,
      fdRate:           7.10,
      homeLoanRate:     8.75,
      carLoanRate:      7.50,
      personalLoanRate: 10.50,
    },
    features: ['NetBanking 24x7', 'Mobile App', 'NRI Services', 'Wealth Management', 'Airport Lounge Access'],
    minDeposit: 10000,
    customerRating: 4.3,
    digitalBankingScore: 4.6,
  },
  {
    bankName: 'ICICI Bank',
    bankCode: 'ICIC',
    country: 'India',
    interestRates: {
      savingsRate:      3.50,
      fdRate:           7.00,
      homeLoanRate:     8.85,
      carLoanRate:      7.55,
      personalLoanRate: 10.65,
    },
    features: ['iMobile Pay', 'IMPS 24x7', 'Forex Services', 'Insurance Products', 'Demat Account'],
    minDeposit: 10000,
    customerRating: 4.2,
    digitalBankingScore: 4.5,
  },
  {
    bankName: 'State Bank of India',
    bankCode: 'SBIN',
    country: 'India',
    interestRates: {
      savingsRate:      2.70,
      fdRate:           6.80,
      homeLoanRate:     8.50,
      carLoanRate:      7.45,
      personalLoanRate: 11.00,
    },
    features: ['YONO App', 'Largest Branch Network', 'PM Jan Dhan Yojana', 'Senior Citizen FD', 'Kisan Credit Card'],
    minDeposit: 0,
    customerRating: 3.8,
    digitalBankingScore: 4.0,
  },
  {
    bankName: 'Axis Bank',
    bankCode: 'UTIB',
    country: 'India',
    interestRates: {
      savingsRate:      3.50,
      fdRate:           7.00,
      homeLoanRate:     8.90,
      carLoanRate:      7.60,
      personalLoanRate: 10.50,
    },
    features: ['Burgundy Private Banking', 'Forex Cards', 'Open Banking API', 'Neo Banking', '24x7 Support'],
    minDeposit: 10000,
    customerRating: 4.1,
    digitalBankingScore: 4.4,
  },
  {
    bankName: 'Kotak Mahindra Bank',
    bankCode: 'KKBK',
    country: 'India',
    interestRates: {
      savingsRate:      4.00,
      fdRate:           7.25,
      homeLoanRate:     8.70,
      carLoanRate:      7.50,
      personalLoanRate: 10.75,
    },
    features: ['811 Zero Balance Account', '4% Savings Rate', 'Virtual Debit Card', 'Digital First', 'Instant Personal Loan'],
    minDeposit: 0,
    customerRating: 4.3,
    digitalBankingScore: 4.7,
  },
  {
    bankName: 'IndusInd Bank',
    bankCode: 'INDB',
    country: 'India',
    interestRates: {
      savingsRate:      4.00,
      fdRate:           7.50,
      homeLoanRate:     8.95,
      carLoanRate:      7.65,
      personalLoanRate: 11.00,
    },
    features: ['Indus Mobile App', 'Video Banking', 'IndusMoments Rewards', 'Salary Accounts', 'NRI Banking'],
    minDeposit: 10000,
    customerRating: 4.0,
    digitalBankingScore: 4.3,
  },
  {
    bankName: 'Yes Bank',
    bankCode: 'YESB',
    country: 'India',
    interestRates: {
      savingsRate:      5.00,
      fdRate:           7.50,
      homeLoanRate:     9.15,
      carLoanRate:      8.00,
      personalLoanRate: 11.25,
    },
    features: ['Highest Savings Rate', 'YES PAY Wallet', 'Trade Finance', 'Corporate Banking', 'API Banking Platform'],
    minDeposit: 10000,
    customerRating: 3.9,
    digitalBankingScore: 4.2,
  },
  {
    bankName: 'Bank of Baroda',
    bankCode: 'BARB',
    country: 'India',
    interestRates: {
      savingsRate:      2.75,
      fdRate:           6.85,
      homeLoanRate:     8.60,
      carLoanRate:      7.35,
      personalLoanRate: 10.60,
    },
    features: ['bob World App', 'International Presence', 'Baroda Kisan Credit', 'Trade Finance', 'Priority Banking'],
    minDeposit: 1000,
    customerRating: 3.7,
    digitalBankingScore: 3.9,
  },
];

// ─── Mongoose Model ────────────────────────────────────────────────────────────

const bankSchema = new mongoose.Schema(
  {
    bankId:              { type: String, default: uuidv4, unique: true },
    bankName:            { type: String, required: true },
    bankCode:            { type: String, required: true, unique: true, uppercase: true },
    country:             { type: String, default: 'India' },
    interestRates: {
      savingsRate:      Number,
      fdRate:           Number,
      homeLoanRate:     Number,
      carLoanRate:      Number,
      personalLoanRate: Number,
    },
    features:            [String],
    minDeposit:          Number,
    customerRating:      Number,
    digitalBankingScore: Number,
  },
  { timestamps: true }
);

// ─── Seed Logic ────────────────────────────────────────────────────────────────

async function seed(force = false) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌  MONGODB_URI not set in .env');
    process.exit(1);
  }

  console.log('📡  Connecting to MongoDB Atlas...');
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB_NAME || 'smartbankai' });

  const Bank = mongoose.models.Bank || mongoose.model('Bank', bankSchema);

  const existing = await Bank.countDocuments();

  if (existing > 0 && !force) {
    console.log(`ℹ️   Banks collection already has ${existing} records. Use --force to re-seed.`);
    await mongoose.disconnect();
    return;
  }

  if (force && existing > 0) {
    await Bank.deleteMany({});
    console.log(`🗑️   Cleared ${existing} existing bank records.`);
  }

  const docs = BANKS.map((b) => ({ ...b, bankId: uuidv4() }));
  await Bank.insertMany(docs);

  console.log(`✅  Seeded ${docs.length} banks:`);
  docs.forEach((b) => console.log(`   • ${b.bankName} (${b.bankCode}) — Savings: ${b.interestRates.savingsRate}% | Home Loan: ${b.interestRates.homeLoanRate}%`));

  await mongoose.disconnect();
  console.log('\n🎉  Bank seed complete.');
}

// ─── Run ──────────────────────────────────────────────────────────────────────

const force = process.argv.includes('--force');
seed(force).catch((err) => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
