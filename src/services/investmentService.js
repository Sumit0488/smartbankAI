/**
 * src/services/investmentService.js
 * Frontend service calling real GraphQL backend for investments.
 */

import { graphqlRequest } from '../config/api';
import { investments } from '../data/mockData';

let MOCK_HOLDINGS = [
  { id: 'inv_001', type: 'Mutual Fund', amount: 50000, currentValue: 58500, status: 'Active', investedDate: '2025-11-10' },
  { id: 'inv_002', type: 'Stocks', amount: 25000, currentValue: 22000, status: 'Active', investedDate: '2026-01-05' },
  { id: 'inv_003', type: 'Fixed Deposit', amount: 100000, currentValue: 103500, status: 'Active', investedDate: '2025-06-20' },
];

const mapInvestment = (inv) => ({
  id: inv._id || inv.investment_id || inv.id,
  type: inv.investment_type || inv.type || 'Other',
  amount: Number(inv.amount) || 0,
  expectedReturn: inv.expected_return || 'N/A',
  currentValue: Number(inv.current_value || inv.currentValue) || Number(inv.amount) || 0,
  status: inv.status || 'Active',
  investedDate: inv.invested_at || inv.createdAt || inv.investedDate || new Date().toISOString(),
  notes: inv.notes || ''
});

export const getInvestments = async () => {
  try {
    const data = await graphqlRequest(`query { getMyInvestments { _id investment_type amount expected_return current_value status invested_at createdAt notes } }`);
    if (data?.getMyInvestments?.length) return data.getMyInvestments.map(mapInvestment);
  } catch (e) { console.warn('Backend fetch failed, using mock', e); }
  return MOCK_HOLDINGS.map(mapInvestment);
};

export const getInvestmentById = async (id) => {
  const all = await getInvestments();
  return all.find(inv => inv.id === id) || null;
};

export const getInvestmentOptions = async () => {
  return [
    { id: 'inv_opt_001', type: 'Mutual Fund', risk: 'Medium', expectedReturn: '12-15%', minAmount: 500 },
    { id: 'inv_opt_002', type: 'Fixed Deposit', risk: 'Low', expectedReturn: '7.1%', minAmount: 10000 },
    { id: 'inv_opt_003', type: 'Stocks', risk: 'High', expectedReturn: '15-20%', minAmount: 100 },
  ];
};

export const getPortfolioSummary = async () => {
  try {
    const data = await graphqlRequest(`query { getPortfolioSummary { totalInvested currentValue totalReturn returnPercentage activeCount } }`);
    if (data?.getPortfolioSummary) return data.getPortfolioSummary;
  } catch (e) { console.warn('Backend fetch failed, using mock', e); }
  
  const mapped = MOCK_HOLDINGS.map(mapInvestment);
  const total = mapped.reduce((sum, inv) => sum + inv.amount, 0);
  const current = mapped.reduce((sum, inv) => sum + inv.currentValue, 0);
  return {
    totalInvested: total,
    currentValue: current,
    totalReturn: current - total,
    returnPercentage: total ? ((current - total) / total) * 100 : 0,
    activeCount: mapped.length
  };
};

export const getInvestmentPerformance = async (id) => {
  // Mock performance data array
  return [100, 105, 102, 110, 115, 120];
};

export const createInvestment = async (investmentData) => {
  try {
    const data = await graphqlRequest(`
      mutation($input: AddInvestmentInput!) {
        addInvestment(input: $input) { _id status }
      }
    `, {
      input: {
        investment_type: investmentData.type || 'Mutual Fund',
        amount: Number(investmentData.amount) || 0,
        notes: JSON.stringify(investmentData)
      }
    });
    if (data?.addInvestment) return { success: true, investmentId: data.addInvestment._id };
  } catch (e) { console.warn('Backend investment create failed', e); }
  
  const newInv = {
    id: `inv_${Math.random().toString(36).substr(2, 9)}`,
    type: investmentData.type || 'Mutual Fund',
    amount: Number(investmentData.amount),
    currentValue: Number(investmentData.amount),
    status: 'Active',
    investedDate: new Date().toISOString()
  };
  MOCK_HOLDINGS.push(newInv);
  return { success: true, message: 'Investment created (mock).', investmentId: newInv.id };
};

export const updateInvestment = async (id, updateData) => {
  return { success: true, message: 'Investment updated (mock).' };
};

export const deleteInvestment = async (id) => {
  try {
    await graphqlRequest(`mutation($id: ID!) { deleteInvestment(id: $id) }`, { id });
    return { success: true };
  } catch (e) { console.warn('Backend delete failed', e); }
  
  MOCK_HOLDINGS = MOCK_HOLDINGS.filter(inv => inv.id !== id);
  return { success: true, message: 'Mock Investment deleted' };
};
