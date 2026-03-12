/**
 * user.resolver.js — No auth required
 */
const userService = require('./user.service');

const userResolvers = {
  Query: {
    getProfile: async (_, { id }) => userService.getProfile(id),
    getAllUsers: async () => userService.getAllUsers(),
    getUserById: async (_, { id }) => userService.getUserById(id),
  },

  Mutation: {
    updateProfile: async (_, { id, input }) => userService.updateProfile(id, input),
    deleteUser: async (_, { id }) => userService.deleteUser(id),
  },
};

module.exports = userResolvers;
