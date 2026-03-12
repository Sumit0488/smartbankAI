import React, { useState } from 'react';
import { Target, Plus, CheckCircle2, ChevronRight, Award, Shield, Monitor } from 'lucide-react';
import { calculateGoalPlan } from '../../services/aiService';

const FinancialGoals = ({ goals: initialGoals }) => {
  const [goals, setGoals] = useState(initialGoals || []);
  const [isAdding, setIsAdding] = useState(false);
  
  const [newGoal, setNewGoal] = useState({ name: '', targetAmount: '', durationMonths: '', currentAmount: '' });

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.durationMonths) return;

    const g = {
      id: Date.now(),
      name: newGoal.name,
      targetAmount: Number(newGoal.targetAmount),
      durationMonths: Number(newGoal.durationMonths),
      currentAmount: Number(newGoal.currentAmount) || 0,
      icon: "target"
    };

    setGoals([...goals, g]);
    setNewGoal({ name: '', targetAmount: '', durationMonths: '', currentAmount: '' });
    setIsAdding(false);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'laptop': return <Monitor size={24} className="text-blue-500" />;
      case 'shield': return <Shield size={24} className="text-emerald-500" />;
      default: return <Target size={24} className="text-indigo-500" />;
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Award className="text-amber-500" size={20} /> Financial Goals
        </h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="text-sm font-semibold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1"
        >
          {isAdding ? "Cancel" : <><Plus size={16} /> Add Goal</>}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddGoal} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4 animate-in slide-in-from-top-2">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-slate-500 mb-1">Goal Name</label>
               <input required type="text" value={newGoal.name} onChange={e => setNewGoal({...newGoal, name: e.target.value})} placeholder="e.g. Dream Vacation" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 mb-1">Target Amount (₹)</label>
               <input required type="number" value={newGoal.targetAmount} onChange={e => setNewGoal({...newGoal, targetAmount: e.target.value})} placeholder="e.g. 50000" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 mb-1">Duration (Months)</label>
               <input required type="number" value={newGoal.durationMonths} onChange={e => setNewGoal({...newGoal, durationMonths: e.target.value})} placeholder="e.g. 12" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 mb-1">Current Saved (₹)</label>
               <input type="number" value={newGoal.currentAmount} onChange={e => setNewGoal({...newGoal, currentAmount: e.target.value})} placeholder="e.g. 5000" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
             </div>
           </div>
           <div className="flex justify-end">
             <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition">Save Goal</button>
           </div>
        </form>
      )}

      <div className="space-y-4 relative">
        {goals.map((goal) => {
           const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
           const isComplete = progress >= 100;
           const aiPlan = calculateGoalPlan(goal.targetAmount, goal.currentAmount, goal.durationMonths);

           return (
             <div key={goal.id} className="border border-slate-100 p-4 rounded-xl hover:border-indigo-100 transition-colors group relative overflow-hidden">
               {isComplete && <div className="absolute inset-0 bg-emerald-50/50 z-0 pointer-events-none" />}
               
               <div className="relative z-10">
                 <div className="flex justify-between items-start mb-3">
                   <div className="flex gap-3 items-center">
                     <div className="p-2 bg-slate-50 rounded-lg">
                       {getIcon(goal.icon)}
                     </div>
                     <div>
                       <h4 className="font-bold text-slate-800 flex items-center gap-2">
                         {goal.name}
                         {isComplete && <CheckCircle2 className="text-emerald-500" size={16} />}
                       </h4>
                       <p className="text-xs text-slate-500 font-medium">{goal.durationMonths} months left</p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="text-sm font-bold text-slate-800 font-mono">₹{goal.currentAmount.toLocaleString()} / ₹{goal.targetAmount.toLocaleString()}</p>
                     <p className="text-xs text-slate-400 font-medium mt-0.5">{progress.toFixed(1)}% achieved</p>
                   </div>
                 </div>

                 <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-4">
                   <div className={`h-full rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${progress}%` }} />
                 </div>

                 {!isComplete && (
                   <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-lg p-3 pt-2">
                     <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2">
                       <ChevronRight size={14} className="text-indigo-500"/> AI Investment Plan
                     </div>
                     <div className="text-sm text-slate-700 leading-relaxed" 
                          dangerouslySetInnerHTML={{ __html: aiPlan.planHtml }} />
                   </div>
                 )}
               </div>
             </div>
           );
        })}
        {goals.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">No financial goals set yet. Add one to get an AI saving plan!</p>
        )}
      </div>
    </div>
  );
};

export default FinancialGoals;
