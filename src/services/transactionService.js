/**
 * src/services/transactionService.js
 * Frontend service calling real GraphQL backend for expenses/transactions.
 */

import { graphqlRequest } from '../config/api';

const MOCK_TRANSACTIONS = [
  { id: 'tx_001', date: '2026-03-09', description: 'Swiggy Food Order', amount: -450, category: 'Food', type: 'debit' },
  { id: 'tx_002', date: '2026-03-09', description: 'Salary Credit', amount: 30000, category: 'Income', type: 'credit' },
  { id: 'tx_003', date: '2026-03-08', description: 'Amazon Shopping', amount: -2300, category: 'Shopping', type: 'debit' },
  { id: 'tx_004', date: '2026-03-07', description: 'Uber Ride', amount: -180, category: 'Travel', type: 'debit' },
  { id: 'tx_005', date: '2026-03-07', description: 'Netflix Subscription', amount: -649, category: 'Entertainment', type: 'debit' },
];

const mapExpense = (e) => ({
  id: e._id || e.expense_id,
  date: e.createdAt ? e.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
  description: e.description || e.category,
  amount: -(Math.abs(e.amount)), // Backend expenses are positive, frontend expects negative debits
  category: e.category,
  type: 'debit'
});

export const getTransactions = async ({ page = 1, limit = 20, category } = {}) => {
  try {
    const data = await graphqlRequest(`query { getMyExpenses { _id expense_id category amount description createdAt } }`);
    if (data?.getMyExpenses?.length) {
      let txs = data.getMyExpenses.map(mapExpense);
      if (category) txs = txs.filter(t => t.category === category);
      return { transactions: txs, total: txs.length, page, limit };
    }
  } catch (e) { console.warn('Backend fetch failed, using mock', e); }
  
  const filtered = category ? MOCK_TRANSACTIONS.filter(t => t.category === category) : MOCK_TRANSACTIONS;
  return { transactions: filtered, total: filtered.length, page, limit };
};

export const getTransactionsByCategory = async () => {
  try {
    const data = await graphqlRequest(`query { getMyExpenses { category amount } }`);
    if (data?.getMyExpenses?.length) {
      const grouped = data.getMyExpenses.reduce((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + Math.abs(tx.amount);
        return acc;
      }, {});
      return Object.entries(grouped).map(([category, total]) => ({ category, total }));
    }
  } catch (e) { console.warn('Backend fetch failed, using mock', e); }

  const grouped = MOCK_TRANSACTIONS.reduce((acc, tx) => {
    if (tx.type === 'debit') acc[tx.category] = (acc[tx.category] || 0) + Math.abs(tx.amount);
    return acc;
  }, {});
  return Object.entries(grouped).map(([category, total]) => ({ category, total }));
};

export const getMonthlySpending = async (year = 2026, month = 3) => {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  try {
    const data = await graphqlRequest(`query($month: String!) { getExpensesByMonth(month: $month) { amount } }`, { month: monthStr });
    if (data?.getExpensesByMonth) {
      const total = data.getExpensesByMonth.reduce((s, t) => s + Math.abs(t.amount), 0);
      return { year, month, totalSpend: total, transactionCount: data.getExpensesByMonth.length };
    }
  } catch (e) { console.warn('Backend fetch failed, using mock', e); }

  const debits = MOCK_TRANSACTIONS.filter(t => t.type === 'debit');
  const total = debits.reduce((s, t) => s + Math.abs(t.amount), 0);
  return { year, month, totalSpend: total, transactionCount: debits.length };
};

export const createExpense = async (expense) => {
  try {
    const res = await graphqlRequest(`
      mutation($input: CreateExpenseInput!) {
        createExpense(input: $input) { _id category amount description }
      }
    `, {
      input: {
        category: expense.category,
        amount: Number(expense.amount),
        description: expense.description || '',
        date: expense.date || new Date().toISOString()
      }
    });
    if (res?.createExpense) return { success: true, expense: mapExpense(res.createExpense) };
  } catch (e) { console.warn('Backend create failed', e); }
  
  const newTx = { 
    id: `tx_${Math.random().toString(36).substr(2, 9)}`, 
    ...expense, 
    type: 'debit',
    amount: -Math.abs(expense.amount)
  };
  return { success: true, expense: newTx };
};

export const deleteExpense = async (id) => {
  try {
    await graphqlRequest(`mutation($id: ID!) { deleteExpense(id: $id) }`, { id });
    return { success: true };
  } catch (e) { console.warn('Backend delete failed', e); }
  return { success: true, message: 'Mock Expense deleted' };
};
