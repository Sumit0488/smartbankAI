import React, { useState } from 'react';
import { Zap, TrendingUp, Landmark, Globe, CreditCard, Filter, Calendar, ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react';

const OPPORTUNITIES = [
  {
    id: 1,
    title: 'Nifty 50 Hits Record High',
    explanation: 'Market sentiment remains bullish as Nifty crosses the 22,000 mark. Blue-chip stocks like Reliance and HDFC Bank lead the rally.',
    category: 'Stock',
    date: 'March 09, 2026',
    trend: 'up',
    trendValue: '+1.2%'
  },
  {
    id: 2,
    title: 'HDFC Bank Hikes FD Rates',
    explanation: 'Senior citizens can now earn up to 8.25% p.a. on 2-year deposits. A great opportunity for low-risk steady returns.',
    category: 'Fixed Deposit',
    date: 'March 08, 2026',
    trend: 'up',
    trendValue: '8.25%'
  },
  {
    id: 3,
    title: 'Parag Parikh Flexi Cap Fund Outperforms',
    explanation: 'The fund has delivered 24% CAGR over 3 years, significantly beating its benchmark. Ideal for long-term equity exposure.',
    category: 'Mutual Fund',
    date: 'March 09, 2026',
    trend: 'up',
    trendValue: '24% CAGR'
  },
  {
    id: 4,
    title: 'USD/INR Rate Drops Below 83',
    explanation: 'Rupee strengthens against the dollar. Best time to purchase USD for future travel or international payments.',
    category: 'Forex',
    date: 'March 09, 2026',
    trend: 'down',
    trendValue: '₹82.90'
  },
  {
    id: 5,
    title: 'SBI Launches Zero-Fee Travel Card',
    explanation: 'Special offer for travelers: No annual fee and 5x rewards on international dining and hotel bookings.',
    category: 'Bank Product',
    date: 'March 07, 2026',
    trend: 'offer',
    trendValue: '0 Fees'
  },
  {
    id: 6,
    title: 'Gold Rates See Minor Correction',
    explanation: 'Gold prices dropped by 2% today. A potential entry point for those looking to diversify into precious metals.',
    category: 'Market',
    date: 'March 09, 2026',
    trend: 'down',
    trendValue: '-2.1%'
  },
  {
    id: 7,
    title: 'New SIP Campaign by Axis Mutual Fund',
    explanation: 'Axis is offering 1% extra units for first-time SIP investors in their Bluechip fund. Limited time offer.',
    category: 'Mutual Fund',
    date: 'March 06, 2026',
    trend: 'offer',
    trendValue: '1% Bonus'
  }
];

const CATEGORIES = ['All', 'Stock', 'Mutual Fund', 'Fixed Deposit', 'Bank Product', 'Forex'];

const MarketOpportunities = () => {
  const [filter, setFilter] = useState('All');

  const filteredOpportunities = filter === 'All' 
    ? OPPORTUNITIES 
    : OPPORTUNITIES.filter(opt => opt.category === filter);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Stock': return <TrendingUp className="text-blue-500" size={18} />;
      case 'Mutual Fund': return <TrendingUp className="text-emerald-500" size={18} />;
      case 'Fixed Deposit': return <Landmark className="text-amber-500" size={18} />;
      case 'Forex': return <Globe className="text-indigo-500" size={18} />;
      case 'Bank Product': return <CreditCard className="text-rose-500" size={18} />;
      default: return <Zap className="text-slate-500" size={18} />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            Market Opportunities <Zap className="text-amber-500" size={28} />
          </h1>
          <p className="text-slate-600 mt-1">Daily updated financial insights and trending investment opportunities.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
          <Calendar size={14} className="text-emerald-500" /> Updated: Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
              filter === cat 
                ? 'bg-slate-900 text-white border-slate-900' 
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOpportunities.map((opt) => (
          <div key={opt.id} className="group bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl bg-slate-50 group-hover:bg-white transition-colors`}>
                {getCategoryIcon(opt.category)}
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-xs font-black px-2 py-1 rounded-lg uppercase tracking-wider ${
                  opt.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 
                  opt.trend === 'down' ? 'bg-rose-50 text-rose-600' : 
                  'bg-indigo-50 text-indigo-600'
                }`}>
                  {opt.trendValue}
                </span>
                <span className="text-[10px] text-slate-400 font-bold mt-1 uppercase">{opt.trend === 'up' ? 'Trending Up' : opt.trend === 'down' ? 'Price Drop' : 'Special Offer'}</span>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Tag size={12} className="text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{opt.category}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 leading-tight mb-2 group-hover:text-emerald-600 transition-colors">
                {opt.title}
              </h3>
              <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">
                {opt.explanation}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Calendar size={12} />
                <span className="text-[10px] font-bold">{opt.date}</span>
              </div>
              <button className="text-emerald-600 text-xs font-bold flex items-center gap-1 group/btn hover:underline">
                View Details <ArrowUpRight size={14} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredOpportunities.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
          <Zap className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-bold text-slate-800">No opportunities found</h3>
          <p className="text-slate-500">Try changing your filter settings to see more results.</p>
        </div>
      )}
    </div>
  );
};

export default MarketOpportunities;
