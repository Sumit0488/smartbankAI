/**
 * backend/src/shared/notification.js
 * Nodemailer Gmail SMTP notification service.
 * 
 * Setup: 
 *   1. Enable 2FA on your Google account.
 *   2. Go to Google Account → Security → App Passwords → Generate one for "Mail".
 *   3. Set GMAIL_USER and GMAIL_APP_PASSWORD in backend/.env
 */

const nodemailer = require('nodemailer');

// ── Transport ─────────────────────────────────────────────────────────────────

const createTransport = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

// ── Base Send Function ────────────────────────────────────────────────────────

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('[Notification] Gmail credentials not configured. Email skipped.');
    return { skipped: true };
  }

  const transporter = createTransport();
  const info = await transporter.sendMail({
    from: `"SmartBank AI" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });

  console.log(`[Notification] Email sent: ${info.messageId}`);
  return info;
};

// ── Event-Based Notifications ─────────────────────────────────────────────────

/**
 * LoanApplied — sent when user submits a loan application.
 */
const sendLoanAlert = async ({ to, name, loanType, amount }) => {
  return sendEmail({
    to,
    subject: `SmartBank AI — Loan Application Received`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
        <h2 style="color:#4f46e5;">Loan Application Received ✅</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>We have received your <strong>${loanType}</strong> application for 
           <strong>₹${Number(amount).toLocaleString('en-IN')}</strong>.</p>
        <p>Our team will review your application and contact you within 2-3 business days.</p>
        <hr/>
        <p style="color:#64748b;font-size:12px;">SmartBank AI — Powered by AI, Built for You.</p>
      </div>
    `,
  });
};

/**
 * ExpenseAdded — sent when an expense record is created.
 */
const sendExpenseAlert = async ({ to, name, category, amount }) => {
  return sendEmail({
    to,
    subject: `SmartBank AI — Expense Alert`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
        <h2 style="color:#f59e0b;">Expense Recorded 💰</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>An expense of <strong>₹${Number(amount).toLocaleString('en-IN')}</strong> 
           has been recorded under <strong>${category}</strong>.</p>
        <p>Visit your SmartBank dashboard to review your spending insights.</p>
        <hr/>
        <p style="color:#64748b;font-size:12px;">SmartBank AI — Powered by AI, Built for You.</p>
      </div>
    `,
  });
};

/**
 * ForexTransferCompleted — sent when a forex transfer is completed.
 */
const sendForexConfirmation = async ({ to, name, fromAmount, fromCurrency, toAmount, toCurrency }) => {
  return sendEmail({
    to,
    subject: `SmartBank AI — Forex Transfer Confirmed`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
        <h2 style="color:#10b981;">Forex Transfer Confirmed 🌐</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your transfer of <strong>${fromAmount} ${fromCurrency}</strong> → 
           <strong>${toAmount} ${toCurrency}</strong> has been successfully processed.</p>
        <p>Transaction details are available on your SmartBank dashboard.</p>
        <hr/>
        <p style="color:#64748b;font-size:12px;">SmartBank AI — Powered by AI, Built for You.</p>
      </div>
    `,
  });
};

/**
 * SystemNotification — generic system alert to user.
 */
const sendSystemNotification = async ({ to, name, title, message }) => {
  return sendEmail({
    to,
    subject: `SmartBank AI — ${title}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
        <h2 style="color:#6366f1;">${title}</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>${message}</p>
        <hr/>
        <p style="color:#64748b;font-size:12px;">SmartBank AI — Powered by AI, Built for You.</p>
      </div>
    `,
  });
};

module.exports = {
  sendEmail,
  sendLoanAlert,
  sendExpenseAlert,
  sendForexConfirmation,
  sendSystemNotification,
};
