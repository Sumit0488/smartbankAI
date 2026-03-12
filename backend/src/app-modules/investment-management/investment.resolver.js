/**
 * investment.resolver.js — No auth required (open APIs)
 */
const investmentService = require('./investment.service');

const DEFAULT_USER = { id: 'public', role: 'USER' };

const investmentResolvers = {
  Query: {
    getMyInvestments: async (_, { userId }) =>
      investmentService.getMyInvestments({ id: userId || DEFAULT_USER.id }),

    getInvestmentsByType: async (_, { userId, investment_type }) =>
      investmentService.getInvestmentsByType(userId || DEFAULT_USER.id, investment_type),

    getPortfolioSummary: async (_, { userId }) =>
      investmentService.getPortfolioSummary({ id: userId || DEFAULT_USER.id }),

    getAllInvestments: async () => investmentService.getAllInvestments(),
  },

  Mutation: {
    addInvestment: async (_, { input, userId }) =>
      investmentService.addInvestment(input, { id: userId || DEFAULT_USER.id }),

    updateInvestment: async (_, { id, input, userId }) =>
      investmentService.updateInvestment(id, input, { id: userId || DEFAULT_USER.id, role: 'ADMIN' }),

    deleteInvestment: async (_, { id, userId }) =>
      investmentService.deleteInvestment(id, { id: userId || DEFAULT_USER.id, role: 'ADMIN' }),
  },
};

module.exports = investmentResolvers;
