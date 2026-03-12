'use strict';

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Global card catalog (not user-specific)
const cardSchema = new mongoose.Schema(
  {
    cardId:         { type: String, default: uuidv4, unique: true, index: true },
    cardName:       { type: String, required: true },
    cardType:       { type: String, enum: ['CREDIT', 'DEBIT', 'PREPAID'], required: true },
    issuer:         { type: String, required: true },
    annualFee:      { type: Number, default: 0, min: 0 },
    rewardsRate:    { type: Number, default: 0, min: 0 },
    features:       [{ type: String }],
    minCreditScore: { type: Number, default: 0 },
    minIncome:      { type: Number, default: 0 },
    applyUrl:       { type: String },
  },
  { timestamps: true }
);

// User's saved cards
const savedCardSchema = new mongoose.Schema(
  {
    savedCardId: { type: String, default: uuidv4, unique: true, index: true },
    userId:      { type: String, required: true, index: true },
    cardId:      { type: String, required: true },
    savedAt:     { type: Date, default: Date.now },
  },
  { timestamps: true }
);

savedCardSchema.index({ userId: 1, cardId: 1 }, { unique: true });

const Card      = mongoose.models.Card      || mongoose.model('Card', cardSchema);
const SavedCard = mongoose.models.SavedCard || mongoose.model('SavedCard', savedCardSchema);

module.exports = { Card, SavedCard };
