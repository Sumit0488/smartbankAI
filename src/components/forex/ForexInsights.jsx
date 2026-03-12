import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, TrendingDown, Clock, Lightbulb, Map } from 'lucide-react';
import { getAIForexAdvice, getForexAlerts } from '../../services/forexService';

const ForexInsights = () => {
  const [advice, setAdvice] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchAdvice = async () => {
      const a = await getAIForexAdvice('USD', 'INR');
      const al = await getForexAlerts();
      setAdvice(a);
      setAlerts(al);
    };
    fetchAdvice();
  }, []);

  return (
    <div className="space-y-6">
      {/* AI Recommendation Panel */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden group">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
             <div className="p-1.5 bg-blue-500/10 rounded-lg">
                <Sparkles className="text-blue-600" size={18} />
             </div>
             <h3 className="text-lg font-bold text-slate-800 tracking-tight">AI Advisory</h3>
          </div>
          
          <div className="mb-6">
            <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Recommended Action</div>
            <div className="text-2xl font-black text-slate-800 tracking-tighter uppercase">{advice?.bestTime || 'Analyzing...'}</div>
          </div>

          <div className="p-4 bg-white/60 backdrop-blur-md rounded-xl border border-white/50 mb-6">
            <p className="text-sm font-medium text-slate-600 italic leading-relaxed">
              "{advice?.tip || 'Fetching latest market sentiment and volatility insights...'}"
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="grow p-3 bg-white rounded-xl border border-slate-100">
               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">Min rate</div>
               <span className="text-sm font-black text-slate-800">₹82.10</span>
            </div>
            <div className="grow p-3 bg-white rounded-xl border border-slate-100">
               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">Max rate</div>
               <span className="text-sm font-black text-slate-800">₹84.45</span>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -mr-16 -mt-16 rounded-full group-hover:bg-blue-500/10 transition-all duration-700" />
      </div>

      {/* Market Hotspots */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Map size={16} className="text-slate-400" />
            Market Hotspots
        </h3>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className={`p-4 rounded-xl border ${alert.type === 'positive' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'} transition-all hover:scale-[1.02]`}>
               <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${alert.type === 'positive' ? 'text-emerald-600' : 'text-rose-600'}`}>{alert.currencyPair}</span>
                  {alert.type === 'positive' ? <TrendingUp size={14} className="text-emerald-500" /> : <TrendingDown size={14} className="text-rose-500" />}
               </div>
               <p className={`text-xs font-bold leading-relaxed ${alert.type === 'positive' ? 'text-emerald-700' : 'text-rose-700'}`}>
                {alert.message}
               </p>
            </div>
          ))}
        </div>
        
        <button className="w-full mt-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95">
            View Dynamic Charts
        </button>
      </div>

       {/* Legend / Tip */}
       <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex gap-3">
          <Lightbulb className="text-orange-400 shrink-0" size={18} />
          <p className="text-[10px] font-bold text-slate-500 leading-normal">
            TIP: Multi-currency debit cards like Niyo Global offer a better markup rate (0%) than standard bank transfers.
          </p>
       </div>
    </div>
  );
};

export default ForexInsights;
