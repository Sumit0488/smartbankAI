'use strict';

/**
 * functions/expense/index.js
 * Lambda entry point — all Expense operations.
 * Handler path: functions/expense/index.handler
 */

const { v4: uuidv4 } = require('uuid');
const { extractIdentity } = require('../../core/auth');
const { connectDB } = require('../../core/db');
const { handleError, NotFoundError, ForbiddenError } = require('../../core/errorHandler');
const { paginatedResponse } = require('../../core/response');
const Expense = require('../../models/Expense');

function id(identity) {
  const i = extractIdentity(identity);
  if (!i) throw Object.assign(new Error('Authentication required'), { extensions: { code: 'UNAUTHENTICATED' } });
  return i;
}
function err(e) { const f = handleError(e); throw Object.assign(new Error(f.message), { extensions: f.extensions }); }

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function listExpenses(event) {
  try {
    const identity = id(event.identity);
    const page  = Math.max(1, event.arguments?.page  || 1);
    const limit = Math.min(100, event.arguments?.limit || 20);
    await connectDB();
    const f = event.arguments?.filter || {};
    const filter = { userId: identity.userId };
    if (f.category) filter.category = f.category;
    if (f.dateFrom || f.dateTo) { filter.date = {}; if (f.dateFrom) filter.date.$gte = new Date(f.dateFrom); if (f.dateTo) filter.date.$lte = new Date(f.dateTo); }
    if (f.minAmount !== undefined) filter.amount = { ...filter.amount, $gte: f.minAmount };
    if (f.maxAmount !== undefined) filter.amount = { ...filter.amount, $lte: f.maxAmount };
    const [items, total] = await Promise.all([
      Expense.find(filter).sort({ date: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Expense.countDocuments(filter),
    ]);
    return paginatedResponse(items, total, page, limit);
  } catch (e) { err(e); }
}

async function getExpense(event) {
  try {
    const identity = id(event.identity);
    await connectDB();
    const expense = await Expense.findOne({ expenseId: event.arguments.expenseId }).lean();
    if (!expense) throw new NotFoundError('Expense', event.arguments.expenseId);
    if (identity.role !== 'ADMIN' && expense.userId !== identity.userId) throw new ForbiddenError();
    return expense;
  } catch (e) { err(e); }
}

async function expenseSummary(event) {
  try {
    const identity = id(event.identity);
    await connectDB();
    const match = { userId: identity.userId };
    const { dateFrom, dateTo } = event.arguments || {};
    if (dateFrom || dateTo) { match.date = {}; if (dateFrom) match.date.$gte = new Date(dateFrom); if (dateTo) match.date.$lte = new Date(dateTo); }
    const expenses = await Expense.find(match).lean();
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const catMap = {};
    for (const e of expenses) {
      if (!catMap[e.category]) catMap[e.category] = { total: 0, count: 0 };
      catMap[e.category].total += e.amount;
      catMap[e.category].count += 1;
    }
    const byCategory = Object.entries(catMap).map(([category, d]) => ({ category, total: +d.total.toFixed(2), count: d.count, percentage: total > 0 ? +(d.total / total * 100).toFixed(2) : 0 }));
    const months = new Set(expenses.map(e => { const d = new Date(e.date); return `${d.getFullYear()}-${d.getMonth()}`; }));
    return { totalExpenses: +total.toFixed(2), byCategory, monthlyAverage: months.size > 0 ? +(total / months.size).toFixed(2) : 0, count: expenses.length };
  } catch (e) { err(e); }
}

async function addExpense(event) {
  try {
    const identity = id(event.identity);
    const input = event.arguments?.input || {};
    await connectDB();
    const expense = await Expense.create({ expenseId: uuidv4(), userId: identity.userId, category: input.category, amount: input.amount, description: input.description, date: input.date ? new Date(input.date) : new Date(), tags: input.tags || [] });
    return expense.toObject();
  } catch (e) { err(e); }
}

async function updateExpense(event) {
  try {
    const identity = id(event.identity);
    const { expenseId, input } = event.arguments || {};
    await connectDB();
    const existing = await Expense.findOne({ expenseId }).lean();
    if (!existing) throw new NotFoundError('Expense', expenseId);
    if (identity.role !== 'ADMIN' && existing.userId !== identity.userId) throw new ForbiddenError();
    const updates = {};
    if (input.category !== undefined) updates.category = input.category;
    if (input.amount !== undefined) updates.amount = input.amount;
    if (input.description !== undefined) updates.description = input.description;
    if (input.date !== undefined) updates.date = new Date(input.date);
    if (input.tags !== undefined) updates.tags = input.tags;
    return Expense.findOneAndUpdate({ expenseId }, { $set: updates }, { new: true, runValidators: true }).lean();
  } catch (e) { err(e); }
}

async function deleteExpense(event) {
  try {
    const identity = id(event.identity);
    const { expenseId } = event.arguments || {};
    await connectDB();
    const existing = await Expense.findOne({ expenseId }).lean();
    if (!existing) throw new NotFoundError('Expense', expenseId);
    if (identity.role !== 'ADMIN' && existing.userId !== identity.userId) throw new ForbiddenError();
    await Expense.deleteOne({ expenseId });
    return { success: true, message: 'Expense deleted successfully' };
  } catch (e) { err(e); }
}

// ─── Router ───────────────────────────────────────────────────────────────────

const HANDLERS = { listExpenses, getExpense, expenseSummary, addExpense, updateExpense, deleteExpense };

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const field = event.info?.fieldName;
  const handle = HANDLERS[field];
  if (!handle) throw new Error(`ExpenseHandler: no handler for field "${field}"`);
  return handle(event, context);
};
