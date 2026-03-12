import React, { useState, useEffect } from 'react';
import ExpenseForm from '../components/expenses/ExpenseForm';
import ExpenseList from '../components/expenses/ExpenseList';
import CategorySummary from '../components/expenses/CategorySummary';
import MonthlySpendingChart from '../components/expenses/MonthlySpendingChart';
import ExpenseAISuggestions from '../components/expenses/ExpenseAISuggestions';
import { getTransactions, createExpense, deleteExpense, getTransactionsByCategory } from '../services/transactionService';
import { PieChart, Loader2 } from 'lucide-react';

const ExpenseAnalyzer = () => {
  const [expenses, setExpenses] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const txRes = await getTransactions();
      const catRes = await getTransactionsByCategory();
      setExpenses(txRes.transactions);
      setCategoryData(catRes);
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddExpense = async (newExpense) => {
    const res = await createExpense(newExpense);
    if (res.success) {
      setExpenses([res.expense, ...expenses]);
      // Refresh category summary
      const catRes = await getTransactionsByCategory();
      setCategoryData(catRes);
    }
  };

  const handleDeleteExpense = async (id) => {
    const res = await deleteExpense(id);
    if (res.success) {
      setExpenses(expenses.filter(e => e.id !== id));
      // Refresh category summary
      const catRes = await getTransactionsByCategory();
      setCategoryData(catRes);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-slate-400">
        <Loader2 className="animate-spin mb-4 text-emerald-500" size={48} />
        <p className="font-medium animate-pulse">Analyzing your financial footprint...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-200">
              <PieChart className="text-white" size={24} />
            </div>
            Expense Analyzer
          </h1>
          <p className="text-slate-500 font-medium mt-1">Intelligent spending tracking & optimization</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available Balance</div>
            <div className="text-xl font-black text-slate-800">₹24,500.00</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center font-bold text-slate-500">
            S
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Forms & Summaries */}
        <div className="xl:col-span-1 space-y-6">
          <ExpenseForm onAddExpense={handleAddExpense} />
          <CategorySummary categoryData={categoryData} />
          <div className="hidden xl:block">
            <ExpenseAISuggestions transactions={expenses} />
          </div>
        </div>

        {/* Right Column: Charts & Lists */}
        <div className="xl:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
             <MonthlySpendingChart transactions={expenses} />
          </div>
          <div className="h-[500px]">
            <ExpenseList expenses={expenses} onDeleteExpense={handleDeleteExpense} />
          </div>
          <div className="xl:hidden">
            <ExpenseAISuggestions transactions={expenses} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseAnalyzer;
