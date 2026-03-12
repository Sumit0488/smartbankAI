import React from 'react';
import { Sparkles, ShieldCheck, Target, Zap, Info } from 'lucide-react';
import { generateSmartInvestmentAdvice } from '../../services/aiService';

const SmartInvestmentAdvice = ({ marketData, onSelectInvestment }) => {
  const dynamicAdvice = generateSmartInvestmentAdvice(marketData);

  const riskCategories = [
    {
      level: "Low Risk",
      icon: <ShieldCheck className="text-emerald-500" size={24} />,
      colorClass: "bg-emerald-50 border-emerald-100",
      titleColor: "text-emerald-700",
      suggestions: ["Fixed Deposits", "Digital Gold", "Index Mutual Funds"]
    },
    {
      level: "Medium Risk",
      icon: <Target className="text-amber-500" size={24} />,
      colorClass: "bg-amber-50 border-amber-100",
      titleColor: "text-amber-700",
      suggestions: ["Large Cap Stocks", "Blue Chip Companies", "Balanced Funds"]
    },
    {
      level: "High Risk",
      icon: <Zap className="text-rose-500" size={24} />,
      colorClass: "bg-rose-50 border-rose-100",
      titleColor: "text-rose-700",
      suggestions: ["Emerging Stocks", "Small Cap Funds", "Sectoral Funds"]
    }
  ];

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 md:p-8 rounded-3xl shadow-lg relative overflow-hidden animate-in slide-in-from-bottom-4">
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl backdrop-blur-sm shadow-sm ring-1 ring-white/10">
            <Sparkles size={24} />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Today's Smart Investment Advice</h2>
        </div>

        {/* Dynamic AI Summary */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl mb-8">
           <p className="text-indigo-100 leading-relaxed font-medium">
             <span className="font-bold text-white mr-2">AI Summary:</span> 
             {dynamicAdvice} {marketData.summary}
           </p>
        </div>

        {/* Risk Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {riskCategories.map((cat, idx) => (
             <div key={idx} className={`${cat.colorClass} border p-5 rounded-2xl transition-transform hover:-translate-y-1 duration-300`}>
                <div className="flex items-center gap-3 mb-4">
                   {cat.icon}
                   <h3 className={`font-bold ${cat.titleColor}`}>{cat.level}</h3>
                </div>
                <ul className="space-y-3">
                  {cat.suggestions.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full bg-current ${cat.titleColor} opacity-60`} />
                      <span className="text-sm font-semibold text-slate-800">{item}</span>
                    </li>
                  ))}
                </ul>
             </div>
          ))}
        </div>

        {/* Student Mode Tip */}
        <div className="mt-8 flex items-start gap-4 p-4 rounded-2xl bg-indigo-950/50 border border-indigo-500/30">
           <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-full shrink-0">
             <Info size={20} />
           </div>
           <div>
             <h4 className="text-sm font-bold text-white mb-1">Beginner Tip</h4>
             <p className="text-sm text-indigo-200">
               Start with SIP in <strong className="text-emerald-400">Index Mutual Funds</strong> instead of investing large amounts in individual stocks. It's safe, requires less tracking, and averages out market volatility over time.
             </p>
           </div>
        </div>
        
      </div>
    </div>
  );
};

export default SmartInvestmentAdvice;
