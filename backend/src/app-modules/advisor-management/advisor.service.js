/**
 * advisor.service.js — AI Advisor + Calculator service
 * SmartBank AI Backend
 * Pure computation — no database required.
 */

const Bank = require('../bank-management/bank.model');

// ── Currency fee rates (%) ────────────────────────────────────────────────────
const CURRENCY_FEE_RATES = {
  'INR_USD': 1.5, 'INR_EUR': 1.7, 'INR_GBP': 1.8, 'INR_JPY': 1.2,
  'INR_AED': 1.0, 'INR_SGD': 1.3, 'USD_INR': 1.5, 'EUR_INR': 1.7,
  DEFAULT: 2.0,
};

// ── Forex rate approximations (for offline fallback) ─────────────────────────
const FALLBACK_RATES = {
  'INR_USD': 0.012, 'INR_EUR': 0.011, 'INR_GBP': 0.0095,
  'INR_JPY': 1.80,  'INR_AED': 0.044, 'INR_SGD': 0.016,
  'USD_INR': 83.5,  'EUR_INR': 90.2,  'GBP_INR': 105.4,
};

// ── Send Money Calculator ─────────────────────────────────────────────────────

const calculateSendMoney = async (amount, from_currency, to_currency) => {
  const key = `${from_currency.toUpperCase()}_${to_currency.toUpperCase()}`;
  const feeRate = CURRENCY_FEE_RATES[key] || CURRENCY_FEE_RATES.DEFAULT;
  const rate = FALLBACK_RATES[key] || 1;

  const fee = parseFloat((amount * feeRate / 100).toFixed(2));
  const converted = parseFloat(((amount - fee) * rate).toFixed(2));
  const total = parseFloat((amount + fee).toFixed(2));

  const breakdown = [
    `Amount to send: ${from_currency} ${amount.toLocaleString('en-IN')}`,
    `Transfer fee (${feeRate}%): ${from_currency} ${fee}`,
    `Exchange rate: 1 ${from_currency} ≈ ${rate} ${to_currency}`,
    `You receive: ${to_currency} ${converted.toLocaleString('en-IN')}`,
  ].join(' | ');

  return { fee, total, breakdown };
};

// ── Investment Advice ─────────────────────────────────────────────────────────

const INVESTMENT_PROFILES = {
  'Student': {
    recommendation: 'Start small with SIPs in index funds. Focus on building an emergency fund first. Avoid high-risk instruments.',
    riskLevel: 'Low',
    suggestedFunds: 'Nifty 50 Index Fund, PPF, Recurring Deposit',
    sipMultiplier: 0.10,
  },
  'Working Professional': {
    recommendation: 'Balance growth and stability. Invest 20–30% of income across equity MFs, PPF and NPS.',
    riskLevel: 'Medium',
    suggestedFunds: 'Mirae Asset Large Cap, ICICI Pru Bluechip, NPS Tier-1, PPF',
    sipMultiplier: 0.20,
  },
  'Self Employed': {
    recommendation: 'Build a 6-month emergency fund first. Mix of liquid funds + mid-cap equity for growth.',
    riskLevel: 'Medium-High',
    suggestedFunds: 'HDFC Mid-Cap Opportunities, Axis Liquid Fund, Gold ETF',
    sipMultiplier: 0.15,
  },
  'Business Owner': {
    recommendation: 'Diversify with equity, debt and real estate. Consider corporate FDs and debt mutual funds for business liquidity.',
    riskLevel: 'High',
    suggestedFunds: 'SBI Small Cap Fund, UTI Flexi Cap, Corporate FD, REITs',
    sipMultiplier: 0.25,
  },
  'Other': {
    recommendation: 'Start with a safe FD or recurring deposit. Gradually explore mutual funds once you have 3-month emergency savings.',
    riskLevel: 'Low',
    suggestedFunds: 'SBI Fixed Deposit, Post Office RD, Liquid Mutual Fund',
    sipMultiplier: 0.10,
  },
};

const getInvestmentAdvice = async (profileType, salary) => {
  const profile = INVESTMENT_PROFILES[profileType] || INVESTMENT_PROFILES['Other'];
  const monthlySIP = parseFloat((salary * profile.sipMultiplier).toFixed(0));

  return {
    recommendation: profile.recommendation,
    riskLevel: profile.riskLevel,
    suggestedFunds: profile.suggestedFunds,
    monthlySIP,
  };
};

// ── Forex Advice ──────────────────────────────────────────────────────────────

const FOREX_TIPS = {
  'INR_USD': { bestTime: 'Morning IST (when US markets open) — rates tend to be more favourable.', tip: 'Avoid transferring on Fridays; carry a margin of ±2% on live rate.' },
  'INR_EUR': { bestTime: 'Mid-morning IST (European market open).', tip: 'EUR/INR tends to be lowest volatility on Tuesdays–Thursdays.' },
  'INR_GBP': { bestTime: 'Early morning IST during London open.', tip: 'Avoid around UK budget announcements — high volatility.' },
  'INR_AED': { bestTime: 'AED is pegged to USD, any time is comparable.', tip: 'Most banks offer competitive rates for remittance to UAE.' },
  'INR_JPY': { bestTime: 'Tokyo session (early morning IST).', tip: 'JPY is a safe-haven currency — rates improve during global risk-off.' },
  DEFAULT: { bestTime: 'Mid-week (Tue–Thu) during business hours for best rates.', tip: 'Always compare at least 2 banks. Rates vary by up to 1.5%.' },
};

const getForexAdvice = async (from_currency, to_currency) => {
  const key = `${from_currency.toUpperCase()}_${to_currency.toUpperCase()}`;
  const advice = FOREX_TIPS[key] || FOREX_TIPS.DEFAULT;
  const estimatedRate = FALLBACK_RATES[key] || null;

  return { ...advice, estimatedRate };
};

// ── Minimum Balance Risk Checker ──────────────────────────────────────────────

const checkMinBalanceRisk = async (bankName, currentBalance) => {
  // Try to find bank in DB; fall back to a default 0 if not found
  const bank = await Bank.findOne({ bank_name: new RegExp(bankName, 'i') });
  const minimumBalance = bank?.minimum_balance || 0;
  const atRisk = currentBalance < minimumBalance;
  const penalty = atRisk
    ? `⚠️ Balance ₹${currentBalance.toLocaleString('en-IN')} is below minimum ₹${minimumBalance.toLocaleString('en-IN')}. Typical penalty: ₹${Math.round(minimumBalance * 0.01)}/month or as per bank T&C.`
    : `✅ Your balance is above the minimum requirement of ₹${minimumBalance.toLocaleString('en-IN')}.`;

  return {
    bankName: bank?.bank_name || bankName,
    minimumBalance,
    currentBalance,
    atRisk,
    penalty,
  };
};

module.exports = { calculateSendMoney, getInvestmentAdvice, getForexAdvice, checkMinBalanceRisk };
