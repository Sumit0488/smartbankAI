/**
 * advisor.resolver.js — No auth required (open APIs)
 */
const advisorService = require('./advisor.service');

const advisorResolvers = {
  Query: {
    calculateSendMoney: async (_, { amount, from_currency, to_currency }) =>
      advisorService.calculateSendMoney(amount, from_currency, to_currency),

    getInvestmentAdvice: async (_, { profileType, salary }) =>
      advisorService.getInvestmentAdvice(profileType, salary),

    getForexAdvice: async (_, { from_currency, to_currency }) =>
      advisorService.getForexAdvice(from_currency, to_currency),

    checkMinBalanceRisk: async (_, { bankName, currentBalance }) =>
      advisorService.checkMinBalanceRisk(bankName, currentBalance),
  },
};

module.exports = advisorResolvers;
