import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import {
  Receipt, TrendingUp, PiggyBank, Loader2, BarChart2, RefreshCw,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { getMonthlySpending } from '../../services/transactionService';
import { getInvestments } from '../../services/investmentService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Returns last N months as [{year, month, label}] ending with current month */
function lastNMonths(n = 6) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1, label: MONTH_LABELS[d.getMonth()] };
  });
}

/** Group investments by year-month, summing amounts */
function groupInvestmentsByMonth(investments, months) {
  const map = {};
  for (const inv of investments) {
    const d = inv.createdAt ? new Date(inv.createdAt) : null;
    if (!d) continue;
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    map[key] = (map[key] || 0) + (inv.amount || 0);
  }
  return months.map(m => map[`${m.year}-${m.month}`] || 0);
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 dark:bg-slate-700 text-white px-4 py-3 rounded-xl shadow-2xl text-sm min-w-[160px]">
      <p className="font-black text-slate-300 mb-2 text-xs uppercase tracking-wider">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.fill }} />
            {p.name}
          </span>
          <span className="font-black" style={{ color: p.fill }}>
            ₹{Number(p.value).toLocaleString('en-IN')}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Summary Card ─────────────────────────────────────────────────────────────

const SummaryCard = ({ icon: Icon, label, value, iconBg, iconColor, borderColor, trend }) => (
  <div className={`relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border ${borderColor} dark:border-slate-700 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}>
    <div className="flex items-start justify-between mb-3">
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      <div className={`p-2 ${iconBg} rounded-xl`}>
        <Icon size={16} className={iconColor} />
      </div>
    </div>
    <p className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
      ₹{Number(value || 0).toLocaleString('en-IN')}
    </p>
    {trend !== undefined && (
      <div className="mt-2">
        <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md ${
          trend >= 0
            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
            : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
        }`}>
          This month
        </span>
      </div>
    )}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const MonthlyFinancialOverview = () => {
  const { userProfile } = useApp();
  const [chartData, setChartData]     = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const income = userProfile
    ? (userProfile.monthlyIncome || userProfile.salary || 0)
    : 0;

  const months = useMemo(() => lastNMonths(6), []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch expenses for each of the last 6 months in parallel
      const [expenseResults, investments] = await Promise.all([
        Promise.all(months.map(m => getMonthlySpending(m.year, m.month))),
        getInvestments(),
      ]);

      const investmentAmounts = groupInvestmentsByMonth(investments, months);

      const built = months.map((m, idx) => {
        const expenses    = +(expenseResults[idx]?.totalSpend || 0).toFixed(0);
        const invested    = +investmentAmounts[idx].toFixed(0);
        const savings     = Math.max(0, income - expenses - invested);
        return {
          month:       m.label,
          Expenses:    expenses,
          Investments: invested,
          Savings:     savings,
        };
      });

      setChartData(built);
      setLastRefresh(new Date());
    } catch (err) {
      console.warn('[MonthlyFinancialOverview] fetch failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [income]);  // re-fetch if income changes

  // Current month summary
  const current = chartData[chartData.length - 1] || {};

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 size={18} className="text-indigo-500" />
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Monthly Financial Overview
          </h2>
          <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
            6 Months
          </span>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Chart card */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
        {isLoading ? (
          <div className="h-56 flex items-center justify-center gap-2 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm font-medium">Loading chart data…</span>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center text-slate-400 gap-2">
            <BarChart2 size={32} className="opacity-30" />
            <p className="text-sm font-semibold">No financial data yet</p>
            <p className="text-xs">Start by adding expenses or investments</p>
          </div>
        ) : (
          <>
            {/* Legend row */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              {[
                { key: 'Expenses',    color: '#f43f5e' },
                { key: 'Investments', color: '#6366f1' },
                { key: 'Savings',     color: '#10b981' },
              ].map(({ key, color }) => (
                <span key={key} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: color }} />
                  {key}
                </span>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barCategoryGap="30%" barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-slate-700" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fontWeight: 700, fill: 'currentColor', className: 'text-slate-400' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'currentColor', className: 'text-slate-400' }}
                  tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
                  width={48}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)', radius: 6 }} />
                <Bar dataKey="Expenses"    fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Investments" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Savings"     fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>

            {lastRefresh && (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 text-right mt-2">
                Updated {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          icon={Receipt}
          label="Total Expenses This Month"
          value={current.Expenses}
          iconBg="bg-rose-100 dark:bg-rose-900/30"
          iconColor="text-rose-600 dark:text-rose-400"
          borderColor="border-rose-100"
          trend={0}
        />
        <SummaryCard
          icon={TrendingUp}
          label="Total Investments This Month"
          value={current.Investments}
          iconBg="bg-indigo-100 dark:bg-indigo-900/30"
          iconColor="text-indigo-600 dark:text-indigo-400"
          borderColor="border-indigo-100"
          trend={0}
        />
        <SummaryCard
          icon={PiggyBank}
          label="Total Savings This Month"
          value={current.Savings}
          iconBg="bg-emerald-100 dark:bg-emerald-900/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
          borderColor="border-emerald-100"
          trend={0}
        />
      </div>
    </div>
  );
};

export default MonthlyFinancialOverview;
