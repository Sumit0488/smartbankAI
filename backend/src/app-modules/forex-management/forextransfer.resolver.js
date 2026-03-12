/**
 * forextransfer.resolver.js — No auth required (open APIs)
 */
const forexService = require('./forexTransfer.service');

const DEFAULT_USER = { id: 'public', role: 'USER' };

const forexResolvers = {
  Query: {
    getMyTransfers: async (_, { userId }) =>
      forexService.getMyTransfers({ id: userId || DEFAULT_USER.id }),

    getTransfersByStatus: async (_, { userId, status }) =>
      forexService.getTransfersByStatus(userId || DEFAULT_USER.id, status),

    getLiveRate: async (_, { from_currency, to_currency }) =>
      forexService.getLiveRate(from_currency, to_currency),

    getAllTransfers: async () => forexService.getAllTransfers(),
  },

  Mutation: {
    initiateTransfer: async (_, { input, userId }) =>
      forexService.initiateTransfer(input, { id: userId || DEFAULT_USER.id }),

    cancelTransfer: async (_, { id, userId }) =>
      forexService.cancelTransfer(id, { id: userId || DEFAULT_USER.id, role: 'ADMIN' }),

    updateTransferStatus: async (_, { id, status }) =>
      forexService.updateTransferStatus(id, status),
  },
};

module.exports = forexResolvers;
