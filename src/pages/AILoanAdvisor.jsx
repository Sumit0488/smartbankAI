import React, { useState, useEffect, useMemo } from 'react';
import { Landmark, Calculator, ArrowRight, ShieldCheck, Star, Info, Target, Settings2, PiggyBank, Briefcase, Car, Bike, HeartPulse, Laptop, Plane, BookOpen, AlertCircle, HandCoins, CheckCircle2, AlertTriangle, CalendarDays, Clock, Route, ChevronRight, Loader2 } from 'lucide-react';
import { listLoanOptions, listBanks, applyLoan } from '../services/loanService';

const LOAN_PURPOSES = [
  { id: 'PERSONAL', label: 'Personal Loan', icon: <Briefcase size={24} /> },
  { id: 'HOME', label: 'Home Loan', icon: <Landmark size={24} /> },
  { id: 'CAR', label: 'Car Loan', icon: <Car size={24} /> },
  { id: 'EDUCATION', label: 'Education Loan', icon: <BookOpen size={24} /> }
];

const AILoanAdvisor = () => {
  const [step, setStep] = useState(1); // 1: Type, 2: Banks, 3: Form, 4: Result
  const [activePurpose, setActivePurpose] = useState(null);
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [loanAmount, setLoanAmount] = useState(500000);
  const [tenure, setTenure] = useState(3);
  const [loading, setLoading] = useState(false);
  const [applicationResult, setApplicationResult] = useState(null);

  const handlePurposeSelect = async (id) => {
    setActivePurpose(id);
    setLoading(true);
    const res = await listBanks(id);
    setBanks(res);
    setLoading(false);
    setStep(2);
  };

  const calculateEMI = (p, r, t) => {
    const rate = r / 12 / 100;
    const months = t * 12;
    const emi = (p * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    return Math.round(emi);
  };

  const currentEMI = useMemo(() => {
    if (!selectedBank) return 0;
    const rate = parseFloat(selectedBank.interestRate);
    return calculateEMI(loanAmount, rate, tenure);
  }, [selectedBank, loanAmount, tenure]);

  const handleApply = async () => {
    setLoading(true);
    const res = await applyLoan({
      bankName: selectedBank.bankName,
      loanAmount: Number(loanAmount),
      tenure: Number(tenure),            // years — loanService converts to months
      loanType: activePurpose,
      interestRate: selectedBank.interestRate, // "10.5%" — loanService parses float
    });
    setApplicationResult(res);
    setStep(4);
    setLoading(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
              <HandCoins className="text-white" size={24} />
            </div>
            AI Loan Advisor
          </h1>
          <p className="text-slate-500 font-medium mt-1">Smart guidance to choose the best loan</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden min-h-[500px]">
        {/* Progress bar */}
        <div className="h-1.5 bg-slate-100 flex">
          <div className={`h-full bg-indigo-500 transition-all duration-500 ${step === 1 ? 'w-1 w-1/4' : step === 2 ? 'w-2/4' : step === 3 ? 'w-3/4' : 'w-full'}`}></div>
        </div>

        <div className="p-8 md:p-12">
          {step === 1 && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
              <div className="text-center space-y-2">
                 <h2 className="text-2xl font-black text-slate-800">What is the purpose of your loan?</h2>
                 <p className="text-slate-500 font-medium">Select a category to see the best available bank offers.</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {LOAN_PURPOSES.map(purpose => (
                  <button
                    key={purpose.id}
                    onClick={() => handlePurposeSelect(purpose.id)}
                    className="flex flex-col items-center justify-center gap-4 p-6 rounded-3xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                  >
                    <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-white text-slate-400 group-hover:text-indigo-600 transition-colors">
                      {purpose.icon}
                    </div>
                    <span className="font-black text-sm text-slate-700">{purpose.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-8">
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setStep(1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                  <ArrowRight className="rotate-180" size={24} />
                </button>
                <div   >
                  <h2 className="text-2xl font-black text-slate-800">Compare Best {activePurpose} Offers</h2>
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">AI RANKED BY INTEREST RATES</p>
                </div>
              </div>

              {loading ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {banks.map((bank) => (
                    <div 
                      key={bank.id}
                      onClick={() => { setSelectedBank(bank); setStep(3); }}
                      className="flex flex-col md:flex-row items-center justify-between p-6 bg-white border-2 border-slate-100 rounded-3xl hover:border-indigo-500 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-5 mb-4 md:mb-0">
                         <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                           {bank.bankName.charAt(0)}
                         </div>
                         <div>
                            <h4 className="text-lg font-black text-slate-800">{bank.bankName}</h4>
                            <div className="flex gap-2 mt-1">
                               <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">INSTANT APPROVAL</span>
                               <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">NEW SCHEME</span>
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex gap-8 text-center bg-slate-50 px-8 py-3 rounded-2xl border border-slate-100">
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interest Rate</p>
                            <p className="text-xl font-black text-indigo-600">{bank.interestRate}</p>
                         </div>
                         <div className="w-px h-8 bg-slate-200 mt-1" />
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</p>
                            <p className="text-xl font-black text-slate-700">{bank.approvalTime}</p>
                         </div>
                      </div>

                      <div className="hidden md:block">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                           <ChevronRight size={20} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && selectedBank && (
            <div className="max-w-4xl mx-auto animate-in zoom-in-95">
               <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-100">
                  <button onClick={() => setStep(2)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                    <ArrowRight className="rotate-180" size={24} />
                  </button>
                  <h2 className="text-3xl font-black text-slate-900">Configure Your Loan</h2>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                     <div>
                        <div className="flex justify-between items-end mb-4">
                           <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Loan Amount (₹)</label>
                           <span className="text-2xl font-black text-slate-900">₹{Number(loanAmount).toLocaleString()}</span>
                        </div>
                        <input 
                           type="range"
                           min="50000"
                           max="2000000"
                           step="10000"
                           value={loanAmount}
                           onChange={(e) => setLoanAmount(Number(e.target.value))}
                           className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between mt-2 text-[10px] font-black text-slate-300">
                           <span>₹50,000</span>
                           <span>₹20,00,000</span>
                        </div>
                     </div>

                     <div>
                        <div className="flex justify-between items-end mb-4">
                           <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tenure (Years)</label>
                           <span className="text-2xl font-black text-slate-900">{tenure} YRS</span>
                        </div>
                        <input 
                           type="range"
                           min="1"
                           max="7"
                           step="1"
                           value={tenure}
                           onChange={(e) => setTenure(Number(e.target.value))}
                           className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between mt-2 text-[10px] font-black text-slate-300">
                           <span>1 YEAR</span>
                           <span>7 YEARS</span>
                        </div>
                     </div>

                     <div className="p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                           <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Monthly EMI</p>
                           <p className="text-4xl font-black">₹{currentEMI.toLocaleString()}</p>
                           <p className="text-[10px] font-bold text-slate-500 mt-4 leading-relaxed">
                             *Final EMI may vary depending on {selectedBank.bankName}'s processing fees and credit score.
                           </p>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                        <h4 className="font-black text-indigo-900 mb-4 flex items-center gap-2">
                           <ShieldCheck size={20} />
                           Loan Summary
                        </h4>
                        <div className="space-y-3">
                           <div className="flex justify-between text-sm">
                              <span className="font-bold text-indigo-700/60">Selected Provider</span>
                              <span className="font-black text-indigo-900">{selectedBank.bankName}</span>
                           </div>
                           <div className="flex justify-between text-sm">
                              <span className="font-bold text-indigo-700/60">Interest Rate</span>
                              <span className="font-black text-indigo-900">{selectedBank.interestRate}</span>
                           </div>
                           <div className="flex justify-between text-sm">
                              <span className="font-bold text-indigo-700/60">Processing Fee</span>
                              <span className="font-black text-indigo-900">0.5% - 1.5%</span>
                           </div>
                           <div className="pt-3 border-t border-indigo-200 flex justify-between">
                              <span className="font-black text-indigo-900">Total Interest</span>
                              <span className="font-black text-indigo-600">₹{(currentEMI * tenure * 12 - loanAmount).toLocaleString()}</span>
                           </div>
                        </div>
                     </div>

                     <button 
                        onClick={handleApply}
                        disabled={loading}
                        className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black text-lg shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all"
                     >
                        {loading ? <Loader2 className="animate-spin" /> : <>Send Application <ArrowRight size={20} /></>}
                     </button>
                  </div>
               </div>
            </div>
          )}

          {step === 4 && applicationResult && (
            <div className="text-center py-10 animate-in zoom-in-95">
                <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={48} className="text-indigo-600" />
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-2">Application Received!</h2>
                <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium leading-relaxed">
                  Your application for a <strong>₹{loanAmount.toLocaleString()}</strong> {activePurpose} loan from <strong>{selectedBank.bankName}</strong> has been submitted.
                </p>
                <div className="inline-block px-8 py-4 bg-slate-900 text-white rounded-2xl mb-8 space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Application Reference</p>
                  <p className="font-mono text-lg font-black">{applicationResult.applicationId}</p>
                </div>
                <br />
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-slate-100 text-slate-600 px-10 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all"
                >
                  Return to Dashboard
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AILoanAdvisor;
