import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Target, AlertTriangle } from 'lucide-react';

const AIBudgetPlanner = ({ income, currentExpenses, budgetPlan }) => {
  if (!budgetPlan) return null;

  const totalCurrentExpenses = Object.values(currentExpenses).reduce((a, b) => a + b, 0);

  // Simplified categorization for tracking
  const currentNeeds = currentExpenses.rent + currentExpenses.food;
  const currentWants = currentExpenses.shopping + currentExpenses.travel + currentExpenses.other;
  const currentSavings = income - totalCurrentExpenses;

  const chartData = [
    { name: 'Needs (50%)', value: budgetPlan.needs, color: '#3b82f6' },
    { name: 'Wants (30%)', value: budgetPlan.wants, color: '#f59e0b' },
    { name: 'Savings (20%)', value: budgetPlan.savings, color: '#10b981' }
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Target className="text-indigo-500" size={20} /> AI Budget Plan
        </h3>
        <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">50/30/20 Rule</span>
      </div>

      <div className="flex-1 flex flex-col xl:flex-row items-center gap-6">
        <div className="w-48 h-48 shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₹${value}`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs text-slate-400 font-medium">Income</span>
            <span className="text-lg font-bold text-slate-800">₹{income.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-4">
          <BudgetRow 
            label="Needs" 
            recommended={budgetPlan.needs} 
            actual={currentNeeds} 
            colorClass="bg-blue-500" 
            textClass="text-blue-600"
          />
          <BudgetRow 
            label="Wants" 
            recommended={budgetPlan.wants} 
            actual={currentWants} 
            colorClass="bg-amber-500" 
            textClass="text-amber-600"
          />
          <BudgetRow 
            label="Savings" 
            recommended={budgetPlan.savings} 
            actual={currentSavings} 
            colorClass="bg-emerald-500" 
            textClass="text-emerald-600"
            isSavings
          />
        </div>
      </div>
    </div>
  );
};

const BudgetRow = ({ label, recommended, actual, colorClass, textClass, isSavings }) => {
  let isWarning = false;
  if (!isSavings && actual > recommended) isWarning = true;
  if (isSavings && actual < recommended) isWarning = true; // Savings are below target

  return (
    <div>
      <div className="flex justify-between items-end mb-1">
        <div className="flex items-center gap-2">
           <div className={`w-3 h-3 rounded-full ${colorClass}`} />
           <span className="text-sm font-semibold text-slate-700">{label}</span>
        </div>
        <div className="text-right">
           <span className={`text-sm font-bold ${isWarning ? (isSavings ? 'text-amber-600' : 'text-rose-600') : textClass}`}>
             ₹{actual.toLocaleString()}
           </span>
           <span className="text-xs text-slate-400 ml-1">
             / ₹{recommended.toLocaleString()}
           </span>
        </div>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${isWarning ? (isSavings ? 'bg-amber-400' : 'bg-rose-500') : colorClass}`} 
          style={{ width: `${Math.min(100, (actual / recommended) * 100)}%` }} 
        />
      </div>
      {isWarning && (
        <p className="text-[10px] mt-1 text-rose-500 flex items-center gap-1">
          <AlertTriangle size={10} /> 
          {isSavings ? "Below recommended savings" : "Exceeding budget limit"}
        </p>
      )}
    </div>
  );
};

export default AIBudgetPlanner;
