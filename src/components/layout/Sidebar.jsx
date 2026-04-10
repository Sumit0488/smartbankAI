import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, PieChart, TrendingUp,
  Landmark, CreditCard, FileText, HandCoins, Globe, Zap, LogOut, User, ChevronRight, Sun, Moon
} from 'lucide-react';
import { useAuth } from '../../contexts/AppContext';

const navItems = [
  { name: 'Dashboard',           path: '/',               icon: LayoutDashboard, color: 'text-indigo-400' },
  { name: 'AI Assistant',         path: '/assistant',      icon: MessageSquare,   color: 'text-violet-400' },
  { name: 'Expense Analyzer',     path: '/expenses',       icon: PieChart,        color: 'text-emerald-400' },
  { name: 'Investments',          path: '/investments',    icon: TrendingUp,      color: 'text-blue-400' },
  { name: 'Compare Banks',        path: '/banks',          icon: Landmark,        color: 'text-amber-400' },
  { name: 'AI Loan Advisor',      path: '/loans',          icon: HandCoins,       color: 'text-rose-400' },
  { name: 'Smart Card Advisor',   path: '/cards',          icon: CreditCard,      color: 'text-slate-400' },
  { name: 'AI Forex Advisor',     path: '/forex',          icon: Globe,           color: 'text-cyan-400' },
  { name: 'Market Opportunities', path: '/market',         icon: Zap,             color: 'text-yellow-400' },
  { name: 'Bank Account Guide',   path: '/account-guide',  icon: FileText,        color: 'text-teal-400' },
];

const Sidebar = () => {
  const { logout, user, isAuthenticated, darkMode, toggleDarkMode } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-white/5 h-screen sticky top-0 flex flex-col hidden md:flex shadow-2xl">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/5">
        <Link to="/" className="block">
          <h1 className="text-xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent tracking-tight">
            SmartBank AI
          </h1>
          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">AI-Powered Banking Intelligence</p>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-3 pb-2">Navigation</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-semibold text-sm relative overflow-hidden ${
                  isActive
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-emerald-400 rounded-r-full" />
                  )}
                  <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-white/10' : 'bg-transparent group-hover:bg-white/5'}`}>
                    <Icon size={16} className={isActive ? 'text-emerald-400' : item.color} />
                  </div>
                  <span className="flex-1 truncate">{item.name}</span>
                  {isActive && <ChevronRight size={14} className="text-slate-500 shrink-0" />}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User section + logout */}
      <div className="px-3 pb-4 space-y-2 border-t border-white/5 pt-3">
        {isAuthenticated && (
          <Link
            to="/account-guide"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
              <User size={14} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-200 truncate">{user?.name || 'SmartBank Student'}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email || 'student@smartbank.ai'}</p>
            </div>
            <ChevronRight size={14} className="text-slate-600 shrink-0 group-hover:text-slate-400 transition-colors" />
          </Link>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-200 font-semibold text-sm group"
        >
          <div className="p-1.5 rounded-lg group-hover:bg-rose-500/10 transition-colors">
            <LogOut size={16} />
          </div>
          Sign Out
        </button>

        <div className="mx-3 px-3 py-2.5 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/20">
          <p className="text-[10px] font-black text-emerald-400">SmartBank AI v2.0</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Powered by AI + MongoDB</p>
        </div>

        {/* Dark / Light Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all duration-200 font-semibold text-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg">
              {darkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-400" />}
            </div>
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
          <div className={`w-9 h-5 rounded-full transition-colors duration-300 relative ${darkMode ? 'bg-emerald-500' : 'bg-slate-700'}`}>
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${darkMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
