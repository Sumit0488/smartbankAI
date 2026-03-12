'use strict';

/**
 * services/notification/emailService.js
 * AWS SES email service — send transactional emails and manage templates.
 */

const {
  SESClient,
  SendEmailCommand,
  SendTemplatedEmailCommand,
  SendBulkTemplatedEmailCommand,
  CreateTemplateCommand,
  UpdateTemplateCommand,
  VerifyEmailIdentityCommand,
} = require('@aws-sdk/client-ses');

const { createLogger } = require('../../core/logger');

const logger = createLogger('services:notification:email');

const REGION     = process.env.AWS_REGION    || 'ap-south-1';
const FROM_EMAIL = process.env.SES_FROM_EMAIL || 'noreply@smartbankai.com';
const FROM_NAME  = process.env.SES_FROM_NAME  || 'SmartBankAI';

const sesClient = new SESClient({ region: REGION });

// ─── HTML Templates ───────────────────────────────────────────────────────────

const TEMPLATES = {
  welcome: (data) => ({
    subject: `Welcome to SmartBankAI, ${data.name}!`,
    html: `<html><body style="font-family:Arial,sans-serif;background:#f4f6fb;padding:40px 0">
    <div style="max-width:520px;margin:auto;background:#fff;border-radius:12px;padding:40px">
      <h1 style="color:#2563eb">Welcome, ${data.name}! 🎉</h1>
      <p>Your SmartBankAI account is ready. Start exploring:</p>
      <ul><li>AI-powered loan recommendations</li><li>Investment portfolio tracking</li><li>Forex transfer management</li></ul>
      <a href="${data.dashboardUrl || '#'}" style="display:inline-block;margin-top:24px;padding:12px 28px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Go to Dashboard →</a>
    </div></body></html>`,
    text: `Welcome to SmartBankAI, ${data.name}! Your account is ready.`,
  }),

  loanApproved: (data) => ({
    subject: `Your ${data.loanType} Loan is Approved! ✅`,
    html: `<html><body style="font-family:Arial,sans-serif;background:#f4f6fb;padding:40px 0">
    <div style="max-width:520px;margin:auto;background:#fff;border-radius:12px;padding:40px">
      <h1 style="color:#16a34a">Loan Approved ✅</h1>
      <p>Hi <strong>${data.name}</strong>, your ${data.loanType} loan has been approved!</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>Amount</strong></td><td style="padding:8px;border:1px solid #e5e7eb">₹${Number(data.amount).toLocaleString('en-IN')}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>EMI</strong></td><td style="padding:8px;border:1px solid #e5e7eb">₹${Number(data.emi).toLocaleString('en-IN')}/month</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>Bank</strong></td><td style="padding:8px;border:1px solid #e5e7eb">${data.bankName}</td></tr>
      </table>
    </div></body></html>`,
    text: `Hi ${data.name}, your ${data.loanType} loan of ₹${data.amount} is approved! EMI: ₹${data.emi}/month.`,
  }),

  loanRejected: (data) => ({
    subject: `Update on your ${data.loanType} Loan Application`,
    html: `<html><body style="font-family:Arial,sans-serif;background:#f4f6fb;padding:40px 0">
    <div style="max-width:520px;margin:auto;background:#fff;border-radius:12px;padding:40px">
      <h1 style="color:#dc2626">Loan Update</h1>
      <p>Hi <strong>${data.name}</strong>,</p>
      <p>Your ${data.loanType} loan application was not approved at this time.</p>
      ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
      <p>You may reapply after 30 days. Contact <a href="mailto:support@smartbankai.com">support</a> for help.</p>
    </div></body></html>`,
    text: `Hi ${data.name}, your ${data.loanType} loan was not approved. ${data.reason || ''}`,
  }),

  investmentCreated: (data) => ({
    subject: `Investment of ₹${data.amount} Created Successfully`,
    html: `<html><body style="font-family:Arial,sans-serif;background:#f4f6fb;padding:40px 0">
    <div style="max-width:520px;margin:auto;background:#fff;border-radius:12px;padding:40px">
      <h1 style="color:#2563eb">Investment Confirmed 📈</h1>
      <p>Hi <strong>${data.name}</strong>, your investment has been recorded.</p>
      <p><strong>Type:</strong> ${data.type} | <strong>Amount:</strong> ₹${Number(data.amount).toLocaleString('en-IN')}</p>
    </div></body></html>`,
    text: `Hi ${data.name}, your ${data.type} investment of ₹${data.amount} has been created.`,
  }),
};

// ─── Core Send Functions ──────────────────────────────────────────────────────

/**
 * Send a plain or HTML email via SES
 * @param {{ to: string | string[], subject: string, htmlBody: string, textBody?: string }} params
 */
async function sendRawEmail({ to, subject, htmlBody, textBody }) {
  const toAddresses = Array.isArray(to) ? to : [to];

  const command = new SendEmailCommand({
    Source: `${FROM_NAME} <${FROM_EMAIL}>`,
    Destination: { ToAddresses: toAddresses },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: {
        Html: { Data: htmlBody, Charset: 'UTF-8' },
        ...(textBody ? { Text: { Data: textBody, Charset: 'UTF-8' } } : {}),
      },
    },
  });

  const result = await sesClient.send(command);
  logger.info('SES email sent', { to: toAddresses, subject, messageId: result.MessageId });
  return result;
}

/**
 * Send using a named SES template (must be pre-created in SES)
 * @param {{ to: string, templateName: string, templateData: object }} params
 */
async function sendTemplatedEmail({ to, templateName, templateData }) {
  const command = new SendTemplatedEmailCommand({
    Source: `${FROM_NAME} <${FROM_EMAIL}>`,
    Destination: { ToAddresses: [to] },
    Template: templateName,
    TemplateData: JSON.stringify(templateData),
  });
  const result = await sesClient.send(command);
  logger.info('SES templated email sent', { to, templateName, messageId: result.MessageId });
  return result;
}

/**
 * Bulk send templated emails (up to 50 per API call)
 * @param {{ destinations: Array<{ to: string, templateData: object }>, templateName: string }} params
 */
async function sendBulkTemplatedEmail({ destinations, templateName }) {
  const command = new SendBulkTemplatedEmailCommand({
    Source: `${FROM_NAME} <${FROM_EMAIL}>`,
    Template: templateName,
    Destinations: destinations.map((d) => ({
      Destination: { ToAddresses: [d.to] },
      ReplacementTemplateData: JSON.stringify(d.templateData),
    })),
    DefaultTemplateData: JSON.stringify({}),
  });
  const result = await sesClient.send(command);
  logger.info('SES bulk email sent', { count: destinations.length, templateName });
  return result;
}

/**
 * Create or update an SES email template
 * @param {{ name: string, subject: string, htmlPart: string, textPart?: string }} params
 */
async function createEmailTemplate({ name, subject, htmlPart, textPart = '' }) {
  const template = { TemplateName: name, SubjectPart: subject, HtmlPart: htmlPart, TextPart: textPart };
  try {
    await sesClient.send(new CreateTemplateCommand({ Template: template }));
    logger.info('SES template created', { name });
  } catch (err) {
    if (err.name === 'AlreadyExistsException') {
      await sesClient.send(new UpdateTemplateCommand({ Template: template }));
      logger.info('SES template updated', { name });
    } else throw err;
  }
}

/**
 * Verify an email identity for SES sending
 * @param {string} email
 */
async function verifyEmailIdentity(email) {
  await sesClient.send(new VerifyEmailIdentityCommand({ EmailAddress: email }));
  logger.info('SES email identity verification sent', { email });
}

// ─── High-Level Helpers ───────────────────────────────────────────────────────

async function sendWelcomeEmail({ email, name }) {
  const tpl = TEMPLATES.welcome({ name });
  return sendRawEmail({ to: email, subject: tpl.subject, htmlBody: tpl.html, textBody: tpl.text });
}

async function sendLoanApprovedEmail({ email, name, loanType, amount, emi, bankName }) {
  const tpl = TEMPLATES.loanApproved({ name, loanType, amount, emi, bankName });
  return sendRawEmail({ to: email, subject: tpl.subject, htmlBody: tpl.html, textBody: tpl.text });
}

async function sendLoanRejectedEmail({ email, name, loanType, reason }) {
  const tpl = TEMPLATES.loanRejected({ name, loanType, reason });
  return sendRawEmail({ to: email, subject: tpl.subject, htmlBody: tpl.html, textBody: tpl.text });
}

async function sendInvestmentCreatedEmail({ email, name, type, amount }) {
  const tpl = TEMPLATES.investmentCreated({ name, type, amount });
  return sendRawEmail({ to: email, subject: tpl.subject, htmlBody: tpl.html, textBody: tpl.text });
}

module.exports = {
  sendRawEmail,
  sendTemplatedEmail,
  sendBulkTemplatedEmail,
  createEmailTemplate,
  verifyEmailIdentity,
  sendWelcomeEmail,
  sendLoanApprovedEmail,
  sendLoanRejectedEmail,
  sendInvestmentCreatedEmail,
};
