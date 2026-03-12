import React, { useState, useEffect } from 'react';
import PortfolioSummary from '../components/investments/PortfolioSummary';
import InvestmentForm from '../components/investments/InvestmentForm';
import InvestmentList from '../components/investments/InvestmentList';
import GrowthChart from '../components/investments/GrowthChart';
import { getInvestments, getPortfolioSummary, createInvestment, deleteInvestment } from '../services/investmentService';
import { Briefcase, Loader2, Sparkles } from 'lucide-react';

const Investments = () => {
  const [investments, setInvestments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const invRes = await getInvestments();
      const sumRes = await getPortfolioSummary();
      setInvestments(invRes);
      setSummary(sumRes);
    } catch (err) {
      console.error('Error fetching investments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddInvestment = async (newData) => {
    const res = await createInvestment(newData);
    if (res.success) {
      // Refresh all data to get updated summary and list
      fetchData();
    }
  };

  const handleDeleteInvestment = async (id) => {
    const res = await deleteInvestment(id);
    if (res.success) {
      fetchData();
    }
  };

  if (loading || !summary) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-slate-400">
        <Loader2 className="animate-spin mb-4 text-blue-500" size={48} />
        <p className="font-medium animate-pulse tracking-tight">Syncing with market data...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
              <Briefcase className="text-white" size={24} />
            </div>
            Portfolio Manager
          </h1>
          <p className="text-slate-500 font-medium mt-1">Smart asset tracking and wealth advisory</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            AI
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Market Status</div>
            <div className="flex items-center gap-1.5">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-xs font-black text-emerald-600">BULLISH TREND</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <PortfolioSummary summary={summary} />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Column: List & Growth */}
          <div className="xl:col-span-8 space-y-6">
            <div className="h-[350px]">
              <GrowthChart investments={investments} />
            </div>
            <div className="h-[450px]">
              <InvestmentList investments={investments} onDeleteInvestment={handleDeleteInvestment} />
            </div>
          </div>

          {/* Right Column: Actions & Advice */}
          <div className="xl:col-span-4 space-y-6">
            <InvestmentForm onAddInvestment={handleAddInvestment} />
            
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl shadow-xl shadow-blue-200 relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                   <Sparkles className="text-blue-200" size={20} />
                   <h3 className="text-lg font-bold text-white tracking-tight">Investment Insights</h3>
                </div>
                <p className="text-blue-100 text-sm leading-relaxed mb-6 font-medium">
                  Your portfolio is currently 80% concentrated in Mutual Funds. Diverging 15% into Digital Gold could hedge against upcoming market volatility.
                </p>
                <button className="w-full py-2.5 bg-white text-blue-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-50 transition-colors">
                  View Strategy
                </button>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 rounded-full group-hover:bg-white/20 transition-all duration-700" />
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Top Opportunities</h4>
                <div className="space-y-3">
                    {[
                      { name: 'Nifty 50 Index Fund', return: '+14.2%', risk: 'Medium' },
                      { name: 'Tata Motors Equity', return: '+22.1%', risk: 'High' },
                      { name: 'Digital Gold (24K)', return: '+8.5%', risk: 'Low' }
                    ].map((opt, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-white transition-all hover:border-blue-200 cursor-pointer">
                        <div>
                          <p className="text-xs font-bold text-slate-700">{opt.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{opt.risk} Risk</p>
                        </div>
                        <span className="text-xs font-black text-emerald-500">{opt.return}</span>
                      </div>
                    ))}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Investments;
