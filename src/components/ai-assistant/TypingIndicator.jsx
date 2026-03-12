import React from 'react';
import { Bot } from 'lucide-react';

const TypingIndicator = ({ isTyping }) => {
  if (!isTyping) return null;

  return (
    <div className="flex gap-4 max-w-[80%]">
      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
        <Bot size={18} />
      </div>
      <div className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-tl-none flex items-center gap-2">
        <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
      </div>
    </div>
  );
};

export default TypingIndicator;
