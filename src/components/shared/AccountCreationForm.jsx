import React, { useState } from 'react';
import { Landmark, Upload, CheckCircle2, X, AlertTriangle, User, FileText, Camera } from 'lucide-react';

const AccountCreationForm = ({ onClose }) => {
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    mobile: '',
    email: '',
    address: '',
    panNumber: '',
    aadhaarNumber: ''
  });

  // Document Upload States
  const [documents, setDocuments] = useState({
    'Aadhaar Card Upload': false,
    'PAN Card Upload': false,
    'Selfie Photo Upload': false,
    'Address Proof (optional)': false
  });

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);
  
  const handleDocumentUpload = (docName) => {
    // Simulate an upload delay
    setTimeout(() => {
      setDocuments(prev => ({ ...prev, [docName]: true }));
    }, 600);
  };

  const requiredDocumentsUploaded = documents['Aadhaar Card Upload'] && documents['PAN Card Upload'] && documents['Selfie Photo Upload'];

  const handleSubmit = () => {
    if (!requiredDocumentsUploaded) return; // Guard clause
    
    // Placeholder submit function for backend integration
    const payload = { ...formData, documents };
    console.log("Mock API Request: createAccount", payload);
    
    setStep(4); // Success step
  };

  return (
    <div className="bg-white rounded-3xl w-full max-w-2xl mx-auto shadow-sm border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-3">
            <div className="bg-indigo-100 text-indigo-600 p-2.5 rounded-xl">
              <Landmark size={22} />
            </div>
            <div>
               <h2 className="text-xl font-black text-slate-900 leading-tight">Open Bank Account</h2>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Digital Onboarding</p>
            </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:bg-slate-200 hover:text-slate-700 p-2 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Progress Indicator */}
      {step < 4 && (
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4">
          <div className="flex items-center justify-between relative">
             <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 rounded-full z-0"></div>
             <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-500 rounded-full z-0 transition-all duration-500" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
             
             <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-slate-50 transition-colors ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
             <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-slate-50 transition-colors ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
             <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-slate-50 transition-colors ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>3</div>
          </div>
          <div className="flex justify-between mt-2">
             <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= 1 ? 'text-indigo-700' : 'text-slate-400'}`}>Basic Info</span>
             <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= 2 ? 'text-indigo-700' : 'text-slate-400'}`}>KYC</span>
             <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= 3 ? 'text-indigo-700' : 'text-slate-400'}`}>Documents</span>
          </div>
        </div>
      )}

      {/* Body Content */}
      <div className="p-6 md:p-8">
        
        {step === 1 && (
          <div className="space-y-5 animate-in slide-in-from-right-4">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
               <User className="text-indigo-500" size={18}/> Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input 
                  type="text" 
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all font-medium text-slate-800"
                  placeholder="John Doe"
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date of Birth</label>
                  <input 
                  type="date" 
                  value={formData.dob}
                  onChange={(e) => setFormData({...formData, dob: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all font-medium text-slate-800"
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mobile Number</label>
                  <input 
                  type="tel" 
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all font-medium text-slate-800"
                  placeholder="+91 98765 43210"
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all font-medium text-slate-800"
                  placeholder="john@example.com"
                  />
               </div>
               <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Residential Address</label>
                  <textarea 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all font-medium text-slate-800 min-h-[100px] resize-none"
                  placeholder="123 Fintech Avenue, Tech City..."
                  />
               </div>
            </div>
            
            <div className="mt-8 flex justify-end">
               <button 
               onClick={handleNext}
               disabled={!formData.fullName || !formData.mobile || !formData.address}
               className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-xl transition-colors flex items-center gap-2"
               >
               Next Step
               </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-in slide-in-from-right-4">
             <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
               <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
               KYC Verification
             </h3>
             <p className="text-sm text-slate-500 mb-6">Enter your government-issued ID numbers for mandatory regulatory compliance verification.</p>
             
             <div className="space-y-5">
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">PAN Number</label>
                  <input 
                  type="text" 
                  value={formData.panNumber}
                  onChange={(e) => setFormData({...formData, panNumber: e.target.value.toUpperCase()})}
                  maxLength={10}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all font-bold text-slate-800 tracking-widest placeholder:font-normal placeholder:tracking-normal"
                  placeholder="ABCDE1234F"
                  />
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">Standard 10-character alphanumeric PAN</p>
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Aadhaar Number</label>
                  <input 
                  type="text" 
                  value={formData.aadhaarNumber}
                  onChange={(e) => setFormData({...formData, aadhaarNumber: e.target.value.replace(/\D/g, '')})}
                  maxLength={12}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all font-bold text-slate-800 tracking-widest placeholder:font-normal placeholder:tracking-normal"
                  placeholder="xxxx xxxx xxxx"
                  />
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">12-digit UIDAI issued number</p>
               </div>
             </div>

            <div className="flex gap-4 mt-8">
               <button 
               onClick={handleBack}
               className="flex-1 bg-slate-100 hover:bg-slate-200 py-3 rounded-xl text-slate-700 font-bold transition-colors"
               >
                 Back
               </button>
               <button 
               onClick={handleNext}
               disabled={formData.panNumber.length < 10 || formData.aadhaarNumber.length < 12}
               className="flex-[2] bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed py-3 rounded-xl text-white font-bold transition-all disabled:opacity-70"
               >
                 Verify KYC & Next
               </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5 animate-in slide-in-from-right-4">
             <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
               <FileText className="text-indigo-500" size={18}/> Document Upload
             </h3>
             <p className="text-sm text-slate-500 mb-6">Please provide scans or snapshots of the following documents to finalize your digital onboarding.</p>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {Object.keys(documents).map((doc) => {
                  const isUploaded = documents[doc];
                  const isOptional = doc.includes('optional');
                  
                  return (
                    <div 
                      key={doc} 
                      onClick={() => !isUploaded && handleDocumentUpload(doc)}
                      className={`border-2 border-dashed rounded-xl p-4 flex flex-col justify-center transition-all ${
                        isUploaded 
                          ? 'border-emerald-500 bg-emerald-50/50 cursor-default' 
                          : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer group'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-bold text-sm ${isUploaded ? 'text-emerald-800' : 'text-slate-700 group-hover:text-indigo-700'}`}>
                          {doc}
                        </span>
                        {isUploaded ? (
                           <CheckCircle2 size={20} className="text-emerald-500" />
                        ) : (
                          // Determine icon based on document name
                          doc.includes('Selfie') ? <Camera size={18} className="text-slate-400 group-hover:text-indigo-500" /> :
                           <Upload size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                        )}
                      </div>
                      <div className="flex items-center">
                         <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                           isUploaded ? 'bg-emerald-200 text-emerald-800' : isOptional ? 'bg-slate-100 text-slate-500' : 'bg-rose-100 text-rose-600'
                         }`}>
                           {isUploaded ? 'Uploaded ✓' : isOptional ? 'Optional' : 'Required ⚠'}
                         </span>
                      </div>
                    </div>
                  );
               })}
             </div>

             {!requiredDocumentsUploaded && (
               <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-start gap-2 mt-4">
                 <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={16} />
                 <p className="text-xs font-semibold text-rose-700">Please upload all required KYC documents before processing the application.</p>
               </div>
             )}

            <div className="flex gap-4 mt-8">
               <button 
               onClick={handleBack}
               className="flex-1 bg-slate-100 hover:bg-slate-200 py-3 rounded-xl text-slate-700 font-bold transition-colors"
               >
                 Back
               </button>
               <button 
               onClick={handleSubmit}
               disabled={!requiredDocumentsUploaded}
               className="flex-[2] bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed py-3 rounded-xl text-white font-bold transition-all disabled:opacity-70 shadow-sm"
               >
                 Submit Application
               </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-10 animate-in zoom-in-95">
            <div className="mx-auto w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 relative">
               <div className="absolute inset-0 bg-emerald-200 rounded-full animate-ping opacity-20"></div>
               <CheckCircle2 size={48} className="text-emerald-600 drop-shadow-sm relative z-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Application Submitted Successfully</h2>
            <p className="text-slate-600 max-w-sm mx-auto leading-relaxed">
              Your bank account application has been submitted successfully. The bank will review your KYC documents and notify you once the account is approved.
            </p>
            
            <button 
              onClick={onClose}
              className="mt-8 bg-slate-900 hover:bg-slate-800 py-3 px-8 rounded-xl text-white font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Return to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default AccountCreationForm;
