import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, X, Send, Sparkles, Image as ImageIcon, 
  MapPin, HelpCircle, ChevronRight, ArrowRight, Zap,
  TrendingUp, CreditCard, Landmark, Globe, HandCoins, PieChart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { callGroqAPI } from '../../services/aiService';

const QUICK_ACTIONS = [
  { label: 'Check Balance', icon: <Landmark size={14} />, command: 'What is my current balance and financial health?' },
  { label: 'Card Advisor', icon: <CreditCard size={14} />, command: '/cards' },
  { label: 'Forex Transfer', icon: <Globe size={14} />, command: '/forex' },
  { label: 'Expense Analysis', icon: <PieChart size={14} />, command: '/expenses' },
];

const ROUTE_MAP = {
  'forex-card': '/cards?type=forex',
  'debit-card': '/cards?type=debit',
  'credit-card': '/cards?type=credit',
  'banks': '/banks',
  'investments': '/investments',
  'loans': '/loans',
  'account-guide': '/account-guide',
  'forex-transfer': '/forex'
};

const GlobalFloatingAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm your SmartBank AI Assistant. How can I help you today?", sender: 'ai', time: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = (text = input) => {
    if (!text.trim()) return;

    const newUserMessage = { id: Date.now(), text, sender: 'user', time: new Date() };
    const currentHistory = [
      ...messages.map(m => ({ sender: m.sender, text: m.text })),
      { sender: 'user', text }
    ];

    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setIsTyping(true);

    callGroqAPI(currentHistory, null, true)
      .then(response => {
        processResponse(response);
      })
      .catch(err => {
        console.error("Assistant Error:", err);
        setMessages(prev => [...prev, { 
          id: Date.now(), 
          text: "Assistant temporarily unavailable. Please try again.", 
          sender: 'ai', 
          time: new Date() 
        }]);
        setIsTyping(false);
      });
  };

  const handleQuickAction = (action) => {
    // If command starts with '/', treat it as a route navigation
    if (action.command.startsWith('/')) {
      navigate(action.command);
      setIsOpen(false);
    } else {
      handleSend(action.command);
    }
  };

  const processResponse = (fullText) => {
    let text = fullText;
    let action = null;

    // Parse Suggestion and Target
    const suggestionMatch = text.match(/\[SUGGESTION: (.*?)\]/);
    const targetMatch = text.match(/\[TARGET: (.*?)\]/);

    if (suggestionMatch && targetMatch) {
      const promptText = suggestionMatch[1];
      const targetName = targetMatch[1];
      
      // Clean up text by removing tags
      text = text.replace(/\[SUGGESTION: .*?\]/, '').replace(/\[TARGET: .*?\]/, '').trim();
      
      action = {
        label: promptText,
        target: ROUTE_MAP[targetName] || '/dashboard'
      };
    }

    setMessages(prev => [...prev, { 
      id: Date.now(), 
      text, 
      sender: 'ai', 
      time: new Date(),
      action
    }]);
    setIsTyping(false);
  };

  const handleImageUpload = () => {
    const newUserMessage = { id: Date.now(), text: "[Attached Financial Document Image]", sender: 'user', time: new Date(), isImage: true };
    setMessages(prev => [...prev, newUserMessage]);
    setIsTyping(true);
    
    // Simulate image analysis by asking the AI about a placeholder document
    const imageAnalysisPrompt = "I've uploaded an image of a bank offer/statement. Please explain what I should look for in such documents in simple terms.";
    
    const chatHistory = [
      ...messages.map(m => ({ sender: m.sender, text: m.text })),
      { sender: 'user', text: imageAnalysisPrompt }
    ];

    callGroqAPI(chatHistory, null, true)
      .then(response => {
        processResponse(response);
      })
      .catch(err => {
        setIsTyping(false);
      });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Chat Panel */}
      {isOpen && (
        <div className="mb-4 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300 h-[500px]">
          {/* Header */}
          <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-none mb-1">SmartBank Assistant</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Always Active</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  m.sender === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-md' 
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'
                }`}>
                  {m.isImage && (
                    <div className="mb-2 bg-slate-100 rounded-xl p-8 flex flex-col items-center justify-center border-2 border-dashed border-slate-200">
                       <ImageIcon size={32} className="text-slate-300" />
                       <span className="text-[10px] font-bold text-slate-400 uppercase mt-2">Image Attached</span>
                    </div>
                  )}
                  <p className="font-medium leading-relaxed">{m.text}</p>
                  
                  {m.action && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
                       <p className="text-[11px] font-bold text-slate-500 italic">{m.action.label}</p>
                       <div className="flex gap-2">
                          <button 
                            onClick={() => { navigate(m.action.target); setIsOpen(false); }}
                            className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-black shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
                          >
                             Yes, Show Me <ArrowRight size={14} />
                          </button>
                          <button 
                            onClick={() => handleSend("Tell me more about it.")}
                            className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                          >
                             Just Explain
                          </button>
                       </div>
                    </div>
                  )}

                  <p className={`text-[10px] mt-1.5 font-bold uppercase opacity-50 ${m.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {m.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-100" />
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-2 bg-white flex gap-2 overflow-x-auto border-t border-slate-100">
            {QUICK_ACTIONS.map(action => (
              <button 
                key={action.label}
                onClick={() => handleQuickAction(action)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-tight text-slate-600 transition-colors whitespace-nowrap"
              >
                {action.icon} {action.label}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100">
            <div className="flex items-center gap-2 bg-slate-100 rounded-2xl p-2 border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white transition-all">
              <button 
                onClick={handleImageUpload}
                className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                title="Upload image for analysis"
              >
                <ImageIcon size={20} />
              </button>
              <input 
                type="text" 
                placeholder="Ask anything..."
                className="flex-1 bg-transparent py-2 outline-none text-sm font-medium text-slate-800"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={() => handleSend()}
                className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50"
                disabled={!input.trim()}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-[1.75rem] flex items-center justify-center shadow-2xl transition-all duration-500 transform ${isOpen ? 'bg-slate-900 border-2 border-white/20' : 'bg-indigo-600 hover:scale-110 hover:shadow-indigo-300'}`}
      >
        {isOpen ? (
          <X className="text-white" size={32} />
        ) : (
          <div className="relative">
            <MessageSquare className="text-white" size={32} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-indigo-600 rounded-full animate-pulse" />
          </div>
        )}
      </button>

    </div>
  );
};

export default GlobalFloatingAssistant;
