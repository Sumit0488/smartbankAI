/**
 * expense.resolver.js — No auth required (open APIs)
 */
const expenseService = require('./expense.service');

// Default user context for auth-free operation
const DEFAULT_USER = { id: 'public', email: 'public@smartbank.ai', role: 'USER' };

const expenseResolvers = {
  Query: {
    getMyExpenses: async (_, { userId }) =>
      expenseService.getMyExpenses({ id: userId || DEFAULT_USER.id }),

    getExpensesByMonth: async (_, { userId, month }) =>
      expenseService.getExpensesByMonth(userId || DEFAULT_USER.id, month),

    getExpensesByCategory: async (_, { userId, category }) =>
      expenseService.getExpensesByCategory(userId || DEFAULT_USER.id, category),

    getAllExpenses: async () => expenseService.getAllExpenses(),

    getTransactionHistory: async (_, { userId, month }) =>
      expenseService.getTransactionHistory({ id: userId || DEFAULT_USER.id }, month),
  },

  Mutation: {
    addExpense: async (_, { input, userId }) =>
      expenseService.addExpense(input, { id: userId || DEFAULT_USER.id, email: DEFAULT_USER.email }),

    updateExpense: async (_, { id, input, userId }) =>
      expenseService.updateExpense(id, input, { id: userId || DEFAULT_USER.id, role: 'ADMIN' }),

    deleteExpense: async (_, { id, userId }) =>
      expenseService.deleteExpense(id, { id: userId || DEFAULT_USER.id, role: 'ADMIN' }),
  },
};

module.exports = expenseResolvers;
