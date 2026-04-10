'use strict';

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const bankApplicationSchema = new mongoose.Schema(
  {
    applicationId: { type: String, default: uuidv4, unique: true, index: true },
    userId:        { type: String, required: true, index: true },
    bankName:      { type: String, required: true },
    accountType:   { type: String, required: true },
    status:        { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    appliedAt:     { type: Date, default: Date.now },
    notes:         { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.BankApplication ||
  mongoose.model('BankApplication', bankApplicationSchema, 'bankapplications');
