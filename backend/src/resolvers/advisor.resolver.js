'use strict';

const { extractIdentity } = require('../utils/auth');

// ─── Static Investment Options ─────────────────────────────────────────────────
// Field names match investment.graphql: { type, riskLevel, expectedReturn, minInvestment, description }

const INVESTMENT_OPTIONS = [
  { type: 'PF',            riskLevel: 'Low',    expectedReturn: '7.1%',   minInvestment: 500,   description: 'Public Provident Fund — government-backed with 80C tax benefits.' },
  { type: 'MUTUAL_FUND',  riskLevel: 'Medium',  expectedReturn: '12-15%', minInvestment: 500,   description: 'Diversified pool of stocks and bonds managed by professionals.' },
  { type: 'STOCK',        riskLevel: 'High',    expectedReturn: '15-25%', minInvestment: 100,   description: 'Direct equity investment in publicly listed companies.' },
  { type: 'SIP',          riskLevel: 'Medium',  expectedReturn: '10-14%', minInvestment: 500,   description: 'Systematic Investment Plan — invest small amounts monthly.' },
  { type: 'FIXED_DEPOSIT', riskLevel: 'Low',   expectedReturn: '7.0-7.5%', minInvestment: 10000, description: 'Guaranteed returns for a fixed tenure. Safest option.' },
];

// ─── Static Company Data ───────────────────────────────────────────────────────
// Field names match investment.graphql: { id, name, type, expectedReturn, duration, details }

const COMPANIES = {
  MUTUAL_FUND: [
    { id: 'c1', name: 'HDFC Mutual Fund',  type: 'MUTUAL_FUND',   expectedReturn: '14.2%', duration: '3-5 years', details: 'Large-cap equity fund. AAA rated. Min ₹500.' },
    { id: 'c2', name: 'ICICI Prudential',  type: 'MUTUAL_FUND',   expectedReturn: '13.8%', duration: '3-7 years', details: 'Balanced fund with equity & debt. AAA rated.' },
    { id: 'c3', name: 'SBI Bluechip Fund', type: 'MUTUAL_FUND',   expectedReturn: '12.5%', duration: '5 years',   details: 'Blue-chip equity fund. AA+ rated. Min ₹500.' },
    { id: 'c4', name: 'Axis Growth Fund',  type: 'MUTUAL_FUND',   expectedReturn: '15.1%', duration: '5-7 years', details: 'Growth-oriented equity fund. AA rated.' },
  ],
  SIP: [
    { id: 'c5', name: 'HDFC SIP Plan',     type: 'SIP', expectedReturn: '13.0%', duration: '5-10 years', details: 'Monthly SIP starting ₹500. Auto-debit.' },
    { id: 'c6', name: 'ICICI SIP Growth',  type: 'SIP', expectedReturn: '12.5%', duration: '3-7 years',  details: 'Flexible SIP with step-up option.' },
    { id: 'c7', name: 'Axis SIP Plus',     type: 'SIP', expectedReturn: '14.0%', duration: '7-10 years', details: 'High-growth SIP for long-term investors.' },
    { id: 'c8', name: 'SBI SIP Advantage', type: 'SIP', expectedReturn: '11.8%', duration: '3-5 years',  details: 'Stable SIP with government backing.' },
  ],
  FIXED_DEPOSIT: [
    { id: 'c9',  name: 'SBI Fixed Deposit',  type: 'FIXED_DEPOSIT', expectedReturn: '7.1%',  duration: '1-5 years', details: 'Govt bank FD. Highest safety. Min ₹1000.' },
    { id: 'c10', name: 'HDFC FD Scheme',     type: 'FIXED_DEPOSIT', expectedReturn: '7.5%',  duration: '1-3 years', details: 'Private bank FD. Highest return. Min ₹5000.' },
    { id: 'c11', name: 'Axis Bank FD',       type: 'FIXED_DEPOSIT', expectedReturn: '7.25%', duration: '1-5 years', details: 'Flexible tenure options. Min ₹10,000.' },
    { id: 'c12', name: 'Post Office TD',     type: 'FIXED_DEPOSIT', expectedReturn: '7.0%',  duration: '1-5 years', details: 'Government-backed. Min ₹500.' },
  ],
  PF: [
    { id: 'c13', name: 'EPFO (Employee PF)',  type: 'PF', expectedReturn: '8.15%', duration: 'Until retirement', details: 'Mandatory for salaried employees. Tax-free.' },
    { id: 'c14', name: 'Public PPF Account',  type: 'PF', expectedReturn: '7.1%',  duration: '15 years',       details: 'Tax-free interest. 80C deduction. Min ₹500.' },
    { id: 'c15', name: 'VPF (Voluntary PF)',  type: 'PF', expectedReturn: '8.15%', duration: 'Until retirement', details: 'Voluntary contribution to EPFO at same rate.' },
  ],
  STOCK: [
    { id: 'c16', name: 'Reliance Industries', type: 'STOCK', expectedReturn: '18.5%', duration: 'Long-term', details: 'BSE: RELIANCE. Market cap ₹18L Cr. Blue chip.' },
    { id: 'c17', name: 'TCS',                 type: 'STOCK', expectedReturn: '16.2%', duration: 'Long-term', details: 'BSE: TCS. IT sector leader. Consistent returns.' },
    { id: 'c18', name: 'HDFC Bank',           type: 'STOCK', expectedReturn: '14.8%', duration: 'Long-term', details: 'BSE: HDFCBANK. Top private bank stock.' },
    { id: 'c19', name: 'Infosys',             type: 'STOCK', expectedReturn: '15.3%', duration: 'Long-term', details: 'BSE: INFY. Global IT services. Dividend payer.' },
  ],
};

function resolveCompanyKey(type) {
  const t = (type || '').toUpperCase().replace(/[\s-]+/g, '_');
  if (t === 'SIP') return 'SIP';
  if (t.includes('MUTUAL')) return 'MUTUAL_FUND';
  if (t.includes('FIXED') || t.includes('FD') || t.includes('DEPOSIT')) return 'FIXED_DEPOSIT';
  if (t.includes('STOCK')) return 'STOCK';
  if (t === 'PF' || t.includes('PROVIDENT') || t.includes('PPF')) return 'PF';
  return 'MUTUAL_FUND';
}

// ─── Resolver ─────────────────────────────────────────────────────────────────

const advisorResolver = {
  Query: {
    listInvestmentOptions: (_parent, _args, context) => {
      const identity = extractIdentity(context.identity);
      if (!identity) throw new Error('Authentication required');
      return INVESTMENT_OPTIONS;
    },

    listCompanies: (_parent, { type }, context) => {
      const identity = extractIdentity(context.identity);
      if (!identity) throw new Error('Authentication required');
      const key = resolveCompanyKey(type);
      return COMPANIES[key] || COMPANIES.MUTUAL_FUND;
    },
  },

  Mutation: {
    processDummyPayment: (_parent, { input }, context) => {
      const identity = extractIdentity(context.identity);
      if (!identity) throw new Error('Authentication required');
      const txId = `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      return {
        success: true,
        transactionId: txId,
        message: `Payment of ₹${input.amount} via ${input.paymentMethod || 'UPI'} processed successfully.`,
      };
    },
  },
};

module.exports = advisorResolver;
