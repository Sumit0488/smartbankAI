import React from 'react';
import { Trash2, ExternalLink, ChevronRight, Info } from 'lucide-react';
// import from framer-motion;

const InvestmentList = ({ investments, onDeleteInvestment }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-50 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 tracking-tight">Investment Holdings</h3>
          <p className="text-xs text-slate-400 font-medium">Detailed breakdown of your assets</p>
        </div>
        <button className="text-blue-600 font-bold text-xs hover:underline flex items-center gap-1">
          Export Report <ExternalLink size={12} />
        </button>
      </div>

      <div className="overflow-y-auto grow custom-scrollbar">
        {investments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
             <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <Info className="text-blue-200" size={32} />
            </div>
            <h4 className="text-slate-700 font-bold mb-1 tracking-tight">No investments tracked</h4>
            <p className="text-slate-400 text-xs max-w-[200px] leading-relaxed">Start building your portfolio by adding your first asset above.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            <AnimatePresence mode="popLayout">
              {investments.map((inv) => {
                const profit = (inv.currentValue || inv.amount) - inv.amount;
                const isProfit = profit >= 0;
                return (
                  <motion.div
                    key={inv.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 hover:bg-slate-50/50 transition-all group cursor-default"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-sm font-black text-blue-600">
                          {inv.type.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <h4 className="text-sm font-black text-slate-700">{inv.type}</h4>
                             <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-bold uppercase tracking-widest">{inv.status || 'Active'}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5 flex items-center gap-1 uppercase tracking-tight">
                            Invested {new Date(inv.investedDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Current Value</p>
                          <p className="text-sm font-black text-slate-800">₹{(inv.currentValue || inv.amount).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="text-right w-24">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Return</p>
                          <p className={`text-sm font-black ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isProfit ? '+' : '-'}₹{Math.abs(profit).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                           <button
                             onClick={() => onDeleteInvestment(inv.id)}
                             className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                           >
                            <Trash2 size={16} />
                          </button>
                          <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentList;
