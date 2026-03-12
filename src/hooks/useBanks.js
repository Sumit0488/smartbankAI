import { useState, useEffect } from 'react';
import { getBanks } from '../services/apiService';

export const useBanks = () => {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const data = await getBanks();
        setBanks(data);
      } catch (error) {
        console.error("Error fetching banks:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanks();
  }, []);

  return { banks, loading };
};
