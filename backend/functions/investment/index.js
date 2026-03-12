'use strict';

/**
 * functions/investment/index.js
 * Lambda entry point — routes AppSync field calls to investment handlers.
 * Handler path: functions/investment/index.handler
 */

const { extractIdentity } = require('../../core/auth');
const { connectDB } = require('../../core/db');
const { handleError, NotFoundError, ForbiddenError } = require('../../core/errorHandler');
const Investment = require('../../models/Investment');

function id(identity) {
  const i = extractIdentity(identity);
  if (!i) throw Object.assign(new Error('Authentication required'), { extensions: { code: 'UNAUTHENTICATED', statusCode: 401 } });
  return i;
}

function err(e) {
  const f = handleError(e);
  throw Object.assign(new Error(f.message), { extensions: f.extensions });
}

const HANDLERS = {
  createInvestment:   (event, ctx) => require('./createInvestment').handler(event, ctx),
  getInvestment:      (event, ctx) => require('./getInvestment').handler(event, ctx),
  listInvestments:    (event, ctx) => require('./listInvestments').handler(event, ctx),
  updateInvestment:   (event, ctx) => require('./updateInvestment').handler(event, ctx),

  // ── closeInvestment — defined inline ──────────────────────────────────────
  closeInvestment: async (event) => {
    try {
      const identity = id(event.identity);
      const { investmentId, finalValue } = event.arguments || {};
      await connectDB();

      const inv = await Investment.findOne({ investmentId }).lean();
      if (!inv) throw new NotFoundError('Investment', investmentId);
      if (identity.role !== 'ADMIN' && identity.userId !== inv.userId) throw new ForbiddenError();

      const updates = { status: 'CLOSED' };
      if (finalValue !== undefined) updates.currentValue = finalValue;

      const updated = await Investment.findOneAndUpdate(
        { investmentId },
        { $set: updates },
        { new: true }
      ).lean();
      return { ...updated, gainLoss: updated.currentValue - updated.amount, gainLossPercent: updated.amount > 0 ? +((updated.currentValue - updated.amount) / updated.amount * 100).toFixed(2) : 0 };
    } catch (e) { err(e); }
  },

  // ── getPortfolioSummary ────────────────────────────────────────────────────
  getPortfolioSummary: async (event) => {
    try {
      const identity = id(event.identity);
      const targetUserId = (identity.role === 'ADMIN' && event.arguments?.userId) ? event.arguments.userId : identity.userId;
      await connectDB();

      const investments = await Investment.find({ userId: targetUserId }).lean();
      const totalInvested = investments.reduce((s, i) => s + i.amount, 0);
      const totalCurrentValue = investments.reduce((s, i) => s + (i.currentValue || i.amount), 0);
      const totalGainLoss = totalCurrentValue - totalInvested;
      const activeInvestments = investments.filter(i => i.status === 'ACTIVE').length;
      const closedInvestments = investments.filter(i => i.status === 'CLOSED').length;

      const typeMap = {};
      for (const inv of investments) {
        if (!typeMap[inv.investmentType]) typeMap[inv.investmentType] = { count: 0, totalInvested: 0, totalCurrentValue: 0 };
        typeMap[inv.investmentType].count++;
        typeMap[inv.investmentType].totalInvested += inv.amount;
        typeMap[inv.investmentType].totalCurrentValue += (inv.currentValue || inv.amount);
      }
      const byType = Object.entries(typeMap).map(([investmentType, d]) => ({ investmentType, ...d }));

      return { totalInvested, totalCurrentValue, totalGainLoss, activeInvestments, closedInvestments, byType };
    } catch (e) { err(e); }
  },
};

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const field = event.info?.fieldName;
  const handle = HANDLERS[field];
  if (!handle) throw new Error(`InvestmentHandler: no handler for field "${field}"`);
  return handle(event, context);
};
