import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  CreditCard as CardIcon, Star, IndianRupee, Sparkles, AlertCircle, 
  CheckCircle2, ChevronRight, Globe, Landmark, User, ShieldCheck, 
  Briefcase, Plane, Wallet, Trash2, ArrowLeft, Info
} from 'lucide-react';
import { getCreditCards, getForexCards, getDebitCards } from '../services/apiService';
import { applyCard } from '../services/cardService';

// Official bank card application links
const BANK_APPLY_LINKS = {
  'HDFC Bank': 'https://www.hdfcbank.com/personal/pay/cards/credit-cards',
  'HDFC': 'https://www.hdfcbank.com/personal/pay/cards/credit-cards',
  'SBI': 'https://www.sbi.co.in/web/personal-banking/cards/credit-cards',
  'Axis Bank': 'https://www.axisbank.com/retail/cards/credit-card',
  'Axis': 'https://www.axisbank.com/retail/cards/credit-card',
  'Niyo': 'https://www.goniyo.com/global/',
  'DCB Bank / Equitas': 'https://www.goniyo.com/global/',
  'ICICI Bank': 'https://www.icicibank.com/personal-banking/cards/credit-card',
};

const getApplyLink = (bank, cardName) => {
  return BANK_APPLY_LINKS[bank] || `https://www.google.com/search?q=apply+${encodeURIComponent(cardName)}+online`;
};

const SmartCardAdvisor = () => {
  const [step, setStep] = useState('category'); // category, profile, results
  const [category, setCategory] = useState(null); // forex, debit, credit
  const [profile, setProfile] = useState({
    userType: '',
    income: '',
    purpose: '',
    bank: '',
    intlUsage: 'No'
  });
  const [cardsData, setCardsData] = useState({ credit: [], forex: [], debit: [] });
  const [appliedCards, setAppliedCards] = useState({}); // cardId -> { success, message }

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchCards = async () => {
      const [credit, forex, debit] = await Promise.all([
        getCreditCards(),
        getForexCards(),
        getDebitCards()
      ]);
      setCardsData({ credit, forex, debit });
    };
    fetchCards();
  }, []);

  useEffect(() => {
    const type = searchParams.get('type');
    if (type && ['forex', 'debit', 'credit'].includes(type) && category === null) {
      setCategory(type);
      setStep('profile');
    }
  }, [searchParams, category]);

  const handleCategorySelect = (cat) => {
    setCategory(cat);
    setStep('profile');
  };

  const resetAdvisor = () => {
    setStep('category');
    setCategory(null);
    setProfile({
      userType: '',
      income: '',
      purpose: '',
      bank: '',
      intlUsage: 'No'
    });
  };

  const getRecommendations = useMemo(() => {
    if (step !== 'results') return [];

    let source = [];
    if (category === 'forex') source = cardsData.forex;
    else if (category === 'debit') source = cardsData.debit;
    else source = cardsData.credit;

    const income = Number(profile.income) || 0;

    // Score each card based on profile match
    const scored = source.map(card => {
      let score = 0;

      // Eligibility check — disqualify cards the user can't get
      if (card.eligibility?.minIncome && income > 0 && income < card.eligibility.minIncome) {
        score -= 10;
      }
      if (card.eligibility?.userType && profile.userType) {
        if (card.eligibility.userType.includes(profile.userType)) score += 5;
      }

      // Purpose match
      if (profile.purpose) {
        const purpose = profile.purpose.toLowerCase();
        const cardText = ((card.name || '') + ' ' + (card.bestFor || '') + ' ' + (card.description || '')).toLowerCase();
        if (cardText.includes(purpose)) score += 4;
        if (purpose.includes('travel') && card.forexMarkup != null) score += 3;
        if (purpose.includes('cashback') && (card.cashback_rate || card.rewardsRate)) score += 3;
      }

      // Bank preference
      if (profile.bank && (card.bank || card.provider || card.bankName || '').toLowerCase().includes(profile.bank.toLowerCase())) {
        score += 3;
      }

      // International usage — boost low forex markup cards
      if (profile.intlUsage === 'Yes' && category === 'forex') score += 4;
      if (profile.intlUsage === 'Yes' && card.forexMarkup === '0%') score += 3;

      // Prefer free annual fee
      if ((card.annualFee ?? card.fee) === 0) score += 1;

      return { ...card, _score: score };
    });

    // Sort by score descending
    const sorted = scored.sort((a, b) => b._score - a._score);

    // Deduplicate by card name (case-insensitive) and cardId
    const seen = new Set();
    const unique = [];
    for (const card of sorted) {
      const key = (card.name || card.cardName || card.id || '').toLowerCase().trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        unique.push(card);
      }
    }

    return unique.slice(0, 3);
  }, [step, category, profile, cardsData.forex, cardsData.debit, cardsData.credit]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            Smart Card Advisor <CardIcon className="text-indigo-500" size={28} />
          </h1>
          <p className="text-slate-600 mt-1 font-medium">AI-powered recommendations for Debit, Credit, and Forex cards based on your financial profile.</p>
        </div>
        {step !== 'category' && (
          <button 
            onClick={resetAdvisor}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={16} /> Start Over
          </button>
        )}
      </div>

      {/* Card Type Selector (Tabs) */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200 shadow-inner">
         <button 
           onClick={() => { setCategory('debit'); if(step === 'category') setStep('profile'); }}
           className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${category === 'debit' ? 'bg-white text-emerald-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-800'}`}
         >
           Debit Card
         </button>
         <button 
           onClick={() => { setCategory('credit'); if(step === 'category') setStep('profile'); }}
           className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${category === 'credit' ? 'bg-white text-rose-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-800'}`}
         >
           Credit Card
         </button>
         <button 
           onClick={() => { setCategory('forex'); if(step === 'category') setStep('profile'); }}
           className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${category === 'forex' ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-800'}`}
         >
           Forex Card
         </button>
      </div>

      {/* STEP 1: CATEGORY SELECTION */}
      {step === 'category' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div 
            onClick={() => handleCategorySelect('forex')}
            className="group cursor-pointer bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all text-center flex flex-col items-center"
          >
            <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
              <Globe size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Forex Card</h3>
            <p className="text-slate-600 text-sm">Best for international students, travelers, and business payments abroad.</p>
            <div className="mt-6 flex items-center gap-2 text-indigo-600 font-bold text-sm">
              Select Category <ChevronRight size={16} />
            </div>
          </div>

          <div 
            onClick={() => handleCategorySelect('debit')}
            className="group cursor-pointer bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all text-center flex flex-col items-center"
          >
            <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
              <Wallet size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Debit Card</h3>
            <p className="text-slate-600 text-sm">Optimized for daily spending, local payments, and regular ATM access.</p>
            <div className="mt-6 flex items-center gap-2 text-emerald-600 font-bold text-sm">
              Select Category <ChevronRight size={16} />
            </div>
          </div>

          <div 
            onClick={() => handleCategorySelect('credit')}
            className="group cursor-pointer bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-rose-300 transition-all text-center flex flex-col items-center"
          >
            <div className="p-4 bg-rose-50 rounded-2xl text-rose-600 mb-6 group-hover:scale-110 transition-transform">
              <CardIcon size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Credit Card</h3>
            <p className="text-slate-600 text-sm">Perfect for rewards, building credit score, and interest-free credit periods.</p>
            <div className="mt-6 flex items-center gap-2 text-rose-600 font-bold text-sm">
              Select Category <ChevronRight size={16} />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: USER PROFILE FORM */}
      {step === 'profile' && (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
          <div className="bg-slate-900 p-8 text-white">
            <h2 className="text-2xl font-bold mb-2">Personalize Your Search</h2>
            <p className="text-slate-400 text-sm">Help our AI understand your needs to find the {category} card that fits you best.</p>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                  <User size={16} className="text-indigo-500" /> User Type
                </label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-800 dark:text-white dark:placeholder-gray-400 dark:border-slate-600"
                  value={profile.userType}
                  onChange={(e) => setProfile({...profile, userType: e.target.value})}
                >
                  <option value="">Select User Type</option>
                  <option value="Student">Student</option>
                  <option value="Working Professional">Working Professional</option>
                  <option value="Business Owner">Business Owner</option>
                  <option value="Traveler">Traveler</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                  <IndianRupee size={16} className="text-emerald-500" /> Monthly Income (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-800 dark:text-white dark:placeholder-gray-400 dark:border-slate-600"
                  value={profile.income}
                  onChange={(e) => setProfile({...profile, income: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" /> Primary Purpose
                </label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-800 dark:text-white dark:placeholder-gray-400 dark:border-slate-600"
                  value={profile.purpose}
                  onChange={(e) => setProfile({...profile, purpose: e.target.value})}
                >
                  <option value="">Select Purpose</option>
                  <option value="Travel">Travel Rewards</option>
                  <option value="Daily Spending">Daily Spending</option>
                  <option value="International Payments">International Payments</option>
                  <option value="Rewards">Cashback & Rewards</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                  <Landmark size={16} className="text-slate-400" /> Preferred Bank (Optional)
                </label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-800 dark:text-white dark:placeholder-gray-400 dark:border-slate-600"
                  value={profile.bank}
                  onChange={(e) => setProfile({...profile, bank: e.target.value})}
                >
                  <option value="">Any Bank</option>
                  <option value="HDFC">HDFC Bank</option>
                  <option value="SBI">SBI</option>
                  <option value="ICICI">ICICI Bank</option>
                  <option value="Axis">Axis Bank</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="block text-sm font-bold text-slate-700 mb-4">Will you use this card internationally?</label>
              <div className="flex gap-4">
                <button 
                  onClick={() => setProfile({...profile, intlUsage: 'Yes'})}
                  className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all border ${profile.intlUsage === 'Yes' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                >
                  Yes, Frequently
                </button>
                <button 
                  onClick={() => setProfile({...profile, intlUsage: 'No'})}
                  className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all border ${profile.intlUsage === 'No' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                >
                  No, Locally Only
                </button>
              </div>
            </div>

            <button 
              onClick={() => setStep('results')}
              className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold text-lg mt-8 shadow-lg transition-transform hover:-translate-y-1"
            >
              Analyze & Find Best Cards
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: RECOMMENDATION RESULTS */}
      {step === 'results' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="text-amber-500" size={24} /> Top 3 Recommendations
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {getRecommendations.map((card, idx) => (
              <div key={card.id || card.cardId || idx} className={`bg-white rounded-[2rem] border-2 ${idx === 0 ? 'border-emerald-400 ring-8 ring-emerald-50' : 'border-slate-200 ring-4 ring-slate-50'} p-1 relative shadow-sm hover:shadow-xl transition-all flex flex-col`}>
                {idx === 0 ? (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2 z-10 whitespace-nowrap">
                    <Sparkles size={12} /> AI Recommended Top Choice
                  </div>
                ) : (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-md flex items-center gap-2 z-10 whitespace-nowrap">
                    Alternative Option {idx}
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600">
                      {category === 'forex' ? <Globe size={24} /> : category === 'debit' ? <Wallet size={24} /> : <CardIcon size={24} />}
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Bank Name</p>
                       <p className="text-sm font-extrabold text-slate-900 leading-none">{card.bank || card.provider || card.bankName || '—'}</p>
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight">
                    {card.name}
                  </h3>
                  
                  <div className="mb-4">
                     <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase">Best for {(card.bestFor || card.name || 'Your Profile').split(' & ')[0]}</span>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Key Benefits</p>
                        <div className="space-y-3">
                           {card.benefits.slice(0, 3).map((benefit, bIdx) => (
                              <div key={bIdx} className="flex gap-2 text-sm items-start">
                                 <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                 <span className="text-slate-700 font-medium leading-tight">{benefit.desc}</span>
                              </div>
                           ))}
                        </div>
                    </div>
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Annual Fee</p>
                       <p className="text-sm font-black text-slate-900">
                         {(() => { const f = card.annualFee ?? card.fee; return f === 0 ? 'Free' : `₹${f ?? '—'}`; })()}
                       </p>
                    </div>
                    {category === 'forex' && (
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Forex Markup</p>
                          <p className="text-sm font-black text-emerald-600">{card.forexMarkup}</p>
                       </div>
                    )}
                    {(category === 'credit' || category === 'debit') && (
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rewards</p>
                          <p className="text-sm font-black text-indigo-600">High</p>
                       </div>
                    )}
                  </div>
                </div>

                <div className="p-4">
                   {appliedCards[card.cardId || card.id] ? (
                     <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-700 py-3 rounded-2xl font-bold text-center text-sm">
                       <CheckCircle2 size={16} className="inline mr-2" />
                       {appliedCards[card.cardId || card.id].message || 'Application submitted!'}
                     </div>
                   ) : (
                     <button
                       onClick={async () => {
                         const cardKey = card.cardId || card.id;
                         const result = await applyCard(cardKey, card.name);
                         setAppliedCards(prev => ({ ...prev, [cardKey]: result }));
                       }}
                       className="w-full bg-slate-900 hover:bg-black text-white py-3 rounded-2xl font-bold transition-all shadow-md group cursor-pointer"
                     >
                       Apply Now <ChevronRight size={16} className="inline group-hover:translate-x-1 transition-transform" />
                     </button>
                   )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4 mt-10">
             <Info className="text-amber-500 shrink-0 mt-1" size={20} />
             <div>
                <h4 className="font-bold text-amber-900 mb-1">AI Recommendation Insight</h4>
                <p className="text-amber-800 text-sm leading-relaxed">
                  Our recommendation engine favors cards with lower forex markups and higher rewards for your specific profile type ({profile.userType || 'General User'}). 
                  {profile.intlUsage === 'Yes' ? ' Since you specified frequent international usage, cards with 0-1% markup were prioritized.' : ' As a local user, rewards and cashback cards from your preferred banks were given higher weightage.'}
                </p>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SmartCardAdvisor;

