import React from 'react';
import { Activity, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';

const FinancialHealthScore = ({ scoreData }) => {
  const { score, insights, suggestions } = scoreData;

  // Determine color and text based on score
  let scoreColor = 'text-emerald-500';
  let bgColor = 'bg-emerald-50';
  let borderColor = 'border-emerald-200';
  let scoreText = 'Good';
  
  if (score < 40) {
    scoreColor = 'text-rose-500';
    bgColor = 'bg-rose-50';
    borderColor = 'border-rose-200';
    scoreText = 'Needs Improvement';
  } else if (score < 70) {
    scoreColor = 'text-amber-500';
    bgColor = 'bg-amber-50';
    borderColor = 'border-amber-200';
    scoreText = 'Moderate';
  }

  return (
    <div className={`p-6 rounded-2xl border ${borderColor} shadow-sm ${bgColor} relative overflow-hidden transition-all duration-300`}>
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Score Display */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-slate-100 min-w-[150px]">
          <p className="text-sm font-bold tracking-wider text-slate-400 mb-2 uppercase">Health Score</p>
          <div className="relative flex items-center justify-center">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="36"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-slate-100"
              />
              <circle
                cx="48"
                cy="48"
                r="36"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={(2 * Math.PI * 36)}
                strokeDashoffset={(2 * Math.PI * 36) - ((score / 100) * (2 * Math.PI * 36))}
                className={`${scoreColor} transition-all duration-1000 ease-out`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-black ${scoreColor}`}>{score}</span>
            </div>
          </div>
          <div className={`mt-3 py-1 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-white ${scoreColor} ${borderColor}`}>
             {scoreText}
          </div>
        </div>

        {/* AI Insights and Suggestions */}
        <div className="flex-1 space-y-4">
           <div>
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               <Activity className={scoreColor} size={20} /> AI Insights
             </h3>
             <ul className="mt-2 space-y-2">
               {insights.map((insight, idx) => (
                 <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                   <AlertCircle className="shrink-0 mt-0.5 text-indigo-400" size={16} />
                   <span>{insight}</span>
                 </li>
               ))}
             </ul>
           </div>

           {suggestions.length > 0 && (
             <div className="bg-white/60 p-4 rounded-xl border border-white/50 space-y-2">
               <h4 className="text-xs font-bold text-slate-500 tracking-wider uppercase">Recommendations</h4>
               <ul className="space-y-1">
                 {suggestions.map((suggestion, idx) => (
                   <li key={idx} className="flex items-start gap-2 text-sm text-slate-800 font-medium">
                     <TrendingDown className="shrink-0 mt-0.5 text-emerald-500" size={16} />
                     <span>{suggestion}</span>
                   </li>
                 ))}
               </ul>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default FinancialHealthScore;
