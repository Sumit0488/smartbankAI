'use strict';

/**
 * src/utils/notification.js
 * Local notification dispatcher using nodemailer (SMTP).
 * SMS and topic publishing are logged only — no external service required.
 */

const nodemailer = require('nodemailer');
const { createLogger } = require('./logger');

const logger = createLogger('utils:notification');

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@smartbankai.com';

// ─── SMTP Transport ───────────────────────────────────────────────────────────

function createTransport() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

// ─── Email Templates ──────────────────────────────────────────────────────────

function welcomeEmailHTML(name) {
  return `
  <html><body style="font-family:Arial,sans-serif;background:#f4f6fb;padding:40px 0">
  <div style="max-width:520px;margin:auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 2px 16px rgba(0,0,0,.08)">
    <h1 style="color:#2563eb;margin-bottom:8px">Welcome to SmartBankAI 🎉</h1>
    <p style="color:#374151;font-size:16px">Hi <strong>${name}</strong>,</p>
    <p style="color:#6b7280">Your account has been created successfully. You can now access all SmartBankAI features:</p>
    <ul style="color:#6b7280"><li>AI-powered loan recommendations</li><li>Investment portfolio tracking</li><li>Forex transfer management</li><li>Expense analysis</li></ul>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard"
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

function loanSubmittedEmailHTML(name, loanAmount) {
  return `
  <html><body style="font-family:Arial,sans-serif;background:#f4f6fb;padding:40px 0">
  <div style="max-width:520px;margin:auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 2px 16px rgba(0,0,0,.08)">
    <h1 style="color:#2563eb">SmartBank AI Loan Application Received</h1>
    <p>Hello <strong>${name}</strong>,</p>
    <p>Your loan application has been received successfully.</p>
    <div style="background:#eff6ff;border-radius:8px;padding:20px;margin:24px 0">
      <p style="margin:0;font-size:18px"><strong>Loan Amount: ₹${Number(loanAmount).toLocaleString('en-IN')}</strong></p>
    </div>
    <p style="color:#6b7280">Our team will review your request shortly.</p>
    <p style="margin-top:32px;color:#9ca3af;font-size:12px">© ${new Date().getFullYear()} SmartBank AI</p>
  </div></body></html>`;
}

function investmentConfirmEmailHTML(name, amount) {
  return `
  <html><body style="font-family:Arial,sans-serif;background:#f4f6fb;padding:40px 0">
  <div style="max-width:520px;margin:auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 2px 16px rgba(0,0,0,.08)">
    <h1 style="color:#16a34a">SmartBank AI Investment Confirmation</h1>
    <p>Hello <strong>${name}</strong>,</p>
    <p>Your investment has been created successfully.</p>
    <div style="background:#f0fdf4;border-radius:8px;padding:20px;margin:24px 0">
      <p style="margin:0;font-size:18px"><strong>Amount: ₹${Number(amount).toLocaleString('en-IN')}</strong></p>
    </div>
    <p style="color:#6b7280">Your portfolio has been updated. Keep investing to grow your wealth!</p>
    <p style="margin-top:32px;color:#9ca3af;font-size:12px">© ${new Date().getFullYear()} SmartBank AI</p>
  </div></body></html>`;
}

// ─── Core Dispatchers ─────────────────────────────────────────────────────────

/**
 * Send an email via nodemailer SMTP
 * @param {{ to: string, subject: string, htmlBody: string, textBody?: string }} params
 * @returns {Promise<void>}
 */
async function sendEmail({ to, subject, htmlBody, textBody }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    logger.warn(`GMAIL_USER or GMAIL_APP_PASSWORD not set — skipping email to ${to} (${subject})`);
    return;
  }

  const transporter = createTransport();

  try {
    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject,
      html: htmlBody,
      ...(textBody ? { text: textBody } : {}),
    });
    logger.info('Email sent', { to, subject, messageId: info.messageId });
  } catch (err) {
    logger.error('Failed to send email', { to, subject, error: err.message });
    throw err;
  }
}

/**
 * Send an SMS — logs only in local mode (no real SMS service)
 * @param {{ phone: string, message: string }} params
 * @returns {Promise<void>}
 */
async function sendSMS({ phone, message }) {
  logger.info('SMS (local mode — not sent)', {
    phone: phone ? phone.slice(0, -4) + '****' : 'unknown',
    message,
  });
}

/**
 * Publish a message to a topic — logs only in local mode
 * @param {{ subject: string, message: string }} params
 * @returns {Promise<void>}
 */
async function publishToTopic({ subject, message }) {
  logger.info('Topic notification (local mode — not sent)', { subject, message });
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

async function sendLoanSubmittedEmail(user, loanAmount) {
  await sendEmail({
    to: user.email,
    subject: 'SmartBank AI Loan Application Received',
    htmlBody: loanSubmittedEmailHTML(user.name, loanAmount),
    textBody: `Hello ${user.name},\n\nYour loan application has been received successfully.\n\nLoan Amount: ₹${Number(loanAmount).toLocaleString('en-IN')}\n\nOur team will review your request shortly.\n\nSmartBank AI`,
  });
}

async function sendInvestmentConfirmEmail(user, amount) {
  await sendEmail({
    to: user.email,
    subject: 'SmartBank AI Investment Confirmation',
    htmlBody: investmentConfirmEmailHTML(user.name, amount),
    textBody: `Hello ${user.name},\n\nYour investment has been created successfully.\n\nAmount: ₹${Number(amount).toLocaleString('en-IN')}\n\nSmartBank AI`,
  });
}

module.exports = {
  sendEmail,
  sendSMS,
  publishToTopic,
  sendWelcomeEmail,
  sendLoanSubmittedEmail,
  sendInvestmentConfirmEmail,
  sendLoanApprovedNotification,
  sendLoanRejectedNotification,
};
