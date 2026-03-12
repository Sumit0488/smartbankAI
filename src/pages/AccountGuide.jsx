import React from 'react';
import { FileText, User, Briefcase, Building, Sparkles, CheckCircle2 } from 'lucide-react';

const GUIDE_DATA = [
  {
    type: 'Student',
    icon: <User size={24} className="text-indigo-500" />,
    color: 'indigo',
    sections: [
      {
        title: 'Identity Proof',
        items: ['Aadhaar Card', 'PAN Card']
      },
      {
        title: 'Address Proof',
        items: ['Aadhaar Card', 'Passport']
      },
      {
        title: 'Additional Documents',
        items: ['Student ID card', 'Passport size photographs']
      }
    ]
  },
  {
    type: 'Working Professional',
    icon: <Briefcase size={24} className="text-emerald-500" />,
    color: 'emerald',
    sections: [
      {
        title: 'Identity Proof',
        items: ['Aadhaar Card', 'PAN Card']
      },
      {
        title: 'Address Proof',
        items: ['Aadhaar Card', 'Passport', 'Utility bill']
      },
      {
        title: 'Employment Proof',
        items: ['Salary Slip', 'Employee ID card']
      }
    ]
  },
  {
    type: 'Self Employed',
    icon: <User size={24} className="text-amber-500" />,
    color: 'amber',
    sections: [
      {
        title: 'Identity Proof',
        items: ['Aadhaar Card', 'PAN Card']
      },
      {
        title: 'Business Proof',
        items: ['GST registration', 'Shop establishment certificate']
      },
      {
        title: 'Income Proof',
        items: ['Bank statements', 'ITR']
      }
    ]
  },
  {
    type: 'Business Owner',
    icon: <Building size={24} className="text-rose-500" />,
    color: 'rose',
    sections: [
      {
        title: 'Identity Proof (Proprietor/Directors)',
        items: ['Aadhaar Card', 'PAN Card']
      },
      {
        title: 'Business Entity Proof',
        items: ['Certificate of Incorporation', 'Partnership Deed', 'GST Certificate']
      },
      {
        title: 'Financial Documents',
        items: ['Audited Financial Statements', 'Board Resolution']
      }
    ]
  }
];

const AccountGuide = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2 mb-2">
          Bank Account Guide <FileText className="text-indigo-500" size={28} />
        </h1>
        <p className="text-slate-600">A complete guide to the documents required for opening a bank account based on your profile.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {GUIDE_DATA.map((profile, index) => (
          <div key={index} className={`bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-${profile.color}-300 transition-colors duration-300`}>
             <div className={`absolute top-0 right-0 w-32 h-32 bg-${profile.color}-50 rounded-bl-full -z-0 transition-transform group-hover:scale-110`} />
             
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                   <div className={`p-3 bg-${profile.color}-100 rounded-2xl`}>
                      {profile.icon}
                   </div>
                   <h2 className="text-xl font-bold text-slate-800">{profile.type} Account Documents</h2>
                </div>

                <div className="space-y-5">
                   {profile.sections.map((section, sIdx) => (
                      <div key={sIdx}>
                         <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">
                           {section.title}
                         </h3>
                         <ul className="space-y-2">
                            {section.items.map((item, iIdx) => (
                               <li key={iIdx} className="flex items-center gap-2 text-slate-700 font-medium text-sm border border-slate-100 bg-slate-50/50 p-2 rounded-lg">
                                 <CheckCircle2 size={16} className={`text-${profile.color}-500 shrink-0`} /> 
                                 {item}
                               </li>
                            ))}
                         </ul>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* AI Tips Section */}
      <div className="bg-indigo-600 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-6">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
         <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shrink-0">
           <Sparkles size={32} className="text-indigo-100" />
         </div>
         <div className="relative z-10 w-full space-y-4">
            <h3 className="text-xl font-bold mb-1">AI Opening Suggestions</h3>
            <div className="space-y-3">
               <div className="bg-indigo-700/50 border border-indigo-400 p-4 rounded-xl backdrop-blur-sm text-indigo-50">
                  <span className="font-bold text-white mr-2">Students:</span> 
                  Consider zero balance accounts like SBI Basic Savings or Kotak 811 to avoid non-maintenance penalties.
               </div>
               <div className="bg-indigo-700/50 border border-indigo-400 p-4 rounded-xl backdrop-blur-sm text-indigo-50">
                  <span className="font-bold text-white mr-2">Working Professionals:</span> 
                  Salary accounts from HDFC or Axis may offer better benefits, waived fees, and higher credit card limits.
               </div>
               <div className="bg-indigo-700/50 border border-indigo-400 p-4 rounded-xl backdrop-blur-sm text-indigo-50">
                  <span className="font-bold text-white mr-2">Business Owners:</span> 
                  A dedicated Current Account separates personal and business finances, making tax filing and GST reconciliation significantly easier.
               </div>
            </div>
         </div>
      </div>

    </div>
  );
};

export default AccountGuide;
