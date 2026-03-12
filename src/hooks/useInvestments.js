import { useState, useEffect } from 'react';
import { getInvestments } from '../services/apiService';

export const useInvestments = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        const data = await getInvestments();
        setInvestments(data);
      } catch (error) {
        console.error("Error fetching investments:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvestments();
  }, []);

  return { investments, loading };
};
