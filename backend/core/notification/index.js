'use strict';

/**
 * core/notification/index.js
 * Centralized notification dispatcher — routes events to AWS SES (email)
 * and AWS SNS (SMS). Used by Lambda functions to trigger user-facing notifications.
 */

const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { createLogger } = require('../logger');

const logger = createLogger('core:notification');

const AWS_REGION   = process.env.AWS_REGION    || 'ap-south-1';
const FROM_EMAIL   = process.env.SES_FROM_EMAIL || 'noreply@smartbankai.com';
const SNS_TOPIC    = process.env.SNS_TOPIC_ARN  || '';

const sesClient = new SESClient({ region: AWS_REGION });
const snsClient = new SNSClient({ region: AWS_REGION });

// ─── Email Templates ──────────────────────────────────────────────────────────

function welcomeEmailHTML(name) {
  return `
  <html><body style="font-family:Arial,sans-serif;background:#f4f6fb;padding:40px 0">
  <div style="max-width:520px;margin:auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 2px 16px rgba(0,0,0,.08)">
    <h1 style="color:#2563eb;margin-bottom:8px">Welcome to SmartBankAI 🎉</h1>
    <p style="color:#374151;font-size:16px">Hi <strong>${name}</strong>,</p>
    <p style="color:#6b7280">Your account has been created successfully. You can now access all SmartBankAI features:</p>
    <ul style="color:#6b7280"><li>AI-powered loan recommendations</li><li>Investment portfolio tracking</li><li>Forex transfer management</li><li>Expense analysis</li></ul>
    <a href="${process.env.FRONTEND_URL || 'https://smartbankai.com'}/dashboard"
       style="display:inline-block;margin-top:24px;padding:12px 28px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
       Go to Dashboard →
    </a>
    <p style="margin-top:32px;color:#9ca3af;font-size:12px">© ${new Date().getFullYear()} SmartBankAI. All rights reserved.</p>
  </div></body></html>`;
}

function loanApprovedEmailHTML(name, loanType, loanAmount, emi, bankName) {
  return `
  <html><body style="font-family:Arial,sans-serif;background:#f4f6fb;padding:40px 0">
  <div style="max-width:520px;margin:auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 2px 16px rgba(0,0,0,.08)">
    <h1 style="color:#16a34a">Loan Approved ✅</h1>
    <p>Hi <strong>${name}</strong>,</p>
    <p>Your <strong>${loanType}</strong> loan has been approved!</p>
    <table style="width:100%;border-collapse:collapse;margin:24px 0">
      <tr style="background:#f0fdf4"><td style="padding:10px;border:1px solid #d1fae5"><strong>Loan Amount</strong></td><td style="padding:10px;border:1px solid #d1fae5">₹${Number(loanAmount).toLocaleString('en-IN')}</td></tr>
      <tr><td style="padding:10px;border:1px solid #d1fae5"><strong>Monthly EMI</strong></td><td style="padding:10px;border:1px solid #d1fae5">₹${Number(emi).toLocaleString('en-IN')}</td></tr>
      <tr style="background:#f0fdf4"><td style="padding:10px;border:1px solid #d1fae5"><strong>Bank</strong></td><td style="padding:10px;border:1px solid #d1fae5">${bankName}</td></tr>
    </table>
    <p style="color:#9ca3af;font-size:12px">© ${new Date().getFullYear()} SmartBankAI</p>
  </div></body></html>`;
}

function loanRejectedEmailHTML(name, loanType, reason) {
  return `
  <html><body style="font-family:Arial,sans-serif;background:#f4f6fb;padding:40px 0">
  <div style="max-width:520px;margin:auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 2px 16px rgba(0,0,0,.08)">
    <h1 style="color:#dc2626">Loan Application Update</h1>
    <p>Hi <strong>${name}</strong>,</p>
    <p>We regret to inform you that your <strong>${loanType}</strong> loan application could not be approved at this time.</p>
    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
    <p>You may reapply after 30 days or contact support for assistance.</p>
    <p style="color:#9ca3af;font-size:12px">© ${new Date().getFullYear()} SmartBankAI</p>
  </div></body></html>`;
}

// ─── Core Dispatchers ─────────────────────────────────────────────────────────

/**
 * Send an email via AWS SES
 * @param {{ to: string, subject: string, htmlBody: string, textBody?: string }} params
 * @returns {Promise<void>}
 */
async function sendEmail({ to, subject, htmlBody, textBody }) {
  // Skip AWS SES in local dev when credentials are not configured
  if (!process.env.AWS_ACCESS_KEY_ID) {
    logger.warn('AWS not configured — skipping email', { to, subject });
    return;
  }
  const command = new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: {
        Html: { Data: htmlBody, Charset: 'UTF-8' },
        ...(textBody ? { Text: { Data: textBody, Charset: 'UTF-8' } } : {}),
      },
    },
  });

  try {
    const result = await sesClient.send(command);
    logger.info('Email sent', { to, subject, messageId: result.MessageId });
  } catch (err) {
    logger.error('Failed to send email', { to, subject, error: err.message });
    throw err;
  }
}

/**
 * Send an SMS via AWS SNS
 * @param {{ phone: string, message: string }} params
 * @returns {Promise<void>}
 */
async function sendSMS({ phone, message }) {
  if (!process.env.AWS_ACCESS_KEY_ID) {
    logger.warn('AWS not configured — skipping SMS', { phone: phone.slice(0, -4) + '****' });
    return;
  }
  const command = new PublishCommand({
    PhoneNumber: phone,
    Message: message,
    MessageAttributes: {
      'AWS.SNS.SMS.SenderID': { DataType: 'String', StringValue: 'SmartBank' },
      'AWS.SNS.SMS.SMSType': { DataType: 'String', StringValue: 'Transactional' },
    },
  });

  try {
    const result = await snsClient.send(command);
    logger.info('SMS sent', { phone: phone.slice(0, -4) + '****', messageId: result.MessageId });
  } catch (err) {
    logger.error('Failed to send SMS', { phone: phone.slice(0, -4) + '****', error: err.message });
    throw err;
  }
}

/**
 * Publish a message to an SNS topic
 * @param {{ topicArn?: string, subject: string, message: string }} params
 * @returns {Promise<void>}
 */
async function publishToTopic({ topicArn, subject, message }) {
  const command = new PublishCommand({
    TopicArn: topicArn || SNS_TOPIC,
    Subject: subject,
    Message: message,
  });
  try {
    await snsClient.send(command);
    logger.info('SNS topic notification sent', { subject });
  } catch (err) {
    logger.error('Failed to publish to SNS topic', { error: err.message });
    throw err;
  }
}

// ─── High-Level Notification Helpers ─────────────────────────────────────────

/**
 * Send welcome email to a newly created user
 * @param {{ name: string, email: string }} user
 */
async function sendWelcomeEmail(user) {
  await sendEmail({
    to: user.email,
    subject: 'Welcome to SmartBankAI!',
    htmlBody: welcomeEmailHTML(user.name),
    textBody: `Welcome to SmartBankAI, ${user.name}! Your account has been created.`,
  });
}

/**
 * Send loan approval email + SMS
 * @param {{ loanType: string, loanAmount: number, emi: number, bankName: string }} loan
 * @param {{ name: string, email: string, phone?: string }} user
 */
async function sendLoanApprovedNotification(loan, user) {
  const promises = [
    sendEmail({
      to: user.email,
      subject: `Your ${loan.loanType} Loan is Approved!`,
      htmlBody: loanApprovedEmailHTML(user.name, loan.loanType, loan.loanAmount, loan.emi, loan.bankName || 'N/A'),
    }),
  ];

  if (user.phone) {
    promises.push(
      sendSMS({
        phone: user.phone,
        message: `SmartBankAI: Your ${loan.loanType} loan of ₹${loan.loanAmount} is APPROVED! EMI: ₹${loan.emi}/month.`,
      })
    );
  }

  await Promise.allSettled(promises);
}

/**
 * Send loan rejection notification
 * @param {{ loanType: string, notes?: string }} loan
 * @param {{ name: string, email: string, phone?: string }} user
 */
async function sendLoanRejectedNotification(loan, user) {
  const promises = [
    sendEmail({
      to: user.email,
      subject: `Update on your ${loan.loanType} Loan Application`,
      htmlBody: loanRejectedEmailHTML(user.name, loan.loanType, loan.notes),
    }),
  ];

  if (user.phone) {
    promises.push(
      sendSMS({
        phone: user.phone,
        message: `SmartBankAI: Your ${loan.loanType} loan application was not approved. Please contact support for details.`,
      })
    );
  }

  await Promise.allSettled(promises);
}

module.exports = {
  sendEmail,
  sendSMS,
  publishToTopic,
  sendWelcomeEmail,
  sendLoanApprovedNotification,
  sendLoanRejectedNotification,
};
