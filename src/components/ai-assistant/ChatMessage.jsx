import React from 'react';
import { User, Bot } from 'lucide-react';

const ChatMessage = ({ msg, handleSend }) => {
  const isUser = msg.sender === 'user';
  
  return (
    <div className={`flex gap-4 max-w-[80%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>
      <div>
        <div className={`p-4 rounded-2xl whitespace-pre-wrap flex flex-col gap-1 ${isUser ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 shadow-sm rounded-tl-none'}`}>
          <span>{msg.text}</span>
          <span className={`text-[10px] font-medium mt-1 ${isUser ? 'text-indigo-200 text-right' : 'text-slate-400 text-left'}`}>
             {new Date(msg.id === 1 ? Date.now() : msg.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
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
      </div>
    </div>
  );
};

export default ChatMessage;
