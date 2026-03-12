import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10b981', '#6366f1', '#f43f5e', '#f59e0b', '#8b5cf6'];

const ChartsRow = ({ mockChartData, expenseData, totalExpenses }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Balance History Area Chart */}
      <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center justify-between">
          <span>Balance Trajectory (6 Months)</span>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">Live AI Estimation</span>
        </h3>
        <div className="flex-1 min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dx={-10} tickFormatter={(value) => `₹${value}`} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorBalance)" activeDot={{ r: 6, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expense Distribution Pie Chart */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Expense Distribution</h3>
        <p className="text-sm text-slate-500 mb-6">Where your money goes this month.</p>
        
        <div className="flex-1 min-h-[250px] w-full flex items-center justify-center relative">
           <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                 <Pie 
                   data={expenseData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={90}
                   paddingAngle={5}
                   dataKey="value"
                   stroke="none"
                 >
                   {expenseData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip 
                    formatter={(value) => [`₹${value}`, 'Amount']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                 />
              </PieChart>
           </ResponsiveContainer>
           {/* Center Label inside Pie */}
           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total</span>
              <span className="text-xl font-black text-slate-800 tracking-tight">₹{totalExpenses.toLocaleString()}</span>
           </div>
        </div>
        
        {/* Custom Legend */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-2 mt-4">
           {expenseData.map((entry, index) => (
             <div key={`legend-${index}`} className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
               <span className="text-xs font-semibold text-slate-700 truncate">{entry.name}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default ChartsRow;
