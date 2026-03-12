import React, { useState, useMemo } from 'react';
import { Landmark, Calculator, ArrowRight, ShieldCheck, Star, Info, Target, Settings2, PiggyBank, Briefcase, Car, Bike, HeartPulse, Laptop, Plane, BookOpen, AlertCircle, HandCoins, CheckCircle2, AlertTriangle, CalendarDays, Clock, Route } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { getLoans, getUserProfile } from '../services/apiService';
import { calculateEMI, checkAffordability, generateBestLoanRecommendation, calculatePrepaymentSavings, calculateLoanTimeline } from '../services/aiService';

const LOAN_PURPOSES = [
  { id: 'Personal Loan', label: 'Personal Loan', icon: <Briefcase size={24} /> },
  { id: 'Home Loan', label: 'Home Loan', icon: <Landmark size={24} /> },
  { id: 'Car Loan', label: 'Car Loan', icon: <Car size={24} /> },
  { id: 'Bike Loan', label: 'Bike Loan', icon: <Bike size={24} /> },
  { id: 'Education Loan', label: 'Education Loan', icon: <BookOpen size={24} /> },
  { id: 'Medical Loan', label: 'Medical Loan', icon: <HeartPulse size={24} /> },
  { id: 'Electronics Purchase', label: 'Electronics', icon: <Laptop size={24} /> },
  { id: 'Travel Loan', label: 'Travel Loan', icon: <Plane size={24} /> }
];

const COLORS = ['#6366f1', '#f43f5e'];

const AILoanAdvisor = () => {
  const [activePurpose, setActivePurpose] = useState('Personal Loan');
  const [emiPrincipal, setEmiPrincipal] = useState(500000);
  const [emiRate, setEmiRate] = useState(10.5);
  const [emiTenure, setEmiTenure] = useState(3);
  const [monthlyIncomeInput, setMonthlyIncomeInput] = useState(0);
  const [loans, setLoans] = useState([]);
  
  // Fetch initial profile
  React.useEffect(() => {
    const fetchData = async () => {
      const profileInfo = await getUserProfile();
      setMonthlyIncomeInput(profileInfo.income);
      const loansData = await getLoans();
      setLoans(loansData);
    };
    fetchData();
  }, []);
  
  // Prepayment States
  const [prepaymentAmount, setPrepaymentAmount] = useState(0);
  const [prepaymentMonth, setPrepaymentMonth] = useState(12);

  // Computed Values
  const monthlyEmi = useMemo(() => calculateEMI(emiPrincipal, emiRate, emiTenure), [emiPrincipal, emiRate, emiTenure]);
  const totalPayment = monthlyEmi * (emiTenure * 12);
  const totalInterest = totalPayment - emiPrincipal;
  
  const affordability = useMemo(() => checkAffordability(monthlyIncomeInput, monthlyEmi), [monthlyIncomeInput, monthlyEmi]);
  const savingsFromPrepayment = useMemo(() => calculatePrepaymentSavings(emiPrincipal, emiRate, emiTenure, prepaymentAmount, prepaymentMonth), [emiPrincipal, emiRate, emiTenure, prepaymentAmount, prepaymentMonth]);
  const timeline = useMemo(() => calculateLoanTimeline(emiTenure), [emiTenure]);

  const bestLoan = useMemo(() => generateBestLoanRecommendation(loans, activePurpose), [loans, activePurpose]);
  const filteredLoans = loans.filter(l => l.type === activePurpose);

  const pieData = [
    { name: 'Principal Amount', value: emiPrincipal },
    { name: 'Total Interest', value: totalInterest > 0 ? totalInterest : 0 }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2 mb-2">
          AI Loan Advisor <HandCoins className="text-indigo-500" size={28} />
        </h1>
        <p className="text-slate-600">Smart guidance to choose the best loan, understand real costs, and check your affordability.</p>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
         <h2 className="text-xl font-bold text-slate-800 mb-6">What is the purpose of your loan?</h2>
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {LOAN_PURPOSES.map(purpose => (
               <button
                 key={purpose.id}
                 onClick={() => setActivePurpose(purpose.id)}
                 className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${activePurpose === purpose.id ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm ring-1 ring-indigo-500' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
               >
                 <div className={`${activePurpose === purpose.id ? 'text-indigo-600' : 'text-slate-400'}`}>
                   {purpose.icon}
                 </div>
                 <span className="font-bold text-sm text-center">{purpose.label}</span>
               </button>
            ))}
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Recommendations & Tables */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* AI Recommendation Banner */}
          {bestLoan ? (
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex items-start sm:items-center gap-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shrink-0">
                <Star size={24} className="text-amber-300" fill="currentColor" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Best Loan Recommendation: {bestLoan.bank}</h3>
                <p className="font-semibold text-indigo-100 mb-2">Best for {activePurpose}</p>
                <p className="text-indigo-50 leading-relaxed text-sm mb-4">
                  <span className="font-semibold">Reason:</span> {bestLoan.reason}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => window.open(`https://www.google.com/search?q=apply+${encodeURIComponent(activePurpose)}+${encodeURIComponent(bestLoan.bank)}+online`, '_blank', 'noopener,noreferrer')}
                    className="flex items-center gap-2 bg-white text-indigo-700 font-bold px-5 py-2.5 rounded-xl text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    Apply Now <ArrowRight size={16} />
                  </button>
                  <a
                    href="#loan-comparison"
                    className="flex items-center gap-2 bg-white/10 border border-white/20 text-white font-bold px-5 py-2.5 rounded-xl text-sm backdrop-blur-sm hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    Compare Loans
                  </a>
                </div>
              </div>
            </div>
          ) : (
             <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-slate-600 flex items-center gap-4">
                <Info size={24} className="text-slate-400"/>
                <p className="font-medium">No direct bank recommendations currently configured for {activePurpose} in the simulation database.</p>
             </div>
          )}

          {/* Comparison Table */}
          {filteredLoans.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                   <h3 className="font-bold text-slate-800 text-lg">Compare {activePurpose}s</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Bank & Type</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Interest Rate</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Processing Fee</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Approval Time</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {filteredLoans.map(loan => (
                            <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4">
                                  <p className="font-bold text-slate-800">{loan.bank}</p>
                                  <p className="text-xs text-slate-500">{loan.type}</p>
                              </td>
                              <td className="p-4 font-black text-indigo-600">{loan.interestRate}%</td>
                              <td className="p-4 font-medium text-slate-600">{loan.processingFee}%</td>
                              <td className="p-4 font-medium text-slate-600">{loan.approvalTime}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                </div>
            </div>
          )}

          {/* AI Affordability Check */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
             <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                <ShieldCheck className="text-emerald-500" size={24}/> Loan Affordability AI Check
             </h3>
             <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="w-full sm:w-1/2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Your Monthly Income (₹)</label>
                    <input 
                      type="number" 
                      value={monthlyIncomeInput}
                      onChange={(e) => setMonthlyIncomeInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                </div>
                <div className="w-full sm:w-1/2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                   {affordability && (
                     <div className="flex items-start gap-3">
                        {affordability.isAffordable 
                          ? <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20}/> 
                          : <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={20}/>}
                        <div>
                           <p className={`text-sm font-bold ${affordability.isAffordable ? 'text-emerald-700' : 'text-rose-600'}`}>
                             {affordability.message}
                           </p>
                           <p className="text-xs text-slate-500 font-medium mt-1">Recommended Max EMI: ₹{affordability.maxEmi.toLocaleString()}</p>
                        </div>
                     </div>
                   )}
                </div>
             </div>
          </div>

          {/* AI Prepayment Calculator */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
             <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                <PiggyBank className="text-indigo-500" size={24}/> Smart Prepayment Calculator
             </h3>
             <p className="text-sm text-slate-600">If you repay part of the loan early, see how much interest you can save.</p>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Prepayment Amount (₹)</label>
                   <input 
                      type="number" 
                      value={prepaymentAmount}
                      onChange={(e) => setPrepaymentAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">After How Many Months?</label>
                   <input 
                      type="number" 
                      min="1"
                      max={emiTenure * 12}
                      value={prepaymentMonth}
                      onChange={(e) => setPrepaymentMonth(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
             </div>
             
             {prepaymentAmount > 0 && (
               <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-emerald-800">Total Interest Saved!</p>
                    <p className="text-xs text-emerald-600 font-medium mt-1">By paying early, the bank earns less compound interest.</p>
                  </div>
                  <div className="text-2xl font-black text-emerald-600">
                    ₹{savingsFromPrepayment.toLocaleString()}
                  </div>
               </div>
             )}
          </div>

          {/* Safety Notice */}
          <div className="bg-slate-50 rounded-2xl p-4 flex gap-3 text-slate-500 text-sm">
             <Info className="shrink-0 mt-0.5" size={18}/>
             <p><strong>Safety Notice:</strong> This platform provides AI-driven financial simulations and guidance only. Always verify exact loan terms, processing fees, and foreclosure conditions directly with official bank sources before signing.</p>
          </div>

        </div>

        {/* Right Col: Interactive EMI Calculator & Charts */}
        <div className="space-y-6">
           <div className="bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl text-white">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-indigo-500 rounded-xl"><Calculator size={20} className="text-white"/></div>
                 <h3 className="font-bold text-lg">Detailed EMI Calculator</h3>
              </div>

              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between mb-2">
                       <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loan Amount</label>
                       <span className="font-bold focus-within:text-indigo-400">
                         ₹<input 
                            type="number"
                            value={emiPrincipal}
                            onChange={(e) => setEmiPrincipal(Number(e.target.value))}
                            className="bg-transparent border-none outline-none w-24 text-right appearance-none"
                         />
                       </span>
                    </div>
                    <input 
                      type="range" 
                      min="10000" 
                      max="15000000" 
                      step="10000"
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
                      className="w-full accent-rose-500"
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

                 <div className="pt-6 border-t border-slate-800">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">Monthly EMI</p>
                    <p className="text-5xl font-black text-white text-center tracking-tight mb-8">₹{monthlyEmi.toLocaleString()}</p>
                    
                    <div className="space-y-3 text-sm">
                       <div className="flex justify-between">
                         <span className="text-slate-400">Principal Amount</span>
                         <span className="font-bold">₹{emiPrincipal.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-slate-400">Total Interest</span>
                         <span className="font-bold text-rose-400">₹{Math.round(totalInterest).toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between pt-3 border-t border-slate-800">
                         <span className="font-bold text-slate-300">Total Payable</span>
                         <span className="font-black text-white">₹{Math.round(totalPayment).toLocaleString()}</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* NEW: Loan Timeline & Summary */}
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                 <CalendarDays className="text-indigo-600" size={20}/> Loan Duration & Timeline
              </h3>
              
              <div className="bg-indigo-50 text-indigo-800 text-sm font-medium p-4 rounded-xl border border-indigo-100">
                 "You will need to pay <strong className="text-indigo-900">₹{monthlyEmi.toLocaleString()}</strong> every month for <strong className="text-indigo-900">{timeline.months} months</strong> to complete this loan."
              </div>

              <div className="grid grid-cols-3 gap-3">
                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Years</p>
                    <p className="font-black text-slate-800">{emiTenure}</p>
                 </div>
                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Months</p>
                    <p className="font-black text-slate-800">{timeline.months}</p>
                 </div>
                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Days</p>
                    <p className="font-black text-slate-800">{timeline.days}</p>
                 </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                 <div className="flex items-center gap-2">
                    <Clock size={16} className="text-slate-400"/>
                    <span className="text-sm font-semibold text-slate-600">Total EMIs Required</span>
                 </div>
                 <span className="font-black text-slate-800">{timeline.months} Payments</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                 <div className="flex items-center gap-2">
                    <Route size={16} className="text-emerald-500"/>
                    <span className="text-sm font-semibold text-slate-600">Expected Completion</span>
                 </div>
                 <span className="font-black text-emerald-600">{timeline.formattedDate}</span>
              </div>

              <div className="pt-2">
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Timeline Progress</p>
                 <div className="relative flex items-center justify-between text-xs font-bold text-slate-400">
                    <div className="flex flex-col items-center gap-1 z-10 bg-white px-2">
                       <div className="w-3 h-3 rounded-full bg-slate-200 border-2 border-slate-300"/>
                       <span>Start</span>
                    </div>
                    
                    <div className="absolute top-1.5 left-0 w-full h-0.5 bg-slate-100 -z-0"/>
                    <div className="absolute top-1.5 left-0 w-1/2 h-0.5 bg-indigo-500/30 border-t border-dashed border-indigo-400 -z-0"/>

                    <div className="flex flex-col items-center gap-1 z-10 bg-white px-2 text-indigo-500">
                       <div className="w-4 h-4 rounded-full bg-indigo-100 border-2 border-indigo-500 shadow-sm flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"/>
                       </div>
                       <span>{timeline.months} EMIs</span>
                    </div>

                    <div className="flex flex-col items-center gap-1 z-10 bg-white px-2 text-emerald-500">
                       <div className="w-3 h-3 rounded-full bg-emerald-100 border-2 border-emerald-500"/>
                       <span>End</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Interest Breakdown Chart */}
           <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 text-center">Payment Breakdown</h3>
              <div className="h-64 min-h-[256px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                    <RechartsTooltip 
                      formatter={(value) => `₹${value.toLocaleString()}`}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
           </div>
           
           {/* Smart Tips Sidebar */}
           <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100 space-y-3">
              <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                 <Target size={18} className="text-indigo-600"/> AI Loan Tips
              </h4>
              <ul className="text-sm text-indigo-800 space-y-2 list-disc pl-4 font-medium">
                 <li>Choose lower interest rates even if processing fees are slightly higher for long-term loans.</li>
                 <li>Avoid long loan tenures to drastically reduce the total compound interest mapped in the pie chart above.</li>
                 <li>Prepay loans early! Even a small lump-sum payment in the first year saves massive interest.</li>
              </ul>
           </div>
           
        </div>

      </div>
    </div>
  );
};

export default AILoanAdvisor;
