'use strict';

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const forexTransferSchema = new mongoose.Schema(
  {
    transferId:       { type: String, default: uuidv4, unique: true, index: true },
    userId:           { type: String, required: true, index: true },
    fromCurrency:     { type: String, required: true, uppercase: true },
    toCurrency:       { type: String, required: true, uppercase: true },
    amount:           { type: Number, required: true, min: 1 },
    convertedAmount:  { type: Number, required: true, min: 0 },
    exchangeRate:     { type: Number, required: true, min: 0 },
    fee:              { type: Number, default: 0, min: 0 },
    status:           { type: String, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'], default: 'PENDING' },
    purpose:          { type: String },
    recipientName:    { type: String },
    recipientAccount: { type: String },
    recipientBank:    { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.models.ForexTransfer || mongoose.model('ForexTransfer', forexTransferSchema);
