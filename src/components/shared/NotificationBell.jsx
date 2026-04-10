import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCheck, Briefcase, TrendingUp, Receipt, CreditCard, Globe, Info } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { markAllAsRead, markAsRead } from '../../services/notificationService';

const TYPE_META = {
  LOAN:       { icon: Briefcase,  color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/30' },
  INVESTMENT: { icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
  EXPENSE:    { icon: Receipt,    color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-900/30' },
  CARD:       { icon: CreditCard, color: 'text-violet-500',  bg: 'bg-violet-50 dark:bg-violet-900/30' },
  FOREX:      { icon: Globe,      color: 'text-cyan-500',    bg: 'bg-cyan-50 dark:bg-cyan-900/30' },
  SYSTEM:     { icon: Info,       color: 'text-slate-500',   bg: 'bg-slate-50 dark:bg-slate-700' },
  OTP:        { icon: Info,       color: 'text-indigo-500',  bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
};

function timeAgo(isoDate) {
  if (!isoDate) return '';
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const NotificationBell = () => {
  const { notifications, setNotifications, unreadCount } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAll = async () => {
    await markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleMarkOne = async (notifId) => {
    await markAsRead(notifId);
    setNotifications(prev => prev.map(n => n.notificationId === notifId ? { ...n, read: true } : n));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-all"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-slate-500 dark:text-slate-400" />
              <span className="font-black text-slate-700 dark:text-slate-200 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-black bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700">
            {notifications.length === 0 ? (
              <div className="text-center py-10 text-slate-400 dark:text-slate-500">
                <Bell size={28} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const meta = TYPE_META[n.type] || TYPE_META.SYSTEM;
                const Icon = meta.icon;
                return (
                  <button
                    key={n.notificationId || n.id}
                    onClick={() => handleMarkOne(n.notificationId)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${!n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                  >
                    <div className={`p-2 ${meta.bg} rounded-xl flex-shrink-0 mt-0.5`}>
                      <Icon size={14} className={meta.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-bold truncate ${!n.read ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>
                          {n.title}
                        </p>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
