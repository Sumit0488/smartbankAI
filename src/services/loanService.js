/**
 * src/services/loanService.js
 * Frontend service calling real GraphQL backend for loans.
 */

import { graphqlRequest } from '../config/api';
import { loans } from '../data/mockData';

const mapLoan = (l) => ({
  id: l._id || l.loan_id,
  type: l.loan_type,
  amount: l.loan_amount,
  interestRate: l.interest_rate,
  tenure: l.tenure,
  emi: l.emi,
  totalPayable: l.total_payable,
  status: l.status,
  bankName: l.bank_name,
  appliedDate: l.applied_at || l.createdAt
});

export const getLoans = async () => {
  try {
    const data = await graphqlRequest(`query { getAllLoans { _id loan_id loan_type loan_amount interest_rate tenure emi total_payable status bank_name createdAt } }`);
    if (data?.getAllLoans?.length) return data.getAllLoans.map(mapLoan);
  } catch (e) { console.warn('Backend fetch failed, using mock', e); }
  return loans;
};

export const getLoanById = async (id) => {
  const all = await getLoans();
  return all.find(l => l.id === id) || null;
};

export const getLoansByType = async (type) => {
  const all = await getLoans();
  return all.filter(l => l.type === type);
};

export const getLoanEligibility = async (monthlyIncome, emiAmount) => {
  // If we had a specific backend for this we could call it, otherwise evaluate locally
  const maxEmi = monthlyIncome * 0.4;
  return {
    isEligible: emiAmount <= maxEmi,
    maxEmi: Math.round(maxEmi),
    message: emiAmount <= maxEmi
      ? 'You can comfortably afford this EMI.'
      : `This EMI exceeds 40% of your income. Max recommended: ₹${Math.round(maxEmi).toLocaleString()}`,
  };
};

export const createLoan = async (loanData) => {
  try {
    const data = await graphqlRequest(`
      mutation($input: ApplyLoanInput!) {
        applyLoan(input: $input) { _id loan_id status }
      }
    `, {
      input: {
        loan_type: loanData.type || 'Personal Loan',
        loan_amount: Number(loanData.amount) || 0,
        interest_rate: Number(loanData.interestRate) || 10,
        tenure: Number(loanData.tenure) || 12,
        bank_name: loanData.bankName || 'SmartBank',
        notes: JSON.stringify(loanData)
      }
    });
    if (data?.applyLoan) {
      return { success: true, message: 'Loan submitted via GraphQL', applicationId: data.applyLoan.loan_id };
    }
  } catch (e) { console.warn('Backend loan create failed', e); }
  
  return { success: true, message: 'Mock Loan application submitted successfully.', applicationId: `LN-${Date.now()}` };
};
