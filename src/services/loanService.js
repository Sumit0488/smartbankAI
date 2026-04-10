import { graphqlRequest } from '../config/api';

export const listLoanOptions = async () => {
  try {
    const data = await graphqlRequest(`query { listLoanOptions { type interestRate approvalTime maxAmount } }`);
    return data?.listLoanOptions || [];
  } catch (e) {
    console.warn('Backend listLoanOptions failed', e);
    return [
      { type: 'PERSONAL', interestRate: '10.5%', approvalTime: '24 Hours', maxAmount: 1500000 },
      { type: 'HOME', interestRate: '8.5%', approvalTime: '5-7 Days', maxAmount: 50000000 },
    ];
  }
};

export const listBanks = async (type) => {
  try {
    const data = await graphqlRequest(
      `query($type: String!) { listBanks(type: $type) { id bankName interestRate approvalTime maxLoanAmount } }`,
      { type }
    );
    return data?.listBanks || [];
  } catch (e) {
    console.warn('Backend listBanks failed', e);
    return [];
  }
};

export const getLoans = async () => {
  try {
    const data = await graphqlRequest(
      `query { listLoans { items { loanId loanType loanAmount interestRate tenure emi totalPayable status bankName appliedAt } total } }`
    );
    return data?.listLoans?.items || [];
  } catch (e) {
    console.warn('Backend listLoans failed', e);
    return [];
  }
};

// Alias used by apiService
export const createLoan = async (input) => applyLoan(input);

export const applyLoan = async (input) => {
  // Normalize field names to match backend ApplyLoanInput schema
  const normalized = {
    loanAmount: Number(input.loanAmount || input.amount || 0),
    loanType: (input.loanType || input.type || 'PERSONAL').toString().toUpperCase(),
    // Backend tenure is in months; UI passes tenure in years
    tenure: Number(input.tenure || 1) * 12,
    interestRate: parseFloat(String(input.interestRate || '10.5').replace('%', '')) || 10.5,
    bankName: input.bankName || input.bank || undefined,
    notes: input.notes || undefined,
  };
  try {
    const data = await graphqlRequest(
      `mutation($input: ApplyLoanInput!) { applyLoan(input: $input) { success message applicationId } }`,
      { input: normalized }
    );
    return data?.applyLoan;
  } catch (e) {
    console.warn('Backend applyLoan failed', e);
    return { success: true, message: 'Application Submitted (Mock)', applicationId: 'APP-MOCK-' + Date.now() };
  }
};
