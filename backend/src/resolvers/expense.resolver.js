'use strict';

/**
 * src/resolvers/expense.resolver.js
 * Expense CRUD — per-user data isolation via userId from JWT context.
 */

const { v4: uuidv4 } = require('uuid');
const { extractIdentity } = require('../utils/auth');
const { connectDB } = require('../config/db');
const { createLogger } = require('../utils/logger');
const { handleError, NotFoundError, ForbiddenError } = require('../utils/errorHandler');
const { paginatedResponse } = require('../utils/response');
const Expense = require('../models/Expense');
const { updateFinancialSummary } = require('../utils/updateFinancialSummary');

const logger = createLogger('resolvers:expense');

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

const expenseResolver = {
  Query: {
    listExpenses: async (_parent, args, context) => {
      try {
        const identity = getIdentity(context);
        const page  = Math.max(1, args.page  || 1);
        const limit = Math.min(100, Math.max(1, args.limit || 20));

        await connectDB();

        const filter = { userId: identity.userId };
        const f = args.filter || {};
        if (f.category)  filter.category = f.category;
        if (f.dateFrom || f.dateTo) {
          filter.date = {};
          if (f.dateFrom) filter.date.$gte = new Date(f.dateFrom);
          if (f.dateTo)   filter.date.$lte = new Date(f.dateTo);
        }
        if (f.minAmount !== undefined) filter.amount = { ...filter.amount, $gte: f.minAmount };
        if (f.maxAmount !== undefined) filter.amount = { ...filter.amount, $lte: f.maxAmount };

        const [items, total] = await Promise.all([
          Expense.find(filter).sort({ date: -1 }).skip((page - 1) * limit).limit(limit).lean(),
          Expense.countDocuments(filter),
        ]);

        logger.info('listExpenses resolved', { userId: identity.userId, total });
        return paginatedResponse(items, total, page, limit);
      } catch (err) { throwErr(err); }
    },

    getExpense: async (_parent, { expenseId }, context) => {
      try {
        const identity = getIdentity(context);
        await connectDB();

        const expense = await Expense.findOne({ expenseId }).lean();
        if (!expense) throw new NotFoundError('Expense', expenseId);
        if (identity.role !== 'ADMIN' && expense.userId !== identity.userId) throw new ForbiddenError();

        return expense;
      } catch (err) { throwErr(err); }
    },

    expenseSummary: async (_parent, { dateFrom, dateTo }, context) => {
      try {
        const identity = getIdentity(context);
        await connectDB();

        const match = { userId: identity.userId };
        if (dateFrom || dateTo) {
          match.date = {};
          if (dateFrom) match.date.$gte = new Date(dateFrom);
          if (dateTo)   match.date.$lte = new Date(dateTo);
        }

        const expenses = await Expense.find(match).lean();
        const total = expenses.reduce((s, e) => s + e.amount, 0);

        // Group by category
        const catMap = {};
        for (const e of expenses) {
          if (!catMap[e.category]) catMap[e.category] = { total: 0, count: 0 };
          catMap[e.category].total += e.amount;
          catMap[e.category].count += 1;
        }

        const byCategory = Object.entries(catMap).map(([category, data]) => ({
          category,
          total: +data.total.toFixed(2),
          count: data.count,
          percentage: total > 0 ? +(data.total / total * 100).toFixed(2) : 0,
        }));

        // Monthly average: spread over distinct months
        const months = new Set(expenses.map(e => {
          const d = new Date(e.date);
          return `${d.getFullYear()}-${d.getMonth()}`;
        }));
        const monthlyAverage = months.size > 0 ? +(total / months.size).toFixed(2) : 0;

        return { totalExpenses: +total.toFixed(2), byCategory, monthlyAverage, count: expenses.length };
      } catch (err) { throwErr(err); }
    },
  },

  Mutation: {
    addExpense: async (_parent, { input }, context) => {
      try {
        const identity = getIdentity(context);
        await connectDB();

        const expense = await Expense.create({
          expenseId: uuidv4(),
          userId: identity.userId,
          category: input.category,
          amount: input.amount,
          description: input.description,
          date: input.date ? new Date(input.date) : new Date(),
          tags: input.tags || [],
        });

        logger.info('addExpense resolved', { expenseId: expense.expenseId, userId: identity.userId });

        // Fire-and-forget: recalculate financial summary
        updateFinancialSummary(identity.userId).catch(() => {});

        return expense.toObject();
      } catch (err) { throwErr(err); }
    },

    updateExpense: async (_parent, { expenseId, input }, context) => {
      try {
        const identity = getIdentity(context);
        await connectDB();

        const existing = await Expense.findOne({ expenseId }).lean();
        if (!existing) throw new NotFoundError('Expense', expenseId);
        if (identity.role !== 'ADMIN' && existing.userId !== identity.userId) throw new ForbiddenError();

        const updates = {};
        if (input.category    !== undefined) updates.category    = input.category;
        if (input.amount      !== undefined) updates.amount      = input.amount;
        if (input.description !== undefined) updates.description = input.description;
        if (input.date        !== undefined) updates.date        = new Date(input.date);
        if (input.tags        !== undefined) updates.tags        = input.tags;

        const expense = await Expense.findOneAndUpdate(
          { expenseId },
          { $set: updates },
          { new: true, runValidators: true }
        ).lean();

        logger.info('updateExpense resolved', { expenseId });
        return expense;
      } catch (err) { throwErr(err); }
    },

    deleteExpense: async (_parent, { expenseId }, context) => {
      try {
        const identity = getIdentity(context);
        await connectDB();

        const existing = await Expense.findOne({ expenseId }).lean();
        if (!existing) throw new NotFoundError('Expense', expenseId);
        if (identity.role !== 'ADMIN' && existing.userId !== identity.userId) throw new ForbiddenError();

        await Expense.deleteOne({ expenseId });
        logger.info('deleteExpense resolved', { expenseId });
        return { success: true, message: 'Expense deleted successfully' };
      } catch (err) { throwErr(err); }
    },

    analyzeExpenses: async (_parent, { input }, context) => {
      try {
        const identity = getIdentity(context);
        const { salary, expenses } = input;

        // Persist expense items to MongoDB
        if (expenses && expenses.length > 0) {
          await connectDB();
          await Expense.insertMany(
            expenses.map(e => ({
              expenseId: uuidv4(),
              userId: identity.userId,
              category: e.category,
              amount: e.amount,
              description: e.description || `${e.category} expense`,
              date: new Date(),
              tags: [],
            }))
          );
          logger.info('analyzeExpenses: saved expenses to DB', { count: expenses.length, userId: identity.userId });
        }

        const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
        const disposableIncome = Math.max(0, salary - totalExpenses);
        const monthlySavings = Math.round(disposableIncome * 0.7);
        const emergencyFund = Math.round(salary * 3);
        const savingsRate = salary > 0 ? +((monthlySavings / salary) * 100).toFixed(1) : 0;

        let shortTermInvestment = 'Liquid Mutual Funds';
        let longTermInvestment = 'Index Funds (Nifty 50)';
        let advice = 'Start with an emergency fund covering 3 months of salary before investing.';

        if (disposableIncome <= 0) {
          shortTermInvestment = 'Savings Account';
          longTermInvestment = 'PPF (small contributions)';
          advice = 'Your expenses exceed income. Cut non-essential spending — focus on Rent, Food, and Utilities.';
        } else if (disposableIncome > salary * 0.4) {
          shortTermInvestment = 'Debt Mutual Funds or Fixed Deposits';
          longTermInvestment = 'Index Funds + PPF';
          advice = 'Excellent savings! Invest 20% in index funds for long-term wealth. Consider an additional SIP.';
        } else if (disposableIncome > salary * 0.2) {
          shortTermInvestment = 'Recurring Deposit or Liquid Funds';
          longTermInvestment = 'SIP in Mutual Funds';
          advice = 'Good savings rate! Start a ₹500/month SIP. Build emergency fund to 3 months salary first.';
        }

        logger.info('analyzeExpenses resolved', { salary, totalExpenses });

        // Fire-and-forget: recalculate financial summary after expenses are saved
        updateFinancialSummary(identity.userId).catch(() => {});

        return {
          emergencyFund,
          shortTermInvestment,
          longTermInvestment,
          monthlySavings,
          savingsRate,
          totalExpenses: +totalExpenses.toFixed(2),
          disposableIncome: +disposableIncome.toFixed(2),
          advice,
        };
      } catch (err) { throwErr(err); }
    },
  },

  // Field resolvers
  Expense: {
    id: (parent) => parent._id?.toString() || parent.id,
  },
};

module.exports = expenseResolver;
