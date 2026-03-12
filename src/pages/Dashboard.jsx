import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  ArrowUpRight, ArrowDownRight, Wallet, CreditCard as CreditCardIcon, 
  Landmark, Info, ShieldCheck, Sparkles, Bell, PiggyBank, Receipt, HandCoins, CalendarClock 
} from 'lucide-react';
import { Link } from 'react-router-dom';

import DashboardHeader from '../components/dashboard/DashboardHeader';
import QuickStatsGrid from '../components/dashboard/QuickStatsGrid';
import FinancialHealthScore from '../components/dashboard/FinancialHealthScore';
import ChartsRow from '../components/dashboard/ChartsRow';
import AIBudgetPlanner from '../components/dashboard/AIBudgetPlanner';
import FinancialGoals from '../components/dashboard/FinancialGoals';
import AIExpensePrediction from '../components/dashboard/AIExpensePrediction';
import { useDashboard } from '../hooks/useDashboard';

const mockChartData = [
  { name: 'Jan', balance: 4000 },
  { name: 'Feb', balance: 3000 },
  { name: 'Mar', balance: 5500 },
  { name: 'Apr', balance: 4500 },
  { name: 'May', balance: 6000 },
  { name: 'Jun', balance: 8500 },
];

const COLORS = ['#10b981', '#6366f1', '#f43f5e', '#f59e0b', '#8b5cf6'];

const Dashboard = () => {
  const { userProfile, financialGoals, healthScoreData, budgetPlan, isLoading } = useDashboard();
  
  const expenseData = useMemo(() => {
    if (!userProfile || !userProfile.expenses) return [];
    return Object.entries(userProfile.expenses)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }));
  }, [userProfile]);
  
  if (isLoading || !userProfile) {
    return <div className="p-8 text-center text-slate-500 font-medium animate-pulse">Loading dashboard...</div>;
  }

  const expenses = userProfile.expenses || {};
  const income = userProfile.income || 0;
  
  const totalExpenses = Object.values(expenses).reduce((a, b) => a + b, 0);
  const totalSavings = income - totalExpenses;
  const savingsRate = income > 0 ? ((totalSavings / income) * 100).toFixed(1) : 0;
  const totalBalance = 142500; // Mocked Total Balance for dashboard
  


  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header & AI Notifications */}
      <DashboardHeader userProfile={userProfile} />

      {/* Quick Stats Grid (4 Cards) */}
      <QuickStatsGrid 
        totalBalance={totalBalance} 
        income={userProfile.income} 
        totalExpenses={totalExpenses} 
        savingsRate={savingsRate} 
      />

      {/* AI Financial Health Score Block */}
      <FinancialHealthScore scoreData={healthScoreData} />

      {/* Charts Row */}
      <ChartsRow 
        mockChartData={mockChartData} 
        expenseData={expenseData} 
        totalExpenses={totalExpenses} 
      />

      {/* Financial Planning Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <AIBudgetPlanner income={userProfile.income} currentExpenses={userProfile.expenses} budgetPlan={budgetPlan} />
         <AIExpensePrediction currentExpenses={userProfile.expenses} />
      </div>

      {/* Goals Section */}
      <FinancialGoals goals={financialGoals} />

      {/* Disclaimer Section */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center mt-8 text-slate-500">
         <ShieldCheck size={28} className="mx-auto text-emerald-500 mb-3" />
         <h4 className="font-bold text-sm text-slate-700 mb-1">Bank-Grade Financial Safety</h4>
         <p className="text-xs max-w-2xl mx-auto leading-relaxed text-slate-500">
           SmartBank AI leverages encrypted protocols and anonymized data modeling to generate recommendations. 
           We never store identifiable PII permanently. Calculations shown are AI predictions and simulate outcomes—always consult certified financial advisors for professional planning.
         </p>
      </div>

    </div>
  );
};

export default Dashboard;
