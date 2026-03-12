import React from 'react';
import CurrencyConverter from '../components/forex/CurrencyConverter';
import TransferCalculator from '../components/forex/TransferCalculator';
import ForexInsights from '../components/forex/ForexInsights';
import { Globe, ShieldCheck, Zap } from 'lucide-react';

const ForexAdvisor = () => {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-xl shadow-lg">
              <Globe className="text-white" size={24} />
            </div>
            AI Forex Advisor
          </h1>
          <p className="text-slate-500 font-medium mt-1">Smart currency management and global transfer insights</p>
        </div>

        <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                        <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="user" />
                    </div>
                ))}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Joined by 1.2k traders today
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Calculators */}
        <div className="xl:col-span-8 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CurrencyConverter />
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center relative overflow-hidden group">
                 <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4 text-emerald-600">
                       <ShieldCheck size={20} />
                       <span className="text-xs font-black uppercase tracking-widest">Verified Rate Guarantee</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2 leading-tight">Zero Markup on International Spends</h3>
                    <p className="text-xs text-slate-500 font-medium mb-6">
                        Use our recommended forex cards to save up to ₹2,500 on every ₹1 Lakh spent abroad.
                    </p>
                    <button className="px-6 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg active:scale-95">
                        Compare Cards
                    </button>
                 </div>
                 <Zap className="absolute -bottom-4 -right-4 text-emerald-500/5 group-hover:text-emerald-500/10 transition-colors duration-700" size={160} />
              </div>
           </div>
           
           <TransferCalculator />

           <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
             <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Popular Currency Pairs</h3>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { pair: 'USD/INR', rate: '83.50', change: '+0.12%', up: true },
                    { pair: 'EUR/INR', rate: '89.20', change: '-0.45%', up: false },
                    { pair: 'GBP/INR', rate: '104.10', change: '+0.08%', up: true },
                    { pair: 'AED/INR', rate: '22.73', change: '-0.02%', up: false },
                ].map((p, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-xl border border-transparent hover:border-slate-200 transition-all cursor-default">
                        <div className="text-[10px] font-black text-slate-400 mb-1">{p.pair}</div>
                        <div className="text-lg font-black text-slate-800 tracking-tighter">₹{p.rate}</div>
                        <div className={`text-[10px] font-bold mt-1 ${p.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {p.change}
                        </div>
                    </div>
                ))}
             </div>
           </div>
        </div>

        {/* Right Column: AI & Strategy */}
        <div className="xl:col-span-4">
           <ForexInsights />
        </div>
      </div>
    </div>
  );
};

export default ForexAdvisor;
