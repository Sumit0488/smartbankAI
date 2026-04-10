import React from 'react';
import { Sparkles, Bell, TrendingUp, Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import NotificationBell from '../shared/NotificationBell';

const DashboardHeader = ({ userProfile }) => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 shadow-2xl">
        {/* Background glows */}
        <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 bg-violet-500/10 rounded-full blur-3xl" />

        {/* Notification Bell — top right */}
        <div className="absolute top-4 right-4 z-20">
          <NotificationBell />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Left: Greeting */}
          <div className="space-y-1">
            <p className="text-slate-400 text-sm font-medium">{today}</p>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">{userProfile?.name || 'Alex'}</span> 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1">Your AI-powered financial overview is ready.</p>

            {/* Status pills */}
            <div className="flex flex-wrap gap-2 pt-3">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Portfolio Active
              </span>
              <span className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold px-3 py-1 rounded-full">
                <Shield size={11} />
                Bank-Grade Security
              </span>
              <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold px-3 py-1 rounded-full">
                <Zap size={11} />
                AI Insights Ready
              </span>
            </div>
          </div>

          {/* Right: AI Notification Card */}
          <div className="w-full md:w-auto md:min-w-[340px] bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-indigo-500 p-2 rounded-xl text-white shrink-0 shadow-lg shadow-indigo-500/30">
                <Sparkles size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">AI Daily Insight</p>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">New</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">Your food expenses are ₹40 above average. Consider moving the surplus to your Emergency Fund today.</p>
              </div>
            </div>

            {userProfile?.activeLoan && (
              <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                <Bell size={16} className="text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-amber-400 uppercase mb-0.5">EMI Alert</p>
                  <p className="text-xs text-slate-300">
                    <strong className="text-white">₹{userProfile.activeLoan.emi.toLocaleString()}</strong> due on <strong className="text-white">{userProfile.activeLoan.nextPaymentDate}</strong>
                  </p>
                </div>
                <Link to="/loans" className="shrink-0 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-amber-500/30 transition-colors whitespace-nowrap">
                  Manage
                </Link>
              </div>
            )}

            <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
              <TrendingUp size={12} />
              <span>Portfolio performance: <strong className="text-emerald-400">+12.4%</strong> this year</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
