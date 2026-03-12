'use strict';

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const investmentSchema = new mongoose.Schema(
  {
    investmentId:   { type: String, default: uuidv4, unique: true, index: true },
    userId:         { type: String, required: true, index: true },
    investmentType: { type: String, enum: ['STOCK', 'MUTUAL_FUND', 'FIXED_DEPOSIT'], required: true },
    amount:         { type: Number, required: true, min: 1 },
    expectedReturn: { type: Number, min: 0 },
    currentValue:   { type: Number, min: 0 },
    status:         { type: String, enum: ['ACTIVE', 'CLOSED', 'PENDING'], default: 'ACTIVE' },
    investedAt:     { type: Date, default: Date.now },
    notes:          { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Investment || mongoose.model('Investment', investmentSchema);
