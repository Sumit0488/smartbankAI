'use strict';

/**
 * src/utils/updateFinancialSummary.js
 *
 * Recalculates a user's financial summary, AI insights, and investment profile
 * by aggregating from the Expense and Investment collections.
 *
 * Designed to be called fire-and-forget from mutations:
 *   updateFinancialSummary(userId).catch(() => {});
 */

const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { createLogger } = require('./logger');

const logger = createLogger('utils:updateFinancialSummary');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcHealthScore(savingsRate, totalInvestments, categoryCount) {
  let score = 30; // base score every user starts with
  if (savingsRate >= 30)      score += 40;
  else if (savingsRate >= 15) score += 25;
  else if (savingsRate >= 5)  score += 10;
  if (totalInvestments > 0)   score += 20;
  if (categoryCount >= 3)     score += 10;
  return Math.min(100, Math.round(score));
}

function getSavingsSuggestion(savingsRate, topCategory) {
  const cat = topCategory || 'discretionary';
  if (savingsRate >= 30) return 'Excellent savings rate! Consider diversifying into equity mutual funds for long-term wealth creation.';
  if (savingsRate >= 20) return 'Good savings rate. Starting a monthly SIP can significantly accelerate wealth building.';
  if (savingsRate >= 10) return `Your savings rate could improve. Try reducing ${cat} spending by 10-15% this month.`;
  return `Critical: very low savings rate. Cut non-essential expenses, especially in ${cat}, and build a 3-month emergency fund first.`;
}

function getRiskAlert(savingsRate, totalInvestments, income) {
  if (income > 0 && totalInvestments === 0)
    return 'No investments found. Start with a Recurring Deposit or PPF to build a financial safety net.';
  if (income > 0 && savingsRate < 5)
    return 'Warning: expenses are nearly equal to income. An emergency fund is urgently needed.';
  if (income > 0 && savingsRate < 15)
    return 'Savings rate is below the recommended 15%. Review discretionary spending to stay financially healthy.';
  return null;
}

function getRecommendedAssets(riskProfile) {
  const map = {
    CONSERVATIVE: ['Fixed Deposit', 'PPF', 'Government Bonds', 'Liquid Mutual Funds'],
    MODERATE:     ['Index Funds (Nifty 50)', 'SIP in Balanced Funds', 'Fixed Deposit', 'Sovereign Gold Bonds'],
    AGGRESSIVE:   ['Stocks', 'Sectoral Mutual Funds', 'SIP in Equity Funds', 'International Funds'],
  };
  return map[riskProfile] || map['MODERATE'];
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Recalculate and persist financial analytics for a user.
 * Safe to await or call fire-and-forget — never throws.
 *
 * @param {string} userId
 */
async function updateFinancialSummary(userId) {
  try {
    await connectDB();

    const User       = mongoose.models.User;
    const Expense    = mongoose.models.Expense;
    const Investment = mongoose.models.Investment;

    if (!User) {
      logger.warn('User model not loaded; skipping summary update', { userId });
      return;
    }

    const user = await User.findOne({ userId }).lean();
    if (!user) return;

    const income      = user.monthlyIncome || user.salary || 0;
    const riskProfile = user.riskProfile   || 'MODERATE';

    // ── Date window: current calendar month ──────────────────────────────────
    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // ── Expense aggregations ─────────────────────────────────────────────────
    let totalExpenses       = 0;
    let topCategory         = null;
    let highestExpenseMonth = null;
    let categoryCount       = 0;

    if (Expense) {
      const [monthAgg, catAgg, distinctCats, monthlyAgg] = await Promise.all([
        // Current month total
        Expense.aggregate([
          { $match: { userId, date: { $gte: monthStart, $lte: monthEnd } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        // Top spending category (all time)
        Expense.aggregate([
          { $match: { userId } },
          { $group: { _id: '$category', total: { $sum: '$amount' } } },
          { $sort: { total: -1 } },
          { $limit: 1 },
        ]),
        // Distinct categories for health score
        Expense.distinct('category', { userId }),
        // Highest expense month in the last 12 months
        Expense.aggregate([
          { $match: { userId, date: { $gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) } } },
          {
            $group: {
              _id:   { year: { $year: '$date' }, month: { $month: '$date' } },
              total: { $sum: '$amount' },
            },
          },
          { $sort: { total: -1 } },
          { $limit: 1 },
        ]),
      ]);

      totalExpenses = monthAgg[0]?.total || 0;
      topCategory   = catAgg[0]?._id    || null;
      categoryCount = distinctCats.length;

      if (monthlyAgg[0]) {
        const { year, month } = monthlyAgg[0]._id;
        highestExpenseMonth = `${year}-${String(month).padStart(2, '0')}`;
      }
    }

    // ── Investment aggregation ────────────────────────────────────────────────
    let totalInvestments = 0;
    if (Investment) {
      const invAgg = await Investment.aggregate([
        { $match: { userId, status: 'ACTIVE' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      totalInvestments = invAgg[0]?.total || 0;
    }

    // ── Derived calculations ─────────────────────────────────────────────────
    const totalSavings        = Math.max(0, income - totalExpenses);
    const monthlySavingsRate  = income > 0 ? +((totalSavings / income) * 100).toFixed(1) : 0;
    const financialHealthScore = calcHealthScore(monthlySavingsRate, totalInvestments, categoryCount);
    const savingsSuggestion   = getSavingsSuggestion(monthlySavingsRate, topCategory);
    const riskAlert           = getRiskAlert(monthlySavingsRate, totalInvestments, income);
    const recommendedAssets   = getRecommendedAssets(riskProfile);

    // ── Persist back to User document ─────────────────────────────────────────
    await User.findOneAndUpdate(
      { userId },
      {
        $set: {
          financialHealthScore,

          // userFinancialSummary
          'userFinancialSummary.totalIncome':          income,
          'userFinancialSummary.totalExpenses':         +totalExpenses.toFixed(2),
          'userFinancialSummary.totalInvestments':      +totalInvestments.toFixed(2),
          'userFinancialSummary.totalSavings':          +totalSavings.toFixed(2),
          'userFinancialSummary.monthlySavingsRate':    monthlySavingsRate,
          'userFinancialSummary.financialHealthScore':  financialHealthScore,
          'userFinancialSummary.lastCalculated':        new Date(),

          // aiInsights
          'aiInsights.topSpendingCategory': topCategory,
          'aiInsights.highestExpenseMonth': highestExpenseMonth,
          'aiInsights.savingsSuggestion':   savingsSuggestion,
          'aiInsights.riskAlert':           riskAlert,

          // investmentProfile (recommended assets only; riskLevel/goal are user-set)
          'investmentProfile.recommendedAssets': recommendedAssets,
        },
      },
      { new: false }
    );

    logger.info('Financial summary updated', {
      userId, financialHealthScore, monthlySavingsRate,
      totalExpenses, totalInvestments,
    });
  } catch (err) {
    // Never throw — this is always fire-and-forget
    logger.warn('updateFinancialSummary failed', { userId, error: err.message });
  }
}

module.exports = { updateFinancialSummary };
