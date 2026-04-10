import { useState, useEffect } from 'react';
import { getDashboard } from '../services/apiService';
import { getMonthlySpending } from '../services/transactionService';
import { calculateFinancialHealthScore, getBudgetPlan } from '../services/aiService';

export const useDashboard = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [financialGoals, setFinancialGoals] = useState([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [expenseByCategory, setExpenseByCategory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const now = new Date();
        const [data, spending] = await Promise.all([
          getDashboard(),
          getMonthlySpending(now.getFullYear(), now.getMonth() + 1),
        ]);
        setUserProfile(data.userProfile);
        setFinancialGoals(data.financialGoals);
        setMonthlyExpenses(spending?.totalSpend || 0);
        setExpenseByCategory(spending?.byCategory || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Backend returns `salary`; mock profile uses `income` — support both
  const income = userProfile ? (userProfile.income || userProfile.salary || 0) : 0;
  const healthScoreData = userProfile
    ? calculateFinancialHealthScore(income, {})
    : null;
  const budgetPlan = userProfile ? getBudgetPlan(income) : null;

  return { userProfile, financialGoals, healthScoreData, budgetPlan, isLoading, monthlyExpenses, expenseByCategory };
};
