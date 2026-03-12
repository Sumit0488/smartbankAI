import React from 'react';
import { Sparkles, PlusCircle, Map, Landmark, CreditCard, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Actions that trigger navigation instead of chat messages
const NAV_ACTIONS = {
  'Compare Banks': '/banks',
  'Investments': '/investments',
  'Loan Advisor': '/loans',
};

const QuickActions = ({ actions, handleSend }) => {
  const navigate = useNavigate();

  const handleAction = (action) => {
    if (NAV_ACTIONS[action]) {
      navigate(NAV_ACTIONS[action]);
    } else {
      handleSend(action);
    }
  };

  return (
    <div className="px-4 pt-4 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {actions.map(action => (
        <button
          key={action}
          onClick={() => handleAction(action)}
          className="whitespace-nowrap px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium border border-transparent rounded-full transition-colors flex items-center gap-2"
        >
           {NAV_ACTIONS[action] ? <Map size={14} /> : <PlusCircle size={14} />}
           {action}
        </button>
      ))}
      <button
          onClick={() => handleSend("How are my investments today?")}
          className="whitespace-nowrap px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium border border-transparent rounded-full transition-colors flex items-center gap-2"
        >
           <Sparkles size={14} />
           How are my investments today?
      </button>
    </div>
  );
};

export default QuickActions;
