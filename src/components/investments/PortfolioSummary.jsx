import React from 'react';
import { TrendingUp, TrendingDown, Wallet, BarChart3, PieChart as PieChartIcon } from 'lucide-react';

const PortfolioSummary = ({ summary }) => {
  const isPositive = summary.totalReturn >= 0;

  const stats = [
    {
      label: 'Total Invested',
      value: `₹${summary.totalInvested.toLocaleString('en-IN')}`,
      icon: <Wallet className="text-blue-500" size={20} />,
      bg: 'bg-blue-50'
    },
    {
      label: 'Current Value',
      value: `₹${summary.currentValue.toLocaleString('en-IN')}`,
      icon: <PieChartIcon className="text-purple-500" size={20} />,
      bg: 'bg-purple-50'
    },
    {
      label: 'Total Profit/Loss',
      value: `₹${Math.abs(summary.totalReturn).toLocaleString('en-IN')}`,
      subValue: `${isPositive ? '+' : '-'}${summary.returnPercentage.toFixed(2)}%`,
      icon: isPositive ? <TrendingUp className="text-emerald-500" size={20} /> : <TrendingDown className="text-rose-500" size={20} />,
      bg: isPositive ? 'bg-emerald-50' : 'bg-rose-50',
      color: isPositive ? 'text-emerald-600' : 'text-rose-600'
    },
    {
      label: 'Active Assets',
      value: summary.activeCount,
      icon: <BarChart3 className="text-orange-500" size={20} />,
      bg: 'bg-orange-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-xl ${stat.bg}`}>
              {stat.icon}
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">{stat.value}</span>
            {stat.subValue && (
              <span className={`text-xs font-bold ${stat.color}`}>{stat.subValue}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PortfolioSummary;
