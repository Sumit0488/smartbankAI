/**
 * src/hooks/useLoans.js
 * Wraps loanService with loading/error state.
 */
import { useState, useEffect } from 'react';
import { getLoans } from '../services/loanService';

export const useLoans = () => {
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const data = await getLoans();
        if (!cancelled) setLoans(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, []);

  return { loans, isLoading, error };
};
