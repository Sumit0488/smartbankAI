import React, { useState, useEffect } from 'react';
import { Briefcase, TrendingUp, Receipt, CreditCard, Globe, Activity, Loader2, ArrowRight } from 'lucide-react';
import { getUserActivity } from '../../services/notificationService';

const TYPE_META = {
  LOAN:       { icon: Briefcase,  color: 'text-blue-500',    bg: 'bg-blue-100 dark:bg-blue-900/40',    label: 'Loan Applied' },
  INVESTMENT: { icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/40', label: 'Investment' },
  EXPENSE:    { icon: Receipt,    color: 'text-amber-500',   bg: 'bg-amber-100 dark:bg-amber-900/40',  label: 'Expense Added' },
  CARD:       { icon: CreditCard, color: 'text-violet-500',  bg: 'bg-violet-100 dark:bg-violet-900/40', label: 'Card Applied' },
  FOREX:      { icon: Globe,      color: 'text-cyan-500',    bg: 'bg-cyan-100 dark:bg-cyan-900/40',    label: 'Forex Transfer' },
};

function timeAgo(isoDate) {
  if (!isoDate) return '';
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserActivity()
      .then(data => setActivities(data || []))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl">
            <Activity size={16} className="text-slate-500 dark:text-slate-400" />
          </div>
          <h3 className="font-black text-slate-800 dark:text-slate-100">Recent Activity</h3>
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last 10 Actions</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-slate-400">
          <Loader2 className="animate-spin mr-2" size={20} />
          <span className="text-sm font-semibold animate-pulse">Loading activity...</span>
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-10 text-slate-400 dark:text-slate-500">
          <Activity size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm font-semibold">No activity yet</p>
          <p className="text-xs mt-1">Apply for a loan, make an investment, or add expenses to see activity here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((item, i) => {
            const meta = TYPE_META[item.type] || TYPE_META.EXPENSE;
            const Icon = meta.icon;
            return (
              <div key={item.id || i} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                <div className={`p-2.5 ${meta.bg} rounded-xl flex-shrink-0`}>
                  <Icon size={15} className={meta.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{item.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {item.amount != null && (
                    <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                      ₹{Number(item.amount).toLocaleString('en-IN')}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">{timeAgo(item.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
