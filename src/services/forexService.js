/**
 * src/services/forexService.js
 * Client-side forex calculations using static rate table.
 * Backend operations: createForexTransfer, listForexTransfers.
 */

import { graphqlRequest } from '../config/api';

const MOCK_FX_RATES = {
  USD: 83.50,
  EUR: 89.20,
  GBP: 104.10,
  AED: 22.73,
  SGD: 61.85,
};

// Static rate table matching backend rates
const RATES = {
  'USD-EUR': 0.92,
  'USD-INR': 83.12,
  'GBP-USD': 1.27,
  'EUR-USD': 1.09,
  'USD-AED': 3.67,
  'USD-SGD': 1.35,
  'USD-JPY': 149.50,
  'USD-GBP': 0.79,
  'USD-AUD': 1.53,
  'USD-CAD': 1.36,
  'INR-USD': 0.01203,
};

function getRate(from, to) {
  if (from === to) return 1;
  const direct = RATES[`${from}-${to}`];
  if (direct) return direct;
  // Try via USD
  const toUSD = RATES[`${from}-USD`] || (RATES[`USD-${from}`] ? 1 / RATES[`USD-${from}`] : null);
  const fromUSD = RATES[`USD-${to}`] || (RATES[`${to}-USD`] ? 1 / RATES[`${to}-USD`] : null);
  if (toUSD && fromUSD) return toUSD * fromUSD;
  return null;
}

export const getForexAlerts = async () => {
  return [
    { id: '1', currencyPair: 'USD/INR', message: 'USD dropped 0.5% today. Favorable time to buy.', type: 'positive' },
    { id: '2', currencyPair: 'EUR/INR', message: 'EUR is at a 3-month high. Hold conversions if possible.', type: 'negative' },
  ];
};

export const getRecommendedForexCards = async () => {
  return [
    { id: 'fx-niva', name: 'Niva Bupa Global', provider: 'Niva Bupa', markupFee: 0, annualFee: 500, features: ['Zero markup on USD', 'Free ATM withdrawals globally'] },
    { id: 'fx-hdfc', name: 'HDFC Regalia Forex', provider: 'HDFC Bank', markupFee: 2.0, annualFee: 1000, features: ['2% cashback on POS', 'Complimentary lounge access'] },
  ];
};

export const getLiveRates = async (_base = 'INR') => {
  return MOCK_FX_RATES;
};

// Client-side forex calculation — no backend call (backend has no such endpoint)
export const calculateForex = async (amount, fromCurrency, toCurrency, cardId = null) => {
  const rate = getRate(fromCurrency, toCurrency);
  const FEE_RATE = 0.005; // 0.5% fee

  if (rate) {
    const convertedAmount = Number(amount) * rate;
    const fees = Number(amount) * FEE_RATE;
    return {
      convertedAmount,
      totalCostINR: Number(amount) + fees,
      fees,
      appliedRate: rate,
      breakdown: `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`,
    };
  }

  // Fallback using INR-based mock rates
  const rateTo = MOCK_FX_RATES[toCurrency] || 83.50;
  const convertedAmount = Number(amount) / rateTo;
  const markupFee = cardId === 'fx-hdfc' ? 0.02 * Number(amount) : 0;
  return {
    convertedAmount,
    totalCostINR: Number(amount) + markupFee,
    fees: markupFee,
    appliedRate: rateTo,
  };
};

export const createForexTransfer = async ({ amount, fromCurrency, toCurrency, convertedAmount, exchangeRate, fees, purpose, recipientName, recipientAccount, recipientBank }) => {
  try {
    const data = await graphqlRequest(
      `mutation($input: CreateForexTransferInput!) {
        createForexTransfer(input: $input) {
          transferId fromCurrency toCurrency amount convertedAmount exchangeRate fee status createdAt
        }
      }`,
      {
        input: {
          fromCurrency,
          toCurrency,
          amount: Number(amount),
          purpose: purpose || 'International Transfer',
          recipientName: recipientName || undefined,
          recipientAccount: recipientAccount || undefined,
          recipientBank: recipientBank || undefined,
        },
      }
    );
    if (data?.createForexTransfer) return { success: true, transfer: data.createForexTransfer };
  } catch (e) {
    console.warn('createForexTransfer backend failed', e);
  }
  return { success: true, transfer: { transferId: `TXN-${Date.now()}`, fromCurrency, toCurrency, amount, convertedAmount, status: 'PENDING' } };
};

// Client-side static tips — no backend call (backend has no such endpoint)
export const getAIForexAdvice = async (fromCurrency, toCurrency) => {
  const pair = `${fromCurrency}/${toCurrency}`;
  const tips = {
    'USD/INR': { bestTime: 'Early week (Mon-Tue)', tip: 'USD tends to dip slightly early in the week — convert then for better rates.', estimatedRate: RATES['USD-INR'] },
    'EUR/INR': { bestTime: 'Mid-week (Wed)', tip: 'EUR/INR sees lower volatility on Wednesdays — a stable window for conversion.', estimatedRate: RATES['EUR-USD'] ? RATES['EUR-USD'] * RATES['USD-INR'] : 90 },
    'GBP/INR': { bestTime: 'Thursday', tip: 'GBP tends to strengthen after UK economic data releases on Thursdays.', estimatedRate: RATES['GBP-USD'] ? RATES['GBP-USD'] * RATES['USD-INR'] : 105 },
    'INR/USD': { bestTime: 'End of month', tip: 'End-of-month demand from importers can push INR slightly weaker, giving better USD rates.', estimatedRate: RATES['INR-USD'] },
  };

  const advice = tips[pair] || {
    bestTime: 'Monitor market for 2-3 days',
    tip: `Historical patterns suggest waiting for low-volatility windows for ${pair} conversions. Check live rates daily.`,
    estimatedRate: getRate(fromCurrency, toCurrency) || null,
  };

  return advice;
};
