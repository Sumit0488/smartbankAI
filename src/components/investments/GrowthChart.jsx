import React from 'react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

const GrowthChart = ({ investments }) => {
  // Mock growth data based on total volume
  const total = investments.reduce((sum, inv) => sum + (inv.currentValue || inv.amount), 0);
  
  const generateData = () => {
    const points = 7;
    const baseValue = total * 0.85;
    return [...Array(points)].map((_, i) => ({
      name: `Month ${i + 1}`,
      value: Math.floor(baseValue + (total - baseValue) * (i / (points - 1)) * (0.9 + Math.random() * 0.2))
    }));
  };

  const data = generateData();

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 tracking-tight">Wealth Growth</h3>
          <p className="text-xs text-slate-400 font-medium">Trajectory of your total portfolio value</p>
        </div>
        <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">
          Projected
        </div>
      </div>

      <div className="grow w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
            />
            <YAxis hide domain={['dataMin - 1000', 'auto']} />
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.2)' }}
              formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Portfolio Value']}
              labelStyle={{ display: 'none' }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#3b82f6" 
              strokeWidth={4}
              fillOpacity={1} 
              fill="url(#colorValue)" 
              animationDuration={2500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <span>Starting ₹{(total * 0.8).toLocaleString()}</span>
        <span>Peak ₹{total.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default GrowthChart;
