/**
 * src/services/bankService.js
 * Frontend service calling real GraphQL backend for banks.
 */

import { graphqlRequest } from '../config/api';
import { banks } from '../data/mockData';

// Helper to map DB Bank to frontend Bank format
const mapBank = (b) => ({
  id: b._id || b.bank_id,
  name: b.bank_name,
  minimum_balance: b.minimum_balance,
  interest_rate: b.interest_rate,
  forex_fee: b.forex_fee,
  features: b.features ? b.features.split(',') : [],
  rating: b.rating
});

export const getBanks = async () => {
  try {
    const data = await graphqlRequest(`query { getAllBanks { _id bank_id bank_name minimum_balance interest_rate forex_fee features rating } }`);
    if (data?.getAllBanks?.length) return data.getAllBanks.map(mapBank);
  } catch (e) {
    console.warn('Backend fetch failed, falling back to mock UI data', e);
  }
  return banks;
};

export const getBankById = async (id) => {
  try {
    const data = await graphqlRequest(`query($id: ID!) { getBankById(id: $id) { _id bank_id bank_name minimum_balance interest_rate forex_fee features rating } }`, { id });
    if (data?.getBankById) return mapBank(data.getBankById);
  } catch (e) {
    console.warn('Backend fetch failed, falling back to mock UI data', e);
  }
  return banks.find(b => b.id === id) || null;
};

export const getBanksByCategory = async (category) => {
  // Backend doesn't have an explicit category filter yet, so we filter all banks
  const all = await getBanks();
  return all;
};

export const compareBanks = async (bankIds) => {
  try {
    const data = await graphqlRequest(`query($ids: [ID!]!) { compareBanks(ids: $ids) { _id bank_id bank_name minimum_balance interest_rate forex_fee features rating } }`, { ids: bankIds });
    if (data?.compareBanks?.length) return { banks: data.compareBanks.map(mapBank), comparedAt: new Date().toISOString() };
  } catch (e) {
    console.warn('Backend fetch failed, falling back to mock UI data', e);
  }
  const selected = banks.filter(b => bankIds.includes(b.id));
  return { banks: selected, comparedAt: new Date().toISOString() };
};

export const getBankRecommendation = async (userNeed) => {
  const map = {
    student: { bankId: 'sbi-basic', reason: 'Zero balance, largest ATM network' },
    salary: { bankId: 'hdfc-regular', reason: 'Premium salary account perks' },
    business: { bankId: 'axis-asap', reason: 'Robust corporate banking' },
    digital: { bankId: 'kotak-811', reason: 'Fully digital, zero branch visits' },
    lowfee: { bankId: 'sbi-basic', reason: 'Minimal hidden charges' },
  };
  return map[userNeed] || { bankId: null, reason: '' };
};
