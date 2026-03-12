import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, MessageSquare, PieChart, TrendingUp, 
  Landmark, CreditCard, FileText, HandCoins, Globe, Zap
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard',          path: '/',               icon: <LayoutDashboard size={20} /> },
    { name: 'AI Assistant',        path: '/assistant',      icon: <MessageSquare size={20} /> },
    { name: 'Expense Analyzer',    path: '/expenses',       icon: <PieChart size={20} /> },
    { name: 'Investments',         path: '/investments',    icon: <TrendingUp size={20} /> },
    { name: 'Compare Banks',       path: '/banks',          icon: <Landmark size={20} /> },
    { name: 'AI Loan Advisor',     path: '/loans',          icon: <HandCoins size={20} /> },
    { name: 'Smart Card Advisor',  path: '/cards',          icon: <CreditCard size={20} /> },
    { name: 'AI Forex Advisor',    path: '/forex',          icon: <Globe size={20} /> },
    { name: 'Market Opportunities', path: '/market',        icon: <Zap size={20} className="text-amber-500" /> },
    { name: 'Bank Account Guide',  path: '/account-guide',  icon: <FileText size={20} /> },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col hidden md:flex">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
          SmartBank AI
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">AI-Powered Banking Intelligence</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 mt-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-semibold group ${
                isActive 
                  ? 'bg-emerald-50 text-emerald-700 shadow-md border-l-4 border-l-emerald-500 border-y border-r border-emerald-100' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1'
              }`
            }
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 m-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
        <p className="text-xs font-semibold text-emerald-700">SmartBank AI v2.0</p>
        <p className="text-xs text-slate-500 mt-0.5">Powered by AI + MongoDB</p>
      </div>
    </aside>
  );
};

export default Sidebar;
