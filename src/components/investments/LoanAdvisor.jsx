import React, { useState, useMemo } from 'react';
import { Landmark, Calculator, ArrowRight, ShieldCheck, Star, Info, Target, Settings2 } from 'lucide-react';
import { loans, initialUserProfile } from '../../data/mockData';
import { calculateEMI, checkLoanEligibility, generateBestLoanRecommendation } from '../../services/aiService';
import { createLoan } from '../../services/apiService';

const LoanAdvisor = () => {
  const [activeTab, setActiveTab] = useState('Personal Loan');
  const [emiPrincipal, setEmiPrincipal] = useState(500000);
  const [emiRate, setEmiRate] = useState(10.5);
  const [emiTenure, setEmiTenure] = useState(3);

  // Compute calculated EMI interactively
  const monthlyEmi = useMemo(() => calculateEMI(emiPrincipal, emiRate, emiTenure), [emiPrincipal, emiRate, emiTenure]);
  
  // AI Recommendation for current tab
  const bestLoan = useMemo(() => generateBestLoanRecommendation(loans, activeTab), [activeTab]);

  const filteredLoans = loans.filter(l => l.type === activeTab);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 mb-2">
          AI Loan Advisor <Landmark className="text-indigo-500" size={24} />
        </h2>
        <p className="text-sm text-slate-600">Compare loans, check eligibility, and calculate EMIs instantly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Comparison & Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI Recommendation Banner */}
          {bestLoan && (
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex items-start sm:items-center gap-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shrink-0">
                <Star size={24} className="text-amber-300" fill="currentColor" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Best {activeTab} Today: {bestLoan.bank}</h3>
                <p className="text-indigo-100 leading-relaxed text-sm">
                  {bestLoan.reason}
                </p>
              </div>
            </div>
          )}

          {/* Loan Tabs */}
          <div className="flex flex-wrap gap-2">
             {['Personal Loan', 'Home Loan'].map(type => (
               <button
                 key={type}
                 onClick={() => setActiveTab(type)}
                 className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === type ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
               >
                 {type}
               </button>
             ))}
          </div>

          {/* Comparison Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                         <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Bank</th>
                         <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Interest Rate</th>
                         <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Processing Fee</th>
                         <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Approval Time</th>
                         <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {filteredLoans.map(loan => {
                        const eligibility = checkLoanEligibility(initialUserProfile, loan);
                        return (
                          <React.Fragment key={loan.id}>
                            <tr className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 font-bold text-slate-800">{loan.bank}</td>
                              <td className="p-4 font-bold text-emerald-600">{loan.interestRate}%</td>
                              <td className="p-4 font-medium text-slate-600">{loan.processingFee}%</td>
                              <td className="p-4 font-medium text-slate-600 hidden sm:table-cell">{loan.approvalTime}</td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={async () => {
                                    await createLoan({ bank: loan.bank, type: loan.type, amount: emiPrincipal, tenure: emiTenure });
                                    alert(`Loan application submitted to ${loan.bank} for ₹${emiPrincipal.toLocaleString()}`);
                                  }}
                                  className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  Apply
                                </button>
                              </td>
                            </tr>
                            {/* Eligibility row spanning all cols */}
                            <tr className="bg-slate-50/30">
                              <td colSpan={5} className="px-4 py-2 border-b border-slate-100">
                                 <div className={`flex items-center gap-2 text-xs font-medium ${eligibility.eligible ? 'text-emerald-600' : 'text-rose-500'}`}>
                                    {eligibility.eligible ? <ShieldCheck size={14} /> : <Info size={14} />}
                                    <span>{eligibility.reason}</span>
                                 </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                   </tbody>
                </table>
             </div>
          </div>
        </div>

        {/* Right Col: Interactive EMI Calculator */}
        <div>
           <div className="bg-slate-900 rounded-3xl p-6 shadow-xl sticky top-24 text-white">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-indigo-500 rounded-xl"><Calculator size={20} className="text-white"/></div>
                 <h3 className="font-bold text-lg">EMI Calculator</h3>
              </div>

              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between mb-2">
                       <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loan Amount</label>
                       <span className="font-bold">₹{emiPrincipal.toLocaleString()}</span>
                    </div>
                    <input 
                      type="range" 
                      min="50000" 
                      max="10000000" 
                      step="50000"
                      value={emiPrincipal} 
                      onChange={(e) => setEmiPrincipal(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                 </div>

                 <div>
                    <div className="flex justify-between mb-2">
                       <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Interest Rate (%)</label>
                       <span className="font-bold">{emiRate}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="20" 
                      step="0.1"
                      value={emiRate} 
                      onChange={(e) => setEmiRate(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                 </div>

                 <div>
                    <div className="flex justify-between mb-2">
                       <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tenure (Years)</label>
                       <span className="font-bold">{emiTenure} Yrs</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="30" 
                      step="1"
                      value={emiTenure} 
                      onChange={(e) => setEmiTenure(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                 </div>

                 <div className="pt-6 border-t border-slate-700">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">Estimated Monthly EMI</p>
                    <p className="text-4xl font-black text-indigo-400 text-center tracking-tight">₹{monthlyEmi.toLocaleString()}</p>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default LoanAdvisor;
