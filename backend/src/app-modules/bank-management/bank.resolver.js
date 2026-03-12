/**
 * bank.resolver.js — No auth required (all APIs open)
 */
const bankService = require('./bank.service');

const bankResolvers = {
  Query: {
    getAllBanks: async () => bankService.getAllBanks(),
    getBankById: async (_, { id }) => bankService.getBankById(id),
    searchBanks: async (_, { query }) => bankService.searchBanks(query),
    compareBanks: async (_, { ids }) => bankService.compareBanks(ids),
  },

  Mutation: {
    createBank: async (_, { input }) => bankService.createBank(input),
    updateBank: async (_, { id, input }) => bankService.updateBank(id, input),
    deleteBank: async (_, { id }) => bankService.deleteBank(id),
    seedBanks: async () => bankService.seedDefaultBanks(),
  },
};

module.exports = bankResolvers;
