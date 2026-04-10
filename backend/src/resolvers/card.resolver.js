'use strict';

/**
 * src/resolvers/card.resolver.js
 * Card catalog + user saved cards + AI-style recommendation engine.
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { extractIdentity } = require('../utils/auth');
const { connectDB } = require('../config/db');
const { createLogger } = require('../utils/logger');
const { handleError, NotFoundError, ForbiddenError, ConflictError } = require('../utils/errorHandler');
const { Card, SavedCard } = require('../models/Card');

// ─── CardApplication Model ────────────────────────────────────────────────────

const cardApplicationSchema = new mongoose.Schema(
  {
    applicationId: { type: String, default: uuidv4, unique: true, index: true },
    userId:        { type: String, required: true, index: true },
    cardId:        { type: String, required: true },
    cardName:      { type: String },
    issuer:        { type: String },
    status:        { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    appliedAt:     { type: Date, default: Date.now },
  },
  { timestamps: true }
);

function getCardApplicationModel() {
  return mongoose.models.CardApplication || mongoose.model('CardApplication', cardApplicationSchema);
}

const logger = createLogger('resolvers:card');

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_CARDS = [
  {
    cardName: 'HDFC Regalia Credit Card',
    cardType: 'CREDIT',
    issuer: 'HDFC Bank',
    annualFee: 2500,
    rewardsRate: 4.0,
    features: ['Airport Lounge Access', 'Travel Insurance', '4X Reward Points', 'Concierge Service'],
    minCreditScore: 750,
    minIncome: 600000,
  },
  {
    cardName: 'SBI SimplyCLICK Credit Card',
    cardType: 'CREDIT',
    issuer: 'SBI',
    annualFee: 499,
    rewardsRate: 2.5,
    features: ['Online Shopping Rewards', 'Amazon Vouchers', 'Movie Discounts', 'Fuel Surcharge Waiver'],
    minCreditScore: 650,
    minIncome: 300000,
  },
  {
    cardName: 'Axis Flipkart Credit Card',
    cardType: 'CREDIT',
    issuer: 'Axis Bank',
    annualFee: 500,
    rewardsRate: 5.0,
    features: ['5% Cashback on Flipkart', '4% on Myntra', 'Unlimited Cashback', 'No Cap on Rewards'],
    minCreditScore: 700,
    minIncome: 400000,
  },
  {
    cardName: 'ICICI Amazon Pay Credit Card',
    cardType: 'CREDIT',
    issuer: 'ICICI Bank',
    annualFee: 0,
    rewardsRate: 5.0,
    features: ['5% Cashback Amazon Prime', '2% at Amazon', '1% Everywhere Else', 'No Annual Fee'],
    minCreditScore: 650,
    minIncome: 250000,
  },
  {
    cardName: 'Kotak 811 Debit Card',
    cardType: 'DEBIT',
    issuer: 'Kotak Mahindra Bank',
    annualFee: 0,
    rewardsRate: 1.0,
    features: ['Zero Balance Account', 'UPI Enabled', 'Free NEFT/IMPS', 'Virtual Card Available'],
    minCreditScore: 0,
    minIncome: 0,
  },
  {
    cardName: 'HDFC MoneyBack Credit Card',
    cardType: 'CREDIT',
    issuer: 'HDFC Bank',
    annualFee: 500,
    rewardsRate: 2.0,
    features: ['2X Cashback on Online Spends', 'Fuel Surcharge Waiver', 'EMI Conversion', 'Dining Benefits'],
    minCreditScore: 680,
    minIncome: 360000,
  },
  {
    cardName: 'Yes Bank Prepaid Card',
    cardType: 'PREPAID',
    issuer: 'Yes Bank',
    annualFee: 199,
    rewardsRate: 0.5,
    features: ['No Credit Check Required', 'International Accepted', 'Reload Anytime', 'Contactless Payments'],
    minCreditScore: 0,
    minIncome: 0,
  },
];

async function seedCardsIfEmpty() {
  const count = await Card.countDocuments();
  if (count === 0) {
    await Card.insertMany(SEED_CARDS.map(c => ({ ...c, cardId: uuidv4() })));
    logger.info('Card catalog seeded with sample cards');
  }
}

// ─── Recommendation Engine ────────────────────────────────────────────────────

function scoreCard(card, salary = 0, creditScore = 0, cardType = null) {
  const reasons = [];
  let score = 0;

  if (cardType && card.cardType !== cardType) return null;

  // Income eligibility
  if (salary > 0 && card.minIncome > 0 && salary < card.minIncome) return null;
  if (salary > 0 && card.minIncome > 0) {
    score += 30;
    reasons.push(`Matches your income profile`);
  }

  // Credit score eligibility
  if (creditScore > 0 && card.minCreditScore > 0 && creditScore < card.minCreditScore) return null;
  if (creditScore > 0 && creditScore >= 750) {
    score += 20;
    reasons.push('Eligible with your excellent credit score');
  } else if (creditScore > 0 && creditScore >= 650) {
    score += 10;
    reasons.push('Eligible with your credit score');
  }

  // Rewards rate bonus
  if (card.rewardsRate >= 4) { score += 25; reasons.push(`High rewards rate: ${card.rewardsRate}%`); }
  else if (card.rewardsRate >= 2) { score += 15; reasons.push(`Good rewards rate: ${card.rewardsRate}%`); }

  // Low/no annual fee
  if (card.annualFee === 0) { score += 20; reasons.push('No annual fee'); }
  else if (card.annualFee < 1000) { score += 10; reasons.push(`Low annual fee: ₹${card.annualFee}`); }

  // Feature count bonus
  if (card.features.length >= 4) { score += 5; reasons.push(`${card.features.length} premium features`); }

  if (reasons.length === 0) reasons.push('Good general-purpose card');

  return { card, matchScore: Math.min(100, score), reasons };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getIdentity(context) {
  const identity = extractIdentity(context.identity);
  if (!identity) throw new Error('Authentication required');
  return identity;
}

function throwErr(err) {
  const f = handleError(err);
  throw Object.assign(new Error(f.message), { extensions: f.extensions });
}

// ─── Resolvers ────────────────────────────────────────────────────────────────

const cardResolver = {
  Query: {
    listCards: async (_parent, { cardType }, _context) => {
      try {
        await connectDB();
        await seedCardsIfEmpty();

        const filter = cardType ? { cardType } : {};
        const items = await Card.find(filter).sort({ annualFee: 1 }).lean();
        return { items, total: items.length };
      } catch (err) { throwErr(err); }
    },

    getCard: async (_parent, { cardId }, _context) => {
      try {
        await connectDB();
        const card = await Card.findOne({ cardId }).lean();
        if (!card) throw new NotFoundError('Card', cardId);
        return card;
      } catch (err) { throwErr(err); }
    },

    recommendCards: async (_parent, { salary, creditScore, cardType }, context) => {
      try {
        // recommendCards is public — no auth required
        await connectDB();
        await seedCardsIfEmpty();

        const cards = await Card.find(cardType ? { cardType } : {}).lean();
        const recommendations = cards
          .map(card => scoreCard(card, salary || 0, creditScore || 0, cardType || null))
          .filter(Boolean)
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 5);

        logger.info('recommendCards resolved', { salary, creditScore, count: recommendations.length });
        return recommendations;
      } catch (err) { throwErr(err); }
    },

    listSavedCards: async (_parent, _args, context) => {
      try {
        const identity = getIdentity(context);
        await connectDB();

        const saved = await SavedCard.find({ userId: identity.userId }).sort({ savedAt: -1 }).lean();
        return { items: saved, total: saved.length };
      } catch (err) { throwErr(err); }
    },
  },

  Mutation: {
    saveCard: async (_parent, { cardId }, context) => {
      try {
        const identity = getIdentity(context);
        await connectDB();

        const card = await Card.findOne({ cardId }).lean();
        if (!card) throw new NotFoundError('Card', cardId);

        const existing = await SavedCard.findOne({ userId: identity.userId, cardId }).lean();
        if (existing) throw new ConflictError('Card already saved');

        const saved = await SavedCard.create({
          savedCardId: uuidv4(),
          userId: identity.userId,
          cardId,
          savedAt: new Date(),
        });

        logger.info('saveCard resolved', { cardId, userId: identity.userId });
        return saved.toObject();
      } catch (err) { throwErr(err); }
    },

    unsaveCard: async (_parent, { cardId }, context) => {
      try {
        const identity = getIdentity(context);
        await connectDB();

        const result = await SavedCard.deleteOne({ userId: identity.userId, cardId });
        if (result.deletedCount === 0) throw new NotFoundError('Saved card', cardId);

        logger.info('unsaveCard resolved', { cardId, userId: identity.userId });
        return { success: true, message: 'Card removed from saved list' };
      } catch (err) { throwErr(err); }
    },

    applyCard: async (_parent, { cardId }, context) => {
      try {
        const identity = getIdentity(context);
        await connectDB();

        const card = await Card.findOne({ cardId }).lean();
        if (!card) throw new NotFoundError('Card', cardId);

        const CardApplication = getCardApplicationModel();
        const application = await CardApplication.create({
          applicationId: uuidv4(),
          userId: identity.userId,
          cardId,
          cardName: card.cardName,
          issuer: card.issuer,
          status: 'PENDING',
          appliedAt: new Date(),
        });

        logger.info('applyCard resolved', { applicationId: application.applicationId, userId: identity.userId });
        return {
          success: true,
          message: `Application for ${card.cardName} submitted successfully`,
          applicationId: application.applicationId,
        };
      } catch (err) { throwErr(err); }
    },
  },

  // Field resolvers
  Card: {
    id: (parent) => parent._id?.toString() || parent.id,
  },
  SavedCard: {
    id: (parent) => parent._id?.toString() || parent.id,
    card: async (savedCard) => {
      try {
        await connectDB();
        return Card.findOne({ cardId: savedCard.cardId }).lean();
      } catch { return null; }
    },
  },
  CardRecommendation: {
    card: (rec) => rec.card,
  },
};

module.exports = cardResolver;
