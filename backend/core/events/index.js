'use strict';

/**
 * core/events/index.js
 * AWS EventBridge event publisher.
 * All domain events are published here and consumed by downstream Lambda functions.
 */

const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const { createLogger } = require('../logger');

const logger = createLogger('core:events');

const AWS_REGION    = process.env.AWS_REGION     || 'ap-south-1';
const EVENT_BUS     = process.env.EVENT_BUS_NAME || 'SmartBankAI-Events';

const client = new EventBridgeClient({ region: AWS_REGION });

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
 * Publish a single event to EventBridge
 * @param {{ source: string, detailType: string, detail: object, eventBusName?: string }} params
 * @returns {Promise<object>} EventBridge put result
 */
async function publishEvent({ source, detailType, detail, eventBusName }) {
  const entry = {
    EventBusName: eventBusName || EVENT_BUS,
    Source: source,
    DetailType: detailType,
    Detail: JSON.stringify({
      ...detail,
      _meta: {
        publishedAt: new Date().toISOString(),
        source,
        detailType,
      },
    }),
  };

  if (!process.env.AWS_ACCESS_KEY_ID) {
    logger.warn('AWS not configured — skipping EventBridge publish', { detailType });
    return;
  }

  try {
    const command = new PutEventsCommand({ Entries: [entry] });
    const result = await client.send(command);

    if (result.FailedEntryCount > 0) {
      const failed = result.Entries.filter((e) => e.ErrorCode);
      logger.error('EventBridge entry failed', { detailType, errors: failed });
      throw new Error(`EventBridge publish failed: ${failed[0]?.ErrorMessage}`);
    }

    logger.info('Event published', {
      detailType,
      source,
      eventId: result.Entries[0]?.EventId,
    });

    return result;
  } catch (err) {
    logger.error('Failed to publish event', { detailType, error: err.message });
    throw err;
  }
}

/**
 * Publish multiple events in a single batch (max 10 per EventBridge limit)
 * @param {Array<{ source: string, detailType: string, detail: object }>} events
 * @returns {Promise<object>}
 */
async function publishEvents(events) {
  const entries = events.map((e) => ({
    EventBusName: EVENT_BUS,
    Source: e.source,
    DetailType: e.detailType,
    Detail: JSON.stringify({ ...e.detail, _meta: { publishedAt: new Date().toISOString() } }),
  }));

  const command = new PutEventsCommand({ Entries: entries });
  const result = await client.send(command);
  logger.info('Batch events published', { count: events.length, failed: result.FailedEntryCount });
  return result;
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
  publishEvent,
  publishEvents,
  publishUserCreatedEvent,
  publishLoanApprovedEvent,
  publishLoanRejectedEvent,
  publishInvestmentCreatedEvent,
  SOURCES,
  DETAIL_TYPES,
};
