import React from 'react';
import { CreditCard, Info } from 'lucide-react';

const ForexCardRecommendations = ({ cardAdvisor, setCardAdvisor, COUNTRIES, FOREX_CARD_REC_DATA }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
         <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="text-indigo-500" size={24}/> Best Forex Card for You
            </h3>
            <p className="text-sm text-slate-500">Compare top forex cards based on your travel plan.</p>
         </div>
         <div className="flex flex-wrap gap-4 items-center">
            <div className="flex flex-col">
               <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Destination</label>
               <select 
                 value={cardAdvisor.destination}
                 onChange={(e) => setCardAdvisor({...cardAdvisor, destination: e.target.value})}
                 className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 outline-none"
               >
                 {COUNTRIES.map(c => <option key={`card-dest-${c.id}`} value={c.id}>{c.name}</option>)}
               </select>
            </div>
            <div className="flex flex-col">
               <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Duration (Days)</label>
               <input 
                 type="number"
                 value={cardAdvisor.duration}
                 onChange={(e) => setCardAdvisor({...cardAdvisor, duration: e.target.value})}
                 className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 w-20 outline-none"
               />
            </div>
            <div className="flex flex-col">
               <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Budget (₹)</label>
               <input 
                 type="number"
                 value={cardAdvisor.budget}
                 onChange={(e) => setCardAdvisor({...cardAdvisor, budget: e.target.value})}
                 className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 w-32 outline-none"
               />
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {FOREX_CARD_REC_DATA.map((card, idx) => {
            const totalMarkup = (Number(cardAdvisor.budget) * (parseFloat(card.markup) / 100));
            const isBest = idx === 0;
            
            return (
               <div key={card.name} className={`relative p-5 rounded-2xl border ${isBest ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 bg-slate-50/50'} flex flex-col`}>
                  {isBest && (
                     <span className="absolute -top-3 left-4 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        AI Preferred
                     </span>
                  )}
                  
                  <div className="flex justify-between items-start mb-4">
                     <h4 className="text-lg font-black text-slate-900">{card.name}</h4>
                     <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Markup</p>
                        <p className={`text-sm font-black ${isBest ? 'text-emerald-600' : 'text-slate-700'}`}>{card.markup}</p>
                     </div>
                  </div>

                  <div className="space-y-3 mb-6 flex-1">
                     <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Annual Fee:</span>
                        <span className="font-bold text-slate-800">{card.annualFee}</span>
                     </div>
                     <div className="flex justify-between text-xs">
                        <span className="text-slate-500">ATM Fee:</span>
                        <span className="font-bold text-slate-800">{card.atmFee}</span>
                     </div>
                     <div className="pt-2 border-t border-slate-200/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Key Benefits</p>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">{card.benefits}</p>
                     </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between mb-4">
                     <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Est. Markup Loss</p>
                        <p className="text-sm font-black text-rose-600">₹{totalMarkup.toLocaleString()}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Ideal For</p>
                        <p className="text-[10px] font-black text-indigo-600 uppercase">{card.bestFor}</p>
                     </div>
                  </div>

                  <button className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all ${isBest ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-900 text-white hover:bg-black'}`}>
                     Apply For Card
                  </button>
               </div>
            );
         })}
      </div>

      <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start gap-3">
         <Info className="text-indigo-500 shrink-0 mt-0.5" size={18}/>
         <p className="text-xs text-indigo-800 font-medium leading-relaxed">
            <strong className="font-bold block mb-0.5">AI Recommendation Summary:</strong>
            Based on your {cardAdvisor.duration} day trip to {COUNTRIES.find(c => c.id === cardAdvisor.destination)?.name}, we recommend <strong>Niyo Global</strong> if you are a student or leisure traveler to avoid high markup costs. For business trips, <strong>HDFC Multi-Currency</strong> offers better corporate features.
         </p>
      </div>
    </div>
  );
};

export default ForexCardRecommendations;
