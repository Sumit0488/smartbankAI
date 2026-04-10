import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, Loader2, ArrowLeft, Shield,
  CheckCircle2, CreditCard, ChevronRight, Sparkles, Briefcase,
  BarChart2, Clock, Star, Zap, AlertTriangle, IndianRupee
} from 'lucide-react';
import { listInvestmentOptions, listCompanies, processDummyPayment, createInvestment } from '../services/investmentService';

// ── Simulated price chart generator ──────────────────────────────────────────
const generateChartData = (basePrice, expectedReturn, days) => {
  const annualRate = parseFloat(String(expectedReturn).replace('%', '').split('-')[0]) / 100 || 0.12;
  const dailyRate = annualRate / 365;
  const volatility = annualRate * 0.6;
  let price = basePrice;
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    const change = price * (dailyRate + (Math.random() - 0.48) * volatility);
    price = Math.max(price * 0.5, price + change);
    return {
      date: days <= 1
        ? `${date.getHours()}:00`
        : days <= 7
        ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]
        : days <= 31
        ? `${date.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][date.getMonth()]}`
        : `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][date.getMonth()]} '${String(date.getFullYear()).slice(2)}`,
      price: Math.round(price * 100) / 100,
    };
  });
};

const TIMEFRAMES = [
  { label: '1D', days: 1 },
  { label: '5D', days: 5 },
  { label: '1M', days: 30 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
  { label: '5Y', days: 1825 },
];

// Category groupings
const CATEGORY_META = {
  MUTUAL_FUND: { label: 'Mutual Funds', icon: '📈', gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-200', risk: 'Medium', desc: 'Professionally managed diversified portfolios' },
  STOCK:       { label: 'Stocks',       icon: '📊', gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-200', risk: 'High', desc: 'Direct equity in leading companies' },
  FIXED_DEPOSIT: { label: 'Fixed Deposit', icon: '🏦', gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-200', risk: 'Low', desc: 'Guaranteed returns from banks' },
  PF:          { label: 'Provident Fund', icon: '🛡️', gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-200', risk: 'Very Low', desc: 'Government-backed retirement savings' },
  SIP:         { label: 'SIP',           icon: '🔄', gradient: 'from-cyan-500 to-blue-500', shadow: 'shadow-cyan-200', risk: 'Medium', desc: 'Systematic monthly investment plans' },
};

const riskColor = (risk) => {
  if (!risk) return 'bg-slate-100 text-slate-600';
  const r = risk.toLowerCase();
  if (r.includes('very low') || r.includes('low')) return 'bg-emerald-100 text-emerald-700';
  if (r.includes('medium')) return 'bg-amber-100 text-amber-700';
  return 'bg-rose-100 text-rose-700';
};

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-sm font-bold shadow-xl border border-slate-700">
      <div className="text-slate-400 text-xs">{payload[0].payload.date}</div>
      <div className="text-emerald-400">₹{fmt(payload[0].value)}</div>
    </div>
  );
};

const Investments = () => {
  const [step, setStep] = useState(1); // 1: Options, 2: Companies, 3: Detail+Chart, 4: Payment, 5: Success
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [investmentAmount, setInvestmentAmount] = useState('10000');
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [timeframe, setTimeframe] = useState('1M');
  const [basePrice] = useState(() => 800 + Math.random() * 400);

  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      const res = await listInvestmentOptions();
      setOptions(res);
      setLoading(false);
    };
    fetchOptions();
  }, []);

  const chartData = useMemo(() => {
    if (!selectedCompany) return [];
    const tf = TIMEFRAMES.find(t => t.label === timeframe);
    return generateChartData(basePrice, selectedCompany.expectedReturn, tf.days);
  }, [selectedCompany, timeframe, basePrice]);

  const priceChange = useMemo(() => {
    if (chartData.length < 2) return { val: 0, pct: 0, up: true };
    const first = chartData[0].price;
    const last = chartData[chartData.length - 1].price;
    const val = last - first;
    const pct = ((val / first) * 100);
    return { val: Math.abs(val).toFixed(2), pct: Math.abs(pct).toFixed(2), up: val >= 0, currentPrice: last.toFixed(2) };
  }, [chartData]);

  const handleSelectOption = async (opt) => {
    setSelectedOption(opt);
    setLoading(true);
    const res = await listCompanies(opt.type);
    setCompanies(res);
    setLoading(false);
    setStep(2);
  };

  const handleSelectCompany = (comp) => {
    setSelectedCompany(comp);
    setTimeframe('1M');
    setStep(3);
  };

  const handlePayment = async (method) => {
    setLoading(true);
    const res = await processDummyPayment({
      amount: Number(investmentAmount),
      paymentMethod: method,
      companyId: selectedCompany.id,
    });
    if (res?.success) {
      await createInvestment({
        amount: Number(investmentAmount),
        investmentType: selectedOption.type,
        expectedReturn: parseFloat(String(selectedCompany.expectedReturn).replace('%', '').split('-')[0]) || undefined,
        notes: `Invested in ${selectedCompany.name}`,
      });
      setPaymentStatus(res);
      setStep(5);
    }
    setLoading(false);
  };

  const meta = selectedOption ? (CATEGORY_META[selectedOption.type] || {}) : {};

  if (loading && step === 1) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-16 text-slate-400">
        <Loader2 className="animate-spin mb-4 text-blue-500" size={44} />
        <p className="font-bold animate-pulse">Loading investment opportunities...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-10 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-200">
              <Briefcase className="text-white" size={22} />
            </div>
            AI Investment Advisor
          </h1>
          <p className="text-slate-500 font-medium mt-1">Personalized wealth creation strategies</p>
        </div>
        {step > 1 && step < 5 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-sm transition-all"
          >
            <ArrowLeft size={15} /> Back
          </button>
        )}
      </div>

      {/* Step 1: Investment Categories */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-400">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {options.map((opt) => {
              const m = CATEGORY_META[opt.type] || {};
              return (
                <button
                  key={opt.type}
                  onClick={() => handleSelectOption(opt)}
                  className="text-left p-6 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl hover:border-blue-400 hover:shadow-xl transition-all duration-200 group relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${m.gradient || 'from-blue-500 to-indigo-600'} opacity-5 rounded-full -mr-8 -mt-8 group-hover:opacity-10 transition-opacity`} />
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 bg-gradient-to-br ${m.gradient || 'from-blue-500 to-indigo-600'} rounded-2xl shadow-lg ${m.shadow || ''}`}>
                      <span className="text-xl">{m.icon || '📈'}</span>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full ${riskColor(opt.riskLevel)}`}>
                      {(opt.riskLevel || 'MEDIUM').toUpperCase()} RISK
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-1">{m.label || opt.type.replace('_', ' ')}</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed mb-4">{opt.description || m.desc}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">Expected Return</p>
                      <p className="text-lg font-black text-blue-600">{opt.expectedReturn}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">Min. Investment</p>
                      <p className="text-sm font-black text-slate-700">₹{fmt(opt.minInvestment)}</p>
                    </div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Companies */}
      {step === 2 && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-400">
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2.5 bg-gradient-to-br ${meta.gradient || 'from-blue-500 to-indigo-600'} rounded-2xl`}>
              <span className="text-lg">{meta.icon || '📈'}</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800">{meta.label || selectedOption?.type} Providers</h2>
              <p className="text-slate-500 text-sm font-medium">Select a fund or company to invest in</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 className="animate-spin mr-3 text-blue-500" size={32} />
              <span className="font-bold animate-pulse">Fetching providers...</span>
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <AlertTriangle size={40} className="mx-auto mb-3 text-amber-400" />
              <p className="font-bold">No providers available for this category right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companies.map((comp) => (
                <button
                  key={comp.id}
                  onClick={() => handleSelectCompany(comp)}
                  className="text-left flex items-center justify-between p-5 bg-white border-2 border-slate-100 rounded-3xl hover:border-blue-400 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-slate-600 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                      {comp.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-base">{comp.name}</h4>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <TrendingUp size={11} /> {comp.expectedReturn}
                        </span>
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                          <Clock size={11} /> {comp.duration}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Company Detail + Chart */}
      {step === 3 && selectedCompany && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-400 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Chart Area */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black">
                      {selectedCompany.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-800">{selectedCompany.name}</h2>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{selectedOption?.type?.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-800">₹{fmt(priceChange.currentPrice)}</div>
                  <div className={`flex items-center gap-1 justify-end text-sm font-black ${priceChange.up ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {priceChange.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {priceChange.up ? '+' : '-'}₹{priceChange.val} ({priceChange.pct}%)
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 mt-0.5">{timeframe} change</div>
                </div>
              </div>

              {/* Timeframe Tabs */}
              <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-xl w-fit">
                {TIMEFRAMES.map(tf => (
                  <button
                    key={tf.label}
                    onClick={() => setTimeframe(tf.label)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${timeframe === tf.label ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              {/* Price Chart */}
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={priceChange.up ? '#10b981' : '#ef4444'} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={priceChange.up ? '#10b981' : '#ef4444'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} width={45} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={priceChange.up ? '#10b981' : '#ef4444'}
                    strokeWidth={2}
                    fill="url(#priceGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: priceChange.up ? '#10b981' : '#ef4444' }}
                  />
                </AreaChart>
              </ResponsiveContainer>

              <p className="text-[10px] text-slate-400 mt-2 text-center font-semibold">
                * Simulated price chart based on expected return. Not real market data.
              </p>
            </div>

            {/* Company Details + Invest */}
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Market Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500 font-semibold">Expected Return</span>
                    <span className="text-sm font-black text-emerald-600">{selectedCompany.expectedReturn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500 font-semibold">Duration</span>
                    <span className="text-sm font-black text-slate-700">{selectedCompany.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500 font-semibold">Type</span>
                    <span className="text-sm font-black text-slate-700">{selectedOption?.type?.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500 font-semibold">Risk Level</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${riskColor(selectedOption?.riskLevel)}`}>
                      {(selectedOption?.riskLevel || 'Medium').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-3xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={16} className="text-blue-600" />
                  <h4 className="text-xs font-black text-blue-700 uppercase tracking-widest">Details</h4>
                </div>
                <p className="text-sm font-medium text-blue-800 leading-relaxed">{selectedCompany.details}</p>
              </div>

              {/* Amount Selector */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Invest Amount</span>
                  <span className="text-xl font-black text-slate-800">₹{fmt(investmentAmount)}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="500000"
                  step="500"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-2"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>₹500</span><span>₹5,00,000</span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3">
                  {['5000', '10000', '25000'].map(v => (
                    <button
                      key={v}
                      onClick={() => setInvestmentAmount(v)}
                      className={`py-1.5 rounded-xl text-xs font-black transition-all ${investmentAmount === v ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      ₹{fmt(v)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep(4)}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black text-base shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 group"
              >
                <Zap size={18} className="group-hover:scale-110 transition-transform" />
                Invest Now — ₹{fmt(investmentAmount)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Payment */}
      {step === 4 && selectedCompany && (
        <div className="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-400">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl p-8 space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Shield className="text-blue-600" size={28} />
              </div>
              <h2 className="text-2xl font-black text-slate-800">Secure Checkout</h2>
              <p className="text-slate-500 font-medium text-sm mt-1">Choose your payment method</p>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold text-sm">Fund</span>
                <span className="font-black text-slate-800 text-sm">{selectedCompany.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold text-sm">Expected Return</span>
                <span className="font-black text-emerald-600 text-sm">{selectedCompany.expectedReturn}</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                <span className="text-slate-500 font-bold">Total Amount</span>
                <span className="text-2xl font-black text-blue-600">₹{fmt(investmentAmount)}</span>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { method: 'UPI', label: 'UPI / Net Banking', icon: IndianRupee },
                { method: 'CARD', label: 'Credit / Debit Card', icon: CreditCard },
              ].map(({ method, label, icon: Icon }) => (
                <button
                  key={method}
                  onClick={() => handlePayment(method)}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-4 bg-white border-2 border-slate-100 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                    <span className="font-black text-slate-700">{label}</span>
                  </div>
                  {loading ? <Loader2 size={18} className="animate-spin text-blue-500" /> : <ChevronRight size={18} className="text-slate-300" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Success */}
      {step === 5 && paymentStatus && (
        <div className="max-w-md mx-auto text-center animate-in zoom-in-95 duration-500 py-10">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={52} className="text-emerald-600" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">Investment Successful!</h2>
          <p className="text-slate-500 max-w-sm mx-auto mb-6 font-medium leading-relaxed">
            You've successfully invested <span className="font-black text-slate-800">₹{fmt(investmentAmount)}</span> in{' '}
            <span className="font-black text-blue-600">{selectedCompany?.name}</span>. Your portfolio will reflect this shortly.
          </p>
          <div className="inline-block px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl mb-8">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Transaction ID</p>
            <p className="font-mono text-sm font-bold text-slate-700">{paymentStatus.transactionId}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setStep(1); setSelectedOption(null); setSelectedCompany(null); setPaymentStatus(null); }}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black transition-all"
            >
              Invest Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black shadow-xl shadow-slate-200 transition-all"
            >
              View Portfolio
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Investments;
