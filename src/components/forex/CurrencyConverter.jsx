import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { getLiveRates } from '../../services/forexService';

const CurrencyConverter = () => {
  const [rates, setRates] = useState({});
  const [amount, setAmount] = useState('1');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('INR');
  const [result, setResult] = useState(0);

  useEffect(() => {
    const fetchRates = async () => {
      const liveRates = await getLiveRates();
      setRates({ ...liveRates, INR: 1 });
    };
    fetchRates();
  }, []);

  useEffect(() => {
    const fromRate = from === 'INR' ? 1 : rates[from];
    const toRate   = to   === 'INR' ? 1 : rates[to];
    if (fromRate && toRate && Number(amount) > 0) {
      // Step 1: convert source amount to INR equivalent
      // Step 2: convert INR equivalent to target currency
      const amountInINR = Number(amount) * fromRate;
      setResult(amountInINR / toRate);
    } else {
      setResult(0);
    }
  }, [amount, from, to, rates]);

  const swapCurrencies = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-800 tracking-tight">Quick Converter</h3>
        <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Amount</label>
          <input
            type="number"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-black text-slate-800 text-lg"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="grow">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">From</label>
            <select
              className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 appearance-none"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            >
              {Object.keys(rates).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <button
            onClick={swapCurrencies}
            className="mt-6 p-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-all shadow-sm active:scale-95"
          >
            <ArrowRightLeft size={18} />
          </button>

          <div className="grow">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">To</label>
            <select
              className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 appearance-none"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            >
              {Object.keys(rates).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-6 p-5 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-dashed border-slate-200">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Converted Total</div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800 tracking-tighter">
              {result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm font-black text-slate-400">{to}</span>
          </div>
          <div className="mt-2 text-[10px] font-bold text-slate-400 flex items-center gap-1">
            {(() => {
              const fromRate = from === 'INR' ? 1 : (rates[from] || 1);
              const toRate   = to   === 'INR' ? 1 : (rates[to]   || 1);
              const unitRate = fromRate / toRate;
              return `1 ${from} = ${unitRate.toFixed(4)} ${to}`;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencyConverter;
