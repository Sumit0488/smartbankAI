'use strict';

/**
 * services/events/eventBridge.js
 * AWS EventBridge service — publish and manage events and rules.
 */

const {
  EventBridgeClient,
  PutEventsCommand,
  CreateEventBusCommand,
  PutRuleCommand,
  PutTargetsCommand,
  ListRulesCommand,
  DeleteRuleCommand,
  RemoveTargetsCommand,
} = require('@aws-sdk/client-eventbridge');

const { createLogger } = require('../../core/logger');

const logger = createLogger('services:events:eventBridge');

const REGION     = process.env.AWS_REGION     || 'ap-south-1';
const EVENT_BUS  = process.env.EVENT_BUS_NAME || 'SmartBankAI-Events';

const client = new EventBridgeClient({ region: REGION });

// ─── Event Sources and Detail Types ──────────────────────────────────────────
const SOURCES = {
  USERS:       'smartbankai.users',
  LOANS:       'smartbankai.loans',
  INVESTMENTS: 'smartbankai.investments',
  SYSTEM:      'smartbankai.system',
};

const DETAIL_TYPES = {
  USER_CREATED:       'UserCreated',
  USER_UPDATED:       'UserUpdated',
  USER_DELETED:       'UserDeleted',
  LOAN_APPLIED:       'LoanApplied',
  LOAN_APPROVED:      'LoanApproved',
  LOAN_REJECTED:      'LoanRejected',
  LOAN_DISBURSED:     'LoanDisbursed',
  INVESTMENT_CREATED: 'InvestmentCreated',
  INVESTMENT_CLOSED:  'InvestmentClosed',
};

/**
 * Put a single event on EventBridge
 * @param {{ source: string, detailType: string, detail: object, eventBusName?: string }} params
 */
async function putEvent({ source, detailType, detail, eventBusName = EVENT_BUS }) {
  const command = new PutEventsCommand({
    Entries: [{
      EventBusName: eventBusName,
      Source: source,
      DetailType: detailType,
      Detail: JSON.stringify({
        ...detail,
        _meta: { publishedAt: new Date().toISOString(), source, detailType },
      }),
      Time: new Date(),
    }],
  });

  const result = await client.send(command);

  if (result.FailedEntryCount > 0) {
    const failed = result.Entries.filter((e) => e.ErrorCode);
    logger.error('EventBridge entry failed', { detailType, error: failed[0]?.ErrorMessage });
    throw new Error(`EventBridge publish failed: ${failed[0]?.ErrorMessage}`);
  }

  logger.info('EventBridge event published', { detailType, eventId: result.Entries[0]?.EventId });
  return result.Entries[0];
}

/**
 * Put multiple events in a single batch (max 10 per call)
 * @param {Array<{ source: string, detailType: string, detail: object }>} events
 */
async function putEvents(events) {
  if (events.length > 10) {
    // Split into chunks of 10
    const chunks = [];
    for (let i = 0; i < events.length; i += 10) chunks.push(events.slice(i, i + 10));
    const results = await Promise.all(chunks.map((chunk) => putEvents(chunk)));
    return results.flat();
  }

  const command = new PutEventsCommand({
    Entries: events.map((e) => ({
      EventBusName: EVENT_BUS,
      Source: e.source,
      DetailType: e.detailType,
      Detail: JSON.stringify({ ...e.detail, _meta: { publishedAt: new Date().toISOString() } }),
      Time: new Date(),
    })),
  });

  const result = await client.send(command);
  logger.info('EventBridge batch published', { count: events.length, failed: result.FailedEntryCount });
  return result.Entries;
}

/**
 * Create a custom event bus
 * @param {string} name
 * @returns {Promise<string>} EventBusArn
 */
async function createEventBus(name) {
  const result = await client.send(new CreateEventBusCommand({ Name: name }));
  logger.info('EventBridge event bus created', { name, arn: result.EventBusArn });
  return result.EventBusArn;
}

/**
 * Create an EventBridge rule
 * @param {{ name: string, eventPattern: object, description?: string, eventBusName?: string }} params
 */
async function createRule({ name, eventPattern, description = '', eventBusName = EVENT_BUS }) {
  const result = await client.send(new PutRuleCommand({
    Name: name,
    EventBusName: eventBusName,
    EventPattern: JSON.stringify(eventPattern),
    State: 'ENABLED',
    Description: description,
  }));
  logger.info('EventBridge rule created', { name, arn: result.RuleArn });
  return result.RuleArn;
}

/**
 * Add targets to an EventBridge rule
 * @param {{ ruleName: string, targets: Array<{ Id: string, Arn: string }>, eventBusName?: string }} params
 */
async function putTargets({ ruleName, targets, eventBusName = EVENT_BUS }) {
  const result = await client.send(new PutTargetsCommand({
    Rule: ruleName,
    EventBusName: eventBusName,
    Targets: targets,
  }));
  if (result.FailedEntryCount > 0) {
    logger.error('Failed to add targets', { ruleName, failed: result.FailedEntries });
  }
  logger.info('EventBridge targets added', { ruleName, count: targets.length });
  return result;
}

/**
 * List all rules on the event bus
 */
async function listRules(eventBusName = EVENT_BUS) {
  const result = await client.send(new ListRulesCommand({ EventBusName: eventBusName }));
  return result.Rules || [];
}

// ─── Domain Event Publishers ──────────────────────────────────────────────────

const publishUserCreated      = (data) => putEvent({ source: SOURCES.USERS,       detailType: DETAIL_TYPES.USER_CREATED,       detail: data });
const publishLoanApproved     = (data) => putEvent({ source: SOURCES.LOANS,       detailType: DETAIL_TYPES.LOAN_APPROVED,      detail: data });
const publishLoanRejected     = (data) => putEvent({ source: SOURCES.LOANS,       detailType: DETAIL_TYPES.LOAN_REJECTED,      detail: data });
const publishLoanApplied      = (data) => putEvent({ source: SOURCES.LOANS,       detailType: DETAIL_TYPES.LOAN_APPLIED,       detail: data });
const publishInvestmentCreated= (data) => putEvent({ source: SOURCES.INVESTMENTS, detailType: DETAIL_TYPES.INVESTMENT_CREATED, detail: data });

module.exports = {
  putEvent,
  putEvents,
  createEventBus,
  createRule,
  putTargets,
  listRules,
  publishUserCreated,
  publishLoanApproved,
  publishLoanRejected,
  publishLoanApplied,
  publishInvestmentCreated,
  SOURCES,
  DETAIL_TYPES,
};
