import { useState, useEffect } from 'react';
import { getDashboard } from '../services/apiService';
import { calculateFinancialHealthScore, getBudgetPlan } from '../services/aiService';

export const useDashboard = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [financialGoals, setFinancialGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await getDashboard();
        setUserProfile(data.userProfile);
        setFinancialGoals(data.financialGoals);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const healthScoreData = userProfile ? calculateFinancialHealthScore(userProfile.income, userProfile.expenses) : null;
  const budgetPlan = userProfile ? getBudgetPlan(userProfile.income) : null;

  return { userProfile, financialGoals, healthScoreData, budgetPlan, isLoading };
};
