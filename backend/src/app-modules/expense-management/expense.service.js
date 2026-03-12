/**
 * expense.service.js — Expense-specific business logic
 * Source: codegen/schemas/expense.schema.yaml
 */

const Expense = require('./expense.model');
const { sendExpenseAlert } = require('../../shared/notification');
const { UserInputError, ForbiddenError } = require('apollo-server-express');
const { addExpenseSchema, updateExpenseSchema, validate } = require('./expense.validation');
const { v4: uuidv4 } = require('uuid');

class ExpenseService {

  // ── Add Expense ──────────────────────────────────────────────────────────────
  async addExpense(input, currentUser) {
    // Inject authenticated user's ID — cannot spoof another user's ID
    const data = { ...input, user_id: currentUser.id };

    const { error } = validate(data, addExpenseSchema);
    if (error) throw new UserInputError(error.details.map(d => d.message).join(', '));

    // Auto-set month from current date if not provided
    if (!data.month) {
      const now = new Date();
      data.month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    const expense = await Expense.create({
      ...data,
      expense_id: uuidv4(),
    });

    // Fire ExpenseAdded email notification (non-blocking)
    sendExpenseAlert({
      to: currentUser.email,
      name: currentUser.name || currentUser.email,
      category: expense.category,
      amount: expense.amount,
    }).catch(err => console.error('[Notification] ExpenseAlert failed:', err.message));

    return expense;
  }

  // ── Get My Expenses ──────────────────────────────────────────────────────────
  async getMyExpenses(currentUser) {
    return Expense.find({ user_id: currentUser.id }).sort({ createdAt: -1 });
  }

  // ── Get Expenses By Month ────────────────────────────────────────────────────
  async getExpensesByMonth(userId, month) {
    return Expense.find({ user_id: userId, month }).sort({ createdAt: -1 });
  }

  // ── Get Expenses By Category ─────────────────────────────────────────────────
  async getExpensesByCategory(userId, category) {
    return Expense.find({ user_id: userId, category }).sort({ createdAt: -1 });
  }

  // ── Get All Expenses (Admin) ──────────────────────────────────────────────────
  async getAllExpenses() {
    return Expense.find({}).sort({ createdAt: -1 });
  }

  // ── Transaction History ───────────────────────────────────────────────────────
  async getTransactionHistory(currentUser, month) {
    const filter = { user_id: currentUser.id };
    if (month) filter.month = month;
    return Expense.find(filter).sort({ createdAt: -1 });
  }

  // ── Update Expense ───────────────────────────────────────────────────────────
  async updateExpense(id, input, currentUser) {
    const { error } = validate(input, updateExpenseSchema);
    if (error) throw new UserInputError(error.details.map(d => d.message).join(', '));

    // Enforce ownership
    const expense = await Expense.findById(id);
    if (!expense) throw new UserInputError('Expense not found.');
    if (expense.user_id !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('You can only update your own expenses.');
    }

    return Expense.findByIdAndUpdate(id, { $set: input }, { new: true, runValidators: true });
  }

  // ── Delete Expense ───────────────────────────────────────────────────────────
  async deleteExpense(id, currentUser) {
    const expense = await Expense.findById(id);
    if (!expense) throw new UserInputError('Expense not found.');
    if (expense.user_id !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('You can only delete your own expenses.');
    }

    await Expense.findByIdAndDelete(id);
    return { success: true, message: 'Expense deleted successfully.' };
  }

  // ── Monthly Summary (helper for AI Expense Analyzer) ─────────────────────────
  async getMonthlySummary(userId, month) {
    const expenses = await Expense.find({ user_id: userId, month });
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});
    return { total, byCategory, count: expenses.length, month };
  }
}

module.exports = new ExpenseService();
