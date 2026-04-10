import React, { useState, useEffect } from 'react';
import { Send, ArrowRightLeft } from 'lucide-react';
import { calculateForex, createForexTransfer } from '../../services/forexService';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AED', 'SGD'];

const SYMBOLS = { USD: '$', EUR: '€', GBP: '£', INR: '₹', AED: 'د.إ', SGD: 'S$' };

function fmt(value, currency) {
  const sym = SYMBOLS[currency] || '';
  const num = Number(value || 0);
  if (currency === 'INR') return sym + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return sym + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const selectClass =
  'bg-slate-700 border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer';

const TransferCalculator = () => {
  const [amount, setAmount]               = useState('1000');
  const [from, setFrom]                   = useState('USD');
  const [to, setTo]                       = useState('INR');
  const [calc, setCalc]                   = useState(null);
  const [transferResult, setTransferResult] = useState(null);
  const [transferring, setTransferring]   = useState(false);

  // Recalculate whenever amount, from, or to changes
  useEffect(() => {
    if (!amount || Number(amount) <= 0) { setCalc(null); return; }
    calculateForex(amount, from, to).then(setCalc);
  }, [amount, from, to]);

  const swap = () => {
    setFrom(to);
    setTo(from);
    setTransferResult(null);
  };

  const handleFromChange = (e) => {
    const val = e.target.value;
    // Prevent same currency on both sides
    if (val === to) setTo(from);
    setFrom(val);
    setTransferResult(null);
  };

  const handleToChange = (e) => {
    const val = e.target.value;
    if (val === from) setFrom(to);
    setTo(val);
    setTransferResult(null);
  };

  const convertedAmount = calc?.convertedAmount ?? 0;
  const appliedRate     = calc?.appliedRate ?? 0;
  const fees            = calc?.fees ?? 0;

  return (
    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative">
      <div className="relative z-10">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/20 rounded-lg border border-blue-500/30">
            <Send className="text-blue-400" size={18} />
          </div>
          International Transfer
        </h3>

        <div className="space-y-3">

          {/* You Send */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">You Send</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                className="grow px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-white font-black"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <select className={selectClass} value={from} onChange={handleFromChange}>
                {CURRENCIES.map(c => (
                  <option key={c} value={c} className="bg-slate-800 text-white">{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap button */}
          <div className="flex justify-center py-1">
            <button
              onClick={swap}
              className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 border-4 border-slate-900 flex items-center justify-center transition-all active:scale-90 shadow-lg"
              title="Swap currencies"
            >
              <ArrowRightLeft className="text-white" size={14} />
            </button>
          </div>

          {/* They Receive */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">They Receive</label>
            <div className="flex gap-2">
              <div className="grow px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-emerald-400 font-black flex items-center min-w-0">
                {calc ? fmt(convertedAmount, to) : '...'}
              </div>
              <select className={selectClass} value={to} onChange={handleToChange}>
                {CURRENCIES.map(c => (
                  <option key={c} value={c} className="bg-slate-800 text-white">{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Breakdown */}
          <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Fee (0.5%)</span>
              <span className="text-slate-200">{fmt(fees, from)}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Exchange Rate</span>
              <span className="text-slate-200">
                1 {from} = {appliedRate > 0 ? `${appliedRate.toFixed(4)} ${to}` : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Total Cost</span>
              <span className="text-lg font-black text-white">
                {fmt(Number(amount || 0) + fees, from)}
              </span>
            </div>
          </div>

          {/* Action */}
          {transferResult ? (
            <div className="w-full mt-4 py-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-black text-xs uppercase tracking-widest rounded-xl text-center">
              Transfer Initiated · ID: {transferResult.transfer?.transferId || 'N/A'}
            </div>
          ) : (
            <button
              onClick={async () => {
                setTransferring(true);
                const result = await createForexTransfer({
                  amount: Number(amount),
                  fromCurrency: from,
                  toCurrency: to,
                  convertedAmount,
                  exchangeRate: appliedRate,
                  fees,
                });
                setTransferResult(result);
                setTransferring(false);
              }}
              disabled={transferring || !calc}
              className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              {transferring ? 'Processing...' : 'Secure Transfer Now'}
            </button>
          )}
        </div>
      </div>

      {/* Glow Effect */}
      <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full" />
    </div>
  );
};

export default TransferCalculator;
