import React from 'react';
import { Trash2, ShoppingBag, Utensils, Bus, Play, Settings, CreditCard, AlertCircle } from 'lucide-react';
// import from framer-motion;

const getCategoryIcon = (category) => {
  switch (category?.toLowerCase()) {
    case 'food': return <Utensils size={18} className="text-orange-500" />;
    case 'shopping': return <ShoppingBag size={18} className="text-blue-500" />;
    case 'travel': return <Bus size={18} className="text-purple-500" />;
    case 'entertainment': return <Play size={18} className="text-pink-500" />;
    case 'utilities': return <Settings size={18} className="text-amber-500" />;
    default: return <CreditCard size={18} className="text-slate-500" />;
  }
};

const ExpenseList = ({ expenses, onDeleteExpense }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <h3 className="text-lg font-semibold text-slate-800">Recent Transactions</h3>
        <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full">
          {expenses.length} Records
        </span>
      </div>

      <div className="overflow-y-auto grow custom-scrollbar">
        {expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="text-slate-300" size={32} />
            </div>
            <h4 className="text-slate-700 font-medium mb-1">No transactions found</h4>
            <p className="text-slate-400 text-sm max-w-xs">Start adding your daily expenses to see them listed here.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="text-xs font-semibold text-slate-500 uppercase bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-6 py-3">Transaction</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode="popLayout">
                {expenses.map((tx) => (
                  <motion.tr
                    key={tx.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700 group-hover:text-emerald-600 transition-colors">{tx.description}</span>
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shadow-sm border border-white">
                          {getCategoryIcon(tx.category)}
                        </div>
                        <span className="text-xs font-medium text-slate-600">{tx.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-bold ${tx.amount < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {tx.amount < 0 ? '-' : '+'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => onDeleteExpense(tx.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Delete record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ExpenseList;
