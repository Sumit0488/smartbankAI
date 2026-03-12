import React from 'react';
import { Plane } from 'lucide-react';

const TransferComparisonMatrix = ({ INTERNATIONAL_TRANSFERS }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Plane className="text-emerald-500" size={20}/> International Transfer Comparison
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-700 border-b border-slate-200">
              <th className="p-4 font-bold">Bank Name</th>
              <th className="p-4 font-bold">Forex Markup</th>
              <th className="p-4 font-bold">Transfer Speed</th>
              <th className="p-4 font-bold">Special Benefits</th>
              <th className="p-4 font-bold">Recommendation</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {INTERNATIONAL_TRANSFERS.map((bank, idx) => (
              <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-black text-slate-900">{bank.bank}</td>
                <td className="p-4 text-slate-800 font-bold">{bank.markup}</td>
                <td className="p-4 font-bold text-emerald-600">{bank.time}</td>
                <td className="p-4 text-slate-600 font-medium">{bank.benefits}</td>
                <td className="p-4">
                   {bank.isCheapest ? (
                     <span className="bg-amber-100 text-amber-800 text-[11px] font-black uppercase tracking-wide px-2.5 py-1.5 rounded-md border border-amber-200 whitespace-nowrap">
                        Cheapest Transfer Option
                     </span>
                   ) : (
                     <span className="bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-md whitespace-nowrap">
                        Best for {bank.bestFor}
                     </span>
                   )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransferComparisonMatrix;
