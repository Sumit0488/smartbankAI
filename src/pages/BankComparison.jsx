import React, { useState, useMemo } from 'react';
import { 
  Landmark, Info, CheckCircle2, RefreshCcw, Sparkles, Activity, ArrowRightLeft, ShieldCheck,
  Briefcase, Zap, TrendingUp
} from 'lucide-react';
import ComparisonTables from '../components/bank-comparison/ComparisonTables';
import BankProsCons from '../components/bank-comparison/BankProsCons';

// --- ADVANCED MOCK DATA ---
const ADVANCED_BANKS = [
  {
    id: 'hdfc',
    name: 'HDFC Bank',
    minBalance: 5000,
    onlineOpening: 'Yes (Video KYC)',
    appRating: 4.6,
    atmNetwork: 'Large (18,000+ ATMs)',
    score: 92,
    debitCard: {
      name: 'Millennia Debit Card',
      fee: '₹500/yr',
      limit: '₹50,000',
      intl: 'Yes',
      contactless: 'Yes',
      lounge: 'Available',
      cashback: '5% Online'
    },
    pros: ['Excellent mobile banking', 'Premium debit cards', 'Fast online account opening'],
    cons: ['Higher minimum balance', 'Strict non-maintenance charges'],
    services: {
      loans: '10.50%+',
      cc: 'Instant',
      forex: 'Available',
      intlTransfers: '24 hours',
      support: '24/7 Priority'
    },
    products: { savings: true, salary: true, business: true, loans: true, cc: true, forex: true }
  },
  {
    id: 'sbi',
    name: 'State Bank of India',
    minBalance: 0,
    onlineOpening: 'Yes (YONO)',
    appRating: 4.2,
    atmNetwork: 'Largest (60,000+ ATMs)',
    score: 88,
    debitCard: {
      name: 'Global Contactless',
      fee: '₹300/yr',
      limit: '₹40,000',
      intl: 'Yes',
      contactless: 'Yes',
      lounge: 'Limited',
      cashback: 'Reward Points'
    },
    pros: ['Zero balance accounts', 'Largest ATM network', 'High trust & security'],
    cons: ['Slower digital services', 'Customer support can be delayed'],
    services: {
      loans: '11.00%+',
      cc: 'Subject to approval',
      forex: 'Available',
      intlTransfers: '1-2 days',
      support: 'Standard 9-5'
    },
    products: { savings: true, salary: true, business: true, loans: true, cc: true, forex: true }
  },
  {
    id: 'icici',
    name: 'ICICI Bank',
    minBalance: 10000,
    onlineOpening: 'Yes (Insta KYC)',
    appRating: 4.5,
    atmNetwork: 'Large (15,000+ ATMs)',
    score: 90,
    debitCard: {
      name: 'Coral Platinum',
      fee: '₹499/yr',
      limit: '₹50,000',
      intl: 'Yes',
      contactless: 'Yes',
      lounge: 'Available',
      cashback: 'Smart Rewards'
    },
    pros: ['Great tech integration', 'iMobile app is feature-rich', 'Good forex rates'],
    cons: ['High minimum balance for regular accounts', 'Premium cards require high spend'],
    services: {
      loans: '10.75%+',
      cc: 'Pre-approved',
      forex: 'Excellent',
      intlTransfers: '24 hours',
      support: '24/7 Digital'
    },
    products: { savings: true, salary: true, business: true, loans: true, cc: true, forex: true }
  },
  {
    id: 'axis',
    name: 'Axis Bank',
    minBalance: 10000,
    onlineOpening: 'Yes (ASAP)',
    appRating: 4.4,
    atmNetwork: 'Medium (12,000+ ATMs)',
    score: 87,
    debitCard: {
      name: 'Online Rewards Card',
      fee: '₹500/yr',
      limit: '₹50,000',
      intl: 'Yes',
      contactless: 'Yes',
      lounge: 'Available',
      cashback: '1% Flat Edge Rewards'
    },
    pros: ['Good reward programs', 'Partner discounts', 'Seamless UPI'],
    cons: ['Hidden fees on some services', 'Branch service varies'],
    services: {
      loans: '10.99%+',
      cc: 'Instant',
      forex: 'Available',
      intlTransfers: '1-2 days',
      support: 'Standard'
    },
    products: { savings: true, salary: true, business: true, loans: true, cc: true, forex: true }
  },
  {
    id: 'kotak',
    name: 'Kotak Mahindra',
    minBalance: 0,
    onlineOpening: 'Yes (811 Digital)',
    appRating: 4.7,
    atmNetwork: 'Small (3,000+ ATMs)',
    score: 89,
    debitCard: {
      name: '811 Virtual/Physical',
      fee: '₹299/yr',
      limit: '₹40,000',
      intl: 'Yes',
      contactless: 'Yes',
      lounge: 'No',
      cashback: 'Basic'
    },
    pros: ['Fully digital account opening', 'Zero balance (811 variant)', 'High interest on savings'],
    cons: ['Small ATM network', 'Physical debit card has fees'],
    services: {
      loans: '11.25%+',
      cc: 'Subject to approval',
      forex: 'Limited',
      intlTransfers: '2-3 days',
      support: 'App-based priority'
    },
    products: { savings: true, salary: true, business: true, loans: true, cc: true, forex: false }
  }
];

const USER_NEEDS = [
  { id: 'student', label: 'Student Account', icon: <ShieldCheck size={18} /> },
  { id: 'salary', label: 'Salary Account', icon: <Briefcase size={18} /> },
  { id: 'business', label: 'Business Account', icon: <Landmark size={18} /> },
  { id: 'digital', label: 'Digital Banking', icon: <Zap size={18} /> },
  { id: 'lowfee', label: 'Low Fee Account', icon: <TrendingUp size={18} /> }
];

const BankComparison = () => {
  const [bank1Id, setBank1Id] = useState('hdfc');
  const [bank2Id, setBank2Id] = useState('sbi');
  const [activeNeed, setActiveNeed] = useState('student');

  const b1 = useMemo(() => ADVANCED_BANKS.find(b => b.id === bank1Id), [bank1Id]);
  const b2 = useMemo(() => ADVANCED_BANKS.find(b => b.id === bank2Id), [bank2Id]);

  // Dynamic AI Need Recommendation
  const needRecommendation = useMemo(() => {
    switch (activeNeed) {
      case 'student': return {
        bank: 'State Bank of India',
        reason: 'Zero balance account, large ATM network, and simple KYC requirements make it perfect for students.',
        insight: 'Students often prefer SBI due to zero balance accounts and wide accessibility.'
      };
      case 'salary': return {
        bank: 'HDFC Bank',
        reason: 'Superior salary account perks, premium debit cards, and seamless digital banking integration.',
        insight: 'Professionals prefer HDFC for better digital banking and instant credit card approvals.'
      };
      case 'business': return {
        bank: 'ICICI Bank',
        reason: 'Robust corporate banking portal, excellent current accounts, and rapid forex/trade services.',
        insight: 'Businesses favor ICICI for its seamless API integrations and vast corporate branch network.'
      };
      case 'digital': return {
        bank: 'Kotak Mahindra',
        reason: 'The Kotak 811 account is fully digital, zero balance, and offers high interest rates.',
        insight: 'Digital-first users appreciate Kotak 811 for requiring zero branch visits.'
      };
      case 'lowfee': return {
        bank: 'State Bank of India',
        reason: 'Minimal hidden charges, low debit card annual fees, and zero balance options available.',
        insight: 'Cost-conscious users choose SBI to avoid non-maintenance penalties.'
      };
      default: return { bank: '', reason: '', insight: '' };
    }
  }, [activeNeed]);

  // AI Advantage Analysis
  const aiAdvantage = useMemo(() => {
    if (b1.id === b2.id) return `Both are the same bank.`;
    
    // Simple dynamic generator
    if (b1.score > b2.score) {
       return `Why ${b1.name} is generally preferred over ${b2.name}: Better mobile banking experience, ${b1.pros[1].toLowerCase()}, and overall higher feature score (${b1.score} vs ${b2.score}).`;
    } else if (b2.score > b1.score) {
       return `Why ${b2.name} is generally preferred over ${b1.name}: ${b2.pros[0]}, ${b2.pros[1].toLowerCase()}, and overall higher feature score (${b2.score} vs ${b1.score}).`;
    }
    return `Both ${b1.name} and ${b2.name} offer highly competitive features with identical overall AI scores. Choose based on your proximity to their branches.`;
  }, [b1, b2]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2 mb-2">
            Compare Banks <Landmark className="text-indigo-500" size={28} />
          </h1>
          <p className="text-slate-600">Complete AI-powered bank comparison and insights engine.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
          <RefreshCcw size={14} className="text-emerald-500" /> AI updated today
        </div>
      </div>

      {/* SECTION 4, 8, 10: User Need & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* User Need Selector */}
         <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 col-span-1">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">What are you looking for?</h3>
            <div className="space-y-2">
               {USER_NEEDS.map(need => (
                 <button
                   key={need.id}
                   onClick={() => setActiveNeed(need.id)}
                   className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${
                     activeNeed === need.id 
                       ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm font-bold' 
                       : 'border-slate-100 bg-slate-50 text-slate-600 font-semibold hover:border-indigo-200 hover:bg-white'
                   }`}
                 >
                   <span className={activeNeed === need.id ? 'text-indigo-600' : 'text-slate-400'}>{need.icon}</span>
                   {need.label}
                   {activeNeed === need.id && <CheckCircle2 size={16} className="ml-auto text-indigo-500" />}
                 </button>
               ))}
            </div>
         </div>

         {/* AI Recommendation Summary Card */}
         <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl col-span-1 lg:col-span-2 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full" />
            
            <div>
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm tracking-wider uppercase mb-2">
                <Sparkles size={16} /> Best Bank for {USER_NEEDS.find(n => n.id === activeNeed)?.label.replace(' Account','s')}
              </div>
              <h2 className="text-4xl font-extrabold text-white mb-4">{needRecommendation.bank}</h2>
              
              <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm mb-4">
                 <p className="text-slate-200 text-sm leading-relaxed">
                   <strong className="text-white">Reason:</strong> {needRecommendation.reason}
                 </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-indigo-950/50 p-4 rounded-xl border border-indigo-500/30">
               <Info size={20} className="text-indigo-400 shrink-0 mt-0.5" />
               <p className="text-sm text-indigo-100 font-medium">
                 <span className="font-bold text-indigo-300">Smart Insight:</span> {needRecommendation.insight}
               </p>
            </div>
         </div>
      </div>

      {/* SECTION 1: Bank vs Bank Head-to-Head */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative">
        <h2 className="text-xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
           <ArrowRightLeft className="text-indigo-500" size={24} /> Head-to-Head Comparison
        </h2>

        {/* Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
           <div>
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Bank 1</label>
             <select 
                value={bank1Id} onChange={(e) => setBank1Id(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
             >
                {ADVANCED_BANKS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
             </select>
           </div>
           <div>
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Bank 2</label>
             <select 
                value={bank2Id} onChange={(e) => setBank2Id(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
             >
                {ADVANCED_BANKS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
             </select>
           </div>
        </div>

        {/* SECTION 3 & 5: AI Advantage & Scores */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
           <div className="col-span-1 lg:col-span-2 bg-indigo-50 p-5 rounded-2xl border border-indigo-100 flex items-start gap-4">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full shrink-0 mt-1">
                 <Activity size={20} />
              </div>
              <div>
                 <h4 className="font-bold text-indigo-900 mb-1">AI Advantage Analysis</h4>
                 <p className="text-sm text-indigo-800 font-medium">{aiAdvantage}</p>
              </div>
           </div>

           <div className="col-span-1 flex items-center justify-around bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div className="text-center">
                 <p className="text-xs font-bold text-slate-500 uppercase flex flex-col items-center gap-1">
                    {b1.name}
                    {needRecommendation.bank === b1.name && (
                       <span className="bg-emerald-100 text-emerald-700 text-[9px] px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                          <CheckCircle2 size={10} /> Recommended Bank
                       </span>
                    )}
                 </p>
                 <div className="flex items-end justify-center gap-1 mt-1">
                    <span className="text-3xl font-black text-slate-800">{b1.score}</span>
                    <span className="text-sm font-bold text-slate-400 mb-1">/100</span>
                 </div>
                 <p className="text-[10px] font-bold text-emerald-500">AI Score</p>
              </div>
              <div className="w-px h-12 bg-slate-200 mx-2" />
              <div className="text-center">
                 <p className="text-xs font-bold text-slate-500 uppercase flex flex-col items-center gap-1">
                    {b2.name}
                    {needRecommendation.bank === b2.name && (
                       <span className="bg-emerald-100 text-emerald-700 text-[9px] px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                          <CheckCircle2 size={10} /> Recommended Bank
                       </span>
                    )}
                 </p>
                 <div className="flex items-end justify-center gap-1 mt-1">
                    <span className="text-3xl font-black text-slate-800">{b2.score}</span>
                    <span className="text-sm font-bold text-slate-400 mb-1">/100</span>
                 </div>
                 <p className="text-[10px] font-bold text-emerald-500">AI Score</p>
              </div>
           </div>
        </div>

        {/* Comparison Tables container */}
        <ComparisonTables b1={b1} b2={b2} needRecommendation={needRecommendation} />
      </div>

      {/* SECTION 6: Pros and Cons Section */}
      <BankProsCons b1={b1} b2={b2} />

    </div>
  );
};

export default BankComparison;
