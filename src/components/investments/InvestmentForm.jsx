import React, { useState } from 'react';
import { Plus, Briefcase, IndianRupee, Info } from 'lucide-react';

const InvestmentForm = ({ onAddInvestment }) => {
  const [formData, setFormData] = useState({
    type: 'Mutual Fund',
    amount: '',
    notes: ''
  });

  const types = ['Mutual Fund', 'Stocks', 'Crypto', 'Fixed Deposit', 'Gold', 'Other'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount) return;
    onAddInvestment(formData);
    setFormData({ type: 'Mutual Fund', amount: '', notes: '' });
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
        <plus className="text-blue-500" size={20} />
        Add Asset
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Asset Type</label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none text-slate-700 font-medium"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Investment Amount</label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="number"
              placeholder="0.00"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-700 font-bold"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Notes (Optional)</label>
          <div className="relative">
            <Info className="absolute left-3 top-3 text-slate-400" size={16} />
            <textarea
              placeholder="Portfolio details, platform name, etc."
              rows="2"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-700 text-sm"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Log Investment
        </button>
      </form>
    </div>
  );
};

export default InvestmentForm;
