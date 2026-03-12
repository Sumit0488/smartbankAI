import React, { useState, useMemo } from 'react';
import { X, TrendingUp, AlertTriangle, Info, Sparkles, Loader2, ArrowLeft, BarChart2 } from 'lucide-react';
import { generateInvestmentExplanation } from '../../services/aiService';
import { createInvestment } from '../../services/apiService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const generateInvestmentStats = (name) => {
   const len = name.length;
   return {
     returns: len % 2 === 0 ? '12 - 15% p.a.' : '8 - 10% p.a.',
     risk: len % 3 === 0 ? 'High' : (len % 2 === 0 ? 'Medium' : 'Low'),
     description: `${name} is a popular investment choice designed to offer balanced growth over a medium to long term horizon. Ideal for diversifying your portfolio.`
   };
};

const generateMockStockData = (timeline) => {
  const data = [];
  let currentPrice = 300 + Math.random() * 100;
  let points = 30; // 1M default

  switch(timeline) {
    case '1D': points = 24; break; // Hours
    case '5D': points = 5; break;
    case '1M': points = 30; break;
    case '6M': points = 180; break;
    case '1Y': points = 12; break; // Months
    case '5Y': points = 60; break;
    default: points = 30;
  }

  for (let i = 0; i < points; i++) {
    // Add some random walk volatility
    const change = (Math.random() - 0.45) * 15;
    currentPrice += change;
    data.push({
      time: i,
      price: Number(currentPrice.toFixed(2))
    });
  }
  return data;
};

const InvestmentModal = ({ isOpen, onClose, investmentName, investmentType, onInvest }) => {
  const [step, setStep] = useState('info'); // 'info', 'invest', or 'learn_more'
  const [amount, setAmount] = useState('');
  const [aiExplanation, setAiExplanation] = useState('');
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [chartTimeline, setChartTimeline] = useState('1M');

  const stockData = useMemo(() => generateMockStockData(chartTimeline), [chartTimeline]);
  const currentPrice = stockData[stockData.length - 1]?.price || 350.80;
  const startPrice = stockData[0]?.price || 350.80;
  const priceChange = currentPrice - startPrice;
  const percentChange = ((priceChange / startPrice) * 100).toFixed(2);
  const isPositive = priceChange >= 0;

  // Derive Open, High, Low from data
  const highPrice = Math.max(...stockData.map(d => d.price));
  const lowPrice = Math.min(...stockData.map(d => d.price));
  const openPrice = startPrice;
  const marketCap = (startPrice * 1234.56).toFixed(2) + " Cr";
  const high52 = (highPrice * 1.3).toFixed(2);
  const low52 = (lowPrice * 0.7).toFixed(2);

  if (!isOpen || !investmentName) return null;

  const stats = generateInvestmentStats(investmentName);

  const handleInvestSubmit = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;
    
    const newInvestment = {
      id: Date.now().toString(),
      name: investmentName,
      type: investmentType,
      investedAmount: Number(amount),
      purchaseDate: new Date().toISOString().split('T')[0],
      currentValue: Number(amount) + (Math.floor(Math.random() * 200) - 50)
    };
    
    newInvestment.profitOrLoss = newInvestment.currentValue - newInvestment.investedAmount;

    await createInvestment(newInvestment);

    onInvest(newInvestment);
    setStep('info');
    setAmount('');
  };

  const handleLearnMore = async () => {
    setStep('learn_more');
    if (!aiExplanation) {
      setIsLoadingExplanation(true);
      const explanation = await generateInvestmentExplanation(investmentName);
      setAiExplanation(explanation);
      setIsLoadingExplanation(false);
    }
  };

  const closeModal = () => {
    setStep('info');
    setAmount('');
    setAiExplanation('');
    onClose();
  };

  const renderMarkdown = (text) => {
    if (!text) return null;
    let htmlContent = text
      .replace(/### (.*)/g, '<h4 class="text-lg font-bold text-slate-900 mt-8 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2"><div class="w-1.5 h-5 bg-indigo-500 rounded-full"></div>$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900">$1</strong>')
      .replace(/- \*\*(.*?)\*\*:(.*)/g, '<li class="ml-5 list-disc mb-2"><strong class="text-slate-900">$1</strong>:$2</li>')
      .replace(/\* \*\*(.*?)\*\*:(.*)/g, '<li class="ml-5 list-disc mb-2"><strong class="text-slate-900">$1</strong>:$2</li>')
      .replace(/- (.*)/g, '<li class="ml-5 list-disc mb-2">$1</li>')
      .replace(/\* (.*)/g, '<li class="ml-5 list-disc mb-2">$1</li>');

    return <div dangerouslySetInnerHTML={{ __html: htmlContent }} className="text-base text-slate-600 leading-relaxed whitespace-pre-wrap" />;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-sm">
          <p className="font-bold">₹{payload[0].value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 transition-all ${step === 'learn_more' ? 'w-full max-w-5xl h-[90vh] flex flex-col' : 'w-full max-w-md'}`}>
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50 relative shrink-0">
          <div className="flex items-center gap-3">
             {step === 'learn_more' && (
                <button onClick={() => setStep('info')} className="p-2 mr-2 hover:bg-slate-200 rounded-full text-slate-600 transition-colors">
                  <ArrowLeft size={20} />
                </button>
             )}
             <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">
                {step === 'learn_more' ? <BarChart2 size={24} /> : <TrendingUp size={20} />}
             </div>
             <div>
               <h2 className={`font-bold text-slate-900 line-clamp-1 pr-4 ${step === 'learn_more' ? 'text-2xl' : 'text-xl'}`}>{investmentName}</h2>
               {step === 'learn_more' && <span className="text-sm font-medium text-slate-500">{investmentType}</span>}
             </div>
          </div>
          <button onClick={closeModal} className="text-slate-400 hover:text-rose-500 transition-colors absolute right-6 top-6 bg-slate-50">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className={`p-6 ${step === 'learn_more' ? 'flex-1 overflow-y-auto custom-scrollbar flex flex-col lg:flex-row gap-8' : ''}`}>
          {step === 'info' ? (
            <div className="space-y-6 animate-in slide-in-from-right-4">
               <div>
                  <span className="inline-block bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider mb-3">
                    {investmentType}
                  </span>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    {stats.description}
                  </p>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                   <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                     <TrendingUp size={14} /> Expected Returns
                   </p>
                   <p className="font-bold text-slate-900 text-lg">{stats.returns}</p>
                 </div>
                 <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl">
                   <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                     <AlertTriangle size={14} /> Risk Level
                   </p>
                   <p className="font-bold text-slate-900 text-lg">{stats.risk}</p>
                 </div>
               </div>

               <div className="flex gap-3 pt-2">
                 <button 
                  onClick={handleLearnMore}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 py-3 rounded-xl text-slate-700 font-medium transition-colors flex items-center justify-center gap-2 border border-slate-200"
                 >
                   <Sparkles size={16} className="text-indigo-500" />
                   Learn More
                 </button>
                 <button 
                  onClick={() => setStep('invest')}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 py-3 rounded-xl text-white font-medium transition-colors shadow-sm shadow-emerald-200"
                 >
                   Invest Now
                 </button>
               </div>
            </div>
          ) : step === 'learn_more' ? (
            <>
              {/* Left Column: Interactive Graph */}
              <div className="flex-1 flex flex-col min-w-0">
                 <div className="mb-6">
                    <div className="flex items-end gap-3 mb-1">
                      <h3 className="text-4xl font-extrabold text-slate-900">₹{currentPrice.toFixed(2)}</h3>
                      <span className={`text-lg font-bold mb-1 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({isPositive ? '+' : ''}{percentChange}%)
                      </span>
                    </div>
                    <p className="text-slate-500 font-medium tracking-wide text-sm uppercase">Past {chartTimeline}</p>
                 </div>

                 <div className="h-64 sm:h-80 w-full mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stockData}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area 
                          type="monotone" 
                          dataKey="price" 
                          stroke={isPositive ? '#10b981' : '#f43f5e'} 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorPrice)" 
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                 </div>

                 {/* Timeline controls */}
                 <div className="flex gap-2 mb-8 bg-slate-50 p-1 rounded-xl w-fit border border-slate-200">
                    {['1D', '5D', '1M', '6M', '1Y', '5Y'].map(t => (
                      <button 
                        key={t}
                        onClick={() => setChartTimeline(t)}
                        className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${chartTimeline === t ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        {t}
                      </button>
                    ))}
                 </div>

                 {/* Key Metrics Grid */}
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 p-6 bg-slate-50 border border-slate-100 rounded-2xl mb-8">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Open Price</p>
                      <p className="text-lg font-bold text-slate-900">₹{openPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Day High</p>
                      <p className="text-lg font-bold text-slate-900">₹{highPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Day Low</p>
                      <p className="text-lg font-bold text-slate-900">₹{lowPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Market Cap</p>
                      <p className="text-lg font-bold text-slate-900">₹{marketCap}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">52-Week High</p>
                      <p className="text-lg font-bold text-slate-900">₹{high52}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">52-Week Low</p>
                      <p className="text-lg font-bold text-slate-900">₹{low52}</p>
                    </div>
                 </div>
              </div>

              {/* Right Column: AI Insights */}
              <div className="w-full lg:w-[450px] shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 pt-8 lg:pt-0 lg:pl-8">
                <div className="inline-flex items-center gap-2 mb-4 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full font-bold text-sm border border-indigo-100 shadow-sm">
                  <Sparkles size={16} /> AI Investment Analysis
                </div>
                
                {isLoadingExplanation ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                     <Loader2 size={40} className="animate-spin mb-6 text-indigo-500" />
                     <p className="font-bold text-slate-600 animate-pulse text-lg">Analyzing market trends...</p>
                     <p className="text-sm mt-2 text-center max-w-xs">Generating simple explanation and professional insights for {investmentName}</p>
                  </div>
                ) : (
                  <div className="pr-2 pb-8">
                     {renderMarkdown(aiExplanation)}

                     <button 
                      onClick={() => setStep('invest')}
                      className="w-full mt-8 bg-emerald-500 hover:bg-emerald-600 py-4 rounded-xl text-white font-bold text-lg transition-colors shadow-lg shadow-emerald-200"
                     >
                       Invest Now
                     </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4">
               <div className="bg-indigo-50 p-4 rounded-xl flex items-start gap-3 text-indigo-800 text-sm">
                 <Info className="shrink-0 mt-0.5" size={18} />
                 <p>You are about to simulate an investment in <strong>{investmentName}</strong>.</p>
               </div>

               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2">Enter Amount to Invest (₹)</label>
                 <input 
                   type="number" 
                   value={amount}
                   onChange={(e) => setAmount(e.target.value)}
                   className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                   placeholder="e.g. 5000"
                   autoFocus
                 />
               </div>

               <div className="flex gap-3 pt-2">
                 <button 
                  onClick={() => setStep('info')}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 py-3 rounded-xl text-slate-700 font-medium transition-colors"
                 >
                   Back
                 </button>
                 <button 
                  onClick={handleInvestSubmit}
                  disabled={!amount || Number(amount) <= 0}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed py-3 rounded-xl text-white font-medium transition-colors shadow-sm"
                 >
                   Confirm Payment
                 </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestmentModal;
