/**
 * src/services/accountService.js
 * Frontend service for accounts (Mock data only, no specific backend GraphQL module yet)
 */

const MOCK_ACCOUNTS = [
  { id: 'acc_001', bankName: 'HDFC Bank', accountType: 'Savings', accountNumber: '****4521', balance: 142500, currency: 'INR', status: 'active' },
  { id: 'acc_002', bankName: 'SBI', accountType: 'Savings', accountNumber: '****7890', balance: 38000, currency: 'INR', status: 'active' },
];

export const getAccounts = async () => MOCK_ACCOUNTS;

export const getAccountById = async (id) => MOCK_ACCOUNTS.find(a => a.id === id) || null;

export const getAccountBalance = async (id) => {
  const account = MOCK_ACCOUNTS.find(a => a.id === id);
  return { balance: account?.balance ?? 0, currency: 'INR' };
};

export const getTotalBalance = async () => {
  const total = MOCK_ACCOUNTS.reduce((sum, a) => sum + a.balance, 0);
  return { total, currency: 'INR' };
};

export const createAccount = async (data) => {
  return { success: true, message: 'Account creation submitted successfully.', referenceId: `SB-2026-${Math.floor(10000 + Math.random() * 90000)}` };
};
