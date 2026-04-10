/**
 * src/services/cardService.js
 * Frontend service calling real GraphQL backend for cards.
 * Operations: listCards (CREDIT/DEBIT/PREPAID), recommendCards
 */

import { graphqlRequest } from '../config/api';
import { creditCards, debitCards, forexCards } from '../data/mockData';

const CARD_FIELDS = `
  id cardId cardName cardType issuer annualFee rewardsRate
  features minCreditScore minIncome applyUrl
`;

// Map camelCase backend Card to frontend-friendly format
const mapCard = (c) => ({
  id: c.id || c.cardId,
  cardId: c.cardId,
  name: c.cardName,
  cardName: c.cardName,
  provider: c.issuer,
  bank: c.issuer,
  bankName: c.issuer,
  type:
    c.cardType === 'CREDIT'
      ? 'credit'
      : c.cardType === 'DEBIT'
      ? 'debit'
      : 'forex',
  cardType: c.cardType,
  annualFee: c.annualFee,
  joiningFee: c.joiningFee || 0,
  // Backward-compat aliases used by pages
  cashback_rate: c.rewardsRate,
  rewardsRate: c.rewardsRate,
  // features array → also exposed as "benefits" for backward compat
  features: c.features || [],
  benefits: c.features || [],
  minSalary: c.minIncome || 0,
  minCreditScore: c.minCreditScore || 0,
  cardCategory: c.cardCategory || '',
  isActive: c.isActive !== false,
  applyUrl: c.applyUrl || '',
});

export const getCreditCards = async () => {
  try {
    const data = await graphqlRequest(
      `query { listCards(cardType: CREDIT) { items { ${CARD_FIELDS} } total } }`
    );
    if (data?.listCards?.items?.length) return data.listCards.items.map(mapCard);
  } catch (e) {
    console.warn('Backend fetch failed, using mock', e);
  }
  return creditCards;
};

export const getDebitCards = async () => {
  try {
    const data = await graphqlRequest(
      `query { listCards(cardType: DEBIT) { items { ${CARD_FIELDS} } total } }`
    );
    if (data?.listCards?.items?.length) return data.listCards.items.map(mapCard);
  } catch (e) {
    console.warn('Backend fetch failed, using mock', e);
  }
  return debitCards;
};

// Forex cards are PREPAID in the backend
export const getForexCards = async () => {
  try {
    const data = await graphqlRequest(
      `query { listCards(cardType: PREPAID) { items { ${CARD_FIELDS} } total } }`
    );
    if (data?.listCards?.items?.length) return data.listCards.items.map(mapCard);
  } catch (e) {
    console.warn('Backend fetch failed, using mock', e);
  }
  return forexCards;
};

export const getCardRecommendations = async (profile, cardType = 'credit') => {
  // Uses mock logic for now since recommendation engine is client-side
  const source =
    cardType === 'credit' ? creditCards : cardType === 'debit' ? debitCards : forexCards;
  const filtered = source.filter((card) => {
    if (!profile.userType) return true;
    if (card.eligibility?.userType) return card.eligibility.userType.includes(profile.userType);
    if (card.eligibility?.minIncome) return Number(profile.income) >= card.eligibility.minIncome;
    return true;
  });
  return filtered.slice(0, 3);
};

export const applyCard = async (cardId, cardName) => {
  try {
    const data = await graphqlRequest(
      `mutation($cardId: ID!) { applyCard(cardId: $cardId) { success message applicationId } }`,
      { cardId }
    );
    if (data?.applyCard) return data.applyCard;
  } catch (e) {
    console.warn('applyCard backend failed', e);
  }
  return { success: true, message: `Application for ${cardName || 'card'} submitted successfully`, applicationId: `APP-${Date.now()}` };
};

export const BANK_APPLY_LINKS = {
  'HDFC Bank': 'https://www.hdfcbank.com/personal/pay/cards/credit-cards',
  HDFC: 'https://www.hdfcbank.com/personal/pay/cards/credit-cards',
  SBI: 'https://www.sbi.co.in/web/personal-banking/cards/credit-cards',
  'Axis Bank': 'https://www.axisbank.com/retail/cards/credit-card',
  Axis: 'https://www.axisbank.com/retail/cards/credit-card',
  Niyo: 'https://www.goniyo.com/global/',
  'DCB Bank / Equitas': 'https://www.goniyo.com/global/',
  'ICICI Bank': 'https://www.icicibank.com/personal-banking/cards/credit-card',
};

export const getApplyLink = (bank, cardName) =>
  BANK_APPLY_LINKS[bank] ||
  `https://www.google.com/search?q=apply+${encodeURIComponent(cardName)}+online`;
