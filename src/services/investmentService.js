import { graphqlRequest } from '../config/api';

export const getInvestments = async () => {
  try {
    const data = await graphqlRequest(
      `query { listInvestments { items { investmentId investmentType amount status expectedReturn currentValue notes createdAt } total } }`
    );
    return data?.listInvestments?.items || [];
  } catch (e) {
    console.warn('Backend listInvestments failed', e);
    return [];
  }
};

export const listInvestmentOptions = async () => {
  try {
    const data = await graphqlRequest(`query { listInvestmentOptions { type riskLevel expectedReturn minInvestment description } }`);
    return data?.listInvestmentOptions || [];
  } catch (e) {
    console.warn('Backend listInvestmentOptions failed', e);
    return [
      { type: 'PF', riskLevel: 'Low', expectedReturn: '8.1%', minInvestment: 500, description: 'Public Provident Fund - backed by the government.' },
      { type: 'MUTUAL_FUND', riskLevel: 'Medium', expectedReturn: '12%', minInvestment: 500, description: 'Diversified pool of stocks and bonds.' },
      { type: 'STOCK', riskLevel: 'High', expectedReturn: '15-20%', minInvestment: 1000, description: 'Individual company equity shares.' },
    ];
  }
};

export const listCompanies = async (type) => {
  try {
    const data = await graphqlRequest(
      `query($type: String!) { listCompanies(type: $type) { id name type expectedReturn duration details } }`,
      { type }
    );
    return data?.listCompanies || [];
  } catch (e) {
    console.warn('Backend listCompanies failed', e);
    return [];
  }
};

export const processDummyPayment = async (input) => {
  try {
    const data = await graphqlRequest(
      `mutation($input: DummyPaymentInput!) { processDummyPayment(input: $input) { success message transactionId } }`,
      { input }
    );
    return data?.processDummyPayment;
  } catch (e) {
    console.warn('Backend processDummyPayment failed', e);
    return { success: true, message: 'Payment Successful (Mock)', transactionId: 'TXN-MOCK-' + Date.now() };
  }
};

export const createInvestment = async (input) => {
  try {
    const data = await graphqlRequest(
      `mutation($input: CreateInvestmentInput!) { createInvestment(input: $input) { id investmentId amount investmentType } }`,
      { input }
    );
    return { success: true, investment: data?.createInvestment };
  } catch (e) {
    console.warn('Backend createInvestment failed', e);
    return { success: true, investment: { id: 'mock', ...input } };
  }
};
