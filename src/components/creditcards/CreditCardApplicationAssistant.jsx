import React, { useState } from 'react';
import { X, CheckCircle, ChevronRight, Upload, AlertTriangle, ShieldCheck, Sparkles, FileText, IndianRupee, Loader2 } from 'lucide-react';
import { checkCreditCardEligibility } from '../../services/aiService';

const CreditCardApplicationAssistant = ({ card, userProfile, onClose }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    age: userProfile.age || 25,
    income: userProfile.income || 30000,
    employment: 'Salaried'
  });
  const [isEligible, setIsEligible] = useState(null);
  const [eligibilityMsg, setEligibilityMsg] = useState("");
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Check Eligibility handler
  const handleCheckEligibility = () => {
    // Quick local profile override for checking
    const evalProfile = { ...userProfile, income: Number(formData.income) };
    const result = checkCreditCardEligibility(evalProfile, card);
    setIsEligible(result.eligible);
    setEligibilityMsg(result.message);
    setStep(2);
  };

  // Document Upload handler
  const handleUpload = (docName) => {
    if (!uploadedDocs.includes(docName)) {
      setUploadedDocs([...uploadedDocs, docName]);
    }
  };

  const handleRedirect = () => {
    setIsRedirecting(true);
    setTimeout(() => {
      // Mock redirect to bank
      // In a real app this would securely forward JWTs or open an auth window
      window.open(`https://www.google.com/search?q=${card.name}+application`, '_blank');
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col">
        
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-10 border-b border-slate-100 p-5 flex justify-between items-center rounded-t-3xl">
           <div>
             <h2 className="text-xl font-extrabold text-slate-800">Application Assistant</h2>
             <p className="text-xs font-semibold tracking-wider text-indigo-500 uppercase mt-1">Applying for {card.name}</p>
           </div>
           <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
             <X size={20} />
           </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 pb-10 flex-1">
          
          {/* Progress Bar */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-indigo-500' : 'bg-slate-200'}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-indigo-500' : 'bg-slate-200'}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-indigo-500' : 'bg-slate-200'}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 4 ? 'bg-indigo-500' : 'bg-slate-200'}`} />
          </div>

          {/* STEP 1: Eligibility Confirmation */}
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <div>
                   <h3 className="font-bold text-slate-800">{card.name}</h3>
                   <div className="flex gap-4 mt-2">
                       <span className="text-xs font-medium text-slate-600 flex items-center gap-1"><IndianRupee size={12}/>{card.fee}/yr fee</span>
                       <span className="text-xs font-medium text-slate-600 flex items-center gap-1">Min Income: ₹{card.eligibility.minIncome.toLocaleString()}/mo</span>
                   </div>
                 </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Confirm Your Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Age</label>
                    <input 
                      type="number" 
                      value={formData.age} 
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Monthly Income (₹)</label>
                    <input 
                      type="number" 
                      value={formData.income} 
                      onChange={(e) => setFormData({...formData, income: e.target.value})}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" 
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Employment Type</label>
                    <select 
                      value={formData.employment} 
                      onChange={(e) => setFormData({...formData, employment: e.target.value})}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option>Salaried</option>
                      <option>Self-Employed</option>
                      <option>Student / Unemployed</option>
                    </select>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleCheckEligibility}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 mt-4"
              >
                Check Eligibility <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* STEP 2: Eligibility Result & Required Documents */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <div className={`p-4 rounded-xl flex items-start gap-4 ${isEligible ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                  {isEligible ? <CheckCircle size={24} className="text-emerald-500 min-w-max mt-0.5" /> : <AlertTriangle size={24} className="text-red-500 min-w-max mt-0.5" />}
                  <div>
                     <h3 className={`font-bold text-lg ${isEligible ? 'text-emerald-800' : 'text-red-800'}`}>
                        {isEligible ? "You are eligible to apply!" : "Eligibility Check Failed"}
                     </h3>
                     <p className={`text-sm mt-1 ${isEligible ? 'text-emerald-700' : 'text-red-700'}`}>
                        {eligibilityMsg}
                     </p>
                  </div>
               </div>

               {isEligible && (
                 <>
                   <div>
                     <h3 className="text-lg font-bold text-slate-800 mb-4">Required Documents</h3>
                     <p className="text-sm text-slate-600 mb-4">Please prepare or upload the following documents for instant verification processing.</p>
                     
                     <div className="space-y-3">
                       {['PAN Card', 'Aadhaar Card', 'Latest Salary Slip (Optional)'].map((doc, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50">
                             <span className="font-semibold text-slate-700 flex items-center gap-2">
                                <FileText size={16} className="text-slate-400" /> {doc}
                             </span>
                             {uploadedDocs.includes(doc) ? (
                               <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1"><CheckCircle size={12}/> Uploaded</span>
                             ) : (
                               <button onClick={() => handleUpload(doc)} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1">
                                  <Upload size={14} /> Upload
                               </button>
                             )}
                          </div>
                       ))}
                     </div>
                   </div>

                   <button 
                     onClick={() => setStep(3)}
                     className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-colors mt-6 shadow-md"
                   >
                     Continue to Instructions
                   </button>
                 </>
               )}

               {!isEligible && (
                  <button onClick={() => setStep(1)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors">
                     Back to Details
                  </button>
               )}
            </div>
          )}

          {/* STEP 3: Instructions & AI Advice */}
          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-md flex items-start sm:items-center gap-4">
                 <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm shrink-0 mt-1 sm:mt-0">
                   <Sparkles size={24} className="text-indigo-100" />
                 </div>
                 <div>
                   <h3 className="font-bold text-lg mb-1">AI Financial Advice</h3>
                   <p className="text-indigo-50 text-sm leading-relaxed">
                     Since you frequently shop online, the {card.name} offers great overarching cashback benefits. Make sure to pay your credit card bill in full by the due date every month to avoid high compound interest charges ranging from 30-45% annually!
                   </p>
                 </div>
               </div>

               <div>
                 <h3 className="text-lg font-bold text-slate-800 mb-4">Application Instructions</h3>
                 <ol className="space-y-4 text-sm text-slate-700">
                    <li className="flex gap-3">
                       <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">1</span>
                       <span>Ensure your PAN and Aadhaar details are perfectly aligned and updated online.</span>
                    </li>
                    <li className="flex gap-3">
                       <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">2</span>
                       <span>Upload clear scanned documents when requested on the partner bank's portal.</span>
                    </li>
                    <li className="flex gap-3">
                       <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">3</span>
                       <span>Fill in your personal and employment information carefully to avoid instant rejection.</span>
                    </li>
                    <li className="flex gap-3">
                       <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">4</span>
                       <span>The bank may contact you via Phone/WhatsApp for Video KYC verification.</span>
                    </li>
                    <li className="flex gap-3">
                       <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">5</span>
                       <span>Final approval typically takes <strong>2–7 working days</strong>, after which the physical card is dispatched.</span>
                    </li>
                 </ol>
               </div>

               <button 
                 onClick={() => setStep(4)}
                 className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-colors mt-4 shadow-md"
               >
                 Proceed 
               </button>
            </div>
          )}

          {/* STEP 4: Bank Redirect */}
          {step === 4 && (
            <div className="space-y-8 py-4 animate-in slide-in-from-right-4 duration-300 text-center">
               
               <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                 <ShieldCheck size={40} />
               </div>

               <div>
                 <h3 className="text-2xl font-bold text-slate-800 mb-2">Ready to Apply</h3>
                 <p className="text-slate-600 text-sm max-w-sm mx-auto">
                   You will now be redirected to the secure official bank application portal. Your application status will be tracked below.
                 </p>
               </div>

               <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Status Tracker (Mock)</h4>
                  <div className="flex items-center gap-2">
                     <span className="h-2 flex-1 rounded-full bg-indigo-500" />
                     <span className="h-2 flex-1 rounded-full bg-slate-200" />
                     <span className="h-2 flex-1 rounded-full bg-slate-200" />
                     <span className="h-2 flex-1 rounded-full bg-slate-200" />
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-500">
                     <span className="text-indigo-600">Assistant</span>
                     <span>Bank Portal</span>
                     <span>Under Review</span>
                     <span>Approved</span>
                  </div>
               </div>

               <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs font-medium text-left flex gap-3">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <p><strong>Security Notice:</strong> Never share OTP, CVV, or PIN with anyone. SmartBank AI only helps guide you through the application process and will never ask for your card details.</p>
               </div>

               <button 
                 onClick={handleRedirect}
                 disabled={isRedirecting}
                 className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
               >
                 {isRedirecting ? (
                   <><Loader2 size={18} className="animate-spin" /> Redirecting...</>
                 ) : (
                   "Continue to Official Bank Website"
                 )}
               </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CreditCardApplicationAssistant;
