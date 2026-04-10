import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  ArrowUpRight, ArrowDownRight, Wallet, CreditCard as CreditCardIcon,
  Landmark, Info, ShieldCheck, Sparkles, Bell, PiggyBank, Receipt, HandCoins, CalendarClock,
  PieChart as PieChartIcon, TrendingUp, Globe, Zap, MessageSquare, FileText, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const QUICK_ACTIONS = [
  {
    label: 'AI Assistant',
    description: 'Chat with your personal finance AI',
    path: '/assistant',
    gradient: 'from-violet-500 to-purple-600',
    shadow: 'shadow-violet-500/20',
    icon: <MessageSquare size={22} className="text-white" />,
    badge: 'AI',
    badgeColor: 'bg-violet-400/30 text-violet-100',
  },
  {
    label: 'Expense Analyzer',
    description: 'AI-powered spending insights',
    path: '/expenses',
    gradient: 'from-emerald-500 to-teal-600',
    shadow: 'shadow-emerald-500/20',
    icon: <PieChartIcon size={22} className="text-white" />,
    badge: 'Smart',
    badgeColor: 'bg-emerald-400/30 text-emerald-100',
  },
  {
    label: 'Investments',
    description: 'Grow your wealth with AI guidance',
    path: '/investments',
    gradient: 'from-blue-500 to-indigo-600',
    shadow: 'shadow-blue-500/20',
    icon: <TrendingUp size={22} className="text-white" />,
    badge: 'New',
    badgeColor: 'bg-blue-400/30 text-blue-100',
  },
  {
    label: 'Compare Banks',
    description: 'Find the best rates & offers',
    path: '/banks',
    gradient: 'from-amber-500 to-orange-600',
    shadow: 'shadow-amber-500/20',
    icon: <Landmark size={22} className="text-white" />,
    badge: null,
    badgeColor: '',
  },
  {
    label: 'Loan Advisor',
    description: 'Smart loan comparison & apply',
    path: '/loans',
    gradient: 'from-rose-500 to-pink-600',
    shadow: 'shadow-rose-500/20',
    icon: <HandCoins size={22} className="text-white" />,
    badge: null,
    badgeColor: '',
  },
  {
    label: 'Smart Cards',
    description: 'Best credit & debit card picks',
    path: '/cards',
    gradient: 'from-slate-700 to-slate-900',
    shadow: 'shadow-slate-500/20',
    icon: <CreditCardIcon size={22} className="text-white" />,
    badge: null,
    badgeColor: '',
  },
  {
    label: 'Forex Advisor',
    description: 'Live rates & currency exchange',
    path: '/forex',
    gradient: 'from-cyan-500 to-blue-600',
    shadow: 'shadow-cyan-500/20',
    icon: <Globe size={22} className="text-white" />,
    badge: 'Live',
    badgeColor: 'bg-cyan-400/30 text-cyan-100',
  },
  {
    label: 'Market Watch',
    description: 'Opportunities & market signals',
    path: '/market',
    gradient: 'from-yellow-500 to-amber-600',
    shadow: 'shadow-yellow-500/20',
    icon: <Zap size={22} className="text-white" />,
    badge: 'Hot',
    badgeColor: 'bg-yellow-400/30 text-yellow-100',
  },
];

import DashboardHeader from '../components/dashboard/DashboardHeader';
import RecentActivity from '../components/dashboard/RecentActivity';
import QuickStatsGrid from '../components/dashboard/QuickStatsGrid';
import FinancialHealthScore from '../components/dashboard/FinancialHealthScore';
import ChartsRow from '../components/dashboard/ChartsRow';
import AIBudgetPlanner from '../components/dashboard/AIBudgetPlanner';
import FinancialGoals from '../components/dashboard/FinancialGoals';
import AIExpensePrediction from '../components/dashboard/AIExpensePrediction';
import MonthlyFinancialOverview from '../components/dashboard/MonthlyFinancialOverview';
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
  const { userProfile, financialGoals, healthScoreData, budgetPlan, isLoading, monthlyExpenses, expenseByCategory } = useDashboard();

  const expenseData = useMemo(() => {
    if (expenseByCategory && expenseByCategory.length > 0) {
      return expenseByCategory.map(c => ({
        name: c.category.charAt(0) + c.category.slice(1).toLowerCase(),
        value: c.total,
      }));
    }
    return [];
  }, [expenseByCategory]);
  
  if (isLoading || !userProfile) {
    return <div className="p-8 text-center text-slate-500 font-medium animate-pulse">Loading dashboard...</div>;
  }

  // Backend returns `salary`; mock profile uses `income` — support both
  const income = userProfile.income || userProfile.salary || 0;
  // monthlyExpenses comes from real Expense collection (current month aggregate)
  const totalExpenses = monthlyExpenses;
  const totalSavings = income - totalExpenses;
  const savingsRate = income > 0 ? ((totalSavings / income) * 100).toFixed(1) : 0;
  const totalBalance = 142500; // Mocked Total Balance for dashboard
  


  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">

      {/* Header & AI Notifications */}
      <DashboardHeader userProfile={userProfile} />

      {/* Quick Actions Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Quick Actions</h2>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">All Features</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              className={`relative group flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gradient-to-br ${action.gradient} shadow-lg ${action.shadow} hover:scale-105 hover:shadow-xl transition-all duration-200 overflow-hidden`}
            >
              <div className="pointer-events-none absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
              {action.badge && (
                <span className={`absolute top-2 right-2 text-[9px] font-black px-1.5 py-0.5 rounded-full ${action.badgeColor}`}>
                  {action.badge}
                </span>
              )}
              <div className="p-2.5 bg-white/15 rounded-xl border border-white/20 backdrop-blur-sm">
                {action.icon}
              </div>
              <span className="text-white text-[11px] font-black text-center leading-tight">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

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

      {/* Monthly Financial Overview */}
      <MonthlyFinancialOverview />

      {/* Financial Planning Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <AIBudgetPlanner income={userProfile.income} currentExpenses={userProfile.expenses} budgetPlan={budgetPlan} />
         <AIExpensePrediction currentExpenses={userProfile.expenses} />
      </div>

      {/* Goals Section */}
      <FinancialGoals goals={financialGoals} />

      {/* Recent Activity */}
      <RecentActivity />

      {/* Disclaimer Section */}
      <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center mt-8 text-slate-500">
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
