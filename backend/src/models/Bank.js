'use strict';

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const bankInterestRatesSchema = new mongoose.Schema(
  {
    savingsRate:      { type: Number, default: 0 },
    fdRate:           { type: Number, default: 0 },
    homeLoanRate:     { type: Number, default: 0 },
    carLoanRate:      { type: Number, default: 0 },
    personalLoanRate: { type: Number, default: 0 },
  },
  { _id: false }
);

const bankSchema = new mongoose.Schema(
  {
    bankId:              { type: String, default: uuidv4, unique: true, index: true },
    bankName:            { type: String, required: true },
    bankCode:            { type: String, required: true, unique: true, uppercase: true },
    country:             { type: String, required: true, default: 'India' },
    interestRates:       { type: bankInterestRatesSchema, default: () => ({}) },
    features:            [{ type: String }],
    minDeposit:          { type: Number, default: 0 },
    customerRating:      { type: Number, min: 0, max: 5, default: 0 },
    digitalBankingScore: { type: Number, min: 0, max: 5, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Bank || mongoose.model('Bank', bankSchema);
