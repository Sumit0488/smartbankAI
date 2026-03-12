/**
 * src/hooks/useTransactions.js
 * Fetches transactions and provides category grouping.
 */
import { useState, useEffect } from 'react';
import { getTransactions, getTransactionsByCategory, getMonthlySpending } from '../services/transactionService';

export const useTransactions = ({ category } = {}) => {
  const [transactions, setTransactions] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [monthlySpending, setMonthlySpending] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const [txResult, catResult, monthResult] = await Promise.all([
          getTransactions({ category }),
          getTransactionsByCategory(),
          getMonthlySpending(),
        ]);
        if (!cancelled) {
          setTransactions(txResult.transactions || txResult);
          setCategoryBreakdown(catResult);
          setMonthlySpending(monthResult);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [category]);

  return { transactions, categoryBreakdown, monthlySpending, isLoading, error };
};
