/**
 * src/services/cardService.js
 * Frontend service calling real GraphQL backend for cards.
 */

import { graphqlRequest } from '../config/api';
import { creditCards, debitCards, forexCards } from '../data/mockData';

const mapCard = (c) => ({
  id: c._id || c.card_id,
  name: c.card_name,
  provider: c.bank_name,
  type: c.card_type === 'Credit' ? 'credit' : c.card_type === 'Debit' ? 'debit' : 'forex',
  annualFee: c.annual_fee,
  joiningFee: c.joining_fee,
  cashback: c.cashback_rate,
  features: c.benefits ? c.benefits.split(',') : [],
  rating: c.rating,
  category: c.card_category
});

export const getCreditCards = async () => {
  try {
    const data = await graphqlRequest(`query { getCardsByType(card_type: "Credit") { _id card_id bank_name card_name annual_fee joining_fee cashback_rate benefits card_category rating } }`);
    if (data?.getCardsByType?.length) return data.getCardsByType.map(mapCard);
  } catch (e) { console.warn('Backend fetch failed, using mock', e); }
  return creditCards;
};

export const getDebitCards = async () => {
  try {
    const data = await graphqlRequest(`query { getCardsByType(card_type: "Debit") { _id card_id bank_name card_name annual_fee joining_fee cashback_rate benefits card_category rating } }`);
    if (data?.getCardsByType?.length) return data.getCardsByType.map(mapCard);
  } catch (e) { console.warn('Backend fetch failed, using mock', e); }
  return debitCards;
};

export const getForexCards = async () => {
  try {
    const data = await graphqlRequest(`query { getCardsByType(card_type: "Forex") { _id card_id bank_name card_name annual_fee joining_fee cashback_rate benefits card_category rating } }`);
    if (data?.getCardsByType?.length) return data.getCardsByType.map(mapCard);
  } catch (e) { console.warn('Backend fetch failed, using mock', e); }
  return forexCards;
};

export const getCardRecommendations = async (profile, cardType = 'credit') => {
  // Uses mock logic for now since backend lacks complex AI recommendation query for cards
  const source = cardType === 'credit' ? creditCards : cardType === 'debit' ? debitCards : forexCards;
  const filtered = source.filter(card => {
    if (!profile.userType) return true;
    if (card.eligibility?.userType) return card.eligibility.userType.includes(profile.userType);
    if (card.eligibility?.minIncome) return Number(profile.income) >= card.eligibility.minIncome;
    return true;
  });
  return filtered.slice(0, 3);
};

export const BANK_APPLY_LINKS = {
  'HDFC Bank': 'https://www.hdfcbank.com/personal/pay/cards/credit-cards',
  'HDFC': 'https://www.hdfcbank.com/personal/pay/cards/credit-cards',
  'SBI': 'https://www.sbi.co.in/web/personal-banking/cards/credit-cards',
  'Axis Bank': 'https://www.axisbank.com/retail/cards/credit-card',
  'Axis': 'https://www.axisbank.com/retail/cards/credit-card',
  'Niyo': 'https://www.goniyo.com/global/',
  'DCB Bank / Equitas': 'https://www.goniyo.com/global/',
  'ICICI Bank': 'https://www.icicibank.com/personal-banking/cards/credit-card',
};

export const getApplyLink = (bank, cardName) =>
  BANK_APPLY_LINKS[bank] || `https://www.google.com/search?q=apply+${encodeURIComponent(cardName)}+online`;
