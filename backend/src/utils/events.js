'use strict';

/**
 * src/utils/events.js
 * Local event publisher using Node.js EventEmitter.
 * Replaces AWS EventBridge — same exported API, no AWS SDK.
 */

const EventEmitter = require('events');
const { createLogger } = require('./logger');

const logger = createLogger('utils:events');

/** Shared EventEmitter instance — consumers can subscribe via emitter.on() */
const emitter = new EventEmitter();

// ─── Event Sources ────────────────────────────────────────────────────────────
const SOURCES = {
  USERS:       'smartbankai.users',
  LOANS:       'smartbankai.loans',
  INVESTMENTS: 'smartbankai.investments',
  FOREX:       'smartbankai.forex',
};

// ─── Detail Types ─────────────────────────────────────────────────────────────
const DETAIL_TYPES = {
  USER_CREATED:        'UserCreated',
  USER_UPDATED:        'UserUpdated',
  USER_DELETED:        'UserDeleted',
  LOAN_APPLIED:        'LoanApplied',
  LOAN_APPROVED:       'LoanApproved',
  LOAN_REJECTED:       'LoanRejected',
  INVESTMENT_CREATED:  'InvestmentCreated',
  INVESTMENT_UPDATED:  'InvestmentUpdated',
  INVESTMENT_CLOSED:   'InvestmentClosed',
  FOREX_INITIATED:     'ForexTransferInitiated',
  FOREX_COMPLETED:     'ForexTransferCompleted',
};

/**
 * Publish a single event to the local EventEmitter
 * @param {{ source: string, detailType: string, detail: object }} params
 * @returns {Promise<void>}
 */
async function publishEvent({ source, detailType, detail }) {
  const event = {
    source,
    detailType,
    detail: {
      ...detail,
      _meta: {
        publishedAt: new Date().toISOString(),
        source,
        detailType,
      },
    },
  };

  emitter.emit(detailType, event);
  emitter.emit('*', event);

  logger.info('Event published (local)', { detailType, source });
}

/**
 * Publish multiple events in batch
 * @param {Array<{ source: string, detailType: string, detail: object }>} events
 * @returns {Promise<void>}
 */
async function publishEvents(events) {
  await Promise.all(events.map(publishEvent));
  logger.info('Batch events published (local)', { count: events.length });
}

// ─── Domain Event Publishers ──────────────────────────────────────────────────

/**
 * Publish UserCreated event
 * @param {{ userId: string, email: string, name: string, role: string }} user
 */
async function publishUserCreatedEvent(user) {
  return publishEvent({
    source: SOURCES.USERS,
    detailType: DETAIL_TYPES.USER_CREATED,
    detail: { userId: user.userId || user._id, email: user.email, name: user.name, role: user.role },
  });
}

/**
 * Publish LoanApproved event
 * @param {{ loanId: string, userId: string, loanType: string, loanAmount: number, emi: number }} loan
 */
async function publishLoanApprovedEvent(loan) {
  return publishEvent({
    source: SOURCES.LOANS,
    detailType: DETAIL_TYPES.LOAN_APPROVED,
    detail: { loanId: loan.loanId || loan._id, userId: loan.userId, loanType: loan.loanType, loanAmount: loan.loanAmount, emi: loan.emi },
  });
}

/**
 * Publish LoanRejected event
 * @param {{ loanId: string, userId: string, loanType: string }} loan
 */
async function publishLoanRejectedEvent(loan) {
  return publishEvent({
    source: SOURCES.LOANS,
    detailType: DETAIL_TYPES.LOAN_REJECTED,
    detail: { loanId: loan.loanId || loan._id, userId: loan.userId, loanType: loan.loanType },
  });
}

/**
 * Publish InvestmentCreated event
 * @param {{ investmentId: string, userId: string, investmentType: string, amount: number }} investment
 */
async function publishInvestmentCreatedEvent(investment) {
  return publishEvent({
    source: SOURCES.INVESTMENTS,
    detailType: DETAIL_TYPES.INVESTMENT_CREATED,
    detail: { investmentId: investment.investmentId || investment._id, userId: investment.userId, investmentType: investment.investmentType, amount: investment.amount },
  });
}

module.exports = {
  emitter,
  publishEvent,
  publishEvents,
  publishUserCreatedEvent,
  publishLoanApprovedEvent,
  publishLoanRejectedEvent,
  publishInvestmentCreatedEvent,
  SOURCES,
  DETAIL_TYPES,
};
