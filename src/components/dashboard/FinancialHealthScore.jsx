import React from 'react';
import { Activity, TrendingDown, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

const FinancialHealthScore = ({ scoreData }) => {
  const { score, insights, suggestions } = scoreData;

  let scoreGradient = 'from-emerald-500 to-teal-400';
  let scoreTextColor = 'text-emerald-400';
  let scoreLabel = 'Excellent';
  let scoreBg = 'bg-emerald-500/10 border-emerald-500/20';

  if (score < 40) {
    scoreGradient = 'from-rose-500 to-pink-500';
    scoreTextColor = 'text-rose-400';
    scoreLabel = 'Needs Work';
    scoreBg = 'bg-rose-500/10 border-rose-500/20';
  } else if (score < 70) {
    scoreGradient = 'from-amber-500 to-orange-400';
    scoreTextColor = 'text-amber-400';
    scoreLabel = 'Moderate';
    scoreBg = 'bg-amber-500/10 border-amber-500/20';
  }

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 shadow-2xl p-6 md:p-8">
      {/* Background decoration */}
      <div className="pointer-events-none absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">

        {/* Score Circle */}
        <div className="flex flex-col items-center gap-3 shrink-0">
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Financial Health</p>
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
              <circle
                cx="50" cy="50" r="40"
                stroke="url(#scoreGrad)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#f43f5e'} />
                  <stop offset="100%" stopColor={score >= 70 ? '#14b8a6' : score >= 40 ? '#f97316' : '#ec4899'} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-black ${scoreTextColor}`}>{score}</span>
              <span className="text-slate-500 text-[10px] font-bold">/100</span>
            </div>
          </div>
          <div className={`px-4 py-1.5 rounded-full border text-xs font-black uppercase tracking-wider ${scoreBg} ${scoreTextColor}`}>
            {scoreLabel}
          </div>
          <div className="flex flex-col gap-1 w-full">
            {[
              { label: 'Savings', pct: Math.min(100, score + 15) },
              { label: 'Spending', pct: Math.max(20, 100 - score) },
              { label: 'Investment', pct: Math.min(100, score - 10) },
            ].map(item => (
              <div key={item.label} className="space-y-0.5">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-400">{item.label}</span>
                  <span className="text-slate-300">{item.pct}%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${scoreGradient}`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px bg-white/10 self-stretch" />

        {/* Insights */}
        <div className="flex-1 space-y-5">
          <div className="space-y-3">
            <h3 className="text-white font-black text-lg flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                <Activity size={16} className="text-indigo-400" />
              </div>
              AI Insights
            </h3>
            <div className="space-y-2">
              {insights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/8 transition-colors">
                  <AlertCircle size={15} className="text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300 leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </div>

          {suggestions.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-slate-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={12} className="text-amber-400" /> Recommendations
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestions.map((suggestion, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-300 font-medium leading-relaxed">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialHealthScore;
