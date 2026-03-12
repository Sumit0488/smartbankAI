/**
 * notification.service.js — Email notification service using Nodemailer + Gmail SMTP
 * SmartBank AI Backend
 */

const nodemailer = require('nodemailer');
const User = require('../user-management/user.model');
const Loan = require('../loan-management/loan.model');

// ── Transporter ───────────────────────────────────────────────────────────────

const createTransporter = () => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('Gmail SMTP credentials not configured in .env (GMAIL_USER, GMAIL_APP_PASSWORD)');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

// ── Service Methods ───────────────────────────────────────────────────────────

/**
 * Send a raw email to any address.
 */
const sendEmail = async ({ to, subject, body }) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"SmartBank AI" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🏦 SmartBank AI</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 8px 8px;">
            ${body}
          </div>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 10px;">
            SmartBank AI — Your intelligent financial companion
          </p>
        </div>
      `,
    });
    return { success: true, message: `Email sent successfully to ${to}` };
  } catch (err) {
    console.error('[Notification] Email send failed:', err.message);
    return { success: false, message: `Failed to send email: ${err.message}` };
  }
};

/**
 * Send welcome email to a newly registered user.
 */
const sendWelcomeEmail = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error(`User ${userId} not found`);

  const body = `
    <h2 style="color: #667eea;">Welcome to SmartBank AI, ${user.name}! 🎉</h2>
    <p>Your account has been created successfully.</p>
    <ul>
      <li>📊 Track your expenses with AI insights</li>
      <li>💰 Compare banks and credit cards</li>
      <li>🌍 Send money internationally with live rates</li>
      <li>📈 Get personalized investment advice</li>
    </ul>
    <p>Login at <a href="http://localhost:5173">SmartBank AI</a> to get started.</p>
  `;

  return sendEmail({ to: user.email, subject: '🏦 Welcome to SmartBank AI!', body });
};

/**
 * Send loan approval notification email.
 */
const sendLoanApprovalEmail = async (loanId) => {
  const loan = await Loan.findById(loanId);
  if (!loan) throw new Error(`Loan ${loanId} not found`);

  const user = await User.findOne({ user_id: loan.user_id }) || await User.findById(loan.user_id);
  if (!user) throw new Error('User for loan not found');

  const body = `
    <h2 style="color: #48bb78;">Your Loan Has Been Approved! ✅</h2>
    <p>Dear <strong>${user.name}</strong>,</p>
    <p>Your loan application has been <strong style="color: #48bb78;">approved</strong>.</p>
    <table style="width:100%; border-collapse: collapse; margin-top: 15px;">
      <tr style="background: #edf2f7;"><td style="padding: 8px;">Loan Type</td><td style="padding: 8px;"><strong>${loan.loan_type}</strong></td></tr>
      <tr><td style="padding: 8px;">Amount</td><td style="padding: 8px;"><strong>₹${loan.loan_amount?.toLocaleString('en-IN')}</strong></td></tr>
      <tr style="background: #edf2f7;"><td style="padding: 8px;">EMI</td><td style="padding: 8px;"><strong>₹${loan.emi?.toLocaleString('en-IN')}/month</strong></td></tr>
      <tr><td style="padding: 8px;">Tenure</td><td style="padding: 8px;"><strong>${loan.tenure} months</strong></td></tr>
      <tr style="background: #edf2f7;"><td style="padding: 8px;">Bank</td><td style="padding: 8px;"><strong>${loan.bank_name || 'N/A'}</strong></td></tr>
    </table>
    <p style="margin-top: 20px;">The funds will be disbursed within 2–3 business days.</p>
  `;

  return sendEmail({ to: user.email, subject: '✅ Loan Approved — SmartBank AI', body });
};

module.exports = { sendEmail, sendWelcomeEmail, sendLoanApprovalEmail };
