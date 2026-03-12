import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MonthlySpendingChart = ({ transactions }) => {
  // Aggregate transactions by date for the last 30 days
  const processData = () => {
    const last30Days = [...Array(30)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().split('T')[0];
    });

    const dailyData = last30Days.reduce((acc, date) => {
      acc[date] = 0;
      return acc;
    }, {});

    transactions.forEach(tx => {
      if (dailyData[tx.date] !== undefined && tx.amount < 0) {
        dailyData[tx.date] += Math.abs(tx.amount);
      }
    });

    return Object.entries(dailyData).map(([date, amount]) => ({
      date: new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      amount
    }));
  };

  const chartData = processData();

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Spending Trend</h3>
          <p className="text-xs text-slate-400 uppercase font-medium tracking-widest mt-0.5">Last 30 Days Growth</p>
        </div>
        <div className="flex items-center gap-2 text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100/50">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold">LIVE ANALYSIS</span>
        </div>
      </div>
      
      <div className="grow w-full min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
              interval={5}
            />
            <YAxis 
              hide 
              domain={[0, 'auto']}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '12px', 
                border: '1px solid #f1f5f9', 
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                padding: '8px 12px'
              }} 
              itemStyle={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}
              labelStyle={{ fontSize: '10px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Spends']}
            />
            <Area 
              type="monotone" 
              dataKey="amount" 
              stroke="#10b981" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorAmount)" 
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlySpendingChart;
