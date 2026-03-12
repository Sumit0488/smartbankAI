/**
 * card.resolver.js — No auth required (all APIs open)
 */
const cardService = require('./card.service');

const cardResolvers = {
  Query: {
    getAllCards: async () => cardService.getAllCards(),
    getCardById: async (_, { id }) => cardService.getCardById(id),
    getCardsByBank: async (_, { bank_name }) => cardService.getCardsByBank(bank_name),
    getCardsByType: async (_, { card_type }) => cardService.getCardsByType(card_type),
    getCardsByCategory: async (_, { card_category }) => cardService.getCardsByCategory(card_category),
    searchCards: async (_, { query }) => cardService.searchCards(query),
  },

  Mutation: {
    createCard: async (_, { input }) => cardService.createCard(input),
    updateCard: async (_, { id, input }) => cardService.updateCard(id, input),
    deleteCard: async (_, { id }) => cardService.deleteCard(id),
    seedCards: async () => cardService.seedDefaultCards(),
  },
};

module.exports = cardResolvers;
