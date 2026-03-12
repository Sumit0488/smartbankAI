import React from 'react';
import { Star, Check, X, Landmark, CreditCard, Briefcase, Award } from 'lucide-react';

const ComparisonTables = ({ b1, b2, needRecommendation }) => {
  return (
    <div className="space-y-8">
      {/* Section 1 Core Matrix */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
           <Landmark size={16} className="text-slate-400" /> Core Features
        </h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
           <div className="col-span-1 space-y-4 font-bold text-slate-500">
              <div className="h-10 flex items-center">Minimum Balance</div>
              <div className="h-10 flex items-center">Online Account Opening</div>
              <div className="h-10 flex items-center">Mobile App Rating</div>
              <div className="h-10 flex items-center">ATM Network</div>
           </div>
           <div className="col-span-1 space-y-4 font-semibold text-slate-800">
              <div className="h-10 flex items-center">{b1.minBalance === 0 ? '₹0' : `₹${b1.minBalance.toLocaleString()}`}</div>
              <div className="h-10 flex items-center">{b1.onlineOpening}</div>
              <div className="h-10 flex items-center flex gap-1"><Star size={14} className="text-amber-400 fill-amber-400"/> {b1.appRating}</div>
              <div className="h-10 flex items-center">{b1.atmNetwork}</div>
           </div>
           <div className="col-span-1 space-y-4 font-semibold text-slate-800">
              <div className="h-10 flex items-center">{b2.minBalance === 0 ? '₹0' : `₹${b2.minBalance.toLocaleString()}`}</div>
              <div className="h-10 flex items-center">{b2.onlineOpening}</div>
              <div className="h-10 flex items-center flex gap-1"><Star size={14} className="text-amber-400 fill-amber-400"/> {b2.appRating}</div>
              <div className="h-10 flex items-center">{b2.atmNetwork}</div>
           </div>
        </div>
      </div>

      {/* SECTION 2: Debit Card Features Comparison */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
           <CreditCard size={16} className="text-slate-400" /> Debit Card Comparison
        </h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
           <div className="col-span-1 space-y-4 font-bold text-slate-500">
              <div className="h-10 flex items-center">Card Name</div>
              <div className="h-10 flex items-center">Annual Card Fee</div>
              <div className="h-10 flex items-center">Daily ATM Limit</div>
              <div className="h-10 flex items-center">International Usage</div>
              <div className="h-10 flex items-center">Lounge Access</div>
              <div className="h-10 flex items-center">Cashback Offers</div>
           </div>
           <div className="col-span-1 space-y-4 font-semibold text-slate-800">
              <div className="h-10 flex items-center text-indigo-600">{b1.debitCard.name}</div>
              <div className="h-10 flex items-center">{b1.debitCard.fee}</div>
              <div className="h-10 flex items-center">{b1.debitCard.limit}</div>
              <div className="h-10 flex items-center">{b1.debitCard.intl}</div>
              <div className="h-10 flex items-center">{b1.debitCard.lounge}</div>
              <div className="h-10 flex items-center">{b1.debitCard.cashback}</div>
           </div>
           <div className="col-span-1 space-y-4 font-semibold text-slate-800">
              <div className="h-10 flex items-center text-indigo-600">{b2.debitCard.name}</div>
              <div className="h-10 flex items-center">{b2.debitCard.fee}</div>
              <div className="h-10 flex items-center">{b2.debitCard.limit}</div>
              <div className="h-10 flex items-center">{b2.debitCard.intl}</div>
              <div className="h-10 flex items-center">{b2.debitCard.lounge}</div>
              <div className="h-10 flex items-center">{b2.debitCard.cashback}</div>
           </div>
        </div>
      </div>

      {/* SECTION 7: Bank Services Comparison */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
           <Briefcase size={16} className="text-slate-400" /> Bank Services
        </h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
           <div className="col-span-1 space-y-4 font-bold text-slate-500">
              <div className="h-10 flex items-center">Loan Interest Rates</div>
              <div className="h-10 flex items-center">Credit Card Availability</div>
              <div className="h-10 flex items-center">Forex Services</div>
              <div className="h-10 flex items-center">International Transfers</div>
              <div className="h-10 flex items-center">Customer Support</div>
           </div>
           <div className="col-span-1 space-y-4 font-semibold text-slate-800">
              <div className="h-10 flex items-center">{b1.services.loans}</div>
              <div className="h-10 flex items-center">{b1.services.cc}</div>
              <div className="h-10 flex items-center">{b1.services.forex}</div>
              <div className="h-10 flex items-center">{b1.services.intlTransfers}</div>
              <div className="h-10 flex items-center">{b1.services.support}</div>
           </div>
           <div className="col-span-1 space-y-4 font-semibold text-slate-800">
              <div className="h-10 flex items-center">{b2.services.loans}</div>
              <div className="h-10 flex items-center">{b2.services.cc}</div>
              <div className="h-10 flex items-center">{b2.services.forex}</div>
              <div className="h-10 flex items-center">{b2.services.intlTransfers}</div>
              <div className="h-10 flex items-center">{b2.services.support}</div>
           </div>
        </div>
      </div>

      {/* SECTION 9: Financial Product Availability */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
           <Award size={16} className="text-slate-400" /> Financial Products
        </h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
           <div className="col-span-1 space-y-4 font-bold text-slate-500">
              <div className="h-10 flex items-center">Savings Account</div>
              <div className="h-10 flex items-center">Salary Account</div>
              <div className="h-10 flex items-center">Business Account</div>
              <div className="h-10 flex items-center">Loans</div>
              <div className="h-10 flex items-center">Credit Cards</div>
              <div className="h-10 flex items-center">Forex Cards</div>
           </div>
           <div className="col-span-1 space-y-4 font-semibold text-slate-800">
              {[b1.products.savings, b1.products.salary, b1.products.business, b1.products.loans, b1.products.cc, b1.products.forex].map((val, i) => (
                 <div key={i} className="h-10 flex items-center">
                    {val ? <Check size={18} className="text-emerald-500"/> : <X size={18} className="text-rose-500"/>}
                 </div>
              ))}
           </div>
           <div className="col-span-1 space-y-4 font-semibold text-slate-800">
              {[b2.products.savings, b2.products.salary, b2.products.business, b2.products.loans, b2.products.cc, b2.products.forex].map((val, i) => (
                 <div key={i} className="h-10 flex items-center">
                    {val ? <Check size={18} className="text-emerald-500"/> : <X size={18} className="text-rose-500"/>}
                 </div>
              ))}
           </div>
        </div>
      </div>

    </div>
  );
};

export default ComparisonTables;
