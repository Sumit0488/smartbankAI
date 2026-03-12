import React from 'react';
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

const BankProsCons = ({ b1, b2 }) => {
  return (
    <>
      {/* SECTION 6: Pros and Cons Section */}
      <h2 className="text-xl font-extrabold text-slate-800 mt-10 mb-6 flex items-center gap-2">
         <ShieldCheck className="text-indigo-500" size={24} /> Pros & Cons
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         
         {/* Bank 1 Pros / Cons */}
         <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-100 font-bold text-slate-800 text-center">
               {b1.name}
            </div>
            <div className="p-6 space-y-6">
               <div>
                  <h4 className="flex items-center gap-2 font-bold text-emerald-600 mb-3"><CheckCircle2 size={16}/> Pros</h4>
                  <ul className="space-y-2">
                     {b1.pros.map((pro, i) => (
                        <li key={i} className="text-sm font-medium text-slate-700 flex items-start gap-2">
                           <span className="text-emerald-500 mt-0.5">•</span> {pro}
                        </li>
                     ))}
                  </ul>
               </div>
               <div>
                  <h4 className="flex items-center gap-2 font-bold text-rose-600 mb-3"><XCircle size={16}/> Cons</h4>
                  <ul className="space-y-2">
                     {b1.cons.map((con, i) => (
                        <li key={i} className="text-sm font-medium text-slate-700 flex items-start gap-2">
                           <span className="text-rose-500 mt-0.5">•</span> {con}
                        </li>
                     ))}
                  </ul>
               </div>
            </div>
         </div>

         {/* Bank 2 Pros / Cons */}
         <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-100 font-bold text-slate-800 text-center">
               {b2.name}
            </div>
            <div className="p-6 space-y-6">
               <div>
                  <h4 className="flex items-center gap-2 font-bold text-emerald-600 mb-3"><CheckCircle2 size={16}/> Pros</h4>
                  <ul className="space-y-2">
                     {b2.pros.map((pro, i) => (
                        <li key={i} className="text-sm font-medium text-slate-700 flex items-start gap-2">
                           <span className="text-emerald-500 mt-0.5">•</span> {pro}
                        </li>
                     ))}
                  </ul>
               </div>
               <div>
                  <h4 className="flex items-center gap-2 font-bold text-rose-600 mb-3"><XCircle size={16}/> Cons</h4>
                  <ul className="space-y-2">
                     {b2.cons.map((con, i) => (
                        <li key={i} className="text-sm font-medium text-slate-700 flex items-start gap-2">
                           <span className="text-rose-500 mt-0.5">•</span> {con}
                        </li>
                     ))}
                  </ul>
               </div>
            </div>
         </div>

      </div>
    </>
  );
};

export default BankProsCons;
