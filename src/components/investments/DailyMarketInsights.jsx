import React from 'react';
import { TrendingUp, TrendingDown, RefreshCcw, Activity } from 'lucide-react';

const DailyMarketInsights = ({ data }) => {
  if (!data) return null;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-in slide-in-from-bottom-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="text-indigo-500" /> Today's Market Insights
          </h3>
          <p className="text-sm text-slate-500 mt-1">Live updates on indices and commodities</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
          <RefreshCcw size={14} className="animate-spin-slow" /> Auto-refreshed today
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
         <MarketCard title="Nifty 50" data={data.nifty} />
         <MarketCard title="Sensex" data={data.sensex} />
         <MarketCard title="Gold 24K" data={data.gold24k} format="currency" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
         <div>
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
               Top Gainers <TrendingUp className="text-emerald-500" size={16} />
            </h4>
            <div className="space-y-3">
              {data.topGainers.map((stock, i) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-xl hover:bg-emerald-50 transition-colors group">
                  <div>
                    <p className="font-bold text-slate-800">{stock.symbol}</p>
                    <p className="text-xs text-slate-500">{stock.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">₹{stock.price.toLocaleString()}</p>
                    <p className="text-xs font-semibold text-emerald-600">+{stock.change}%</p>
                  </div>
                </div>
              ))}
            </div>
         </div>
         
         <div>
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
               Top Losers <TrendingDown className="text-rose-500" size={16} />
            </h4>
            <div className="space-y-3">
              {data.topLosers.map((stock, i) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-xl hover:bg-rose-50 transition-colors group">
                  <div>
                    <p className="font-bold text-slate-800">{stock.symbol}</p>
                    <p className="text-xs text-slate-500">{stock.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">₹{stock.price.toLocaleString()}</p>
                    <p className="text-xs font-semibold text-rose-600">{stock.change}%</p>
                  </div>
                </div>
              ))}
            </div>
         </div>
      </div>
    </div>
  );
};

const MarketCard = ({ title, data, format }) => {
  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-indigo-200 hover:shadow-sm transition-all">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <h4 className="text-2xl font-black text-slate-900">
          {format === 'currency' ? '₹' : ''}{data.value.toLocaleString()}
        </h4>
      </div>
      <div className={`mt-2 flex items-center gap-1 text-sm font-medium ${data.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
        {data.isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        <span>{data.isPositive ? '+' : ''}{data.change} ({data.percentChange}%)</span>
      </div>
    </div>
  );
};

export default DailyMarketInsights;
