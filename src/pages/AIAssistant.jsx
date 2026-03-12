import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, User, Bot, Globe, Mic, MicOff, Send, PlusCircle } from 'lucide-react';
import AccountCreationForm from '../components/shared/AccountCreationForm';
import { callGroqAPI } from '../services/aiService';
import ProfileSelectionModal from '../components/ai-assistant/ProfileSelectionModal';
import ChatInputArea from '../components/ai-assistant/ChatInputArea';
import QuickActions from '../components/ai-assistant/QuickActions';
import ChatMessage from '../components/ai-assistant/ChatMessage';
import TypingIndicator from '../components/ai-assistant/TypingIndicator';

const quickActions = [
  "Open Bank Account",
  "Analyze Expenses",
  "Investment Advice",
  "Savings Plan",
  "Compare Banks"
];


const AIAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Extension Settings
  const [profileType, setProfileType] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState('en-IN');
  const [showAccountModal, setShowAccountModal] = useState(false);
  
  // Student Bank Flow State
  const [studentBankFlowState, setStudentBankFlowState] = useState('idle');
  const [selectedBank, setSelectedBank] = useState(null);

  // Initialize Speech Recognition ONCE with useRef (avoiding stale closure per-render)
  const recognitionRef = useRef(null);
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const r = new SpeechRecognition();
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputVal(transcript);
      setIsListening(false);
    };
    r.onerror = () => setIsListening(false);
    r.onend = () => setIsListening(false);
    recognitionRef.current = r;
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.lang = language;
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        alert("Your browser does not support Speech Recognition.");
      }
    }
  };

  useEffect(() => {
    const savedProfile = localStorage.getItem('smartBankProfile');
    if (savedProfile) {
      setProfileType(savedProfile);
    }
    
    // Always start by greeting
    setMessages([{ 
      id: 1, 
      sender: 'ai', 
      text: "Hi, I am SmartBank AI 👋\nYour personal financial assistant.\n\nI can help you with:\n\n• Opening a bank account\n• Analyzing expenses\n• Investment advice\n• Creating savings plans\n• Comparing banks\n\nPlease choose one of the options below to get started." 
    }]);
  }, []);

  const handleProfileSelect = (type) => {
    localStorage.setItem('smartBankProfile', type);
    setProfileType(type);
    setShowProfileModal(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const generateAIResponse = async (userText, currentMessages) => {
    const text = userText.toLowerCase();
    setIsTyping(true);
    
    try {
      let reply = "I can certainly help with that! Do you need help with anything else?";
      let optionsList = null;

      // 0. Hard Action Switches - Always interrupt and switch immediately
      if (text === "analyze expenses" || text.includes("analyze expenses")) {
         reply = "Sure, I can help analyze your expenses.\n\nPlease enter your approximate monthly spending in categories like:\n\n• Food\n• Travel\n• Shopping\n• Rent\n• Entertainment\n\nExample:\nFood: ₹3000\nTravel: ₹1000\nShopping: ₹2000";
         setStudentBankFlowState('asking_expenses');
         setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: reply, optionsList }]);
         setIsTyping(false);
         return;
      }
      
      if (text === "investment advice" || text.includes("investment advice")) {
         reply = "What type of investment are you interested in?";
         optionsList = ["Stocks", "Mutual Funds", "Fixed Deposits", "SIP Investment"];
         setStudentBankFlowState('asking_invest_type');
         setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: reply, optionsList }]);
         setIsTyping(false);
         return;
      }
      
      if (text === "open bank account" || (text.includes("open") && text.includes("bank")) || text.includes("create account")) {
         setShowAccountModal(true);
         setIsTyping(false);
         return;
      }

      // 1. Detect Interruption Questions First
      let isQuestion = text.includes("?") || text.startsWith("is ") || text.startsWith("does ") || text.startsWith("what ") || text.startsWith("how ") || text.includes("safe") || text.includes("charges") || text.includes("question") || text.includes("help") || text.includes("tell me");

      if (text.includes("how are my investments") || text.includes("how much pocket money")) {
          isQuestion = false;
      }

      const isWorkflowPrompt = text === "savings plan" || text === "compare banks";
      if (isWorkflowPrompt) isQuestion = false;

      if (isQuestion) {
         let answer = await callGroqAPI(currentMessages, profileType);

         if (studentBankFlowState === 'choosing_bank') {
            reply = answer + "\n\nWould you like to continue? Which bank would you like to choose?";
         } else if (studentBankFlowState === 'confirming_bank') {
            reply = answer + `\n\nWould you like to create an account with ${selectedBank}?`;
         } else if (studentBankFlowState === 'asking_income') {
            reply = answer + "\n\nHow much pocket money do you receive monthly?";
         } else if (studentBankFlowState === 'asking_account_status') {
            reply = answer + "\n\nDo you already have a bank account with us or would you like to create a new one?";
         } else {
            reply = answer;
         }
         
         setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: reply, optionsList }]);
         setIsTyping(false);
         return;
      }

      // 2. Handle State Machine (Workflow)
      if (studentBankFlowState === 'asking_account_status') {
         if (text.includes("login") || text.includes("already have") || text.includes("existing")) {
             reply = "Please enter your account number.";
             setStudentBankFlowState('login_account_num');
         } else if (text.includes("create") || text.includes("new")) {
             if (!profileType) {
                reply = "Great! To give you the best recommendations, could you tell me your profession? Are you a Student, Working Professional, or Self Employed?";
                setStudentBankFlowState('asking_profession');
             } else if (profileType === 'Student') {
                reply = "Since you are a student, I will help you find the best student bank account.\n\nHow much pocket money do you receive monthly?";
                setStudentBankFlowState('asking_income');
             } else {
                reply = `Since you are a ${profileType}, I can help you open an appropriate bank account right now. Opening the secure account creation form for you...`;
                setShowAccountModal(true);
                setStudentBankFlowState('idle');
             }
         } else {
             reply = "Do you already have a bank account with us or would you like to create a new one?";
         }
         setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: reply, optionsList }]);
         setIsTyping(false);
         return;
      }
      else if (studentBankFlowState === 'asking_profession') {
          if (text.includes("1") || text.includes("student")) {
              setProfileType("Student"); localStorage.setItem('smartBankProfile', "Student");
              reply = "Got it, you are a Student! I will help you find the best student bank account.\n\nHow much pocket money do you receive monthly?";
              setStudentBankFlowState('asking_income');
          } else if (text.includes("2") || text.includes("working") || text.includes("professional") || text.includes("employee")) {
              setProfileType("Working Professional"); localStorage.setItem('smartBankProfile', "Working Professional");
              reply = "Got it! As a Working Professional, I can help you open a premium bank account right now.\n\nWhat is your monthly salary range?";
              setStudentBankFlowState('asking_wp_income');
          } else if (text.includes("3") || text.includes("self") || text.includes("business")) {
              setProfileType("Self Employed"); localStorage.setItem('smartBankProfile', "Self Employed");
              reply = "Got it! As a Self Employed individual, I can help you open a business-friendly bank account.\n\nWhat is your approximate monthly income?";
              setStudentBankFlowState('asking_se_income');
          } else if (text.includes("4") || text.includes("other")) {
              setProfileType("Other"); localStorage.setItem('smartBankProfile', "Other");
              reply = "Got it! Opening the secure account creation form...";
              setShowAccountModal(true); setStudentBankFlowState('idle');
          } else {
              reply = "Please let me know your profile (1. Student, 2. Working Professional, 3. Self-Employed, 4. Other).";
          }
          setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: reply, optionsList }]);
          setIsTyping(false);
          return;
      }
      else if (studentBankFlowState === 'asking_wp_income') {
         reply = "Thanks for sharing your salary details. A Salary Account or Premium Savings Account would be best.\n\nWhich bank would you like to open an account with?";
         optionsList = ["SBI", "HDFC", "ICICI", "Kotak", "Axis Bank", "Other"];
         setStudentBankFlowState('choosing_bank');
         setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: reply, optionsList }]);
         setIsTyping(false);
         return;
      }
      else if (studentBankFlowState === 'asking_se_income') {
         reply = "Thanks! A Current Account or Business Savings Account would be best.\n\nWhich bank would you like to open an account with?";
         optionsList = ["SBI", "HDFC", "ICICI", "Kotak", "Axis Bank", "Other"];
         setStudentBankFlowState('choosing_bank');
         setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: reply, optionsList }]);
         setIsTyping(false);
         return;
      }
      else if (studentBankFlowState === 'asking_expenses') {
         reply = "Thanks for sharing your expenses. I have analyzed your spending patterns. To get more detailed visual insights, click on the 'Expense Analyzer' tab on the sidebar.";
         setStudentBankFlowState('idle');
         setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: reply, optionsList }]);
         setIsTyping(false);
         return;
      }
      else if (studentBankFlowState === 'asking_invest_type') {
         reply = `Great choice! ${userText} are an excellent way to grow your wealth. Check out the Investments page for educational options and portfolio simulation.`;
         setStudentBankFlowState('idle');
         setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: reply, optionsList }]);
         setIsTyping(false);
         return;
      }
      else if (studentBankFlowState === 'login_account_num') {
         reply = "Enter your registered mobile number.";
         setStudentBankFlowState('login_mobile');
         setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: reply, optionsList }]);
         setIsTyping(false);
         return;
      }
      else if (studentBankFlowState === 'login_mobile') {
         reply = "Please enter OTP verification:";
         setStudentBankFlowState('login_otp');
         setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: reply, optionsList }]);
         setIsTyping(false);
         return;
      }
      else if (studentBankFlowState === 'login_otp') {
         reply = "Login successful. Welcome back to SmartBank.";
         setStudentBankFlowState('idle');
         setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: reply, optionsList }]);
         setIsTyping(false);
         return;
      }
      else if (studentBankFlowState === 'asking_income') {
        reply = "For students with low income, these accounts may be suitable:\n\n• SBI Student Account\n• Kotak 811 Zero Balance Account\n• HDFC DigiSave Youth Account\n\nWhich bank would you like to open an account with?";
        optionsList = ["SBI", "Kotak", "HDFC", "Other"];
        setStudentBankFlowState('choosing_bank');
        setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: reply, optionsList }]);
        setIsTyping(false);
        return;
      }
      else if (studentBankFlowState === 'choosing_bank') {
        let bankName = userText;
        if (text === "1" || text.includes("sbi")) bankName = "SBI";
        else if (text === "2" || text.includes("hdfc")) bankName = "HDFC";
        else if (text === "3" || text.includes("icici")) bankName = "ICICI";
        else if (text === "4" || text.includes("kotak")) bankName = "Kotak";
        else if (text === "5" || text.includes("axis")) bankName = "Axis Bank";
        setSelectedBank(bankName);
        reply = `Great choice. To open your account with ${bankName}, please provide your Basic Information:\n\n• Full Name\n• Date of Birth\n• Mobile Number\n• Email Address\n• Residential Address`;
        setStudentBankFlowState('asking_basic_info');
        setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: reply, optionsList }]);
        setIsTyping(false);
        return;
      }
      else if (studentBankFlowState === 'asking_basic_info') {
        reply = "Thank you. Now please provide your KYC Information:\n\n• PAN Number\n• Aadhaar Number\n\nThese are required for identity verification.";
        setStudentBankFlowState('asking_kyc_info');
        setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: reply, optionsList }]);
        setIsTyping(false);
        return;
      }
      else if (studentBankFlowState === 'asking_kyc_info') {
        reply = "Please upload the following documents:\n\n• Aadhaar Card\n• PAN Card\n• Selfie Photo\n• Address Proof\n\n(Type 'uploaded' to simulate uploading these documents)";
        optionsList = ["Uploaded"];
        setStudentBankFlowState('asking_document_upload');
        setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: reply, optionsList }]);
        setIsTyping(false);
        return;
      }
      else if (studentBankFlowState === 'asking_document_upload') {
        setStudentBankFlowState('verifying_documents');
        const verificationReply = "Aadhaar Card uploaded successfully ✔\nPAN Card uploaded successfully ✔\nSelfie verified ✔\n\nSubmitting your application...";
        setMessages(prev => [...prev, { id: Date.now()+1, sender: 'ai', text: verificationReply }]);
        setTimeout(() => {
           const currentBank = selectedBank || "the bank";
           const refId = Math.floor(10000 + Math.random() * 90000);
           const submissionReply = `Your bank account application has been successfully submitted to ${currentBank}.\n\nApplication Reference ID: SB-2026-${refId}\n\nThe bank will review your application and contact you shortly.`;
           setMessages(prev => [...prev, { id: Date.now()+2, sender: 'ai', text: submissionReply }]);
           setTimeout(() => {
              const nextStepsReply = "Next Steps:\n• Bank performs KYC verification\n• Documents are reviewed\n• Account is approved\n• Account becomes active\n\nLet me know if you need anything else!";
              setStudentBankFlowState('idle');
              setMessages(prev => [...prev, { id: Date.now()+3, sender: 'ai', text: nextStepsReply }]);
           }, 2000);
        }, 2000);
        setIsTyping(false);
        return; 
      }

      // 3. Detect Intents if Idle
      if (text.includes("login") && !text.includes("open")) {
         reply = "Please enter your account number.";
         setStudentBankFlowState('login_account_num');
      }
      else if (text.includes("investments today") || text.includes("my investments") || text.includes("portfolio update")) {
        try {
           const storedInvestments = JSON.parse(localStorage.getItem('smartBankInvestments') || '[]');
           if (storedInvestments.length === 0) {
             reply = "You don't have any tracked investments currently. You can add them from the Investments page!";
           } else {
             const totalInvested = storedInvestments.reduce((acc, curr) => acc + curr.investedAmount, 0);
             const currentValue = storedInvestments.reduce((acc, curr) => acc + curr.currentValue, 0);
             const todayProfit = currentValue - totalInvested;
             reply = `Today's portfolio update:\n\nTotal invested: ₹${totalInvested.toLocaleString()}\nCurrent value: ₹${currentValue.toLocaleString()}\nToday's profit: ${todayProfit >= 0 ? '+' : ''}₹${todayProfit.toLocaleString()}`;
           }
        } catch (e) {
           reply = "Sorry, I had trouble reading your portfolio data.";
        }
      }
      else if (text.includes("salary") || text.includes("save") || text.includes("savings plan")) {
        reply = "Based on a typical salary, here is a suggested allocation (50/30/20 rule):\n• 50% Needs\n• 30% Wants\n• 20% Savings\n\nConsider starting a mutual fund SIP.";
      } 
      else if (text.includes("investment advice")) {
         reply = "I recommend checking out the Investments page. For beginners, Index Funds and Fixed Deposits are a great starting point.";
      }
      else if (text.includes("compare bank")) {
         reply = "We offer a wide variety of accounts across major banks like SBI, HDFC, Kotak, and Canara depending on your profile type. Would you like to compare banks?";
      }
      else if (text.includes("expense")) {
         reply = "You can use the Expense Analyzer page from the sidebar to visualize your spending patterns and get AI insights.";
      } else {
         reply = await callGroqAPI(currentMessages, profileType);
      }
      
      setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: reply, optionsList }]);
    } catch (err) {
      console.error('[AIAssistant] generateAIResponse error:', err);
      setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: 'SmartBank Assistant is temporarily unavailable. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (text) => {
    if (!text.trim()) return;
    const newMsg = { id: Date.now(), sender: 'user', text };
    const newHistory = [...messages, newMsg];
    setMessages(newHistory);
    setInputVal('');
    generateAIResponse(text, newHistory);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      <ProfileSelectionModal 
        show={showProfileModal} 
        onSelect={handleProfileSelect} 
      />

      {/* Inline Account Creation Flow Form rendered logically below */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            AI Assistant <Sparkles className="text-indigo-500" size={24} />
          </h1>
          <p className="text-slate-500 mt-1">
            Your personal financial advisor 
            {profileType && <span className="ml-2 inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">{profileType}</span>}
          </p>
        </div>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden relative">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {showAccountModal ? (
             <div className="flex justify-center items-center h-full w-full py-4">
               <AccountCreationForm 
                  onClose={() => {
                     setShowAccountModal(false);
                     setStudentBankFlowState('idle');
                     setSelectedBank(null);
                  }} 
               />
             </div>
          ) : (
             <>
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} msg={msg} handleSend={handleSend} />
                ))}
                
                <TypingIndicator isTyping={isTyping} />
                <div ref={messagesEndRef} />
             </>
          )}
        </div>

        {/* Listening Indicator overlay */}
        {isListening && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-rose-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg animate-pulse z-10">
               <div className="w-2 h-2 bg-white rounded-full"></div>
               Listening...
            </div>
        )}

        <QuickActions actions={quickActions} handleSend={handleSend} />

        <ChatInputArea 
          inputVal={inputVal}
          setInputVal={setInputVal}
          handleSend={handleSend}
          isListening={isListening}
          toggleListen={toggleListen}
          isTyping={isTyping}
          language={language}
          setLanguage={setLanguage}
        />
      </div>
    </div>
  );
};

export default AIAssistant;
