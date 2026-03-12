import React from 'react';
import { ArrowUpRight, Landmark, Wallet, Receipt, PiggyBank } from 'lucide-react';

const QuickStatsGrid = ({ totalBalance, income, totalExpenses, savingsRate }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Balance Card */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -z-0 transition-transform group-hover:scale-110" />
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">Total Balance</p>
              <h3 className="text-2xl font-black text-white mt-1 tracking-tight">₹{totalBalance.toLocaleString()}</h3>
            </div>
            <div className="p-2.5 bg-slate-800 text-indigo-400 rounded-xl border border-slate-700 mt-1">
              <Landmark size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs">
            <span className="flex items-center text-emerald-400 font-bold bg-slate-800/80 px-1.5 py-0.5 rounded-md border border-slate-700">
              <ArrowUpRight size={14} className="mr-0.5"/> +5.2% vs last mo
            </span>
          </div>
        </div>
      </div>

      {/* Monthly Income Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full -z-0 transition-transform group-hover:scale-110" />
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Monthly Income</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">₹{income.toLocaleString()}</h3>
            </div>
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl mt-1">
              <Wallet size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs">
            <span className="flex items-center text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md">
              <ArrowUpRight size={14} className="mr-0.5"/> Consistent
            </span>
          </div>
        </div>
      </div>

      {/* Monthly Expenses Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-rose-200 transition-colors">
        <div className="absolute top-0 right-0 w-16 h-16 bg-rose-50 rounded-bl-full -z-0 transition-transform group-hover:scale-110" />
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Monthly Expenses</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">₹{totalExpenses.toLocaleString()}</h3>
            </div>
            <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl mt-1">
              <Receipt size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs">
            <span className="flex items-center text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded-md">
              <ArrowUpRight size={14} className="mr-0.5"/> +4% vs last mo
            </span>
          </div>
        </div>
      </div>

      {/* Savings Rate Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-colors">
        <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-bl-full -z-0 transition-transform group-hover:scale-110" />
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Savings Rate</p>
              <h3 className="text-2xl font-black text-indigo-600 mt-1 tracking-tight">{savingsRate}%</h3>
            </div>
            <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl mt-1">
              <PiggyBank size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs">
             <span className="flex items-center text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md">
               <ArrowUpRight size={14} className="mr-0.5"/> +2.1% progress
             </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickStatsGrid;
