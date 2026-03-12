/**
 * src/services/forexService.js
 */

import { graphqlRequest } from '../config/api';

const MOCK_FX_RATES = { USD: 83.50, EUR: 89.20, GBP: 104.10, AED: 22.73, SGD: 61.85 };

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

export const getLiveRates = async (base = 'INR') => {
  return MOCK_FX_RATES;
};

export const calculateForex = async (amount, fromCurrency, toCurrency, cardId = null) => {
  try {
    const data = await graphqlRequest(`
      query($amount: Float!, $from: String!, $to: String!) {
        calculateSendMoney(amount: $amount, from_currency: $from, to_currency: $to) { fee total breakdown }
      }
    `, { amount: Number(amount), from: fromCurrency, to: toCurrency });
    
    if (data?.calculateSendMoney) {
      return {
        convertedAmount: data.calculateSendMoney.total - data.calculateSendMoney.fee,
        totalCostINR: data.calculateSendMoney.total,
        fees: data.calculateSendMoney.fee,
        breakdown: data.calculateSendMoney.breakdown
      };
    }
  } catch (e) {
    console.warn('Backend transfer calc failed, falling back', e);
  }

  // Fallback
  const rateTo = MOCK_FX_RATES[toCurrency] || 83.50;
  const convertedAmount = amount / rateTo;
  let markupFee = cardId === 'fx-hdfc' ? 0.02 * amount : 0;
  return {
    convertedAmount: convertedAmount,
    totalCostINR: amount + markupFee,
    fees: markupFee,
    appliedRate: rateTo,
  };
};

export const getAIForexAdvice = async (fromCurrency, toCurrency) => {
  try {
    const data = await graphqlRequest(`
      query($from: String!, $to: String!) {
        getForexAdvice(from_currency: $from, to_currency: $to) { bestTime tip estimatedRate }
      }
    `, { from: fromCurrency, to: toCurrency });
    if (data?.getForexAdvice) return data.getForexAdvice;
  } catch (e) {
    console.warn('Backend advice calc failed', e);
  }
  return {
    bestTime: 'Wait 2 days',
    tip: 'Historical patterns show early week drops.',
    estimatedRate: MOCK_FX_RATES[toCurrency]
  };
};
