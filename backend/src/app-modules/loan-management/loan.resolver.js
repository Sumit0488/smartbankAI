/**
 * loan.resolver.js — No auth required (open APIs)
 */
const loanService = require('./loan.service');

const DEFAULT_USER = { id: 'public', role: 'USER' };

const loanResolvers = {
  Query: {
    getMyLoans: async (_, { userId }) =>
      loanService.getMyLoans({ id: userId || DEFAULT_USER.id }),

    getLoansByStatus: async (_, { userId, status }) =>
      loanService.getLoansByStatus(userId || DEFAULT_USER.id, status),

    getLoanEMI: async (_, { loan_amount, interest_rate, tenure }) =>
      loanService.getLoanEMI(loan_amount, interest_rate, tenure),

    getAllLoans: async () => loanService.getAllLoans(),
  },

  Mutation: {
    applyLoan: async (_, { input, userId }) =>
      loanService.applyLoan(input, { id: userId || DEFAULT_USER.id }),

    updateLoan: async (_, { id, input, userId }) =>
      loanService.updateLoan(id, input, { id: userId || DEFAULT_USER.id, role: 'ADMIN' }),

    updateLoanStatus: async (_, { id, status }) =>
      loanService.updateLoanStatus(id, status),

    deleteLoan: async (_, { id, userId }) =>
      loanService.deleteLoan(id, { id: userId || DEFAULT_USER.id, role: 'ADMIN' }),
  },
};

module.exports = loanResolvers;
