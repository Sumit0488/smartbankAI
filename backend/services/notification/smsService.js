'use strict';

/**
 * services/notification/smsService.js
 * AWS SNS SMS service — transactional SMS delivery and topic management.
 */

const {
  SNSClient,
  PublishCommand,
  CreateTopicCommand,
  SubscribeCommand,
  ListSubscriptionsByTopicCommand,
  UnsubscribeCommand,
} = require('@aws-sdk/client-sns');

const { createLogger } = require('../../core/logger');

const logger = createLogger('services:notification:sms');

const REGION    = process.env.AWS_REGION     || 'ap-south-1';
const SNS_TOPIC = process.env.SNS_TOPIC_ARN  || '';

const snsClient = new SNSClient({ region: REGION });

// ─── SMS Message Templates ────────────────────────────────────────────────────
const SMS_TEMPLATES = {
  welcome:          (name) => `SmartBankAI: Hi ${name}, your account is active! Start managing your finances now.`,
  loanApproved:     (name, type, amount, emi) => `SmartBankAI: Hi ${name}, your ${type} loan of Rs.${amount} is APPROVED! EMI: Rs.${emi}/month.`,
  loanRejected:     (name, type) => `SmartBankAI: Hi ${name}, your ${type} loan application was not approved. Contact support@smartbankai.com.`,
  investmentCreated:(name, type, amount) => `SmartBankAI: Hi ${name}, investment of Rs.${amount} in ${type} recorded. Check your portfolio.`,
  otp:              (otp) => `SmartBankAI: Your OTP is ${otp}. Valid for 10 minutes. Do not share with anyone.`,
};

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Send a direct SMS to a phone number
 * @param {{ phone: string, message: string, senderId?: string }} params
 * @returns {Promise<object>} SNS publish result
 */
async function sendSMS({ phone, message, senderId = 'SmartBank' }) {
  const command = new PublishCommand({
    PhoneNumber: phone,
    Message: message,
    MessageAttributes: {
      'AWS.SNS.SMS.SenderID': { DataType: 'String', StringValue: senderId },
      'AWS.SNS.SMS.SMSType':  { DataType: 'String', StringValue: 'Transactional' },
    },
  });

  try {
    const result = await snsClient.send(command);
    logger.info('SMS sent', { phone: phone.slice(0, -4) + '****', messageId: result.MessageId });
    return result;
  } catch (err) {
    logger.error('Failed to send SMS', { phone: phone.slice(0, -4) + '****', error: err.message });
    throw err;
  }
}

/**
 * Publish a notification message to an SNS topic
 * @param {{ topicArn?: string, message: string, subject?: string }} params
 */
async function publishToTopic({ topicArn, message, subject = 'SmartBankAI Notification' }) {
  const command = new PublishCommand({
    TopicArn: topicArn || SNS_TOPIC,
    Message: message,
    Subject: subject,
  });

  try {
    const result = await snsClient.send(command);
    logger.info('SNS topic message published', { subject, messageId: result.MessageId });
    return result;
  } catch (err) {
    logger.error('Failed to publish SNS topic message', { subject, error: err.message });
    throw err;
  }
}

/**
 * Create an SNS topic
 * @param {string} name - Topic name
 * @param {boolean} [fifo] - Create a FIFO topic
 * @returns {Promise<string>} TopicArn
 */
async function createTopic(name, fifo = false) {
  const topicName = fifo ? `${name}.fifo` : name;
  const command = new CreateTopicCommand({
    Name: topicName,
    ...(fifo ? { Attributes: { FifoTopic: 'true' } } : {}),
  });
  const result = await snsClient.send(command);
  logger.info('SNS topic created', { name: topicName, arn: result.TopicArn });
  return result.TopicArn;
}

/**
 * Subscribe an email address to an SNS topic
 * @param {{ topicArn: string, email: string }} params
 * @returns {Promise<string>} Subscription ARN
 */
async function subscribeEmail({ topicArn, email }) {
  const command = new SubscribeCommand({
    TopicArn: topicArn,
    Protocol: 'email',
    Endpoint: email,
  });
  const result = await snsClient.send(command);
  logger.info('Email subscribed to SNS topic', { email, topicArn });
  return result.SubscriptionArn;
}

/**
 * Subscribe a phone number (SMS) to an SNS topic
 * @param {{ topicArn: string, phone: string }} params
 * @returns {Promise<string>} Subscription ARN
 */
async function subscribePhone({ topicArn, phone }) {
  const command = new SubscribeCommand({
    TopicArn: topicArn,
    Protocol: 'sms',
    Endpoint: phone,
  });
  const result = await snsClient.send(command);
  logger.info('Phone subscribed to SNS topic', { phone: phone.slice(0, -4) + '****' });
  return result.SubscriptionArn;
}

/**
 * List all subscriptions for a topic
 * @param {string} topicArn
 */
async function listSubscriptions(topicArn) {
  const result = await snsClient.send(new ListSubscriptionsByTopicCommand({ TopicArn: topicArn }));
  return result.Subscriptions || [];
}

/**
 * Unsubscribe from a topic
 * @param {string} subscriptionArn
 */
async function unsubscribe(subscriptionArn) {
  await snsClient.send(new UnsubscribeCommand({ SubscriptionArn: subscriptionArn }));
  logger.info('Unsubscribed from SNS topic', { subscriptionArn });
}

// ─── High-Level Helpers ───────────────────────────────────────────────────────

async function sendWelcomeSMS({ phone, name }) {
  return sendSMS({ phone, message: SMS_TEMPLATES.welcome(name) });
}

async function sendLoanApprovedSMS({ phone, name, loanType, amount, emi }) {
  return sendSMS({ phone, message: SMS_TEMPLATES.loanApproved(name, loanType, amount, emi) });
}

async function sendLoanRejectedSMS({ phone, name, loanType }) {
  return sendSMS({ phone, message: SMS_TEMPLATES.loanRejected(name, loanType) });
}

async function sendOTP({ phone, otp }) {
  return sendSMS({ phone, message: SMS_TEMPLATES.otp(otp) });
}

module.exports = {
  sendSMS,
  publishToTopic,
  createTopic,
  subscribeEmail,
  subscribePhone,
  listSubscriptions,
  unsubscribe,
  sendWelcomeSMS,
  sendLoanApprovedSMS,
  sendLoanRejectedSMS,
  sendOTP,
  SMS_TEMPLATES,
};
