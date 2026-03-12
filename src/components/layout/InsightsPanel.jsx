import React, { useEffect, useState } from 'react';
import { ShieldCheck, TrendingDown, Lightbulb, Wallet, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';

const InsightsPanel = ({ score = 65 }) => {
  const [profile, setProfile] = useState(null);

  // Poll for profile if not immediately set during render
  useEffect(() => {
     const checkProfile = () => {
        const stored = localStorage.getItem('smartBankProfile');
        if (stored) setProfile(stored);
     };
     checkProfile();
     // Listen just in case local storage is modified in same window context
     window.addEventListener('storage', checkProfile);
     return () => window.removeEventListener('storage', checkProfile);
  }, []);

  const getScoreColor = (sc) => {
    if (sc >= 80) return 'text-emerald-500';
    if (sc >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  const scoreColor = getScoreColor(score);

  return (
    <aside className="w-80 bg-slate-50 border-l border-slate-200 h-screen sticky top-0 flex-col hidden lg:flex p-6 overflow-y-auto">
      <h2 className="text-xl font-bold text-slate-800 mb-6">Financial Insights</h2>

      {/* Financial Health Score component */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50 to-emerald-50 rounded-bl-full -z-0 opacity-50" />
        <div className="relative z-10">
          <h3 className="text-sm font-semibold text-slate-500 mb-2">Health Score</h3>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-extrabold ${scoreColor}`}>{score}</span>
            <span className="text-slate-400 font-medium">/ 100</span>
          </div>
          
          <div className="mt-4 space-y-2 text-sm text-slate-600">
             <p className="flex items-start gap-2">
                <TrendingDown className="w-4 h-4 text-rose-500 mt-1 shrink-0" />
                Reduce unnecessary spending to improve your score.
             </p>
             <p className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 mt-1 shrink-0" />
                Start an emergency fund as soon as possible.
             </p>
             <p className="flex items-start gap-2">
                <TrendingDown className="w-4 h-4 text-indigo-500 mt-1 shrink-0" />
                Invest in a SIP to securely grow your wealth over time.
             </p>
          </div>
        </div>
      </div>

      {/* Quick Suggestions / Profile tailored info */}
      <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Smart Suggestions</h3>
      
      <div className="space-y-4">
        {profile === 'Student' && (
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-3 group hover:border-emerald-200 transition-colors">
             <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors h-fit">
               <Lightbulb size={20} />
             </div>
             <div>
               <h4 className="text-sm font-bold text-slate-800">Student Strategy</h4>
               <p className="text-xs text-slate-500 mt-1">Look for zero balance accounts and keep debt to zero. Start saving ₹500/month.</p>
             </div>
           </div>
        )}

        {profile === 'Working Professional' && (
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-3 group hover:border-indigo-200 transition-colors">
             <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-colors h-fit">
               <Wallet size={20} />
             </div>
             <div>
               <h4 className="text-sm font-bold text-slate-800">Salary Management</h4>
               <p className="text-xs text-slate-500 mt-1">Use ELSS Mutual Funds for tax saving under 80C. Aim to invest 20% of income.</p>
             </div>
           </div>
        )}

        {profile === 'Self Employed' && (
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-3 group hover:border-amber-200 transition-colors">
             <div className="bg-amber-100 p-2 rounded-lg text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors h-fit">
               <Calculator size={20} />
             </div>
             <div>
               <h4 className="text-sm font-bold text-slate-800">Business Buffers</h4>
               <p className="text-xs text-slate-500 mt-1">Keep an emergency fund for 6-12 months. Separate personal from business accounts.</p>
             </div>
           </div>
        )}

        <Link to="/expenses" className="block outline-none">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-3 group hover:border-indigo-200 transition-colors cursor-pointer">
            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-colors h-fit">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Track All Spend</h4>
              <p className="text-xs text-slate-500 mt-1">Use the Expense Analyzer to break down costs properly and find more savings.</p>
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
};

export default InsightsPanel;
