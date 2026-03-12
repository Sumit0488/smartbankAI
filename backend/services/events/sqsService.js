'use strict';

/**
 * services/events/sqsService.js
 * AWS SQS service — message queuing for async event processing.
 */

const {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  SendMessageBatchCommand,
  CreateQueueCommand,
  GetQueueUrlCommand,
  PurgeQueueCommand,
  GetQueueAttributesCommand,
} = require('@aws-sdk/client-sqs');

const { createLogger } = require('../../core/logger');

const logger = createLogger('services:events:sqs');

const REGION             = process.env.AWS_REGION            || 'ap-south-1';
const NOTIFICATION_QUEUE = process.env.NOTIFICATION_QUEUE_URL || '';
const EVENTS_QUEUE       = process.env.EVENTS_QUEUE_URL       || '';

const sqsClient = new SQSClient({ region: REGION });

/**
 * Send a single message to an SQS queue
 * @param {{ queueUrl: string, messageBody: object | string, messageAttributes?: object, delaySeconds?: number, messageGroupId?: string, messageDeduplicationId?: string }} params
 */
async function sendMessage({ queueUrl, messageBody, messageAttributes = {}, delaySeconds = 0, messageGroupId, messageDeduplicationId }) {
  const body = typeof messageBody === 'string' ? messageBody : JSON.stringify(messageBody);

  const params = {
    QueueUrl: queueUrl,
    MessageBody: body,
    DelaySeconds: delaySeconds,
    MessageAttributes: Object.fromEntries(
      Object.entries(messageAttributes).map(([k, v]) => [k, { DataType: 'String', StringValue: String(v) }])
    ),
  };

  // FIFO queue attributes
  if (messageGroupId) params.MessageGroupId = messageGroupId;
  if (messageDeduplicationId) params.MessageDeduplicationId = messageDeduplicationId;

  const result = await sqsClient.send(new SendMessageCommand(params));
  logger.info('SQS message sent', { queueUrl, messageId: result.MessageId });
  return result;
}

/**
 * Long-poll receive messages from a queue
 * @param {{ queueUrl: string, maxMessages?: number, waitTimeSeconds?: number, visibilityTimeout?: number }} params
 * @returns {Promise<Array>} Array of SQS message objects
 */
async function receiveMessages({ queueUrl, maxMessages = 10, waitTimeSeconds = 20, visibilityTimeout = 30 }) {
  const command = new ReceiveMessageCommand({
    QueueUrl: queueUrl,
    MaxNumberOfMessages: Math.min(maxMessages, 10),
    WaitTimeSeconds: waitTimeSeconds,
    VisibilityTimeout: visibilityTimeout,
    MessageAttributeNames: ['All'],
    AttributeNames: ['All'],
  });

  const result = await sqsClient.send(command);
  const messages = result.Messages || [];

  if (messages.length > 0) {
    logger.info('SQS messages received', { queueUrl, count: messages.length });
  }

  return messages.map((msg) => ({
    messageId: msg.MessageId,
    receiptHandle: msg.ReceiptHandle,
    body: (() => { try { return JSON.parse(msg.Body); } catch { return msg.Body; } })(),
    attributes: msg.Attributes,
    messageAttributes: msg.MessageAttributes,
  }));
}

/**
 * Delete a processed message from the queue
 * @param {{ queueUrl: string, receiptHandle: string }} params
 */
async function deleteMessage({ queueUrl, receiptHandle }) {
  await sqsClient.send(new DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: receiptHandle }));
  logger.debug('SQS message deleted', { queueUrl });
}

/**
 * Send multiple messages in a batch (max 10 per call)
 * @param {{ queueUrl: string, messages: Array<{ id: string, body: object | string, delaySeconds?: number }> }} params
 */
async function sendMessageBatch({ queueUrl, messages }) {
  const entries = messages.map((m) => ({
    Id: m.id || String(Math.random()),
    MessageBody: typeof m.body === 'string' ? m.body : JSON.stringify(m.body),
    DelaySeconds: m.delaySeconds || 0,
  }));

  const result = await sqsClient.send(new SendMessageBatchCommand({ QueueUrl: queueUrl, Entries: entries }));

  if (result.Failed?.length > 0) {
    logger.error('SQS batch send partial failure', { failed: result.Failed });
  }

  logger.info('SQS batch sent', { count: messages.length, failed: result.Failed?.length || 0 });
  return result;
}

/**
 * Create an SQS queue (standard or FIFO)
 * @param {string} name
 * @param {{ fifo?: boolean, visibilityTimeout?: number, messageRetentionPeriod?: number }} attributes
 * @returns {Promise<string>} QueueUrl
 */
async function createQueue(name, { fifo = false, visibilityTimeout = 30, messageRetentionPeriod = 86400 } = {}) {
  const queueName = fifo ? `${name}.fifo` : name;
  const attrs = {
    VisibilityTimeout: String(visibilityTimeout),
    MessageRetentionPeriod: String(messageRetentionPeriod),
  };
  if (fifo) {
    attrs.FifoQueue = 'true';
    attrs.ContentBasedDeduplication = 'true';
  }

  const result = await sqsClient.send(new CreateQueueCommand({ QueueName: queueName, Attributes: attrs }));
  logger.info('SQS queue created', { name: queueName, url: result.QueueUrl });
  return result.QueueUrl;
}

/**
 * Get queue URL by name
 * @param {string} name
 * @returns {Promise<string>}
 */
async function getQueueUrl(name) {
  const result = await sqsClient.send(new GetQueueUrlCommand({ QueueName: name }));
  return result.QueueUrl;
}

/**
 * Get queue attributes (message counts, ARN, etc.)
 * @param {string} queueUrl
 */
async function getQueueAttributes(queueUrl) {
  const result = await sqsClient.send(new GetQueueAttributesCommand({
    QueueUrl: queueUrl,
    AttributeNames: ['All'],
  }));
  return result.Attributes;
}

// ─── Domain Helpers ───────────────────────────────────────────────────────────

async function enqueueNotification(notification) {
  return sendMessage({ queueUrl: NOTIFICATION_QUEUE, messageBody: notification, messageAttributes: { type: notification.type } });
}

async function enqueueEvent(event) {
  return sendMessage({
    queueUrl: EVENTS_QUEUE,
    messageBody: event,
    messageGroupId: event.source || 'default',
    messageDeduplicationId: `${event.type}-${Date.now()}`,
  });
}

module.exports = {
  sendMessage,
  receiveMessages,
  deleteMessage,
  sendMessageBatch,
  createQueue,
  getQueueUrl,
  getQueueAttributes,
  enqueueNotification,
  enqueueEvent,
  NOTIFICATION_QUEUE,
  EVENTS_QUEUE,
};
