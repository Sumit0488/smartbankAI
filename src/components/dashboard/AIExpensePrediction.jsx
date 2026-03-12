import React from 'react';
import { Sparkles, TrendingUp, TrendingDown, Clock } from 'lucide-react';

const AIExpensePrediction = ({ currentExpenses }) => {
  // Simple mock prediction logic based on current expenses
  const predictions = [
    { 
      category: 'Food Delivery', 
      current: currentExpenses.food, 
      predicted: Math.round(currentExpenses.food * 1.15), 
      trend: 'up',
      reason: 'Weekend ordering frequency is increasing' 
    },
    { 
      category: 'Travel', 
      current: currentExpenses.travel, 
      predicted: Math.round(currentExpenses.travel * 0.9), 
      trend: 'down',
      reason: 'Based on your recent fuel card usage' 
    },
    { 
      category: 'Shopping', 
      current: currentExpenses.shopping, 
      predicted: Math.round(currentExpenses.shopping * 1.25), 
      trend: 'up',
      reason: 'Upcoming festive season detected' 
    }
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
           <div className="p-1.5 bg-indigo-50 text-indigo-500 rounded-lg">
             <Sparkles size={18} />
           </div>
           AI Expense Prediction
        </h3>
        <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
           <Clock size={12} /> Next Month
        </span>
      </div>

      <div className="space-y-4">
        {predictions.map((item, idx) => (
          <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between gap-4">
             <div>
               <h4 className="font-bold text-slate-800">{item.category}</h4>
               <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                 {item.reason}
               </p>
             </div>
             
             <div className="flex items-center gap-3 shrink-0">
               <div className="text-right">
                 <p className="text-xs text-slate-400 line-through">₹{item.current}</p>
                 <p className="text-sm font-bold text-slate-800">₹{item.predicted}</p>
               </div>
               
               <div className={`p-2 rounded-lg flex items-center justify-center ${item.trend === 'up' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                 {item.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
               </div>
             </div>
          </div>
        ))}
      </div>
      
      <div className="bg-indigo-50/50 border border-indigo-100/50 p-4 rounded-xl mt-4">
          <p className="text-sm text-indigo-800 font-medium leading-relaxed">
             <strong className="font-bold">Suggestion:</strong> To offset the predicted increase in shopping and food, try transferring an extra ₹1500 to savings early next month.
          </p>
      </div>
    </div>
  );
};

export default AIExpensePrediction;
