'use strict';

/**
 * functions/card/index.js
 * Lambda entry point — Card catalog + saved cards + recommendation.
 * Handler path: functions/card/index.handler
 */

const { v4: uuidv4 } = require('uuid');
const { extractIdentity } = require('../../core/auth');
const { connectDB } = require('../../core/db');
const { handleError, NotFoundError, ConflictError } = require('../../core/errorHandler');
const { Card, SavedCard } = require('../../models/Card');

function id(identity) {
  const i = extractIdentity(identity);
  if (!i) throw Object.assign(new Error('Authentication required'), { extensions: { code: 'UNAUTHENTICATED' } });
  return i;
}
function err(e) { const f = handleError(e); throw Object.assign(new Error(f.message), { extensions: f.extensions }); }

function scoreCard(card, salary, creditScore, cardType) {
  if (cardType && card.cardType !== cardType) return null;
  if (salary > 0 && card.minIncome > 0 && salary < card.minIncome) return null;
  if (creditScore > 0 && card.minCreditScore > 0 && creditScore < card.minCreditScore) return null;
  const reasons = [];
  let score = 0;
  if (salary >= (card.minIncome || 0)) { score += 25; reasons.push('Matches income requirement'); }
  if (creditScore >= 750) { score += 20; reasons.push('Excellent credit score eligible'); } else if (creditScore >= 650) { score += 10; }
  if (card.rewardsRate >= 4) { score += 25; reasons.push(`${card.rewardsRate}% rewards rate`); } else if (card.rewardsRate >= 2) { score += 15; reasons.push(`${card.rewardsRate}% rewards rate`); }
  if (card.annualFee === 0) { score += 20; reasons.push('No annual fee'); } else if (card.annualFee < 1000) { score += 10; }
  if (reasons.length === 0) reasons.push('Good general-purpose card');
  return { card, matchScore: Math.min(100, score), reasons };
}

async function ensureSeeded() {
  const count = await Card.countDocuments();
  if (count === 0) {
    const SEED = [
      { cardName: 'HDFC Regalia Credit Card', cardType: 'CREDIT', issuer: 'HDFC Bank', annualFee: 2500, rewardsRate: 4.0, features: ['Lounge Access', 'Travel Insurance', '4X Reward Points'], minCreditScore: 750, minIncome: 600000 },
      { cardName: 'SBI SimplyCLICK Credit Card', cardType: 'CREDIT', issuer: 'SBI', annualFee: 499, rewardsRate: 2.5, features: ['Online Shopping Rewards', 'Movie Discounts'], minCreditScore: 650, minIncome: 300000 },
      { cardName: 'ICICI Amazon Pay Credit Card', cardType: 'CREDIT', issuer: 'ICICI Bank', annualFee: 0, rewardsRate: 5.0, features: ['5% Cashback Amazon Prime', 'No Annual Fee'], minCreditScore: 650, minIncome: 250000 },
      { cardName: 'Axis Flipkart Credit Card', cardType: 'CREDIT', issuer: 'Axis Bank', annualFee: 500, rewardsRate: 5.0, features: ['5% Cashback Flipkart', '4% on Myntra'], minCreditScore: 700, minIncome: 400000 },
      { cardName: 'Kotak 811 Debit Card', cardType: 'DEBIT', issuer: 'Kotak Mahindra Bank', annualFee: 0, rewardsRate: 1.0, features: ['Zero Balance', 'UPI Enabled'], minCreditScore: 0, minIncome: 0 },
    ];
    await Card.insertMany(SEED.map(c => ({ ...c, cardId: uuidv4() })));
  }
}

async function listCards(event) {
  try {
    await connectDB();
    await ensureSeeded();
    const filter = event.arguments?.cardType ? { cardType: event.arguments.cardType } : {};
    const items = await Card.find(filter).sort({ annualFee: 1 }).lean();
    return { items, total: items.length };
  } catch (e) { err(e); }
}

async function getCard(event) {
  try {
    await connectDB();
    const card = await Card.findOne({ cardId: event.arguments.cardId }).lean();
    if (!card) throw new NotFoundError('Card', event.arguments.cardId);
    return card;
  } catch (e) { err(e); }
}

async function recommendCards(event) {
  try {
    await connectDB();
    await ensureSeeded();
    const { salary = 0, creditScore = 0, cardType = null } = event.arguments || {};
    const cards = await Card.find(cardType ? { cardType } : {}).lean();
    return cards.map(c => scoreCard(c, salary, creditScore, cardType)).filter(Boolean).sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
  } catch (e) { err(e); }
}

async function listSavedCards(event) {
  try {
    const identity = id(event.identity);
    await connectDB();
    const saved = await SavedCard.find({ userId: identity.userId }).sort({ savedAt: -1 }).lean();
    return { items: saved, total: saved.length };
  } catch (e) { err(e); }
}

async function saveCard(event) {
  try {
    const identity = id(event.identity);
    await connectDB();
    const card = await Card.findOne({ cardId: event.arguments.cardId }).lean();
    if (!card) throw new NotFoundError('Card', event.arguments.cardId);
    const existing = await SavedCard.findOne({ userId: identity.userId, cardId: event.arguments.cardId }).lean();
    if (existing) throw new ConflictError('Card already saved');
    const saved = await SavedCard.create({ savedCardId: uuidv4(), userId: identity.userId, cardId: event.arguments.cardId, savedAt: new Date() });
    return { ...saved.toObject(), card };
  } catch (e) { err(e); }
}

async function unsaveCard(event) {
  try {
    const identity = id(event.identity);
    await connectDB();
    const result = await SavedCard.deleteOne({ userId: identity.userId, cardId: event.arguments.cardId });
    if (result.deletedCount === 0) throw new NotFoundError('Saved card', event.arguments.cardId);
    return { success: true, message: 'Card removed from saved list' };
  } catch (e) { err(e); }
}

const HANDLERS = { listCards, getCard, recommendCards, listSavedCards, saveCard, unsaveCard };

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const field = event.info?.fieldName;
  const handle = HANDLERS[field];
  if (!handle) throw new Error(`CardHandler: no handler for field "${field}"`);
  return handle(event, context);
};
