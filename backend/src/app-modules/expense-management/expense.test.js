/**
 * expense.test.js — Jest unit tests for expense-management
 * Source: codegen/schemas/expense.schema.yaml
 * Test runner: Jest + mongodb-memory-server
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Expense = require('./expense.model');
const expenseService = require('./expense.service');

let mongoServer;

// Mock current user (simulates the authenticated user from JWT context)
const mockUser = {
  id: 'user-abc-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER',
};

const mockAdmin = {
  id: 'admin-xyz-999',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'ADMIN',
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Expense.deleteMany({});
});

describe('ExpenseService', () => {

  const validInput = {
    category: 'food',
    amount: 1500,
    month: '2026-03',
    description: 'Grocery shopping',
  };

  // ── Add ──────────────────────────────────────────────────────────────────────
  test('should add a new expense and assign user_id from context', async () => {
    const expense = await expenseService.addExpense(validInput, mockUser);
    expect(expense.amount).toBe(1500);
    expect(expense.user_id).toBe(mockUser.id);
    expect(expense.category).toBe('food');
    expect(expense.expense_id).toBeDefined();
  });

  test('should auto-set month if not provided', async () => {
    const expense = await expenseService.addExpense({ category: 'travel', amount: 500 }, mockUser);
    expect(expense.month).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
  });

  test('should reject negative amount', async () => {
    await expect(
      expenseService.addExpense({ ...validInput, amount: -100 }, mockUser)
    ).rejects.toThrow();
  });

  // ── Read ─────────────────────────────────────────────────────────────────────
  test('should get only the current user\'s expenses', async () => {
    await expenseService.addExpense(validInput, mockUser);
    await expenseService.addExpense({ category: 'rent', amount: 8000, month: '2026-03' }, {
      ...mockUser, id: 'other-user-999',
    });

    const myExpenses = await expenseService.getMyExpenses(mockUser);
    expect(myExpenses).toHaveLength(1);
    expect(myExpenses[0].user_id).toBe(mockUser.id);
  });

  test('should filter expenses by month', async () => {
    await expenseService.addExpense({ ...validInput, month: '2026-03' }, mockUser);
    await expenseService.addExpense({ ...validInput, month: '2026-02' }, mockUser);

    const results = await expenseService.getExpensesByMonth(mockUser.id, '2026-03');
    expect(results).toHaveLength(1);
    expect(results[0].month).toBe('2026-03');
  });

  test('should filter expenses by category', async () => {
    await expenseService.addExpense({ ...validInput, category: 'food' }, mockUser);
    await expenseService.addExpense({ ...validInput, category: 'travel' }, mockUser);

    const results = await expenseService.getExpensesByCategory(mockUser.id, 'food');
    expect(results).toHaveLength(1);
    expect(results[0].category).toBe('food');
  });

  // ── Monthly Summary ───────────────────────────────────────────────────────────
  test('should compute monthly summary with category breakdown', async () => {
    await expenseService.addExpense({ category: 'food', amount: 2000, month: '2026-03' }, mockUser);
    await expenseService.addExpense({ category: 'travel', amount: 1000, month: '2026-03' }, mockUser);

    const summary = await expenseService.getMonthlySummary(mockUser.id, '2026-03');
    expect(summary.total).toBe(3000);
    expect(summary.byCategory.food).toBe(2000);
    expect(summary.byCategory.travel).toBe(1000);
    expect(summary.count).toBe(2);
  });

  // ── Update ───────────────────────────────────────────────────────────────────
  test('should update own expense', async () => {
    const expense = await expenseService.addExpense(validInput, mockUser);
    const updated = await expenseService.updateExpense(
      expense._id, { amount: 2000 }, mockUser
    );
    expect(updated.amount).toBe(2000);
  });

  test('should not update another user\'s expense', async () => {
    const expense = await expenseService.addExpense(validInput, mockUser);
    await expect(
      expenseService.updateExpense(expense._id, { amount: 5000 }, { ...mockUser, id: 'hacker-999' })
    ).rejects.toThrow();
  });

  // ── Delete ───────────────────────────────────────────────────────────────────
  test('should delete own expense', async () => {
    const expense = await expenseService.addExpense(validInput, mockUser);
    const result = await expenseService.deleteExpense(expense._id, mockUser);
    expect(result.success).toBe(true);
  });

  test('admin should delete any user\'s expense', async () => {
    const expense = await expenseService.addExpense(validInput, mockUser);
    const result = await expenseService.deleteExpense(expense._id, mockAdmin);
    expect(result.success).toBe(true);
  });

});
