import React from 'react';
import { User, Bot, CheckCircle2, Landmark, Clock } from 'lucide-react';

// ─── Account Recommendation Card ─────────────────────────────────────────────

const AccountCard = ({ card, onApply }) => {
  if (card.applied) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-1">
        <div className="flex items-center gap-2 text-emerald-700 font-black text-sm">
          <CheckCircle2 size={16} /> Application Submitted!
        </div>
        <p className="text-xs text-emerald-600 font-medium">{card.bankName} · {card.accountType}</p>
        <div className="flex items-center gap-1.5 mt-2">
          <Clock size={12} className="text-amber-500" />
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
            Application Status: Pending
          </span>
        </div>
        {card.applicationId && (
          <p className="text-[10px] text-slate-400 font-mono mt-1">Ref: {card.applicationId}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
          <Landmark size={16} className="text-indigo-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-800 truncate">{card.bankName}</p>
          <p className="text-[11px] text-indigo-600 font-bold">{card.accountType}</p>
        </div>
        {card.tag && (
          <span className="ml-auto shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wider">
            {card.tag}
          </span>
        )}
      </div>
      <div className="px-4 py-3 space-y-1.5">
        {card.benefits.map((b, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
            <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
            <span>{b}</span>
          </div>
        ))}
      </div>
      <div className="px-4 pb-4">
        <button
          onClick={() => onApply(card)}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-colors"
        >
          Apply Now
        </button>
      </div>
    </div>
  );
};

// ─── Main ChatMessage ─────────────────────────────────────────────────────────

const ChatMessage = ({ msg, handleSend, onApplyCard }) => {
  const isUser = msg.sender === 'user';

  return (
    <div className={`flex gap-4 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>

      <div className="min-w-0 flex-1">
        {/* Bubble */}
        <div className={`p-4 rounded-2xl whitespace-pre-wrap flex flex-col gap-1 ${isUser ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 shadow-sm rounded-tl-none'}`}>
          <span>{msg.text}</span>
          <span className={`text-[10px] font-medium mt-1 ${isUser ? 'text-indigo-200 text-right' : 'text-slate-400 text-left'}`}>
            {new Date(msg.id === 1 ? Date.now() : msg.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Option buttons */}
        {msg.optionsList && (
          <div className={`flex flex-wrap gap-2 mt-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {msg.optionsList.map(opt => (
              <button
                key={opt}
                onClick={() => handleSend(opt)}
                className="px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-full hover:bg-emerald-100 transition-colors border border-emerald-200 shadow-sm"
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Account recommendation cards */}
        {msg.accountCards && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {msg.accountCards.map((card) => (
              <AccountCard
                key={card.id}
                card={card}
                onApply={onApplyCard}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
