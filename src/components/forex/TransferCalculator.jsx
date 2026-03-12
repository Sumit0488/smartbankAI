import React, { useState, useEffect } from 'react';
import { Send, Wallet, Info, ArrowRight } from 'lucide-react';
import { calculateForex } from '../../services/forexService';

const TransferCalculator = () => {
  const [amount, setAmount] = useState('1000');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('INR');
  const [calc, setCalc] = useState(null);

  const performCalc = async () => {
    const res = await calculateForex(amount, from, to);
    setCalc(res);
  };

  useEffect(() => {
    performCalc();
  }, [amount, from, to]);

  return (
    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative">
      <div className="relative z-10">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
           <div className="p-1.5 bg-blue-500/20 rounded-lg border border-blue-500/30">
            <Send className="text-blue-400" size={18} />
           </div>
           International Transfer
        </h3>

        <div className="space-y-4">
          <div className="relative">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">You Send</label>
             <div className="flex gap-2">
                <input
                    type="number"
                    className="grow px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-white font-black"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
                <select className="bg-white/10 border border-white/10 rounded-xl px-2 text-white font-bold outline-none" value={from} onChange={(e) => setFrom(e.target.value)}>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                </select>
             </div>
          </div>

          <div className="flex justify-center -my-2 relative z-10">
             <div className="w-8 h-8 rounded-full bg-blue-600 border-4 border-slate-900 flex items-center justify-center">
                <ArrowRight className="text-white rotate-90" size={14} />
             </div>
          </div>

          <div className="relative">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">They Receive</label>
             <div className="flex gap-2">
                <div className="grow px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-emerald-400 font-black flex items-center">
                    ₹{calc ? (calc.convertedAmount || 0).toLocaleString('en-IN') : '...'}
                </div>
                <div className="bg-white/10 border border-white/10 rounded-xl px-4 text-white font-bold flex items-center">
                    INR
                </div>
             </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
             <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Fee (Vested)</span>
                <span className="text-slate-200">₹{calc?.fees?.toLocaleString() || '0'}</span>
             </div>
             <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Exchange Rate</span>
                <span className="text-slate-200">1 {from} = ₹{calc?.appliedRate?.toFixed(2) || '0'}</span>
             </div>
             <div className="flex justify-between items-center pt-2">
                <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Total Cost</span>
                <span className="text-lg font-black text-white">₹{calc?.totalCostINR?.toLocaleString() || '0'}</span>
             </div>
          </div>

          <button className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95">
             Secure Transfer Now
          </button>
        </div>
      </div>

       {/* Glow Effect */}
       <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full" />
    </div>
  );
};

export default TransferCalculator;
