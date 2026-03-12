'use strict';

/**
 * functions/forex/index.js
 * Lambda entry point — Forex Transfer operations.
 * Handler path: functions/forex/index.handler
 */

const { v4: uuidv4 } = require('uuid');
const { extractIdentity } = require('../../core/auth');
const { connectDB } = require('../../core/db');
const { handleError, NotFoundError, ForbiddenError, ValidationError } = require('../../core/errorHandler');
const { paginatedResponse } = require('../../core/response');
const ForexTransfer = require('../../models/ForexTransfer');

const RATES = {
  'USD-EUR': 0.92, 'USD-GBP': 0.79, 'USD-INR': 83.50, 'USD-JPY': 149.50, 'USD-AUD': 1.52, 'USD-AED': 3.67,
  'EUR-USD': 1.09, 'EUR-GBP': 0.86, 'EUR-INR': 90.80,
  'GBP-USD': 1.27, 'GBP-EUR': 1.17, 'GBP-INR': 105.70,
  'INR-USD': 0.012, 'INR-EUR': 0.011, 'INR-GBP': 0.0095, 'INR-AED': 0.044,
  'AUD-USD': 0.66, 'CAD-USD': 0.74, 'SGD-USD': 0.75, 'AED-INR': 22.75,
};
const FEE_RATE = 0.005;

function getRate(from, to) {
  if (from === to) return 1;
  const key = `${from}-${to}`;
  if (RATES[key]) return RATES[key];
  const toUSD = RATES[`${from}-USD`];
  const fromUSD = RATES[`USD-${to}`];
  if (toUSD && fromUSD) return +(toUSD * fromUSD).toFixed(6);
  return null;
}

function id(identity) {
  const i = extractIdentity(identity);
  if (!i) throw Object.assign(new Error('Authentication required'), { extensions: { code: 'UNAUTHENTICATED' } });
  return i;
}
function err(e) { const f = handleError(e); throw Object.assign(new Error(f.message), { extensions: f.extensions }); }

async function listForexTransfers(event) {
  try {
    const identity = id(event.identity);
    const page  = Math.max(1, event.arguments?.page  || 1);
    const limit = Math.min(100, event.arguments?.limit || 20);
    await connectDB();
    const filter = identity.role === 'ADMIN' ? {} : { userId: identity.userId };
    const [items, total] = await Promise.all([
      ForexTransfer.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      ForexTransfer.countDocuments(filter),
    ]);
    return paginatedResponse(items, total, page, limit);
  } catch (e) { err(e); }
}

async function getForexTransfer(event) {
  try {
    const identity = id(event.identity);
    await connectDB();
    const transfer = await ForexTransfer.findOne({ transferId: event.arguments.transferId }).lean();
    if (!transfer) throw new NotFoundError('ForexTransfer', event.arguments.transferId);
    if (identity.role !== 'ADMIN' && transfer.userId !== identity.userId) throw new ForbiddenError();
    return transfer;
  } catch (e) { err(e); }
}

async function createForexTransfer(event) {
  try {
    const identity = id(event.identity);
    const input = event.arguments?.input || {};
    const from = input.fromCurrency?.toUpperCase();
    const to = input.toCurrency?.toUpperCase();
    if (!input.amount || input.amount <= 0) throw new ValidationError('Amount must be greater than 0');
    const rate = getRate(from, to);
    if (!rate) throw new ValidationError(`Exchange rate not available for ${from} → ${to}`);
    const convertedAmount = +(input.amount * rate).toFixed(4);
    const fee = +(convertedAmount * FEE_RATE).toFixed(4);
    await connectDB();
    const transfer = await ForexTransfer.create({ transferId: uuidv4(), userId: identity.userId, fromCurrency: from, toCurrency: to, amount: input.amount, convertedAmount, exchangeRate: rate, fee, status: 'PENDING', purpose: input.purpose, recipientName: input.recipientName, recipientAccount: input.recipientAccount, recipientBank: input.recipientBank });
    return transfer.toObject();
  } catch (e) { err(e); }
}

async function cancelForexTransfer(event) {
  try {
    const identity = id(event.identity);
    await connectDB();
    const transfer = await ForexTransfer.findOne({ transferId: event.arguments.transferId }).lean();
    if (!transfer) throw new NotFoundError('ForexTransfer', event.arguments.transferId);
    if (identity.role !== 'ADMIN' && transfer.userId !== identity.userId) throw new ForbiddenError();
    if (!['PENDING', 'PROCESSING'].includes(transfer.status)) throw new ValidationError(`Cannot cancel a ${transfer.status} transfer`);
    return ForexTransfer.findOneAndUpdate({ transferId: event.arguments.transferId }, { $set: { status: 'CANCELLED' } }, { new: true }).lean();
  } catch (e) { err(e); }
}

const HANDLERS = { listForexTransfers, getForexTransfer, createForexTransfer, cancelForexTransfer };

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const field = event.info?.fieldName;
  const handle = HANDLERS[field];
  if (!handle) throw new Error(`ForexHandler: no handler for field "${field}"`);
  return handle(event, context);
};
