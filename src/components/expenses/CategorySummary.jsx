import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#f43f5e', '#64748b'];

const CategorySummary = ({ categoryData }) => {
  const data = categoryData.map((item, index) => ({
    name: item.category,
    value: item.total,
    color: COLORS[index % COLORS.length]
  }));

  const totalSpend = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
      <h3 className="text-lg font-semibold text-slate-800 mb-2 w-full">Category Breakdown</h3>
      <p className="text-xs text-slate-400 mb-6 w-full">Distribution of your spending across categories</p>
      
      <div className="w-full h-64 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              animationBegin={0}
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Total']}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter block mb-0.5">Total</span>
          <span className="text-lg font-black text-slate-800 leading-none">₹{(totalSpend / 1000).toFixed(1)}k</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full mt-4">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2 p-2 bg-slate-50/50 rounded-lg border border-slate-100">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-slate-500 truncate uppercase tracking-wider">{item.name}</span>
              <span className="text-xs font-bold text-slate-700">₹{item.value.toLocaleString('en-IN')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategorySummary;
