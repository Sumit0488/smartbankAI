import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';

// Pages
import Dashboard from './pages/Dashboard';
import AIAssistant from './pages/AIAssistant';
import ExpenseAnalyzer from './pages/ExpenseAnalyzer';
import BankComparison from './pages/BankComparison';
import Investments from './pages/Investments';
import CreditCards from './pages/CreditCards';
import AILoanAdvisor from './pages/AILoanAdvisor';
import AccountGuide from './pages/AccountGuide';
import MarketOpportunities from './pages/MarketOpportunities';
import ForexAdvisor from './pages/ForexAdvisor';

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="assistant" element={<AIAssistant />} />
        <Route path="expenses" element={<ExpenseAnalyzer />} />
        <Route path="investments" element={<Investments />} />
        <Route path="banks" element={<BankComparison />} />
        <Route path="loans" element={<AILoanAdvisor />} />
        <Route path="cards" element={<CreditCards />} />
        <Route path="forex" element={<ForexAdvisor />} />
        <Route path="market" element={<MarketOpportunities />} />
        <Route path="account-guide" element={<AccountGuide />} />
        
        {/* Fallback for anything else to Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
