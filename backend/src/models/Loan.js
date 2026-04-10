'use strict';

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

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

module.exports = mongoose.models.Loan || mongoose.model('Loan', loanSchema);
