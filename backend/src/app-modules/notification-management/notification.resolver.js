/**
 * notification.resolver.js — No auth required (open APIs)
 */
const notificationService = require('./notification.service');

const notificationResolvers = {
  Mutation: {
    sendEmailNotification: async (_, { input }) =>
      notificationService.sendEmail(input),

    sendWelcomeEmail: async (_, { userId }) =>
      notificationService.sendWelcomeEmail(userId),

    sendLoanApprovalEmail: async (_, { loanId }) =>
      notificationService.sendLoanApprovalEmail(loanId),
  },
};

module.exports = notificationResolvers;
