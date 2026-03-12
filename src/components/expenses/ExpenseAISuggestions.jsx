import React from 'react';
import { Sparkles, TrendingDown, Clock, Lightbulb, ArrowRight } from 'lucide-react';

const ExpenseAISuggestions = ({ transactions }) => {
  const topCategory = [...transactions].reduce((acc, tx) => {
    if (tx.amount < 0) acc[tx.category] = (acc[tx.category] || 0) + Math.abs(tx.amount);
    return acc;
  }, {});
  
  const highest = Object.entries(topCategory).sort((a,b) => b[1] - a[1])[0] || ['N/A', 0];

  const suggestions = [
    {
      icon: <TrendingDown className="text-emerald-500" size={18} />,
      title: "Potential Savings",
      desc: `Your ${highest[0]} spending is ₹${highest[1].toLocaleString()} this month. Redirecting 10% can save you ₹${(highest[1] * 0.1).toFixed(0)}.`,
      color: "bg-emerald-50"
    },
    {
      icon: <Clock className="text-blue-500" size={18} />,
      title: "Recurring Pattern",
      desc: "Weekend shopping spikes detected. Consider a 'No-Spend Saturday' to optimize your monthly budget by 15%.",
      color: "bg-blue-50"
    },
    {
      icon: <Lightbulb className="text-amber-500" size={18} />,
      title: "Smart Swap",
      desc: "Frequent small Swiggy orders detected. Using a Zomato Gold or bank offer could save you ₹450 in delivery fees.",
      color: "bg-amber-50"
    }
  ];

  return (
    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative">
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-1.5 bg-emerald-500/20 rounded-lg backdrop-blur-sm border border-emerald-500/30">
            <Sparkles className="text-emerald-400" size={20} />
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">AI Smart Coach</h3>
        </div>

        <div className="space-y-4">
          {suggestions.map((s, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
              <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${s.color} bg-opacity-20`}>
                {s.icon}
              </div>
              <div className="grow">
                <h4 className="text-sm font-bold text-slate-200 mb-1 flex items-center justify-between">
                  {s.title}
                  <ArrowRight size={14} className="text-slate-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </h4>
                <p className="text-[11px] leading-relaxed text-slate-400 font-medium">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        
        <button className="w-full mt-6 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20">
          Optimize My Plan
        </button>
      </div>

      {/* Decorative Blur Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -mr-16 -mt-16 rounded-full" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 blur-3xl -ml-16 -mb-16 rounded-full" />
    </div>
  );
};

export default ExpenseAISuggestions;
