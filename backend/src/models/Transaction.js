'use strict';

const mongoose   = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const transactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, default: uuidv4, unique: true, index: true },
    userId:        { type: String, required: true, index: true },
    amount:        { type: Number, required: true, min: 0.01 },
    type:          { type: String, required: true, enum: ['CREDIT', 'DEBIT'] },
    description:   { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
