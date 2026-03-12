import React from 'react';
import { Send, Mic, MicOff, Globe } from 'lucide-react';

const ChatInputArea = ({
  inputVal,
  setInputVal,
  handleSend,
  isListening,
  toggleListen,
  isTyping,
  language,
  setLanguage
}) => {
  return (
    <div className="p-4 bg-white border-t border-slate-50">
      <div className="flex items-center gap-2 relative">
        <div className="flex items-center bg-slate-100 rounded-xl px-2 h-12">
           <Globe size={16} className="text-slate-400 mr-1 ml-2" />
           <select 
             value={language} 
             onChange={(e) => setLanguage(e.target.value)}
             className="bg-transparent border-none text-sm text-slate-600 focus:ring-0 outline-none p-1 cursor-pointer w-16"
           >
             <option value="en-IN">EN</option>
             <option value="kn-IN">KN</option>
           </select>
        </div>
        
        <button 
          className={`p-3 rounded-xl transition-colors shrink-0 ${isListening ? 'bg-rose-100 text-rose-600' : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'}`}
          title="Voice Input via Web Speech API"
          onClick={toggleListen}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        <input 
          type="text" 
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend(inputVal)}
          placeholder="Ask anything about personal finance..."
          className="flex-1 bg-slate-100 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400"
        />
        <button 
          onClick={() => handleSend(inputVal)}
          disabled={!inputVal.trim() || isTyping || isListening}
          className="p-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors shrink-0"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatInputArea;
