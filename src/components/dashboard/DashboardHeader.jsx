import React from 'react';
import { Sparkles, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardHeader = ({ userProfile }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between gap-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Welcome back, Alex!</h1>
        <p className="text-slate-500 mt-1">Here is your AI-powered financial overview.</p>
      </div>
      
      {/* AI Notification Block */}
      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-start gap-4 shadow-sm md:max-w-md w-full relative overflow-hidden">
         <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100/50 rounded-full blur-2xl -z-0" />
         <div className="bg-indigo-600 p-2 rounded-xl text-white shrink-0 shadow-md relative z-10">
            <Sparkles size={20} />
         </div>
         <div className="relative z-10 w-full space-y-3">
            <div>
              <p className="text-xs font-bold text-indigo-500 mb-0.5 uppercase tracking-wider flex justify-between">
                <span>AI Daily Insight</span>
                <span className="text-[10px] bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded">New</span>
              </p>
              <p className="text-sm font-medium text-slate-800 leading-tight">Your recent food expenses are $40 higher than usual. Consider transferring the difference to your Emergency Fund today.</p>
            </div>
            
            {userProfile.activeLoan && (
              <div className="pt-3 border-t border-indigo-200/50 flex gap-2 items-start mt-2">
                 <Bell className="text-amber-500 shrink-0 mt-0.5" size={16} />
                 <div className="flex-1">
                   <p className="text-xs font-bold text-amber-600 mb-0.5 uppercase tracking-wider">Smart Alert</p>
                   <p className="text-xs font-medium text-slate-700">Upcoming EMI of <strong className="text-slate-900">₹{userProfile.activeLoan.emi.toLocaleString()}</strong> for your {userProfile.activeLoan.type} is due on <span className="text-slate-900 font-bold">{userProfile.activeLoan.nextPaymentDate}</span>.</p>
                 </div>
                 <Link to="/loans" className="shrink-0 bg-white border border-indigo-100 text-indigo-600 text-xs font-bold px-2 py-1 rounded shadow-sm hover:bg-indigo-50">Manage</Link>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
