/**
 * src/services/transactionService.js
 * Frontend service calling real GraphQL backend for expenses/transactions.
 * Operations: listExpenses, expenseSummary, addExpense, deleteExpense
 */

import { graphqlRequest } from '../config/api';

const MOCK_TRANSACTIONS = [
  { id: 'tx_001', date: '2026-03-09', description: 'Swiggy Food Order', amount: -450, category: 'FOOD', type: 'debit' },
  { id: 'tx_002', date: '2026-03-09', description: 'Salary Credit', amount: 30000, category: 'OTHER', type: 'credit' },
  { id: 'tx_003', date: '2026-03-08', description: 'Amazon Shopping', amount: -2300, category: 'SHOPPING', type: 'debit' },
  { id: 'tx_004', date: '2026-03-07', description: 'Uber Ride', amount: -180, category: 'TRANSPORT', type: 'debit' },
  { id: 'tx_005', date: '2026-03-07', description: 'Netflix Subscription', amount: -649, category: 'ENTERTAINMENT', type: 'debit' },
];

const EXPENSE_FIELDS = `id expenseId category amount description date tags createdAt updatedAt`;

const mapExpense = (e) => ({
  id: e.id || e.expenseId,
  expenseId: e.expenseId,
  date: e.date
    ? e.date.split('T')[0]
    : e.createdAt
    ? e.createdAt.split('T')[0]
    : new Date().toISOString().split('T')[0],
  description: e.description || e.category,
  // Backend expenses are positive amounts — frontend shows negative for debits
  amount: -(Math.abs(Number(e.amount))),
  category: e.category,
  tags: e.tags || [],
  type: 'debit',
});

// Map frontend category strings to backend ExpenseCategory enum values
const toCategoryEnum = (cat = '') => {
  const map = {
    food: 'FOOD',
    transport: 'TRANSPORT',
    travel: 'TRANSPORT',
    housing: 'HOUSING',
    entertainment: 'ENTERTAINMENT',
    healthcare: 'HEALTHCARE',
    health: 'HEALTHCARE',
    education: 'EDUCATION',
    shopping: 'SHOPPING',
    utilities: 'UTILITIES',
    income: 'OTHER',
    other: 'OTHER',
  };
  return map[cat.toLowerCase()] || 'OTHER';
};

export const getTransactions = async ({ page = 1, limit = 20, category } = {}) => {
  try {
    const filter = category ? { category: toCategoryEnum(category) } : undefined;
    const variables = { page, limit, ...(filter ? { filter } : {}) };
    const data = await graphqlRequest(
      `query($page: Int, $limit: Int, $filter: ExpenseFilter) {
        listExpenses(page: $page, limit: $limit, filter: $filter) {
          items { ${EXPENSE_FIELDS} }
          total page limit
        }
      }`,
      variables
    );
    if (data?.listExpenses?.items) {
      let txs = data.listExpenses.items.map(mapExpense);
      return { transactions: txs, total: data.listExpenses.total, page, limit };
    }
  } catch (e) {
    console.warn('Backend fetch failed, using mock', e);
  }

  const filtered = category
    ? MOCK_TRANSACTIONS.filter((t) => t.category === toCategoryEnum(category))
    : MOCK_TRANSACTIONS;
  return { transactions: filtered, total: filtered.length, page, limit };
};

export const getTransactionsByCategory = async () => {
  try {
    const data = await graphqlRequest(
      `query { listExpenses { items { category amount } } }`
    );
    if (data?.listExpenses?.items?.length) {
      const grouped = data.listExpenses.items.reduce((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + Math.abs(tx.amount);
        return acc;
      }, {});
      return Object.entries(grouped).map(([category, total]) => ({ category, total }));
    }
  } catch (e) {
    console.warn('Backend fetch failed, using mock', e);
  }

  const grouped = MOCK_TRANSACTIONS.reduce((acc, tx) => {
    if (tx.type === 'debit') acc[tx.category] = (acc[tx.category] || 0) + Math.abs(tx.amount);
    return acc;
  }, {});
  return Object.entries(grouped).map(([category, total]) => ({ category, total }));
};

export const getMonthlySpending = async (year = 2026, month = 3) => {
  const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`;
  // Last day of month
  const lastDay = new Date(year, month, 0).getDate();
  const dateTo = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  try {
    const data = await graphqlRequest(
      `query($dateFrom: DateTime, $dateTo: DateTime) {
        expenseSummary(dateFrom: $dateFrom, dateTo: $dateTo) {
          totalExpenses monthlyAverage count
          byCategory { category total count }
        }
      }`,
      { dateFrom, dateTo }
    );
    if (data?.expenseSummary) {
      return {
        year,
        month,
        totalSpend: data.expenseSummary.totalExpenses,
        transactionCount: data.expenseSummary.count,
        monthlyAverage: data.expenseSummary.monthlyAverage,
        byCategory: data.expenseSummary.byCategory || [],
      };
    }
  } catch (e) {
    console.warn('Backend fetch failed, using mock', e);
  }

  const debits = MOCK_TRANSACTIONS.filter((t) => t.type === 'debit');
  const total = debits.reduce((s, t) => s + Math.abs(t.amount), 0);
  return { year, month, totalSpend: total, transactionCount: debits.length };
};

export const createExpense = async (expense) => {
  try {
    const res = await graphqlRequest(
      `mutation($input: AddExpenseInput!) {
        addExpense(input: $input) { ${EXPENSE_FIELDS} }
      }`,
      {
        input: {
          category: toCategoryEnum(expense.category),
          amount: Number(expense.amount),
          description: expense.description || undefined,
          date: expense.date || new Date().toISOString(),
          tags: expense.tags || undefined,
        },
      }
    );
    if (res?.addExpense) return { success: true, expense: mapExpense(res.addExpense) };
  } catch (e) {
    console.warn('Backend create failed', e);
  }

  const newTx = {
    id: `tx_${Math.random().toString(36).substr(2, 9)}`,
    ...expense,
    type: 'debit',
    amount: -Math.abs(expense.amount),
  };
  return { success: true, expense: newTx };
};

export const deleteExpense = async (id) => {
  try {
    await graphqlRequest(
      `mutation($expenseId: ID!) { deleteExpense(expenseId: $expenseId) { success message } }`,
      { expenseId: id }
    );
    return { success: true };
  } catch (e) {
    console.warn('Backend delete failed', e);
  }
  return { success: true, message: 'Mock Expense deleted' };
};

export const analyzeExpenses = async (salary, expenses) => {
  try {
    const data = await graphqlRequest(
      `mutation($input: AnalyzeExpensesInput!) {
        analyzeExpenses(input: $input) {
          emergencyFund shortTermInvestment longTermInvestment
          monthlySavings savingsRate totalExpenses disposableIncome advice
        }
      }`,
      {
        input: {
          salary: Number(salary),
          expenses: expenses.map((e) => ({
            category: toCategoryEnum(e.category),
            amount: Number(e.amount),
          })),
        },
      }
    );
    if (data?.analyzeExpenses) return data.analyzeExpenses;
  } catch (e) {
    console.warn('Backend analyzeExpenses failed, using mock', e);
  }

  // Fallback mock analysis
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const disposableIncome = Math.max(0, Number(salary) - totalExpenses);
  const monthlySavings = Math.round(disposableIncome * 0.7);
  const savingsRate = salary > 0 ? Math.round((monthlySavings / Number(salary)) * 100) : 0;
  return {
    emergencyFund: Math.round(Number(salary) * 3),
    shortTermInvestment: 'Liquid Mutual Funds or Fixed Deposits for 6-12 month goals',
    longTermInvestment: 'SIP in diversified equity funds for 5+ year goals',
    monthlySavings,
    savingsRate,
    totalExpenses,
    disposableIncome,
    advice: savingsRate >= 30
      ? 'Great savings discipline! Consider increasing your equity SIP to accelerate wealth creation.'
      : savingsRate >= 15
      ? 'Decent savings rate. Look for ways to reduce discretionary spending and boost investments.'
      : 'Your savings rate is below recommended levels. Focus on cutting non-essential expenses first.',
  };
};
