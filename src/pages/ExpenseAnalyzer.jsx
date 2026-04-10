import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import {
  TrendingUp, TrendingDown, Loader2, RefreshCw,
  Sparkles, ShieldCheck, Target, PieChart as PieChartIcon,
  ChevronRight, ArrowUpRight, BarChart2, Lightbulb, AlertTriangle
} from 'lucide-react';
import { analyzeExpenses } from '../services/transactionService';

const CATEGORIES = [
  { key: 'food',     label: 'Food & Dining',  category: 'FOOD',      color: '#f59e0b', bg: 'bg-amber-50',   border: 'border-amber-200',   icon: '🍔' },
  { key: 'travel',   label: 'Travel & Fuel',  category: 'TRANSPORT', color: '#6366f1', bg: 'bg-indigo-50',  border: 'border-indigo-200',  icon: '✈️' },
  { key: 'shopping', label: 'Shopping',       category: 'SHOPPING',  color: '#ec4899', bg: 'bg-pink-50',    border: 'border-pink-200',    icon: '🛍️' },
  { key: 'rent',     label: 'Rent & Housing', category: 'HOUSING',   color: '#8b5cf6', bg: 'bg-violet-50',  border: 'border-violet-200',  icon: '🏠' },
  { key: 'other',    label: 'Other',          category: 'OTHER',     color: '#64748b', bg: 'bg-slate-50',   border: 'border-slate-200',   icon: '📦' },
];

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

const SavingsMeter = ({ rate }) => {
  const pct = Math.min(100, Math.max(0, Number(rate)));
  const color = pct >= 30 ? '#10b981' : pct >= 15 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative w-36 h-36">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="12" />
        <circle
          cx="60" cy="60" r="50" fill="none"
          stroke={color} strokeWidth="12"
          strokeDasharray={`${(pct / 100) * 314} 314`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-slate-800">{pct}%</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Savings</span>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-sm font-bold shadow-xl">
      <div>{payload[0].name}</div>
      <div className="text-emerald-400">₹{fmt(payload[0].value)}</div>
    </div>
  );
};

const ExpenseAnalyzer = () => {
  const [salary, setSalary] = useState('');
  const [amounts, setAmounts] = useState({ food: '', travel: '', shopping: '', rent: '', other: '' });
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  const totalExpenses = Object.values(amounts).reduce((s, v) => s + (Number(v) || 0), 0);

  const chartData = CATEGORIES
    .filter(c => Number(amounts[c.key]) > 0)
    .map(c => ({ name: c.label, value: Number(amounts[c.key]), color: c.color }));

  const top3 = [...chartData].sort((a, b) => b.value - a.value).slice(0, 3);
  const savingsAmt = Math.max(0, Number(salary) - totalExpenses);
  const liveRate = Number(salary) > 0 ? Math.round((savingsAmt / Number(salary)) * 100) : 0;

  const handleAnalyze = async () => {
    if (!salary || Number(salary) <= 0) { setError('Please enter your monthly salary.'); return; }
    setError('');
    setLoading(true);
    try {
      const expenses = CATEGORIES
        .filter(c => Number(amounts[c.key]) > 0)
        .map(c => ({ category: c.category, amount: Number(amounts[c.key]) }));
      const res = await analyzeExpenses(salary, expenses);
      setAnalysis(res);
    } catch (err) {
      setError('Analysis failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setSalary('');
    setAmounts({ food: '', travel: '', shopping: '', rent: '', other: '' });
    setError('');
  };

  return (
    <div className="max-w-6xl mx-auto pb-10 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-200">
              <PieChartIcon className="text-white" size={22} />
            </div>
            Smart Expense Advisor
          </h1>
          <p className="text-slate-500 font-medium mt-1">AI-powered financial health analysis from your spending</p>
        </div>
        {analysis && (
          <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-sm transition-all">
            <RefreshCw size={15} /> New Analysis
          </button>
        )}
      </div>

      {!analysis ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Salary + Inputs */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Monthly Salary / Income</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₹</span>
                <input
                  type="number"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="e.g. 60000"
                  className="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 focus:bg-white rounded-2xl text-xl font-black transition-all outline-none text-slate-800 placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Monthly Expenses</label>
                {totalExpenses > 0 && (
                  <span className="text-sm font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                    Total: ₹{fmt(totalExpenses)}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {CATEGORIES.map((cat) => (
                  <div key={cat.key} className={`relative p-4 ${cat.bg} border ${cat.border} rounded-2xl transition-all`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{cat.icon}</span>
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wide">{cat.label}</label>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        value={amounts[cat.key]}
                        onChange={(e) => setAmounts(prev => ({ ...prev, [cat.key]: e.target.value }))}
                        placeholder="0"
                        className="w-full pl-7 pr-3 py-2.5 bg-white border border-white/60 rounded-xl font-bold text-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-400 transition-all placeholder:text-slate-300"
                      />
                    </div>
                    {amounts[cat.key] > 0 && salary > 0 && (
                      <div className="mt-1.5 text-[10px] font-bold text-slate-400">
                        {Math.round((Number(amounts[cat.key]) / Number(salary)) * 100)}% of salary
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3 text-sm font-bold">
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading || !salary}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white rounded-2xl font-black text-base shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <><Loader2 className="animate-spin" size={20} /> Analyzing with AI...</>
              ) : (
                <><Sparkles size={18} /> Run AI Analysis <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </div>

          {/* Right: Live Preview */}
          <div className="space-y-5">
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Live Preview</h3>
              <div className="flex flex-col items-center gap-4">
                <SavingsMeter rate={liveRate} />
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-semibold">Salary</span>
                    <span className="font-black text-slate-800">₹{fmt(salary)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-semibold">Total Expenses</span>
                    <span className="font-black text-rose-600">−₹{fmt(totalExpenses)}</span>
                  </div>
                  <div className="border-t border-slate-100 pt-2 flex justify-between text-sm">
                    <span className="text-slate-500 font-semibold">Potential Savings</span>
                    <span className={`font-black ${savingsAmt >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ₹{fmt(savingsAmt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {chartData.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Expense Breakdown</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-2">
                  {chartData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-slate-500 font-semibold">{d.name}</span>
                      </div>
                      <span className="font-black text-slate-700">₹{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {top3.length > 0 && (
              <div className="bg-slate-900 rounded-3xl p-5 text-white">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Top Expenses</h3>
                <div className="space-y-2">
                  {top3.map((d, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-500">#{i + 1}</span>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-sm font-bold text-slate-200">{d.name}</span>
                      </div>
                      <span className="text-sm font-black text-white">₹{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Analysis Results */
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-5 rounded-3xl shadow-lg shadow-emerald-200">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Savings Rate</div>
              <div className="text-4xl font-black">{analysis.savingsRate}%</div>
              <div className="text-sm font-bold opacity-80 mt-1">₹{fmt(analysis.monthlySavings)}/month</div>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Expenses</div>
              <div className="text-3xl font-black text-slate-800">₹{fmt(analysis.totalExpenses)}</div>
              <div className="flex items-center gap-1 text-sm font-bold text-rose-500 mt-1">
                <TrendingDown size={14} /> Monthly outflow
              </div>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Disposable Income</div>
              <div className="text-3xl font-black text-indigo-600">₹{fmt(analysis.disposableIncome)}</div>
              <div className="flex items-center gap-1 text-sm font-bold text-slate-400 mt-1">
                <ArrowUpRight size={14} /> After expenses
              </div>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Emergency Fund</div>
              <div className="text-3xl font-black text-amber-600">₹{fmt(analysis.emergencyFund)}</div>
              <div className="text-sm font-bold text-slate-400 mt-1">3× monthly salary</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <PieChartIcon size={16} className="text-slate-400" />
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Distribution</h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {chartData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-slate-500 font-semibold truncate">{d.name}</span>
                    </div>
                    <span className="font-black text-slate-700 ml-2">
                      {analysis.totalExpenses > 0 ? Math.round((d.value / analysis.totalExpenses) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={16} className="text-slate-400" />
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Category Breakdown</h3>
              </div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 text-white rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <Target size={16} className="text-slate-400" />
                <h3 className="text-sm font-black uppercase tracking-widest">Top 3 Expenses</h3>
              </div>
              <div className="space-y-4">
                {top3.map((d, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-black text-xs">#{i + 1}</span>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="font-bold text-slate-200">{d.name}</span>
                      </div>
                      <span className="font-black">₹{fmt(d.value)}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, (d.value / top3[0].value) * 100)}%`, backgroundColor: d.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <Lightbulb size={16} className="text-amber-500" />
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">AI Recommendations</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Short Term</div>
                    <p className="text-sm font-semibold text-emerald-900">{analysis.shortTermInvestment}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                  <TrendingUp size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Long Term</div>
                    <p className="text-sm font-semibold text-blue-900">{analysis.longTermInvestment}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-slate-900 text-white rounded-2xl">
                  <Sparkles size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">AI Insight</div>
                    <p className="text-sm font-semibold leading-relaxed italic">"{analysis.advice}"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default ExpenseAnalyzer;
