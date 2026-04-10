import React from 'react';
import { ArrowUpRight, ArrowDownRight, Landmark, Wallet, Receipt, PiggyBank } from 'lucide-react';

const QuickStatsGrid = ({ totalBalance, income, totalExpenses, savingsRate }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

      {/* Total Balance — gradient hero card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-800 p-6 shadow-xl shadow-indigo-500/20 group hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-300">
        <div className="pointer-events-none absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-24 h-24 bg-violet-400/20 rounded-full blur-xl" />
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <p className="text-indigo-200 text-sm font-semibold">Total Balance</p>
            <div className="p-2 bg-white/15 rounded-xl border border-white/20">
              <Landmark size={18} className="text-white" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-white tracking-tight">₹{(totalBalance || 0).toLocaleString()}</h3>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 bg-white/15 text-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded-md border border-white/20">
              <ArrowUpRight size={12} /> +5.2% vs last month
            </span>
          </div>
        </div>
      </div>

      {/* Monthly Income */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 shadow-sm group hover:shadow-md hover:border-emerald-200 hover:-translate-y-0.5 transition-all duration-300">
        <div className="pointer-events-none absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-bl-full" />
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <p className="text-slate-500 text-sm font-semibold">Monthly Income</p>
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Wallet size={18} className="text-emerald-600" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">₹{(income || 0).toLocaleString()}</h3>
          <div className="mt-3">
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-md border border-emerald-100">
              <ArrowUpRight size={12} /> Consistent
            </span>
          </div>
        </div>
        {/* Mini bar decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-300 opacity-60 rounded-b-2xl" />
      </div>

      {/* Monthly Expenses */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 shadow-sm group hover:shadow-md hover:border-rose-200 hover:-translate-y-0.5 transition-all duration-300">
        <div className="pointer-events-none absolute top-0 right-0 w-20 h-20 bg-rose-50 rounded-bl-full" />
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <p className="text-slate-500 text-sm font-semibold">Monthly Expenses</p>
            <div className="p-2 bg-rose-100 rounded-xl">
              <Receipt size={18} className="text-rose-600" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">₹{(totalExpenses || 0).toLocaleString()}</h3>
          <div className="mt-3">
            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-[11px] font-bold px-2 py-0.5 rounded-md border border-rose-100">
              <ArrowUpRight size={12} /> +4% vs last month
            </span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 to-pink-400 opacity-60 rounded-b-2xl" />
      </div>

      {/* Savings Rate */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 shadow-sm group hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-300">
        <div className="pointer-events-none absolute top-0 right-0 w-20 h-20 bg-indigo-50 rounded-bl-full" />
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <p className="text-slate-500 text-sm font-semibold">Savings Rate</p>
            <div className="p-2 bg-indigo-100 rounded-xl">
              <PiggyBank size={18} className="text-indigo-600" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-indigo-600 tracking-tight">{savingsRate}%</h3>
          {/* Progress bar */}
          <div className="mt-3 space-y-1.5">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Number(savingsRate))}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 inline-flex items-center gap-1">
              <ArrowUpRight size={12} /> +2.1% progress
            </span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 to-violet-400 opacity-60 rounded-b-2xl" />
      </div>

    </div>
  );
};

export default QuickStatsGrid;
